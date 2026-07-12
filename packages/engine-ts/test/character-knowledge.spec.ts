import { describe, it, expect } from 'vitest'
import {
  evaluateKnowledgeRule,
  findKnowledgeProfile,
  perceiveEntity,
} from '../src/character-knowledge'
import type { CharacterDef } from '../src/character-knowledge'
import { serialize } from '../src/session-ops'
import type { EntityDef, Model, SessionState } from '../src/types'

const entities: Record<string, EntityDef> = {
  cheeseburger: {
    id: 'cheeseburger', name: 'Cheeseburger', parentEntity: 'food',
    properties: {
      weight: { key: 'weight', type: 'number', defaultValue: 250 },
      calories: { key: 'calories', type: 'number', defaultValue: 350 },
    },
  },
  food: {
    id: 'food', name: 'Food',
    properties: {
      edible: { key: 'edible', type: 'boolean', defaultValue: true },
    },
  },
}

const detective: CharacterDef = {
  id: 'detective_a',
  name: 'Detective A',
  knowledgeProfiles: [
    { domain: 'modern_products', accuracy: 0.9, tolerance: 0.1 },
    { domain: 'general', accuracy: 0.5, tolerance: 0.2 },
  ],
}

const drunkPerson: CharacterDef = {
  id: 'drunk_person',
  name: 'Drunk Person',
  knowledgeProfiles: [
    { domain: 'general', accuracy: 0.3, tolerance: 0.3 },
  ],
}

const child: CharacterDef = {
  id: 'child',
  name: 'Child',
  knowledgeProfiles: [],
}

const knowledgeSession: SessionState = {
  nodeId: 'inspection',
  flags: { meaning_locked: false },
  resources: { focus: 2 },
  variables: { reading: 'contradiction' },
  inventory: ['receipt_fragment'],
  time: 4,
  events: {
    event_existing: {
      id: 'event_existing',
      name: 'Existing event',
    },
  },
}

function createKnowledgeRuleModel(): Model {
  return {
    modelType: 'adventure-playthrough',
    startNode: 'inspection',
    entities: {
      receipt_fragment: {
        id: 'receipt_fragment',
        name: 'Receipt fragment',
        properties: {
          credibility: { key: 'credibility', type: 'number', defaultValue: 72 },
          sequence: { key: 'sequence', type: 'number', defaultValue: 12 },
          label: { key: 'label', type: 'string', defaultValue: 'archive' },
        },
      },
    },
    characters: {
      mira: {
        id: 'mira',
        name: 'Mira',
        knowledgeProfiles: [
          { domain: 'archive_records', accuracy: 0.9, tolerance: 0.1 },
          { domain: 'general', accuracy: 0.5, tolerance: 0.2 },
        ],
      },
    },
    knowledgeRules: {
      receipt_contradiction: {
        character: 'mira',
        entity: 'receipt_fragment',
        domain: 'archive_records',
        expectations: { credibility: 50 },
      },
    },
    nodes: {
      inspection: { id: 'inspection', choices: [] },
    },
  }
}

