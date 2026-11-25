import type { Model, PropertyDef, SessionState } from './types'
import { resolveProperty, getEntityProperties } from './entities.js'
import type { DescriptionState } from './description-tracker.js'
import { hasEvent } from './event-entity.js'
import { getUndescribedKeys, markDescribed } from './description-tracker.js'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * SP-TGEN 段階0: レガシー `{flag:…}` / `{resource:…}` / `{variable:…}` / `{nodeId}` / `{time}` を展開する。
 * `expandTemplate` / `expandTemplateWithTracking` の先頭で一括適用され、二重パスを避ける。
 */
export function applyLegacySessionPlaceholders(text: string, session: SessionState): string {
  let resolved = text

  Object.entries(session.flags ?? {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{flag:${escapeRegExp(key)}\\}`, 'g'), value ? 'true' : 'false')
  })

  Object.entries(session.resources ?? {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{resource:${escapeRegExp(key)}\\}`, 'g'), String(value))
  })

  Object.entries(session.variables ?? {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{variable:${escapeRegExp(key)}\\}`, 'g'), String(value))
  })

  resolved = resolved.replace(/\{nodeId\}/g, session.nodeId)
  resolved = resolved.replace(/\{time\}/g, String(session.time))

  return resolved
}

/** The value and verdict used by both conditional prose and its Studio trace. */
export function readTextCondition(condition: string, session: SessionState): {
  observed?: string | number | boolean
  passed: boolean
} {
  const comparison = condition.match(/^([\p{L}\p{M}\p{N}_]+)(>=|<=|>|<|==|!=)(.+)$/u)
  if (comparison) {
    const [, key, op, raw] = comparison
    const observed = session.resources?.[key] ?? session.variables?.[key]
    const a = Number(observed)
    const b = Number(raw)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { observed, passed: false }
    switch (op) {
      case '>=': return { observed, passed: a >= b }
      case '<=': return { observed, passed: a <= b }
      case '>': return { observed, passed: a > b }
      case '<': return { observed, passed: a < b }
      case '==': return { observed, passed: a === b }
      case '!=': return { observed, passed: a !== b }
    }
  }
  // An explicitly defined false flag or zero variable still owns its name.
  if (Object.prototype.hasOwnProperty.call(session.flags ?? {}, condition)) {
    return { observed: session.flags[condition], passed: session.flags[condition] }
  }
  if (Object.prototype.hasOwnProperty.call(session.variables ?? {}, condition)) {
    return { observed: session.variables[condition], passed: Boolean(session.variables[condition]) }
  }
  if (session.inventory?.includes(condition) || hasEvent(condition, session)) {
    return { observed: true, passed: true }
  }
  return { passed: false }
}

export function expandTemplateCore(text: string, model: Model, session: SessionState): string {
  if (!text) return text

  let result = text.replace(/\{\?(!?)([^:}]+):([^}]*)\}/g, (_match, neg: string, cond: string, body: string) => {
    const { passed } = readTextCondition(cond, session)
    return passed !== (neg === '!') ? body : ''
  })

  // Phase 1: Entity references [entity_id] and [entity_id.property]
  // Lookup order: model.entities (static) → session.events (dynamic)
  const events = session.events ?? {}
  result = result.replace(/\[([^\]]+)\]/g, (_match, ref: string) => {
    const dotIndex = ref.indexOf('.')
    if (dotIndex === -1) {
      // [entity_id] → name
      const entity = model.entities?.[ref] ?? events[ref]
      return entity ? entity.name : `[${ref}]`
    }

    const entityId = ref.substring(0, dotIndex)
    const propKey = ref.substring(dotIndex + 1)
    const entity = model.entities?.[entityId] ?? events[entityId]
    if (!entity) return `[${ref}]`

    // Built-in fields
    if (propKey === 'name') return entity.name
    if (propKey === 'description') return entity.description ?? `[${ref}]`
    if (propKey === 'cost') return String(entity.cost ?? 0)
    if (propKey === 'id') return entity.id

    // Property resolution (with inheritance from model.entities, then direct from events)
    if (model.entities && model.entities[entityId]) {
      const prop = resolveProperty(entityId, propKey, model.entities)
      if (prop && prop.defaultValue !== undefined) {
        return String(prop.defaultValue)
      }
    }
    // Fallback: resolve from event entity's own properties (no inheritance)
    const eventProps = events[entityId]?.properties?.[propKey]?.defaultValue
    if (eventProps !== undefined) {
      return String(eventProps)
    }

    return `[${ref}]`
  })

  // Phase 1: Variable/flag/resource references {name} (skip {? conditional leftovers)
  result = result.replace(/\{([^?}][^}]*)\}/g, (_match, key: string) => {
    // Variables first
    if (session.variables && key in session.variables) {
      return String(session.variables[key])
    }
    // Flags
    if (session.flags && key in session.flags) {
      return String(session.flags[key])
    }
    // Resources
    if (session.resources && key in session.resources) {
      return String(session.resources[key])
    }
    return `{${key}}`
  })

  return result
}

/**
 * Expand template references in text.
 *
 * Supported syntax:
 * - `[entity_id]` → EntityDef.name
 * - `[entity_id.property]` → resolved PropertyDef.defaultValue (inheritance-aware)
 * - `[entity_id.name]` → EntityDef.name
 * - `[entity_id.description]` → EntityDef.description
 * - `[entity_id.cost]` → EntityDef.cost
 * - `{variable}` → session.variables / session.flags / session.resources
 * - `{?flag:text}` → conditional section (show if flag is true)
 * - `{?!flag:text}` → negated conditional (show if flag is false)
 * - `{?resource>=N:text}` → resource comparison conditional
 *
 * Unresolved references are left as-is.
 *
 * 段階0（レガシー `{flag:…}` 等）は本関数の先頭で一度だけ適用される。
 */
export function expandTemplate(
  text: string,
  model: Model,
  session: SessionState
): string {
  if (!text) return text
  return expandTemplateCore(applyLegacySessionPlaceholders(text, session), model, session)
}

/**
 * Result of template expansion with description tracking.
 */
export interface ExpandWithTrackingResult {
  text: string
  descriptionState: DescriptionState
}

/**
 * Expand template references with description tracking.
 *
 * Adds support for `[entity~]` syntax:
 * - `[entity~]` → picks a random undescribed property value and marks it as described.
 *   If all properties are described, picks any property.
 *   Format: "key: value" for the selected property.
 *
 * 段階0は `[entity~]` より前に適用し、その後 `expandTemplateCore` で段階1以降を処理する。
 *
 * @param text - Template text
 * @param model - The model
 * @param session - Current session state
 * @param descState - Current description tracking state
 * @param seed - Random seed for deterministic property selection
 * @returns Expanded text and updated description state
 */
export function expandTemplateWithTracking(
  text: string,
  model: Model,
  session: SessionState,
  descState: DescriptionState = {},
  seed: number = 0
): ExpandWithTrackingResult {
  if (!text) return { text, descriptionState: descState }

  const afterLegacy = applyLegacySessionPlaceholders(text, session)

  let state = { ...descState }
  let seedCounter = seed

  // Process [entity~] patterns before standard expansion
  const processed = afterLegacy.replace(/\[(\w+)~\]/g, (_match, entityId: string) => {
    const entities = { ...(model.entities ?? {}), ...(session.events ?? {}) }
    const entity = entities[entityId]
    if (!entity) return `[${entityId}~]`

    // Get all property keys (with inheritance for static entities)
    let allProps: Record<string, PropertyDef>
    if (model.entities && model.entities[entityId]) {
      allProps = getEntityProperties(entityId, model.entities)
    } else {
      // Event entity: direct properties only
      allProps = {}
      if (entity.properties) {
        for (const [k, p] of Object.entries(entity.properties)) {
          allProps[k] = p
        }
      }
    }

    const allKeys = Object.keys(allProps)
    if (allKeys.length === 0) return entity.name

    // Get undescribed keys
    let candidateKeys = getUndescribedKeys(state, entityId, allKeys)
    if (candidateKeys.length === 0) {
      // All described — allow any key
      candidateKeys = allKeys
    }

    // Deterministic selection using seed
    const selectedKey = candidateKeys[seedCounter % candidateKeys.length]
    seedCounter++

    // Mark as described
    state = markDescribed(state, entityId, selectedKey)

    // Resolve property value
    const prop = allProps[selectedKey]
    const value = prop?.defaultValue !== undefined ? String(prop.defaultValue) : 'unknown'
    return `${selectedKey}: ${value}`
  })

  const expanded = expandTemplateCore(processed, model, session)

  return { text: expanded, descriptionState: state }
}
