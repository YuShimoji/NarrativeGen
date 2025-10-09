import { describe, it, expect } from 'vitest'
import { Inventory } from '../src/inventory'

describe('Inventory', () => {
  it('addItem / hasItem / removeItem work as expected', () => {
    const inv = new Inventory()
    expect(inv.size).toBe(0)

    inv.addItem('mac_burger_001')
    expect(inv.size).toBe(1)
    expect(inv.hasItem('mac_burger_001')).toBe(true)

    expect(inv.hasItem('unknown')).toBe(false)

    const removed = inv.removeItem('mac_burger_001')
    expect(removed).toBe(true)
    expect(inv.hasItem('mac_burger_001')).toBe(false)
    expect(inv.size).toBe(0)
  })

  it('ignores empty strings gracefully', () => {
    const inv = new Inventory()
    inv.addItem('')
    expect(inv.size).toBe(0)
    expect(inv.hasItem('')).toBe(false)
  })

  it('can be initialised with entries', () => {
    const inv = new Inventory(['a', 'b'])
    expect(inv.size).toBe(2)
    expect(inv.hasItem('a')).toBe(true)
    expect(inv.hasItem('b')).toBe(true)
  })
})
