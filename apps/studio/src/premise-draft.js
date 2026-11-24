import { endingLabel, explainAction, generateStory } from '@narrativegen/engine-ts/browser'
import sample from '../../../models/premises/cheeseburger-weight-hearsay.json'
import { esc, num } from './format.js'

const form = document.getElementById('draft-form')
const status = document.getElementById('draft-status')
const output = document.getElementById('draft-output')
const focus = sample.scene.focus
const percent = new Intl.NumberFormat('ja-JP', { style: 'percent', maximumFractionDigits: 2 })

document.getElementById('draft-sample').textContent = `見本　${sample.title}`
form.elements.namedItem('thing-name').defaultValue = sample.entities[focus].name
form.elements.namedItem('actual').defaultValue = sample.entities[focus].properties.weight.defaultValue

// This draft uses the focus and participants of the existing premise sample.
const people = sample.scene.present.map((id) => {
  const person = sample.characters[id]
  const beliefIndex = sample.beliefs.findIndex((belief) => belief.character === id && belief.entity === focus)
  const belief = sample.beliefs[beliefIndex]
  const profileIndex = person.knowledgeProfiles.findIndex((profile) => profile.domain === belief.domain)
  return { id, name: person.name, beliefIndex, profileIndex }
})

function field(person, key, label, value, attributes) {
  return `<label>
    <span class="draft-field-label" aria-hidden="true">${label}</span>
    <input name="${esc(person.id)}-${key}" aria-label="${esc(person.name)}の${label}" value="${esc(value)}" required ${attributes} />
  </label>`
}

document.getElementById('draft-person-fields').innerHTML = people.map((person) => {
  const profile = sample.characters[person.id].knowledgeProfiles[person.profileIndex]
  const belief = sample.beliefs[person.beliefIndex]
  return `<div class="draft-person" role="group" aria-label="${esc(person.name)}">
    <strong>${esc(person.name)}</strong>
    ${field(person, 'domain', '知識の分野', profile.domain, 'type="text"')}
    ${field(person, 'accuracy', '正確さ', profile.accuracy, 'type="number" min="0" max="1" step="any"')}
    ${field(person, 'tolerance', '許容幅', profile.tolerance, 'type="number" min="0" step="any"')}
    ${field(person, 'expected', '重さの見込み', belief.expectations.weight, 'type="number" min="0" step="any"')}
  </div>`
}).join('')

function readPremise() {
  const fields = new FormData(form)
  const premise = structuredClone(sample)
  const entity = premise.entities[focus]
  entity.name = fields.get('thing-name').trim()
  if (!entity.name) throw new Error('物の名前を入力してください。')
  entity.properties.weight.defaultValue = Number(fields.get('actual'))

  for (const person of people) {
    const profile = premise.characters[person.id].knowledgeProfiles[person.profileIndex]
    const belief = premise.beliefs[person.beliefIndex]
    const domain = fields.get(`${person.id}-domain`).trim()
    if (!domain) throw new Error(`${person.name}の知識の分野を入力してください。`)
    profile.domain = domain
    profile.accuracy = Number(fields.get(`${person.id}-accuracy`))
    profile.tolerance = Number(fields.get(`${person.id}-tolerance`))
    belief.domain = domain
    belief.expectations.weight = Number(fields.get(`${person.id}-expected`))
  }
  return premise
}

const baseline = generateStory(structuredClone(sample))
const baselineFacts = new Map(baseline.derivation.perceptions.map((fact) => [fact.character, fact]))
const baselineWeight = sample.entities[focus].properties.weight.defaultValue

function outcome(noticed) {
  return `<span class="draft-outcome${noticed ? ' is-noticed' : ''}">${noticed ? '違和感あり' : '気に留めない'}</span>`
}

function rangeValues({ rangeMin, rangeMax, expected, actual }) {
  return [rangeMin, rangeMax, expected, actual]
}

function weightScale(facts) {
  const values = facts.flatMap(rangeValues).filter(Number.isFinite)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const magnitude = Math.max(Math.abs(min), Math.abs(max)) || 1
  const start = min / magnitude
  const span = max / magnitude - start
  return { min, max, position: (value) => span ? (value / magnitude - start) / span * 100 : 50 }
}

