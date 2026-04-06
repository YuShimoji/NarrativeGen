import type { Model, SessionState } from './types.js'
import { expandTemplate } from './template.js'
import { findMatchingTemplates } from './conversation-templates.js'

/**
 * SP-TGEN-001: レガシーな `{flag:…}` / `{resource:…}` 等を先に展開する（段階0）。
 * Web Tester 由来の互換用。`expandTemplate` の `{name}` 形式と併存する。
 */
export function applyLegacySessionPlaceholders(text: string, session: SessionState): string {
  let resolved = text

  Object.entries(session.flags ?? {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{flag:${escapeRegExp(key)}\\}`, 'g'), value ? 'true' : 'false')
  })

  Object.entries(session.resources ?? {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{resource:${escapeRegExp(key)}\\}`, 'g'), String(value))
  })

  Object.entries(session.variables ?? {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{variable:${escapeRegExp(key)}\\}`, 'g'), String(value))
  })

  resolved = resolved.replace(/\{nodeId\}/g, session.nodeId)
  resolved = resolved.replace(/\{time\}/g, String(session.time))

  return resolved
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface ResolveNarrativeDisplayTextOptions {
  /**
   * false のとき ConversationTemplate の末尾連結を行わない（GUI プレビュー等）。
   * 既定は true（プレイ本線と同一）。
   */
  appendConversationTemplates?: boolean
}

/**
 * プレイヤー向けにノード本文を決定論的に合成する（SP-TGEN-001 段階0〜3、追跡なし）。
 *
 * 順序: レガシー置換 → expandTemplate（entities/events がある場合のみ）→ 会話テンプレート末尾連結（任意）。
 * `expandTemplateWithTracking` や `model.metadata` 置換は含めない（別イテレーション）。
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
    resolved = expandTemplate(resolved, model, session)
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
