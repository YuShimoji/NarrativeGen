import { describe, it, expect } from 'vitest'
import { createEventEntity, hasEvent, createEventFromAnomaly } from '../src/event-entity'
import type { CreateEventEffect } from '../src/event-entity'
import type { SessionState, EntityDef } from '../src/types'
import type { AnomalyResult } from '../src/anomaly-detector'
import { evalCondition, applyEffect } from '../src/condition-effect-ops'
import { startSession, getAvailableChoices, applyChoice } from '../src/session-ops'
import { expandTemplate } from '../src/template'
import type { Model } from '../src/types'

function makeSession(overrides?: Partial<SessionState>): SessionState {
  return {
    nodeId: 'start',
    flags: {},
    resources: {},
    variables: {},
    inventory: [],
    time: 0,
    events: {},
    ...overrides,
  }
}

describe('event-entity', () => {
  describe('createEventEntity', () => {
    it('creates a new event entity in session', () => {
      const session = makeSession()
      const effect: CreateEventEffect = {
        type: 'createEvent',
        id: 'event_1',
        name: 'Test Event',
        properties: {
          severity: { defaultValue: 75 },
          location: { defaultValue: 'town_square' },
        },
      }

      const next = createEventEntity(effect, session)

      expect(next.events).toBeDefined()
      expect(next.events['event_1']).toBeDefined()
      expect(next.events['event_1'].name).toBe('Test Event')
      expect(next.events['event_1'].properties?.severity.defaultValue).toBe(75)
      expect(next.events['event_1'].properties?.severity.type).toBe('number')
      expect(next.events['event_1'].properties?.location.defaultValue).toBe('town_square')
      expect(next.events['event_1'].properties?.location.type).toBe('string')
    })

    it('does not mutate original session', () => {
      const session = makeSession()
      const effect: CreateEventEffect = {
        type: 'createEvent',
        id: 'event_1',
        name: 'Test Event',
      }

      const next = createEventEntity(effect, session)

      expect(session.events).toEqual({})
      expect(next).not.toBe(session)
    })

    it('overwrites existing event with same ID', () => {
      const session = makeSession({
        events: {
          event_1: { id: 'event_1', name: 'Old Event' },
        },
      })
      const effect: CreateEventEffect = {
        type: 'createEvent',
        id: 'event_1',
        name: 'Updated Event',
        properties: { severity: { defaultValue: 90 } },
      }

      const next = createEventEntity(effect, session)

      expect(next.events['event_1'].name).toBe('Updated Event')
      expect(next.events['event_1'].properties?.severity.defaultValue).toBe(90)
    })

    it('handles boolean properties', () => {
      const effect: CreateEventEffect = {
        type: 'createEvent',
        id: 'event_bool',
        name: 'Bool Event',
        properties: { visible: { defaultValue: true } },
      }

      const next = createEventEntity(effect, makeSession())

      expect(next.events['event_bool'].properties?.visible.type).toBe('boolean')
      expect(next.events['event_bool'].properties?.visible.defaultValue).toBe(true)
    })

    it('creates event without properties', () => {
      const effect: CreateEventEffect = {
        type: 'createEvent',
        id: 'event_bare',
        name: 'Bare Event',
      }

      const next = createEventEntity(effect, makeSession())

      expect(next.events['event_bare'].name).toBe('Bare Event')
      expect(next.events['event_bare'].properties).toBeUndefined()
    })
  })

  describe('hasEvent', () => {
    it('returns true when event exists', () => {
      const session = makeSession({
        events: { event_1: { id: 'event_1', name: 'E1' } },
      })
      expect(hasEvent('event_1', session)).toBe(true)
    })

    it('returns false when event does not exist', () => {
      const session = makeSession()
      expect(hasEvent('event_1', session)).toBe(false)
    })

    it('handles undefined events field (backward compat)', () => {
      const session = makeSession()
      ;(session as Record<string, unknown>).events = undefined
      expect(hasEvent('event_1', session)).toBe(false)
    })
  })

  describe('createEventFromAnomaly', () => {
    it('creates event entity from anomaly result', () => {
      const anomaly: AnomalyResult = {
        entityId: 'cheeseburger',
        propertyKey: 'weight',
        expectedValue: 100,
        actualValue: 250,
        toleranceRange: [90, 110],
        deviation: 15,
        anomalous: true,
      }

      const next = createEventFromAnomaly(anomaly, makeSession())

      const event = next.events['anomaly_cheeseburger_weight']
      expect(event).toBeDefined()
      expect(event.name).toBe('Anomaly: cheeseburger.weight')
      expect(event.properties?.source_entity.defaultValue).toBe('cheeseburger')
      expect(event.properties?.expected_value.defaultValue).toBe(100)
      expect(event.properties?.actual_value.defaultValue).toBe(250)
      expect(event.properties?.deviation.defaultValue).toBe(15)
      expect(event.properties?.anomalous.defaultValue).toBe(true)
    })

    it('supports custom id prefix and extra properties', () => {
      const anomaly: AnomalyResult = {
        entityId: 'food',
        propertyKey: 'calories',
        expectedValue: 200,
        actualValue: 500,
        toleranceRange: [180, 220],
        deviation: 15,
        anomalous: true,
      }

      const next = createEventFromAnomaly(anomaly, makeSession(), {
        idPrefix: 'surprise',
        extraProperties: { observer: { defaultValue: 'player' } },
      })

      const event = next.events['surprise_food_calories']
      expect(event).toBeDefined()
      expect(event.properties?.observer.defaultValue).toBe('player')
    })
  })
})

