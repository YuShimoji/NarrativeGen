import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'

interface VariableCondition {
  type: 'variable'
  key: string
  op: '==' | '!=' | 'contains' | '!contains'
  value: string
}

export const variableEvaluator: ConditionEvaluator<VariableCondition> = {
  type: 'variable',

  evaluate(cond: VariableCondition, ctx: EvaluationContext): boolean {
    const v = String(ctx.variables[cond.key] ?? '')
    switch (cond.op) {
      case '==': return v === cond.value
      case '!=': return v !== cond.value
      case 'contains': return v.includes(cond.value)
      case '!contains': return !v.includes(cond.value)
      default: return false
    }
  },

  getDependencies(cond: VariableCondition): DependencyInfo {
    return { variables: [cond.key] }
  },
}
