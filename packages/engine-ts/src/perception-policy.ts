import type { Model, PerceptionPolicy, SessionState } from './types'
import { perceiveEntity } from './character-knowledge.js'
import { createEventEntity } from './event-entity.js'

export interface PerceptionEventRequest {
  character: string
  entity: string
  domain: string
  expectations: Record<string, number>
  eventId?: string
  eventName?: string
  onlyIfNoticed?: boolean
}

interface PerceptionEventMetadata {
  policyId?: string
  policyTriggerNode?: string
}

export function applyPerceptionPolicies(
  session: SessionState,
  model?: Model
): SessionState {
  const policies = model?.perceptionPolicies
  if (!Array.isArray(policies) || policies.length === 0) return session

  let next = session
  for (const policy of policies) {
    if (!matchesPolicyTrigger(policy, next)) continue

    const eventId = policy.eventId ?? `event_${policy.character}_perceives_${policy.entity}`
    if (next.events?.[eventId]) continue

    next = createPerceptionEvent(policy, next, model, {
      policyId: policy.id,
      policyTriggerNode: next.nodeId,
    })
  }
  return next
}

export function createPerceptionEvent(
  request: PerceptionEventRequest,
  session: SessionState,
  model?: Model,
  metadata: PerceptionEventMetadata = {}
): SessionState {
  const character = model?.characters?.[request.character]
  const entity = model?.entities?.[request.entity]
  if (!character || !entity || !model?.entities) return session

  const perception = perceiveEntity(
    character,
    request.entity,
    request.expectations,
    request.domain,
    model.entities,
  )

  if (request.onlyIfNoticed && !perception.noticed) return session

  const primary = perception.anomalies.find((anomaly) => anomaly.anomalous)
    ?? perception.anomalies[0]
  const eventId = request.eventId ?? `event_${request.character}_perceives_${request.entity}`
  const eventName = request.eventName ?? `${character.name} perceived ${entity.name}`
  const properties: Record<string, { defaultValue: string | number | boolean }> = {
    knowledge_source: { defaultValue: 'perceiveEntity' },
    observer: { defaultValue: character.id },
    character_id: { defaultValue: character.id },
    character_name: { defaultValue: character.name },
    source_entity: { defaultValue: request.entity },
    domain: { defaultValue: request.domain },
    perception_noticed: { defaultValue: perception.noticed },
    anomaly_count: { defaultValue: perception.anomalies.length },
    total_deviation: { defaultValue: finiteNumber(perception.totalDeviation) },
    severity: { defaultValue: Math.min(100, Math.round(finiteNumber(perception.totalDeviation) * 20)) },
    primary_property: { defaultValue: primary?.propertyKey ?? 'none' },
    expected_value: { defaultValue: finiteNumber(primary?.expectedValue) },
    actual_value: { defaultValue: finiteNumber(primary?.actualValue) },
    primary_deviation: { defaultValue: finiteNumber(primary?.deviation) },
  }

  if (metadata.policyId) {
    properties.policy_source = { defaultValue: `perceptionPolicy:${metadata.policyId}` }
    properties.policy_trigger_node = { defaultValue: metadata.policyTriggerNode ?? session.nodeId }
  }

  return createEventEntity({
    type: 'createEvent',
    id: eventId,
    name: eventName,
    properties,
  }, session)
}

function matchesPolicyTrigger(policy: PerceptionPolicy, session: SessionState): boolean {
  return policy.trigger.node === session.nodeId
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
