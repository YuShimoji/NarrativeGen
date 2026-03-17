import { describe, it, expect, beforeAll } from 'vitest'
import { registerBuiltins } from '../src/inference/registry.js'
import {
  buildDependencyGraph,
  getAffectedChoices,
  applyChoiceWithForwardChaining,
} from '../src/inference/forward-chaining.js'
import { findPathToGoal, findReachableNodes } from '../src/inference/backward-chaining.js'
import { getSupportedConditions, getSupportedEffects } from '../src/inference/capabilities.js'
import { startSession } from '../src/session-ops.js'
import type { Model } from '../src/types.js'

beforeAll(() => {
  registerBuiltins()
})

// --- Test Model ---
const testModel: Model = {
  modelType: 'adventure-playthrough',
  startNode: 'start',
  flags: { hasKey: false },
  resources: { gold: 0 },
  nodes: {
    start: {
      id: 'start',
      text: 'You are at the entrance.',
      choices: [
        {
          id: 'go-cave',
          text: 'Enter cave',
          target: 'cave',
          effects: [{ type: 'setFlag', key: 'visitedCave', value: true }],
        },
        {
          id: 'go-shop',
          text: 'Visit shop',
          target: 'shop',
        },
      ],
    },
    cave: {
      id: 'cave',
      text: 'A dark cave.',
      choices: [
        {
          id: 'find-key',
          text: 'Search for key',
          target: 'cave',
          effects: [
            { type: 'setFlag', key: 'hasKey', value: true },
            { type: 'addResource', key: 'gold', delta: 10 },
          ],
        },
        {
          id: 'go-door',
          text: 'Go to locked door',
          target: 'door',
          conditions: [{ type: 'flag', key: 'hasKey', value: true }],
        },
        { id: 'back-start', text: 'Go back', target: 'start' },
      ],
    },
    shop: {
      id: 'shop',
      text: 'A shop.',
      choices: [
        {
          id: 'buy-sword',
          text: 'Buy sword',
          target: 'shop',
          conditions: [{ type: 'resource', key: 'gold', op: '>=', value: 5 }],
          effects: [{ type: 'addResource', key: 'gold', delta: -5 }],
        },
        { id: 'back-start-2', text: 'Go back', target: 'start' },
      ],
    },
    door: {
      id: 'door',
      text: 'A locked door.',
      choices: [
        { id: 'open-door', text: 'Open door', target: 'treasure' },
      ],
    },
    treasure: {
      id: 'treasure',
      text: 'You found treasure!',
      choices: [],
    },
  },
}

// ===== Forward Chaining Tests =====

describe('Forward Chaining', () => {
  describe('buildDependencyGraph', () => {
    it('should map state keys to dependent choices', () => {
      const depGraph = buildDependencyGraph(testModel)

      // "go-door" depends on flag:hasKey
      const hasKeyDeps = depGraph.stateToChoices.get('flag:hasKey')
      expect(hasKeyDeps).toBeDefined()
      expect(hasKeyDeps!.has('cave:go-door')).toBe(true)

      // "buy-sword" depends on resource:gold
      const goldDeps = depGraph.stateToChoices.get('resource:gold')
      expect(goldDeps).toBeDefined()
      expect(goldDeps!.has('shop:buy-sword')).toBe(true)
    })

    it('should map choices to their effect targets', () => {
      const depGraph = buildDependencyGraph(testModel)

      // "find-key" affects flag:hasKey and resource:gold
      const findKeyEffects = depGraph.choiceToAffectedKeys.get('cave:find-key')
      expect(findKeyEffects).toBeDefined()
      expect(findKeyEffects!.has('flag:hasKey')).toBe(true)
      expect(findKeyEffects!.has('resource:gold')).toBe(true)
    })

    it('should handle model with no conditions or effects', () => {
      const simpleModel: Model = {
        modelType: 'adventure-playthrough',
        startNode: 'a',
        nodes: {
          a: { id: 'a', choices: [{ id: 'c1', text: 'Go', target: 'b' }] },
          b: { id: 'b', choices: [] },
        },
      }
      const depGraph = buildDependencyGraph(simpleModel)
      expect(depGraph.stateToChoices.size).toBe(0)
      expect(depGraph.choiceToAffectedKeys.size).toBe(0)
    })
  })

  describe('getAffectedChoices', () => {
    it('should return choices affected by given effects', () => {
      const depGraph = buildDependencyGraph(testModel)
      const affected = getAffectedChoices(depGraph, [
        { type: 'setFlag', key: 'hasKey', value: true },
      ])
      expect(affected).toContain('cave:go-door')
    })

    it('should return choices affected by resource changes', () => {
      const depGraph = buildDependencyGraph(testModel)
      const affected = getAffectedChoices(depGraph, [
        { type: 'addResource', key: 'gold', delta: 10 },
      ])
      expect(affected).toContain('shop:buy-sword')
    })

    it('should return empty array for effects with no dependents', () => {
      const depGraph = buildDependencyGraph(testModel)
      const affected = getAffectedChoices(depGraph, [
        { type: 'setFlag', key: 'unknownFlag', value: true },
      ])
      expect(affected).toEqual([])
    })
  })

  describe('applyChoiceWithForwardChaining', () => {
    it('should apply choice and return affected choices', () => {
      const depGraph = buildDependencyGraph(testModel)
      const session = startSession(testModel)

      // Go to cave first
      const caveSession = { ...session, nodeId: 'cave' }

      // Find key (sets hasKey=true, adds gold)
      const result = applyChoiceWithForwardChaining(
        caveSession,
        testModel,
        'find-key',
        depGraph,
      )

      expect(result.session.flags.hasKey).toBe(true)
      expect(result.session.resources.gold).toBe(10)
      expect(result.affectedChoices).toContain('cave:go-door')
      expect(result.affectedChoices).toContain('shop:buy-sword')
    })
  })
})

