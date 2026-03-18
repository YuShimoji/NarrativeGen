import type { Model, SessionState } from './types'
import { resolveProperty, getEntityProperties } from './entities.js'
import type { DescriptionState } from './description-tracker.js'
import { getUndescribedKeys, markDescribed } from './description-tracker.js'

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
 */
export function expandTemplate(
  text: string,
  model: Model,
  session: SessionState
): string {
  if (!text) return text

  // Phase 3: Conditional sections {?condition:text} — processed first
  let result = text.replace(/\{\?(!?)([^:}]+):([^}]*)\}/g, (_match, neg: string, cond: string, body: string) => {
    const negate = neg === '!'
    let condResult = false

    // Check for comparison operators (resource/variable conditions)
    const opMatch = cond.match(/^(\w+)(>=|<=|>|<|==|!=)(.+)$/)
    if (opMatch) {
      const [, key, op, rawVal] = opMatch
      const val = Number(rawVal)
      const actual = (session.resources && key in session.resources)
        ? session.resources[key]
        : (session.variables && key in session.variables)
          ? Number(session.variables[key])
          : undefined
      if (actual !== undefined && Number.isFinite(val) && Number.isFinite(actual as number)) {
        const a = actual as number
        switch (op) {
          case '>=': condResult = a >= val; break
          case '<=': condResult = a <= val; break
          case '>': condResult = a > val; break
          case '<': condResult = a < val; break
          case '==': condResult = a === val; break
          case '!=': condResult = a !== val; break
        }
      }
    } else {
      // Simple flag/variable truthiness check
      if (session.flags && cond in session.flags) {
        condResult = !!session.flags[cond]
      } else if (session.variables && cond in session.variables) {
        condResult = !!session.variables[cond]
      } else if (session.inventory && session.inventory.includes(cond)) {
        condResult = true
      }
    }

    if (negate) condResult = !condResult
    return condResult ? body : ''
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
    if (events[entityId]?.properties?.[propKey]?.defaultValue !== undefined) {
      return String(events[entityId].properties![propKey].defaultValue!)
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
 * All other syntax is handled by `expandTemplate`.
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

  let state = { ...descState }
  let seedCounter = seed

  // Process [entity~] patterns before standard expansion
  const processed = text.replace(/\[(\w+)~\]/g, (_match, entityId: string) => {
    const entities = { ...(model.entities ?? {}), ...(session.events ?? {}) }
    const entity = entities[entityId]
    if (!entity) return `[${entityId}~]`

    // Get all property keys (with inheritance for static entities)
    let allProps: Record<string, import('./types').PropertyDef>
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

  // Run standard expansion on the processed text
  const expanded = expandTemplate(processed, model, session)

  return { text: expanded, descriptionState: state }
}
