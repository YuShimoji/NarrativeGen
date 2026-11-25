/**
 * Screen frame: a renderer-neutral description of what the player sees after
 * each step. Studio (HTML), the Unity chat (C# SDK `ScreenFrameBuilder`) and
 * WritingPage (Zen Writer Markdown) all draw the same frame, so a story looks
 * the same on every screen. The contract is docs/specs/screen-frame.md
 * (SP-SCREEN-001). The inquiry rules follow apps/studio/src/ash-ferry.js.
 */
import type { Model } from './types.js'
import type { StateChange, StepTrace } from './trace.js'
import { traceStart, traceStep } from './trace.js'

export const SCREEN_FRAME_FORMAT = 'narrativegen-screen-frame'
export const SCREEN_FRAME_VERSION = 1

export type ScreenLayout = 'standard' | 'inquiry'
export type ChoiceRole = 'choice' | 'topic' | 'travel'

export interface ScreenSpan {
  text: string
  /** Present when this word is a topic that can be chosen from the prose. */
  choiceId?: string
}

export interface ScreenChoice {
  id: string
  text: string
  /** The choice leads to a node already on this route. */
  visited: boolean
}

export interface ScreenChoiceGroup {
  role: ChoiceRole
  label: string
  choices: ScreenChoice[]
}

export interface ScreenNote {
  source: string
  text: string
}

export interface ScreenHeader {
  region: string
  title: string
  goal: string
}

export interface ScreenFrame {
  format: typeof SCREEN_FRAME_FORMAT
  version: typeof SCREEN_FRAME_VERSION
  layout: ScreenLayout
  /** 0 for the opening scene. */
  step: number
  nodeId: string
  /** The choice that led here; null for the opening scene. */
  choiceId: string | null
  /** Display text of that choice, as the player saw it. */
  choiceText: string | null
  header: ScreenHeader | null
  place: string
  speaker: string
  paragraphs: ScreenSpan[][]
  choiceGroups: ScreenChoiceGroup[]
  /** Notes written by events on the route so far, oldest first. */
  notes: ScreenNote[]
  /** This step wrote at least one note. */
  newNote: boolean
  ending: boolean
}

export interface ScreenFrameOptions {
  /** Force a layout. Default: `inquiry` when variables.表示形式 is 聞き込み. */
  layout?: ScreenLayout
}

const PROBABILITY_SUFFIX = /\s*〔蓋然 [0-9.]+%〕$/
const PARAGRAPH_BREAK = /\n\s*\n/
const TRAVEL_PREFIX = 'go_'

const GROUP_LABEL: Record<ChoiceRole, string> = { choice: '選択肢', topic: '話題', travel: '行き先' }

/** Remove the generator's probability label from a choice text. */
export function screenChoiceText(text: string): string {
  return String(text ?? '').replace(PROBABILITY_SUFFIX, '')
}

export function screenLayout(model: Model, options: ScreenFrameOptions = {}): ScreenLayout {
  if (options.layout) return options.layout
  return model.variables?.['表示形式'] === '聞き込み' ? 'inquiry' : 'standard'
}

