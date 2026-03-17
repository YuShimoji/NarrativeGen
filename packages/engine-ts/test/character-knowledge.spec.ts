import { describe, it, expect } from 'vitest'
import { findKnowledgeProfile, perceiveEntity } from '../src/character-knowledge'
import type { CharacterDef } from '../src/character-knowledge'
import type { EntityDef } from '../src/types'

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
})
