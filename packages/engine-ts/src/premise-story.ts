import type { CharacterDef } from './character-knowledge.js'
import { findKnowledgeProfile, perceiveEntity } from './character-knowledge.js'
import type { Choice, Condition, Effect, EntityDef, Model, NodeDef } from './types.js'

/**
 * SP-PREMISE-001 prototype: build a story from a few premises.
 *
 * Premises are things (entities), people (characters), what each person expects
 * of a thing (beliefs) and who is present with which thing (scene). Whether a
 * person notices a gap is decided by the engine's own perception (necessary
 * step). Who looks, who tells whom, who checks or lets go is chosen by weight
 * (probable step). The result is an ordinary model that the runtime replays.
 */

export interface PremiseBelief {
  character: string
  entity: string
  domain: string
  expectations: Record<string, number>
}

export interface PremiseWording {
  /** display names for property keys, e.g. { weight: '重さ' } */
  propertyNames?: Record<string, string>
  /** overrides for the skeleton sentence patterns, keyed by pattern id */
  patterns?: Partial<Record<PatternId, string>>
}

export interface StoryPremise {
  title?: string
  entities: Record<string, EntityDef>
  characters: Record<string, CharacterDef>
  beliefs: PremiseBelief[]
  scene: {
    /** character ids that are present, in the order they are named */
    present: string[]
    /** the entity in front of them */
    focus: string
  }
  /** what the author wants the story to contain; the generator picks the most probable unfolding that has it */
  intent?: StoryIntent
  wording?: PremiseWording
}

/** kinds of events an unfolding can contain */
export type StoryBeat = 'noticed' | 'missed' | 'heard' | 'shared' | 'disagreement' | 'letGo' | 'verified'

export interface StoryIntent {
  include?: StoryBeat[]
  ending?: StoryEnding
}

export type StoryActionKind = 'look' | 'tell' | 'verify' | 'letGo'
export type LookResult = 'noticed' | 'missed'
export type TellResult = 'heard' | 'shared' | 'disagreement'
export type StoryEnding = 'verified' | 'faded' | 'nothing'

export interface WeightFactor {
  /** which premise quantity this factor reads */
  source: 'accuracy' | 'severity' | 'toldSeverity' | 'listeners'
  /** whose quantity */
  character: string
  value: number
}

export interface StoryAction {
  key: string
  kind: StoryActionKind
  actor: string
  target?: string
  result?: LookResult | TellResult
  weight: number
  probability: number
  factors: WeightFactor[]
}

export interface PerceptionFact {
  character: string
  entity: string
  domain: string
  /** exact: the character has this domain; general: fell back; none: no usable profile */
  profileMatch: 'exact' | 'general' | 'none'
  accuracy: number
  tolerance: number
  property: string
  expected: number
  actual: number
  rangeMin: number
  rangeMax: number
  deviation: number
  noticed: boolean
  /** the engine's event severity: min(100, round(totalDeviation * 20)) */
  severity: number
}

export interface StoryStep {
  /** node the step starts from */
  from: string
  /** node the step arrives at */
  to: string
  action: StoryAction
  /** every action that was possible in this state, most probable first */
  options: StoryAction[]
}

export interface EndingShare {
  ending: StoryEnding
  probability: number
}

export interface StoryDerivation {
  title: string
  focus: string
  perceptions: PerceptionFact[]
  /** the constructed story: one step per event, start to ending */
  mainLine: StoryStep[]
  ending: StoryEnding
  /** product of the step probabilities on the main line */
  mainLineProbability: number
  /** the intent the main line was chosen for, if the premise gave one */
  intent?: StoryIntent
  /** share of all unfoldings that satisfy the intent (1 when there is no intent) */
  intentShare: number
  /** how all possible unfoldings of this premise end (exact, over the whole state space) */
  endings: EndingShare[]
  statesExplored: number
  truncated: boolean
  nodeCount: number
  /** premises the generator could not use, in plain words */
  warnings: string[]
}

