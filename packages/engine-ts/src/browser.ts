/**
 * Browser-compatible entry point for NarrativeGen engine
 * Does not include Node.js-specific features (fs, path, schema validation)
 */

import type {
  Choice,
  Model,
  SessionState,
} from './types'
import {
  evalCondition,
  applyEffect,
} from './condition-effect-ops.js'

export {
  chooseParaphrase,
  paraphraseJa,
  getParaphraseLexicon,
  setParaphraseLexicon,
  createUsageHistory,
  recordUsage,
  buildParaphraseContext,
  type ConditionalVariant,
  type ParaphraseEntry,
  type PropertyAwareLexicon,
  type ParaphraseLexicon,
  type UsageHistory,
  type ParaphraseContext,
} from './paraphrase.js'
export {
  createAIProvider,
  MockAIProvider,
  type AIProvider,
  type AIConfig,
  type StoryContext,
  type ParaphraseOptions,
} from './ai-provider.js'

export function startSession(model: Model, initial?: Partial<SessionState>): SessionState {
  return {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    variables: initial?.variables ?? {},
    inventory: initial?.inventory ?? [],
    time: initial?.time ?? 0,
  }
}

export function getAvailableChoices(session: SessionState, model: Model): Choice[] {
  const node = model.nodes[session.nodeId]
  if (!node) return []
  const choices = node.choices ?? []
  return choices.filter((c) =>
    (c.conditions ?? []).every((cond) =>
      evalCondition(cond, session.flags, session.resources, session.variables, session.time, session.inventory),
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

export type { Choice, Condition, Effect, EntityDef, FlagState, Model, NodeDef, ResourceState, SessionState, VariableState } from './types'

// Inference engine
export { findPathToGoal, findReachableNodes } from './inference/backward-chaining.js'
export { buildDependencyGraph, getAffectedChoices } from './inference/forward-chaining.js'
export { getSupportedConditions, getSupportedEffects } from './inference/capabilities.js'
export { registry, registerBuiltins } from './inference/registry.js'
export type { Goal, PathStep } from './inference/backward-chaining.js'
export type { DependencyGraph, ForwardChainingResult } from './inference/forward-chaining.js'
export type { ConditionEvaluator, EffectApplicator, EvaluationContext, DependencyInfo } from './inference/types.js'
