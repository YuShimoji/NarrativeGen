import type { Model, SessionState } from './types'
import { resolveProperty } from './entities.js'

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
 *
 * Unresolved references are left as-is.
 */
export function expandTemplate(
  text: string,
  model: Model,
  session: SessionState
): string {
  if (!text) return text

  // Phase 1: Entity references [entity_id] and [entity_id.property]
  let result = text.replace(/\[([^\]]+)\]/g, (_match, ref: string) => {
    const dotIndex = ref.indexOf('.')
    if (dotIndex === -1) {
      // [entity_id] → name
      const entity = model.entities?.[ref]
      return entity ? entity.name : `[${ref}]`
    }

    const entityId = ref.substring(0, dotIndex)
    const propKey = ref.substring(dotIndex + 1)
    const entity = model.entities?.[entityId]
    if (!entity) return `[${ref}]`

    // Built-in fields
    if (propKey === 'name') return entity.name
    if (propKey === 'description') return entity.description ?? `[${ref}]`
    if (propKey === 'cost') return String(entity.cost ?? 0)
    if (propKey === 'id') return entity.id

    // Property resolution (with inheritance)
    if (model.entities) {
      const prop = resolveProperty(entityId, propKey, model.entities)
      if (prop && prop.defaultValue !== undefined) {
        return String(prop.defaultValue)
      }
    }

    return `[${ref}]`
  })

  // Phase 1: Variable/flag/resource references {name}
  result = result.replace(/\{([^}]+)\}/g, (_match, key: string) => {
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