export interface GenerateStoryOptions {
  /** choose the main line by weighted sampling with this seed; omitted = the most probable whole unfolding */
  seed?: number
  /** how many alternatives besides the main line stay playable at each step (default 2) */
  alternatives?: number
  /** alternatives below this probability are left out of the model (default 0.1) */
  minProbability?: number
  /** stop enumerating after this many states (default 20000) */
  maxStates?: number
}

export interface GeneratedStory {
  model: Model
  derivation: StoryDerivation
}

export type PatternId =
  | 'start'
  | 'lookNoticed'
  | 'lookMissed'
  | 'tellHeard'
  | 'tellShared'
  | 'tellDisagreement'
  | 'verify'
  | 'letGo'
  | 'endVerified'
  | 'endFaded'
  | 'endNothing'
  | 'choiceLook'
  | 'choiceTell'
  | 'choiceVerify'
  | 'choiceLetGo'

/**
 * Skeleton sentence patterns. They state what happened and nothing more; the
 * author replaces them through `premise.wording.patterns`.
 * `{...}` is filled by the generator; `[...]` is left for the runtime.
 */
export const DEFAULT_PATTERNS: Record<PatternId, string> = {
  start: '[{focus}]がある。{present}がいる。',
  lookNoticed:
    '{actor}は[{focus}]を見る。{property}は[{noticeEvent}.expected_value]のはずだと思っていた。実際は[{noticeEvent}.actual_value]。{actor}は違和感を覚える。',
  lookMissed:
    '{actor}は[{focus}]を見る。{property}は{expected}のはずだと思っていて、実際の[{focus}.{propertyKey}]はその見込みの幅に収まる。{actor}は何も気に留めない。',
  tellHeard: '{actor}は{target}に、[{focus}]の{property}が思っていたのと違うと話す。{target}はまだそれを見ていない。',
  tellShared:
    '{actor}は{target}に、[{focus}]の{property}が思っていたのと違うと話す。{target}も同じ違和感を覚えていた。二人に共通の話題ができる。',
  tellDisagreement:
    '{actor}は{target}に、[{focus}]の{property}が思っていたのと違うと話す。{target}は自分で見て何も気に留めなかった。二人の見方は食い違う。',
  verify: '{actor}は[{focus}]の{property}を確かめる。[{focus}.{propertyKey}]。見込みの{expected}とは違っていた。',
  letGo: '{actor}は違和感をそのままにする。',
  endVerified: '違和感は確かめられ、事実として残った。',
  endFaded: '違和感は誰にも確かめられないまま流れた。',
  endNothing: '誰も違和感を覚えなかった。この前提からは出来事が起きない。',
  choiceLook: '{actor}が見る',
  choiceTell: '{actor}が{target}に話す',
  choiceVerify: '{actor}が確かめる',
  choiceLetGo: '{actor}がそのままにする',
}

interface State {
  looked: Record<string, LookResult>
  /** "speaker>listener" */
  told: string[]
  letGo: string[]
  verifiedBy: string | null
}

interface Participant {
  id: string
  name: string
  fact: PerceptionFact
}

const EMPTY_STATE: State = { looked: {}, told: [], letGo: [], verifiedBy: null }

function stateKey(s: State): string {
  const looked = Object.keys(s.looked).sort().map((c) => `${c}:${s.looked[c]}`).join(',')
  return `${looked}|${[...s.told].sort().join(',')}|${[...s.letGo].sort().join(',')}|${s.verifiedBy ?? ''}`
}

function round(value: number, digits = 4): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

