import type { EntityDef, Model, SessionState } from './types'
import type { KnowledgeProfile, AnomalyResult } from './anomaly-detector'
import { detectAllAnomalies } from './anomaly-detector.js'
import { resolveProperty } from './entities.js'

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

export interface KnowledgeRule {
  character: string
  entity: string
  domain: string
  expectations: Record<string, number>
}

export type KnowledgeProfileMatch = 'exact' | 'general' | 'none'

export type KnowledgeRuleMissingReason =
  | 'rule_missing'
  | 'character_missing'
  | 'entity_missing'
  | 'profile_missing'
  | 'expectation_missing'
  | 'property_missing_or_non_numeric'

export interface KnowledgeEvaluationFact {
  ruleId: string
  characterId?: string
  entityId?: string
  requestedDomain?: string
  matchedDomain?: string
  profileMatch: KnowledgeProfileMatch
  noticed: boolean
  anomalies: AnomalyResult[]
  totalDeviation: number
  missingReason?: KnowledgeRuleMissingReason
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

function missingKnowledgeFact(
  ruleId: string,
  missingReason: KnowledgeRuleMissingReason,
  context: Partial<KnowledgeEvaluationFact> = {},
): KnowledgeEvaluationFact {
  return {
    ruleId,
    profileMatch: context.profileMatch ?? 'none',
    noticed: false,
    anomalies: [],
    totalDeviation: 0,
    ...context,
    missingReason,
  }
}

function getOwnEntry<T>(
  record: Record<string, T> | undefined,
  key: string,
): T | undefined {
  if (!record || !Object.prototype.hasOwnProperty.call(record, key)) {
    return undefined
  }
  return record[key]
}

function isUsableKnowledgeProfile(
  profile: unknown,
): profile is KnowledgeProfile {
  if (!profile || typeof profile !== 'object') return false
  const candidate = profile as Partial<KnowledgeProfile>
  return (
    typeof candidate.domain === 'string' &&
    typeof candidate.tolerance === 'number' &&
    Number.isFinite(candidate.tolerance)
  )
}

function hasKnowledgeProfileDomain(profile: unknown, domain: string): boolean {
  return Boolean(
    profile &&
    typeof profile === 'object' &&
    (profile as Partial<KnowledgeProfile>).domain === domain,
  )
}

/**
 * Evaluate one reusable Character Knowledge rule without mutating session or model.
 * Missing or malformed in-memory inputs fail closed with a stable diagnostic reason.
 */
export function evaluateKnowledgeRule(
  session: SessionState,
  model: Model,
  ruleId: string,
): KnowledgeEvaluationFact {
  // Session is deliberately part of the public contract for parity with condition
  // evaluation, but SP-KNOW-002 rules do not read or mutate session state.
  void session

  const rule = getOwnEntry(model.knowledgeRules, ruleId)
  if (!rule) {
    return missingKnowledgeFact(ruleId, 'rule_missing')
  }

  const context = {
    characterId: rule.character,
    entityId: rule.entity,
    requestedDomain: rule.domain,
  }
  const character = getOwnEntry(model.characters, rule.character)
  if (!character) {
    return missingKnowledgeFact(ruleId, 'character_missing', context)
  }

  const entities = model.entities ?? {}
  if (!Object.prototype.hasOwnProperty.call(entities, rule.entity)) {
    return missingKnowledgeFact(ruleId, 'entity_missing', context)
  }

  const expectations = rule.expectations
  if (
    !expectations ||
    typeof expectations !== 'object' ||
    Array.isArray(expectations) ||
    Object.keys(expectations).length === 0 ||
    Object.values(expectations).some(
      (expected) => typeof expected !== 'number' || !Number.isFinite(expected),
    )
  ) {
    return missingKnowledgeFact(ruleId, 'expectation_missing', context)
  }

  const profiles: unknown[] = Array.isArray(character.knowledgeProfiles)
    ? character.knowledgeProfiles
    : []
  const exactProfile = profiles.find(
    (profile) => hasKnowledgeProfileDomain(profile, rule.domain),
  )
  const profile = exactProfile ?? profiles.find(
    (candidate) => hasKnowledgeProfileDomain(candidate, 'general'),
  )
  if (!isUsableKnowledgeProfile(profile)) {
    return missingKnowledgeFact(ruleId, 'profile_missing', context)
  }

  const profileContext = {
    ...context,
    matchedDomain: profile.domain,
    profileMatch: exactProfile ? 'exact' as const : 'general' as const,
  }

  const hasInvalidProperty = Object.keys(expectations).some((propertyKey) => {
    const property = resolveProperty(rule.entity, propertyKey, entities)
    return (
      !property ||
      typeof property.defaultValue !== 'number' ||
      !Number.isFinite(property.defaultValue)
    )
  })
  if (hasInvalidProperty) {
    return missingKnowledgeFact(
      ruleId,
      'property_missing_or_non_numeric',
      profileContext,
    )
  }

  const anomalies = detectAllAnomalies(
    rule.entity,
    expectations,
    profile,
    entities,
  )
  const totalDeviation = anomalies.reduce((sum, anomaly) => sum + anomaly.deviation, 0)

  return {
    ruleId,
    ...profileContext,
    noticed: anomalies.some((anomaly) => anomaly.anomalous),
    anomalies,
    totalDeviation,
  }
}
