import { describe, it, expect } from 'vitest'
import { findMatchingTemplates, recordTemplateUsage } from '../src/conversation-templates'
import type { ConversationTemplate, TemplateUsageState } from '../src/conversation-templates'
import type { Model, SessionState } from '../src/types'

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    nodeId: 'start', flags: {}, resources: {}, variables: {},
    inventory: [], time: 0, events: {},
    ...overrides,
  }
}

const model: Model = {
  modelType: 'adventure-playthrough',
  startNode: 'start',
  nodes: { start: { id: 'start' } },
  entities: {
    cheeseburger: {
      id: 'cheeseburger', name: 'Cheeseburger',
      properties: { weight: { key: 'weight', type: 'number', defaultValue: 250 } },
    },
  },
}

const templates: ConversationTemplate[] = [
  {
    id: 'recall_blame',
    trigger: {
      eventMatch: {
        propertyChecks: [{ key: 'severity', op: '>=', value: 50 }],
      },
    },
    text: 'You recall the harsh words. It stung at {severity_level}.',
    priority: 10,
  },
  {
    id: 'mild_memory',
    trigger: {
      eventMatch: {
        propertyChecks: [
          { key: 'severity', op: '<', value: 50 },
          { key: 'type', op: '==', value: 'social' },
        ],
      },
    },
    text: 'A faint memory surfaces.',
    priority: 5,
  },
  {
    id: 'limited_use',
    trigger: {
      eventMatch: {
        propertyChecks: [{ key: 'severity', op: '>=', value: 1 }],
      },
    },
    text: 'Something nags at you.',
    maxUses: 1,
    priority: 1,
  },
]