/** mulberry32: small deterministic generator so a seed always gives the same story */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function readPerception(premise: StoryPremise, belief: PremiseBelief): PerceptionFact | string {
  const character = premise.characters[belief.character]
  if (!character) return `思い込みの人物「${belief.character}」が人物の定義にありません`
  if (!premise.entities[belief.entity]) return `思い込みの物「${belief.entity}」が物の定義にありません`
  const profile = findKnowledgeProfile(character, belief.domain)
  if (!profile) return `${character.name}に分野「${belief.domain}」の知識も「general」の知識もありません`
  const perception = perceiveEntity(character, belief.entity, belief.expectations, belief.domain, premise.entities)
  const primary = perception.anomalies.find((a) => a.anomalous) ?? perception.anomalies[0]
  if (!primary) return `${character.name}の見込みは、「${belief.entity}」の数値の性質と比べられません`
  const total = Number.isFinite(perception.totalDeviation) ? perception.totalDeviation : 0
  return {
    character: belief.character,
    entity: belief.entity,
    domain: belief.domain,
    profileMatch: profile.domain === belief.domain ? 'exact' : 'general',
    accuracy: profile.accuracy,
    tolerance: profile.tolerance,
    property: primary.propertyKey,
    expected: primary.expectedValue,
    actual: primary.actualValue,
    rangeMin: round(primary.toleranceRange[0], 6),
    rangeMax: round(primary.toleranceRange[1], 6),
    deviation: round(Number.isFinite(primary.deviation) ? primary.deviation : 0),
    noticed: perception.noticed,
    severity: Math.min(100, Math.round(total * 20)),
  }
}

/** open tension: noticed, not let go, nothing verified yet */
function holdsTension(s: State, c: string): boolean {
  return s.looked[c] === 'noticed' && !s.letGo.includes(c) && s.verifiedBy === null
}

function firstTeller(s: State, listener: string): string | undefined {
  const entry = s.told.find((t) => t.endsWith(`>${listener}`))
  return entry?.split('>')[0]
}

/**
 * Actions possible in a state with their weights. Every weight is built only
 * from premise quantities: the character's accuracy in the belief's domain and
 * the engine's severity of a noticed gap (0..1).
 */
function possibleActions(s: State, people: Participant[]): StoryAction[] {
  if (s.verifiedBy !== null) return []
  const byId = new Map(people.map((p) => [p.id, p]))
  const sev = (c: string) => (byId.get(c)?.fact.severity ?? 0) / 100
  const acc = (c: string) => byId.get(c)?.fact.accuracy ?? 0
  const actions: Omit<StoryAction, 'probability'>[] = []

  for (const p of people) {
    const c = p.id
    if (!(c in s.looked)) {
      // look: the better a person knows the field, the more likely they look closely;
      // someone who was told looks at least as readily as the teller was struck
      const teller = firstTeller(s, c)
      const factors: WeightFactor[] = [{ source: 'accuracy', character: c, value: acc(c) }]
      let weight = acc(c)
      if (teller) {
        factors.push({ source: 'toldSeverity', character: teller, value: sev(teller) })
        weight += sev(teller)
      }
      actions.push({ key: `look:${c}`, kind: 'look', actor: c, result: p.fact.noticed ? 'noticed' : 'missed', weight, factors })
      continue
    }
    if (!holdsTension(s, c)) continue

    const listeners = people.filter((o) => o.id !== c && !s.told.includes(`${c}>${o.id}`))
    for (const o of listeners) {
      // tell: the stronger the gap, the more it is voiced; the urge is shared among listeners
      const result: TellResult = !(o.id in s.looked) ? 'heard' : s.looked[o.id] === 'noticed' ? 'shared' : 'disagreement'
      actions.push({
        key: `tell:${c}>${o.id}`,
        kind: 'tell',
        actor: c,
        target: o.id,
        result,
        weight: sev(c) / listeners.length,
        factors: [
          { source: 'severity', character: c, value: sev(c) },
          { source: 'listeners', character: c, value: listeners.length },
        ],
      })
    }
    // verify: a strong gap held by someone who knows the field gets checked
    actions.push({
      key: `verify:${c}`,
      kind: 'verify',
      actor: c,
      weight: sev(c) * acc(c),
      factors: [
        { source: 'severity', character: c, value: sev(c) },
        { source: 'accuracy', character: c, value: acc(c) },
      ],
    })
    // let go: a weak gap held by someone unsure of the field fades
    actions.push({
      key: `letGo:${c}`,
      kind: 'letGo',
      actor: c,
      weight: (1 - sev(c)) * (1 - acc(c)),
      factors: [
        { source: 'severity', character: c, value: sev(c) },
        { source: 'accuracy', character: c, value: acc(c) },
      ],
    })
  }

  const usable = actions.filter((a) => a.weight > 0)
  const total = usable.reduce((sum, a) => sum + a.weight, 0)
  return usable
    .map((a) => ({ ...a, weight: round(a.weight), probability: round(a.weight / total) }))
    .sort((a, b) => b.probability - a.probability || a.key.localeCompare(b.key))
}

