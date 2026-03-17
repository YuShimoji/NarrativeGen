import { describe, it, expect } from 'vitest'
import { expandTemplate } from '../src/template'
import type { Model, SessionState } from '../src/types'

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    nodeId: 'start',
    flags: {},
    resources: {},
    variables: {},
    inventory: [],
    time: 0,
    ...overrides,
  }
}

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    nodes: { start: { id: 'start', text: 'Hello' } },
    ...overrides,
  }
}

describe('expandTemplate', () => {
  const model = makeModel({
    entities: {
      physical_object: {
        id: 'physical_object',
        name: 'Physical Object',
        properties: {
          weight: { key: 'weight', type: 'number', defaultValue: 0 },
          material: { key: 'material', type: 'string', defaultValue: 'unknown' },
        },
      },
      food: {
        id: 'food',
        name: 'Food',
        parentEntity: 'physical_object',
        properties: {
          edible: { key: 'edible', type: 'boolean', defaultValue: true },
        },
      },
      cheeseburger: {
        id: 'cheeseburger',
        name: 'Cheeseburger',
        description: 'A classic cheeseburger with cheese',
        cost: 5,
        parentEntity: 'food',
        properties: {
          weight: { key: 'weight', type: 'number', defaultValue: 250 },
          calories: { key: 'calories', type: 'number', defaultValue: 350 },
        },
      },
      sword: {
        id: 'sword',
        name: 'Magic Sword',
        description: 'An ancient blade',
        cost: 100,
      },
    },
  })

  const session = makeSession({
    variables: { player_name: 'Alice', score: 42 },
    flags: { has_key: true, door_open: false },
    resources: { gold: 100, health: 80 },
  })

  describe('Entity references [entity_id]', () => {
    it('should expand entity name', () => {
      expect(expandTemplate('[cheeseburger]', model, session)).toBe('Cheeseburger')
    })

    it('should expand entity with explicit .name', () => {
      expect(expandTemplate('[sword.name]', model, session)).toBe('Magic Sword')
    })

    it('should expand entity .description', () => {
      expect(expandTemplate('[cheeseburger.description]', model, session))
        .toBe('A classic cheeseburger with cheese')
    })

    it('should expand entity .cost', () => {
      expect(expandTemplate('[sword.cost]', model, session)).toBe('100')
    })

    it('should expand entity .id', () => {
      expect(expandTemplate('[cheeseburger.id]', model, session)).toBe('cheeseburger')
    })

    it('should leave unknown entity as-is', () => {
      expect(expandTemplate('[nonexistent]', model, session)).toBe('[nonexistent]')
    })
  })

  describe('Property resolution [entity.property]', () => {
    it('should resolve own property', () => {
      expect(expandTemplate('[cheeseburger.weight]', model, session)).toBe('250')
    })

    it('should resolve inherited property from parent', () => {
      expect(expandTemplate('[cheeseburger.edible]', model, session)).toBe('true')
    })

    it('should resolve inherited property from grandparent', () => {
      expect(expandTemplate('[cheeseburger.material]', model, session)).toBe('unknown')
    })

    it('should leave unresolved property as-is', () => {
      expect(expandTemplate('[cheeseburger.nonexistent]', model, session))
        .toBe('[cheeseburger.nonexistent]')
    })

    it('should handle entity without properties', () => {
      expect(expandTemplate('[sword.weight]', model, session)).toBe('[sword.weight]')
    })
  })

  describe('Variable references {variable}', () => {
    it('should expand string variable', () => {
      expect(expandTemplate('{player_name}', model, session)).toBe('Alice')
    })

    it('should expand numeric variable', () => {
      expect(expandTemplate('{score}', model, session)).toBe('42')
    })

    it('should expand flag', () => {
      expect(expandTemplate('{has_key}', model, session)).toBe('true')
      expect(expandTemplate('{door_open}', model, session)).toBe('false')
    })

    it('should expand resource', () => {
      expect(expandTemplate('{gold}', model, session)).toBe('100')
    })

    it('should leave unknown variable as-is', () => {
      expect(expandTemplate('{unknown_var}', model, session)).toBe('{unknown_var}')
    })
  })

  describe('Mixed references', () => {
    it('should expand both entity and variable in same text', () => {
      const text = '{player_name} picked up a [sword]. It weighs [cheeseburger.weight]g and costs {gold} gold.'
      const result = expandTemplate(text, model, session)
      expect(result).toBe('Alice picked up a Magic Sword. It weighs 250g and costs 100 gold.')
    })

    it('should handle text with no references', () => {
      expect(expandTemplate('Plain text.', model, session)).toBe('Plain text.')
    })

    it('should handle empty text', () => {
      expect(expandTemplate('', model, session)).toBe('')
    })

    it('should handle null-ish text', () => {
      expect(expandTemplate(undefined as unknown as string, model, session)).toBe(undefined)
    })
  })

  describe('Edge cases', () => {
    it('should work with model without entities', () => {
      const noEntities = makeModel()
      expect(expandTemplate('[foo]', noEntities, session)).toBe('[foo]')
    })

    it('should handle multiple references of same entity', () => {
      expect(expandTemplate('[sword] and [sword]', model, session)).toBe('Magic Sword and Magic Sword')
    })

    it('should not expand nested brackets', () => {
      // [[sword]] → regex captures "[sword" (greedy non-] match) → lookup fails → unchanged
      expect(expandTemplate('[[sword]]', model, session)).toBe('[[sword]]')
    })
  })
})
