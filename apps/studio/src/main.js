import { checkModel, traceStart, traceStep } from '@narrativegen/engine-ts/browser'
import {
  HIDDEN_EVENT_PROPS,
  OUTCOME,
  changeSentence,
  conditionActual,
  conditionSentence,
  createNames,
  esc,
  num,
} from './format.js'

const samples = import.meta.glob('../../../models/examples/*.json', { import: 'default' })
const sampleList = Object.keys(samples)
  .map((p) => ({ path: p, name: p.split('/').pop().replace(/\.json$/, '') }))
  .sort((a, b) => a.name.localeCompare(b.name))

const DEFAULT_SAMPLE = 'originality-spine-probe'
const app = document.getElementById('app')
const picker = document.getElementById('story-picker')

const state = {
  name: '',
  model: null,
  names: null,
  steps: [],
  cursor: 0,
  view: 'run',
  check: null,
  error: '',
  focusSeg: null,
}

// ---------------------------------------------------------------------------
// preferences (per viewer, optional)

function pref(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(`ng-studio:${key}`)
    localStorage.setItem(`ng-studio:${key}`, value)
  } catch {
    return null
  }
  return null
}

// ---------------------------------------------------------------------------
// loading

function fillPicker(extraName) {
  const opts = sampleList.map((s) => `<option value="${esc(s.path)}">${esc(s.name)}</option>`)
  if (extraName) opts.unshift(`<option value="__file">${esc(extraName)}（読み込んだファイル）</option>`)
  picker.innerHTML = opts.join('')
}

async function openSample(path) {
  const loader = samples[path]
  if (!loader) return
  const model = await loader()
  const name = path.split('/').pop().replace(/\.json$/, '')
  openModel(structuredClone(model), name)
  picker.value = path
  pref('sample', path)
}

function openModel(model, name) {
  state.error = ''
  if (!model || typeof model !== 'object' || !model.nodes || !model.startNode || !model.nodes[model.startNode]) {
    state.error = `「${name}」は物語モデルとして読めません（nodes と startNode が必要です）。`
    render()
    return
  }
  state.name = name
  state.model = model
  state.names = createNames(model)
  state.check = null
  restart()
}

function restart() {
  if (!state.model) return
  try {
    state.steps = [traceStart(state.model)]
    state.cursor = 0
    state.error = ''
  } catch (err) {
    state.steps = []
    state.error = `開始できません: ${err instanceof Error ? err.message : String(err)}`
  }
  render()
}

function choose(choiceId) {
  const current = state.steps[state.cursor]
  try {
    const step = traceStep(current.session, state.model, choiceId)
    state.steps = [...state.steps.slice(0, state.cursor + 1), step]
    state.cursor = state.steps.length - 1
  } catch (err) {
    state.error = `この選択肢を実行できません: ${err instanceof Error ? err.message : String(err)}`
  }
  render()
}

function replay(path) {
  restart()
  for (const choiceId of path) {
    const current = state.steps[state.steps.length - 1]
    state.steps.push(traceStep(current.session, state.model, choiceId))
  }
  state.cursor = state.steps.length - 1
  setView('run')
}

function setView(view) {
  state.view = view
  pref('view', view)
  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.setAttribute('aria-selected', String(tab.dataset.view === view))
  }
  render()
}

// ---------------------------------------------------------------------------
// story column

const SEG_KIND_LABEL = {
  entity: '物の性質から',
  value: '状態から',
  template: '差し込まれた文',
}

function segmentHtml(seg, path) {
  const id = `seg-${path}`
  switch (seg.kind) {
    case 'literal':
      return esc(seg.text)
    case 'entity': {
      const cls = seg.source === 'unresolved' ? 'gen gen-bad' : seg.source === 'event' ? 'gen gen-event' : 'gen gen-entity'
      return `<button type="button" class="${cls}" data-seg="${id}">${esc(seg.text)}</button>`
    }
    case 'value': {
      const cls = seg.source === 'unresolved' ? 'gen gen-bad' : 'gen gen-value'
      return `<button type="button" class="${cls}" data-seg="${id}">${esc(seg.text)}</button>`
    }
    case 'conditional':
      if (!seg.shown) return ''
      return `<span class="gen-cond" data-seg="${id}">${seg.children.map((c, i) => segmentHtml(c, `${path}-${i}`)).join('')}</span>`
    case 'template':
      return `<span class="gen-template" data-seg="${id}">${seg.children.map((c, i) => segmentHtml(c, `${path}-${i}`)).join('')}</span>`
    default:
      return ''
  }
}

