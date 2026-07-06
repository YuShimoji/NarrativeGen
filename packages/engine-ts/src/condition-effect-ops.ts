/**
 * Shared condition evaluation and effect application logic.
 * Used by session-ops.ts, index.ts, and browser.ts.
 */
import type {
  Condition,
  Effect,
  EntityDef,
  FlagState,
  Model,
  ResourceState,
  SessionState,
  VariableState,
} from './types'
import { createEventEntity } from './event-entity.js'
import type { CreateEventEffect } from './event-entity.js'
import { perceiveEntity } from './character-knowledge.js'

export function cmp(op: '>=' | '<=' | '>' | '<' | '==', a: number, b: number): boolean {
  switch (op) {
    case '>=':
      return a >= b
    case '<=':
      return a <= b
    case '>':
      return a > b
    case '<':
      return a < b
    case '==':
      return a === b
  }
}

export function evalCondition(
  cond: Condition,
  flags: FlagState,
  resources: ResourceState,
  variables: VariableState,
  time: number,
  inventory: string[] = [],
  events: Record<string, EntityDef> = {},
): boolean {
  if (cond.type === 'hasEvent') {
    const has = cond.key in events
    return has === cond.value
  }
  if (cond.type === 'flag') {
    return (flags[cond.key] ?? false) === cond.value
  }
  if (cond.type === 'resource') {
    const v = resources[cond.key] ?? 0
    return cmp(cond.op, v, cond.value)
  }
  if (cond.type === 'variable') {
    const v = variables[cond.key] ?? ''
    switch (cond.op) {
      case '==':
        return v === cond.value
      case '!=':
        return v !== cond.value
      case 'contains':
        return typeof v === 'string' && typeof cond.value === 'string'
          ? v.includes(cond.value)
          : false
      case '!contains':
        return typeof v === 'string' && typeof cond.value === 'string'
          ? !v.includes(cond.value)
          : true
      case '>=':
      case '<=':
      case '>':
      case '<':
        return typeof v === 'number' && typeof cond.value === 'number'
          ? cmp(cond.op, v, cond.value)
          : false
      default:
        return false
    }
  }
  if (cond.type === 'hasItem') {
    const has = inventory.some(id => id.toLowerCase() === cond.key.toLowerCase())
    return has === cond.value
  }
  if (cond.type === 'timeWindow') {
    return time >= cond.start && time <= cond.end
  }
  if (cond.type === 'and') {
    return cond.conditions.every(c => evalCondition(c, flags, resources, variables, time, inventory, events))
  }
  if (cond.type === 'or') {
    return cond.conditions.some(c => evalCondition(c, flags, resources, variables, time, inventory, events))
  }
  if (cond.type === 'not') {
    return !evalCondition(cond.condition, flags, resources, variables, time, inventory, events)
  }
  return true
}

export function applyEffect(effect: Effect, session: SessionState, model?: Model): SessionState {
  if (effect.type === 'setFlag') {
    return { ...session, flags: { ...session.flags, [effect.key]: effect.value } }
  }
  if (effect.type === 'addResource') {
    const cur = session.resources[effect.key] ?? 0
    return { ...session, resources: { ...session.resources, [effect.key]: cur + effect.delta } }
  }
  if (effect.type === 'setVariable') {
    return { ...session, variables: { ...session.variables, [effect.key]: effect.value } }
  }
  if (effect.type === 'modifyVariable') {
    const cur = session.variables[effect.key]
    const numCur = typeof cur === 'number' ? cur : 0
    let result: number
    switch (effect.op) {
      case '+': result = numCur + effect.value; break
      case '-': result = numCur - effect.value; break
      case '*': result = numCur * effect.value; break
      case '/': result = effect.value !== 0 ? numCur / effect.value : numCur; break
      default: result = numCur
    }
    return { ...session, variables: { ...session.variables, [effect.key]: result } }
  }
  if (effect.type === 'addItem') {
    const inv = session.inventory ?? []
    if (inv.some(id => id.toLowerCase() === effect.key.toLowerCase())) {
      return session
    }
    return { ...session, inventory: [...inv, effect.key] }
  }
  if (effect.type === 'removeItem') {
    const inv = session.inventory ?? []
    const idx = inv.findIndex(id => id.toLowerCase() === effect.key.toLowerCase())
    if (idx === -1) return session
    const next = [...inv]
    next.splice(idx, 1)
    return { ...session, inventory: next }
  }
  if (effect.type === 'goto') {
    return { ...session, nodeId: effect.target }
  }
  if (effect.type === 'createEvent') {
    return createEventEntity(effect as CreateEventEffect, session)
  }
  if (effect.type === 'perceiveEntity') {
    return applyPerceiveEntityEffect(effect, session, model)
  }
  return session
}

function applyPerceiveEntityEffect(
  effect: Extract<Effect, { type: 'perceiveEntity' }>,
  session: SessionState,
  model?: Model
): SessionState {
  const character = model?.characters?.[effect.character]
  const entity = model?.entities?.[effect.entity]
  if (!character || !entity || !model?.entities) return session

  const perception = perceiveEntity(
    character,
    effect.entity,
    effect.expectations,
    effect.domain,
    model.entities,
  )

  if (effect.onlyIfNoticed && !perception.noticed) return session

  const primary = perception.anomalies.find((anomaly) => anomaly.anomalous)
    ?? perception.anomalies[0]
  const eventId = effect.eventId ?? `event_${effect.character}_perceives_${effect.entity}`
  const eventName = effect.eventName ?? `${character.name} perceived ${entity.name}`

  return createEventEntity({
    type: 'createEvent',
    id: eventId,
    name: eventName,
    properties: {
      knowledge_source: { defaultValue: 'perceiveEntity' },
      observer: { defaultValue: character.id },
      character_id: { defaultValue: character.id },
      character_name: { defaultValue: character.name },
      source_entity: { defaultValue: effect.entity },
      domain: { defaultValue: effect.domain },
      perception_noticed: { defaultValue: perception.noticed },
      anomaly_count: { defaultValue: perception.anomalies.length },
      total_deviation: { defaultValue: finiteNumber(perception.totalDeviation) },
      severity: { defaultValue: Math.min(100, Math.round(finiteNumber(perception.totalDeviation) * 20)) },
      primary_property: { defaultValue: primary?.propertyKey ?? 'none' },
      expected_value: { defaultValue: finiteNumber(primary?.expectedValue) },
      actual_value: { defaultValue: finiteNumber(primary?.actualValue) },
      primary_deviation: { defaultValue: finiteNumber(primary?.deviation) },
    },
  }, session)
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
