import type { EntityDef } from './types'
import type { KnowledgeProfile, AnomalyResult } from './anomaly-detector'
import { detectAllAnomalies } from './anomaly-detector.js'

/**
 * Character definition with knowledge profiles.
 * Each character can have multiple knowledge domains.
 */
export interface CharacterDef {
  id: string
  name: string
  knowledgeProfiles: KnowledgeProfile[]
}

/**
 * Character perception result — what a character notices about an entity.
 */
export interface PerceptionResult {
  characterId: string
  entityId: string
  anomalies: AnomalyResult[]
  totalDeviation: number
  /** True if any anomaly exceeds tolerance */
  noticed: boolean
}

/**
 * Find the best matching knowledge profile for a domain.
 * Falls back to 'general' domain if no specific match.
 */
export function findKnowledgeProfile(
  character: CharacterDef,
  domain: string
): KnowledgeProfile | undefined {
  const exact = character.knowledgeProfiles.find(p => p.domain === domain)
  if (exact) return exact
  return character.knowledgeProfiles.find(p => p.domain === 'general')
}

/**
 * Simulate how a character perceives an entity.
 * Uses the character's knowledge profiles to detect anomalies
 * between expected and actual property values.
 *
 * @param character - The perceiving character
 * @param entityId - The entity being observed
 * @param expectations - What the character expects (property key → expected value)
 * @param domain - Knowledge domain to use for tolerance
 * @param entities - Entity definitions (model.entities)
 */
export function perceiveEntity(
  character: CharacterDef,
  entityId: string,
  expectations: Record<string, number>,
  domain: string,
  entities: Record<string, EntityDef>
): PerceptionResult {
  const profile = findKnowledgeProfile(character, domain)
  if (!profile) {
    return {
      characterId: character.id,
      entityId,
      anomalies: [],
      totalDeviation: 0,
      noticed: false,
    }
  }

  const anomalies = detectAllAnomalies(entityId, expectations, profile, entities)
  const totalDeviation = anomalies.reduce((sum, a) => sum + a.deviation, 0)

  return {
    characterId: character.id,
    entityId,
    anomalies,
    totalDeviation,
    noticed: anomalies.some(a => a.anomalous),
  }
}
