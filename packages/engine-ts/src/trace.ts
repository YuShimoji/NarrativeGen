/**
 * Engine trace (SP-TRACE-001).
 *
 * Read-only records of what the deterministic engine decided and why.
 * Every fact here is produced by the same functions the runtime uses
 * (expandTemplateCore, evalCondition, perceiveEntity, findMatchingTemplates,
 * applyChoice). This module never changes semantics and never mutates its inputs.
 * Wording for people belongs to the consumer (the Studio), not to the engine.
 */
import type { Choice, Condition, Effect, EntityDef, Model, PerceptionPolicy, SessionState } from './types'
import { evalCondition } from './condition-effect-ops.js'
import { applyLegacySessionPlaceholders, expandTemplateCore } from './template.js'
import { resolveNarrativeDisplayText } from './narrative-display-text.js'
import { findMatchingTemplates } from './conversation-templates.js'
import type { ConversationTemplate } from './conversation-templates.js'
import { evaluateKnowledgeRule, perceiveEntity } from './character-knowledge.js'
import type { KnowledgeEvaluationFact } from './character-knowledge.js'
import type { AnomalyResult } from './anomaly-detector.js'
import { getInheritanceChain } from './entities.js'
import { applyChoice, getAvailableChoices, startSession } from './session-ops.js'

// ---------------------------------------------------------------------------
// Text

export type TextSegment =
  | { kind: 'literal'; text: string }
  | {
      kind: 'entity'
      text: string
      ref: string
      entityId: string
      property?: string
      /** where the entity came from */
      source: 'entity' | 'event' | 'unresolved'
      /** ancestor entity that actually supplied the property value */
      suppliedBy?: string
    }
  | { kind: 'value'; text: string; key: string; source: 'variable' | 'flag' | 'resource' | 'unresolved' }
  | {
      kind: 'conditional'
      text: string
      condition: string
      negate: boolean
      shown: boolean
      /** current value the condition read, for display only */
      observed?: string | number | boolean
      children: TextSegment[]
    }
  | { kind: 'template'; text: string; templateId: string; children: TextSegment[] }

export interface TextTrace {
  /** exactly what resolveNarrativeDisplayText returns */
  text: string
  segments: TextSegment[]
  /** true when the segments concatenate to `text`; false means show `text` only */
  exact: boolean
}

const TOKEN = /\{\?(!?)([^:}]+):([^}]*)\}|\[([^\]]+)\]|\{([^?}][^}]*)\}/g

function segmentText(text: string, model: Model, session: SessionState): TextSegment[] {
  const out: TextSegment[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0
    if (start > last) out.push({ kind: 'literal', text: text.slice(last, start) })
    last = start + m[0].length
    const rendered = expandTemplateCore(m[0], model, session)
    if (m[2] !== undefined) {
      const condition = m[2]
      const negate = m[1] === '!'
      const shown = rendered !== ''
      out.push({
        kind: 'conditional',
        text: rendered,
        condition,
        negate,
        shown,
        observed: observeConditionKey(condition, session),
        children: shown ? segmentText(m[3] ?? '', model, session) : [],
      })
    } else if (m[4] !== undefined) {
      out.push(entitySegment(m[4], rendered, model, session))
    } else if (m[5] !== undefined) {
      const key = m[5]
      const source = session.variables && key in session.variables
        ? 'variable'
        : session.flags && key in session.flags
          ? 'flag'
          : session.resources && key in session.resources
            ? 'resource'
            : 'unresolved'
      out.push({ kind: 'value', text: rendered, key, source })
    }
  }
  if (last < text.length) out.push({ kind: 'literal', text: text.slice(last) })
  return out
}

function entitySegment(ref: string, rendered: string, model: Model, session: SessionState): TextSegment {
  const dot = ref.indexOf('.')
  const entityId = dot === -1 ? ref : ref.slice(0, dot)
  const property = dot === -1 ? undefined : ref.slice(dot + 1)
  const isStatic = Boolean(model.entities?.[entityId])
  const isEvent = !isStatic && Boolean(session.events?.[entityId])
  const unresolved = rendered === `[${ref}]`
  const source = unresolved ? 'unresolved' : isStatic ? 'entity' : isEvent ? 'event' : 'unresolved'
  let suppliedBy: string | undefined
  if (isStatic && property && model.entities && !unresolved) {
    suppliedBy = getInheritanceChain(entityId, model.entities)
      .find((id) => model.entities?.[id]?.properties?.[property]?.defaultValue !== undefined)
  }
  return { kind: 'entity', text: rendered, ref, entityId, property, source, suppliedBy }
}