describe('Character Knowledge Model', () => {
  describe('findKnowledgeProfile', () => {
    it('should find exact domain match', () => {
      const profile = findKnowledgeProfile(detective, 'modern_products')
      expect(profile).toBeDefined()
      expect(profile!.accuracy).toBe(0.9)
    })

    it('should fall back to general domain', () => {
      const profile = findKnowledgeProfile(detective, 'food_items')
      expect(profile).toBeDefined()
      expect(profile!.domain).toBe('general')
    })

    it('should return undefined for character without profiles', () => {
      expect(findKnowledgeProfile(child, 'anything')).toBeUndefined()
    })
  })

  describe('perceiveEntity', () => {
    it('should detect anomaly for detective with tight tolerance', () => {
      // Detective expects weight=200 (±10% = 180-220), actual=250
      const result = perceiveEntity(detective, 'cheeseburger',
        { weight: 200 }, 'modern_products', entities)
      expect(result.noticed).toBe(true)
      expect(result.anomalies).toHaveLength(1)
      expect(result.anomalies[0].deviation).toBe(2.5)
    })

    it('should not detect anomaly for drunk person with wide tolerance', () => {
      // Drunk expects weight=200 (±30% = 140-260), actual=250
      const result = perceiveEntity(drunkPerson, 'cheeseburger',
        { weight: 200 }, 'general', entities)
      expect(result.noticed).toBe(false)
    })

    it('should handle character with no matching knowledge', () => {
      const result = perceiveEntity(child, 'cheeseburger',
        { weight: 200 }, 'food_items', entities)
      expect(result.noticed).toBe(false)
      expect(result.anomalies).toHaveLength(0)
    })

    it('should use general profile as fallback', () => {
      // Detective has no 'food_items' domain, falls back to 'general' (tolerance=0.2)
      const result = perceiveEntity(detective, 'cheeseburger',
        { weight: 200 }, 'food_items', entities)
      // tolerance=0.2, expected=200, range=160-240, actual=250, deviation=50/40=1.25
      expect(result.noticed).toBe(true)
      expect(result.anomalies[0].deviation).toBe(1.25)
    })

    it('should calculate totalDeviation across multiple properties', () => {
      const result = perceiveEntity(detective, 'cheeseburger',
        { weight: 250, calories: 350 }, 'modern_products', entities)
      expect(result.totalDeviation).toBe(0)
      expect(result.noticed).toBe(false)
    })
  })

  describe('evaluateKnowledgeRule', () => {
    it('returns a stable exact-profile noticed fact', () => {
      const fact = evaluateKnowledgeRule(
        knowledgeSession,
        createKnowledgeRuleModel(),
        'receipt_contradiction',
      )

      expect(fact).toMatchObject({
        ruleId: 'receipt_contradiction',
        characterId: 'mira',
        entityId: 'receipt_fragment',
        requestedDomain: 'archive_records',
        matchedDomain: 'archive_records',
        profileMatch: 'exact',
        noticed: true,
        totalDeviation: 4.4,
      })
      expect(fact.missingReason).toBeUndefined()
      expect(fact.anomalies).toHaveLength(1)
    })

    it('records general-profile fallback without changing anomaly semantics', () => {
      const model = createKnowledgeRuleModel()
      model.knowledgeRules!.receipt_contradiction.domain = 'shipping_records'

      const fact = evaluateKnowledgeRule(
        knowledgeSession,
        model,
        'receipt_contradiction',
      )

      expect(fact.requestedDomain).toBe('shipping_records')
      expect(fact.matchedDomain).toBe('general')
      expect(fact.profileMatch).toBe('general')
      expect(fact.noticed).toBe(true)
      expect(fact.missingReason).toBeUndefined()
    })

    it.each([
      ['missing rule', (model: Model) => model, 'unknown_rule', 'rule_missing'],
      [
        'missing character',
        (model: Model) => {
          model.knowledgeRules!.receipt_contradiction.character = 'unknown_character'
          return model
        },
        'receipt_contradiction',
        'character_missing',
      ],
      [
        'missing entity',
        (model: Model) => {
          model.knowledgeRules!.receipt_contradiction.entity = 'unknown_entity'
          return model
        },
        'receipt_contradiction',
        'entity_missing',
      ],
      [
        'empty expectations',
        (model: Model) => {
          model.knowledgeRules!.receipt_contradiction.expectations = {}
          return model
        },
        'receipt_contradiction',
        'expectation_missing',
      ],
      [
        'missing profile',
        (model: Model) => {
          model.characters!.mira.knowledgeProfiles = []
          return model
        },
        'receipt_contradiction',
        'profile_missing',
      ],
      [
        'malformed profile entry',
        (model: Model) => {
          model.characters!.mira.knowledgeProfiles = [null] as never[]
          return model
        },
        'receipt_contradiction',
        'profile_missing',
      ],
      [
        'non-finite profile tolerance',
        (model: Model) => {
          model.characters!.mira.knowledgeProfiles[0].tolerance = Number.NaN
          return model
        },
        'receipt_contradiction',
        'profile_missing',
      ],
      [
        'missing property',
        (model: Model) => {
          model.knowledgeRules!.receipt_contradiction.expectations = { missing: 10 }
          return model
        },
        'receipt_contradiction',
        'property_missing_or_non_numeric',
      ],
      [
        'non-numeric property',
        (model: Model) => {
          model.knowledgeRules!.receipt_contradiction.expectations = { label: 10 }
          return model
        },
        'receipt_contradiction',
        'property_missing_or_non_numeric',
      ],
    ] as const)(
      'fails closed for %s',
      (_label, arrange, ruleId, expectedReason) => {
        const fact = evaluateKnowledgeRule(
          knowledgeSession,
          arrange(createKnowledgeRuleModel()),
          ruleId,
        )

        expect(fact.missingReason).toBe(expectedReason)
        expect(fact.noticed).toBe(false)
        expect(fact.anomalies).toEqual([])
        expect(fact.totalDeviation).toBe(0)
      },
    )

    it.each([
      ['inherited rule key', 'toString', 'rule_missing'],
      ['inherited character key', 'constructor', 'character_missing'],
      ['inherited entity key', 'toString', 'entity_missing'],
    ] as const)('does not treat an %s as a model definition', (_label, key, reason) => {
      const model = createKnowledgeRuleModel()
      if (reason === 'character_missing') {
        model.knowledgeRules!.receipt_contradiction.character = key
      } else if (reason === 'entity_missing') {
        model.knowledgeRules!.receipt_contradiction.entity = key
      }

      const fact = evaluateKnowledgeRule(
        knowledgeSession,
        model,
        reason === 'rule_missing' ? key : 'receipt_contradiction',
      )

      expect(fact.missingReason).toBe(reason)
      expect(fact.noticed).toBe(false)
      expect(fact.anomalies).toEqual([])
    })

    it('fails the whole rule when one of multiple expectations is missing', () => {
      const model = createKnowledgeRuleModel()
      model.knowledgeRules!.receipt_contradiction.expectations = {
        credibility: 50,
        missing_property: 10,
      }

      const fact = evaluateKnowledgeRule(
        knowledgeSession,
        model,
        'receipt_contradiction',
      )

      expect(fact.missingReason).toBe('property_missing_or_non_numeric')
      expect(fact.noticed).toBe(false)
      expect(fact.anomalies).toEqual([])
      expect(fact.totalDeviation).toBe(0)
    })

    it('returns equal facts repeatedly and leaves serialized SessionState unchanged', () => {
      const model = createKnowledgeRuleModel()
      const before = serialize(knowledgeSession)

      const first = evaluateKnowledgeRule(
        knowledgeSession,
        model,
        'receipt_contradiction',
      )
      const second = evaluateKnowledgeRule(
        knowledgeSession,
        model,
        'receipt_contradiction',
      )

      expect(second).toEqual(first)
      expect(serialize(knowledgeSession)).toBe(before)
      expect(Object.keys(knowledgeSession.events)).toEqual(['event_existing'])
    })
  })
})
