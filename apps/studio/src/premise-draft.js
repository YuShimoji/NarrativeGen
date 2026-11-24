import { endingLabel, generateStory } from '@narrativegen/engine-ts/browser'
import sample from '../../../models/premises/cheeseburger-weight-hearsay.json'
import { esc, num } from './format.js'

const form = document.getElementById('draft-form')
const status = document.getElementById('draft-status')
const output = document.getElementById('draft-output')
const focus = sample.scene.focus
const percent = new Intl.NumberFormat('ja-JP', { style: 'percent', maximumFractionDigits: 1 })

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
const shares = (derivation) => new Map(derivation.endings.map(({ ending, probability }) => [ending, probability]))

function renderResult(premise, derivation) {
  const facts = derivation.perceptions.map((fact) => `<li class="draft-judgment">
    <div><strong>${esc(premise.characters[fact.character].name)}</strong>
      <span class="draft-outcome ${fact.noticed ? 'is-noticed' : ''}">${fact.noticed ? '違和感あり' : '気に留めない'}</span></div>
    <p class="sub">見込み ${num(fact.expected)}　許容範囲 ${num(fact.rangeMin)}〜${num(fact.rangeMax)}</p>
  </li>`).join('')
  const before = shares(baseline)
  const after = shares(derivation)
  const rows = [...new Set([...before.keys(), ...after.keys()])].map((ending) => `<tr>
    <th scope="row">${esc(endingLabel(ending))}</th>
    <td>${percent.format(before.get(ending) ?? 0)}</td>
    <td>${percent.format(after.get(ending) ?? 0)}</td>
  </tr>`).join('')
  output.innerHTML = `
    <h3>最初に見たときの判断</h3>
    <p class="sub">${esc(premise.entities[focus].name)}の重さ ${num(premise.entities[focus].properties.weight.defaultValue)}</p>
    <ul class="draft-judgments">${facts}</ul>
    <h3 id="draft-endings">結末の割合</h3>
    ${derivation.truncated ? '<p class="sub">上限までに調べた範囲の割合です。</p>' : ''}
    <table class="draft-shares" aria-labelledby="draft-endings">
      <thead><tr><th scope="col">結末</th><th scope="col">見本</th><th scope="col">試算</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
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
