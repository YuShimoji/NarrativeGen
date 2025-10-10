import { describe, it, expect } from 'vitest'
import type { Model } from '../src/types'
import type { Entity } from '../src/entities'
import { GameSession } from '../src/index'

const model: Model = {
  modelType: 'test-model',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      text: 'start node',
    },
  },
}

const sampleEntities: Entity[] = [
  {
    id: 'mac_burger_001',
    brand: 'MacBurger',
    description: '美味しいハンバーガー',
    cost: 100,
  },
  {
    id: 'coffee_001',
    brand: 'CoffeeStand',
    description: 'ホットコーヒー',
    cost: 50,
  },
]

describe('GameSession', () => {
  it('adds entity from catalog and tracks inventory', () => {
    const session = new GameSession(model, { entities: sampleEntities })

    expect(session.currentNode).toBe('start')
    expect(session.currentTime).toBe(0)

    const picked = session.pickupEntity('mac_burger_001')
    expect(picked).toBeDefined()
    expect(picked?.id).toBe('mac_burger_001')
    expect(session.hasEntity('mac_burger_001')).toBe(true)
    expect(session.listInventory()).toContain('mac_burger_001')

    const time = session.advanceTime(3)
    expect(time).toBe(3)
    expect(session.currentTime).toBe(3)

    const removed = session.removeEntity('mac_burger_001')
    expect(removed).toBe(true)
    expect(session.hasEntity('mac_burger_001')).toBe(false)
  })

  it('supports initial inventory and entity lookup by id', () => {
    const session = new GameSession(model, {
      entities: sampleEntities.reduce<Record<string, Entity>>((acc, ent) => {
        acc[ent.id] = ent
        return acc
      }, {}),
      initialInventory: ['coffee_001'],
      initialSession: {
        time: 5,
      },
    })

    expect(session.currentTime).toBe(5)
    expect(session.hasEntity('coffee_001')).toBe(true)
    expect(session.listInventory()).toEqual(['coffee_001'])

    const entity = session.getEntity('coffee_001')
    expect(entity?.brand).toBe('CoffeeStand')

    const stateSnapshot = session.state
    stateSnapshot.time = 999
    expect(session.currentTime).toBe(5)
  })
})
