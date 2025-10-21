// Deterministic, non-AI paraphrase utilities for Japanese
// NOTE: This is a lightweight heuristic module, no external deps.

export type ParaphraseStyle = 'desu-masu' | 'da-dearu' | 'plain'

export interface ParaphraseOptions {
  variantCount?: number
  style?: ParaphraseStyle
  seed?: number
}

// A tiny default synonyms map (can be extended). Keys should be base forms.
const DEFAULT_SYNONYMS: Record<string, string[]> = {
  '見る': ['見渡す', '眺める', '見つめる'],
  '開ける': ['開く', '押し開ける', 'そっと開ける'],
  '歩く': ['進む', '歩みを進める', '歩み寄る'],
  '走る': ['駆ける', '駆け抜ける', '走り去る'],
  '静か': ['ひっそり', '穏やか', 'しんと'],
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

function applySynonyms(text: string, rnd: () => number): string {
  let out = text
  for (const [key, variants] of Object.entries(DEFAULT_SYNONYMS)) {
    if (out.includes(key)) {
      out = out.replaceAll(key, pick(variants, rnd))
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
    let t = applySynonyms(text, rnd)
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
