// Deterministic, non-AI paraphrase utilities for Japanese
// NOTE: This is a lightweight heuristic module, no external deps.

import type { EntityDef, PropertyDef } from './types'
import { getEntityProperties } from './entities.js'

export type ParaphraseStyle = 'desu-masu' | 'da-dearu' | 'plain'

/** Conditional variant with optional property-matching conditions */
export interface ConditionalVariant {
  text: string
  /** Property key → required value for this variant to be eligible */
  match?: Record<string, string | number | boolean>
  /** Selection weight (default: 1.0). Higher = more likely to be chosen */
  weight?: number
}

/** A dictionary entry: plain string (unconditional) or conditional variant */
export type ParaphraseEntry = string | ConditionalVariant

/** Property-aware lexicon (superset of ParaphraseLexicon) */
export type PropertyAwareLexicon = Record<string, ParaphraseEntry[]>

/** Legacy flat lexicon (backward compat) */
export type ParaphraseLexicon = Record<string, string[]>

/** Variant usage count for repetition avoidance */
export type UsageHistory = Record<string, number>

/** Entity context for property-aware selection */
export interface ParaphraseContext {
  entityId?: string
  /** Resolved properties (output of getEntityProperties or manual) */
  properties?: Record<string, { defaultValue?: string | number | boolean }>
}

export interface ParaphraseOptions {
  variantCount?: number
  style?: ParaphraseStyle
  seed?: number
  /** Per-call lexicon override (supports both legacy and property-aware) */
  lexicon?: PropertyAwareLexicon | ParaphraseLexicon
  /** Entity context for property matching */
  context?: ParaphraseContext
  /** Usage history for repetition avoidance */
  usageHistory?: UsageHistory
}

const DEFAULT_SYNONYMS: PropertyAwareLexicon = {
  '見る': ['見渡す', '眺める', '見つめる'],
  '開ける': ['開く', '押し開ける', 'そっと開ける'],
  '歩く': ['進む', '歩みを進める', '歩み寄る'],
  '走る': ['駆ける', '駆け抜ける', '走り去る'],
  '静か': ['ひっそり', '穏やか', 'しんと'],
  // English (for sample/demo models)
  'Get up': ['Stand up', 'Rise to your feet', 'Get to your feet'],
  'get up': ['stand up', 'rise to your feet', 'get to your feet'],
  'Wake up': ['Awaken', 'Open your eyes', 'Come to'],
  'wake up': ['awaken', 'open your eyes', 'come to'],
  'Open door': ['Open the door', 'Push open the door', 'Crack the door open'],
  'open door': ['open the door', 'push open the door', 'crack the door open'],
  'You wake up.': ['You come to.', 'You open your eyes.', 'You awaken.'],
  'You see the door.': ['You notice the door.', 'You can see a door.', 'There is a door.'],
}

// Runtime lexicon (designer-extendable). Initialized from defaults.
let RUNTIME_SYNONYMS: PropertyAwareLexicon = { ...DEFAULT_SYNONYMS }

export function getParaphraseLexicon(): PropertyAwareLexicon {
  return { ...RUNTIME_SYNONYMS }
}

export function setParaphraseLexicon(
  lexicon: PropertyAwareLexicon | ParaphraseLexicon,
  options: { merge?: boolean } = { merge: true },
): void {
  if (options.merge === false) {
    RUNTIME_SYNONYMS = { ...lexicon }
  } else {
    RUNTIME_SYNONYMS = { ...RUNTIME_SYNONYMS, ...lexicon }
  }
}

/** Create an empty usage history */
export function createUsageHistory(): UsageHistory {
  return {}
}

/** Record that a variant text was used */
export function recordUsage(history: UsageHistory, text: string): void {
  history[text] = (history[text] ?? 0) + 1
}

/**
 * Build a ParaphraseContext from a model's entity definitions.
 * Resolves all inherited properties for the given entity.
 */
export function buildParaphraseContext(
  entityId: string,
  entities: Record<string, EntityDef>,
): ParaphraseContext {
  const properties = getEntityProperties(entityId, entities)
  return { entityId, properties }
}

// --- Internal helpers ---

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Normalize a ParaphraseEntry to ConditionalVariant */
function normalizeEntry(entry: ParaphraseEntry): ConditionalVariant {
  if (typeof entry === 'string') return { text: entry }
  return entry
}

