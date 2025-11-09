/**
 * Browser-compatible entry point for NarrativeGen engine
 * Does not include Node.js-specific features (fs, path, schema validation)
 */

import type {
  Choice,
  Condition,
  Effect,
  FlagState,
  Model,
  ResourceState,
  SessionState,
  VariableState,
} from './types'
export { chooseParaphrase, paraphraseJa } from './paraphrase.js'
export {
  createAIProvider,
  MockAIProvider,
  type AIProvider,
  type AIConfig,
  type StoryContext,
  type ParaphraseOptions,
} from './ai-provider.js'

function cmp(op: '>=' | '<=' | '>' | '<' | '==', a: number, b: number): boolean {
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

function evalCondition(
  cond: Condition,
  flags: FlagState,
  resources: ResourceState,
  variables: VariableState,
  time: number,
): boolean {
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
        return v.includes(cond.value)
      case '!contains':
        return !v.includes(cond.value)
      default:
        return false
    }
  }
  if (cond.type === 'timeWindow') {
    return time >= cond.start && time <= cond.end
  }
  if (cond.type === 'and') {
    return cond.conditions.every(c => evalCondition(c, flags, resources, variables, time))
  }
  if (cond.type === 'or') {
    return cond.conditions.some(c => evalCondition(c, flags, resources, variables, time))
  }
  if (cond.type === 'not') {
    return !evalCondition(cond.condition, flags, resources, variables, time)
  }
  return true
}

function applyEffect(effect: Effect, session: SessionState): SessionState {
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
  if (effect.type === 'goto') {
    return { ...session, nodeId: effect.target }
  }
  return session
}

export function startSession(model: Model, initial?: Partial<SessionState>): SessionState {
  return {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    variables: initial?.variables ?? {},
    time: initial?.time ?? 0,
  }
}

export function getAvailableChoices(session: SessionState, model: Model): Choice[] {
  const node = model.nodes[session.nodeId]
  if (!node) return []
  const choices = node.choices ?? []
  return choices.filter((c) =>
    (c.conditions ?? []).every((cond) =>
      evalCondition(cond, session.flags, session.resources, session.variables, session.time),
    ),
  )
}

export function applyChoice(session: SessionState, model: Model, choiceId: string): SessionState {
  const node = model.nodes[session.nodeId]
  if (!node) throw new Error(`Node not found: ${session.nodeId}`)
  const choice = (node.choices ?? []).find((c) => c.id === choiceId)
  if (!choice) throw new Error(`Choice not found: ${choiceId}`)
  // ensure choice is available
  const available = getAvailableChoices(session, model).some((c) => c.id === choiceId)
  if (!available) throw new Error(`Choice not available: ${choiceId}`)

  let next = { ...session }
  for (const eff of choice.effects ?? []) {
    next = applyEffect(eff, next)
  }
  // default transition if no goto effect
  if (!choice.effects?.some((e) => e.type === 'goto')) {
    next = { ...next, nodeId: choice.target }
  }
  // simple time progression
  next.time = next.time + 1
  return next
}

export type { Choice, Condition, Effect, FlagState, Model, NodeDef, ResourceState, SessionState, VariableState } from './types'
