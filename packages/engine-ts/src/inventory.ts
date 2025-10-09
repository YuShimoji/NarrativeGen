export class Inventory {
  private readonly items: Set<string>

  constructor(initialEntries?: Iterable<string>) {
    this.items = new Set(initialEntries ?? [])
  }

  addItem(entityId: string): void {
    if (!entityId) return
    this.items.add(entityId)
  }

  removeItem(entityId: string): boolean {
    if (!entityId) return false
    return this.items.delete(entityId)
  }

  hasItem(entityId: string): boolean {
    if (!entityId) return false
    return this.items.has(entityId)
  }

  clear(): void {
    this.items.clear()
  }

  get size(): number {
    return this.items.size
  }

  toArray(): string[] {
    return Array.from(this.items)
  }
}
