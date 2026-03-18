import { describe, it, expect } from 'vitest'
import {
  createSessionHistory,
  pushHistory,
  popHistory,
  canUndo,
  historyDepth,
  clearHistory,
  diffSessionState,
} from '../src/session-history'
import type { SessionState } from '../src/types'

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    nodeId: 'start',
    flags: {},
    resources: {},
    variables: {},
    inventory: [],
    time: 0,
    events: {},
    ...overrides,
  }
}

describe('SessionHistory', () => {
  it('creates empty history', () => {
    const h = createSessionHistory()
    expect(canUndo(h)).toBe(false)
    expect(historyDepth(h)).toBe(0)
  })

  it('pushes and pops states', () => {
    const s1 = makeSession({ nodeId: 'node1' })
    const s2 = makeSession({ nodeId: 'node2' })

    let h = createSessionHistory()
    h = pushHistory(h, s1)
    h = pushHistory(h, s2)
    expect(historyDepth(h)).toBe(2)
    expect(canUndo(h)).toBe(true)

    const result = popHistory(h)!
    expect(result.state.nodeId).toBe('node2')
    expect(historyDepth(result.history)).toBe(1)

    const result2 = popHistory(result.history)!
    expect(result2.state.nodeId).toBe('node1')
    expect(historyDepth(result2.history)).toBe(0)
    expect(canUndo(result2.history)).toBe(false)
  })

  it('returns null when popping empty history', () => {
    const h = createSessionHistory()
    expect(popHistory(h)).toBeNull()
  })

  it('respects maxDepth', () => {
    let h = createSessionHistory(3)
    for (let i = 0; i < 5; i++) {
      h = pushHistory(h, makeSession({ nodeId: `node${i}` }))
    }
    expect(historyDepth(h)).toBe(3)
    // Oldest states should be trimmed
    const result = popHistory(h)!
    expect(result.state.nodeId).toBe('node4')
  })

  it('clears history', () => {
    let h = createSessionHistory()
    h = pushHistory(h, makeSession())
    h = pushHistory(h, makeSession())
    h = clearHistory(h)
    expect(historyDepth(h)).toBe(0)
    expect(canUndo(h)).toBe(false)
  })
})

describe('diffSessionState', () => {
  it('detects flag changes', () => {
    const before = makeSession({ flags: { a: false } })
    const after = makeSession({ flags: { a: true } })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('a: true')
  })

  it('detects resource changes', () => {
    const before = makeSession({ resources: { gold: 50 } })
    const after = makeSession({ resources: { gold: 80 } })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('gold +30')
  })

  it('detects resource decrease', () => {
    const before = makeSession({ resources: { trust: 50 } })
    const after = makeSession({ resources: { trust: 30 } })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('trust -20')
  })

  it('detects variable changes', () => {
    const before = makeSession({ variables: { name: 'unknown' } })
    const after = makeSession({ variables: { name: 'Dr. Hayashi' } })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('name = Dr. Hayashi')
  })

  it('detects inventory changes', () => {
    const before = makeSession({ inventory: [] })
    const after = makeSession({ inventory: ['sword'] })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('+ sword')
  })

  it('detects inventory removal', () => {
    const before = makeSession({ inventory: ['letter'] })
    const after = makeSession({ inventory: [] })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('- letter')
  })

  it('detects event creation', () => {
    const before = makeSession({ events: {} })
    const after = makeSession({
      events: {
        discovery: { id: 'discovery', name: 'Discovery' },
      },
    })
    const diff = diffSessionState(before, after)
    expect(diff).toContain('event: discovery')
  })

  it('returns empty for identical states', () => {
    const state = makeSession({ flags: { a: true }, resources: { gold: 50 } })
    expect(diffSessionState(state, state)).toEqual([])
  })
})
