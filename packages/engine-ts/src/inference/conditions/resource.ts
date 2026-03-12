import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'

interface ResourceCondition {
  type: 'resource'
  key: string
  op: '>=' | '<=' | '>' | '<' | '=='
  value: number
}

function cmp(op: ResourceCondition['op'], a: number, b: number): boolean {
  switch (op) {
    case '>=': return a >= b
    case '<=': return a <= b
    case '>': return a > b
    case '<': return a < b
    case '==': return a === b
    default: return false
  }
}

export const resourceEvaluator: ConditionEvaluator<ResourceCondition> = {
  type: 'resource',

  evaluate(cond: ResourceCondition, ctx: EvaluationContext): boolean {
    const v = ctx.resources[cond.key] ?? 0
    return cmp(cond.op, v, cond.value)
  },

  getDependencies(cond: ResourceCondition): DependencyInfo {
    return { resources: [cond.key] }
  },
}
