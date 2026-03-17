import type { ConditionEvaluator, EvaluationContext, DependencyInfo } from '../types.js'
import type { EntityDef } from '../../types.js'
import { resolveProperty } from '../../entities.js'

interface PropertyCondition {
  type: 'property'
  entity: string
  key: string
  op: '>=' | '<=' | '>' | '<' | '==' | '!='
  value: string | number | boolean
}

function compare(op: PropertyCondition['op'], a: unknown, b: PropertyCondition['value']): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    switch (op) {
      case '>=': return a >= b
      case '<=': return a <= b
      case '>': return a > b
      case '<': return a < b
      case '==': return a === b
      case '!=': return a !== b
    }
  }
  // String/boolean comparison
  const sa = String(a)
  const sb = String(b)
  switch (op) {
    case '==': return sa === sb
    case '!=': return sa !== sb
    default: return false
  }
}

/**
 * Property condition evaluator.
 * Resolves entity property via inheritance chain and compares with expected value.
 *
 * Note: This evaluator requires a `model` reference injected into the context.
 * The standard EvaluationContext does not include model/entities, so we
 * look for `ctx._entities` as an extension point.
 */
export const propertyEvaluator: ConditionEvaluator<PropertyCondition> = {
  type: 'property',

  evaluate(cond: PropertyCondition, ctx: EvaluationContext): boolean {
    // Access entities from extended context
    const entities = (ctx as EvaluationContext & { _entities?: Record<string, EntityDef> })._entities
    if (!entities) return false

    const prop = resolveProperty(cond.entity, cond.key, entities)
    if (!prop || prop.defaultValue === undefined) return false

    return compare(cond.op, prop.defaultValue, cond.value)
  },

  getDependencies(_cond: PropertyCondition): DependencyInfo {
    // Property conditions don't directly depend on session state keys
    return {}
  },
}
