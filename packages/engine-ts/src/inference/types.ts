import type { FlagState, Model, ResourceState, VariableState, SessionState } from '../types.js'

export interface EvaluationContext {
  flags: FlagState
  resources: ResourceState
  variables: VariableState
  time: number
  /** Optional model/session context for pure model-aware conditions. */
  model?: Model
  session?: SessionState
}

export interface DependencyInfo {
  flags?: string[]
  resources?: string[]
  variables?: string[]
}

export interface ConditionEvaluator<T = unknown> {
  readonly type: string
  evaluate(condition: T, context: EvaluationContext): boolean
  getDependencies?(condition: T): DependencyInfo
}

export interface EffectApplicator<T = unknown> {
  readonly type: string
  apply(effect: T, session: SessionState): SessionState
  getAffectedKeys?(effect: T): DependencyInfo
}