function collectSegs(segments, path = '0', out = {}) {
  segments.forEach((seg, i) => {
    const p = `${path}-${i}`
    out[`seg-${p}`] = seg
    if (seg.kind === 'conditional' || seg.kind === 'template') collectSegs(seg.children, p, out)
  })
  return out
}

function storyHtml(step) {
  const { scene } = step
  const node = state.model.nodes[scene.nodeId]
  const textHtml = scene.text.exact
    ? scene.text.segments.map((s, i) => segmentHtml(s, `0-${i}`)).join('')
    : esc(scene.text.text)
  const choices = scene.choices.map((ct) => {
    if (ct.available) {
      return `<li><button type="button" class="choice" data-choice="${esc(ct.choice.id)}">${esc(ct.choice.text)}</button></li>`
    }
    const reasons = ct.conditions.filter((c) => !c.passed).map((c) => conditionSentence(c, state.names, step.session))
    return `<li><div class="choice choice-closed"><span>${esc(ct.choice.text)}</span>
      <span class="closed-why">閉じている — 開く条件: ${reasons.join('／')}</span></div></li>`
  }).join('')
  return `
    <article class="story" aria-label="本文">
      <header class="scene-head">
        <span class="speaker">${esc(node?.speaker ?? '')}</span>
        <span class="node-id" title="場面のID">${esc(scene.nodeId)}</span>
      </header>
      <div class="story-text">${textHtml}</div>
      ${scene.text.exact ? '' : '<p class="note">この本文は部分ごとの出所を復元できなかったため、そのまま表示しています。</p>'}
      ${scene.ending ? '<p class="ending">ここで物語は終わります。</p>' : `<ul class="choices">${choices}</ul>`}
      <p class="legend"><span class="sw sw-entity"></span>物の性質 <span class="sw sw-value"></span>状態 <span class="sw sw-event"></span>出来事 <span class="sw sw-template"></span>差し込まれた文 — 色の付いた語を押すと出所が出ます</p>
      <div id="seg-detail" class="seg-detail" hidden></div>
    </article>`
}

function segDetailHtml(seg) {
  const n = state.names
  if (seg.kind === 'entity') {
    if (seg.source === 'unresolved') return `<b>[${esc(seg.ref)}]</b> はどの物・出来事にも見つからず、そのまま残りました。`
    const owner = seg.source === 'event' ? `出来事「${esc(n.event(seg.entityId, current().session))}」` : `物「${esc(n.entity(seg.entityId))}」`
    const prop = seg.property ? `の性質 <span class="term">${esc(seg.property)}</span>` : 'の名前'
    const inherited = seg.suppliedBy && seg.suppliedBy !== seg.entityId ? `（値は親の「${esc(n.entity(seg.suppliedBy))}」から継承）` : ''
    return `${owner}${prop} → 「${esc(seg.text)}」${inherited}`
  }
  if (seg.kind === 'value') {
    if (seg.source === 'unresolved') return `<b>{${esc(seg.key)}}</b> はどの状態にも無く、そのまま残りました。`
    const src = { variable: '変数', flag: 'フラグ', resource: '数値' }[seg.source]
    return `${src} <span class="term">${esc(seg.key)}</span> の今の値 → 「${esc(seg.text)}」`
  }
  return ''
}

// ---------------------------------------------------------------------------
// judgment column

function current() {
  return state.steps[state.cursor]
}

function gaugeHtml(a) {
  const [lo, hi] = a.toleranceRange
  const values = [lo, hi, a.actualValue, a.expectedValue]
  let min = Math.min(...values)
  let max = Math.max(...values)
  const pad = (max - min) * 0.25 || Math.abs(max) * 0.25 || 1
  min -= pad
  max += pad
  const pos = (v) => `${(((v - min) / (max - min)) * 100).toFixed(1)}%`
  const bad = a.anomalous
  return `<div class="gauge" role="img" aria-label="予想${num(a.expectedValue)}、許容${num(lo)}〜${num(hi)}、実際${num(a.actualValue)}">
    <div class="gauge-band" style="left:${pos(lo)};width:calc(${pos(hi)} - ${pos(lo)})"></div>
    <div class="gauge-mark expected" style="left:${pos(a.expectedValue)}"></div>
    <div class="gauge-mark actual ${bad ? 'bad' : 'ok'}" style="left:${pos(a.actualValue)}"></div>
  </div>
  <div class="gauge-scale"><span>許容 ${num(lo)}〜${num(hi)}</span><span class="${bad ? 'bad-text' : ''}">実際 ${num(a.actualValue)}</span></div>`
}

