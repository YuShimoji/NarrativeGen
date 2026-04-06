import { describe, it, expect } from 'vitest'
import {
  applyLegacySessionPlaceholders,
  resolveNarrativeDisplayText,
} from '../src/narrative-display-text'
import type { ConversationTemplate } from '../src/conversation-templates'
import type { Model, SessionState } from '../src/types'

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    nodeId: 'n1',
    flags: {},
    resources: {},
    variables: {},
    inventory: [],
    time: 0,
    events: {},
    ...overrides,
  }
}

describe('applyLegacySessionPlaceholders', () => {
  it('replaces flag, resource, variable, nodeId, time', () => {
    const session = makeSession({
      nodeId: 'room_a',
      time: 7,
      flags: { lit: true, dark: false },
      resources: { gold: 99 },
      variables: { mood: 'calm' },
    })
    const raw =
      '{flag:lit} {flag:dark} {resource:gold} {variable:mood} {nodeId} {time}'
    expect(applyLegacySessionPlaceholders(raw, session)).toBe(
      'true false 99 calm room_a 7'
    )
  })

  it('escapes regex metacharacters in keys', () => {
    const session = makeSession({
      flags: { 'a+b': true },
    })
    expect(applyLegacySessionPlaceholders('{flag:a+b}', session)).toBe('true')
  })
})

describe('resolveNarrativeDisplayText', () => {
  const modelWithEntity: Model = {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    nodes: { start: { id: 'start' } },
    entities: {
      cheeseburger: {
        id: 'cheeseburger',
        name: 'Cheeseburger',
        properties: {
          weight: { key: 'weight', type: 'number', defaultValue: 250 },
        },
      },
    },
  }

  it('chains legacy placeholders into expandTemplate for [entity] and {?flag:…}', () => {
    const session = makeSession({
      flags: { ok: true },
      variables: { player_name: 'Bob' },
    })
    const raw = '{flag:ok} [cheeseburger.weight] {?ok:Yes}{?!ok:No} {player_name}'
    expect(resolveNarrativeDisplayText(raw, modelWithEntity, session)).toBe(
      'true 250 Yes Bob'
    )
  })

  it('skips expandTemplate when model has no entities and session.events is undefined', () => {
    const modelNoEnt: Model = {
      modelType: 'adventure-playthrough',
      startNode: 'start',
      nodes: { start: { id: 'start' } },
    }
    const sessionLoose = {
      ...makeSession(),
      events: undefined,
    } as unknown as SessionState
    expect(resolveNarrativeDisplayText('[x]', modelNoEnt, sessionLoose)).toBe('[x]')
  })

  const templates: ConversationTemplate[] = [
    {
      id: 'tail',
      trigger: {
        eventMatch: {
          propertyChecks: [{ key: 'severity', op: '>=', value: 1 }],
        },
      },
      text: 'Extra line.',
      priority: 10,
    },
  ]

  const modelWithTemplates: Model = {
    ...modelWithEntity,
    conversationTemplates: templates,
  }

  it('appends matching template texts when events are non-empty and match', () => {
    const session = makeSession({
      events: {
        e1: {
          id: 'e1',
          name: 'E',
          properties: {
            severity: { key: 'severity', type: 'number', defaultValue: 5 },
          },
        },
      },
    })
    const out = resolveNarrativeDisplayText('Hello.', modelWithTemplates, session)
    expect(out).toBe('Hello. Extra line.')
  })

  it('does not append templates when events object is empty', () => {
    const session = makeSession({ events: {} })
    const out = resolveNarrativeDisplayText('Hello.', modelWithTemplates, session)
    expect(out).toBe('Hello.')
  })

  it('does not append templates when appendConversationTemplates is false', () => {
    const session = makeSession({
      events: {
        e1: {
          id: 'e1',
          name: 'E',
          properties: {
            severity: { key: 'severity', type: 'number', defaultValue: 5 },
          },
        },
      },
    })
    const out = resolveNarrativeDisplayText('Hello.', modelWithTemplates, session, {
      appendConversationTemplates: false,
    })
    expect(out).toBe('Hello.')
  })

  it('returns rawText when session is missing (defensive)', () => {
    expect(
      resolveNarrativeDisplayText('x', modelWithEntity, null as unknown as SessionState)
    ).toBe('x')
  })

  it('returns falsy text unchanged', () => {
    const session = makeSession()
    expect(resolveNarrativeDisplayText('', modelWithEntity, session)).toBe('')
  })
})
