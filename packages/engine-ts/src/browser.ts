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
import { applyPerceptionPolicies } from './perception-policy.js'

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
  const session = {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    variables: { ...(model.variables ?? {}), ...(initial?.variables ?? {}) },
    inventory: initial?.inventory ?? [],
    time: initial?.time ?? 0,
    events: initial?.events ?? {},
  }
  return applyPerceptionPolicies(session, model)
}

export function getAvailableChoices(session: SessionState, model: Model): Choice[] {
  const node = model.nodes[session.nodeId]
  if (!node) return []
  const choices = node.choices ?? []
  return choices.filter((c) =>
    (c.conditions ?? []).every((cond) =>
      evalCondition(cond, session.flags, session.resources, session.variables, session.time, session.inventory, session.events ?? {}, model, session),
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
    next = applyEffect(eff, next, model)
  }
  // default transition if no goto effect
  if (!choice.effects?.some((e) => e.type === 'goto')) {
    next = { ...next, nodeId: choice.target }
  }
  next = applyPerceptionPolicies(next, model)
  // simple time progression
  next.time = next.time + 1
  return next
}

export type { Choice, Condition, Effect, EntityDef, FlagState, Model, NodeDef, PerceptionPolicy, PropertyDef, ResourceState, SessionState, VariableState } from './types'

// Entity-Property system
export { resolveProperty, getEntityProperties, getInheritanceChain } from './entities.js'

// Dynamic text engine
export {
  applyLegacySessionPlaceholders,
  expandTemplate,
  expandTemplateCore,
  expandTemplateWithTracking,
} from './template.js'
export type { ExpandWithTrackingResult } from './template.js'
export { resolveNarrativeDisplayText, resolveNarrativeDisplayTextTracked } from './narrative-display-text.js'
export type {
  ResolveNarrativeDisplayTextOptions,
  ResolveNarrativeDisplayTextTrackedOptions,
  ResolveNarrativeDisplayTextTrackedResult,
} from './narrative-display-text.js'

// Character knowledge model
export { evaluateKnowledgeRule, findKnowledgeProfile, perceiveEntity } from './character-knowledge.js'
export type {
  CharacterDef,
  KnowledgeEvaluationFact,
  KnowledgeProfileMatch,
  KnowledgeRule,
  KnowledgeRuleMissingReason,
  PerceptionResult,
} from './character-knowledge.js'
export { applyPerceptionPolicies, createPerceptionEvent } from './perception-policy.js'
export type { PerceptionEventRequest } from './perception-policy.js'

// Description tracker
export { markDescribed, isDescribed, getUndescribedKeys, getDescriptionCount, resetDescriptions } from './description-tracker.js'
export type { DescriptionRecord, DescriptionState } from './description-tracker.js'

// Conversation templates
export { findMatchingTemplates, recordTemplateUsage } from './conversation-templates.js'
export type { ConversationTemplate, TemplateTrigger, EventMatchCondition, ExpandedTemplate, TemplateUsageState } from './conversation-templates.js'

// Inference engine
export { findPathToGoal, findReachableNodes } from './inference/backward-chaining.js'
export { buildDependencyGraph, getAffectedChoices } from './inference/forward-chaining.js'
export { getSupportedConditions, getSupportedEffects } from './inference/capabilities.js'
export { registry, registerBuiltins } from './inference/registry.js'
export type { Goal, PathStep } from './inference/backward-chaining.js'
export type { DependencyGraph, ForwardChainingResult } from './inference/forward-chaining.js'
export type { ConditionEvaluator, EffectApplicator, EvaluationContext, DependencyInfo } from './inference/types.js'

// Event entity system
export { createEventEntity, hasEvent, createEventFromAnomaly } from './event-entity.js'
export type { CreateEventEffect } from './event-entity.js'
export { detectAnomaly, detectAllAnomalies } from './anomaly-detector.js'
export type { KnowledgeProfile, AnomalyResult } from './anomaly-detector.js'

// Session history (undo/back navigation)
export { createSessionHistory, pushHistory, popHistory, canUndo, historyDepth, clearHistory, diffSessionState } from './session-history.js'
export type { SessionHistory } from './session-history.js'

export { traceText, traceCondition, traceChoices, traceChoiceOrigins, traceTemplates, traceScene, traceStart, traceStep, diffState, checkModel } from './trace.js'
export type { TextSegment, TextTrace, ConditionTrace, ChoiceTrace, TemplateTrace, PerceptionTrace, PerceptionOutcome, StateChange, SceneTrace, StepTrace, RouteEnding, StuckState, ModelCheck } from './trace.js'

// Premise-driven story construction (SP-PREMISE-001 prototype)
export { generateStory, comparePremiseReactions, describeDerivation, explainAction, endingLabel, beatLabel, DEFAULT_PATTERNS } from './premise-story.js'
export type { StoryPremise, PremiseBelief, PremiseWording, PatternId, StoryAction, StoryActionKind, StoryStep, StoryEnding, StoryDerivation, PerceptionFact, EndingShare, WeightFactor, GenerateStoryOptions, GeneratedStory, SceneDerivation, ActionExplanation, StoryBeat, StoryIntent } from './premise-story.js'

export { buildScreenFrame, playScreenFrames, screenChoiceText, screenLayout, screenParagraphs, splitSpeaker, SCREEN_FRAME_FORMAT, SCREEN_FRAME_VERSION } from './screen-frame.js'
export type { ScreenFrame, ScreenFrameOptions, ScreenLayout, ScreenSpan, ScreenChoice, ScreenChoiceGroup, ScreenNote, ScreenHeader, ChoiceRole } from './screen-frame.js'
export { WRITINGPAGE_CONTRACT_VERSION, WritingPageContractError, parseContractVersion, validateWritingPageInput, modelFromWritingPage, modelToWritingPage } from './writingpage-contract.js'
export type { WritingPageChoice, WritingPageNode, WritingPageInput, WritingPageOutput } from './writingpage-contract.js'
