import { describe, expect, it } from 'vitest'

import type { Entity } from '../src/entities'
import type { Model } from '../src/types'
import { GameSession } from '../src/game-session'

const entities: Entity[] = [
  { id: 'mac_burger_001', brand: 'MacBurger', description: 'おいしいバーガー', cost: 100 },
  { id: 'coffee_001', brand: 'CoffeeStand', description: '香り高いコーヒー', cost: 50 },
]

const model: Model = {
  modelType: 'test-model',
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      text: '開始地点',
      choices: [
        {
          id: 'advance_with_item',
          text: 'アイテム取得して進む',
          target: 'next',
          outcome: { type: 'ADD_ITEM', value: 'mac_burger_001' },
        },
        {
          id: 'advance_without_item',
          text: 'そのまま進む',
          target: 'next',
        },
      ],
    },
    next: {
      id: 'next',
      text: '次のノード',
    },
  },
}

describe('GameSession', () => {
  it('lists available choices with resolved outcomes', () => {
    const session = new GameSession(model, { entities })

    const choices = session.getAvailableChoices()
    expect(choices).toHaveLength(2)
    const choiceWithOutcome = choices.find((choice) => choice.id === 'advance_with_item')
    expect(choiceWithOutcome?.outcome?.type).toBe('ADD_ITEM')
  })

  it('applies choice and outcome, updating inventory', () => {
    const session = new GameSession(model, { entities })

    session.applyChoice('advance_with_item')

    expect(session.state.nodeId).toBe('next')
    expect(session.listInventory()).toHaveLength(1)
    expect(session.listInventory()[0]?.id).toBe('mac_burger_001')
    expect(session.lastOutcome?.type).toBe('ADD_ITEM')
  })

  it('falls back to outcome map if provided', () => {
    const session = new GameSession(model, {
      entities,
      choiceOutcomes: {
        advance_without_item: { type: 'ADD_ITEM', value: 'coffee_001' },
      },
    })

    session.applyChoice('advance_without_item')

    expect(session.listInventory()).toHaveLength(1)
    expect(session.listInventory()[0]?.id).toBe('coffee_001')
  })
})
