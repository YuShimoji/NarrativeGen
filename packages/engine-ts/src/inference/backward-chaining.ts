/**
 * Backward Chaining - Goal-directed path finding
 *
 * Given a goal (reach a specific node), finds a sequence of choices
 * that leads from the current position to the goal.
 */
import type { Model, SessionState } from '../types.js'
import { getAvailableChoices } from '../session-ops.js'

export interface Goal {
  type: 'reachNode'
  nodeId: string
}

export interface PathStep {
  nodeId: string
  choiceId: string
  target: string
}

/**
 * Find a path of choices from startNodeId to goal node.
 * Uses BFS on the model's static graph structure (ignores conditions).
 * Returns null if no path exists within maxDepth.
 */
export function findPathToGoal(
  model: Model,
  startNodeId: string,
  goal: Goal,
  maxDepth: number = 20,
): PathStep[] | null {
  if (goal.type !== 'reachNode') return null
  if (startNodeId === goal.nodeId) return []

  interface QueueItem {
    nodeId: string
    path: PathStep[]
  }

  const queue: QueueItem[] = [{ nodeId: startNodeId, path: [] }]
  const visited = new Set<string>([startNodeId])

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.path.length >= maxDepth) continue

    const node = model.nodes[current.nodeId]
    if (!node?.choices) continue

    for (const choice of node.choices) {
      const target = choice.target
      if (visited.has(target)) continue

      const step: PathStep = {
        nodeId: current.nodeId,
        choiceId: choice.id,
        target,
      }
      const newPath = [...current.path, step]

      if (target === goal.nodeId) return newPath

      visited.add(target)
      queue.push({ nodeId: target, path: newPath })
    }
  }

  return null
}

/**
 * Find all reachable nodes from a given session state,
 * evaluating conditions to determine which choices are actually available.
 * Returns a map of nodeId → path to reach it.
 */
export function findReachableNodes(
  model: Model,
  session: SessionState,
  maxDepth: number = 20,
): Map<string, PathStep[]> {
  const reachable = new Map<string, PathStep[]>()
  reachable.set(session.nodeId, [])

  interface QueueItem {
    session: SessionState
    path: PathStep[]
  }

  const queue: QueueItem[] = [{ session, path: [] }]
  const visited = new Set<string>([session.nodeId])

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.path.length >= maxDepth) continue

    const choices = getAvailableChoices(current.session, model)
    for (const choice of choices) {
      const target = choice.target
      if (visited.has(target)) continue

      const step: PathStep = {
        nodeId: current.session.nodeId,
        choiceId: choice.id,
        target,
      }
      const newPath = [...current.path, step]
      visited.add(target)
      reachable.set(target, newPath)

      const nextSession: SessionState = {
        ...current.session,
        nodeId: target,
        time: current.session.time + 1,
      }
      queue.push({ session: nextSession, path: newPath })
    }
  }

  return reachable
}
