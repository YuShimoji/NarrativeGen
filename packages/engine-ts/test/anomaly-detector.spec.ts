import { describe, it, expect } from 'vitest'
import { detectAnomaly, detectAllAnomalies } from '../src/anomaly-detector'
import type { KnowledgeProfile } from '../src/anomaly-detector'
import type { EntityDef } from '../src/types'

const entities: Record<string, EntityDef> = {
  physical_object: {
    id: 'physical_object',
    name: 'Physical Object',
    properties: {
      weight: { key: 'weight', type: 'number', defaultValue: 0 },
    },
  },
  food: {
    id: 'food',
    name: 'Food',
    parentEntity: 'physical_object',
    properties: {
      calories: { key: 'calories', type: 'number', defaultValue: 0 },
    },
  },
  cheeseburger: {
    id: 'cheeseburger',
    name: 'Cheeseburger',
    parentEntity: 'food',
    properties: {
      weight: { key: 'weight', type: 'number', defaultValue: 250 },
      calories: { key: 'calories', type: 'number', defaultValue: 350 },
    },
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    parentEntity: 'food',
    properties: {
      weight: { key: 'weight', type: 'number', defaultValue: 180 },
    },
  },
  flat_item: {
    id: 'flat_item',
    name: 'Flat Item',
    cost: 10,
  },
}

const detective: KnowledgeProfile = {
  domain: 'modern_products',
  accuracy: 0.9,
  tolerance: 0.1, // ±10%
}

const drunkPerson: KnowledgeProfile = {
  domain: 'general',
  accuracy: 0.3,
  tolerance: 0.3, // ±30%
}

describe('Anomaly Detector', () => {
  describe('detectAnomaly', () => {
    it('should detect no anomaly within tolerance', () => {
      // Expected 250, actual 250, tolerance ±10% (225-275)
      const result = detectAnomaly('cheeseburger', 'weight', 250, detective, entities)
      expect(result).not.toBeNull()
      expect(result!.anomalous).toBe(false)
      expect(result!.deviation).toBe(0)
    })

    it('should detect anomaly outside tolerance', () => {
      // Expected 200, actual 250, tolerance ±10% (180-220), diff=50, tol=20
      const result = detectAnomaly('cheeseburger', 'weight', 200, detective, entities)
      expect(result).not.toBeNull()
      expect(result!.anomalous).toBe(true)
      expect(result!.deviation).toBe(2.5) // 50/20
    })

    it('should be non-anomalous with wide tolerance', () => {
      // Expected 200, actual 250, tolerance ±30% (140-260)
      const result = detectAnomaly('cheeseburger', 'weight', 200, drunkPerson, entities)
      expect(result).not.toBeNull()
      expect(result!.anomalous).toBe(false) // 50/60 < 1
    })

    it('should resolve inherited property', () => {
      // Apple inherits weight=180 from own properties
      const result = detectAnomaly('apple', 'weight', 180, detective, entities)
      expect(result).not.toBeNull()
      expect(result!.deviation).toBe(0)
      expect(result!.actualValue).toBe(180)
    })

    it('should return null for non-existent property', () => {
      expect(detectAnomaly('cheeseburger', 'color', 100, detective, entities)).toBeNull()
    })

    it('should return null for non-existent entity', () => {
      expect(detectAnomaly('nonexistent', 'weight', 100, detective, entities)).toBeNull()
    })

    it('should return null for non-numeric property', () => {
      const withString: Record<string, EntityDef> = {
        item: {
          id: 'item', name: 'Item',
          properties: { color: { key: 'color', type: 'string', defaultValue: 'red' } },
        },
      }
      expect(detectAnomaly('item', 'color', 100, detective, withString)).toBeNull()
    })

    it('should return null for entity without properties', () => {
      expect(detectAnomaly('flat_item', 'weight', 100, detective, entities)).toBeNull()
    })

    it('should include tolerance range in result', () => {
      const result = detectAnomaly('cheeseburger', 'weight', 250, detective, entities)
      expect(result!.toleranceRange[0]).toBeCloseTo(225)
      expect(result!.toleranceRange[1]).toBeCloseTo(275)
    })

    it('should handle zero expected value', () => {
      const result = detectAnomaly('cheeseburger', 'weight', 0, detective, entities)
      expect(result).not.toBeNull()
      // tolerance = 0 * 0.1 = 0, actual = 250, diff = 250
      expect(result!.deviation).toBe(Infinity)
      expect(result!.anomalous).toBe(true)
    })
  })

  describe('detectAllAnomalies', () => {
    it('should detect anomalies for multiple properties', () => {
      const expectations = { weight: 200, calories: 350 }
      const results = detectAllAnomalies('cheeseburger', expectations, detective, entities)
      expect(results).toHaveLength(2)
      expect(results.find(r => r.propertyKey === 'weight')!.anomalous).toBe(true)
      expect(results.find(r => r.propertyKey === 'calories')!.anomalous).toBe(false)
    })

    it('should skip non-existent properties', () => {
      const expectations = { weight: 250, nonexistent: 100 }
      const results = detectAllAnomalies('cheeseburger', expectations, detective, entities)
      expect(results).toHaveLength(1)
    })

    it('should return empty for entity without properties', () => {
      const results = detectAllAnomalies('flat_item', { weight: 100 }, detective, entities)
      expect(results).toEqual([])
    })
  })
})
