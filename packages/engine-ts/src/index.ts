import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import Ajv from 'ajv'
import type { JSONSchemaType } from 'ajv'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFlagStateRecord(value: unknown): value is FlagState {
  if (!isRecord(value)) return false
  return Object.values(value).every((entry) => typeof entry === 'boolean')
}

function isResourceStateRecord(value: unknown): value is ResourceState {
  if (!isRecord(value)) return false
  return Object.values(value).every((entry) => typeof entry === 'number' && Number.isFinite(entry))
}

function isSessionState(value: unknown): value is SessionState {
  if (!isRecord(value)) return false
  const nodeId = value.nodeId
  const time = value.time
  const flags = value.flags
  const resources = value.resources
  if (typeof nodeId !== 'string') return false
  if (typeof time !== 'number' || Number.isNaN(time)) return false
  if (!isFlagStateRecord(flags)) return false
  if (!isResourceStateRecord(resources)) return false
  return true
}

function assertModelIntegrity(model: Model): void {
  const issues: string[] = []
  if (!model.nodes[model.startNode]) {
    issues.push(`startNode '${model.startNode}' does not exist in nodes`)
  }
  for (const [nodeKey, node] of Object.entries(model.nodes)) {
    if (node.id !== nodeKey) {
      issues.push(`node key '${nodeKey}' must match node.id '${node.id}'`)
    }
    const seenChoiceIds = new Set<string>()
    for (const choice of node.choices ?? []) {
      if (seenChoiceIds.has(choice.id)) {
        issues.push(`duplicate choice id '${choice.id}' in node '${nodeKey}'`)
      }
      seenChoiceIds.add(choice.id)
      if (!choice.target) {
        issues.push(`choice '${choice.id}' in node '${nodeKey}' is missing target`)
        continue
      }
      if (!model.nodes[choice.target]) {
        issues.push(`choice '${choice.id}' in node '${nodeKey}' targets missing node '${choice.target}'`)
      }
    }
  }
  if (issues.length > 0) {
    throw new Error(`Model integrity check failed:\n${issues.join('\n')}`)
  }
}

function loadSchema(): JSONSchemaType<Model> {
  const schemaPath = path.resolve(
    __dirname,
    '../../..',
    'models',
    'schema',
    'playthrough.schema.json',
  )
  const json = fs.readFileSync(schemaPath, 'utf-8')
  return JSON.parse(json) as JSONSchemaType<Model>
}

export function loadModel(modelData: unknown): Model {
  const ajv = new Ajv({ allErrors: true, strict: false })
  const schema = loadSchema()
  const validate = ajv.compile<Model>(schema)
  if (!validate(modelData)) {
    const err = ajv.errorsText(validate.errors ?? [], { separator: '\n' })
    throw new Error(`Model validation failed:\n${err}`)
  }
  const model = modelData
  assertModelIntegrity(model)
  return model
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
  const parsed: unknown = JSON.parse(payload)
  if (!isSessionState(parsed)) {
    throw new Error('Invalid session payload')
  }
  return parsed
}
