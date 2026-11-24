import { endingLabel, generateStory } from '@narrativegen/engine-ts/browser'
import sample from '../../../models/premises/cheeseburger-weight-hearsay.json'
import { esc } from './format.js'

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

const baseline = generateStory(structuredClone(sample)).derivation
const baselineJudgments = new Map(baseline.perceptions.map((fact) => [fact.character, fact.noticed]))
const shares = (derivation) => new Map(derivation.endings.map(({ ending, probability }) => [ending, probability]))
const baselineShares = shares(baseline)
const baselineWeight = sample.entities[focus].properties.weight.defaultValue

function outcome(noticed) {
  return `<span class="draft-outcome${noticed ? ' is-noticed' : ''}">${noticed ? '違和感あり' : '気に留めない'}</span>`
}

function judgmentRow(premise, fact, changed) {
  const result = changed
    ? `<div class="draft-transition">
        <div><span class="sub">見本</span>${outcome(baselineJudgments.get(fact.character))}</div>
        <span aria-hidden="true">→</span>
        <div><span class="sub">試算</span>${outcome(fact.noticed)}</div>
      </div>`
    : outcome(fact.noticed)
  return `<li class="draft-judgment${changed ? ' is-changed' : ''}">
    <div class="draft-judgment-head"><strong>${esc(premise.characters[fact.character].name)}</strong>${changed ? '' : result}</div>
    ${changed ? result : ''}
    <p class="sub">見込み ${fact.expected}　許容範囲 ${fact.rangeMin}〜${fact.rangeMax}</p>
  </li>`
}

function judgmentsHtml(premise, derivation) {
  const changed = []
  const same = []
  for (const fact of derivation.perceptions) {
    const differs = baselineJudgments.get(fact.character) !== fact.noticed
    const rows = differs ? changed : same
    rows.push(judgmentRow(premise, fact, differs))
  }
  const { name, properties } = premise.entities[focus]
  const weight = properties.weight.defaultValue
  return `<h3>最初に見たときの判断</h3>
    <p class="sub">${esc(name)}の重さ　${weight === baselineWeight ? weight : `見本 ${baselineWeight} → 試算 ${weight}`}</p>
    ${changed.length ? `<ul class="draft-judgments">${changed.join('')}</ul>` : '<p class="draft-no-change">見本と同じ判断です。</p>'}
    ${same.length ? `<details class="draft-details">
      <summary>${changed.length ? 'ほかの人物の判断' : 'すべての人物の判断'}</summary>
      <ul class="draft-judgments">${same.join('')}</ul>
    </details>` : ''}`
}

function shareText(value) {
  // The engine includes only reachable endings, even if their share rounds to zero.
  return value === 0 ? '0.01%未満' : percent.format(value ?? 0)
}

function endingsHtml(derivation) {
  const trial = shares(derivation)
  const changes = []
  const numbers = []
  for (const ending of new Set([...baselineShares.keys(), ...trial.keys()])) {
    const label = esc(endingLabel(ending))
    const before = baselineShares.get(ending)
    const after = trial.get(ending)
    numbers.push(`<tr><th scope="row">${label}</th><td>${shareText(before)}</td><td>${shareText(after)}</td></tr>`)
    if (before === after) continue
    const rises = after !== undefined && (before === undefined || after > before)
    changes.push(`<li><strong>${label}</strong><span class="draft-direction"><span aria-hidden="true">${rises ? '↑' : '↓'}</span> ${rises ? '増える' : '減る'}</span></li>`)
  }
  return `<h3 id="draft-endings">結末の変化</h3>
    ${derivation.truncated ? '<p class="sub">試算は上限までに調べた範囲の割合です。</p>' : ''}
    ${changes.length ? `<ul class="draft-ending-changes">${changes.join('')}</ul>` : '<p class="draft-no-change">見本と同じ割合です。</p>'}
    <details class="draft-details">
      <summary>数値を見る</summary>
      <table class="draft-shares" aria-labelledby="draft-endings">
        <thead><tr><th scope="col">結末</th><th scope="col">見本</th><th scope="col">試算</th></tr></thead>
        <tbody>${numbers.join('')}</tbody>
      </table>
    </details>`
}

function renderResult(premise, derivation) {
  output.innerHTML = `
    ${judgmentsHtml(premise, derivation)}
    ${endingsHtml(derivation)}
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
    renderResult(premise, generateStory(premise).derivation)
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
