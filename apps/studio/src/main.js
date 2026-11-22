import { beatLabel, checkModel, endingLabel, explainAction, generateStory, traceStart, traceStep } from '@narrativegen/engine-ts/browser'
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
import * as edit from './edit.js'

// models/generated holds stories built from models/premises (SP-PREMISE-001); they open like any other story
const samples = {
  ...import.meta.glob('../../../models/examples/*.json', { import: 'default' }),
  ...import.meta.glob('../../../models/generated/*.json', { import: 'default' }),
}
// the premise a generated story was built from, by the same file name
const premises = import.meta.glob('../../../models/premises/*.json', { import: 'default' })
const sampleList = Object.keys(samples)
  .map((p) => {
    const base = p.split('/').pop().replace(/\.json$/, '')
    return { path: p, name: p.includes('/models/generated/') ? `${base}（前提から生成）` : base }
  })
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
  // editing
  source: null, // { kind: 'sample', file } | { kind: 'file', fileName }
  editing: false,
  dirty: new Set(),
  notice: '',
  saving: false,
  open: new Set(), // which <details> in the editor stay open across re-renders
  // for a story built from a premise: { premise, derivation, baseline, fresh } (SP-PREMISE-001 4.1)
  story: null,
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
  openModel(structuredClone(model), name, { kind: 'sample', file: path.replace(/^(\.\.\/)+/, '') }, await storyFor(path, model))
  picker.value = path
  pref('sample', path)
}

