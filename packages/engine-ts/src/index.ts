import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import Ajv from 'ajv'

import { registerBuiltins } from './inference/registry.js'
registerBuiltins()
import type { AnySchema } from 'ajv'

import type {
  FlagState,
  Model,
  ResourceState,
  SessionState,
  VariableState,
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

function isVariableStateRecord(value: unknown): value is VariableState {
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

interface ValidationOptions {
  allowCircularReferences?: boolean
}

interface ValidationError extends Error {
  code: string
  details?: string
}

function detectCircularReferencesWithPaths(model: Model): string[] {
  const graph = new Map<string, Set<string>>()

  // Build adjacency list from nodes and effects
  for (const [nodeId, node] of Object.entries(model.nodes)) {
    if (!graph.has(nodeId)) {
      graph.set(nodeId, new Set())
    }
    for (const choice of node.choices ?? []) {
      if (choice.target) {
        graph.get(nodeId)!.add(choice.target)
      }
      // Also add goto effect targets
      for (const effect of choice.effects ?? []) {
        if (effect.type === 'goto' && effect.target) {
          graph.get(nodeId)!.add(effect.target)
        }
      }
    }
  }

  const cycles: string[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const path: string[] = []

  function dfs(node: string): void {
    if (recursionStack.has(node)) {
      // Found a cycle - include the node at the end to show it loops back
      const cycleStart = path.indexOf(node)
      const cycle = [...path.slice(cycleStart), node]
      cycles.push(cycle.join(' → '))
      return
    }

    if (visited.has(node)) {
      return
    }

    visited.add(node)
    recursionStack.add(node)
    path.push(node)

    const neighbors = graph.get(node) ?? new Set()
    for (const neighbor of neighbors) {
      dfs(neighbor)
    }

    path.pop()
    recursionStack.delete(node)
  }

  // Check all nodes for cycles
  for (const node of Object.keys(model.nodes)) {
    if (!visited.has(node)) {
      dfs(node)
    }
  }

  return cycles
}

function assertModelIntegrity(model: Model, options: ValidationOptions = {}): void {
  const errors: string[] = []
  const seenNodeIds = new Set<string>()

  // Check for duplicate node IDs
  for (const [nodeKey, node] of Object.entries(model.nodes)) {
    if (seenNodeIds.has(node.id)) {
      errors.push(`DUPLICATE_ID: Duplicate node ID '${node.id}' found in nodes`)
    }
    seenNodeIds.add(node.id)

    if (node.id !== nodeKey) {
      errors.push(`DUPLICATE_ID: node key '${nodeKey}' must match node.id '${node.id}'`)
    }

    // Check for duplicate choice IDs within a node
    const seenChoiceIds = new Set<string>()
    for (const choice of node.choices ?? []) {
      if (seenChoiceIds.has(choice.id)) {
        errors.push(`DUPLICATE_ID: Duplicate choice ID '${choice.id}' in node '${nodeKey}'`)
      }
      seenChoiceIds.add(choice.id)
    }
  }

  // Check for missing startNode
  if (!model.nodes[model.startNode]) {
    errors.push(`MISSING_REFERENCE: startNode '${model.startNode}' does not exist in nodes`)
  }

  // Check for missing choice targets and goto effect targets
  for (const [nodeKey, node] of Object.entries(model.nodes)) {
    for (const choice of node.choices ?? []) {
      // Check if choice has a target
      if (!choice.target || choice.target === '') {
        errors.push(
          `MISSING_REFERENCE: choice '${choice.id}' in node '${nodeKey}' is missing target (node: ${nodeKey}, choice: ${choice.id})`,
        )
        continue
      }

      // Check if target node exists
      if (!model.nodes[choice.target]) {
        errors.push(
          `MISSING_REFERENCE: choice '${choice.id}' in node '${nodeKey}' targets non-existent node '${choice.target}' (node: ${nodeKey}, choice: ${choice.id})`,
        )
      }

      // Check goto effect targets
      for (const effect of choice.effects ?? []) {
        if (effect.type === 'goto') {
          if (!model.nodes[effect.target]) {
            errors.push(
              `MISSING_REFERENCE: goto effect targeting non-existent node '${effect.target}' in choice '${choice.id}' of node '${nodeKey}'`,
            )
          }
        }
      }
    }
  }

  // Check for circular references if not allowed
  if (options.allowCircularReferences === false) {
    const cycles = detectCircularReferencesWithPaths(model)
    for (const cycle of cycles) {
      errors.push(`CIRCULAR_REFERENCE: Circular reference detected: ${cycle}`)
    }
  }

  if (errors.length > 0) {
    // Throw error with combined message that preserves error codes
    const message = errors.join('\n')
    const error = new Error(message) as ValidationError
    error.code = errors[0].split(':')[0]
    throw error
  }
}

function loadSchema(): unknown {
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

export function loadModel(modelData: unknown, options: ValidationOptions = {}): Model {
  const ajv = new Ajv({ allErrors: true })
  const schema = loadSchema() as AnySchema
  const validate = ajv.compile(schema)
  if (!validate(modelData)) {
    const err = ajv.errorsText(validate.errors ?? [], { separator: '\n' })
    throw new Error(`Model validation failed:\n${err}`)
  }
  const model = modelData as Model
  assertModelIntegrity(model, options)
  return model
}

// Re-export session operations from the shared module (uses inference registry)
export { startSession, getAvailableChoices, applyChoice, serialize } from './session-ops.js'

// Re-export inference registry for extensibility
export { registry, registerBuiltins } from './inference/registry.js'
export type { ConditionEvaluator, EffectApplicator, EvaluationContext, DependencyInfo } from './inference/types.js'
export type { Choice, Condition, Effect, FlagState, Model, NodeDef, ResourceState, SessionState, VariableState } from './types'

export function deserialize(payload: string): SessionState {
  const parsed: unknown = JSON.parse(payload)
  if (!isSessionState(parsed)) {
    throw new Error('Invalid session payload')
  }
  return parsed
}