function perceptionCard(p) {
  const n = state.names
  const who = esc(p.characterName ?? n.character(p.characterId))
  const what = esc(p.entityName ?? n.entity(p.entityId))
  const head = p.outcome === 'missing_input'
    ? `${who}の知覚を判定できない`
    : p.noticed ? `${who}は${what}に違和感を覚えた` : `${who}は${what}を見ても違和感を覚えなかった`
  const why = p.origin === 'policy'
    ? `場面「${esc(p.policyId ? state.model.perceptionPolicies?.find((x) => x.id === p.policyId)?.trigger.node ?? '' : '')}」に入った時に働く知覚の方針`
    : '選んだ選択肢の効果'
  const rows = p.anomalies.map((a) => `
    <div class="anomaly">
      <div class="anomaly-head"><span class="term">${esc(a.propertyKey)}</span>
        <span>予想 ${num(a.expectedValue)} ／ ずれ <b class="${a.anomalous ? 'bad-text' : ''}">${num(a.deviation)}</b>${a.anomalous ? '（1を超えたので違和感）' : '（1以下なので許容内）'}</span></div>
      ${gaugeHtml(a)}
    </div>`).join('')
  const tol = typeof p.tolerance === 'number'
    ? `<p class="sub">知識の分野「${esc(p.matchedDomain)}」の許容幅 ±${Math.round(p.tolerance * 100)}%${p.matchedDomain !== p.domain ? `（「${esc(p.domain)}」が無いので general を使用）` : ''}</p>`
    : ''
  return `<section class="card card-perception ${p.noticed ? 'is-hot' : ''}">
    <h3><span class="tag">知覚</span>${head}</h3>
    <p class="sub">${why}</p>
    ${rows}${tol}
    <p class="result">→ ${OUTCOME[p.outcome](p, n)}</p>
    <details><summary>出所</summary><dl class="ids">
      ${p.policyId ? `<dt>方針</dt><dd>${esc(p.policyId)}</dd>` : ''}
      <dt>人物</dt><dd>${esc(p.characterId)}</dd><dt>物</dt><dd>${esc(p.entityId)}</dd><dt>出来事</dt><dd>${esc(p.eventId)}</dd>
    </dl></details>
  </section>`
}

function changesCard(step) {
  const shown = step.changes.filter((c) => c.kind !== 'node')
  if (!shown.length) return ''
  const items = shown.map((c) => {
    let extra = ''
    if (c.kind === 'event') {
      const all = Object.entries(c.properties)
      const props = all.filter(([k]) => !HIDDEN_EVENT_PROPS.has(k))
      const chip = ([k, v]) => `<span class="prop"><span class="term">${esc(k)}</span> ${esc(typeof v === 'number' ? num(v) : v)}</span>`
      extra = `<div class="props">${props.map(chip).join('')}</div>`
      if (props.length < all.length) {
        extra += `<details><summary>すべての性質（${all.length}）</summary><div class="props">${all.map(chip).join('')}</div><p class="sub">出来事ID <span class="term">${esc(c.key)}</span></p></details>`
      }
    }
    return `<li>${changeSentence(c, state.names)}${extra}</li>`
  }).join('')
  const via = step.choiceId ? `「${esc(state.names.choice(step.fromNodeId, step.choiceId))}」を選んだ結果` : '開始時の状態'
  return `<section class="card"><h3><span class="tag">変化</span>${via}</h3><ul class="changes">${items}</ul></section>`
}

