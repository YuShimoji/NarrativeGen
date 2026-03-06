/**
 * Browser-compatible entry point for NarrativeGen engine
 * Does not include Node.js-specific features (fs, path, schema validation)
 */

import { registerBuiltins } from './inference/registry.js'
registerBuiltins()

export { chooseParaphrase, paraphraseJa, getParaphraseLexicon, setParaphraseLexicon } from './paraphrase.js'
export {
  createAIProvider,
  MockAIProvider,
  type AIProvider,
  type AIConfig,
  type StoryContext,
  type ParaphraseOptions,
} from './ai-provider.js'
export { startSession, getAvailableChoices, applyChoice } from './session-ops.js'
export { registry, registerBuiltins } from './inference/registry.js'
export type { ConditionEvaluator, EffectApplicator, EvaluationContext, DependencyInfo } from './inference/types.js'
export type { Choice, Condition, Effect, FlagState, Model, NodeDef, ResourceState, SessionState, VariableState } from './types'
