import { comparePremiseReactions } from '@narrativegen/engine-ts/browser'
import { esc } from './format.js'

const scenes = {
  stage: {
    title: '舞台の暗転',
    intro: '通し稽古で客席から舞台が見えなくなった時間について、舞台袖の三人が二つの証言を聞く。',
    thing: '演出の暗転',
    property: 'duration',
    actual: 10,
    unit: '秒',
    measurementSource: '舞台の計測ログ',
    listeners: [
      { id: 'director', name: '舞台監督', expected: 8, accuracy: 0.8, tolerance: 0.1 },
      { id: 'lighting', name: '照明係', expected: 9.5, accuracy: 0.4, tolerance: 0.02 },
      { id: 'sound', name: '音響係', expected: 13, accuracy: 0.6, tolerance: 0.05 },
    ],
    witnesses: [
      { id: 'timer', name: 'ストップウォッチで測った係', quote: '「測ったら10秒でした」', expected: 10, accuracy: 0.8, tolerance: 0.05 },
      { id: 'performer', name: '体感で答えた出演者', quote: '「ずいぶん長かった。14秒くらいかな」', expected: 14, tolerance: 0.35 },
    ],
    accuracyOptions: [[0.4, '初期値'], [0.1, '話の重みを下げる']],
  },
  crate: {
    title: '搬入口の荷箱',
    intro: '搬入口で荷箱を受け取る。三人が二つの証言を聞き、同じ荷箱を見直す。',
    thing: '荷箱',
    property: 'weight',
    actual: 12,
    unit: ' kg',
    measurementSource: 'はかりで計測',
    listeners: [
      { id: 'receiver', name: '荷受け係', expected: 12, accuracy: 0.25, tolerance: 0.1 },
      { id: 'driver', name: '配送担当', expected: 14, accuracy: 0.55, tolerance: 0.1 },
      { id: 'inspector', name: '検品担当', expected: 10, accuracy: 0.75, tolerance: 0.1 },
    ],
    witnesses: [
      { id: 'record', name: '記録係', quote: '「作業票では、10 kgのはずです」', expected: 10, accuracy: 0.9, tolerance: 0.1 },
      { id: 'rough', name: '目測した作業員', quote: '「見た感じ、12 kgくらいでしょう」', expected: 12, tolerance: 0.1 },
    ],
    accuracyOptions: [[0.2, '低い'], [0.9, '記録係と同じ']],
  },
}

const sceneKey = new URLSearchParams(location.search).get('scene') === 'crate' ? 'crate' : 'stage'
const scene = scenes[sceneKey]
const people = [...scene.listeners, ...scene.witnesses]
const focus = 'thing'
const domain = scene.property
const numberFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 })
const amount = (value) => numberFormat.format(value) + scene.unit
const reactions = document.getElementById('testimony-reactions')

document.title = `${scene.title} | NarrativeGen Studio`
document.getElementById('testimony-title').textContent = scene.title
document.getElementById('testimony-intro').textContent = scene.intro
document.getElementById('testimony-actual').textContent = `実測値 ${amount(scene.actual)}`
document.getElementById('testimony-measurement-source').textContent = scene.measurementSource
document.querySelector(`[data-scene="${sceneKey}"]`).setAttribute('aria-current', 'page')

const options = scene.accuracyOptions.map(([value, label], index) => `
  <label><input type="radio" name="accuracy" value="${value}"${index === 0 ? ' checked' : ''} /> ${value.toFixed(2)}（${esc(label)}）</label>
`).join('')
document.getElementById('testimony-accounts').innerHTML = scene.witnesses.map((witness) => `
  <article class="card">
    <h2>${esc(witness.name)}</h2>
    <p>${esc(witness.quote)}</p>
    ${witness.accuracy === undefined
      ? `<form id="testimony-form"><fieldset><legend>知識の正確さを切り替える</legend>${options}</fieldset></form>`
      : `<p class="sub">知識の正確さ ${witness.accuracy.toFixed(2)}</p>`}
  </article>
`).join('')
const form = document.getElementById('testimony-form')

function comparisonCells(before, after) {
  if (!before || !after) return '<td colspan="2">判定できない</td>'
  const beforeError = Math.round(Math.abs(before.expected - before.actual) * 100)
  const afterError = Math.round(Math.abs(after.expected - after.actual) * 100)
  const errorChange = afterError - beforeError
  const label = errorChange < 0 ? '近づいた' : errorChange > 0 ? '遠ざかった' : '変わらない'
  const color = errorChange < 0 ? 'ok-text' : errorChange > 0 ? 'bad-text' : ''
  const range = (fact) => `<span class="testimony-range">${numberFormat.format(fact.rangeMin)}〜${amount(fact.rangeMax)}</span>`
  return `<td>
    <strong class="${color}">${label}</strong>
    <div>${amount(beforeError / 100)} → ${amount(afterError / 100)}</div>
    <div class="sub">見込み ${amount(before.expected)} → ${amount(after.expected)}</div>
  </td><td>
    <strong>${before.noticed ? 'あり' : 'なし'} → ${after.noticed ? 'あり' : 'なし'}</strong>
    <div class="sub">許容（前） ${range(before)}</div>
    <div class="sub">許容（後） ${range(after)}</div>
  </td>`
}

function render() {
  const roughAccuracy = Number(new FormData(form).get('accuracy'))
  const premise = {
    entities: {
      [focus]: {
        id: focus,
        name: scene.thing,
        properties: { [scene.property]: { key: scene.property, type: 'number', defaultValue: scene.actual } },
      },
    },
    characters: Object.fromEntries(people.map(({ id, name, accuracy, tolerance }) => [id, {
      id,
      name,
      knowledgeProfiles: [{ domain, accuracy: accuracy ?? roughAccuracy, tolerance }],
    }])),
    beliefs: people.map(({ id, expected }) => ({ character: id, entity: focus, domain, expectations: { [scene.property]: expected } })),
    scene: { focus, present: people.map(({ id }) => id) },
  }
  const compared = comparePremiseReactions(premise, scene.witnesses.map(({ id }) => id))
  reactions.innerHTML = compared.map(({ character, before, after }) => `<tr>
      <th scope="row">${esc(premise.characters[character].name)}<p class="sub">正確さ ${before?.accuracy.toFixed(2) ?? '—'}</p></th>
      ${comparisonCells(before, after)}
    </tr>`).join('')
}

form.addEventListener('change', render)
render()