function compositionCard(step) {
  const { text, templates } = step.scene
  if (!text.exact) return ''
  const flat = []
  const walk = (segs) => segs.forEach((s) => { flat.push(s); if (s.kind === 'conditional' || s.kind === 'template') walk(s.children) })
  walk(text.segments)
  const ent = flat.filter((s) => s.kind === 'entity' && s.source !== 'unresolved').length
  const val = flat.filter((s) => s.kind === 'value' && s.source !== 'unresolved').length
  const bad = flat.filter((s) => (s.kind === 'entity' || s.kind === 'value') && s.source === 'unresolved').length
  const conds = flat.filter((s) => s.kind === 'conditional')
  const matched = templates.filter((t) => t.matched)
  const unmatched = templates.filter((t) => !t.matched)
  if (!ent && !val && !bad && !conds.length && !templates.length) return ''
  const n = state.names
  const s = step.session
  const tplReason = (t) => {
    const parts = []
    if (t.eventChecks.length) {
      const checks = t.eventChecks.map((c) => `<span class="term">${esc(c.key)}</span>${esc(c.op)}${esc(c.value)}`).join('・')
      parts.push(t.matchedEventId
        ? `出来事「${esc(n.event(t.matchedEventId, s))}」が ${checks} を満たした`
        : `${checks} を満たす出来事がまだ無い`)
    }
    for (const ct of t.sessionConditions) {
      parts.push(`${conditionSentence(ct, n, s)}${ct.passed ? '' : '（未達）'}`)
    }
    return parts.join('。')
  }
  const lines = []
  if (ent) lines.push(`<li><span class="sw sw-entity"></span>物の性質から ${ent} か所</li>`)
  if (val) lines.push(`<li><span class="sw sw-value"></span>状態から ${val} か所</li>`)
  if (bad) lines.push(`<li class="bad-text">解決できない参照 ${bad} か所</li>`)
  for (const c of conds) {
    lines.push(`<li>${c.shown ? '表示した' : '省いた'}条件付きの文: <span class="term">${c.negate ? '!' : ''}${esc(c.condition)}</span>${c.observed !== undefined ? `（今 ${esc(c.observed)}）` : ''}</li>`)
  }
  for (const t of matched) lines.push(`<li><span class="sw sw-template"></span>差し込み <span class="term">${esc(t.templateId)}</span>: ${tplReason(t)}</li>`)
  const notYet = unmatched.length
    ? `<details><summary>差し込まれなかった文 ${unmatched.length} 件</summary><ul class="plain">${unmatched.map((t) => `<li><span class="term">${esc(t.templateId)}</span>: ${tplReason(t)}</li>`).join('')}</ul></details>`
    : ''
  return `<section class="card"><h3><span class="tag">文章</span>本文の組み立て</h3><ul class="plain">${lines.join('')}</ul>${notYet}</section>`
}

function choicesCard(step) {
  const list = step.scene.choices
  if (!list.length) return ''
  const n = state.names
  const s = step.session
  const condLines = (conds, depth = 0) => conds.map((ct) => {
    const actual = conditionActual(ct, n)
    const kids = ct.children ? `<ul class="conds">${condLines(ct.children, depth + 1)}</ul>` : ''
    return `<li class="${ct.passed ? 'pass' : 'fail'}"><span class="mark" aria-label="${ct.passed ? '満たす' : '満たさない'}">${ct.passed ? '✓' : '✗'}</span>${conditionSentence(ct, n, s)}${actual ? `<span class="now">今: ${actual}</span>` : ''}${kids}</li>`
  }).join('')
  const creators = (ct) => {
    if (ct.passed || ct.condition.type !== 'hasEvent' || !ct.condition.value) return ''
    const by = n.eventCreators(ct.condition.key)
    if (!by.length) return '<p class="sub bad-text">この出来事を作る選択肢・方針がモデルに無いため、この選択肢は開きません。</p>'
    return `<p class="sub">開くには: ${by.map((b) => (b.kind === 'choice'
      ? `場面 ${esc(b.nodeId)} で「${esc(b.text)}」を選ぶ`
      : `場面 ${esc(b.node)} で${esc(n.character(b.character))}が${esc(n.entity(b.entity))}に違和感を覚える`)).join('、または')}</p>`
  }
  const items = list.map((ct) => `
    <li class="${ct.available ? 'open' : 'closed'}">
      <div class="choice-row"><span class="state">${ct.available ? '開' : '閉'}</span><span>${esc(ct.choice.text)}</span></div>
      ${ct.conditions.length ? `<ul class="conds">${condLines(ct.conditions)}</ul>${ct.conditions.map(creators).join('')}` : '<p class="sub">条件なし（いつでも選べる）</p>'}
    </li>`).join('')
  return `<section class="card"><h3><span class="tag">選択肢</span>開いている理由・閉じている理由</h3><ul class="choice-judge">${items}</ul></section>`
}

