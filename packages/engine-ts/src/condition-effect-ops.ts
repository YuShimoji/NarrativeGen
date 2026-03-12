/**
 * Shared condition evaluation and effect application logic.
 * Used by session-ops.ts, index.ts, and browser.ts.
 */
import type {
  Condition,
  Effect,
  FlagState,
  ResourceState,
  SessionState,
  VariableState,
} from './types'

export function cmp(op: '>=' | '<=' | '>' | '<' | '==', a: number, b: number): boolean {
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
  }
}

export function evalCondition(
  cond: Condition,
  flags: FlagState,
  resources: ResourceState,
  variables: VariableState,
  time: number,
  inventory: string[] = [],
): boolean {
  if (cond.type === 'flag') {
    return (flags[cond.key] ?? false) === cond.value
  }
  if (cond.type === 'resource') {
    const v = resources[cond.key] ?? 0
    return cmp(cond.op, v, cond.value)
  }
  if (cond.type === 'variable') {
    const v = variables[cond.key] ?? ''
    switch (cond.op) {
      case '==':
        return v === cond.value
      case '!=':
        return v !== cond.value
      case 'contains':
        return typeof v === 'string' && typeof cond.value === 'string'
          ? v.includes(cond.value)
          : false
      case '!contains':
        return typeof v === 'string' && typeof cond.value === 'string'
          ? !v.includes(cond.value)
          : true
      case '>=':
      case '<=':
      case '>':
      case '<':
        return typeof v === 'number' && typeof cond.value === 'number'
          ? cmp(cond.op, v, cond.value)
          : false
      default:
        return false
    }
  }
  if (cond.type === 'hasItem') {
    const has = inventory.some(id => id.toLowerCase() === cond.key.toLowerCase())
    return has === cond.value
  }
  if (cond.type === 'timeWindow') {
    return time >= cond.start && time <= cond.end
  }
  if (cond.type === 'and') {
    return cond.conditions.every(c => evalCondition(c, flags, resources, variables, time, inventory))
  }
  if (cond.type === 'or') {
    return cond.conditions.some(c => evalCondition(c, flags, resources, variables, time, inventory))
  }
  if (cond.type === 'not') {
    return !evalCondition(cond.condition, flags, resources, variables, time, inventory)
  }
  return true
}

export function applyEffect(effect: Effect, session: SessionState): SessionState {
  if (effect.type === 'setFlag') {
    return { ...session, flags: { ...session.flags, [effect.key]: effect.value } }
  }
  if (effect.type === 'addResource') {
    const cur = session.resources[effect.key] ?? 0
    return { ...session, resources: { ...session.resources, [effect.key]: cur + effect.delta } }
  }
  if (effect.type === 'setVariable') {
    return { ...session, variables: { ...session.variables, [effect.key]: effect.value } }
  }
  if (effect.type === 'modifyVariable') {
    const cur = session.variables[effect.key]
    const numCur = typeof cur === 'number' ? cur : 0
    let result: number
    switch (effect.op) {
      case '+': result = numCur + effect.value; break
      case '-': result = numCur - effect.value; break
      case '*': result = numCur * effect.value; break
      case '/': result = effect.value !== 0 ? numCur / effect.value : numCur; break
      default: result = numCur
    }
    return { ...session, variables: { ...session.variables, [effect.key]: result } }
  }
  if (effect.type === 'addItem') {
    const inv = session.inventory ?? []
    if (inv.some(id => id.toLowerCase() === effect.key.toLowerCase())) {
      return session
    }
    return { ...session, inventory: [...inv, effect.key] }
  }
  if (effect.type === 'removeItem') {
    const inv = session.inventory ?? []
    const idx = inv.findIndex(id => id.toLowerCase() === effect.key.toLowerCase())
    if (idx === -1) return session
    const next = [...inv]
    next.splice(idx, 1)
    return { ...session, inventory: next }
  }
  if (effect.type === 'goto') {
    return { ...session, nodeId: effect.target }
  }
  return session
}