function applyAction(s: State, a: StoryAction): State {
  if (a.kind === 'look') return { ...s, looked: { ...s.looked, [a.actor]: a.result as LookResult } }
  if (a.kind === 'tell') return { ...s, told: [...s.told, `${a.actor}>${a.target}`] }
  if (a.kind === 'letGo') return { ...s, letGo: [...s.letGo, a.actor] }
  return { ...s, verifiedBy: a.actor }
}

function endingOf(s: State): StoryEnding {
  if (s.verifiedBy !== null) return 'verified'
  return Object.values(s.looked).includes('noticed') ? 'faded' : 'nothing'
}

const BEATS: StoryBeat[] = ['noticed', 'missed', 'heard', 'shared', 'disagreement', 'letGo', 'verified']

function beatOf(a: StoryAction): StoryBeat {
  if (a.kind === 'verify') return 'verified'
  if (a.kind === 'letGo') return 'letGo'
  return a.result as StoryBeat
}

function beatMask(beats: StoryBeat[]): number {
  return beats.reduce((mask, b) => mask | (1 << BEATS.indexOf(b)), 0)
}

function fill(pattern: string, values: Record<string, string>): string {
  return pattern.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key] : whole))
}

/**
 * Build a story from premises. Deterministic: the same premise and options
 * always give the same model and derivation.
 */
