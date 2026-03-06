import type { Condition, SessionState } from '../types.js'
import type { ConditionEvaluator, EffectApplicator, EvaluationContext } from './types.js'
import {
  flagEvaluator,
  resourceEvaluator,
  variableEvaluator,
  timeWindowEvaluator,
  andEvaluator,
  orEvaluator,
  notEvaluator,
  setLogicalResolver,
} from './conditions/index.js'
import {
  setFlagApplicator,
  addResourceApplicator,
  setVariableApplicator,
  gotoApplicator,
} from './effects/index.js'

class InferenceRegistry {
  private conditions = new Map<string, ConditionEvaluator>()
  private effects = new Map<string, EffectApplicator>()

  registerCondition(evaluator: ConditionEvaluator): void {
    this.conditions.set(evaluator.type, evaluator)
  }

  registerEffect(applicator: EffectApplicator): void {
    this.effects.set(applicator.type, applicator)
  }

  getConditionEvaluator(type: string): ConditionEvaluator | undefined {
    return this.conditions.get(type)
  }

  getEffectApplicator(type: string): EffectApplicator | undefined {
    return this.effects.get(type)
  }

  evaluateCondition(cond: { type: string } & Record<string, unknown>, ctx: EvaluationContext): boolean | undefined {
    const evaluator = this.conditions.get(cond.type)
    if (!evaluator) return undefined
    return evaluator.evaluate(cond, ctx)
  }

  applyEffect(effect: { type: string } & Record<string, unknown>, session: SessionState): SessionState | undefined {
    const applicator = this.effects.get(effect.type)
    if (!applicator) return undefined
    return applicator.apply(effect, session)
  }

  getRegisteredConditionTypes(): string[] {
    return [...this.conditions.keys()]
  }

  getRegisteredEffectTypes(): string[] {
    return [...this.effects.keys()]
  }
}

export const registry = new InferenceRegistry()

let initialized = false

export function registerBuiltins(): void {
  if (initialized) return
  initialized = true

  registry.registerCondition(flagEvaluator)
  registry.registerCondition(resourceEvaluator)
  registry.registerCondition(variableEvaluator)
  registry.registerCondition(timeWindowEvaluator)
  registry.registerCondition(andEvaluator)
  registry.registerCondition(orEvaluator)
  registry.registerCondition(notEvaluator)

  registry.registerEffect(setFlagApplicator)
  registry.registerEffect(addResourceApplicator)
  registry.registerEffect(setVariableApplicator)
  registry.registerEffect(gotoApplicator)

  // Wire up logical evaluators to use registry-based evaluation
  setLogicalResolver((cond: Condition, ctx: EvaluationContext): boolean => {
    const result = registry.evaluateCondition(cond as { type: string } & Record<string, unknown>, ctx)
    if (result !== undefined) return result
    // Unknown condition type defaults to true (permissive)
    return true
  })
}