function observeConditionKey(cond: string, session: SessionState): string | number | boolean | undefined {
  const key = cond.match(/^(\w+)(>=|<=|>|<|==|!=)/)?.[1] ?? cond
  if (session.resources && key in session.resources) return session.resources[key]
  if (session.flags && key in session.flags) return session.flags[key]
  if (session.variables && key in session.variables) return session.variables[key]
  if (session.inventory?.includes(key)) return true
  return undefined
}

function flatten(segments: TextSegment[]): string {
  return segments.map((s) => s.text).join('')
}

export function traceText(rawText: string, model: Model, session: SessionState): TextTrace {
  const text = resolveNarrativeDisplayText(rawText, model, session)
  if (!rawText) return { text: text ?? '', segments: [], exact: true }
  const segments = segmentText(applyLegacySessionPlaceholders(rawText, session), model, session)
  const matches = model.conversationTemplates?.length
    ? findMatchingTemplates(model.conversationTemplates, session, model)
    : []
  for (const match of matches) {
    const template = model.conversationTemplates?.find((t) => t.id === match.templateId)
    const children = template
      ? segmentText(applyLegacySessionPlaceholders(template.text, session), model, session)
      : [{ kind: 'literal' as const, text: match.expandedText }]
    segments.push({ kind: 'literal', text: ' ' })
    segments.push({ kind: 'template', text: match.expandedText, templateId: match.templateId, children })
  }
  return { text, segments, exact: flatten(segments) === text }
}

// ---------------------------------------------------------------------------
// Conditions and choices

export interface ConditionTrace {
  condition: Condition
  passed: boolean
  /** value the engine read; undefined means "not set" */
  actual?: string | number | boolean | string[]
  children?: ConditionTrace[]
  knowledge?: KnowledgeEvaluationFact
}

export function traceCondition(cond: Condition, session: SessionState, model: Model): ConditionTrace {
  const passed = evalCondition(
    cond,
    session.flags,
    session.resources,
    session.variables,
    session.time,
    session.inventory,
    session.events ?? {},
    model,
    session,
  )
  switch (cond.type) {
    case 'and':
    case 'or':
      return { condition: cond, passed, children: cond.conditions.map((c) => traceCondition(c, session, model)) }
    case 'not':
      return { condition: cond, passed, children: [traceCondition(cond.condition, session, model)] }
    case 'flag':
      return { condition: cond, passed, actual: session.flags[cond.key] }
    case 'resource':
      return { condition: cond, passed, actual: session.resources[cond.key] }
    case 'variable':
      return { condition: cond, passed, actual: session.variables[cond.key] }
    case 'hasItem':
      return { condition: cond, passed, actual: session.inventory.includes(cond.key) }
    case 'hasEvent':
      return { condition: cond, passed, actual: Boolean(session.events?.[cond.key]) }
    case 'timeWindow':
      return { condition: cond, passed, actual: session.time }
    case 'property':
      return { condition: cond, passed }
    case 'knowledgeRule':
      return { condition: cond, passed, knowledge: evaluateKnowledgeRule(session, model, cond.rule) }
  }
}

export interface ChoiceTrace {
  choice: Choice
  available: boolean
  conditions: ConditionTrace[]
}

export function traceChoices(session: SessionState, model: Model): ChoiceTrace[] {
  const node = model.nodes[session.nodeId]
  const available = new Set(getAvailableChoices(session, model).map((c) => c.id))
  return (node?.choices ?? []).map((choice) => ({
    choice,
    available: available.has(choice.id),
    conditions: (choice.conditions ?? []).map((c) => traceCondition(c, session, model)),
  }))
}

// ---------------------------------------------------------------------------
// Conversation templates

export interface TemplateTrace {
  templateId: string
  matched: boolean
  priority: number
  usesExhausted: boolean
  /** per property check: event ids whose property satisfied it */
  eventChecks: Array<{ key: string; op: string; value: string | number | boolean; satisfiedBy: string[] }>
  /** an event satisfying every check, if any */
  matchedEventId?: string
  sessionConditions: ConditionTrace[]
}