function judgmentHtml(step) {
  const cards = [
    ...step.perceptions.map(perceptionCard),
    changesCard(step),
    compositionCard(step),
    choicesCard(step),
  ].filter(Boolean)
  return `<aside class="judgment" aria-label="エンジンの判断">
    <h2>この場面でエンジンが判断したこと</h2>
    ${cards.join('') || '<p class="sub">この場面では、知覚・状態の変化・文章の差し込み・選択肢の条件のどれも起きていません。</p>'}
  </aside>`
}

function timelineHtml() {
  const chips = state.steps.map((step, i) => {
    const label = i === 0 ? '開始' : esc(state.names.choice(step.fromNodeId, step.choiceId))
    const hot = step.perceptions.some((p) => p.outcome === 'created') || step.changes.some((c) => c.kind === 'event')
    return `<li><button type="button" class="chip ${i === state.cursor ? 'is-current' : ''} ${hot ? 'is-hot' : ''}" data-step="${i}" title="${label}">
      <span class="chip-n">${i + 1}</span><span class="chip-node">${esc(step.scene.nodeId)}</span>${hot ? '<span class="chip-dot" aria-label="出来事あり"></span>' : ''}</button></li>`
  }).join('<li class="chip-arrow" aria-hidden="true">→</li>')
  return `<nav class="timeline" aria-label="たどった道筋"><ol>${chips}</ol></nav>`
}

function runHtml() {
  const step = current()
  if (!step) return ''
  return `<div class="run">
    <div class="run-main">${storyHtml(step)}${timelineHtml()}</div>
    ${judgmentHtml(step)}
  </div>`
}

// ---------------------------------------------------------------------------
// check view

function checkHtml() {
  const c = state.check
  if (!c) return ''
  const n = state.names
  const pathText = (path) => {
    if (!path.length) return '（開始の場面）'
    let nodeId = state.model.startNode
    const parts = []
    for (const choiceId of path) {
      const choice = state.model.nodes[nodeId]?.choices?.find((x) => x.id === choiceId)
      parts.push(esc(choice?.text ?? choiceId))
      nodeId = choice?.target ?? nodeId
    }
    return parts.join(' → ')
  }
  const issues = c.stuck.length + c.neverOpened.length + c.impossibleEvents.length + c.unresolvedRefs.length + c.missingTargets.length + c.unlinkedNodes.length + c.errors.length
  const section = (title, items, okText, render) => `
    <section class="card ${items.length ? 'has-issue' : 'is-ok'}"><h3>${title}<span class="count">${items.length}</span></h3>
      ${items.length ? `<ul class="plain">${items.map(render).join('')}</ul>` : `<p class="sub ok-text">${okText}</p>`}</section>`
  const endings = c.endings.map((e) => `<li class="ending-row"><div><span class="node-id">${esc(e.nodeId)}</span> ${pathText(e.path)}</div>
    <button type="button" class="btn btn-small" data-replay='${esc(JSON.stringify(e.path))}'>この道筋を再生</button></li>`).join('')
  return `<div class="check">
    <div class="metrics">
      <div class="metric"><span>到達できる結末</span><b>${c.endings.length}</b></div>
      <div class="metric"><span>実際に遊べた場面</span><b>${c.playedNodes.length}<small> / ${c.nodes}</small></b></div>
      <div class="metric ${issues ? 'metric-bad' : 'metric-ok'}"><span>見つかった問題</span><b>${issues}</b></div>
      <div class="metric"><span>試した状態</span><b>${c.exploredStates}${c.truncated ? '<small> 上限で打ち切り</small>' : ''}</b></div>
    </div>
    <p class="sub">エンジンで開いている選択肢をすべて実際に選び、たどり着ける状態を調べた結果です。条件の真偽は本番の実行と同じ関数で判定しています。</p>
    ${c.truncated ? `<p class="error">状態の数が上限（${c.exploredStates}）に達したので途中で打ち切りました。数値が増え続ける物語では、上限より先の状態は調べていません。下の「問題なし」は調べた範囲だけの結果です。</p>` : ''}
    <div class="check-grid">
      <section class="card"><h3>結末までの道筋<span class="count">${c.endings.length}</span></h3>${endings ? `<ul class="plain">${endings}</ul>` : '<p class="sub bad-text">どの結末にも到達できません。</p>'}</section>
      ${section('行き止まり（選べる選択肢が無い場面）', c.stuck, '行き止まりはありません。', (s) => `<li><span class="node-id">${esc(s.nodeId)}</span> ${pathText(s.path)} の後 <button type="button" class="btn btn-small" data-replay='${esc(JSON.stringify(s.path))}'>再生</button></li>`)}
      ${section('一度も開かなかった選択肢', c.neverOpened, 'すべての選択肢が、どこかの道筋で開きました。', (x) => `<li><span class="node-id">${esc(x.nodeId)}</span>「${esc(x.text)}」</li>`)}
      ${section('作られることのない出来事', c.impossibleEvents, '条件で待っている出来事は、すべてどこかで作られます。', (id) => `<li>「${esc(n.event(id))}」<span class="node-id">${esc(id)}</span></li>`)}
      ${section('解決できない参照', c.unresolvedRefs, '本文の参照はすべて解決しました。', (r) => `<li><span class="node-id">${esc(r.nodeId)}</span> ${esc(r.ref)}</li>`)}
      ${section('存在しない行き先', c.missingTargets, '行き先はすべて存在します。', (m) => `<li><span class="node-id">${esc(m.nodeId)}</span>「${esc(n.choice(m.nodeId, m.choiceId))}」→ ${esc(m.target)}</li>`)}
      ${section('どこからもつながらない場面', c.unlinkedNodes, 'すべての場面が開始からつながっています。', (id) => `<li><span class="node-id">${esc(id)}</span></li>`)}
      ${c.unplayedNodes.length ? section('つながっているが条件で届かない場面', c.unplayedNodes, '', (id) => `<li><span class="node-id">${esc(id)}</span></li>`) : ''}
      ${c.errors.length ? section('実行時のエラー', c.errors, '', (e) => `<li><span class="node-id">${esc(e.nodeId)}</span>「${esc(n.choice(e.nodeId, e.choiceId))}」: ${esc(e.message)}</li>`) : ''}
    </div>
  </div>`
}

