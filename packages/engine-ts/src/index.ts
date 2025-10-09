import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import Ajv from 'ajv'

import type {
  Choice,
  Condition,
  Effect,
  FlagState,
  Model,
  ResourceState,
  SessionState,
} from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadSchema(): any {
  const schemaPath = path.resolve(
    __dirname,
    '../../..',
    'models',
    'schema',
    'playthrough.schema.json',
  )
  const json = fs.readFileSync(schemaPath, 'utf-8')
  return JSON.parse(json)
}

export function loadModel(model: any): Model {
  const ajv = new Ajv({ allErrors: true, strict: false })
  const schema = loadSchema()
  const validate = ajv.compile(schema)
  const ok = validate(model)
  if (!ok) {
    const err = ajv.errorsText(validate.errors, { separator: '\n' })
    throw new Error(`Model validation failed:\n${err}`)
  }
  return model as Model
}

export function startSession(model: Model, initial?: Partial<SessionState>): SessionState {
  return {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    time: initial?.time ?? 0,
  }
}

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
  time: number,
): boolean {
  if (cond.type === 'flag') {
    return (flags[cond.key] ?? false) === cond.value
  }
  if (cond.type === 'resource') {
    const v = resources[cond.key] ?? 0
    return cmp(cond.op, v, cond.value)
  }
  if (cond.type === 'timeWindow') {
    return time >= cond.start && time <= cond.end
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
  if (effect.type === 'goto') {
    return { ...session, nodeId: effect.target }
  }
  return session
}

export function getAvailableChoices(session: SessionState, model: Model): Choice[] {
  const node = model.nodes[session.nodeId]
  if (!node) return []
  const choices = node.choices ?? []
  return choices.filter((c) =>
    (c.conditions ?? []).every((cond) =>
      evalCondition(cond, session.flags, session.resources, session.time),
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

export function serialize(session: SessionState): string {
  return JSON.stringify(session)
}

export function deserialize(payload: string): SessionState {
  const parsed = JSON.parse(payload)
  return parsed as SessionState
}

export type { Entity } from './entities'
export { parseEntitiesCsv } from './entities'
export { Inventory } from './inventory'