function rangeLine(fact, scale, label) {
  const [lo, hi, expected, actual] = rangeValues(fact)
  const description = `${label}。見込み ${expected}、許容範囲 ${lo}〜${hi}、実際 ${actual}`
  const chart = [lo, hi, expected, actual].every(Number.isFinite)
    ? `<div class="draft-range-track" role="img" aria-label="${description}">
        <span class="draft-range-band" style="left:${scale.position(lo)}%;width:${scale.position(hi) - scale.position(lo)}%"></span>
        <span class="draft-expected-mark" style="left:${scale.position(expected)}%"></span>
        <span class="draft-actual-mark" style="left:${scale.position(actual)}%"></span>
      </div>`
    : '<span class="sub">数値が表示範囲を超えています</span>'
  return `<div class="draft-range-line">
    <span class="sub" aria-hidden="true">${label}</span>${chart}
  </div>`
}

function bar(value, kind = '') {
  const width = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) * 100 : 0
  return `<span class="draft-bar ${kind}" aria-hidden="true"><span style="width:${width}%"></span></span>`
}

function judgmentRow(premise, fact, scale, trial) {
  const before = baselineFacts.get(fact.character)
  const changed = before && before.noticed !== fact.noticed
  const range = rangeValues(fact)
  const rangeChanged = before && rangeValues(before).some((value, i) => value !== range[i])
  const accuracyChanged = before && before.accuracy !== fact.accuracy
  const label = trial ? '試算' : '見本'
  const result = changed
    ? `<div class="draft-transition">
        ${outcome(before.noticed)}
        <span aria-hidden="true">→</span>
        ${outcome(fact.noticed)}
      </div>`
    : outcome(fact.noticed)
  return `<li class="draft-judgment${changed ? ' is-changed' : ''}">
    <div class="draft-judgment-head"><strong>${esc(premise.characters[fact.character].name)}</strong>${result}</div>
    ${rangeChanged ? rangeLine(before, scale, '見本') : ''}
    ${rangeLine(fact, scale, label)}
    <p class="sub draft-range-values">見込み ${fact.expected}　許容範囲 ${fact.rangeMin}〜${fact.rangeMax}</p>
    <div class="draft-accuracy">
      <span class="sub">正確さ</span>
      <div class="draft-paired-bars">${accuracyChanged ? bar(before.accuracy, 'is-sample') : ''}${bar(fact.accuracy, 'is-accuracy')}</div>
      <span class="sub">${accuracyChanged ? `${before.accuracy} → ` : ''}${fact.accuracy}</span>
    </div>
  </li>`
}

function judgmentsHtml(premise, facts, trial) {
  const scale = weightScale([...baselineFacts.values(), ...facts])
  const { name, properties } = premise.entities[focus]
  const weight = properties.weight.defaultValue
  return `<h3>最初に見たときの判断</h3>
    <p class="sub">${esc(name)}の重さ　${weight === baselineWeight ? weight : `見本 ${baselineWeight} → 試算 ${weight}`}</p>
    <div class="draft-chart-key sub" aria-hidden="true">
      <span><i class="draft-range-band"></i>許容範囲</span>
      <span><i class="draft-expected-mark"></i>見込み</span>
      <span><i class="draft-actual-mark"></i>実際の値</span>
    </div>
    <div class="draft-weight-axis sub" aria-hidden="true">
      <span>${num(scale.min)}</span><span>${num(scale.min / 2 + scale.max / 2)}</span><span>${num(scale.max)}</span>
    </div>
    <ul class="draft-judgments">${facts.map((fact) => judgmentRow(premise, fact, scale, trial)).join('')}</ul>`
}

function shareText(value) {
  // The engine includes only reachable endings, even if their share rounds to zero.
  return value === 0 ? '0.01%未満' : percent.format(value ?? 0)
}

