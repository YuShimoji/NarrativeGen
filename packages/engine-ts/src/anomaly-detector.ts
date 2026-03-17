import type { EntityDef } from './types'
import { resolveProperty } from './entities.js'

/**
 * Knowledge profile for a character's understanding of a domain.
 */
export interface KnowledgeProfile {
  /** Knowledge domain identifier (e.g., 'modern_products', 'food_items') */
  domain: string
  /** Accuracy of expectation (0-1, e.g., 0.9 = 90% accurate) */
  accuracy: number
  /** Tolerance range as fraction (0-1, e.g., 0.05 = ±5%) */
  tolerance: number
}

/**
 * Result of anomaly detection for a single property comparison.
 */
export interface AnomalyResult {
  entityId: string
  propertyKey: string
  expectedValue: number
  actualValue: number
  toleranceRange: [number, number]
  /** Deviation score: 0 = exact match, 1 = at tolerance boundary, >1 = anomalous */
  deviation: number
  anomalous: boolean
}

/**
 * Detect anomaly by comparing expected property value with actual entity property.
 * Uses inheritance-aware property resolution.
 *
 * @returns AnomalyResult or null if property doesn't exist or isn't numeric
 */
export function detectAnomaly(
  entityId: string,
  propertyKey: string,
  expectedValue: number,
  knowledge: KnowledgeProfile,
  entities: Record<string, EntityDef>
): AnomalyResult | null {
  const prop = resolveProperty(entityId, propertyKey, entities)
  if (!prop || prop.defaultValue === undefined || typeof prop.defaultValue !== 'number') {
    return null
  }

  const actualValue = prop.defaultValue
  const tol = Math.abs(expectedValue * knowledge.tolerance)

  // Avoid division by zero
  const toleranceRange: [number, number] = tol > 0
    ? [expectedValue - tol, expectedValue + tol]
    : [expectedValue, expectedValue]

  const diff = Math.abs(actualValue - expectedValue)
  const deviation = tol > 0 ? diff / tol : (diff === 0 ? 0 : Infinity)

  return {
    entityId,
    propertyKey,
    expectedValue,
    actualValue,
    toleranceRange,
    deviation,
    anomalous: deviation > 1,
  }
}

/**
 * Detect anomalies for multiple properties of an entity.
 * Returns only properties that exist and are numeric.
 */
export function detectAllAnomalies(
  entityId: string,
  expectations: Record<string, number>,
  knowledge: KnowledgeProfile,
  entities: Record<string, EntityDef>
): AnomalyResult[] {
  const results: AnomalyResult[] = []
  for (const [key, expected] of Object.entries(expectations)) {
    const result = detectAnomaly(entityId, key, expected, knowledge, entities)
    if (result) results.push(result)
  }
  return results
}