/** `場所｜名前` → place and name. A label without `｜` is a name only. */
export function splitSpeaker(label: string | undefined): { place: string; name: string } {
  const [first, second] = (label ?? '').split('｜')
  return second ? { place: first, name: second } : { place: '', name: first ?? '' }
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

/** Split prose into paragraphs; link topic words in the inquiry layout. */
export function screenParagraphs(prose: string, topics: readonly ScreenChoice[]): ScreenSpan[][] {
  const byWord = new Map<string, ScreenChoice>()
  for (const topic of topics) if (topic.text) byWord.set(topic.text, topic)
  const words = [...byWord.keys()].sort((a, b) => b.length - a.length)
  const pattern = words.length
    ? new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
    : null
  return prose.split(PARAGRAPH_BREAK).map((paragraph) => {
    const parts = pattern ? paragraph.split(pattern) : [paragraph]
    const spans: ScreenSpan[] = []
    for (const part of parts) {
      if (!part) continue
      const topic = byWord.get(part)
      spans.push(topic ? { text: part, choiceId: topic.id } : { text: part })
    }
    return spans
  })
}

function isNote(change: StateChange): change is Extract<StateChange, { kind: 'event' | 'eventUpdate' }> {
  return change.kind === 'event' || change.kind === 'eventUpdate'
}

function noteSource(model: Model, step: StepTrace, key: string): string {
  const props = step.session.events?.[key]?.properties
  const actor = props?.asker?.defaultValue ?? props?.speaker?.defaultValue ?? props?.observer?.defaultValue
  const name = actor === undefined ? undefined : model.characters?.[String(actor)]?.name
  if (name) return name
  return splitSpeaker(model.nodes[step.fromNodeId || step.scene.nodeId]?.speaker).name
}

/** The frame for the last step of `route` (route[0] is the opening step). */
export function buildScreenFrame(model: Model, route: readonly StepTrace[], options: ScreenFrameOptions = {}): ScreenFrame {
  const step = route[route.length - 1]
  if (!step) throw new Error('buildScreenFrame: route is empty')
  const layout = screenLayout(model, options)
  const { scene } = step
  const node = model.nodes[scene.nodeId]
  const visitedNodes = new Set(route.map((s) => s.scene.nodeId))
  const available: ScreenChoice[] = scene.choices
    .filter((c) => c.available)
    .map(({ choice }) => ({ id: choice.id, text: screenChoiceText(choice.text), visited: visitedNodes.has(choice.target) }))

  const notes: ScreenNote[] = route.flatMap((s) =>
    s.changes.filter(isNote).map((c) => ({ source: noteSource(model, s, c.key), text: c.name })),
  )
  const newNote = step.changes.some(isNote)
  const previous = route.length > 1 ? route[route.length - 2] : undefined
  const chosen = previous && step.choiceId
    ? model.nodes[previous.scene.nodeId]?.choices?.find((c) => c.id === step.choiceId)
    : undefined
  const base = {
    format: SCREEN_FRAME_FORMAT,
    version: SCREEN_FRAME_VERSION,
    layout,
    step: route.length - 1,
    nodeId: scene.nodeId,
    choiceId: step.choiceId,
    choiceText: chosen ? screenChoiceText(chosen.text) : null,
    notes,
    newNote,
    ending: scene.ending,
  } as const

  if (layout === 'inquiry') {
    const { place, name } = splitSpeaker(node?.speaker)
    const topics = available.filter((c) => !c.id.startsWith(TRAVEL_PREFIX))
    const travel = available.filter((c) => c.id.startsWith(TRAVEL_PREFIX))
    const groups: ScreenChoiceGroup[] = []
    if (topics.length) groups.push({ role: 'topic', label: GROUP_LABEL.topic, choices: topics })
    if (travel.length) groups.push({ role: 'travel', label: GROUP_LABEL.travel, choices: travel })
    const vars = step.session.variables ?? {}
    return {
      ...base,
      header: { region: text(vars['地域']), title: text(vars['依頼名']), goal: text(vars['依頼']) },
      place,
      speaker: name,
      paragraphs: screenParagraphs(scene.text.text, topics),
      choiceGroups: groups,
    }
  }
  return {
    ...base,
    header: null,
    place: '',
    speaker: node?.speaker ?? '',
    paragraphs: screenParagraphs(scene.text.text, []),
    choiceGroups: available.length ? [{ role: 'choice', label: GROUP_LABEL.choice, choices: available }] : [],
  }
}

/** Play `choiceIds` from the start and return one frame per step. */
export function playScreenFrames(model: Model, choiceIds: readonly string[], options: ScreenFrameOptions = {}): ScreenFrame[] {
  const route: StepTrace[] = [traceStart(model)]
  const frames = [buildScreenFrame(model, route, options)]
  for (const id of choiceIds) {
    const last = route[route.length - 1]
    route.push(traceStep(last.session, model, id, last.templateUsage))
    frames.push(buildScreenFrame(model, route, options))
  }
  return frames
}
