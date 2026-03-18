import { describe, it, expect } from 'vitest'
import { expandTemplate, expandTemplateWithTracking } from '../src/template'
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

  describe('Conditional sections {?condition:text}', () => {
    it('should show text when flag is true', () => {
      expect(expandTemplate('{?has_key:You have the key.}', model, session)).toBe('You have the key.')
    })

    it('should hide text when flag is false', () => {
      expect(expandTemplate('{?door_open:The door is open.}', model, session)).toBe('')
    })

    it('should negate with !', () => {
      expect(expandTemplate('{?!door_open:The door is closed.}', model, session)).toBe('The door is closed.')
      expect(expandTemplate('{?!has_key:No key.}', model, session)).toBe('')
    })

    it('should handle resource comparison', () => {
      // gold = 100
      expect(expandTemplate('{?gold>=50:Rich enough.}', model, session)).toBe('Rich enough.')
      expect(expandTemplate('{?gold>=200:Very rich.}', model, session)).toBe('')
      expect(expandTemplate('{?health>50:Healthy.}', model, session)).toBe('Healthy.')
    })

    it('should handle inventory check', () => {
      const withInventory = makeSession({
        ...session,
        inventory: ['sword', 'shield'],
      })
      expect(expandTemplate('{?sword:You have a sword.}', model, withInventory)).toBe('You have a sword.')
      expect(expandTemplate('{?!potion:No potion.}', model, withInventory)).toBe('No potion.')
    })

    it('should expand entity refs inside conditional body', () => {
      expect(expandTemplate('{?has_key:The [sword] glows.}', model, session)).toBe('The Magic Sword glows.')
    })

    it('should handle multiple conditionals', () => {
      const text = '{?has_key:Key found. }{?!door_open:Door locked. }{?gold>=50:Rich.}'
      expect(expandTemplate(text, model, session)).toBe('Key found. Door locked. Rich.')
    })

    it('should leave unknown condition as empty', () => {
      expect(expandTemplate('{?unknown_flag:text}', model, session)).toBe('')
    })
  })

  describe('[entity~] prop_pool syntax', () => {
    const poolModel = makeModel({
      entities: {
        sword: {
          id: 'sword',
          name: 'Iron Sword',
          properties: {
            damage: { key: 'damage', type: 'number', defaultValue: 25 },
            weight: { key: 'weight', type: 'number', defaultValue: 3.5 },
            material: { key: 'material', type: 'string', defaultValue: 'iron' }
          }
        }
      }
    })
    const poolSession = makeSession()

    it('should pick an undescribed property', () => {
      const result = expandTemplateWithTracking('The sword: [sword~]', poolModel, poolSession, {}, 0)
      // seed=0 → index 0 of ['damage','weight','material'] → 'damage'
      expect(result.text).toContain('damage: 25')
      expect(result.descriptionState.sword.describedKeys).toContain('damage')
    })

    it('should track described properties across calls', () => {
      const r1 = expandTemplateWithTracking('[sword~]', poolModel, poolSession, {}, 0)
      // First call describes one key
      expect(r1.descriptionState.sword.describedKeys).toHaveLength(1)

      const r2 = expandTemplateWithTracking('[sword~]', poolModel, poolSession, r1.descriptionState, 0)
      // Second call should pick a different key
      expect(r2.descriptionState.sword.describedKeys).toHaveLength(2)
      expect(r2.text).not.toBe(r1.text)
    })

    it('should cycle back when all properties are described', () => {
      let state = {}
      // Describe all 3 properties
      for (let i = 0; i < 3; i++) {
        const r = expandTemplateWithTracking('[sword~]', poolModel, poolSession, state, i)
        state = r.descriptionState
      }
      expect(Object.keys(state).length).toBe(1)
      expect(state['sword'].describedKeys).toHaveLength(3)

      // Next call should still work (cycles back)
      const r = expandTemplateWithTracking('[sword~]', poolModel, poolSession, state, 0)
      expect(r.text).toBeTruthy()
      expect(r.text).not.toContain('[sword~]')
    })

    it('should leave unknown entity as-is', () => {
      const r = expandTemplateWithTracking('[unknown~]', poolModel, poolSession, {}, 0)
      expect(r.text).toBe('[unknown~]')
    })

    it('should handle entity with no properties', () => {
      const noPropsModel = makeModel({
        entities: { npc: { id: 'npc', name: 'Guard' } }
      })
      const r = expandTemplateWithTracking('[npc~]', noPropsModel, poolSession, {}, 0)
      expect(r.text).toBe('Guard')
    })

    it('should combine with standard template syntax', () => {
      const r = expandTemplateWithTracking(
        'You see [sword~]. {?flag:flagged}',
        poolModel,
        makeSession({ flags: { flag: true } }),
        {},
        0
      )
      expect(r.text).toContain('damage: 25')
      expect(r.text).toContain('flagged')
    })

    it('should use deterministic seed', () => {
      const r0 = expandTemplateWithTracking('[sword~]', poolModel, poolSession, {}, 0)
      const r1 = expandTemplateWithTracking('[sword~]', poolModel, poolSession, {}, 1)
      const r2 = expandTemplateWithTracking('[sword~]', poolModel, poolSession, {}, 2)
      // Different seeds pick different properties
      const texts = new Set([r0.text, r1.text, r2.text])
      expect(texts.size).toBe(3)
    })
  })
})
