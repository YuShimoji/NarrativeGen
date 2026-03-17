/**
 * Description Tracker — tracks which properties of entities have been described
 * in the story, enabling repetition avoidance and enrichment.
 *
 * Original vision: ORIGINAL_DESIGN_PHILOSOPHY.md §4.3
 */

export interface DescriptionRecord {
  /** Properties already described for this entity */
  describedKeys: string[]
  /** Total number of times this entity has been described */
  descriptionCount: number
}

export type DescriptionState = Record<string, DescriptionRecord>

/**
 * Mark a property as described for an entity.
 * Returns a new DescriptionState (immutable).
 */
export function markDescribed(
  state: DescriptionState,
  entityId: string,
  propertyKey: string
): DescriptionState {
  const existing = state[entityId] ?? { describedKeys: [], descriptionCount: 0 }
  const keys = existing.describedKeys.includes(propertyKey)
    ? existing.describedKeys
    : [...existing.describedKeys, propertyKey]

  return {
    ...state,
    [entityId]: {
      describedKeys: keys,
      descriptionCount: existing.descriptionCount + 1,
    },
  }
}

/**
 * Check if a property has already been described for an entity.
 */
export function isDescribed(
  state: DescriptionState,
  entityId: string,
  propertyKey: string
): boolean {
  return state[entityId]?.describedKeys.includes(propertyKey) ?? false
}

/**
 * Get properties that have NOT been described yet for an entity.
 * Useful for picking fresh descriptions.
 *
 * @param allPropertyKeys - All available property keys for the entity
 */
export function getUndescribedKeys(
  state: DescriptionState,
  entityId: string,
  allPropertyKeys: string[]
): string[] {
  const described = state[entityId]?.describedKeys ?? []
  return allPropertyKeys.filter(k => !described.includes(k))
}

/**
 * Get description count for an entity.
 */
export function getDescriptionCount(
  state: DescriptionState,
  entityId: string
): number {
  return state[entityId]?.descriptionCount ?? 0
}

/**
 * Reset description tracking for a specific entity or all entities.
 */
export function resetDescriptions(
  state: DescriptionState,
  entityId?: string
): DescriptionState {
  if (entityId) {
    const { [entityId]: _, ...rest } = state
    return rest
  }
  return {}
}
