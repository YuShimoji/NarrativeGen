import { endingLabel, explainAction, generateStory } from '@narrativegen/engine-ts/browser'
import sample from '../../../models/premises/cheeseburger-weight-hearsay.json'
import { esc, num } from './format.js'

const form = document.getElementById('draft-form')
const status = document.getElementById('draft-status')
const output = document.getElementById('draft-output')
const personFields = document.getElementById('draft-person-fields')
const addPerson = document.getElementById('draft-add-person')
const newPremise = document.getElementById('draft-new')
const submit = document.getElementById('draft-submit')
const propertyField = document.getElementById('draft-property-field')
const thingName = form.elements.namedItem('thing-name')
const propertyName = form.elements.namedItem('property-name')
const actualValue = form.elements.namedItem('actual')
const percent = new Intl.NumberFormat('ja-JP', { style: 'percent', maximumFractionDigits: 2 })
const customFocus = 'thing'
const customProperty = 'value'

const sampleResult = { premise: sample, story: generateStory(structuredClone(sample)), label: '見本' }
let firstTrial
let nextPerson = 0
let trialWorker

function field(id, personLabel, key, label, value, attributes, className = '') {
  return `<label class="${className}">
    <span class="draft-field-label" aria-hidden="true">${label}</span>
    <input name="${esc(id)}-${key}" aria-label="${esc(personLabel)}の${label}" value="${esc(value)}" required ${attributes} />
  </label>`
}

function personRow(id, personLabel, values, custom = false) {
  const input = (key, label, attributes, className) =>
    field(id, personLabel, key, label, values[key] ?? '', attributes, className)
  return `<div class="draft-person" data-person-id="${esc(id)}" role="group" aria-label="${esc(personLabel)}">
    ${custom ? input('name', '名前', 'type="text"', 'draft-person-name') : `<strong>${esc(personLabel)}</strong>`}
    ${input('domain', '知識の分野', 'type="text"')}
    ${input('accuracy', '正確さ', 'type="number" min="0" max="1" step="any"')}
    ${input('tolerance', '許容幅', 'type="number" min="0" step="any"')}
    ${custom ? input('expected', '見込みの値', 'type="number" step="any"') : input('expected', '重さの見込み', 'type="number" min="0" step="any"')}
    ${custom ? `<button type="button" class="btn draft-remove-person" data-remove-person aria-label="${esc(personLabel)}を外す">外す</button>` : ''}
  </div>`
}

function appendPerson() {
  nextPerson += 1
  personFields.insertAdjacentHTML('beforeend', personRow(`person_${nextPerson}`, `人物${nextPerson}`, { domain: 'general' }, true))
  updateRemoveButtons()
  return personFields.lastElementChild
}

function updateRemoveButtons() {
  for (const button of personFields.querySelectorAll('[data-remove-person]')) {
    button.disabled = personFields.childElementCount === 1
  }
}

function readText(fields, key, label) {
  const text = fields.get(key)?.trim()
  if (!text) throw new Error(`${label}を入力してください。`)
  return text
}

function readSample(fields) {
  const premise = structuredClone(sample)
  const focus = premise.scene.focus
  premise.entities[focus].name = readText(fields, 'thing-name', '物の名前')
  premise.entities[focus].properties.weight.defaultValue = Number(fields.get('actual'))
  for (const belief of premise.beliefs.filter(({ entity }) => entity === focus)) {
    const { character: id } = belief
    const person = premise.characters[id]
    const profile = person.knowledgeProfiles.find(({ domain }) => domain === belief.domain)
    const domain = readText(fields, `${id}-domain`, `${person.name}の知識の分野`)
    Object.assign(profile, { domain, accuracy: Number(fields.get(`${id}-accuracy`)), tolerance: Number(fields.get(`${id}-tolerance`)) })
    belief.domain = domain
    belief.expectations.weight = Number(fields.get(`${id}-expected`))
  }
  return premise
}