/** Key-order independent JSON, to tell whether a model still equals what its premise builds. */
function canon(value) {
  return JSON.stringify(value, (key, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v)
}

/** For a story in models/generated: rebuild it from its premise through the engine and keep the derivation. */
async function storyFor(path, model) {
  if (!path.includes('/models/generated/')) return null
  const loader = premises[path.replace('/models/generated/', '/models/premises/')]
  if (!loader) return null
  try {
    const premise = await loader()
    const built = generateStory(structuredClone(premise))
    const baseline = canon(built.model)
    return { premise, derivation: built.derivation, baseline, fresh: baseline === canon(model) }
  } catch {
    return null
  }
}

function isGenerated() {
  return state.source?.kind === 'sample' && state.source.file.startsWith('models/generated/')
}

function openModel(model, name, source, story = null) {
  state.error = ''
  state.story = story
  state.source = source ?? null
  state.dirty = new Set()
  state.notice = ''
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
  updateSaveArea()
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

function replayQuiet(path) {
  for (const choiceId of path) {
    const last = state.steps[state.steps.length - 1]
    const ct = last.scene.choices.find((c) => c.choice.id === choiceId)
    if (!ct || !ct.available) break
    state.steps.push(traceStep(last.session, state.model, choiceId))
  }
  state.cursor = state.steps.length - 1
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
        <button type="button" class="btn btn-small edit-toggle" data-act="edit">✎ この場面を編集</button>
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

// ---------------------------------------------------------------------------
// probability (stories built from a premise): read from the engine's derivation, never recomputed here

const pct = (p) => `${(p * 100).toFixed((p > 0 && p < 0.1) || (p > 0.9 && p < 1) ? 1 : 0)}%`

function storyInStep() {
  const s = state.story
  return !!s && (state.dirty.size ? canon(state.model) === s.baseline : s.fresh)
}

function shareRow(label, p, extra = '', cls = '') {
  return `<li class="${cls}"><div class="share-head"><span class="share-label">${label}</span><b>${pct(p)}</b></div>
    <div class="share-bar" aria-hidden="true"><div style="width:${(p * 100).toFixed(1)}%"></div></div>${extra}</li>`
}

function wholeStoryHtml(d) {
  const rows = d.endings.map((e) => shareRow(esc(endingLabel(e.ending)), e.probability)).join('')
  const wants = d.intent
    ? [...(d.intent.include ?? []).map(beatLabel), ...(d.intent.ending ? [`結末は「${endingLabel(d.intent.ending)}」`] : [])]
    : []
  const intent = wants.length
    ? `<p class="sub">作者の意図: ${wants.map(esc).join('、')}。満たす展開は全体の ${pct(d.intentShare)}。主線はその中で最も蓋然なもの。</p>`
    : ''
  return `<p class="sub">この前提から起こりうる展開すべてが行き着く結末の割合（調べた状態 ${d.statesExplored}${d.truncated ? '・上限で打ち切り' : ''}）</p>
    <ul class="shares">${rows}</ul>${intent}`
}

function probabilityCard(step) {
  const story = state.story
  if (!story) return ''
  if (!storyInStep()) {
    const why = state.dirty.size
      ? 'この物語を手で直したので、前提から組んだ時の蓋然と理由は出せません。直した物語を残す時は「写して育てる」を使います。'
      : '保存されている物語が、今の前提から組んだものと違います。<span class="term">npm run generate:story</span> で組み直すと、蓋然と理由が出ます。'
    return `<section class="card card-prob"><h3><span class="tag">蓋然</span>前提から組んだ物語と違っています</h3><p class="sub">${why}</p></section>`
  }
  const d = story.derivation
  const scene = d.scenes[step.scene.nodeId]
  if (!scene) return ''
  let arrived = ''
  if (step.choiceId) {
    const prev = d.scenes[step.fromNodeId]
    const key = prev && Object.keys(prev.choices).find((k) => prev.choices[k] === step.choiceId)
    const act = key && prev.options.find((o) => o.key === key)
    if (act) {
      const came = explainAction(story.premise, act)
      arrived = `<p class="sub">ここへ来た行為: ${esc(came.label)}（蓋然 ${pct(act.probability)}・${prev.main === key ? '主線' : '脇道'}）</p>${
        came.judgment ? `<p class="sub heard">${esc(came.judgment)}</p>` : ''}`
    }
  }
  if (!scene.options.length) {
    return `<section class="card card-prob"><h3><span class="tag">蓋然</span>結末: ${esc(endingLabel(scene.ending))}</h3>${arrived}${wholeStoryHtml(d)}</section>`
  }
  const rows = scene.options.map((o) => {
    const ex = explainAction(story.premise, o)
    const kept = scene.choices[o.key]
    const isMain = scene.main === o.key
    const badge = isMain ? '<span class="badge badge-main">主線</span>' : kept ? '' : '<span class="badge">選択肢にしていない</span>'
    const why = `<p class="sub">重み ${num(o.weight)} ＝ ${esc(ex.formula)}（${ex.factors.map(esc).join('、')}）</p>${
      ex.judgment ? `<p class="sub heard">${esc(ex.judgment)}</p>` : ''}`
    return shareRow(`${esc(ex.label)}${badge}`, o.probability, why, `${isMain ? 'is-main' : ''} ${kept ? '' : 'is-left-out'}`)
  }).join('')
  const leftOut = scene.options.some((o) => !scene.choices[o.key])
    ? `<p class="sub">${scene.main
        ? '選択肢にするのは、主線の行為と、蓋然が10%以上の別の行為を上から2つまで。'
        : 'ここは脇道なので、最も蓋然な行為だけを選択肢にしている。'}</p>`
    : ''
  const whole = step.scene.nodeId === state.model.startNode
    ? `<details><summary>この前提から起こりうる結末</summary>${wholeStoryHtml(d)}</details>`
    : ''
  return `<section class="card card-prob"><h3><span class="tag">蓋然</span>この場面で起こりうること</h3>${arrived}
    <p class="sub">割合は、行為の重みを、この場面で可能な行為の重みの合計で割った値。重みは前提の数値から作る。</p>
    <ul class="shares">${rows}</ul>${leftOut}${whole}</section>`
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
    probabilityCard(step),
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
    <div class="run-main">${state.editing ? editorHtml(step) : storyHtml(step)}<div id="timeline-wrap">${timelineHtml()}</div></div>
    ${judgmentHtml(step)}
  </div>`
}

// ---------------------------------------------------------------------------
// editor (in place of the story column; the judgment column follows every edit)

const RULE_OPS = {
  resource: ['>=', '<=', '>', '<', '=='],
  variable: ['==', '!=', 'contains', '!contains', '>=', '<=', '>', '<'],
}
const OP_LABEL = { '>=': '以上', '<=': '以下', '>': 'より大きい', '<': '未満', '==': 'と等しい', '!=': 'と違う', contains: 'を含む', '!contains': 'を含まない' }
const TRUE_LABEL = {
  flag: ['オン', 'オフ'],
  setFlag: ['オンにする', 'オフにする'],
  hasEvent: ['起きている', 'まだ起きていない'],
  hasItem: ['持っている', '持っていない'],
}

function effectSentence(e) {
  const n = state.names
  switch (e.type) {
    case 'perceiveEntity':
      return `${esc(n.character(e.character))}が${esc(n.entity(e.entity))}を知覚する（分野 ${esc(e.domain)}${e.eventId ? `、出来事 ${esc(n.event(e.eventId))}` : ''}）`
    case 'modifyVariable':
      return `<span class="term">${esc(e.key)}</span> ${esc(e.op)} ${esc(e.value)}`
    case 'goto':
      return `場面 ${esc(e.target)} へ移る`
    default:
      return esc(e.type)
  }
}

function options(values, selected, label = (v) => v) {
  return values.map((v) => `<option value="${esc(v)}"${String(v) === String(selected) ? ' selected' : ''}>${esc(label(v))}</option>`).join('')
}

// every editable value carries the path to it in the model (data-path) and how to read it (data-type)
const at = (path) => `data-path="${esc(JSON.stringify(path))}"`
const removeBtn = (path, label = '消す') => `<button type="button" class="rule-x" data-act="remove-at" ${at(path)} aria-label="${label}">✕</button>`
const PROPERTY_OPS = ['==', '!=', '>=', '<=', '>', '<']

function ruleLabel(id) {
  const r = state.model.knowledgeRules?.[id]
  if (!r) return `${id}（無いルール）`
  return `${state.names.character(r.character)}→${state.names.entity(r.entity)}（${r.domain}）`
}

function valueInput(path, value, type, cls = 'rule-val') {
  if (type === 'boolean') return `<select ${at(path)} data-type="bool">${options(['true', 'false'], String(value), (v) => (v === 'true' ? 'true（はい）' : 'false（いいえ）'))}</select>`
  if (type === 'number') return `<input class="${cls}" type="number" step="any" value="${esc(value)}" ${at(path)} data-type="num" aria-label="値">`
  return `<input class="${cls}" value="${esc(value)}" ${at(path)} aria-label="値" size="${Math.max(4, String(value ?? '').length)}">`
}

/** Who perceives what, with which knowledge, expecting which values; shared by rules, effects and policies. */
function perceptionForm(obj, path, { event = false } = {}) {
  const m = state.model
  const n = state.names
  const chars = Object.keys(m.characters ?? {})
  const ents = Object.keys(m.entities ?? {})
  const domains = edit.domainsOf(m, obj.character)
  const domainOpts = domains.includes(obj.domain) ? domains : [...domains, obj.domain]
  const props = edit.entityProperties(m, obj.entity)
  const numeric = edit.numericProperties(m, obj.entity)
  const profiles = m.characters?.[obj.character]?.knowledgeProfiles ?? []
  const profile = profiles.find((p) => p.domain === obj.domain) ?? profiles.find((p) => p.domain === 'general')
  const tol = profile && typeof profile.tolerance === 'number'
    ? `<span class="sub">許容幅 ±${Math.round(profile.tolerance * 100)}%${profile.domain !== obj.domain ? '（この分野が無いので general）' : ''}</span>`
    : '<span class="sub bad-text">この人物にこの分野も general も無い</span>'
  const exps = Object.entries(obj.expectations ?? {})
  const expHtml = exps.map(([k, v]) => `<span class="exp"><span class="term">${esc(k)}</span><span>は</span>${valueInput([...path, 'expectations', k], v, 'number')}<span>前後のはず</span><span class="sub">（初期値 ${esc(props[k]?.defaultValue ?? '—')}）</span>${removeBtn([...path, 'expectations', k], '予想を消す')}</span>`).join('')
  const free = numeric.filter((k) => !(k in (obj.expectations ?? {})))
  const addExp = free.length
    ? `<select class="rule-add" data-act="add-exp" ${at([...path, 'expectations'])} aria-label="予想を足す"><option value="">＋予想</option>${options(free, '')}</select>`
    : ''
  const warn = exps.length ? '' : `<span class="sub bad-text">${numeric.length ? '予想が1つも無いので、何とも比べません' : 'この物に数値の性質が無いので、予想を置けません'}</span>`
  return `<div class="pform">
    <div class="pf-row">
      <select ${at([...path, 'character'])} aria-label="人物">${options(chars.includes(obj.character) ? chars : [...chars, obj.character], obj.character, (v) => n.character(v))}</select><span>が</span>
      <select ${at([...path, 'entity'])} aria-label="物">${options(ents.includes(obj.entity) ? ents : [...ents, obj.entity], obj.entity, (v) => n.entity(v))}</select><span>を、分野</span>
      <select ${at([...path, 'domain'])} aria-label="知識の分野">${options(domainOpts, obj.domain)}</select><span>の知識で見る</span>${tol}
    </div>
    <div class="pf-row">${expHtml}${addExp}${warn}</div>
    ${event ? `<div class="pf-row"><span>違和感から生まれる出来事</span>
      <input value="${esc(obj.eventId ?? '')}" ${at([...path, 'eventId'])} data-type="opt" placeholder="event_${esc(obj.character)}_perceives_${esc(obj.entity)}" aria-label="出来事のID" size="18">
      <span>名前</span><input value="${esc(obj.eventName ?? '')}" ${at([...path, 'eventName'])} data-type="opt" aria-label="出来事の名前" size="14">
      <label class="pf-check"><input type="checkbox" ${obj.onlyIfNoticed ? 'checked' : ''} ${at([...path, 'onlyIfNoticed'])}>気づいた時だけ作る</label></div>` : ''}
  </div>`
}

function ruleHtml(rule, path, field) {
  const remove = removeBtn(path)
  const label = (field === 'conditions' ? edit.CONDITION_KINDS : edit.EFFECT_KINDS)[rule.type]?.label ?? rule.type
  const kind = edit.keyKind(rule)
  const m = state.model
  if (kind) {
    const keyField = rule.type === 'createEvent' ? 'id' : 'key'
    const parts = [`<input class="rule-key" list="keys-${kind}" value="${esc(rule[keyField])}" ${at([...path, keyField])} aria-label="対象" size="${Math.max(6, String(rule[keyField] ?? '').length)}">`]
    if (TRUE_LABEL[rule.type]) {
      const [yes, no] = TRUE_LABEL[rule.type]
      parts.push(`<select ${at([...path, 'value'])} data-type="bool">${options(['true', 'false'], String(rule.value), (v) => (v === 'true' ? yes : no))}</select>`)
    } else if (RULE_OPS[rule.type]) {
      parts.push(`<span>が</span><input class="rule-val" value="${esc(rule.value)}" ${at([...path, 'value'])} ${rule.type === 'resource' ? 'data-type="num"' : ''} aria-label="値" size="4">`)
      parts.push(`<select ${at([...path, 'op'])}>${options(RULE_OPS[rule.type], rule.op, (v) => OP_LABEL[v] ?? v)}</select>`)
    } else if (rule.type === 'addResource') {
      parts.push(`<span>に</span><input class="rule-val" type="number" value="${esc(rule.delta)}" ${at([...path, 'delta'])} data-type="num" aria-label="足す量">`)
    } else if (rule.type === 'setVariable') {
      parts.push(`<span>を</span><input class="rule-val" value="${esc(rule.value)}" ${at([...path, 'value'])} aria-label="値" size="6">`)
    } else if (rule.type === 'createEvent') {
      parts.push(`<span>名前</span><input class="rule-val" value="${esc(rule.name)}" ${at([...path, 'name'])} aria-label="出来事の名前" size="10">`)
    }
    return `<span class="rule"><span class="rule-kind">${esc(label)}</span>${parts.join('')}${remove}</span>`
  }
  if (rule.type === 'knowledgeRule') {
    const def = m.knowledgeRules?.[rule.rule]
    const ids = Object.keys(m.knowledgeRules ?? {})
    const uses = edit.ruleUses(m, rule.rule)
    return `<div class="rule rule-block"><div class="pf-row"><span class="rule-kind">${esc(label)}</span>
      <select ${at([...path, 'rule'])} aria-label="知識ルール">${options(ids.includes(rule.rule) ? ids : [...ids, rule.rule], rule.rule, ruleLabel)}<option value="__new">＋新しい知識ルール</option></select>
      <span class="sub">ルール <span class="term">${esc(rule.rule)}</span>${uses > 1 ? `は ${uses} か所で共有` : ''}</span>${remove}</div>
      ${def ? perceptionForm(def, ['knowledgeRules', rule.rule]) : '<p class="sub bad-text">このルールはモデルにありません。上で選び直してください。</p>'}</div>`
  }
  if (rule.type === 'property') {
    const props = edit.entityProperties(m, rule.entity)
    const keys = Object.keys(props)
    const ents = Object.keys(m.entities ?? {})
    return `<span class="rule"><span class="rule-kind">${esc(label)}</span>
      <select ${at([...path, 'entity'])} aria-label="物">${options(ents.includes(rule.entity) ? ents : [...ents, rule.entity], rule.entity, (v) => state.names.entity(v))}</select><span>の</span>
      <select ${at([...path, 'key'])} aria-label="性質">${options(keys.includes(rule.key) ? keys : [...keys, rule.key], rule.key)}</select><span>が</span>
      ${valueInput([...path, 'value'], rule.value, props[rule.key]?.type)}
      <select ${at([...path, 'op'])}>${options(PROPERTY_OPS, rule.op, (v) => OP_LABEL[v] ?? v)}</select>${remove}</span>`
  }
  if (rule.type === 'and' || rule.type === 'or') {
    const kids = (rule.conditions ?? []).map((c, i) => ruleHtml(c, [...path, 'conditions', i], field)).join('')
    return `<div class="rule rule-block rule-group"><div class="pf-row"><span class="rule-kind">${esc(label)}</span>${remove}</div>
      <div class="group-body">${kids || '<span class="sub">（まだ何も無い）</span>'}${addRuleSelect([...path, 'conditions'], field)}</div></div>`
  }
  if (rule.type === 'not') {
    return `<div class="rule rule-block rule-group"><div class="pf-row"><span class="rule-kind">${esc(label)}</span>${remove}</div>
      <div class="group-body">${rule.condition ? ruleHtml(rule.condition, [...path, 'condition'], field) : ''}</div></div>`
  }
  if (rule.type === 'perceiveEntity') {
    return `<div class="rule rule-block"><div class="pf-row"><span class="rule-kind">${esc(label)}</span>${remove}</div>${perceptionForm(rule, path, { event: true })}</div>`
  }
  const text = field === 'conditions' ? conditionSentence({ condition: rule }, state.names, current().session) : effectSentence(rule)
  return `<span class="rule rule-fixed" title="この種類は旧Web Testerで編集">${text}${remove}</span>`
}

function addRuleSelect(listPath, field) {
  const kinds = field === 'conditions' ? edit.CONDITION_KINDS : edit.EFFECT_KINDS
  return `<select class="rule-add" data-act="add-rule" data-field="${field}" ${at(listPath)} aria-label="${field === 'conditions' ? '条件を足す' : '効果を足す'}">
    <option value="">＋${field === 'conditions' ? '条件' : '効果'}</option>${Object.entries(kinds).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select>`
}

function choiceMark(ct) {
  if (!ct) return '<span class="state">?</span>'
  const why = ct.available ? '今この選択肢は開いている' : `閉じている: ${ct.conditions.filter((c) => !c.passed).map((c) => conditionSentence(c, state.names, current().session).replace(/<[^>]+>/g, '')).join('／')}`
  return `<span class="state" title="${esc(why)}">${ct.available ? '開' : '閉'}</span>`
}

function previewHtml(step) {
  const { text } = step.scene
  return text.exact ? text.segments.map((s, i) => segmentHtml(s, `0-${i}`)).join('') : esc(text.text)
}

function policiesHtml(nodeId) {
  const list = (state.model.perceptionPolicies ?? []).map((p, i) => [p, i]).filter(([p]) => p.trigger?.node === nodeId)
  const rows = list.map(([p, i]) => `<div class="rule rule-block"><div class="pf-row"><span class="rule-kind">知覚の方針</span><span class="sub"><span class="term">${esc(p.id)}</span></span>${removeBtn(['perceptionPolicies', i], '方針を消す')}</div>
    ${perceptionForm(p, ['perceptionPolicies', i], { event: true })}</div>`).join('')
  return `<section class="ed-section"><h4>この場面に入った時の知覚</h4>${rows || '<p class="sub">この場面に入っても、誰も何も知覚しません。</p>'}
    <button type="button" class="btn btn-small" data-act="add-policy">＋ この場面に入った時の知覚を足す</button></section>`
}

function defsHtml() {
  const m = state.model
  const n = state.names
  const chars = Object.entries(m.characters ?? {}).map(([id, c]) => {
    const uses = edit.usesOf(m, 'character', id)
    const rows = (c.knowledgeProfiles ?? []).map((p, i) => {
      const base = ['characters', id, 'knowledgeProfiles', i]
      return `<tr><td><input value="${esc(p.domain)}" ${at([...base, 'domain'])} aria-label="知識の分野" size="14"></td>
        <td>${valueInput([...base, 'accuracy'], p.accuracy ?? '', 'number')}</td>
        <td>${valueInput([...base, 'tolerance'], p.tolerance ?? '', 'number')}</td>
        <td>${removeBtn(base, '分野を消す')}</td></tr>`
    }).join('')
    return `<div class="def"><div class="def-head"><input class="def-name" value="${esc(c.name)}" ${at(['characters', id, 'name'])} aria-label="人物の名前"><span class="node-id">${esc(id)}</span>
      <button type="button" class="rule-x" data-act="remove-def" data-kind="character" data-id="${esc(id)}" ${uses ? `disabled title="${uses} か所で使われているので消せません"` : ''} aria-label="人物を消す">✕</button></div>
      <table class="def-table"><thead><tr><th>知識の分野</th><th>正確さ</th><th>許容幅（割合）</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <button type="button" class="btn btn-small" data-act="add-profile" data-id="${esc(id)}">＋ 分野</button></div>`
  }).join('')
  const ents = Object.entries(m.entities ?? {}).map(([id, e]) => {
    const uses = edit.usesOf(m, 'entity', id)
    const others = Object.keys(m.entities).filter((x) => x !== id)
    const own = e.properties ?? {}
    const all = edit.entityProperties(m, id)
    const rows = Object.entries(all).map(([k, p]) => {
      const inherited = !(k in own)
      return `<tr class="${inherited ? 'inherited' : ''}"><td><span class="term">${esc(k)}</span></td><td>${esc(p.type)}</td>
        <td>${inherited ? `${esc(p.defaultValue ?? '')}<span class="sub">（${esc(n.entity(e.parentEntity))}から）</span>` : valueInput(['entities', id, 'properties', k, 'defaultValue'], p.defaultValue ?? '', p.type)}</td>
        <td>${inherited ? '' : removeBtn(['entities', id, 'properties', k], '性質を消す')}</td></tr>`
    }).join('')
    return `<div class="def"><div class="def-head"><input class="def-name" value="${esc(e.name)}" ${at(['entities', id, 'name'])} aria-label="物の名前"><span class="node-id">${esc(id)}</span>
      <label class="sub">親 <select ${at(['entities', id, 'parentEntity'])} data-type="opt"><option value="">なし</option>${options(others, e.parentEntity ?? '', (v) => n.entity(v))}</select></label>
      <button type="button" class="rule-x" data-act="remove-def" data-kind="entity" data-id="${esc(id)}" ${uses ? `disabled title="${uses} か所で使われているので消せません"` : ''} aria-label="物を消す">✕</button></div>
      <table class="def-table"><thead><tr><th>性質</th><th>型</th><th>初期値</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="pf-row"><input class="new-prop" data-new-prop="${esc(id)}" placeholder="新しい性質の名前" size="14" aria-label="新しい性質の名前">
        <select data-new-prop-type="${esc(id)}" aria-label="型">${options(['number', 'string', 'boolean'], 'number')}</select>
        <button type="button" class="btn btn-small" data-act="add-prop" data-id="${esc(id)}">＋ 性質</button></div></div>`
  }).join('')
  const rules = Object.entries(m.knowledgeRules ?? {}).map(([id, r]) => {
    const uses = edit.ruleUses(m, id)
    return `<div class="def"><div class="def-head"><span class="term">${esc(id)}</span><span class="sub">${uses ? `${uses} か所の条件で使用` : 'どの条件でも使っていない'}</span>
      <button type="button" class="rule-x" data-act="remove-def" data-kind="rule" data-id="${esc(id)}" aria-label="ルールを消す">✕</button></div>${perceptionForm(r, ['knowledgeRules', id])}</div>`
  }).join('')
  return `<details class="ed-defs" data-open-key="defs" ${state.open.has('defs') ? 'open' : ''}><summary>人物と物（物語全体の定義）</summary>
    <h4>人物と知識</h4><p class="sub">許容幅は予想からのずれの割合です。ずれが許容幅を超えると違和感になります。</p>${chars || '<p class="sub">人物がいません。</p>'}
    <button type="button" class="btn btn-small" data-act="add-character">＋ 人物</button>
    <h4>物と性質</h4>${ents || '<p class="sub">物がありません。</p>'}
    <button type="button" class="btn btn-small" data-act="add-entity">＋ 物</button>
    <h4>知識ルール</h4>${rules || '<p class="sub">知識ルールがありません。</p>'}
    <button type="button" class="btn btn-small" data-act="add-rule-def">＋ 知識ルール</button>
  </details>`
}

function editorHtml(step) {
  const nodeId = step.scene.nodeId
  const node = state.model.nodes[nodeId]
  const keys = edit.knownKeys(state.model)
  const snippets = edit.textSnippets(state.model)
  const group = (label, items) => (items.length ? `<optgroup label="${esc(label)}">${items.map((x) => `<option value="${esc(x.text)}">${esc(x.label)}</option>`).join('')}</optgroup>` : '')
  const nodeIds = Object.keys(state.model.nodes)
  const isStart = nodeId === state.model.startNode
  const choices = (node.choices ?? []).map((c, ci) => {
    const ct = step.scene.choices.find((x) => x.choice.id === c.id)
    const cid = esc(c.id)
    const cpath = ['nodes', nodeId, 'choices', ci]
    return `<li class="edit-choice ${ct?.available ? 'open' : 'closed'}" data-row="${cid}">
      <div class="ec-row">
        <span data-mark="${cid}">${choiceMark(ct)}</span>
        <input class="ec-text" value="${esc(c.text)}" data-edit="choice-text" data-cid="${cid}" aria-label="選択肢の文">
        <span class="ec-arrow" aria-hidden="true">→</span>
        <select data-edit="choice-target" data-cid="${cid}" aria-label="行き先">${options(nodeIds, c.target)}<option value="__new">＋新しい場面</option></select>
        <button type="button" class="btn btn-small" data-act="go" data-cid="${cid}" ${ct?.available ? '' : 'disabled'} title="この選択肢を選んで次の場面へ">選ぶ</button>
        <button type="button" class="rule-x" data-act="remove-choice" data-cid="${cid}" aria-label="選択肢を消す">✕</button>
      </div>
      <div class="ec-rules"><span class="ec-label">条件</span>${(c.conditions ?? []).map((r, i) => ruleHtml(r, [...cpath, 'conditions', i], 'conditions')).join('')}${addRuleSelect([...cpath, 'conditions'], 'conditions')}</div>
      <div class="ec-rules"><span class="ec-label">効果</span>${(c.effects ?? []).map((r, i) => ruleHtml(r, [...cpath, 'effects', i], 'effects')).join('')}${addRuleSelect([...cpath, 'effects'], 'effects')}</div>
    </li>`
  }).join('')
  const datalists = Object.entries(keys).map(([k, list]) => `<datalist id="keys-${k}">${list.map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`).join('')
  return `<article class="story editing" aria-label="場面の編集">
    <header class="scene-head">
      <label class="ed-speaker"><span>話者</span><input value="${esc(node.speaker ?? '')}" data-edit="speaker" size="10"></label>
      <label class="ed-id"><span>場面ID</span><input value="${esc(nodeId)}" data-rename size="${Math.max(8, nodeId.length)}" aria-label="場面のID（変えると行き先も追従）"></label>
      <button type="button" class="btn btn-small" data-act="delete-node" data-node="${esc(nodeId)}" ${isStart ? 'disabled title="開始の場面は消せません"' : ''}>場面を消す</button>
      <button type="button" class="btn btn-small edit-toggle" data-act="stop-edit">編集を終える</button>
    </header>
    <textarea id="edit-text" class="ed-text" data-edit="text" rows="6" aria-label="本文">${esc(node.text ?? '')}</textarea>
    <div class="ed-tools">
      <select data-act="insert" aria-label="本文に挿入">
        <option value="">本文に挿入…</option>
        ${group('物の性質', snippets.entityProps)}${group('状態', snippets.values)}${group('条件付きの文', snippets.conditional)}
      </select>
      <span class="sub">[物.性質] {状態} {?フラグ:文} の形で書けます</span>
    </div>
    <div class="ed-preview">
      <div class="ed-label">エンジンが組み立てた本文</div>
      <div id="preview" class="story-text">${previewHtml(step)}</div>
      <div id="seg-detail" class="seg-detail" hidden></div>
    </div>
    ${step.scene.ending && !(node.choices ?? []).length ? '<p class="sub">選択肢が無いので、ここが結末になります。</p>' : ''}
    <ol class="edit-choices">${choices}</ol>
    <button type="button" class="btn btn-small" data-act="add-choice">＋ 選択肢を追加</button>
    ${policiesHtml(nodeId)}
    ${defsHtml()}
    ${datalists}
  </article>`
}

// edits: apply to the model, re-trace the same path, then refresh what depends on it

function retrace() {
  const path = state.steps.slice(1).map((s) => s.choiceId)
  const steps = [traceStart(state.model)]
  for (const id of path) {
    const last = steps[steps.length - 1]
    const ct = last.scene.choices.find((c) => c.choice.id === id)
    if (!ct || !ct.available) break
    steps.push(traceStep(last.session, state.model, id))
  }
  state.steps = steps
  state.cursor = Math.min(state.cursor, steps.length - 1)
}

function afterEdit(mark, { full = false } = {}) {
  state.dirty.add(mark)
  state.names = createNames(state.model)
  state.check = null
  const nodeBefore = current()?.scene.nodeId
  try {
    retrace()
  } catch (err) {
    state.error = `再計算できません: ${err instanceof Error ? err.message : String(err)}`
    full = true
  }
  updateSaveArea()
  if (full || state.view !== 'run' || current().scene.nodeId !== nodeBefore) {
    render()
    return
  }
  const step = current()
  const preview = document.getElementById('preview')
  if (preview) preview.innerHTML = previewHtml(step)
  const aside = app.querySelector('.judgment')
  if (aside) aside.outerHTML = judgmentHtml(step)
  const tl = document.getElementById('timeline-wrap')
  if (tl) tl.innerHTML = timelineHtml()
  for (const el of app.querySelectorAll('[data-mark]')) {
    const ct = step.scene.choices.find((x) => x.choice.id === el.dataset.mark)
    el.innerHTML = choiceMark(ct)
    el.closest('.edit-choice')?.classList.toggle('open', !!ct?.available)
    el.closest('.edit-choice')?.classList.toggle('closed', !ct?.available)
    const go = el.closest('.ec-row')?.querySelector('[data-act="go"]')
    if (go) go.disabled = !ct?.available
  }
}

/** One dirty mark per choice, scene or definition, so the count reads as places, not keystrokes. */
function markOf(path) {
  if (path[0] === 'nodes') return path.slice(0, path[2] === 'choices' ? 4 : 2).join('/')
  return path.slice(0, 2).join('/')
}

function readValue(el) {
  if (el.type === 'checkbox') return el.checked
  switch (el.dataset.type) {
    case 'num':
      return el.value === '' ? Number.NaN : Number(el.value)
    case 'bool':
      return el.value === 'true'
    case 'opt':
      return el.value === '' ? undefined : el.value
    default:
      return el.value
  }
}

/** Keeps a rule consistent after one of its parts changed (types follow ops and properties). */
function settle(owner, key, value) {
  const m = state.model
  if (!owner || typeof owner !== 'object') return
  if (owner.type === 'variable') {
    owner.value = ['>=', '<=', '>', '<'].includes(owner.op) ? Number(owner.value) || 0 : String(owner.value)
  }
  if (owner.type === 'property') {
    const props = edit.entityProperties(m, owner.entity)
    if (key === 'entity' && !(owner.key in props)) owner.key = Object.keys(props)[0] ?? ''
    const t = props[owner.key]?.type
    if (key === 'entity' || key === 'key') owner.value = props[owner.key]?.defaultValue ?? ''
    if (t === 'number') owner.value = Number(owner.value) || 0
    else if (t === 'boolean') owner.value = owner.value === true || owner.value === 'true'
    else owner.value = String(owner.value ?? '')
  }
  if (owner.expectations && key === 'character') {
    const domains = edit.domainsOf(m, value)
    if (!domains.includes(owner.domain)) owner.domain = domains[0] ?? 'general'
  }
  if (owner.expectations && key === 'entity') {
    const numeric = edit.numericProperties(m, value)
    const kept = Object.fromEntries(Object.entries(owner.expectations).filter(([k]) => numeric.includes(k)))
    if (!Object.keys(kept).length && numeric[0]) kept[numeric[0]] = Number(edit.entityProperties(m, value)[numeric[0]].defaultValue ?? 0)
    owner.expectations = kept
  }
  if (owner.type === 'knowledgeRule' && key === 'rule' && value === '__new') owner.rule = edit.addKnowledgeRule(m)
}

function onPathEdit(el) {
  const path = JSON.parse(el.dataset.path)
  const value = readValue(el)
  if (typeof value === 'number' && Number.isNaN(value)) return undefined
  edit.setAt(state.model, path, value)
  settle(edit.getAt(state.model, path.slice(0, -1)), path[path.length - 1], value)
  return afterEdit(markOf(path), { full: el.tagName === 'SELECT' || el.type === 'checkbox' })
}

function onEditInput(el) {
  const nodeId = current().scene.nodeId
  if (el.dataset.path) return onPathEdit(el)
  switch (el.dataset.edit) {
    case 'text':
      edit.setNodeText(state.model, nodeId, el.value)
      return afterEdit(`text:${nodeId}`)
    case 'speaker':
      edit.setNodeSpeaker(state.model, nodeId, el.value)
      return afterEdit(`speaker:${nodeId}`)
    case 'choice-text':
      edit.setChoiceText(state.model, nodeId, el.dataset.cid, el.value)
      return afterEdit(`choice:${el.dataset.cid}`)
    default:
      return undefined
  }
}

function onEditChange(el) {
  const nodeId = current().scene.nodeId
  if (el.dataset.edit === 'choice-target') {
    let target = el.value
    if (target === '__new') target = edit.addNode(state.model)
    edit.setChoiceTarget(state.model, nodeId, el.dataset.cid, target)
    return afterEdit(`choice:${el.dataset.cid}`, { full: true })
  }
  if (el.dataset.act === 'add-rule' && el.value) {
    const path = JSON.parse(el.dataset.path)
    edit.pushAt(state.model, path, edit.newRule(state.model, el.dataset.field, el.value))
    return afterEdit(markOf(path), { full: true })
  }
  if (el.dataset.act === 'add-exp' && el.value) {
    const path = JSON.parse(el.dataset.path)
    const owner = edit.getAt(state.model, path.slice(0, -1))
    const def = edit.entityProperties(state.model, owner.entity)[el.value]?.defaultValue
    edit.setAt(state.model, [...path, el.value], Number(def ?? 0))
    return afterEdit(markOf(path), { full: true })
  }
  if (el.dataset.act === 'insert' && el.value) {
    const ta = document.getElementById('edit-text')
    const caretAt = ta.selectionStart ?? ta.value.length
    ta.value = ta.value.slice(0, caretAt) + el.value + ta.value.slice(ta.selectionEnd ?? caretAt)
    const caret = caretAt + el.value.length
    el.value = ''
    ta.focus()
    ta.setSelectionRange(caret, caret)
    return onEditInput(ta)
  }
  if (el.dataset.path) return onPathEdit(el)
  return undefined
}

function onRename(el) {
  const oldId = current().scene.nodeId
  const newId = el.value.trim()
  if (newId === oldId) return undefined
  try {
    edit.renameNode(state.model, oldId, newId)
  } catch (err) {
    state.error = err instanceof Error ? err.message : String(err)
    return render()
  }
  return afterEdit(`node:${oldId}`, { full: true })
}

function deleteNodeAsked(id) {
  const refs = edit.nodeReferences(state.model, id)
  const lines = [
    ...refs.choices.map((c) => `・場面 ${c.nodeId} の選択肢「${c.text}」`),
    ...refs.gotos.map((c) => `・場面 ${c.nodeId} の選択肢「${c.text}」の移動の効果`),
    ...refs.policies.map((p) => `・この場面に入った時の知覚 ${p}`),
  ]
  const msg = `場面 ${id} を消します。${lines.length ? `\n一緒に消えるもの:\n${lines.join('\n')}` : ''}\n（保存するまでファイルは変わりません）`
  if (!window.confirm(msg)) return undefined
  try {
    edit.deleteNode(state.model, id)
  } catch (err) {
    state.error = err instanceof Error ? err.message : String(err)
    return render()
  }
  return afterEdit(`node:${id}`, { full: true })
}

function onEditAction(btn) {
  const nodeId = current().scene.nodeId
  const { act, cid, id } = btn.dataset
  const m = state.model
  switch (act) {
    case 'edit':
      state.editing = true
      return render()
    case 'stop-edit':
      state.editing = false
      return render()
    case 'go':
      return choose(cid)
    case 'add-choice': {
      const newId = edit.addChoice(m, nodeId, { target: nodeId })
      return afterEdit(`choice:${newId}`, { full: true })
    }
    case 'remove-choice':
      edit.removeChoice(m, nodeId, cid)
      return afterEdit(`choice:${cid}`, { full: true })
    case 'remove-at': {
      const path = JSON.parse(btn.dataset.path)
      edit.removeAt(m, path)
      return afterEdit(markOf(path), { full: true })
    }
    case 'add-policy': {
      const i = edit.addPerceptionPolicy(m, nodeId)
      return afterEdit(`perceptionPolicies/${m.perceptionPolicies[i].id}`, { full: true })
    }
    case 'add-character':
      return afterEdit(`characters/${edit.addCharacter(m)}`, { full: true })
    case 'add-entity':
      return afterEdit(`entities/${edit.addEntity(m)}`, { full: true })
    case 'add-rule-def':
      return afterEdit(`knowledgeRules/${edit.addKnowledgeRule(m)}`, { full: true })
    case 'add-profile':
      edit.pushAt(m, ['characters', id, 'knowledgeProfiles'], { domain: `domain_${(m.characters[id].knowledgeProfiles ?? []).length + 1}`, accuracy: 0.5, tolerance: 0.25 })
      return afterEdit(`characters/${id}`, { full: true })
    case 'add-prop': {
      const key = app.querySelector(`[data-new-prop="${CSS.escape(id)}"]`)?.value.trim()
      const type = app.querySelector(`[data-new-prop-type="${CSS.escape(id)}"]`)?.value
      try {
        edit.addEntityProperty(m, id, key, type)
      } catch (err) {
        state.error = err instanceof Error ? err.message : String(err)
        return render()
      }
      return afterEdit(`entities/${id}`, { full: true })
    }
    case 'remove-def': {
      const { kind } = btn.dataset
      if (kind === 'rule') {
        const uses = edit.ruleUses(m, id)
        if (uses && !window.confirm(`知識ルール ${id} は ${uses} か所の条件で使われています。消すと、その条件は「ルールが無い」で閉じます。消しますか？`)) return undefined
        delete m.knowledgeRules[id]
        return afterEdit(`knowledgeRules/${id}`, { full: true })
      }
      delete m[kind === 'character' ? 'characters' : 'entities'][id]
      return afterEdit(`${kind}/${id}`, { full: true })
    }
    case 'delete-node':
      return deleteNodeAsked(btn.dataset.node)
    default:
      return undefined
  }
}

// saving: models/ files go back to their own file through the dev server; a dropped file is written out

const saveArea = document.getElementById('save-area')

function updateSaveArea() {
  const n = state.dirty.size
  if (isGenerated()) {
    // a generated story stays rebuildable from its premise; edits are kept by copying it (SP-PREMISE-001 4.2)
    saveArea.innerHTML = `${state.notice ? `<span class="notice">${state.notice}</span>` : ''}${n ? `<span class="dirty">未保存の変更 ${n} か所</span>` : ''}
      <button type="button" id="grow" class="btn ${n ? 'btn-primary' : ''}" title="models/examples/ へ写しを作り、以後はその写しを編集します。生成した物語は前提から組み直せるまま残ります。">写して育てる</button>`
    return
  }
  if (!n) {
    saveArea.innerHTML = state.notice ? `<span class="notice">${state.notice}</span>` : ''
    return
  }
  const label = state.source?.kind === 'sample' ? '保存' : 'JSONを書き出す'
  saveArea.innerHTML = `<span class="dirty">未保存の変更 ${n} か所</span><button type="button" id="save" class="btn btn-primary">${label}</button>`
}

function checkSummary() {
  const c = checkModel(state.model)
  const issues = c.stuck.length + c.neverOpened.length + c.impossibleEvents.length + c.unresolvedRefs.length + c.missingTargets.length + c.unlinkedNodes.length + c.errors.length
  state.check = c
  return `点検: 結末 ${c.endings.length}・問題 ${issues}${c.truncated ? '（上限で打ち切り）' : ''}`
}

/** Copy a generated story to models/examples/ and continue on the copy. */
async function grow() {
  if (!state.model || !isGenerated()) return
  const summary = checkSummary()
  state.saving = true
  try {
    const res = await fetch('/__studio/grow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: state.source.file, model: state.model }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    const path = `../../../${data.file}`
    const name = data.file.split('/').pop().replace(/\.json$/, '')
    const notice = `${esc(data.file)} へ写しました。以後はこの写しを編集します。前提とのつながりは持ちません。${summary}`
    const keep = { path: state.steps.slice(1).map((s) => s.choiceId), cursor: state.cursor, editing: state.editing }
    pref('sample', path)
    // the dev server may reload the page when it sees the new file; either way the author lands on the copy
    remember(notice, path)
    if (!sampleList.some((s) => s.path === path)) {
      samples[path] = async () => data.model
      sampleList.push({ path, name })
      sampleList.sort((a, b) => a.name.localeCompare(b.name))
      fillPicker()
    }
    state.saving = false
    openModel(structuredClone(data.model), name, { kind: 'sample', file: data.file })
    picker.value = path
    replayQuiet(keep.path)
    state.cursor = Math.min(keep.cursor, state.steps.length - 1)
    state.editing = keep.editing
    state.notice = notice
    updateSaveArea()
    render()
  } catch (err) {
    state.saving = false
    state.error = `写せません: ${err instanceof Error ? err.message : String(err)}`
    render()
  }
}

async function save() {
  if (!state.dirty.size || !state.model) return
  const summary = checkSummary()
  if (state.source?.kind !== 'sample') {
    const blob = new Blob([JSON.stringify(state.model, null, 2) + '\n'], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${state.name}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    state.dirty = new Set()
    state.notice = `${esc(state.name)}.json を書き出しました。${summary}`
    updateSaveArea()
    return
  }
  state.saving = true
  // saving a models/ file makes the dev server reload the page; keep the place to come back to
  remember(`${esc(state.source.file)} に保存しました。${summary}`)
  try {
    const res = await fetch('/__studio/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: state.source.file, model: state.model }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error)
    state.dirty = new Set()
    state.notice = `${esc(data.file)} に保存しました。${summary}${data.reformatted ? '（このファイルは手書きの整形だったので、今回から標準の整形になりました）' : ''}`
    remember(state.notice)
  } catch (err) {
    forget()
    state.error = `保存できません: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    state.saving = false
  }
  updateSaveArea()
  if (state.error) render()
}

function remember(notice, sample = picker.value) {
  try {
    sessionStorage.setItem('ng-studio:resume', JSON.stringify({
      sample,
      path: state.steps.slice(1).map((s) => s.choiceId),
      cursor: state.cursor,
      editing: state.editing,
      notice,
    }))
  } catch {
    // the page still works without it; only the place after reload is lost
  }
}

function forget() {
  try {
    sessionStorage.removeItem('ng-studio:resume')
  } catch {
    // nothing to clear
  }
}

function takeResume() {
  try {
    const raw = sessionStorage.getItem('ng-studio:resume')
    sessionStorage.removeItem('ng-studio:resume')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function confirmDiscard() {
  return !state.dirty.size || window.confirm(`保存していない変更が ${state.dirty.size} か所あります。捨てて続けますか？`)
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
      ${section('どこからもつながらない場面', c.unlinkedNodes, 'すべての場面が開始からつながっています。', (id) => `<li><span class="node-id">${esc(id)}</span> ${esc((state.model.nodes[id]?.text ?? '').slice(0, 30)) || '（本文なし）'} <button type="button" class="btn btn-small" data-act="delete-node" data-node="${esc(id)}">消す</button></li>`)}
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

app.addEventListener('input', (event) => {
  const el = event.target
  if (el.tagName === 'SELECT' || el.type === 'checkbox') return
  if (el.dataset.edit || el.dataset.path) onEditInput(el)
})
app.addEventListener('change', (event) => {
  const el = event.target
  if (el.tagName === 'SELECT') onEditChange(el)
  else if (el.type === 'checkbox' && el.dataset.path) onPathEdit(el)
  else if (el.dataset.rename !== undefined) onRename(el)
})
app.addEventListener('toggle', (event) => {
  const key = event.target.dataset?.openKey
  if (!key) return
  if (event.target.open) state.open.add(key)
  else state.open.delete(key)
}, true)

app.addEventListener('click', (event) => {
  const target = event.target.closest('button')
  if (!target) return
  if (target.dataset.act) onEditAction(target)
  else if (target.dataset.choice) choose(target.dataset.choice)
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

let pickerValue = ''
picker.addEventListener('focus', () => { pickerValue = picker.value })
picker.addEventListener('change', () => {
  if (!confirmDiscard()) {
    picker.value = pickerValue
    return
  }
  if (picker.value !== '__file') openSample(picker.value)
})
saveArea.addEventListener('click', (event) => {
  if (event.target.closest('#save')) save()
  if (event.target.closest('#grow')) grow()
})
window.addEventListener('beforeunload', (event) => {
  if (state.dirty.size && !state.saving) event.preventDefault()
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
  if (!file || !confirmDiscard()) return
  try {
    const model = JSON.parse(await file.text())
    const name = file.name.replace(/\.json$/i, '')
    fillPicker(name)
    picker.value = '__file'
    openModel(model, name, { kind: 'file', fileName: file.name })
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
const resume = takeResume()
openSample(initial.path).then(() => {
  // a remembered place belongs to one story; never replay it onto another
  if (resume && (!resume.sample || resume.sample === initial.path)) {
    replayQuiet(resume.path ?? [])
    state.cursor = Math.min(resume.cursor ?? 0, state.steps.length - 1)
    state.editing = !!resume.editing
    state.notice = resume.notice ?? ''
    updateSaveArea()
  }
  setView(state.view)
})
