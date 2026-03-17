import type { EntityDef, PropertyDef, SessionState } from './types'
import type { AnomalyResult } from './anomaly-detector.js'

/**
 * Effect shape for createEvent.
 */
export interface CreateEventEffect {
  type: 'createEvent'
  id: string
  name: string
  properties?: Record<string, { defaultValue: string | number | boolean }>
}

/**
 * Normalize simplified property definitions into full PropertyDef format.
 * Infers `type` and `key` from the defaultValue.
 */
function normalizeProperties(
  props?: Record<string, { defaultValue: string | number | boolean }>
): Record<string, PropertyDef> | undefined {
  if (!props) return undefined
  const result: Record<string, PropertyDef> = {}
  for (const [key, val] of Object.entries(props)) {
    const dv = val.defaultValue
    result[key] = {
      key,
      type: typeof dv === 'number' ? 'number' : typeof dv === 'boolean' ? 'boolean' : 'string',
      defaultValue: dv,
    }
  }
  return result
}

/**
 * Create a new event entity from a createEvent effect and add it to the session.
 * If an event with the same ID already exists, it is overwritten (state update).
 * Returns a new SessionState (immutable).
 */
export function createEventEntity(
  effect: CreateEventEffect,
  session: SessionState
): SessionState {
  const entity: EntityDef = {
    id: effect.id,
    name: effect.name,
    properties: normalizeProperties(effect.properties),
  }

  return {
    ...session,
    events: {
      ...(session.events || {}),
      [effect.id]: entity,
    },
  }
}

/**
 * Check if an event entity exists in the session.
 */
export function hasEvent(
  eventId: string,
  session: SessionState
): boolean {
  return !!(session.events && eventId in session.events)
}

/**
 * Convenience: create an event entity from an anomaly detection result.
 * Generates standardized properties: entityId, propertyKey, expectedValue,
 * actualValue, deviation, anomalous.
 */
export function createEventFromAnomaly(
  anomaly: AnomalyResult,
  session: SessionState,
  options?: {
    idPrefix?: string
    extraProperties?: Record<string, { defaultValue: string | number | boolean }>
  }
): SessionState {
  const prefix = options?.idPrefix ?? 'anomaly'
  const id = `${prefix}_${anomaly.entityId}_${anomaly.propertyKey}`

  const effect: CreateEventEffect = {
    type: 'createEvent',
    id,
    name: `Anomaly: ${anomaly.entityId}.${anomaly.propertyKey}`,
    properties: {
      source_entity: { defaultValue: anomaly.entityId },
      source_property: { defaultValue: anomaly.propertyKey },
      expected_value: { defaultValue: anomaly.expectedValue },
      actual_value: { defaultValue: anomaly.actualValue },
      deviation: { defaultValue: anomaly.deviation },
      anomalous: { defaultValue: anomaly.anomalous },
      ...(options?.extraProperties || {}),
    },
  }

  return createEventEntity(effect, session)
}
