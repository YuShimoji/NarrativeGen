import { describe, it, expect } from 'vitest'
import { parseEntitiesCsv } from '../src/entities'

describe('entities csv parsing', () => {
  it('parses id, brand, description including multibyte text', () => {
    const csv = `id,brand,description,cost\nmac_burger_001,MacBurger,これはおいしいチーズバーガーです,100\n`
    const entities = parseEntitiesCsv(csv)
    expect(entities.length).toBe(1)
    const e = entities[0]
    expect(e.id).toBe('mac_burger_001')
    expect(e.brand).toBe('MacBurger')
    expect(e.description).toBe('これはおいしいチーズバーガーです')
    expect(e.cost).toBe(100)
  })
})
