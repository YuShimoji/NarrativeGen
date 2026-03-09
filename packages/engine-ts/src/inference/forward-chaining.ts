/**
 * Forward Chaining - Effect-driven dependency tracking
 *
 * After applying a choice's effects, identifies which other choices
 * have conditions that may now evaluate differently.
 */
import type { Model, Condition, Effect, SessionState } from '../types.js'
import type { DependencyInfo } from './types.js'
import { registry } from './registry.js'
import { applyChoice } from '../session-ops.js'

type StateKey = string

function normalizeKey(domain: string, key: string): StateKey {
  return `${domain}:${key}`
}

function depInfoToKeys(info: DependencyInfo): StateKey[] {
  const keys: StateKey[] = []
  for (const k of info.flags ?? []) keys.push(normalizeKey('flag', k))
  for (const k of info.resources ?? []) keys.push(normalizeKey('resource', k))
  for (const k of info.variables ?? []) keys.push(normalizeKey('variable', k))
  return keys
}

function mergeDepInfos(infos: DependencyInfo[]): DependencyInfo {
  const result: DependencyInfo = {}
  for (const info of infos) {
    if (info.flags) result.flags = [...(result.flags ?? []), ...info.flags]
    if (info.resources) result.resources = [...(result.resources ?? []), ...info.resources]
    if (info.variables) result.variables = [...(result.variables ?? []), ...info.variables]
  }
  return result
}

function extractConditionDeps(cond: Condition): DependencyInfo {
  const evaluator = registry.getConditionEvaluator(cond.type)
  if (evaluator?.getDependencies) {
    return evaluator.getDependencies(cond)
  }
  if (cond.type === 'and') return mergeDepInfos(cond.conditions.map(extractConditionDeps))
  if (cond.type === 'or') return mergeDepInfos(cond.conditions.map(extractConditionDeps))
  if (cond.type === 'not') return extractConditionDeps(cond.condition)
  return {}
}

function extractEffectKeys(effect: Effect): DependencyInfo {
  const applicator = registry.getEffectApplicator(effect.type)
  if (applicator?.getAffectedKeys) {
    return applicator.getAffectedKeys(effect)
  }
  return {}
}

/**
 * Pre-computed dependency graph for a model.
 * Maps state keys to the choices whose conditions depend on them,
 * and maps choices to the state keys their effects modify.
 */
export interface DependencyGraph {
  /** state key → set of "nodeId:choiceId" with conditions depending on this key */
  stateToChoices: Map<StateKey, Set<string>>
  /** "nodeId:choiceId" → set of state keys modified by this choice's effects */
  choiceToAffectedKeys: Map<string, Set<StateKey>>
}

/**
 * Build a dependency graph from a model.
 * Should be called once per model and reused across multiple applyChoice calls.
 */
export function buildDependencyGraph(model: Model): DependencyGraph {
  const stateToChoices = new Map<StateKey, Set<string>>()
  const choiceToAffectedKeys = new Map<string, Set<StateKey>>()

  for (const [nodeId, node] of Object.entries(model.nodes)) {
    for (const choice of node.choices ?? []) {
      const choiceKey = `${nodeId}:${choice.id}`

      // Map condition dependencies → choiceKey
      for (const cond of choice.conditions ?? []) {
        const keys = depInfoToKeys(extractConditionDeps(cond))
        for (const key of keys) {
          if (!stateToChoices.has(key)) stateToChoices.set(key, new Set())
          stateToChoices.get(key)!.add(choiceKey)
        }
      }

      // Map choiceKey → effect targets
      const affected = new Set<StateKey>()
      for (const effect of choice.effects ?? []) {
        for (const k of depInfoToKeys(extractEffectKeys(effect))) {
          affected.add(k)
        }
      }
      if (affected.size > 0) {
        choiceToAffectedKeys.set(choiceKey, affected)
      }
    }
  }

  return { stateToChoices, choiceToAffectedKeys }
}

/**
 * Given a set of effects, find which choices may be affected
 * (their conditions depend on state keys modified by the effects).
 * Returns choice identifiers in "nodeId:choiceId" format.
 */
export function getAffectedChoices(depGraph: DependencyGraph, effects: Effect[]): string[] {
  const affected = new Set<string>()
  for (const effect of effects) {
    const keys = depInfoToKeys(extractEffectKeys(effect))
    for (const key of keys) {
      const choices = depGraph.stateToChoices.get(key)
      if (choices) {
        for (const c of choices) affected.add(c)
      }
    }
  }
  return [...affected]
}

/**
 * Result of forward-chaining choice application.
 */
export interface ForwardChainingResult {
  session: SessionState
  /** Choices whose availability may have changed ("nodeId:choiceId" format) */
  affectedChoices: string[]
}

/**
 * Apply a choice and identify which other choices may be affected.
 * Combines standard applyChoice with dependency graph analysis.
 */
export function applyChoiceWithForwardChaining(
  session: SessionState,
  model: Model,
  choiceId: string,
  depGraph: DependencyGraph,
): ForwardChainingResult {
  const node = model.nodes[session.nodeId]
  const choice = (node?.choices ?? []).find(c => c.id === choiceId)

  const newSession = applyChoice(session, model, choiceId)
  const affectedChoices = getAffectedChoices(depGraph, choice?.effects ?? [])

  return { session: newSession, affectedChoices }
}
