import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'
import type { EntityDef } from '../../types.js'

interface HasEventCondition {
  type: 'hasEvent'
  key: string
  value: boolean
}

export const hasEventEvaluator: ConditionEvaluator<HasEventCondition> = {
  type: 'hasEvent',

  evaluate(condition: HasEventCondition, context: EvaluationContext): boolean {
    const events = (context as EvaluationContext & { _events?: Record<string, EntityDef> })._events ?? {}
    const has = condition.key in events
    return has === condition.value
  },

  getDependencies(_condition: HasEventCondition): DependencyInfo {
    return {}
  },
}
