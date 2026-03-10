import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'

interface FlagCondition {
  type: 'flag'
  key: string
  value: boolean
}

export const flagEvaluator: ConditionEvaluator<FlagCondition> = {
  type: 'flag',

  evaluate(cond: FlagCondition, ctx: EvaluationContext): boolean {
    return (ctx.flags[cond.key] ?? false) === cond.value
  },

  getDependencies(cond: FlagCondition): DependencyInfo {
    return { flags: [cond.key] }
  },
}
