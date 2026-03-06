import type { Condition } from '../../types.js'
import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'

// logical evaluators need access to the registry to recurse
// this is resolved at runtime via the registry reference
let resolveEval: ((cond: Condition, ctx: EvaluationContext) => boolean) | null = null

export function setLogicalResolver(fn: (cond: Condition, ctx: EvaluationContext) => boolean): void {
  resolveEval = fn
}

function evalChild(cond: Condition, ctx: EvaluationContext): boolean {
  if (!resolveEval) throw new Error('Logical resolver not initialized')
  return resolveEval(cond, ctx)
}

interface AndCondition { type: 'and'; conditions: Condition[] }
interface OrCondition { type: 'or'; conditions: Condition[] }
interface NotCondition { type: 'not'; condition: Condition }

export const andEvaluator: ConditionEvaluator<AndCondition> = {
  type: 'and',
  evaluate(cond: AndCondition, ctx: EvaluationContext): boolean {
    return cond.conditions.every(c => evalChild(c, ctx))
  },
}

export const orEvaluator: ConditionEvaluator<OrCondition> = {
  type: 'or',
  evaluate(cond: OrCondition, ctx: EvaluationContext): boolean {
    return cond.conditions.some(c => evalChild(c, ctx))
  },
}

export const notEvaluator: ConditionEvaluator<NotCondition> = {
  type: 'not',
  evaluate(cond: NotCondition, ctx: EvaluationContext): boolean {
    return !evalChild(cond.condition, ctx)
  },
}