function readCustom(fields) {
  const name = readText(fields, 'thing-name', '物の名前')
  const property = readText(fields, 'property-name', '性質の名前')
  const premise = {
    title: `${name}の${property}`,
    entities: { [customFocus]: {
      id: customFocus,
      name,
      properties: { [customProperty]: { key: customProperty, type: 'number', defaultValue: Number(fields.get('actual')) } },
    } },
    characters: {},
    beliefs: [],
    scene: { focus: customFocus, present: [] },
    wording: { propertyNames: { [customProperty]: property } },
  }
  for (const row of personFields.children) {
    const id = row.dataset.personId
    const name = readText(fields, `${id}-name`, `${row.getAttribute('aria-label')}の名前`)
    const domain = readText(fields, `${id}-domain`, `${name}の知識の分野`)
    const accuracy = Number(fields.get(`${id}-accuracy`))
    const tolerance = Number(fields.get(`${id}-tolerance`))
    const expected = Number(fields.get(`${id}-expected`))
    premise.characters[id] = { id, name, knowledgeProfiles: [{ domain, accuracy, tolerance }] }
    premise.beliefs.push({ character: id, entity: customFocus, domain, expectations: { [customProperty]: expected } })
    premise.scene.present.push(id)
  }
  return premise
}

function focusValue(premise) {
  const entity = premise.entities[premise.scene.focus]
  const key = premise.scene.focus === customFocus ? customProperty : 'weight'
  return { thing: entity.name, property: premise.wording.propertyNames[key], value: entity.properties[key].defaultValue }
}

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

function judgmentRow(name, fact, before, scale, label, referenceLabel) {
  const changed = before && before.noticed !== fact.noticed
  const range = rangeValues(fact)
  const rangeChanged = before && rangeValues(before).some((value, i) => value !== range[i])
  const accuracyChanged = before && before.accuracy !== fact.accuracy
  const result = changed
    ? `<div class="draft-transition">
        ${outcome(before.noticed)}
        <span aria-hidden="true">→</span>
        ${outcome(fact.noticed)}
      </div>`
    : outcome(fact.noticed)
  return `<li class="draft-judgment${changed ? ' is-changed' : ''}">
    <div class="draft-judgment-head"><strong>${esc(name)}</strong>${result}</div>
    ${rangeChanged ? rangeLine(before, scale, referenceLabel) : ''}
    ${rangeLine(fact, scale, label)}
    <p class="sub draft-range-values">見込み ${fact.expected}　許容範囲 ${fact.rangeMin}〜${fact.rangeMax}</p>
    <div class="draft-accuracy">
      <span class="sub">正確さ</span>
      <div class="draft-paired-bars">${accuracyChanged ? bar(before.accuracy, 'is-sample') : ''}${bar(fact.accuracy, 'is-accuracy')}</div>
      <span class="sub">${accuracyChanged ? `${before.accuracy} → ` : ''}${fact.accuracy}</span>
    </div>
  </li>`
}

function judgmentsHtml(result, reference) {
  const { premise, label, story: { derivation: { perceptions: facts } } } = result
  const previousFacts = reference?.story.derivation.perceptions ?? []
  const before = new Map(previousFacts.map((fact) => [fact.character, fact]))
  const scale = weightScale([...previousFacts, ...facts])
  const { thing, property, value } = focusValue(premise)
  const referenceValue = reference && focusValue(reference.premise).value
  const comparison = reference && referenceValue !== value ? `${reference.label} ${referenceValue} → ${label} ${value}` : value
  return `<h3>最初に見たときの判断</h3>
    <p class="sub">${esc(thing)}の${esc(property)}　${comparison}</p>
    <div class="draft-chart-key sub" aria-hidden="true">
      <span><i class="draft-range-band"></i>許容範囲</span>
      <span><i class="draft-expected-mark"></i>見込み</span>
      <span><i class="draft-actual-mark"></i>実際の値</span>
    </div>
    <div class="draft-weight-axis sub" aria-hidden="true">
      <span>${num(scale.min)}</span><span>${num(scale.min / 2 + scale.max / 2)}</span><span>${num(scale.max)}</span>
    </div>
    <ul class="draft-judgments">${facts.map((fact) =>
      judgmentRow(premise.characters[fact.character].name, fact, before.get(fact.character), scale, label, reference?.label)).join('')}</ul>`
}

function shareText(value) {
  // The engine includes only reachable endings, even if their share rounds to zero.
  return value === 0 ? '0.01%未満' : percent.format(value ?? 0)
}