export function traceTemplates(session: SessionState, model: Model): TemplateTrace[] {
  const templates: ConversationTemplate[] = model.conversationTemplates ?? []
  const matched = new Set(findMatchingTemplates(templates, session, model).map((m) => m.templateId))
  const events = session.events ?? {}
  return templates.map((t) => {
    const checks = t.trigger.eventMatch?.propertyChecks ?? []
    const eventChecks = checks.map((check) => ({
      ...check,
      satisfiedBy: Object.values(events)
        .filter((e) => propertyCheck(e, check))
        .map((e) => e.id),
    }))
    const matchedEventId = checks.length
      ? Object.values(events).find((e) => checks.every((c) => propertyCheck(e, c)))?.id
      : undefined
    return {
      templateId: t.id,
      matched: matched.has(t.id),
      priority: t.priority ?? 0,
      usesExhausted: false,
      eventChecks,
      matchedEventId,
      sessionConditions: (t.trigger.sessionConditions ?? []).map((c) => traceCondition(c, session, model)),
    }
  })
}

// mirrors conversation-templates.ts checkProperty (kept private there)
function propertyCheck(
  entity: EntityDef,
  check: { key: string; op: string; value: string | number | boolean },
): boolean {
  const actual = entity.properties?.[check.key]?.defaultValue
  if (actual === undefined) return false
  if (typeof actual === 'number' && typeof check.value === 'number') {
    switch (check.op) {
      case '>=': return actual >= check.value
      case '<=': return actual <= check.value
      case '>': return actual > check.value
      case '<': return actual < check.value
      case '==': return actual === check.value
      case '!=': return actual !== check.value
    }
  }
  if (check.op === '==') return String(actual) === String(check.value)
  if (check.op === '!=') return String(actual) !== String(check.value)
  return false
}

// ---------------------------------------------------------------------------
// Perception (character knowledge vs. entity properties)

export type PerceptionOutcome = 'created' | 'not_noticed' | 'already_exists' | 'missing_input'

export interface PerceptionTrace {
  origin: 'policy' | 'effect'
  policyId?: string
  characterId: string
  characterName?: string
  entityId: string
  entityName?: string
  domain: string
  /** tolerance of the knowledge profile actually used */
  tolerance?: number
  matchedDomain?: string
  anomalies: AnomalyResult[]
  noticed: boolean
  onlyIfNoticed: boolean
  eventId: string
  eventName?: string
  outcome: PerceptionOutcome
}

interface PerceptionRequestLike {
  character: string
  entity: string
  domain: string
  expectations: Record<string, number>
  eventId?: string
  eventName?: string
  onlyIfNoticed?: boolean
}

function tracePerception(
  origin: 'policy' | 'effect',
  req: PerceptionRequestLike,
  before: SessionState,
  after: SessionState,
  model: Model,
  policyId?: string,
): PerceptionTrace {
  const character = model.characters?.[req.character]
  const entity = model.entities?.[req.entity]
  const eventId = req.eventId ?? `event_${req.character}_perceives_${req.entity}`
  const base = {
    origin,
    policyId,
    characterId: req.character,
    characterName: character?.name,
    entityId: req.entity,
    entityName: entity?.name,
    domain: req.domain,
    onlyIfNoticed: Boolean(req.onlyIfNoticed),
    eventId,
    eventName: after.events?.[eventId]?.name ?? req.eventName,
  }
  if (!character || !entity || !model.entities) {
    return { ...base, anomalies: [], noticed: false, outcome: 'missing_input' }
  }
  const profiles = character.knowledgeProfiles ?? []
  const profile = profiles.find((p) => p.domain === req.domain) ?? profiles.find((p) => p.domain === 'general')
  const perception = perceiveEntity(character, req.entity, req.expectations, req.domain, model.entities)
  const existed = Boolean(before.events?.[eventId])
  const exists = Boolean(after.events?.[eventId])
  const outcome: PerceptionOutcome = existed
    ? 'already_exists'
    : exists
      ? 'created'
      : 'not_noticed'
  return {
    ...base,
    tolerance: profile?.tolerance,
    matchedDomain: profile?.domain,
    anomalies: perception.anomalies,
    noticed: perception.noticed,
    outcome,
  }
}

