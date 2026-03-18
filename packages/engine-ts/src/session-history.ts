import type { SessionState } from './types'

/**
 * Session history for undo/back navigation.
 * Stores immutable snapshots of session state.
 */
export interface SessionHistory {
  /** Stack of previous states (most recent last) */
  states: SessionState[]
  /** Maximum history depth (0 = unlimited) */
  maxDepth: number
}

/**
 * Create a new empty session history.
 */
export function createSessionHistory(maxDepth: number = 100): SessionHistory {
  return { states: [], maxDepth }
}

/**
 * Push current state onto the history stack before transitioning.
 * Returns a new SessionHistory (immutable).
 */
export function pushHistory(
  history: SessionHistory,
  state: SessionState
): SessionHistory {
  const states = [...history.states, state]
  // Trim to maxDepth if needed
  if (history.maxDepth > 0 && states.length > history.maxDepth) {
    states.splice(0, states.length - history.maxDepth)
  }
  return { ...history, states }
}

/**
 * Pop the most recent state from the history stack.
 * Returns the restored state and the updated history.
 * Returns null if history is empty.
 */
export function popHistory(
  history: SessionHistory
): { state: SessionState; history: SessionHistory } | null {
  if (history.states.length === 0) return null
  const states = [...history.states]
  const state = states.pop()!
  return { state, history: { ...history, states } }
}

/**
 * Check if undo is possible.
 */
export function canUndo(history: SessionHistory): boolean {
  return history.states.length > 0
}

/**
 * Get the number of states in history.
 */
export function historyDepth(history: SessionHistory): number {
  return history.states.length
}

/**
 * Clear all history.
 */
export function clearHistory(history: SessionHistory): SessionHistory {
  return { ...history, states: [] }
}

/**
 * Compute the diff between two session states.
 * Returns an array of human-readable change descriptions.
 */
export function diffSessionState(
  before: SessionState,
  after: SessionState
): string[] {
  const changes: string[] = []

  // Flags
  for (const [key, val] of Object.entries(after.flags)) {
    if (before.flags[key] !== val) {
      changes.push(`${key}: ${val}`)
    }
  }

  // Resources
  for (const [key, val] of Object.entries(after.resources)) {
    const prev = before.resources[key] ?? 0
    if (prev !== val) {
      const delta = val - prev
      changes.push(`${key} ${delta >= 0 ? '+' : ''}${delta}`)
    }
  }

  // Variables
  for (const [key, val] of Object.entries(after.variables)) {
    if (before.variables[key] !== val) {
      changes.push(`${key} = ${val}`)
    }
  }

  // Inventory
  const prevInv = new Set(before.inventory)
  const nextInv = new Set(after.inventory)
  for (const item of nextInv) {
    if (!prevInv.has(item)) changes.push(`+ ${item}`)
  }
  for (const item of prevInv) {
    if (!nextInv.has(item)) changes.push(`- ${item}`)
  }

  // Events
  const prevEvents = Object.keys(before.events ?? {})
  const nextEvents = Object.keys(after.events ?? {})
  for (const id of nextEvents) {
    if (!prevEvents.includes(id)) changes.push(`event: ${id}`)
  }

  return changes
}
