import type { Condition, EntityDef, Model, SessionState } from './types'
import { expandTemplate } from './template.js'

/**
 * Conversation template for dynamic story insertion.
 * Matches against session events and produces expanded text.
 */
export interface ConversationTemplate {
  id: string
  trigger: TemplateTrigger
  text: string
  insertContext?: string
  priority?: number
  maxUses?: number
}

export interface TemplateTrigger {
  eventMatch: EventMatchCondition
  sessionConditions?: Condition[]
}

export interface EventMatchCondition {
  propertyChecks: Array<{
    key: string
    op: '>=' | '<=' | '>' | '<' | '==' | '!='
    value: string | number | boolean
  }>
}

export interface ExpandedTemplate {
  templateId: string
  expandedText: string
  insertContext?: string
}

/** Independent usage tracking (not part of SessionState) */
export type TemplateUsageState = Record<string, number>

/**
 * Check if an event entity matches a single property check.
 */
function checkProperty(
  entity: EntityDef,
  check: EventMatchCondition['propertyChecks'][0]
): boolean {
  const prop = entity.properties?.[check.key]
  const actual = prop?.defaultValue
  if (actual === undefined) return false

  const expected = check.value

  if (typeof actual === 'number' && typeof expected === 'number') {
    switch (check.op) {
      case '>=': return actual >= expected
      case '<=': return actual <= expected
      case '>': return actual > expected
      case '<': return actual < expected
      case '==': return actual === expected
      case '!=': return actual !== expected
    }
  }

  // String/boolean: only == and != supported
  const sa = String(actual)
  const se = String(expected)
  if (check.op === '==') return sa === se
  if (check.op === '!=') return sa !== se
  return false
}

/**
 * Check if any event in the session matches the trigger's event conditions.
 */
function matchesEventTrigger(
  trigger: TemplateTrigger,
  events: Record<string, EntityDef>
): boolean {
  const checks = trigger.eventMatch.propertyChecks
  if (checks.length === 0) return false

  return Object.values(events).some(entity =>
    checks.every(check => checkProperty(entity, check))
  )
}

/**
 * Find all conversation templates that match the current session state.
 * Returns expanded texts sorted by priority (descending).
 */
export function findMatchingTemplates(
  templates: ConversationTemplate[],
  session: SessionState,
  model: Model,
  usageState?: TemplateUsageState
): ExpandedTemplate[] {
  const events = session.events ?? {}
  if (Object.keys(events).length === 0) return []

  const usage = usageState ?? {}
  const results: ExpandedTemplate[] = []

  // Sort by priority (higher first)
  const sorted = [...templates].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  for (const template of sorted) {
    // Check maxUses
    if (template.maxUses !== undefined) {
      const used = usage[template.id] ?? 0
      if (used >= template.maxUses) continue
    }

    // Check event match
    if (!matchesEventTrigger(template.trigger, events)) continue

    // Expand template text
    const expandedText = expandTemplate(template.text, model, session)

    results.push({
      templateId: template.id,
      expandedText,
      insertContext: template.insertContext,
    })
  }

  return results
}

/**
 * Record template usage. Returns new state (immutable).
 */
export function recordTemplateUsage(
  state: TemplateUsageState,
  templateId: string
): TemplateUsageState {
  return { ...state, [templateId]: (state[templateId] ?? 0) + 1 }
}