function policiesAt(model: Model, nodeId: string): PerceptionPolicy[] {
  return (model.perceptionPolicies ?? []).filter((p) => p.trigger.node === nodeId)
}

// ---------------------------------------------------------------------------
// State changes

export type StateChange =
  | { kind: 'node'; before: string; after: string }
  | { kind: 'flag'; key: string; before?: boolean; after?: boolean }
  | { kind: 'resource'; key: string; before?: number; after?: number }
  | { kind: 'variable'; key: string; before?: string | number; after?: string | number }
  | { kind: 'item'; key: string; change: 'added' | 'removed' }
  | { kind: 'event'; key: string; name: string; properties: Record<string, string | number | boolean> }

export function diffState(before: SessionState, after: SessionState): StateChange[] {
  const changes: StateChange[] = []
  if (before.nodeId !== after.nodeId) changes.push({ kind: 'node', before: before.nodeId, after: after.nodeId })
  for (const key of keysOf(before.flags, after.flags)) {
    if (before.flags[key] !== after.flags[key]) changes.push({ kind: 'flag', key, before: before.flags[key], after: after.flags[key] })
  }
  for (const key of keysOf(before.resources, after.resources)) {
    if (before.resources[key] !== after.resources[key]) changes.push({ kind: 'resource', key, before: before.resources[key], after: after.resources[key] })
  }
  for (const key of keysOf(before.variables, after.variables)) {
    if (before.variables[key] !== after.variables[key]) changes.push({ kind: 'variable', key, before: before.variables[key], after: after.variables[key] })
  }
  for (const key of after.inventory) if (!before.inventory.includes(key)) changes.push({ kind: 'item', key, change: 'added' })
  for (const key of before.inventory) if (!after.inventory.includes(key)) changes.push({ kind: 'item', key, change: 'removed' })
  for (const [key, event] of Object.entries(after.events ?? {})) {
    if (before.events?.[key]) continue
    const properties: Record<string, string | number | boolean> = {}
    for (const [k, p] of Object.entries(event.properties ?? {})) {
      if (p.defaultValue !== undefined) properties[k] = p.defaultValue
    }
    changes.push({ kind: 'event', key, name: event.name, properties })
  }
  return changes
}

function keysOf(a: Record<string, unknown> = {}, b: Record<string, unknown> = {}): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
}

// ---------------------------------------------------------------------------
// Scene and step

export interface SceneTrace {
  nodeId: string
  speaker?: string
  text: TextTrace
  choices: ChoiceTrace[]
  templates: TemplateTrace[]
  /** true when the node has no choices at all (an ending) */
  ending: boolean
}

export function traceScene(session: SessionState, model: Model): SceneTrace {
  const node = model.nodes[session.nodeId]
  return {
    nodeId: session.nodeId,
    speaker: node?.speaker,
    text: traceText(node?.text ?? '', model, session),
    choices: traceChoices(session, model),
    templates: traceTemplates(session, model),
    ending: !node?.choices || node.choices.length === 0,
  }
}

export interface StepTrace {
  /** null for the opening step */
  choiceId: string | null
  fromNodeId: string | null
  effects: Effect[]
  changes: StateChange[]
  perceptions: PerceptionTrace[]
  session: SessionState
  scene: SceneTrace
}

/** Start a session and record what happened on arrival at the start node. */
export function traceStart(model: Model, initial?: Partial<SessionState>): StepTrace {
  const bare: SessionState = {
    nodeId: initial?.nodeId ?? model.startNode,
    flags: { ...(model.flags ?? {}), ...(initial?.flags ?? {}) },
    resources: { ...(model.resources ?? {}), ...(initial?.resources ?? {}) },
    variables: { ...(model.variables ?? {}), ...(initial?.variables ?? {}) },
    inventory: initial?.inventory ?? [],
    time: initial?.time ?? 0,
    events: initial?.events ?? {},
  }
  const session = startSession(model, initial)
  const perceptions = policiesAt(model, session.nodeId).map((p) =>
    tracePerception('policy', p, bare, session, model, p.id))
  return {
    choiceId: null,
    fromNodeId: null,
    effects: [],
    changes: diffState(bare, session),
    perceptions,
    session,
    scene: traceScene(session, model),
  }
}