// ===== Backward Chaining Tests =====

describe('Backward Chaining', () => {
  describe('findPathToGoal', () => {
    it('should find a path to the goal node', () => {
      const path = findPathToGoal(testModel, 'start', {
        type: 'reachNode',
        nodeId: 'treasure',
      })
      expect(path).not.toBeNull()
      expect(path!.length).toBeGreaterThan(0)
      expect(path![path!.length - 1].target).toBe('treasure')
    })

    it('should return empty array when already at goal', () => {
      const path = findPathToGoal(testModel, 'treasure', {
        type: 'reachNode',
        nodeId: 'treasure',
      })
      expect(path).toEqual([])
    })

    it('should return null when no path exists', () => {
      const isolatedModel: Model = {
        modelType: 'adventure-playthrough',
        startNode: 'a',
        nodes: {
          a: { id: 'a', choices: [{ id: 'c1', text: 'Go', target: 'b' }] },
          b: { id: 'b', choices: [] },
          c: { id: 'c', choices: [] },
        },
      }
      const path = findPathToGoal(isolatedModel, 'a', {
        type: 'reachNode',
        nodeId: 'c',
      })
      expect(path).toBeNull()
    })

    it('should respect maxDepth', () => {
      const path = findPathToGoal(
        testModel,
        'start',
        { type: 'reachNode', nodeId: 'treasure' },
        1, // too shallow
      )
      // Path to treasure requires at least 3 steps
      expect(path).toBeNull()
    })

    it('should find shortest path via BFS', () => {
      const path = findPathToGoal(testModel, 'cave', {
        type: 'reachNode',
        nodeId: 'treasure',
      })
      // cave → door → treasure (via go-door + open-door)
      expect(path).not.toBeNull()
      expect(path!.length).toBe(2)
      expect(path![0].target).toBe('door')
      expect(path![1].target).toBe('treasure')
    })
  })

  describe('findReachableNodes', () => {
    it('should find all reachable nodes without conditions blocking', () => {
      const session = startSession(testModel)
      const reachable = findReachableNodes(testModel, session)

      // start, cave, shop are reachable without conditions
      expect(reachable.has('start')).toBe(true)
      expect(reachable.has('cave')).toBe(true)
      expect(reachable.has('shop')).toBe(true)
    })

    it('should not reach nodes behind unmet conditions', () => {
      const session = startSession(testModel)
      const reachable = findReachableNodes(testModel, session)

      // door requires hasKey=true, which is false initially
      // door should not be reachable from cave since go-door condition fails
      // However, start can reach cave and shop, from cave back to start...
      // The key is that go-door requires hasKey which is false
      expect(reachable.has('door')).toBe(false)
      expect(reachable.has('treasure')).toBe(false)
    })

    it('should respect maxDepth', () => {
      const session = startSession(testModel)
      const reachable = findReachableNodes(testModel, session, 1)

      // At depth 1, only direct neighbors
      expect(reachable.has('start')).toBe(true)
      expect(reachable.has('cave')).toBe(true)
      expect(reachable.has('shop')).toBe(true)
    })
  })
})

// ===== Capabilities Tests =====

describe('Capabilities', () => {
  it('should list all registered condition types', () => {
    const conditions = getSupportedConditions()
    expect(conditions).toContain('flag')
    expect(conditions).toContain('resource')
    expect(conditions).toContain('variable')
    expect(conditions).toContain('hasItem')
    expect(conditions).toContain('timeWindow')
    expect(conditions).toContain('and')
    expect(conditions).toContain('or')
    expect(conditions).toContain('not')
    expect(conditions).toContain('property')
    expect(conditions.length).toBe(9)
  })

  it('should list all registered effect types', () => {
    const effects = getSupportedEffects()
    expect(effects).toContain('setFlag')
    expect(effects).toContain('addResource')
    expect(effects).toContain('setVariable')
    expect(effects).toContain('modifyVariable')
    expect(effects).toContain('addItem')
    expect(effects).toContain('removeItem')
    expect(effects).toContain('goto')
    expect(effects.length).toBe(7)
  })
})
