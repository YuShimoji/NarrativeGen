import type { KnowledgeProfile } from './anomaly-detector.js'
import type { CharacterDef } from './character-knowledge.js'
import { findKnowledgeProfile, perceiveEntity } from './character-knowledge.js'
import type { Choice, Condition, Effect, EntityDef, Model, NodeDef } from './types.js'

/**
 * SP-PREMISE-001 prototype: build a story from a few premises.
 *
 * Premises are things (entities), people (characters), what each person expects
 * of a thing (beliefs) and who is present with which thing (scene). Whether a
 * person notices a gap is decided by the engine's own perception (necessary
 * step). Who looks, who tells or asks whom, who looks again, who checks or lets
 * go is chosen by weight (probable step). What a person expects changes with
 * whose account they have heard, so a path opens or closes by the situation,
 * not by who the person is. The result is an ordinary model that the runtime replays.
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
export type StoryBeat =
  | 'noticed'
  | 'missed'
  | 'heard'
  | 'shared'
  | 'disagreement'
  | 'letGo'
  | 'verified'
  | 'asked'
  | 'realized'
  | 'dissolved'
  | 'confirmed'
  | 'unmoved'

export interface StoryIntent {
  include?: StoryBeat[]
  ending?: StoryEnding
}

export type StoryActionKind = 'look' | 'relook' | 'tell' | 'ask' | 'verify' | 'letGo'
export type LookResult = 'noticed' | 'missed'
/** looking again after hearing someone: missed→noticed, noticed→missed, noticed→noticed, missed→missed */
export type RelookResult = 'realized' | 'dissolved' | 'confirmed' | 'unmoved'
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
  result?: LookResult | RelookResult | TellResult
  weight: number
  probability: number
  factors: WeightFactor[]
  /** look, relook: what the engine judged with the expectation the person holds at that moment */
  perception?: PerceptionFact
  /** look, relook: id of the runtime event that exists when the person noticed */
  eventId?: string
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
  /** whose accounts are blended into this expectation (absent for the person's own) */
  heardFrom?: string[]
  /** the person's own expectation and tolerance before hearing anyone, when they had them */
  ownExpected?: number
  ownTolerance?: number
}

