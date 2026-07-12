import { evaluateKnowledgeRule } from '../../character-knowledge.js'
import type { ConditionEvaluator, DependencyInfo, EvaluationContext } from '../types.js'

interface KnowledgeRuleCondition {
  type: 'knowledgeRule'
  rule: string
  result: 'noticed'
}

export const knowledgeRuleEvaluator: ConditionEvaluator<KnowledgeRuleCondition> = {
  type: 'knowledgeRule',

  evaluate(condition: KnowledgeRuleCondition, context: EvaluationContext): boolean {
    if (
      condition.result !== 'noticed' ||
      !context.model ||
      !context.session
    ) return false
    const fact = evaluateKnowledgeRule(context.session, context.model, condition.rule)
    return fact.missingReason === undefined && fact.noticed
  },

  getDependencies(_condition: KnowledgeRuleCondition): DependencyInfo {
    // SP-KNOW-002 depends on model semantics rather than mutable session keys.
    // The current dependency graph reports session-key dependencies only.
    return {}
  },
}
