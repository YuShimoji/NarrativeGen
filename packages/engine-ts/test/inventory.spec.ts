import { describe, expect, it } from 'vitest'

import type { Entity } from '../src/entities'
import { Inventory } from '../src/inventory'

const entities: Entity[] = [
  { id: 'mac_burger_001', brand: 'MacBurger', description: 'おいしいバーガー', cost: 100 },
  { id: 'coffee_001', brand: 'CoffeeStand', description: '香り高いコーヒー', cost: 50 },
]

describe('Inventory', () => {
  it('adds unique items and ignores duplicates', () => {
    const inventory = new Inventory({ entities })

    const firstAdd = inventory.add('mac_burger_001')
    expect(firstAdd?.id).toBe('mac_burger_001')

    const duplicateAdd = inventory.add('mac_burger_001')
    expect(duplicateAdd?.id).toBe('mac_burger_001')
    expect(inventory.list()).toHaveLength(1)
  })

  it('removes items and returns entity', () => {
    const inventory = new Inventory({ entities, initialItems: ['mac_burger_001'] })

    const removed = inventory.remove('mac_burger_001')
    expect(removed?.id).toBe('mac_burger_001')
    expect(inventory.list()).toHaveLength(0)
  })

  it('has() reflects stored items', () => {
    const inventory = new Inventory({ entities })

    inventory.add('coffee_001')
    expect(inventory.has('coffee_001')).toBe(true)
    expect(inventory.has('unknown')).toBe(false)
  })

  it('list() returns entity objects in insertion order', () => {
    const inventory = new Inventory({ entities })

    inventory.add('mac_burger_001')
    inventory.add('coffee_001')
    const list = inventory.list()
    expect(list).toHaveLength(2)
    expect(list[0]?.id).toBe('mac_burger_001')
    expect(list[1]?.id).toBe('coffee_001')
  })

  it('toJSON() returns raw id array', () => {
    const inventory = new Inventory({ entities, initialItems: ['coffee_001'] })

    expect(inventory.toJSON()).toEqual(['coffee_001'])
  })
})