/** Apply a choice through the real runtime and record what changed and why. */
export function traceStep(session: SessionState, model: Model, choiceId: string): StepTrace {
  const choice = model.nodes[session.nodeId]?.choices?.find((c) => c.id === choiceId)
  const next = applyChoice(session, model, choiceId)
  const effects = choice?.effects ?? []
  const perceptions: PerceptionTrace[] = []
  for (const effect of effects) {
    if (effect.type === 'perceiveEntity') perceptions.push(tracePerception('effect', effect, session, next, model))
  }
  for (const policy of policiesAt(model, next.nodeId)) {
    perceptions.push(tracePerception('policy', policy, session, next, model, policy.id))
  }
  return {
    choiceId,
    fromNodeId: session.nodeId,
    effects,
    changes: diffState(session, next),
    perceptions,
    session: next,
    scene: traceScene(next, model),
  }
}

// ---------------------------------------------------------------------------
// Model check (validity across the whole story)

export interface RouteEnding {
  nodeId: string
  /** choice ids from the start to this ending (one shortest example) */
  path: string[]
}

export interface StuckState {
  nodeId: string
  path: string[]
  /** every choice of the node, with why it was closed */
  choices: ChoiceTrace[]
}

export interface ModelCheck {
  nodes: number
  /** target ids that do not exist */
  missingTargets: Array<{ nodeId: string; choiceId: string; target: string }>
  /** nodes unreachable even when every condition is ignored */
  unlinkedNodes: string[]
  /** nodes reached by actually playing every open choice */
  playedNodes: string[]
  /** nodes linked from the start but never reached in play */
  unplayedNodes: string[]
  endings: RouteEnding[]
  /** non-ending nodes where no choice was open during play */
  stuck: StuckState[]
  /** choices that never opened in any explored state */
  neverOpened: Array<{ nodeId: string; choiceId: string; text: string }>
  /** hasEvent keys that no choice effect or policy can create */
  impossibleEvents: string[]
  /** [ref] and {key} references no state can resolve */
  unresolvedRefs: Array<{ nodeId: string; ref: string }>
  /** runtime errors met while playing */
  errors: Array<{ nodeId: string; choiceId: string; message: string }>
  /** true when exploration stopped at the state limit */
  truncated: boolean
  exploredStates: number
}

function stateKey(s: SessionState): string {
  return JSON.stringify([
    s.nodeId,
    s.flags,
    s.resources,
    s.variables,
    [...s.inventory].sort(),
    Object.keys(s.events ?? {}).sort(),
  ])
}

function producibleEvents(model: Model): Set<string> {
  const ids = new Set<string>()
  for (const node of Object.values(model.nodes)) {
    for (const choice of node.choices ?? []) {
      for (const e of choice.effects ?? []) {
        if (e.type === 'createEvent') ids.add(e.id)
        if (e.type === 'perceiveEntity') ids.add(e.eventId ?? `event_${e.character}_perceives_${e.entity}`)
      }
    }
  }
  for (const p of model.perceptionPolicies ?? []) ids.add(p.eventId ?? `event_${p.character}_perceives_${p.entity}`)
  return ids
}

function collectHasEvent(conds: Condition[] | undefined, out: Set<string>): void {
  for (const c of conds ?? []) {
    if (c.type === 'hasEvent' && c.value) out.add(c.key)
    if (c.type === 'and' || c.type === 'or') collectHasEvent(c.conditions, out)
    if (c.type === 'not') collectHasEvent([c.condition], out)
  }
}

