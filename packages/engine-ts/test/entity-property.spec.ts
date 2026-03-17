import { describe, it, expect } from 'vitest'
import { resolveProperty, getEntityProperties, getInheritanceChain } from '../src/entities'
import type { EntityDef } from '../src/types'

describe('Entity-Property System', () => {
  const entities: Record<string, EntityDef> = {
    physical_object: {
      id: 'physical_object',
      name: 'Physical Object',
      properties: {
        weight: { key: 'weight', type: 'number', defaultValue: 0, rangeMin: 0, rangeMax: 10000 },
        material: { key: 'material', type: 'string', defaultValue: 'unknown' },
        visible: { key: 'visible', type: 'boolean', defaultValue: true },
      },
    },
    food: {
      id: 'food',
      name: 'Food',
      parentEntity: 'physical_object',
      properties: {
        edible: { key: 'edible', type: 'boolean', defaultValue: true },
        calories: { key: 'calories', type: 'number', defaultValue: 0, rangeMin: 0, rangeMax: 5000 },
      },
    },
    cheeseburger: {
      id: 'cheeseburger',
      name: 'Cheeseburger',
      description: 'A classic cheeseburger',
      cost: 5,
      parentEntity: 'food',
      properties: {
        weight: { key: 'weight', type: 'number', defaultValue: 250, rangeMin: 200, rangeMax: 400 },
        calories: { key: 'calories', type: 'number', defaultValue: 350 },
      },
    },
    flat_item: {
      id: 'flat_item',
      name: 'Flat Item',
      description: 'No properties, no parent',
      cost: 10,
    },
  }

  describe('resolveProperty', () => {
    it('should resolve own property', () => {
      const prop = resolveProperty('cheeseburger', 'weight', entities)
      expect(prop).toBeDefined()
      expect(prop!.defaultValue).toBe(250)
      expect(prop!.rangeMin).toBe(200)
    })

    it('should resolve inherited property from parent', () => {
      const prop = resolveProperty('cheeseburger', 'edible', entities)
      expect(prop).toBeDefined()
      expect(prop!.defaultValue).toBe(true)
    })

    it('should resolve inherited property from grandparent', () => {
      const prop = resolveProperty('cheeseburger', 'material', entities)
      expect(prop).toBeDefined()
      expect(prop!.defaultValue).toBe('unknown')
    })

    it('should return undefined for non-existent property', () => {
      expect(resolveProperty('cheeseburger', 'nonexistent', entities)).toBeUndefined()
    })

    it('should return undefined for non-existent entity', () => {
      expect(resolveProperty('nonexistent', 'weight', entities)).toBeUndefined()
    })

    it('should prefer child property over parent', () => {
      // cheeseburger overrides weight (250) from physical_object (0)
      const prop = resolveProperty('cheeseburger', 'weight', entities)
      expect(prop!.defaultValue).toBe(250)
    })

    it('should handle entity without properties', () => {
      expect(resolveProperty('flat_item', 'weight', entities)).toBeUndefined()
    })

    it('should guard against circular inheritance', () => {
      const circular: Record<string, EntityDef> = {
        a: { id: 'a', name: 'A', parentEntity: 'b' },
        b: { id: 'b', name: 'B', parentEntity: 'a' },
      }
      expect(resolveProperty('a', 'x', circular)).toBeUndefined()
    })
  })

  describe('getEntityProperties', () => {
    it('should merge properties from inheritance chain', () => {
      const props = getEntityProperties('cheeseburger', entities)
      expect(Object.keys(props)).toContain('weight')
      expect(Object.keys(props)).toContain('material')
      expect(Object.keys(props)).toContain('visible')
      expect(Object.keys(props)).toContain('edible')
      expect(Object.keys(props)).toContain('calories')
    })

    it('should override parent properties with child values', () => {
      const props = getEntityProperties('cheeseburger', entities)
      expect(props.weight.defaultValue).toBe(250) // child overrides parent (0)
      expect(props.calories.defaultValue).toBe(350) // child overrides parent (0)
    })

    it('should return empty for non-existent entity', () => {
      expect(getEntityProperties('nonexistent', entities)).toEqual({})
    })

    it('should return own properties for entity without parent', () => {
      const props = getEntityProperties('physical_object', entities)
      expect(Object.keys(props)).toEqual(['weight', 'material', 'visible'])
    })

    it('should return empty for flat entity', () => {
      expect(getEntityProperties('flat_item', entities)).toEqual({})
    })

    it('should handle circular inheritance', () => {
      const circular: Record<string, EntityDef> = {
        a: { id: 'a', name: 'A', parentEntity: 'b', properties: { x: { key: 'x', type: 'number' } } },
        b: { id: 'b', name: 'B', parentEntity: 'a', properties: { y: { key: 'y', type: 'string' } } },
      }
      const props = getEntityProperties('a', circular)
      expect(props.x).toBeDefined()
      // b's properties are not included because circular guard stops at 'a'
    })
  })

  describe('getInheritanceChain', () => {
    it('should return full chain', () => {
      const chain = getInheritanceChain('cheeseburger', entities)
      expect(chain).toEqual(['cheeseburger', 'food', 'physical_object'])
    })

    it('should return single-element for root entity', () => {
      expect(getInheritanceChain('physical_object', entities)).toEqual(['physical_object'])
    })

    it('should return single-element for entity without parent', () => {
      expect(getInheritanceChain('flat_item', entities)).toEqual(['flat_item'])
    })

    it('should return empty for non-existent entity', () => {
      expect(getInheritanceChain('nonexistent', entities)).toEqual([])
    })

    it('should handle circular inheritance without infinite loop', () => {
      const circular: Record<string, EntityDef> = {
        a: { id: 'a', name: 'A', parentEntity: 'b' },
        b: { id: 'b', name: 'B', parentEntity: 'a' },
      }
      const chain = getInheritanceChain('a', circular)
      expect(chain).toEqual(['a', 'b'])
    })
  })
})