export function generateStory(premise: StoryPremise, options: GenerateStoryOptions = {}): GeneratedStory {
  const alternatives = options.alternatives ?? 2
  const minProbability = options.minProbability ?? 0.1
  const maxStates = options.maxStates ?? 20000
  const warnings: string[] = []
  const focus = premise.scene.focus
  const patterns = { ...DEFAULT_PATTERNS, ...(premise.wording?.patterns ?? {}) }

  if (!premise.entities[focus]) throw new Error(`場の物「${focus}」が物の定義にありません`)

  const people: Participant[] = []
  const perceptions: PerceptionFact[] = []
  for (const id of premise.scene.present) {
    const character = premise.characters[id]
    if (!character) {
      warnings.push(`場にいる「${id}」が人物の定義にありません`)
      continue
    }
    const belief = premise.beliefs.find((b) => b.character === id && b.entity === focus)
    if (!belief) {
      warnings.push(`${character.name}には「${premise.entities[focus].name}」への思い込みがないため、この人物は動きません`)
      continue
    }
    const fact = readPerception(premise, belief)
    if (typeof fact === 'string') {
      warnings.push(fact)
      continue
    }
    people.push({ id, name: character.name, fact })
    perceptions.push(fact)
  }
  if (people.length === 0) throw new Error('場にいて、場の物への思い込みを持つ人物が一人もいません')

  const name = (id: string) => premise.characters[id]?.name ?? id
  const propertyName = (key: string) => premise.wording?.propertyNames?.[key] ?? key
  const noticeEvent = (c: string) => `notice_${c}`

  // --- every possible unfolding: ending shares, intent share, best unfolding ---
  interface Walk {
    shares: Record<StoryEnding, number>
    /** probability mass of unfoldings from here that satisfy the intent */
    satisfied: number
    /** most probable satisfying unfolding from here: its probability and first action */
    bestProbability: number
    bestAction: StoryAction | null
  }
  let truncated = false
  function explore(intent: StoryIntent) {
    const need = beatMask(intent.include ?? [])
    const memo = new Map<string, Walk>()
    function walk(s: State, mask: number): Walk {
      const key = `${stateKey(s)}#${mask}`
      const known = memo.get(key)
      if (known) return known
      const result: Walk = { shares: { verified: 0, faded: 0, nothing: 0 }, satisfied: 0, bestProbability: 0, bestAction: null }
      // reserve the slot first so the size limit counts states in progress too
      memo.set(key, result)
      const actions = possibleActions(s, people)
      if (actions.length === 0 || memo.size > maxStates) {
        if (actions.length > 0) truncated = true
        const ending = endingOf(s)
        result.shares[ending] = 1
        if ((mask & need) === need && (!intent.ending || intent.ending === ending)) {
          result.satisfied = 1
          result.bestProbability = 1
        }
        return result
      }
      for (const a of actions) {
        const sub = walk(applyAction(s, a), mask | beatMask([beatOf(a)]))
        result.shares.verified += a.probability * sub.shares.verified
        result.shares.faded += a.probability * sub.shares.faded
        result.shares.nothing += a.probability * sub.shares.nothing
        result.satisfied += a.probability * sub.satisfied
        const through = a.probability * sub.bestProbability
        if (through > result.bestProbability) {
          result.bestProbability = through
          result.bestAction = a
        }
      }
      return result
    }
    return { need, memo, walk, root: walk(EMPTY_STATE, 0) }
  }

  const hasIntent = Boolean(premise.intent && ((premise.intent.include?.length ?? 0) > 0 || premise.intent.ending))
  let intent: StoryIntent = hasIntent ? premise.intent! : {}
  let space = explore(intent)
  const intentShare = space.root.satisfied
  if (hasIntent && space.root.bestProbability === 0) {
    warnings.push('意図を満たす展開がこの前提にはありません。意図なしで最も蓋然な展開を出します')
    intent = {}
    space = explore(intent)
  }
  const shares = space.root.shares

  // --- main line: the most probable whole unfolding, or a seeded sample of one ---
  function bestPath(): StoryAction[] {
    const path: StoryAction[] = []
    let s = EMPTY_STATE
    let mask = 0
    for (;;) {
      const a = space.walk(s, mask).bestAction
      if (!a) return path
      path.push(a)
      s = applyAction(s, a)
      mask |= beatMask([beatOf(a)])
    }
  }
  function sampledPath(seed: number): StoryAction[] | null {
    const random = seeded(seed)
    for (let attempt = 0; attempt < 500; attempt++) {
      const path: StoryAction[] = []
      let s = EMPTY_STATE
      let mask = 0
      for (;;) {
        const actions = possibleActions(s, people)
        if (actions.length === 0) break
        let r = random()
        let chosen = actions[actions.length - 1]
        for (const a of actions) {
          r -= a.probability
          if (r <= 0) {
            chosen = a
            break
          }
        }
        path.push(chosen)
        s = applyAction(s, chosen)
        mask |= beatMask([beatOf(chosen)])
      }
      if ((mask & space.need) === space.need && (!intent.ending || intent.ending === endingOf(s))) return path
    }
    return null
  }
  let mainActions = bestPath()
  if (options.seed !== undefined) {
    const sampled = sampledPath(options.seed)
    if (sampled) mainActions = sampled
    else warnings.push('この種では意図を満たす展開を引けなかったため、最も蓋然な展開を出します')
  }

  // --- model: nodes are (state, arriving action) ----------------------------
  const nodes: Record<string, NodeDef> = {}
  const nodeIds = new Map<string, string>()
  const pending: Array<{ id: string; state: State; onMain: boolean }> = []

  function textValues(a: StoryAction | null): Record<string, string> {
    const actorFact = a ? people.find((p) => p.id === a.actor)?.fact : undefined
    return {
      focus,
      present: people.map((p) => p.name).join('、'),
      actor: a ? name(a.actor) : '',
      target: a?.target ? name(a.target) : '',
      property: actorFact ? propertyName(actorFact.property) : '',
      propertyKey: actorFact?.property ?? '',
      expected: actorFact ? String(actorFact.expected) : '',
      noticeEvent: a ? noticeEvent(a.actor) : '',
    }
  }

  function arrivalText(a: StoryAction | null, s: State): string {
    let body: string
    if (!a) body = fill(patterns.start, textValues(null))
    else if (a.kind === 'look') body = fill(a.result === 'noticed' ? patterns.lookNoticed : patterns.lookMissed, textValues(a))
    else if (a.kind === 'tell') {
      const id = a.result === 'heard' ? 'tellHeard' : a.result === 'shared' ? 'tellShared' : 'tellDisagreement'
      body = fill(patterns[id], textValues(a))
    } else if (a.kind === 'verify') body = fill(patterns.verify, textValues(a))
    else body = fill(patterns.letGo, textValues(a))
    if (possibleActions(s, people).length > 0) return body
    const end = endingOf(s)
    const closing = end === 'verified' ? patterns.endVerified : end === 'faded' ? patterns.endFaded : patterns.endNothing
    return `${body}\n\n${closing}`
  }

  function nodeFor(s: State, arriving: StoryAction | null, onMain: boolean): string {
    const key = `${stateKey(s)}#${arriving?.key ?? 'start'}`
    const existing = nodeIds.get(key)
    if (existing) return existing
    const id = arriving ? `s${nodeIds.size}_${arriving.kind}_${arriving.actor}${arriving.target ? `_${arriving.target}` : ''}` : 'start'
    nodeIds.set(key, id)
    nodes[id] = { id, text: arrivalText(arriving, s) }
    pending.push({ id, state: s, onMain })
    return id
  }

  function effectsOf(a: StoryAction): Effect[] {
    const fact = people.find((p) => p.id === a.actor)!.fact
    if (a.kind === 'look') {
      return [{
        type: 'perceiveEntity',
        character: a.actor,
        entity: focus,
        domain: fact.domain,
        expectations: premise.beliefs.find((b) => b.character === a.actor && b.entity === focus)!.expectations,
        eventId: noticeEvent(a.actor),
        eventName: `${name(a.actor)}の違和感`,
        onlyIfNoticed: true,
      }]
    }
    if (a.kind === 'tell') {
      return [{
        type: 'createEvent',
        id: `tell_${a.actor}_${a.target}`,
        name: `${name(a.actor)}が${name(a.target!)}に話した`,
        properties: {
          speaker: { defaultValue: a.actor },
          listener: { defaultValue: a.target! },
          source_entity: { defaultValue: focus },
          outcome: { defaultValue: a.result as string },
          severity: { defaultValue: fact.severity },
        },
      }]
    }
    if (a.kind === 'verify') {
      return [{
        type: 'createEvent',
        id: `verify_${a.actor}`,
        name: `${name(a.actor)}が確かめた`,
        properties: {
          observer: { defaultValue: a.actor },
          source_entity: { defaultValue: focus },
          primary_property: { defaultValue: fact.property },
          actual_value: { defaultValue: fact.actual },
        },
      }]
    }
    return [{
      type: 'createEvent',
      id: `letgo_${a.actor}`,
      name: `${name(a.actor)}がそのままにした`,
      properties: { observer: { defaultValue: a.actor }, source_entity: { defaultValue: focus } },
    }]
  }

  /** only the knowledge-derived gate: the actor must really hold the gap at runtime */
  function conditionsOf(a: StoryAction): Condition[] | undefined {
    if (a.kind === 'look') return undefined
    const conditions: Condition[] = [{ type: 'hasEvent', key: noticeEvent(a.actor), value: true }]
    if (a.kind === 'tell' && a.result === 'shared') conditions.push({ type: 'hasEvent', key: noticeEvent(a.target!), value: true })
    if (a.kind === 'tell' && a.result === 'disagreement') conditions.push({ type: 'hasEvent', key: noticeEvent(a.target!), value: false })
    return conditions
  }

  function choiceText(a: StoryAction): string {
    const id = a.kind === 'look' ? 'choiceLook' : a.kind === 'tell' ? 'choiceTell' : a.kind === 'verify' ? 'choiceVerify' : 'choiceLetGo'
    return `${fill(patterns[id], textValues(a))} 〔蓋然 ${Math.round(a.probability * 100)}%〕`
  }

  function choiceFor(from: State, a: StoryAction, onMain: boolean): Choice {
    const conditions = conditionsOf(a)
    return {
      id: a.key.replace(/[:>]/g, '_'),
      text: choiceText(a),
      target: nodeFor(applyAction(from, a), a, onMain),
      ...(conditions ? { conditions } : {}),
      effects: effectsOf(a),
    }
  }

  // main line first, each step keeping its strongest alternatives playable
  const mainLine: StoryStep[] = []
  let cursor: State = EMPTY_STATE
  let cursorId = nodeFor(cursor, null, true)
  for (const a of mainActions) {
    const all = possibleActions(cursor, people)
    const main = all.find((o) => o.key === a.key)!
    const kept = [main, ...all.filter((o) => o.key !== main.key && o.probability >= minProbability).slice(0, alternatives)]
    const from = cursor
    nodes[cursorId].choices = kept.map((o) => choiceFor(from, o, o === main))
    const next = applyAction(cursor, main)
    const nextId = nodeFor(next, main, true)
    mainLine.push({ from: cursorId, to: nextId, action: main, options: all })
    cursor = next
    cursorId = nextId
  }
  const finalState = cursor
  // side paths run straight to an ending along their most probable action
  while (pending.length > 0) {
    const current = pending.shift()!
    if (nodes[current.id].choices) continue
    const all = possibleActions(current.state, people)
    if (all.length > 0) nodes[current.id].choices = [choiceFor(current.state, all[0], false)]
  }

  const knowledgeRules: Model['knowledgeRules'] = {}
  for (const p of people) {
    const belief = premise.beliefs.find((b) => b.character === p.id && b.entity === focus)!
    knowledgeRules[`belief_${p.id}_${focus}`] = {
      character: belief.character,
      entity: belief.entity,
      domain: belief.domain,
      expectations: belief.expectations,
    }
  }

  const model: Model = {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    flags: {},
    resources: {},
    variables: {},
    entities: premise.entities,
    characters: premise.characters,
    knowledgeRules,
    nodes,
  }

  const derivation: StoryDerivation = {
    title: premise.title ?? focus,
    focus,
    perceptions,
    mainLine,
    ending: endingOf(finalState),
    mainLineProbability: round(mainLine.reduce((p, step) => p * step.action.probability, 1), 6),
    ...(hasIntent ? { intent: premise.intent } : {}),
    intentShare: round(intentShare),
    endings: (['verified', 'faded', 'nothing'] as StoryEnding[])
      .map((ending) => ({ ending, probability: round(shares[ending]) }))
      .filter((e) => shares[e.ending] > 0),
    statesExplored: space.memo.size,
    truncated,
    nodeCount: Object.keys(nodes).length,
    warnings,
  }

  return { model, derivation }
}