describe('Conversation Templates', () => {
  describe('findMatchingTemplates', () => {
    it('should return empty when no events exist', () => {
      const session = makeSession()
      expect(findMatchingTemplates(templates, session, model)).toEqual([])
    })

    it('should match template by property check', () => {
      const session = makeSession({
        events: {
          blame_event: {
            id: 'blame_event', name: 'Blamed',
            properties: {
              severity: { key: 'severity', type: 'number', defaultValue: 75 },
              type: { key: 'type', type: 'string', defaultValue: 'social' },
            },
          },
        },
      })
      const results = findMatchingTemplates(templates, session, model)
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].templateId).toBe('recall_blame') // highest priority
    })

    it('should sort by priority descending', () => {
      const session = makeSession({
        events: {
          event1: {
            id: 'event1', name: 'Event',
            properties: {
              severity: { key: 'severity', type: 'number', defaultValue: 75 },
              type: { key: 'type', type: 'string', defaultValue: 'social' },
            },
          },
        },
      })
      const results = findMatchingTemplates(templates, session, model)
      // recall_blame (priority 10) should come before limited_use (priority 1)
      const ids = results.map(r => r.templateId)
      expect(ids.indexOf('recall_blame')).toBeLessThan(ids.indexOf('limited_use'))
    })

    it('should respect maxUses', () => {
      const session = makeSession({
        events: {
          event1: {
            id: 'event1', name: 'Event',
            properties: { severity: { key: 'severity', type: 'number', defaultValue: 10 } },
          },
        },
      })
      const usage: TemplateUsageState = { limited_use: 1 }
      const results = findMatchingTemplates(templates, session, model, usage)
      expect(results.find(r => r.templateId === 'limited_use')).toBeUndefined()
    })

    it('should match multiple property checks (AND)', () => {
      // mild_memory requires severity < 50 AND type == 'social'
      const session = makeSession({
        events: {
          event1: {
            id: 'event1', name: 'Event',
            properties: {
              severity: { key: 'severity', type: 'number', defaultValue: 30 },
              type: { key: 'type', type: 'string', defaultValue: 'social' },
            },
          },
        },
      })
      const results = findMatchingTemplates(templates, session, model)
      expect(results.find(r => r.templateId === 'mild_memory')).toBeDefined()
    })

    it('should not match when property checks fail', () => {
      const session = makeSession({
        events: {
          event1: {
            id: 'event1', name: 'Event',
            properties: {
              severity: { key: 'severity', type: 'number', defaultValue: 30 },
              type: { key: 'type', type: 'string', defaultValue: 'combat' },
            },
          },
        },
      })
      const results = findMatchingTemplates(templates, session, model)
      expect(results.find(r => r.templateId === 'mild_memory')).toBeUndefined()
    })

    it('should expand template text with entity references', () => {
      const session = makeSession({
        events: {
          event1: {
            id: 'event1', name: 'Event',
            properties: { severity: { key: 'severity', type: 'number', defaultValue: 75 } },
          },
        },
      })
      const tpl: ConversationTemplate[] = [{
        id: 'entity_ref',
        trigger: { eventMatch: { propertyChecks: [{ key: 'severity', op: '>=', value: 1 }] } },
        text: 'You think about the [cheeseburger].',
      }]
      const results = findMatchingTemplates(tpl, session, model)
      expect(results[0].expandedText).toBe('You think about the Cheeseburger.')
    })
  })

  describe('sessionConditions trigger', () => {
    it('should match template with flag-only trigger (no eventMatch)', () => {
      const session = makeSession({ flags: { quest_started: true } })
      const tpl: ConversationTemplate[] = [{
        id: 'flag_trigger',
        trigger: {
          sessionConditions: [{ type: 'flag', key: 'quest_started', value: true }],
        },
        text: 'Your quest has begun.',
      }]
      const results = findMatchingTemplates(tpl, session, model)
      expect(results).toHaveLength(1)
      expect(results[0].templateId).toBe('flag_trigger')
    })

    it('should not match when session condition fails', () => {
      const session = makeSession({ flags: { quest_started: false } })
      const tpl: ConversationTemplate[] = [{
        id: 'flag_trigger',
        trigger: {
          sessionConditions: [{ type: 'flag', key: 'quest_started', value: true }],
        },
        text: 'Your quest has begun.',
      }]
      const results = findMatchingTemplates(tpl, session, model)
      expect(results).toHaveLength(0)
    })

    it('should match template with resource condition trigger', () => {
      const session = makeSession({ resources: { gold: 100 } })
      const tpl: ConversationTemplate[] = [{
        id: 'rich_trigger',
        trigger: {
          sessionConditions: [{ type: 'resource', key: 'gold', op: '>=', value: 50 }],
        },
        text: 'You feel wealthy.',
      }]
      const results = findMatchingTemplates(tpl, session, model)
      expect(results).toHaveLength(1)
    })

    it('should require both eventMatch AND sessionConditions when both present', () => {
      const session = makeSession({
        flags: { investigated: true },
        events: {
          ev1: {
            id: 'ev1', name: 'Clue',
            properties: { severity: { key: 'severity', type: 'number', defaultValue: 80 } },
          },
        },
      })
      const tpl: ConversationTemplate[] = [{
        id: 'combined',
        trigger: {
          eventMatch: { propertyChecks: [{ key: 'severity', op: '>=', value: 50 }] },
          sessionConditions: [{ type: 'flag', key: 'investigated', value: true }],
        },
        text: 'The evidence clicks into place.',
      }]
      // Both match
      expect(findMatchingTemplates(tpl, session, model)).toHaveLength(1)

      // Event matches but flag fails
      const session2 = makeSession({
        flags: { investigated: false },
        events: session.events,
      })
      expect(findMatchingTemplates(tpl, session2, model)).toHaveLength(0)
    })

    it('should match hasItem session condition', () => {
      const session = makeSession({ inventory: ['magic_sword'] })
      const tpl: ConversationTemplate[] = [{
        id: 'item_trigger',
        trigger: {
          sessionConditions: [{ type: 'hasItem', key: 'magic_sword', value: true }],
        },
        text: 'The sword hums with power.',
      }]
      const results = findMatchingTemplates(tpl, session, model)
      expect(results).toHaveLength(1)
    })
  })

  describe('recordTemplateUsage', () => {
    it('should increment usage count', () => {
      let state: TemplateUsageState = {}
      state = recordTemplateUsage(state, 'tpl1')
      expect(state.tpl1).toBe(1)
      state = recordTemplateUsage(state, 'tpl1')
      expect(state.tpl1).toBe(2)
    })

    it('should be immutable', () => {
      const state1: TemplateUsageState = {}
      const state2 = recordTemplateUsage(state1, 'tpl1')
      expect(state1.tpl1).toBeUndefined()
      expect(state2.tpl1).toBe(1)
    })
  })
})
