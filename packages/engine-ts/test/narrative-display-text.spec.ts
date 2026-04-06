import { describe, it, expect } from 'vitest'
import {
  resolveNarrativeDisplayText,
  resolveNarrativeDisplayTextTracked,
} from '../src/narrative-display-text'
import { applyLegacySessionPlaceholders } from '../src/template'
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

describe('resolveNarrativeDisplayTextTracked', () => {
  const swordModel: Model = {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    nodes: { start: { id: 'start' } },
    entities: {
      sword: {
        id: 'sword',
        name: 'Iron Sword',
        properties: {
          damage: { key: 'damage', type: 'number', defaultValue: 25 },
          weight: { key: 'weight', type: 'number', defaultValue: 3.5 },
          material: { key: 'material', type: 'string', defaultValue: 'iron' },
        },
      },
    },
  }

  it('matches resolveNarrativeDisplayText when no [entity~] and same seed path', () => {
    const session = makeSession({ flags: { x: true } })
    const raw = '[sword.name] {?x:OK}'
    const plain = resolveNarrativeDisplayText(raw, swordModel, session)
    const tracked = resolveNarrativeDisplayTextTracked(raw, swordModel, session)
    expect(tracked.text).toBe(plain)
    expect(Object.keys(tracked.descriptionState)).toHaveLength(0)
  })

  it('updates descriptionState for [sword~]', () => {
    const session = makeSession()
    const r = resolveNarrativeDisplayTextTracked('Hi [sword~]', swordModel, session, {
      descriptionSeed: 0,
    })
    expect(r.text).toContain('damage: 25')
    expect(r.descriptionState.sword?.describedKeys).toContain('damage')
  })

  it('carries descriptionState across chained calls', () => {
    const session = makeSession()
    const r1 = resolveNarrativeDisplayTextTracked('[sword~]', swordModel, session, {})
    const r2 = resolveNarrativeDisplayTextTracked('[sword~]', swordModel, session, {
      descriptionState: r1.descriptionState,
    })
    expect(r2.descriptionState.sword?.describedKeys).toHaveLength(2)
  })

  it('respects appendConversationTemplates false with tracking', () => {
    const templates: ConversationTemplate[] = [
      {
        id: 'tail',
        trigger: {
          eventMatch: {
            propertyChecks: [{ key: 'severity', op: '>=', value: 1 }],
          },
        },
        text: 'Tail.',
        priority: 10,
      },
    ]
    const model: Model = { ...swordModel, conversationTemplates: templates }
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
    const r = resolveNarrativeDisplayTextTracked('[sword~]', model, session, {
      appendConversationTemplates: false,
    })
    expect(r.text).not.toContain('Tail.')
    expect(r.descriptionState.sword).toBeDefined()
  })
})
