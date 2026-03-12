import { applyChoice as applyChoiceOp, getAvailableChoices as getChoices, startSession } from './session-ops.js'
import { Inventory } from './inventory.js'
import type { Entity } from './entities.js'
import type { Choice, ChoiceOutcome, Model, SessionState } from './types.js'

function normalizeId(value: string): string {
  return value.trim().toLowerCase()
}

export interface GameSessionOptions {
  entities?: Entity[]
  initialInventory?: string[]
  choiceOutcomes?: Record<string, ChoiceOutcome>
  initialSession?: Partial<SessionState>
}

export class GameSession {
  private readonly model: Model
  private session: SessionState
  private readonly inventory: Inventory
  private readonly choiceOutcomes: Map<string, ChoiceOutcome>
  private lastAppliedOutcome: ChoiceOutcome | null = null

  constructor(model: Model, options: GameSessionOptions = {}) {
    this.model = model
    const { entities = [], initialInventory = [], choiceOutcomes = {}, initialSession } = options
    this.inventory = new Inventory({ entities, initialItems: initialInventory })
    this.choiceOutcomes = new Map(
      Object.entries(choiceOutcomes).map(([key, value]) => [normalizeId(key), value]),
    )
    this.session = startSession(model, initialSession)
  }

  get state(): SessionState {
    return this.session
  }

  get lastOutcome(): ChoiceOutcome | null {
    return this.lastAppliedOutcome
  }

  listInventory(): Entity[] {
    return this.inventory.list()
  }

  pickupEntity(id: string): Entity | null {
    return this.inventory.add(id)
  }

  removeEntity(id: string): Entity | null {
    return this.inventory.remove(id)
  }

  getAvailableChoices(): Choice[] {
    const available = getChoices(this.session, this.model)
    return available.map((choice) => ({ ...choice, outcome: this.resolveOutcome(choice.id) }))
  }

  applyChoice(choiceId: string): SessionState {
    this.session = applyChoiceOp(this.session, this.model, choiceId)
    const outcome = this.resolveOutcome(choiceId)
    this.applyOutcome(outcome)
    this.lastAppliedOutcome = outcome
    return this.session
  }

  private resolveOutcome(choiceId: string): ChoiceOutcome | null {
    const key = normalizeId(choiceId)
    if (this.choiceOutcomes.has(key)) {
      return this.choiceOutcomes.get(key) ?? null
    }
    const choice = this.findChoiceInModel(choiceId)
    return choice?.outcome ?? null
  }

  private findChoiceInModel(choiceId: string): Choice | undefined {
    const targetId = normalizeId(choiceId)
    for (const node of Object.values(this.model.nodes)) {
      const choice = (node.choices ?? []).find((candidate) => normalizeId(candidate.id) === targetId)
      if (choice) return choice
    }
    return undefined
  }

  private applyOutcome(outcome: ChoiceOutcome | null): void {
    if (!outcome || !outcome.type) {
      return
    }

    switch (outcome.type.toUpperCase()) {
      case 'ADD_ITEM':
        this.inventory.add(outcome.value ?? '')
        break
      case 'REMOVE_ITEM':
        this.inventory.remove(outcome.value ?? '')
        break
      default:
        break
    }
  }
}