/** Check if a variant's match conditions are satisfied by the given properties */
function matchesContext(
  variant: ConditionalVariant,
  context?: ParaphraseContext,
): boolean {
  if (!variant.match) return true // no conditions = always matches
  if (!context?.properties) return false // has conditions but no context = no match

  for (const [key, expected] of Object.entries(variant.match)) {
    const prop = context.properties[key]
    if (!prop || prop.defaultValue === undefined) return false
    if (prop.defaultValue !== expected) return false
  }
  return true
}

/** Score a variant based on weight and usage history (higher = better) */
function scoreVariant(
  variant: ConditionalVariant,
  usageHistory?: UsageHistory,
): number {
  const weight = variant.weight ?? 1.0
  const usageCount = usageHistory?.[variant.text] ?? 0
  return weight / (usageCount + 1)
}

/**
 * Select a variant from entries using property matching, usage history, and PRNG.
 *
 * Algorithm:
 * 1. Normalize all entries to ConditionalVariant
 * 2. Partition into conditional (has match) and unconditional (no match)
 * 3. Filter conditional variants against context
 * 4. If conditional matches exist, use them; otherwise fall back to unconditional
 * 5. Score candidates by weight / (usageCount + 1)
 * 6. Pick from top-scored candidates using PRNG
 */
function selectVariant(
  entries: ParaphraseEntry[],
  rnd: () => number,
  context?: ParaphraseContext,
  usageHistory?: UsageHistory,
): string {
  const variants = entries.map(normalizeEntry)

  const conditional = variants.filter(v => v.match != null)
  const unconditional = variants.filter(v => v.match == null)

  // Filter conditional variants that match the context
  const matchedConditional = conditional.filter(v => matchesContext(v, context))

  // Prefer conditional matches; fall back to unconditional
  const candidates = matchedConditional.length > 0
    ? matchedConditional
    : unconditional.length > 0
      ? unconditional
      : variants // last resort: all variants

  if (candidates.length === 0) return ''
  if (candidates.length === 1) return candidates[0].text

  // Score and select
  const scored = candidates.map(v => ({
    text: v.text,
    score: scoreVariant(v, usageHistory),
  }))
  const maxScore = Math.max(...scored.map(s => s.score))
  const topCandidates = scored.filter(s => s.score >= maxScore - 0.001)

  const chosen = topCandidates[Math.floor(rnd() * topCandidates.length)]
  return chosen.text
}

function applySynonyms(
  text: string,
  rnd: () => number,
  lex?: PropertyAwareLexicon | ParaphraseLexicon,
  context?: ParaphraseContext,
  usageHistory?: UsageHistory,
): string {
  let out = text
  const dict = lex ?? RUNTIME_SYNONYMS
  for (const [key, entries] of Object.entries(dict)) {
    if (out.includes(key)) {
      const selected = selectVariant(entries, rnd, context, usageHistory)
      if (selected) {
        out = out.replaceAll(key, selected)
        if (usageHistory) {
          recordUsage(usageHistory, selected)
        }
      }
    }
  }
  return out
}

function toDaDearu(text: string): string {
  // simple heuristic conversions
  return text
    .replaceAll('です。', 'だ。')
    .replaceAll('ます。', 'る。')
    .replaceAll('でしょう。', 'だろう。')
}

function toDesuMasu(text: string): string {
  // simple heuristic conversions
  return text
    .replaceAll('だ。', 'です。')
    .replaceAll('る。', 'ます。')
    .replaceAll('だろう。', 'でしょう。')
}

export function paraphraseJa(text: string, options: ParaphraseOptions = {}): string[] {
  const variants = Math.max(1, Math.min(5, options.variantCount ?? 3))
  const rnd = mulberry32(options.seed ?? 123456)
  const results: string[] = []
  for (let i = 0; i < variants; i++) {
    let t = applySynonyms(text, rnd, options.lexicon, options.context, options.usageHistory)
    if (options.style === 'da-dearu') t = toDaDearu(t)
    else if (options.style === 'desu-masu') t = toDesuMasu(t)
    results.push(t)
  }
  return Array.from(new Set(results))
}

export function chooseParaphrase(text: string, options?: ParaphraseOptions): string {
  const list = paraphraseJa(text, { variantCount: 1, ...options })
  return list[0] ?? text
}