export interface PremiseReaction {
  character: string
  before: PerceptionFact | null
  after: PerceptionFact | null
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

/** What was possible in one scene of the generated model, and what the model kept playable. */
export interface SceneDerivation {
  /** every action possible in this scene, most probable first */
  options: StoryAction[]
  /** action key -> choice id, for the options the model kept as choices */
  choices: Record<string, string>
  /** action key the main line takes from here, when the scene is on the main line */
  main?: string
  /** set when nothing more can happen here */
  ending?: StoryEnding
}

/** Wording for one action: what it is, how its weight is formed, and the premise quantities read. */
export interface ActionExplanation {
  label: string
  formula: string
  factors: string[]
  /** look, relook after hearing someone: how the expectation changed and what the engine judged */
  judgment?: string
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
  /** per node id of the generated model: the actions that were possible there */
  scenes: Record<string, SceneDerivation>
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
  /** stop enumerating after this many states (default 200000) */
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
  | 'ask'
  | 'relookRealized'
  | 'relookDissolved'
  | 'relookConfirmed'
  | 'relookUnmoved'
  | 'verify'
  | 'letGo'
  | 'endVerified'
  | 'endFaded'
  | 'endNothing'
  | 'choiceLook'
  | 'choiceTell'
  | 'choiceAsk'
  | 'choiceRelook'
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
  ask: '{actor}は{target}に、[{focus}]のどこが気になるのかを尋ねる。{target}は、{property}が思っていたのと違うと答える。',
  relookRealized:
    '{actor}は{heardFrom}の話を踏まえて、[{focus}]をもう一度見る。{property}は[{noticeEvent}.expected_value]のはず。実際は[{noticeEvent}.actual_value]。今度は{actor}も違和感を覚える。',
  relookDissolved:
    '{actor}は{heardFrom}の話を踏まえて、[{focus}]をもう一度見る。実際の[{focus}.{propertyKey}]は、改めた見込みの幅に収まる。{actor}の違和感は消える。',
  relookConfirmed:
    '{actor}は{heardFrom}の話を踏まえて、[{focus}]をもう一度見る。{property}は[{noticeEvent}.expected_value]のはず。実際は[{noticeEvent}.actual_value]。{actor}の違和感は残る。',
  relookUnmoved:
    '{actor}は{heardFrom}の話を踏まえて、[{focus}]をもう一度見る。実際の[{focus}.{propertyKey}]は、やはり見込みの幅に収まる。{actor}は何も気に留めない。',
  verify: '{actor}は[{focus}]の{property}を確かめる。[{focus}.{propertyKey}]。見込みの{expected}とは違っていた。',
  letGo: '{actor}は違和感をそのままにする。',
  endVerified: '違和感は確かめられ、事実として残った。',
  endFaded: '違和感は誰にも確かめられないまま流れた。',
  endNothing: '誰も違和感を覚えなかった。この前提からは出来事が起きない。',
  choiceLook: '{actor}が見る',
  choiceTell: '{actor}が{target}に話す',
  choiceAsk: '{actor}が{target}に尋ねる',
  choiceRelook: '{actor}が見直す',
  choiceVerify: '{actor}が確かめる',
  choiceLetGo: '{actor}がそのままにする',
}

interface State {
  /** person -> key of the accounts they had heard at their latest look */
  looked: Record<string, string>
  /** person -> ids of the people whose account they have heard (sorted) */
  sources: Record<string, string[]>
  /** person -> key of the look at which they let the gap go */
  letGo: Record<string, string>
  verifiedBy: string | null
  /** someone has noticed a gap at some point */
  felt: boolean
}

interface Participant {
  id: string
  name: string
  character: CharacterDef
  /** what the person expects of the thing in front of them, if anything */
  belief?: PremiseBelief
  /** the person's own knowledge of the field, if any */
  profile?: KnowledgeProfile
  profileMatch: 'exact' | 'general' | 'none'
  accuracy: number
}

/** One expectation a person can hold: their own, or their own blended with the accounts they heard. */
interface View {
  key: string
  sources: string[]
  /** knowledge domain the runtime reads the tolerance from */
  domain: string
  expectations: Record<string, number>
  tolerance: number
  eventId: string
  fact: PerceptionFact
}

interface World {
  people: Participant[]
  view(person: string, sources: string[]): View | null
  /** the same expectation, addressed by the key a state stores */
  viewAt(person: string, key: string): View | null
  /** actions already worked out, by state key */
  actions: Map<string, StoryAction[]>
  /** where each of those actions leads, in the same order */
  next: Map<string, Array<{ state: State; key: string; beat: number }>>
}

const EMPTY_STATE: State = { looked: {}, sources: {}, letGo: {}, verifiedBy: null, felt: false }

function round(value: number, digits = 4): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

const keyOf = (sources: string[]) => sources.join('+')
const sourcesOf = (key: string) => (key === '' ? [] : key.split('+'))

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

/** average weighted by how well each person knows the field; plain average when no one does */
function blend(items: Array<{ weight: number; value: number }>): number {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  if (total > 0) return items.reduce((sum, i) => sum + i.weight * i.value, 0) / total
  return items.reduce((sum, i) => sum + i.value, 0) / items.length
}

/**
 * The expectations people can hold. A person's own comes straight from the premise.
 * After hearing others, the expected value and the tolerance are blended with theirs,
 * weighted by accuracy. Whether the person notices is always asked of the engine.
 */
function createWorld(premise: StoryPremise, people: Participant[]): World {
  const focus = premise.scene.focus
  const byId = new Map(people.map((p) => [p.id, p]))
  const cache = new Map<string, Map<string, View | null>>(people.map((p) => [p.id, new Map()]))

  function build(p: Participant, sources: string[]): View | null {
    const key = keyOf(sources)
    const members = [p, ...sources.map((id) => byId.get(id)!)]
    const holders = members.filter((m) => m.belief)
    const judges = members.filter((m) => m.profile)
    if (holders.length === 0 || judges.length === 0) return null

    let domain: string
    let expectations: Record<string, number>
    let tolerance: number
    let character: CharacterDef
    if (sources.length === 0) {
      // the person's own expectation: exactly what the runtime does with the premise as written
      if (!p.belief || !p.profile) return null
      domain = p.belief.domain
      expectations = p.belief.expectations
      tolerance = p.profile.tolerance
      character = p.character
    } else {
      const keys = [...new Set(holders.flatMap((m) => Object.keys(m.belief!.expectations)))]
      expectations = {}
      for (const k of keys) {
        const known = holders.filter((m) => k in m.belief!.expectations)
        expectations[k] = round(blend(known.map((m) => ({ weight: m.accuracy, value: m.belief!.expectations[k] }))), 6)
      }
      tolerance = round(blend(judges.map((m) => ({ weight: m.accuracy, value: m.profile!.tolerance }))), 6)
      domain = `${(p.belief ?? holders[0].belief!).domain}+${key}`
      character = { id: p.id, name: p.name, knowledgeProfiles: [{ domain, accuracy: p.accuracy, tolerance }] }
    }

    const perception = perceiveEntity(character, focus, expectations, domain, premise.entities)
    const primary = perception.anomalies.find((a) => a.anomalous) ?? perception.anomalies[0]
    if (!primary) return null
    const total = Number.isFinite(perception.totalDeviation) ? perception.totalDeviation : 0
    const fact: PerceptionFact = {
      character: p.id,
      entity: focus,
      domain,
      profileMatch: sources.length === 0 ? p.profileMatch : 'exact',
      accuracy: p.accuracy,
      tolerance,
      property: primary.propertyKey,
      expected: primary.expectedValue,
      actual: primary.actualValue,
      rangeMin: round(primary.toleranceRange[0], 6),
      rangeMax: round(primary.toleranceRange[1], 6),
      deviation: round(Number.isFinite(primary.deviation) ? primary.deviation : 0),
      noticed: perception.noticed,
      severity: Math.min(100, Math.round(total * 20)),
    }
    if (sources.length > 0) {
      fact.heardFrom = sources
      const own = p.belief?.expectations[primary.propertyKey]
      if (own !== undefined) fact.ownExpected = own
      if (p.profile) fact.ownTolerance = p.profile.tolerance
    }
    return { key, sources, domain, expectations, tolerance, eventId: `notice_${p.id}${sources.length ? `_heard_${sources.join('_')}` : ''}`, fact }
  }

  function viewAt(person: string, key: string): View | null {
    const own = cache.get(person)!
    let found = own.get(key)
    if (found === undefined) {
      found = build(byId.get(person)!, sourcesOf(key))
      own.set(key, found)
    }
    return found
  }
  return { people, view: (person, sources) => viewAt(person, keyOf(sources)), viewAt, actions: new Map(), next: new Map() }
}

function collectParticipants(premise: StoryPremise, warnings?: string[]): Participant[] {
  const { focus, present } = premise.scene
  if (!premise.entities[focus]) throw new Error(`場の物「${focus}」が物の定義にありません`)

  const people: Participant[] = []
  for (const id of present) {
    const character = premise.characters[id]
    if (!character) {
      warnings?.push(`場にいる「${id}」が人物の定義にありません`)
      continue
    }
    const belief = premise.beliefs.find((b) => b.character === id && b.entity === focus)
    const profile = findKnowledgeProfile(character, belief?.domain ?? 'general')
    people.push({
      id,
      name: character.name,
      character,
      belief,
      profile,
      profileMatch: !profile ? 'none' : belief && profile.domain === belief.domain ? 'exact' : 'general',
      accuracy: profile?.accuracy ?? 0,
    })
  }
  return people
}

/** Compare each listener's view before and after hearing the same people in the scene. */
export function comparePremiseReactions(premise: StoryPremise, witnesses: readonly string[]): PremiseReaction[] {
  const people = collectParticipants(premise)
  const sources = [...new Set(witnesses)].sort()
  for (const id of sources) {
    if (!people.some((p) => p.id === id)) throw new Error(`証言者「${id}」が場にいません`)
  }
  const world = createWorld(premise, people)
  return people.filter((person) => !sources.includes(person.id)).map(({ id }) => ({
    character: id,
    before: world.view(id, [])?.fact ?? null,
    after: world.view(id, sources)?.fact ?? null,
  }))
}

function stateKey(s: State, people: Participant[]): string {
  const each = people.map((p) => `${s.looked[p.id] ?? '-'}/${keyOf(s.sources[p.id] ?? [])}/${s.letGo[p.id] ?? '-'}`)
  return `${each.join(',')}|${s.verifiedBy ?? ''}|${s.felt ? 1 : 0}`
}

/** the expectation the person looked with last, or null when they have not looked */
function latest(world: World, s: State, c: string): View | null {
  return c in s.looked ? world.viewAt(c, s.looked[c]) : null
}

/**
 * Actions possible in a state with their weights. Every weight is built only
 * from premise quantities: the person's accuracy in the field and the engine's
 * severity of a gap someone currently holds (0..1). No action is reserved for
 * a particular person; what is open depends on what each has seen and heard.
 */
function possibleActions(world: World, s: State, key = stateKey(s, world.people)): StoryAction[] {
  if (s.verifiedBy !== null) return []
  const known = world.actions.get(key)
  if (known) return known
  const { people } = world
  // each person's standing in this state, read once
  const standing = people.map((p) => {
    const before = latest(world, s, p.id)
    const noticed = Boolean(before?.fact.noticed)
    return {
      id: p.id,
      acc: p.accuracy,
      heard: s.sources[p.id] ?? [],
      before,
      sev: noticed ? before!.fact.severity / 100 : 0,
      tension: noticed && s.letGo[p.id] !== s.looked[p.id],
    }
  })
  const of = new Map(standing.map((x) => [x.id, x]))
  const actions: Omit<StoryAction, 'probability'>[] = []

  for (const me of standing) {
    const c = me.id
    const now = world.viewAt(c, keyOf(me.heard))
    if (now && (!me.before || me.before.key !== now.key)) {
      // look, look again: the better a person knows the field, the more likely they look closely;
      // someone who heard of a gap looks at least as readily as the strongest account they heard
      let strongest: string | null = null
      for (const o of me.heard) {
        if (me.before?.sources.includes(o)) continue
        if (of.get(o)!.sev > (strongest ? of.get(strongest)!.sev : 0)) strongest = o
      }
      const factors: WeightFactor[] = [{ source: 'accuracy', character: c, value: me.acc }]
      let weight = me.acc
      if (strongest) {
        factors.push({ source: 'toldSeverity', character: strongest, value: of.get(strongest)!.sev })
        weight += of.get(strongest)!.sev
      }
      const result: LookResult | RelookResult = !me.before
        ? now.fact.noticed ? 'noticed' : 'missed'
        : now.fact.noticed
          ? me.before.fact.noticed ? 'confirmed' : 'realized'
          : me.before.fact.noticed ? 'dissolved' : 'unmoved'
      actions.push({
        key: `${me.before ? 'relook' : 'look'}:${c}`,
        kind: me.before ? 'relook' : 'look',
        actor: c,
        result,
        weight,
        factors,
        perception: now.fact,
        eventId: now.eventId,
      })
    }

    if (!me.tension) {
      // ask: someone without a gap of their own asks a person who visibly has one;
      // the less they know the field, the more they ask
      for (const o of standing) {
        if (o.id === c || !o.tension || me.heard.includes(o.id)) continue
        actions.push({
          key: `ask:${c}>${o.id}`,
          kind: 'ask',
          actor: c,
          target: o.id,
          weight: o.sev * (1 - me.acc),
          factors: [
            { source: 'severity', character: o.id, value: o.sev },
            { source: 'accuracy', character: c, value: me.acc },
          ],
        })
      }
      continue
    }

    const listeners = standing.filter((o) => o.id !== c && !o.heard.includes(c))
    for (const o of listeners) {
      // tell: the stronger the gap, the more it is voiced; the urge is shared among listeners
      const result: TellResult = !o.before ? 'heard' : o.before.fact.noticed ? 'shared' : 'disagreement'
      actions.push({
        key: `tell:${c}>${o.id}`,
        kind: 'tell',
        actor: c,
        target: o.id,
        result,
        weight: me.sev / listeners.length,
        factors: [
          { source: 'severity', character: c, value: me.sev },
          { source: 'listeners', character: c, value: listeners.length },
        ],
      })
    }
    // verify: a strong gap held by someone who knows the field gets checked
    actions.push({
      key: `verify:${c}`,
      kind: 'verify',
      actor: c,
      weight: me.sev * me.acc,
      factors: [
        { source: 'severity', character: c, value: me.sev },
        { source: 'accuracy', character: c, value: me.acc },
      ],
    })
    // let go: a weak gap held by someone unsure of the field fades
    actions.push({
      key: `letGo:${c}`,
      kind: 'letGo',
      actor: c,
      weight: (1 - me.sev) * (1 - me.acc),
      factors: [
        { source: 'severity', character: c, value: me.sev },
        { source: 'accuracy', character: c, value: me.acc },
      ],
    })
  }

  const usable = actions.filter((a) => a.weight > 0)
  const total = usable.reduce((sum, a) => sum + a.weight, 0)
  const result = usable
    .map((a) => ({ ...a, weight: round(a.weight), probability: round(a.weight / total) }))
    // ties by plain code order, so the result does not depend on the machine's locale
    .sort((a, b) => b.probability - a.probability || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  world.actions.set(key, result)
  return result
}

function withSource(s: State, listener: string, source: string): Record<string, string[]> {
  const had = s.sources[listener] ?? []
  return had.includes(source) ? s.sources : { ...s.sources, [listener]: [...had, source].sort() }
}

function applyAction(s: State, a: StoryAction): State {
  if (a.kind === 'look' || a.kind === 'relook') {
    return { ...s, looked: { ...s.looked, [a.actor]: keyOf(s.sources[a.actor] ?? []) }, felt: s.felt || Boolean(a.perception?.noticed) }
  }
  if (a.kind === 'tell') {
    // the listener hears the speaker's account; a listener who has looked answers with their own
    const heard = { ...s, sources: withSource(s, a.target!, a.actor) }
    return a.result === 'heard' ? heard : { ...heard, sources: withSource(heard, a.actor, a.target!) }
  }
  if (a.kind === 'ask') return { ...s, sources: withSource(s, a.actor, a.target!) }
  if (a.kind === 'letGo') return { ...s, letGo: { ...s.letGo, [a.actor]: s.looked[a.actor] } }
  return { ...s, verifiedBy: a.actor }
}

function endingOf(s: State): StoryEnding {
  if (s.verifiedBy !== null) return 'verified'
  return s.felt ? 'faded' : 'nothing'
}

const BEATS: StoryBeat[] = [
  'noticed', 'missed', 'heard', 'shared', 'disagreement', 'letGo', 'verified',
  'asked', 'realized', 'dissolved', 'confirmed', 'unmoved',
]

function beatOf(a: StoryAction): StoryBeat {
  if (a.kind === 'verify') return 'verified'
  if (a.kind === 'letGo') return 'letGo'
  if (a.kind === 'ask') return 'asked'
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
  const maxStates = options.maxStates ?? 200000
  const warnings: string[] = []
  const focus = premise.scene.focus
  const patterns = { ...DEFAULT_PATTERNS, ...(premise.wording?.patterns ?? {}) }

  const people = collectParticipants(premise, warnings)
  const focusName = premise.entities[focus].name
  const world = createWorld(premise, people)
  const perceptions: PerceptionFact[] = []
  for (const p of people) {
    const own = world.view(p.id, [])
    if (own) perceptions.push(own.fact)
    else if (!p.belief) warnings.push(`${p.name}には「${focusName}」への思い込みがありません。誰かの話を聞くまで、見ても比べるものがありません`)
    else if (!p.profile) warnings.push(`${p.name}に分野「${p.belief.domain}」の知識も「general」の知識もありません。誰かの話を聞くまで、見ても違和感の幅が決まりません`)
    else warnings.push(`${p.name}の見込みは、「${focusName}」の数値の性質と比べられません`)
  }
  if (perceptions.length === 0) throw new Error('場にいて、場の物への思い込みを持つ人物が一人もいません')

  const name = (id: string) => premise.characters[id]?.name ?? id
  const propertyName = (key: string) => premise.wording?.propertyNames?.[key] ?? key

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
    function walk(s: State, seen: number, here = stateKey(s, people)): Walk {
      // only the beats the intent asks for can change what counts as satisfied
      const mask = seen & need
      const key = `${here}#${mask}`
      const known = memo.get(key)
      if (known) return known
      const result: Walk = { shares: { verified: 0, faded: 0, nothing: 0 }, satisfied: 0, bestProbability: 0, bestAction: null }
      // reserve the slot first so the size limit counts states in progress too
      memo.set(key, result)
      const actions = possibleActions(world, s, here)
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
      let next = world.next.get(here)
      if (!next) {
        next = actions.map((a) => {
          const state = applyAction(s, a)
          return { state, key: stateKey(state, people), beat: beatMask([beatOf(a)]) }
        })
        world.next.set(here, next)
      }
      for (let i = 0; i < actions.length; i++) {
        const a = actions[i]
        const sub = walk(next[i].state, mask | next[i].beat, next[i].key)
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
        const actions = possibleActions(world, s)
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
  const scenes: Record<string, SceneDerivation> = {}
  const choiceIdOf = (a: StoryAction) => a.key.replace(/[:>]/g, '_')
  const pending: Array<{ id: string; state: State; onMain: boolean }> = []

  /** values for the sentence patterns; `s` is the state the action arrives at */
  function textValues(a: StoryAction | null, s: State): Record<string, string> {
    // whose gap the sentence is about: the one asked, otherwise the one acting
    const subject = a ? latest(world, s, a.kind === 'ask' ? a.target! : a.actor) : null
    const fact = subject?.fact
    return {
      focus,
      present: people.map((p) => p.name).join('、'),
      actor: a ? name(a.actor) : '',
      target: a?.target ? name(a.target) : '',
      property: fact ? propertyName(fact.property) : '',
      propertyKey: fact?.property ?? '',
      expected: fact ? String(fact.expected) : '',
      noticeEvent: subject?.eventId ?? '',
      heardFrom: subject ? subject.sources.map(name).join('と') : '',
    }
  }

  const ARRIVAL: Record<string, PatternId> = {
    noticed: 'lookNoticed',
    missed: 'lookMissed',
    realized: 'relookRealized',
    dissolved: 'relookDissolved',
    confirmed: 'relookConfirmed',
    unmoved: 'relookUnmoved',
    heard: 'tellHeard',
    shared: 'tellShared',
    disagreement: 'tellDisagreement',
  }

  function arrivalText(a: StoryAction | null, s: State): string {
    const id: PatternId = !a ? 'start' : a.kind === 'ask' ? 'ask' : a.kind === 'verify' ? 'verify' : a.kind === 'letGo' ? 'letGo' : ARRIVAL[a.result!]
    const body = fill(patterns[id], textValues(a, s))
    if (possibleActions(world, s).length > 0) return body
    const end = endingOf(s)
    const closing = end === 'verified' ? patterns.endVerified : end === 'faded' ? patterns.endFaded : patterns.endNothing
    return `${body}\n\n${closing}`
  }

  function nodeFor(s: State, arriving: StoryAction | null, onMain: boolean): string {
    const key = `${stateKey(s, people)}#${arriving?.key ?? 'start'}`
    const existing = nodeIds.get(key)
    if (existing) return existing
    const id = arriving ? `s${nodeIds.size}_${arriving.kind}_${arriving.actor}${arriving.target ? `_${arriving.target}` : ''}` : 'start'
    nodeIds.set(key, id)
    nodes[id] = { id, text: arrivalText(arriving, s) }
    pending.push({ id, state: s, onMain })
    return id
  }

  /** knowledge a person holds after hearing others, written into the model so the runtime can judge with it */
  const derivedProfiles = new Map<string, Map<string, KnowledgeProfile>>()

  function effectsOf(a: StoryAction, from: State): Effect[] {
    if (a.kind === 'look' || a.kind === 'relook') {
      const view = world.view(a.actor, from.sources[a.actor] ?? [])!
      if (view.sources.length > 0) {
        const own = derivedProfiles.get(a.actor) ?? new Map<string, KnowledgeProfile>()
        own.set(view.domain, { domain: view.domain, accuracy: view.fact.accuracy, tolerance: view.tolerance })
        derivedProfiles.set(a.actor, own)
      }
      return [{
        type: 'perceiveEntity',
        character: a.actor,
        entity: focus,
        domain: view.domain,
        expectations: view.expectations,
        eventId: view.eventId,
        eventName: `${name(a.actor)}の違和感`,
        onlyIfNoticed: true,
      }]
    }
    if (a.kind === 'ask') {
      return [{
        type: 'createEvent',
        id: `ask_${a.actor}_${a.target}`,
        name: `${name(a.actor)}が${name(a.target!)}に尋ねた`,
        properties: {
          asker: { defaultValue: a.actor },
          answerer: { defaultValue: a.target! },
          source_entity: { defaultValue: focus },
          severity: { defaultValue: latest(world, from, a.target!)!.fact.severity },
        },
      }]
    }
    const held = latest(world, from, a.actor)!
    const fact = held.fact
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
      id: `letgo_${a.actor}${held.sources.length ? `_heard_${held.sources.join('_')}` : ''}`,
      name: `${name(a.actor)}がそのままにした`,
      properties: { observer: { defaultValue: a.actor }, source_entity: { defaultValue: focus } },
    }]
  }

  /** only the knowledge-derived gate: the gap the action rests on must really exist at runtime */
  function conditionsOf(a: StoryAction, from: State): Condition[] | undefined {
    if (a.kind === 'look' || a.kind === 'relook') return undefined
    const gapOf = (c: string) => latest(world, from, c)!.eventId
    if (a.kind === 'ask') return [{ type: 'hasEvent', key: gapOf(a.target!), value: true }]
    const conditions: Condition[] = [{ type: 'hasEvent', key: gapOf(a.actor), value: true }]
    if (a.kind === 'tell' && a.result === 'shared') conditions.push({ type: 'hasEvent', key: gapOf(a.target!), value: true })
    if (a.kind === 'tell' && a.result === 'disagreement') conditions.push({ type: 'hasEvent', key: gapOf(a.target!), value: false })
    return conditions
  }

  const CHOICE: Record<StoryActionKind, PatternId> = {
    look: 'choiceLook',
    relook: 'choiceRelook',
    tell: 'choiceTell',
    ask: 'choiceAsk',
    verify: 'choiceVerify',
    letGo: 'choiceLetGo',
  }

  function choiceText(a: StoryAction, from: State): string {
    return `${fill(patterns[CHOICE[a.kind]], textValues(a, from))} 〔蓋然 ${Math.round(a.probability * 100)}%〕`
  }

  function choiceFor(from: State, a: StoryAction, onMain: boolean): Choice {
    const conditions = conditionsOf(a, from)
    return {
      id: choiceIdOf(a),
      text: choiceText(a, from),
      target: nodeFor(applyAction(from, a), a, onMain),
      ...(conditions ? { conditions } : {}),
      effects: effectsOf(a, from),
    }
  }

  // main line first, each step keeping its strongest alternatives playable
  const mainLine: StoryStep[] = []
  let cursor: State = EMPTY_STATE
  let cursorId = nodeFor(cursor, null, true)
  for (const a of mainActions) {
    const all = possibleActions(world, cursor)
    const main = all.find((o) => o.key === a.key)!
    const kept = [main, ...all.filter((o) => o.key !== main.key && o.probability >= minProbability).slice(0, alternatives)]
    const from = cursor
    nodes[cursorId].choices = kept.map((o) => choiceFor(from, o, o === main))
    scenes[cursorId] = { options: all, choices: Object.fromEntries(kept.map((o) => [o.key, choiceIdOf(o)])), main: main.key }
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
    const all = possibleActions(world, current.state)
    if (all.length > 0) {
      nodes[current.id].choices = [choiceFor(current.state, all[0], false)]
      scenes[current.id] = { options: all, choices: { [all[0].key]: choiceIdOf(all[0]) } }
    } else {
      scenes[current.id] = { options: [], choices: {}, ending: endingOf(current.state) }
    }
  }

  const knowledgeRules: Model['knowledgeRules'] = {}
  for (const p of people) {
    if (!p.belief) continue
    knowledgeRules[`belief_${p.id}_${focus}`] = {
      character: p.belief.character,
      entity: p.belief.entity,
      domain: p.belief.domain,
      expectations: p.belief.expectations,
    }
  }

  const characters: Record<string, CharacterDef> = {}
  for (const [id, character] of Object.entries(premise.characters)) {
    const derived = [...(derivedProfiles.get(id)?.values() ?? [])].sort((a, b) => (a.domain < b.domain ? -1 : 1))
    characters[id] = derived.length > 0 ? { ...character, knowledgeProfiles: [...character.knowledgeProfiles, ...derived] } : character
  }

  const model: Model = {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    flags: {},
    resources: {},
    variables: {},
    entities: premise.entities,
    characters,
    knowledgeRules,
    nodes,
  }

  const derivation: StoryDerivation = {
    title: premise.title ?? focus,
    focus,
    perceptions,
    mainLine,
    scenes,
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
  asked: '気づいていない人が尋ねる',
  realized: '聞いて見直し、違和感を覚える',
  dissolved: '聞いて見直し、違和感が消える',
  confirmed: '聞いて見直しても、違和感が残る',
  unmoved: '聞いて見直しても、気に留めない',
}

const FACTOR_TEXT: Record<WeightFactor['source'], (who: string, value: number) => string> = {
  accuracy: (who, v) => `${who}の知識の正確さ ${v}`,
  severity: (who, v) => `${who}の違和感の強さ ${v}`,
  toldSeverity: (who, v) => `${who}から聞いた違和感の強さ ${v}`,
  listeners: (who, v) => `${who}がまだ話していない相手 ${v}人`,
}

const FORMULA: Record<StoryActionKind, string> = {
  look: '知識の正確さ',
  relook: '知識の正確さ',
  ask: '相手の違和感の強さ × (1 − 知識の正確さ)',
  tell: '違和感の強さ ÷ まだ話していない相手の数',
  verify: '違和感の強さ × 知識の正確さ',
  letGo: '(1 − 違和感の強さ) × (1 − 知識の正確さ)',
}

const RELOOK_LABEL: Record<RelookResult, string> = {
  realized: '今度は違和感を覚える',
  dissolved: '違和感が消える',
  confirmed: '違和感が残る',
  unmoved: 'やはり気に留めない',
}

function actionLabel(name: (id: string) => string, a: StoryAction): string {
  if (a.kind === 'look') return `${name(a.actor)}が見る → ${a.result === 'noticed' ? '違和感を覚える' : '気に留めない'}`
  if (a.kind === 'relook') return `${name(a.actor)}が見直す → ${RELOOK_LABEL[a.result as RelookResult]}`
  if (a.kind === 'tell') {
    const out = a.result === 'heard' ? 'まだ見ていない相手に伝わる' : a.result === 'shared' ? '共通の話題になる' : '見方が食い違う'
    return `${name(a.actor)}が${name(a.target!)}に話す → ${out}`
  }
  if (a.kind === 'ask') return `${name(a.actor)}が${name(a.target!)}に尋ねる → 相手の見方を聞く`
  if (a.kind === 'verify') return `${name(a.actor)}が確かめる`
  return `${name(a.actor)}がそのままにする`
}

/** how hearing others changed the expectation the person looked with, and what the engine judged */
function judgmentText(name: (id: string) => string, prop: (key: string) => string, f: PerceptionFact | undefined): string | undefined {
  if (!f?.heardFrom?.length) return undefined
  // blended values can run to many decimals; four significant digits are enough to read the judgment
  const n = (value: number) => String(Number(value.toPrecision(4)))
  const expected = f.ownExpected === undefined
    ? `${prop(f.property)}の見込み ${n(f.expected)} を持った`
    : f.ownExpected === f.expected ? `${prop(f.property)}の見込みは ${n(f.expected)} のまま` : `${prop(f.property)}の見込みを ${n(f.ownExpected)}→${n(f.expected)} に改めた`
  const tolerance = f.ownTolerance === undefined
    ? `許容幅は ${n(f.tolerance)}`
    : f.ownTolerance === f.tolerance ? `許容幅は ${n(f.tolerance)} のまま` : `許容幅を ${n(f.ownTolerance)}→${n(f.tolerance)} に改めた`
  const judged = f.noticed ? `違和感（強さ ${f.severity}）` : '気に留めない'
  return `${f.heardFrom.map(name).join('と')}の話を聞いて、${expected}、${tolerance}。幅 ${n(f.rangeMin)}〜${n(f.rangeMax)} に対して実際は ${n(f.actual)}（ずれ ${n(f.deviation)}）→ ${judged}`
}

/** Wording for one action of a derivation, for screens that show why it was probable. */
export function explainAction(premise: StoryPremise, action: StoryAction): ActionExplanation {
  const name = (id: string) => premise.characters[id]?.name ?? id
  const prop = (key: string) => premise.wording?.propertyNames?.[key] ?? key
  const heard = action.factors.some((f) => f.source === 'toldSeverity')
  const judgment = judgmentText(name, prop, action.perception)
  return {
    label: actionLabel(name, action),
    formula: heard ? '知識の正確さ ＋ 聞いた違和感の強さ' : FORMULA[action.kind],
    factors: action.factors.map((f) => FACTOR_TEXT[f.source](name(f.character), f.value)),
    ...(judgment ? { judgment } : {}),
  }
}

export function endingLabel(ending: StoryEnding): string {
  return ENDING_LABEL[ending]
}

export function beatLabel(beat: StoryBeat): string {
  return BEAT_LABEL[beat]
}

/** Readable account of a derivation: what the engine judged, the story, and why each step was probable. */
export function describeDerivation(premise: StoryPremise, derivation: StoryDerivation): string {
  const name = (id: string) => premise.characters[id]?.name ?? id
  const prop = (key: string) => premise.wording?.propertyNames?.[key] ?? key
  const pct = (p: number) => `${(p * 100).toFixed((p > 0 && p < 0.1) || (p > 0.9 && p < 1) ? 1 : 0)}%`
  const lines: string[] = []
  const label = (a: StoryAction) => actionLabel(name, a)

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
    const judgment = judgmentText(name, prop, a.perception)
    if (judgment) lines.push(`   - 見込みの変化: ${judgment}`)
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
