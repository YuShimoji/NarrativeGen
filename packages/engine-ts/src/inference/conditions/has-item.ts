import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'

interface HasItemCondition {
  type: 'hasItem'
  key: string
  value: boolean
}

export const hasItemEvaluator: ConditionEvaluator<HasItemCondition> = {
  type: 'hasItem',

  evaluate(condition: HasItemCondition, context: EvaluationContext): boolean {
    const inventory = (context as EvaluationContext & { inventory?: string[] }).inventory ?? []
    const has = inventory.some(id => id.toLowerCase() === condition.key.toLowerCase())
    return has === condition.value
  },

  getDependencies(condition: HasItemCondition): DependencyInfo {
    return {}
  },
}
