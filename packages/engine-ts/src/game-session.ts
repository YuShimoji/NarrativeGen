import type { Model, SessionState } from './types'
import type { Entity } from './entities'
import { Inventory } from './inventory'

export interface GameSessionOptions {
  entities?: Record<string, Entity> | Entity[]
  initialSession?: Partial<SessionState>
  initialInventory?: Iterable<string>
}

function cloneSession(session: SessionState): SessionState {
  return {
    nodeId: session.nodeId,
    time: session.time,
    flags: { ...session.flags },
    resources: { ...session.resources },
  }
}

export class GameSession {
  readonly model: Model
  private session: SessionState
  readonly inventory: Inventory
  private readonly entityIndex: Record<string, Entity>

  constructor(model: Model, options: GameSessionOptions = {}) {
    this.model = model
    this.session = {
      nodeId: options.initialSession?.nodeId ?? model.startNode,
      flags: { ...(model.flags ?? {}), ...(options.initialSession?.flags ?? {}) },
      resources: { ...(model.resources ?? {}), ...(options.initialSession?.resources ?? {}) },
      time: options.initialSession?.time ?? 0,
    }
    this.inventory = new Inventory(options.initialInventory)
    this.entityIndex = normalizeEntities(options.entities)
  }

  get state(): SessionState {
    return cloneSession(this.session)
  }

  get currentNode(): string {
    return this.session.nodeId
  }

  get currentTime(): number {
    return this.session.time
  }

  advanceTime(delta = 1): number {
    if (delta <= 0) return this.session.time
    this.session = { ...this.session, time: this.session.time + delta }
    return this.session.time
  }

  addEntityById(entityId: string): boolean {
    return this.pickupEntity(entityId) !== undefined
  }

  pickupEntity(entityId: string): Entity | undefined {
    if (!entityId) return undefined
    const entity = this.entityIndex[entityId]
    if (!entity) return undefined
    this.inventory.addItem(entityId)
    return entity
  }

  hasEntity(entityId: string): boolean {
    if (!entityId) return false
    return this.inventory.hasItem(entityId)
  }

  removeEntity(entityId: string): boolean {
    if (!entityId) return false
    return this.inventory.removeItem(entityId)
  }

  getEntity(entityId: string): Entity | undefined {
    if (!entityId) return undefined
    return this.entityIndex[entityId]
  }

  listInventory(): string[] {
    return this.inventory.toArray()
  }
}

function normalizeEntities(input?: Record<string, Entity> | Entity[]): Record<string, Entity> {
  if (!input) return {}
  if (Array.isArray(input)) {
    const map: Record<string, Entity> = {}
    for (const ent of input) {
      if (ent?.id) map[ent.id] = ent
    }
    return map
  }
  return { ...input }
}