function shareChart(rows, heading, summary, label, referenceLabel) {
  const charts = []
  const numbers = []
  for (const { label: rowLabel, before, after, main } of rows) {
    const text = esc(rowLabel)
    const beforeText = shareText(before)
    const afterText = shareText(after)
    const rises = after !== undefined && (before === undefined || after > before)
    const delta = referenceLabel && before !== after
      ? `<span class="draft-direction"><span aria-hidden="true">${rises ? '↑' : '↓'}</span> ${rises ? '増える' : '減る'}</span>`
      : ''
    const chartLabel = referenceLabel ? `${referenceLabel} ${beforeText}、${label} ${afterText}` : `${label} ${afterText}`
    charts.push(`<li>
      <div class="draft-share-head"><strong>${text}</strong>${main ? '<span class="draft-main">主線</span>' : ''}${delta}</div>
      <div class="draft-paired-bars" role="img" aria-label="${chartLabel}">
        ${referenceLabel ? bar(before, 'is-sample') : ''}${bar(after, label === '見本' ? 'is-sample' : '')}
      </div>
    </li>`)
    numbers.push(`<tr><th scope="row">${text}</th>${referenceLabel ? `<td>${beforeText}</td>` : ''}<td>${afterText}</td></tr>`)
  }
  return `<div class="draft-chart-key sub" aria-hidden="true">
      ${referenceLabel ? `<span><i class="draft-share-swatch is-sample"></i>${referenceLabel}</span>` : ''}
      <span><i class="draft-share-swatch${label === '見本' ? ' is-sample' : ''}"></i>${label}</span>
      <span class="draft-share-scale">0〜100%</span>
    </div>
    <ul class="draft-share-chart" aria-labelledby="${heading}">${charts.join('')}</ul>
    <details class="draft-details">
      <summary>${summary}</summary>
      <table class="draft-shares" aria-labelledby="${heading}">
        <thead><tr><th scope="col">項目</th>${referenceLabel ? `<th scope="col">${referenceLabel}</th>` : ''}<th scope="col">${label}</th></tr></thead>
        <tbody>${numbers.join('')}</tbody>
      </table>
    </details>`
}

function endingsHtml(result, reference) {
  const { label, story: { derivation } } = result
  const shares = (value) => new Map(value?.endings.map(({ ending, probability }) => [ending, probability]))
  const before = shares(reference?.story.derivation)
  const after = shares(derivation)
  const rows = [...new Set([...before.keys(), ...after.keys()])].map((ending) => ({
    label: endingLabel(ending), before: before.get(ending), after: after.get(ending),
  }))
  return `<h3 id="draft-endings">結末の割合</h3>
    ${derivation.truncated ? '<p class="sub">試算は上限までに調べた範囲の割合です。</p>' : ''}
    ${shareChart(rows, 'draft-endings', '結末の数値を見る', label, reference?.label)}`
}

function actionsHtml(result, reference) {
  const { premise, story, label } = result
  const options = ({ model, derivation }) => derivation.scenes[model.startNode]
  const current = options(story)
  const before = new Map(reference && options(reference.story).options.map((action) => [action.key, action]))
  const after = new Map(current.options.map((action) => [action.key, action]))
  const rows = [...new Set([...before.keys(), ...after.keys()])].map((key) => {
    const sampleAction = before.get(key)
    const trialAction = after.get(key)
    const action = trialAction ?? sampleAction
    const actionPremise = trialAction ? premise : reference.premise
    return {
      label: action.kind === 'look' ? `${actionPremise.characters[action.actor].name}が見る` : explainAction(actionPremise, action).label,
      before: sampleAction?.probability,
      after: trialAction?.probability,
      main: key === current.main,
    }
  })
  return `<h3 id="draft-actions">最初の行為の蓋然</h3>
    ${after.size === 0 ? '<p class="sub">この前提から始められる行為がありません。</p>' : ''}
    ${rows.length ? shareChart(rows, 'draft-actions', '行為の数値を見る', label, reference?.label) : ''}`
}

function renderResult(result, reference) {
  const { derivation } = result.story
  output.innerHTML = `
    ${judgmentsHtml(result, reference)}
    ${endingsHtml(result, reference)}
    ${actionsHtml(result, reference)}
    ${derivation.warnings.map((warning) => `<p class="sub">${esc(warning)}</p>`).join('')}`
}

function stopTrial() {
  trialWorker?.terminate()
  trialWorker = undefined
  submit.removeAttribute('aria-disabled')
}

