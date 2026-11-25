import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'
import type { EntityDef } from '../../types.js'
import { hasEvent } from '../../event-entity.js'

interface HasEventCondition {
  type: 'hasEvent'
  key: string
  value: boolean
}

export const hasEventEvaluator: ConditionEvaluator<HasEventCondition> = {
  type: 'hasEvent',

  evaluate(condition: HasEventCondition, context: EvaluationContext): boolean {
    const legacy = context as EvaluationContext & { _events?: Record<string, EntityDef> }
    return hasEvent(condition.key, { events: context.session?.events ?? legacy._events ?? {} }) === condition.value
  },

  getDependencies(_condition: HasEventCondition): DependencyInfo {
    return {}
  },
}
