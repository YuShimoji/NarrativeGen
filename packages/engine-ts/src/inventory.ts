import type { Entity } from './entities.js'

export interface InventoryOptions {
  entities?: Entity[]
  initialItems?: string[]
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase()
}

export class Inventory {
  private readonly entityMap: Map<string, Entity>
  private readonly items: string[]

  constructor(options: InventoryOptions = {}) {
    const { entities = [], initialItems = [] } = options
    this.entityMap = new Map(entities.map((entity) => [normalizeId(entity.id), entity]))
    this.items = []
    for (const id of initialItems) {
      this.add(id)
    }
  }

  add(id: string | null | undefined): Entity | null {
    if (!id) return null
    const key = normalizeId(id)
    const entity = this.entityMap.get(key)
    if (!entity) return null
    if (this.items.some((storedId) => normalizeId(storedId) === key)) {
      return entity
    }
    this.items.push(entity.id)
    return entity
  }

  remove(id: string | null | undefined): Entity | null {
    if (!id) return null
    const key = normalizeId(id)
    const index = this.items.findIndex((storedId) => normalizeId(storedId) === key)
    if (index === -1) return null
    const [removedId] = this.items.splice(index, 1)
    return this.entityMap.get(normalizeId(removedId)) ?? null
  }

  has(id: string | null | undefined): boolean {
    if (!id) return false
    const key = normalizeId(id)
    return this.items.some((storedId) => normalizeId(storedId) === key)
  }

  list(): Entity[] {
    return this.items
      .map((storedId) => this.entityMap.get(normalizeId(storedId)))
      .filter((entity): entity is Entity => Boolean(entity))
  }

  clear(): void {
    this.items.length = 0
  }

  toJSON(): string[] {
    return [...this.items]
  }
}
