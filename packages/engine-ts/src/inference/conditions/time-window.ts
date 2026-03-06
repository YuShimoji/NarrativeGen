import type { ConditionEvaluator, EvaluationContext } from '../types.js'

interface TimeWindowCondition {
  type: 'timeWindow'
  start: number
  end: number
}

export const timeWindowEvaluator: ConditionEvaluator<TimeWindowCondition> = {
  type: 'timeWindow',

  evaluate(cond: TimeWindowCondition, ctx: EvaluationContext): boolean {
    return ctx.time >= cond.start && ctx.time <= cond.end
  },
}