export function checkModel(model: Model, options: { maxStates?: number } = {}): ModelCheck {
  const maxStates = options.maxStates ?? 2000
  const nodeIds = Object.keys(model.nodes)

  const missingTargets: ModelCheck['missingTargets'] = []
  const linked = new Set<string>([model.startNode])
  const queue = [model.startNode]
  while (queue.length) {
    const id = queue.shift() as string
    for (const c of model.nodes[id]?.choices ?? []) {
      if (!model.nodes[c.target]) {
        missingTargets.push({ nodeId: id, choiceId: c.id, target: c.target })
        continue
      }
      if (!linked.has(c.target)) {
        linked.add(c.target)
        queue.push(c.target)
      }
    }
  }
  for (const id of nodeIds) {
    if (linked.has(id)) continue
    for (const c of model.nodes[id].choices ?? []) {
      if (!model.nodes[c.target]) missingTargets.push({ nodeId: id, choiceId: c.id, target: c.target })
    }
  }

  // play every open choice, breadth first
  const played = new Set<string>()
  const opened = new Set<string>()
  const endings = new Map<string, RouteEnding>()
  const stuck = new Map<string, StuckState>()
  const errors: ModelCheck['errors'] = []
  const seen = new Set<string>()
  const unresolved = new Map<string, Set<string>>()
  let truncated = false
  const start = startSession(model)
  const frontier: Array<{ s: SessionState; path: string[] }> = [{ s: start, path: [] }]
  seen.add(stateKey(start))
  while (frontier.length) {
    const { s, path } = frontier.shift() as { s: SessionState; path: string[] }
    const node = model.nodes[s.nodeId]
    if (!node) continue
    played.add(s.nodeId)
    for (const seg of traceText(node.text ?? '', model, s).segments) markUnresolved(seg, s.nodeId, unresolved)
    if (!node.choices || node.choices.length === 0) {
      if (!endings.has(s.nodeId)) endings.set(s.nodeId, { nodeId: s.nodeId, path })
      continue
    }
    const open = getAvailableChoices(s, model)
    if (open.length === 0 && !stuck.has(s.nodeId)) {
      stuck.set(s.nodeId, { nodeId: s.nodeId, path, choices: traceChoices(s, model) })
    }
    for (const c of open) {
      opened.add(`${s.nodeId}\u0000${c.id}`)
      let next: SessionState
      try {
        next = applyChoice(s, model, c.id)
      } catch (err) {
        errors.push({ nodeId: s.nodeId, choiceId: c.id, message: err instanceof Error ? err.message : String(err) })
        continue
      }
      const key = stateKey(next)
      if (seen.has(key)) continue
      if (seen.size >= maxStates) {
        truncated = true
        continue
      }
      seen.add(key)
      frontier.push({ s: next, path: [...path, c.id] })
    }
  }

  const neverOpened: ModelCheck['neverOpened'] = []
  for (const id of nodeIds) {
    if (!played.has(id)) continue
    for (const c of model.nodes[id].choices ?? []) {
      if (!opened.has(`${id}\u0000${c.id}`)) neverOpened.push({ nodeId: id, choiceId: c.id, text: c.text })
    }
  }

  const required = new Set<string>()
  for (const node of Object.values(model.nodes)) for (const c of node.choices ?? []) collectHasEvent(c.conditions, required)
  for (const t of model.conversationTemplates ?? []) collectHasEvent(t.trigger.sessionConditions, required)
  const producible = producibleEvents(model)
  const impossibleEvents = [...required].filter((id) => !producible.has(id))

  const unresolvedRefs: ModelCheck['unresolvedRefs'] = []
  for (const [nodeId, refs] of unresolved) for (const ref of refs) unresolvedRefs.push({ nodeId, ref })

  return {
    nodes: nodeIds.length,
    missingTargets,
    unlinkedNodes: nodeIds.filter((id) => !linked.has(id)),
    playedNodes: nodeIds.filter((id) => played.has(id)),
    unplayedNodes: nodeIds.filter((id) => linked.has(id) && !played.has(id)),
    endings: [...endings.values()],
    stuck: [...stuck.values()],
    neverOpened,
    impossibleEvents,
    unresolvedRefs,
    errors,
    truncated,
    exploredStates: seen.size,
  }
}

function markUnresolved(seg: TextSegment, nodeId: string, out: Map<string, Set<string>>): void {
  if ((seg.kind === 'entity' || seg.kind === 'value') && seg.source === 'unresolved') {
    const ref = seg.kind === 'entity' ? `[${seg.ref}]` : `{${seg.key}}`
    if (!out.has(nodeId)) out.set(nodeId, new Set())
    out.get(nodeId)?.add(ref)
  }
  if (seg.kind === 'conditional' || seg.kind === 'template') for (const c of seg.children) markUnresolved(c, nodeId, out)
}