// ---------------------------------------------------------------------------
// render and events

function render() {
  if (state.error && !state.steps.length) {
    app.innerHTML = `<p class="error">${esc(state.error)}</p>`
    return
  }
  if (state.view === 'check' && !state.check && state.model) {
    try {
      state.check = checkModel(state.model)
    } catch (err) {
      state.error = `点検できません: ${err instanceof Error ? err.message : String(err)}`
    }
  }
  const banner = state.error ? `<p class="error">${esc(state.error)}</p>` : ''
  app.innerHTML = banner + (state.view === 'check' ? checkHtml() : runHtml())
  state.error = ''
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('button')
  if (!target) return
  if (target.dataset.choice) choose(target.dataset.choice)
  else if (target.dataset.step) {
    state.cursor = Number(target.dataset.step)
    render()
  } else if (target.dataset.replay) {
    replay(JSON.parse(target.dataset.replay))
  } else if (target.dataset.seg) {
    const found = collectSegs(current().scene.text.segments)[target.dataset.seg]
    const detail = document.getElementById('seg-detail')
    if (detail && found) {
      detail.innerHTML = segDetailHtml(found)
      detail.hidden = false
    }
  }
})

picker.addEventListener('change', () => {
  if (picker.value !== '__file') openSample(picker.value)
})
document.getElementById('restart').addEventListener('click', () => {
  restart()
})
for (const tab of document.querySelectorAll('.view-tab')) {
  tab.addEventListener('click', () => setView(tab.dataset.view))
}

// open a model by dropping a JSON file anywhere
const hint = document.getElementById('drop-hint')
window.addEventListener('dragover', (e) => {
  e.preventDefault()
  hint.hidden = false
})
window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget) hint.hidden = true
})
window.addEventListener('drop', async (e) => {
  e.preventDefault()
  hint.hidden = true
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  try {
    const model = JSON.parse(await file.text())
    const name = file.name.replace(/\.json$/i, '')
    fillPicker(name)
    picker.value = '__file'
    openModel(model, name)
  } catch {
    state.error = `「${file.name}」はJSONとして読めません。`
    render()
  }
})

fillPicker()
const savedView = pref('view')
if (savedView === 'check' || savedView === 'run') state.view = savedView
const savedSample = pref('sample')
const initial = sampleList.find((s) => s.path === savedSample) ?? sampleList.find((s) => s.name === DEFAULT_SAMPLE) ?? sampleList[0]
openSample(initial.path).then(() => setView(state.view))
