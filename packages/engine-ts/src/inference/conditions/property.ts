import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'
import type { Condition, EntityDef } from '../../types.js'
import { evaluatePropertyCondition } from '../../entities.js'

type PropertyCondition = Extract<Condition, { type: 'property' }>
export const propertyEvaluator: ConditionEvaluator<PropertyCondition> = {
  type: 'property',

  evaluate(cond: PropertyCondition, ctx: EvaluationContext): boolean {
    const legacy = ctx as EvaluationContext & { _entities?: Record<string, EntityDef> }
    return evaluatePropertyCondition(cond, ctx.model?.entities ?? legacy._entities).passed
  },

  getDependencies(_cond: PropertyCondition): DependencyInfo {
    // Property conditions don't directly depend on session state keys
    return {}
  },
}