function setMode(mode) {
  stopTrial()
  firstTrial = undefined
  form.dataset.mode = mode
  const custom = mode === 'custom'
  propertyField.hidden = !custom
  propertyName.disabled = !custom
  newPremise.hidden = custom
  addPerson.hidden = !custom
  document.getElementById('draft-actual-label').textContent = custom ? '実際の値' : '重さの実際の値'
  document.getElementById('draft-expected-label').textContent = custom ? '見込みの値' : '重さの見込み'
}

function showSample(message) {
  setMode('sample')
  document.getElementById('draft-sample').textContent = `見本　${sample.title}`
  const focus = sample.scene.focus
  const { thing, value } = focusValue(sample)
  thingName.value = thing
  actualValue.min = '0'
  actualValue.value = value
  personFields.innerHTML = sample.scene.present.map((id) => {
    const person = sample.characters[id]
    const belief = sample.beliefs.find(({ character, entity }) => character === id && entity === focus)
    const profile = person.knowledgeProfiles.find(({ domain }) => domain === belief.domain)
    return personRow(id, person.name, { ...profile, expected: belief.expectations.weight })
  }).join('')
  renderResult(sampleResult)
  status.textContent = message
}

function showCustom() {
  setMode('custom')
  document.getElementById('draft-sample').textContent = '自分の前提'
  thingName.value = ''
  propertyName.value = ''
  actualValue.removeAttribute('min')
  actualValue.value = ''
  personFields.replaceChildren()
  nextPerson = 0
  appendPerson()
  output.replaceChildren()
  status.textContent = '物と人物の前提を入力すると試算できます。'
  thingName.focus()
}

function markStale() {
  stopTrial()
  status.textContent = output.hasChildNodes()
    ? '入力が変わりました。下の結果は前回の試算です。'
    : '物と人物の前提を入力すると試算できます。'
}

newPremise.addEventListener('click', showCustom)
document.getElementById('draft-reset').addEventListener('click', () => showSample('見本の入力と結果に戻しました。'))
addPerson.addEventListener('click', () => {
  const row = appendPerson()
  markStale()
  row.querySelector('input').focus()
})
personFields.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-person]')
  if (!button || button.disabled) return
  const row = button.closest('.draft-person')
  const next = row.nextElementSibling?.querySelector('input') ?? addPerson
  row.remove()
  updateRemoveButtons()
  markStale()
  next.focus()
})
form.addEventListener('input', markStale)

function showTrial(premise, story, custom) {
  const result = { premise, story, label: '試算' }
  if (!custom) {
    renderResult(result, sampleResult)
    status.textContent = '入力した前提で試算しました。'
    return
  }
  const current = focusValue(premise)
  const original = firstTrial && focusValue(firstTrial.premise)
  if (!original || current.thing !== original.thing || current.property !== original.property) {
    renderResult(result)
    firstTrial = { ...result, label: '初回' }
    status.textContent = 'この物と性質の初回の試算です。次の試算からこの結果と比較できます。'
  } else {
    renderResult(result, firstTrial)
    status.textContent = '入力した前提で試算しました。'
  }
}

function showError(message) {
  stopTrial()
  status.textContent = `試算できませんでした。${message}`
  output.replaceChildren()
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  if (trialWorker) return
  try {
    const custom = form.dataset.mode === 'custom'
    const fields = new FormData(form)
    const premise = custom ? readCustom(fields) : readSample(fields)
    const worker = new Worker(new URL('./premise-worker.js', import.meta.url), { type: 'module' })
    trialWorker = worker
    submit.setAttribute('aria-disabled', 'true')
    status.textContent = output.hasChildNodes()
      ? '試算中です。下は前回の結果です。'
      : '試算中です。'
    worker.addEventListener('message', ({ data }) => {
      if (trialWorker !== worker) return
      stopTrial()
      try {
        if (data.error) throw new Error(data.error)
        showTrial(premise, data.story, custom)
      } catch (error) {
        showError(error.message)
      }
    })
    worker.addEventListener('error', () => {
      if (trialWorker === worker) showError('試算を実行できませんでした。')
    })
    worker.postMessage(premise)
  } catch (error) {
    showError(error.message)
  }
})

showSample('見本の結果を表示しています。')