describe('condition-effect-ops integration', () => {
  it('evalCondition supports hasEvent', () => {
    const events = { event_1: { id: 'event_1', name: 'E1' } as EntityDef }
    expect(evalCondition({ type: 'hasEvent', key: 'event_1', value: true }, {}, {}, {}, 0, [], events)).toBe(true)
    expect(evalCondition({ type: 'hasEvent', key: 'event_1', value: false }, {}, {}, {}, 0, [], events)).toBe(false)
    expect(evalCondition({ type: 'hasEvent', key: 'event_2', value: true }, {}, {}, {}, 0, [], events)).toBe(false)
    expect(evalCondition({ type: 'hasEvent', key: 'event_2', value: false }, {}, {}, {}, 0, [], events)).toBe(true)
  })

  it('applyEffect supports createEvent', () => {
    const session = makeSession()
    const effect = {
      type: 'createEvent' as const,
      id: 'event_test',
      name: 'Test',
      properties: { score: { defaultValue: 42 } },
    }
    const next = applyEffect(effect, session)
    expect(next.events['event_test']).toBeDefined()
    expect(next.events['event_test'].properties?.score.defaultValue).toBe(42)
  })

  it('hasEvent works in and/or/not composites', () => {
    const events = { event_a: { id: 'event_a', name: 'A' } as EntityDef }
    // and: hasEvent(a, true) AND hasEvent(b, false) → true
    expect(evalCondition(
      { type: 'and', conditions: [
        { type: 'hasEvent', key: 'event_a', value: true },
        { type: 'hasEvent', key: 'event_b', value: false },
      ] },
      {}, {}, {}, 0, [], events,
    )).toBe(true)

    // not: hasEvent(a, true) → false
    expect(evalCondition(
      { type: 'not', condition: { type: 'hasEvent', key: 'event_a', value: true } },
      {}, {}, {}, 0, [], events,
    )).toBe(false)
  })
})

describe('session-ops integration', () => {
  const model: Model = {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    nodes: {
      start: {
        id: 'start',
        text: 'Start',
        choices: [
          {
            id: 'c1',
            text: 'Create event',
            target: 'after',
            effects: [
              { type: 'createEvent', id: 'event_x', name: 'Event X', properties: { val: { defaultValue: 10 } } },
            ],
          },
        ],
      },
      after: {
        id: 'after',
        text: 'After: [event_x] val=[event_x.val]',
        choices: [
          {
            id: 'c_gated',
            text: 'Gated by event',
            target: 'end',
            conditions: [{ type: 'hasEvent', key: 'event_x', value: true }],
          },
          {
            id: 'c_ungated',
            text: 'No event required',
            target: 'end',
          },
          {
            id: 'c_negative',
            text: 'Requires no event_y',
            target: 'end',
            conditions: [{ type: 'hasEvent', key: 'event_y', value: false }],
          },
        ],
      },
      end: { id: 'end', text: 'End' },
    },
  }

  it('startSession initializes events as empty', () => {
    const session = startSession(model)
    expect(session.events).toEqual({})
  })

  it('applyChoice creates event and gates subsequent choices', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'c1')

    // Event was created
    expect(session.events['event_x']).toBeDefined()
    expect(session.events['event_x'].name).toBe('Event X')

    // Gated choice is now available
    const choices = getAvailableChoices(session, model)
    const ids = choices.map(c => c.id)
    expect(ids).toContain('c_gated')
    expect(ids).toContain('c_ungated')
    expect(ids).toContain('c_negative') // event_y doesn't exist, so value:false is satisfied
  })
})

describe('template integration', () => {
  it('expands event entity references in text', () => {
    const model: Model = {
      modelType: 'adventure-playthrough',
      startNode: 'start',
      nodes: { start: { id: 'start' } },
    }
    const session = makeSession({
      events: {
        event_help: {
          id: 'event_help',
          name: 'Helped Someone',
          properties: {
            kindness: { key: 'kindness', type: 'number', defaultValue: 80 },
            location: { key: 'location', type: 'string', defaultValue: 'plaza' },
          },
        },
      },
    })

    const text = 'You recall [event_help] at [event_help.location] (kindness: [event_help.kindness])'
    const result = expandTemplate(text, model, session)
    expect(result).toBe('You recall Helped Someone at plaza (kindness: 80)')
  })

  it('model.entities takes priority over session.events', () => {
    const model: Model = {
      modelType: 'adventure-playthrough',
      startNode: 'start',
      entities: {
        shared_id: { id: 'shared_id', name: 'Static Entity' },
      },
      nodes: { start: { id: 'start' } },
    }
    const session = makeSession({
      events: {
        shared_id: { id: 'shared_id', name: 'Dynamic Event' },
      },
    })

    const result = expandTemplate('[shared_id]', model, session)
    expect(result).toBe('Static Entity')
  })

  it('unresolved event references are left as-is', () => {
    const model: Model = {
      modelType: 'adventure-playthrough',
      startNode: 'start',
      nodes: { start: { id: 'start' } },
    }
    const session = makeSession()

    const result = expandTemplate('[nonexistent_event.prop]', model, session)
    expect(result).toBe('[nonexistent_event.prop]')
  })
})