const ENDING_LABEL: Record<StoryEnding, string> = {
  verified: '確かめて終わる',
  faded: '確かめられないまま流れる',
  nothing: '誰も気づかない',
}

const BEAT_LABEL: Record<StoryBeat, string> = {
  noticed: '誰かが違和感を覚える',
  missed: '誰かが気に留めない',
  heard: 'まだ見ていない相手に伝わる',
  shared: '共通の話題になる',
  disagreement: '見方が食い違う',
  letGo: '誰かがそのままにする',
  verified: '誰かが確かめる',
}

const FACTOR_TEXT: Record<WeightFactor['source'], (who: string, value: number) => string> = {
  accuracy: (who, v) => `${who}の知識の正確さ ${v}`,
  severity: (who, v) => `${who}の違和感の強さ ${v}`,
  toldSeverity: (who, v) => `${who}から聞いた違和感の強さ ${v}`,
  listeners: (who, v) => `${who}がまだ話していない相手 ${v}人`,
}

/** Readable account of a derivation: what the engine judged, the story, and why each step was probable. */
export function describeDerivation(premise: StoryPremise, derivation: StoryDerivation): string {
  const name = (id: string) => premise.characters[id]?.name ?? id
  const prop = (key: string) => premise.wording?.propertyNames?.[key] ?? key
  const pct = (p: number) => `${(p * 100).toFixed((p > 0 && p < 0.1) || (p > 0.9 && p < 1) ? 1 : 0)}%`
  const lines: string[] = []
  const label = (a: StoryAction) => {
    if (a.kind === 'look') return `${name(a.actor)}が見る → ${a.result === 'noticed' ? '違和感を覚える' : '気に留めない'}`
    if (a.kind === 'tell') {
      const out = a.result === 'heard' ? 'まだ見ていない相手に伝わる' : a.result === 'shared' ? '共通の話題になる' : '見方が食い違う'
      return `${name(a.actor)}が${name(a.target!)}に話す → ${out}`
    }
    if (a.kind === 'verify') return `${name(a.actor)}が確かめる`
    return `${name(a.actor)}がそのままにする`
  }

  lines.push(`# 前提から組んだ物語: ${derivation.title}`, '')
  lines.push('## エンジンが前提から判断したこと（必然）', '')
  lines.push('| 人物 | 分野（知識の正確さ） | 見込み | 許容の幅 | 実際 | ずれ（1超で違和感） | 判断 |')
  lines.push('|---|---|---|---|---|---|---|')
  for (const f of derivation.perceptions) {
    const domain = f.profileMatch === 'general' ? `${f.domain}→general` : f.domain
    lines.push(
      `| ${name(f.character)} | ${domain}（${f.accuracy}） | ${prop(f.property)} ${f.expected} | ${f.rangeMin}〜${f.rangeMax} | ${f.actual} | ${f.deviation} | ${f.noticed ? `違和感（強さ ${f.severity}）` : '気づかない'} |`,
    )
  }
  lines.push('', '## 組み上がった物語（蓋然）', '')
  if (derivation.intent) {
    const wants = [
      ...(derivation.intent.include ?? []).map((b) => BEAT_LABEL[b]),
      ...(derivation.intent.ending ? [`結末は「${ENDING_LABEL[derivation.intent.ending]}」`] : []),
    ]
    lines.push(`作者の意図: ${wants.join('、')}。この意図を満たす展開は、起こりうる展開全体の ${pct(derivation.intentShare)}。その中で最も蓋然なものを選んだ。`, '')
  }
  if (derivation.mainLine.length === 0) lines.push('出来事は起きませんでした。')
  derivation.mainLine.forEach((step, i) => {
    const a = step.action
    const why = a.factors.map((f) => FACTOR_TEXT[f.source](name(f.character), f.value)).join('、')
    lines.push(`${i + 1}. **${label(a)}** — 蓋然 ${pct(a.probability)}（${why}）`)
    const others = step.options.filter((o) => o.key !== a.key)
    if (others.length > 0) lines.push(`   - 他に起こりえたこと: ${others.map((o) => `${label(o)} ${pct(o.probability)}`).join(' / ')}`)
  })
  lines.push('', `結末: **${ENDING_LABEL[derivation.ending]}**（この道筋1本の蓋然 ${Number((derivation.mainLineProbability * 100).toPrecision(2))}%。同じ出来事でも順番が違えば別の道筋に数えるため、1本の値は小さい）`, '')
  lines.push('## この前提から起こりうる結末の割合', '')
  lines.push('| 結末 | 割合 |', '|---|---|')
  for (const e of derivation.endings) lines.push(`| ${ENDING_LABEL[e.ending]} | ${pct(e.probability)} |`)
  lines.push('', `調べた状態 ${derivation.statesExplored}${derivation.truncated ? '（上限で打ち切り。割合は調べた範囲の値）' : ''}、物語の場面 ${derivation.nodeCount}。`)
  if (derivation.warnings.length > 0) {
    lines.push('', '## 使えなかった前提', '')
    for (const w of derivation.warnings) lines.push(`- ${w}`)
  }
  return `${lines.join('\n')}\n`
}