function shareChart(rows, heading, summary, trial) {
  const charts = []
  const numbers = []
  for (const { label, before, after, main } of rows) {
    const text = esc(label)
    const beforeText = shareText(before)
    const afterText = shareText(after)
    const rises = after !== undefined && (before === undefined || after > before)
    const delta = trial && before !== after
      ? `<span class="draft-direction"><span aria-hidden="true">${rises ? '↑' : '↓'}</span> ${rises ? '増える' : '減る'}</span>`
      : ''
    const chartLabel = trial ? `見本 ${beforeText}、試算 ${afterText}` : `見本 ${beforeText}`
    charts.push(`<li>
      <div class="draft-share-head"><strong>${text}</strong>${main ? '<span class="draft-main">主線</span>' : ''}${delta}</div>
      <div class="draft-paired-bars" role="img" aria-label="${chartLabel}">
        ${bar(before, 'is-sample')}${trial ? bar(after) : ''}
      </div>
    </li>`)
    numbers.push(`<tr><th scope="row">${text}</th><td>${beforeText}</td>${trial ? `<td>${afterText}</td>` : ''}</tr>`)
  }
  return `<div class="draft-chart-key sub" aria-hidden="true">
      <span><i class="draft-share-swatch is-sample"></i>見本</span>
      ${trial ? '<span><i class="draft-share-swatch"></i>試算</span>' : ''}
      <span class="draft-share-scale">0〜100%</span>
    </div>
    <ul class="draft-share-chart" aria-labelledby="${heading}">${charts.join('')}</ul>
    <details class="draft-details">
      <summary>${summary}</summary>
      <table class="draft-shares" aria-labelledby="${heading}">
        <thead><tr><th scope="col">項目</th><th scope="col">見本</th>${trial ? '<th scope="col">試算</th>' : ''}</tr></thead>
        <tbody>${numbers.join('')}</tbody>
      </table>
    </details>`
}

function endingsHtml(derivation, trial) {
  const shares = ({ endings }) => new Map(endings.map(({ ending, probability }) => [ending, probability]))
  const before = shares(baseline.derivation)
  const after = shares(derivation)
  const rows = [...new Set([...before.keys(), ...after.keys()])].map((ending) => ({
    label: endingLabel(ending), before: before.get(ending), after: after.get(ending),
  }))
  return `<h3 id="draft-endings">結末の割合</h3>
    ${derivation.truncated ? '<p class="sub">試算は上限までに調べた範囲の割合です。</p>' : ''}
    ${shareChart(rows, 'draft-endings', '結末の数値を見る', trial)}`
}

function actionsHtml(premise, story, trial) {
  const options = ({ model, derivation }) => derivation.scenes[model.startNode]
  const reference = options(baseline)
  const current = options(story)
  const before = new Map(reference.options.map((action) => [action.key, action]))
  const after = new Map(current.options.map((action) => [action.key, action]))
  const rows = [...new Set([...before.keys(), ...after.keys()])].map((key) => {
    const sampleAction = before.get(key)
    const trialAction = after.get(key)
    const action = trialAction ?? sampleAction
    return {
      label: action.kind === 'look' ? `${premise.characters[action.actor].name}が見る` : explainAction(premise, action).label,
      before: sampleAction?.probability,
      after: trialAction?.probability,
      main: key === current.main,
    }
  })
  return `<h3 id="draft-actions">最初の行為の蓋然</h3>
    ${after.size === 0 ? '<p class="sub">この前提から始められる行為がありません。</p>' : ''}
    ${shareChart(rows, 'draft-actions', '行為の数値を見る', trial)}`
}

function renderResult(premise, story, trial = false) {
  const { derivation } = story
  output.innerHTML = `
    ${judgmentsHtml(premise, derivation.perceptions, trial)}
    ${endingsHtml(derivation, trial)}
    ${actionsHtml(premise, story, trial)}
    ${derivation.warnings.map((warning) => `<p class="sub">${esc(warning)}</p>`).join('')}`
}

form.addEventListener('input', () => {
  status.textContent = output.hasChildNodes()
    ? '入力が変わりました。下の結果は前回の試算です。'
    : '入力を確認して、もう一度試算してください。'
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  try {
    const premise = readPremise()
    renderResult(premise, generateStory(premise), true)
    status.textContent = '入力した前提で試算しました。'
  } catch (error) {
    status.textContent = `試算できませんでした。${error.message}`
    output.replaceChildren()
  }
})

form.addEventListener('reset', () => {
  renderResult(sample, baseline)
  status.textContent = '見本の入力と結果に戻しました。'
})

renderResult(sample, baseline)
