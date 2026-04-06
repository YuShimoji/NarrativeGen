import type { Model, SessionState } from './types.js'
import {
  applyLegacySessionPlaceholders,
  expandTemplateCore,
  expandTemplateWithTracking,
} from './template.js'
import { findMatchingTemplates } from './conversation-templates.js'
import type { DescriptionState } from './description-tracker.js'

export { applyLegacySessionPlaceholders } from './template.js'

export interface ResolveNarrativeDisplayTextOptions {
  /**
   * false のとき ConversationTemplate の末尾連結を行わない（GUI プレビュー等）。
   * 既定は true（プレイ本線と同一）。
   */
  appendConversationTemplates?: boolean
}

export interface ResolveNarrativeDisplayTextTrackedOptions extends ResolveNarrativeDisplayTextOptions {
  /** SP-TGEN 段階2: 描写追跡の入力状態（省略時は空） */
  descriptionState?: DescriptionState
  /** `[entity~]` 選択の決定論シード（既定 0） */
  descriptionSeed?: number
}

export interface ResolveNarrativeDisplayTextTrackedResult {
  text: string
  descriptionState: DescriptionState
}

/**
 * プレイヤー向けにノード本文を決定論的に合成する（SP-TGEN-001 段階0〜3、追跡なし）。
 *
 * 順序: 段階0（レガシー置換）→ `expandTemplateCore`（entities/events がある場合のみ）→ 会話テンプレート末尾連結（任意）。
 * `[entity~]` 描写追跡が必要な場合は `resolveNarrativeDisplayTextTracked` を使う。
 */
export function resolveNarrativeDisplayText(
  rawText: string,
  model: Model,
  session: SessionState,
  options?: ResolveNarrativeDisplayTextOptions
): string {
  if (!rawText || !session) return rawText

  const appendTemplates = options?.appendConversationTemplates !== false

  let resolved = applyLegacySessionPlaceholders(rawText, session)

  if (model?.entities || session?.events) {
    resolved = expandTemplateCore(resolved, model, session)
  }

  if (
    appendTemplates &&
    model?.conversationTemplates &&
    model.conversationTemplates.length > 0 &&
    session?.events
  ) {
    const matches = findMatchingTemplates(model.conversationTemplates, session, model)
    if (matches.length > 0) {
      const insertions = matches.map(m => m.expandedText).join(' ')
      resolved = `${resolved} ${insertions}`
    }
  }

  return resolved
}

/**
 * 段階0〜3に加え SP-TEXT の `[entity~]` 描写追跡（段階2）を含む合成。
 * 段階0→`[entity~]`→段階1+ は `expandTemplateWithTracking` 内で一括する。
 */
export function resolveNarrativeDisplayTextTracked(
  rawText: string,
  model: Model,
  session: SessionState,
  options?: ResolveNarrativeDisplayTextTrackedOptions
): ResolveNarrativeDisplayTextTrackedResult {
  if (!rawText || !session) {
    return { text: rawText, descriptionState: options?.descriptionState ?? {} }
  }

  const appendTemplates = options?.appendConversationTemplates !== false
  const descIn = options?.descriptionState ?? {}
  const seed = options?.descriptionSeed ?? 0

  let resolved: string
  let descriptionState: DescriptionState

  if (model?.entities || session?.events) {
    const tracked = expandTemplateWithTracking(rawText, model, session, descIn, seed)
    resolved = tracked.text
    descriptionState = tracked.descriptionState
  } else {
    resolved = applyLegacySessionPlaceholders(rawText, session)
    descriptionState = descIn
  }

  if (
    appendTemplates &&
    model?.conversationTemplates &&
    model.conversationTemplates.length > 0 &&
    session?.events
  ) {
    const matches = findMatchingTemplates(model.conversationTemplates, session, model)
    if (matches.length > 0) {
      const insertions = matches.map(m => m.expandedText).join(' ')
      resolved = `${resolved} ${insertions}`
    }
  }

  return { text: resolved, descriptionState }
}
