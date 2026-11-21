// Japanese wording for engine trace facts. The engine returns structured facts;
// every sentence shown to the author is composed here, from those facts only.

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function num(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value ?? '')
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** Names the author wrote in the model, looked up by id. */
export function createNames(model) {
  const eventNames = {}
  for (const node of Object.values(model.nodes ?? {})) {
    for (const choice of node.choices ?? []) {
      for (const e of choice.effects ?? []) {
        if (e.type === 'createEvent') eventNames[e.id] = e.name
        if (e.type === 'perceiveEntity' && e.eventId && e.eventName) eventNames[e.eventId] = e.eventName
      }
    }
  }
  for (const p of model.perceptionPolicies ?? []) {
    if (p.eventId && p.eventName) eventNames[p.eventId] = p.eventName
  }
  return {
    event: (id, session) => session?.events?.[id]?.name ?? eventNames[id] ?? id,
    entity: (id) => model.entities?.[id]?.name ?? id,
    character: (id) => model.characters?.[id]?.name ?? id,
    choice: (nodeId, choiceId) =>
      model.nodes?.[nodeId]?.choices?.find((c) => c.id === choiceId)?.text ?? choiceId,
    eventCreators: (id) => {
      const out = []
      for (const [nodeId, node] of Object.entries(model.nodes ?? {})) {
        for (const choice of node.choices ?? []) {
          for (const e of choice.effects ?? []) {
            if ((e.type === 'createEvent' && e.id === id) || (e.type === 'perceiveEntity' && e.eventId === id)) {
              out.push({ kind: 'choice', nodeId, choiceId: choice.id, text: choice.text })
            }
          }
        }
      }
      for (const p of model.perceptionPolicies ?? []) {
        if ((p.eventId ?? `event_${p.character}_perceives_${p.entity}`) === id) {
          out.push({ kind: 'policy', policyId: p.id, node: p.trigger.node, character: p.character, entity: p.entity })
        }
      }
      return out
    },
  }
}

const OP = {
  '>=': 'が{v}以上',
  '<=': 'が{v}以下',
  '>': 'が{v}より大きい',
  '<': 'が{v}未満',
  '==': 'が{v}',
  '!=': 'が{v}ではない',
  contains: 'に「{v}」を含む',
  '!contains': 'に「{v}」を含まない',
}

function op(o, v) {
  return (OP[o] ?? `${o} {v}`).replace('{v}', esc(v))
}

/** One condition as a sentence that is true when the condition passes. */
export function conditionSentence(ct, names, session) {
  const c = ct.condition
  switch (c.type) {
    case 'hasEvent':
      return c.value
        ? `出来事「${esc(names.event(c.key, session))}」が起きている`
        : `出来事「${esc(names.event(c.key, session))}」がまだ起きていない`
    case 'flag':
      return `<span class="term">${esc(c.key)}</span> が${c.value ? 'オン' : 'オフ'}`
    case 'resource':
    case 'variable':
      return `<span class="term">${esc(c.key)}</span> ${op(c.op, c.value)}`
    case 'hasItem':
      return c.value ? `「${esc(c.key)}」を持っている` : `「${esc(c.key)}」を持っていない`
    case 'property':
      return `${esc(names.entity(c.entity))}の<span class="term">${esc(c.key)}</span> ${op(c.op, c.value)}`
    case 'knowledgeRule': {
      const k = ct.knowledge
      if (k?.characterId && k?.entityId) {
        return `${esc(names.character(k.characterId))}が${esc(names.entity(k.entityId))}の違和感に気づく`
      }
      return `知識ルール <span class="term">${esc(c.rule)}</span> で違和感に気づく`
    }
    case 'timeWindow':
      return `経過${esc(c.start)}〜${esc(c.end)}手の間`
    case 'and':
      return 'すべてを満たす'
    case 'or':
      return 'いずれかを満たす'
    case 'not':
      return '次を満たさない'
    default:
      return esc(c.type)
  }
}

/** What the engine actually read, for a short "now:" note. */
export function conditionActual(ct, names) {
  const c = ct.condition
  if (c.type === 'knowledgeRule' && ct.knowledge) {
    const k = ct.knowledge
    if (k.missingReason) return `判定できない（${esc(MISSING[k.missingReason] ?? k.missingReason)}）`
    const a = k.anomalies?.find((x) => x.anomalous) ?? k.anomalies?.[0]
    const base = a ? `${esc(a.propertyKey)} 予想${num(a.expectedValue)}・実際${num(a.actualValue)}・ずれ${num(a.deviation)}` : ''
    return `${k.noticed ? '気づいた' : '気づいていない'}${base ? `（${base}）` : ''}`
  }
  if (!('actual' in ct)) return ''
  const v = ct.actual
  if (c.type === 'hasEvent') return v ? '起きている' : 'まだ起きていない'
  if (c.type === 'hasItem') return v ? '持っている' : '持っていない'
  if (c.type === 'flag') return v === undefined ? '未設定（オフ扱い）' : v ? 'オン' : 'オフ'
  if (c.type === 'timeWindow') return `${esc(v)}手目`
  if (v === undefined) return '未設定'
  return `${esc(typeof v === 'number' ? num(v) : v)}`
}

const MISSING = {
  rule_missing: 'ルールが無い',
  character_missing: '人物が無い',
  entity_missing: '物が無い',
  profile_missing: '知識の分野が無い',
  expectation_missing: '予想値が無い',
  property_missing_or_non_numeric: '性質が無いか数値でない',
}

export function changeSentence(ch, names) {
  switch (ch.kind) {
    case 'flag':
      return `<span class="term">${esc(ch.key)}</span> ${flagWord(ch.before)} → <b>${flagWord(ch.after)}</b>`
    case 'variable':
      return `<span class="term">${esc(ch.key)}</span> 「${esc(ch.before ?? '未設定')}」→ <b>「${esc(ch.after)}」</b>`
    case 'resource': {
      const d = (ch.after ?? 0) - (ch.before ?? 0)
      return `<span class="term">${esc(ch.key)}</span> ${num(ch.before ?? 0)} → <b>${num(ch.after ?? 0)}</b>（${d >= 0 ? '+' : ''}${num(d)}）`
    }
    case 'item':
      return ch.change === 'added' ? `「${esc(ch.key)}」を<b>手に入れた</b>` : `「${esc(ch.key)}」を<b>手放した</b>`
    case 'event':
      return `出来事「<b>${esc(ch.name)}</b>」が生まれた`
    default:
      return ''
  }
}

function flagWord(v) {
  return v === undefined ? '未設定' : v ? 'オン' : 'オフ'
}

/** Event properties worth showing first; the rest stay in the detail list. */
export const HIDDEN_EVENT_PROPS = new Set([
  'knowledge_source', 'policy_source', 'policy_trigger_node', 'character_id', 'character_name',
  'perception_noticed', 'anomaly_count',
  // shown by the perception gauge already
  'total_deviation', 'primary_deviation', 'expected_value', 'actual_value', 'primary_property', 'domain',
])

export const OUTCOME = {
  created: (p, names) => `出来事「${esc(p.eventName ?? names.event(p.eventId))}」を作った`,
  not_noticed: (p) => (p.onlyIfNoticed ? '気づかなかったので、出来事は作らない' : '出来事は作られなかった'),
  already_exists: (p, names) => `出来事「${esc(names.event(p.eventId))}」は既にあるので作り直さない`,
  missing_input: () => '人物・物・知識の分野のどれかがモデルに無く、判定できない',
}
