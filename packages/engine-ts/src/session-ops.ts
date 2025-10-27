import type { Choice, Condition, Effect, Model, SessionState } from './types.js'

// Performance optimization: Memoization cache
const conditionCache = new Map<string, boolean>()
const choicesCache = new Map<string, Choice[]>()

// Cache key generation for session state
function getSessionKey(session: SessionState): string {
  return `${session.nodeId}:${session.time}:${JSON.stringify(session.flags)}:${JSON.stringify(session.resources)}`
}

function getConditionKey(cond: Condition, flags: Record<string, boolean>, resources: Record<string, number>, time: number): string {
  return `${JSON.stringify(cond)}:${JSON.stringify(flags)}:${JSON.stringify(resources)}:${time}`
}

function cmp(op: '>=' | '<=' | '>' | '<' | '==', a: number, b: number): boolean {
  switch (op) {
    case '>=':
      return a >= b
    case '<=':
      return a <= b
    case '>':
      return a > b
    case '<':
      return a < b
    case '==':
      return a === b
    default:
      return false
  }
}

function evalCondition(
  cond: Condition,
  flags: Record<string, boolean>,
  resources: Record<string, number>,
  time: number,
): boolean {
  const key = getConditionKey(cond, flags, resources, time)
  if (conditionCache.has(key)) {
    return conditionCache.get(key)!
  }

  let result: boolean
  if (cond.type === 'flag') {
    result = (flags[cond.key] ?? false) === cond.value
  } else if (cond.type === 'resource') {
    const v = resources[cond.key] ?? 0
    result = cmp(cond.op, v, cond.value)
  } else if (cond.type === 'timeWindow') {
    result = time >= cond.start && time <= cond.end
  } else {
    result = true
  }

  // Cache result (limit cache size to prevent memory leaks)
  if (conditionCache.size > 10000) {
    conditionCache.clear()
  }
  conditionCache.set(key, result)

  return result
}

function applyEffect(effect: Effect, session: SessionState): SessionState {
  if (effect.type === 'setFlag') {
    return { ...session, flags: { ...session.flags, [effect.key]: effect.value } }
  }
  if (effect.type === 'addResource') {
    const cur = session.resources[effect.key] ?? 0
    return { ...session, resources: { ...session.resources, [effect.key]: cur + effect.delta } }
  }
  if (effect.type === 'goto') {
    return { ...session, nodeId: effect.target }
  }
  return session
}

export function startSession(model: Model, initial?: Partial<SessionState>): SessionState {
  return {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    time: initial?.time ?? 0,
  }
}

export function getAvailableChoices(session: SessionState, model: Model): Choice[] {
  const sessionKey = getSessionKey(session)
  const cacheKey = `${sessionKey}:${session.nodeId}`

  if (choicesCache.has(cacheKey)) {
    return choicesCache.get(cacheKey)!
  }

  const node = model.nodes[session.nodeId]
  if (!node) return []

  const choices = node.choices ?? []
  const available = choices.filter((c) =>
    (c.conditions ?? []).every((cond) =>
      evalCondition(cond, session.flags, session.resources, session.time),
    ),
  )

  // Cache result (limit cache size)
  if (choicesCache.size > 1000) {
    choicesCache.clear()
  }
  choicesCache.set(cacheKey, available)

  return available
}

export function applyChoice(session: SessionState, model: Model, choiceId: string): SessionState {
  // Validate inputs
  if (!session) {
    throw new Error('Session state is required')
  }
  if (!model) {
    throw new Error('Model is required')
  }
  if (!choiceId) {
    throw new Error('Choice ID is required')
  }

  const node = model.nodes[session.nodeId]
  if (!node) {
    throw new Error(`Node not found: ${session.nodeId}. Available nodes: ${Object.keys(model.nodes).join(', ')}`)
  }

  const choice = (node.choices ?? []).find((c) => c.id === choiceId)
  if (!choice) {
    const availableChoices = (node.choices ?? []).map(c => c.id).join(', ')
    throw new Error(`Choice not found: ${choiceId}. Available choices in node ${session.nodeId}: ${availableChoices}`)
  }

  const available = getAvailableChoices(session, model).some((c) => c.id === choiceId)
  if (!available) {
    const availableIds = getAvailableChoices(session, model).map(c => c.id).join(', ')
    throw new Error(`Choice not available: ${choiceId}. Available choices: ${availableIds}`)
  }

  let next = { ...session }
  for (const eff of choice.effects ?? []) {
    try {
      next = applyEffect(eff, next)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to apply effect ${JSON.stringify(eff)}: ${errorMessage}`)
    }
  }

  if (!choice.effects?.some((e) => e.type === 'goto')) {
    next = { ...next, nodeId: choice.target }
  }

  // Validate target node exists
  if (!model.nodes[next.nodeId]) {
    throw new Error(`Target node not found: ${next.nodeId}. Available nodes: ${Object.keys(model.nodes).join(', ')}`)
  }

  next.time = next.time + 1
  return next
}

export function serialize(session: SessionState): string {
  return JSON.stringify(session)
}

export function deserialize(payload: string): SessionState {
  const parsed: unknown = JSON.parse(payload)
  return parsed as SessionState
}
