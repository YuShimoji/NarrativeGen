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

function isVariableStateRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false
  return Object.values(value).every((entry) => typeof entry === 'string')
}

function isSessionState(value: unknown): value is SessionState {
  if (!isRecord(value)) return false
  const nodeId = value.nodeId
  const time = value.time
  const flags = value.flags
  const resources = value.resources
  const variables = value.variables
  if (typeof nodeId !== 'string') return false
  if (typeof time !== 'number' || Number.isNaN(time)) return false
  if (!isFlagStateRecord(flags)) return false
  if (!isResourceStateRecord(resources)) return false
  if (!isVariableStateRecord(variables)) return false
  return true
}

interface ValidationIssue {
  type: 'error' | 'warning'
  category: 'duplicate_id' | 'missing_reference' | 'circular_reference' | 'integrity'
  message: string
  nodeId?: string
  choiceId?: string
  path?: string[]
}

function detectCircularReferences(model: Model, startNodeId: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(nodeId: string, path: string[]): void {
    if (visiting.has(nodeId)) {
      // Circular reference detected
      const cycle = [...path, nodeId]
      const cycleStart = cycle.indexOf(nodeId)
      const cyclePath = cycle.slice(cycleStart)
      issues.push({
        type: 'error',
        category: 'circular_reference',
        message: `Circular reference detected: ${cyclePath.join(' → ')}`,
        nodeId,
        path: cyclePath,
      })
      return
    }

    if (visited.has(nodeId)) {
      return
    }

    visiting.add(nodeId)
    const node = model.nodes[nodeId]
    if (node) {
      for (const choice of node.choices ?? []) {
        if (choice.target) {
          visit(choice.target, [...path, nodeId])
        }
        // Check goto effects
        for (const effect of choice.effects ?? []) {
          if (effect.type === 'goto' && effect.target) {
            visit(effect.target, [...path, nodeId])
          }
        }
      }
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  visit(startNodeId, [])
  return issues
}

function assertModelIntegrity(model: Model, options?: LoadModelOptions): void {
  const issues: ValidationIssue[] = []
  const allowCircular = options?.allowCircularReferences ?? true // Default: allow for backward compatibility
  
  // Check for duplicate node IDs (node key vs node.id mismatch)
  const nodeIds = new Set<string>()
  for (const [nodeKey, node] of Object.entries(model.nodes)) {
    if (nodeIds.has(node.id)) {
      issues.push({
        type: 'error',
        category: 'duplicate_id',
        message: `Duplicate node ID '${node.id}' found`,
        nodeId: node.id,
      })
    }
    nodeIds.add(node.id)
    
    if (node.id !== nodeKey) {
      issues.push({
        type: 'error',
        category: 'integrity',
        message: `Node key '${nodeKey}' must match node.id '${node.id}'`,
        nodeId: nodeKey,
      })
    }
  }

  // Check startNode exists
  if (!model.nodes[model.startNode]) {
    issues.push({
      type: 'error',
      category: 'missing_reference',
      message: `startNode '${model.startNode}' does not exist in nodes`,
      nodeId: model.startNode,
    })
  }

  // Check each node's choices
  for (const [nodeKey, node] of Object.entries(model.nodes)) {
    const seenChoiceIds = new Set<string>()
    
    for (const choice of node.choices ?? []) {
      // Check for duplicate choice IDs within the same node
      if (seenChoiceIds.has(choice.id)) {
        issues.push({
          type: 'error',
          category: 'duplicate_id',
          message: `Duplicate choice ID '${choice.id}' in node '${nodeKey}'`,
          nodeId: nodeKey,
          choiceId: choice.id,
        })
      }
      seenChoiceIds.add(choice.id)

      // Check choice target exists
      if (!choice.target) {
        issues.push({
          type: 'error',
          category: 'missing_reference',
          message: `Choice '${choice.id}' in node '${nodeKey}' is missing target`,
          nodeId: nodeKey,
          choiceId: choice.id,
        })
        continue
      }
      
      if (!model.nodes[choice.target]) {
        issues.push({
          type: 'error',
          category: 'missing_reference',
          message: `Choice '${choice.id}' in node '${nodeKey}' targets non-existent node '${choice.target}'`,
          nodeId: nodeKey,
          choiceId: choice.id,
        })
      }

      // Check goto effect targets
      for (const effect of choice.effects ?? []) {
        if (effect.type === 'goto' && effect.target && !model.nodes[effect.target]) {
          issues.push({
            type: 'error',
            category: 'missing_reference',
            message: `Choice '${choice.id}' in node '${nodeKey}' has goto effect targeting non-existent node '${effect.target}'`,
            nodeId: nodeKey,
            choiceId: choice.id,
          })
        }
      }
    }
  }

  // Detect circular references starting from startNode (if not allowed)
  if (!allowCircular && model.nodes[model.startNode]) {
    const circularIssues = detectCircularReferences(model, model.startNode)
    issues.push(...circularIssues)
  }

  // Throw error if any issues found
  if (issues.length > 0) {
    const errorMessages = issues.map((issue) => {
      let msg = `[${issue.category.toUpperCase()}] ${issue.message}`
      if (issue.nodeId) msg += ` (node: ${issue.nodeId})`
      if (issue.choiceId) msg += ` (choice: ${issue.choiceId})`
      return msg
    })
    throw new Error(`Model integrity check failed:\n${errorMessages.join('\n')}`)
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

export interface LoadModelOptions {
  /**
   * If true, allows circular references in the model graph.
   * Default: true (for backward compatibility with existing models)
   */
  allowCircularReferences?: boolean
}

export function loadModel(modelData: unknown, options?: LoadModelOptions): Model {
  const ajv = new Ajv({ allErrors: true, strict: false })
  const schema = loadSchema()
  const validate = ajv.compile<Model>(schema)
  if (!validate(modelData)) {
    const err = ajv.errorsText(validate.errors ?? [], { separator: '\n' })
    throw new Error(`Model validation failed:\n${err}`)
  }
  const model = modelData
  assertModelIntegrity(model, options)
  return model
}

export function startSession(model: Model, initial?: Partial<SessionState>): SessionState {
  return {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    variables: { ...(initial?.variables ?? {}) },
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
  variables: Record<string, string>,
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
  if (cond.type === 'and') {
    return cond.conditions.every((c) => evalCondition(c, flags, resources, variables, time))
  }
  if (cond.type === 'or') {
    return cond.conditions.some((c) => evalCondition(c, flags, resources, variables, time))
  }
  if (cond.type === 'not') {
    return !evalCondition(cond.condition, flags, resources, variables, time)
  }
  return false
}

function applyEffect(effect: Effect, session: SessionState): SessionState {
  if (effect.type === 'setFlag') {
    return { ...session, flags: { ...session.flags, [effect.key]: effect.value } }
  }
  if (effect.type === 'addResource') {
    const cur = session.resources[effect.key] ?? 0
    const delta = 'delta' in effect ? effect.delta : effect.value
    if (!Number.isFinite(delta)) return session
    return { ...session, resources: { ...session.resources, [effect.key]: cur + delta } }
  }
  if (effect.type === 'setResource') {
    if (!Number.isFinite(effect.value)) return session
    return { ...session, resources: { ...session.resources, [effect.key]: effect.value } }
  }
  if (effect.type === 'setVariable') {
    return { ...session, variables: { ...session.variables, [effect.key]: effect.value } }
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

export function serialize(session: SessionState): string {
  return JSON.stringify(session)
}

export function deserialize(payload: string): SessionState {
  const parsed: unknown = JSON.parse(payload)
  if (!isRecord(parsed)) {
    throw new Error('Invalid session payload')
  }
  const normalized: Record<string, unknown> = { ...parsed }
  if (!('variables' in normalized)) {
    normalized.variables = {}
  }
  if (!isSessionState(normalized)) {
    throw new Error('Invalid session payload')
  }
  return normalized
}
