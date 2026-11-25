import { comparePremiseReactions } from '@narrativegen/engine-ts/browser'
import { esc } from './format.js'

const focus = 'crate'
const domain = 'cargo_weight'
const people = [
  { id: 'receiver', name: '荷受け係', expected: 12, accuracy: 0.25 },
  { id: 'driver', name: '配送担当', expected: 14, accuracy: 0.55 },
  { id: 'inspector', name: '検品担当', expected: 10, accuracy: 0.75 },
  { id: 'record', name: '記録係', expected: 10, accuracy: 0.9 },
  { id: 'rough', name: '目測した作業員', expected: 12 },
]

const form = document.getElementById('testimony-form')
const reactions = document.getElementById('testimony-reactions')
const weightFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 })

function reactionCell(fact, label) {
  if (!fact) return '<td>判定できない</td>'
  const format = (value) => weightFormat.format(value)
  return `<td>
    <strong class="${fact.noticed ? 'bad-text' : 'ok-text'}">${label}</strong>
    <div>見込み ${format(fact.expected)} kg</div>
    <div class="sub">許容 <span class="testimony-range">${format(fact.rangeMin)}〜${format(fact.rangeMax)} kg</span></div>
  </td>`
}

function render() {
  const roughAccuracy = Number(new FormData(form).get('accuracy'))
  const premise = {
    entities: {
      [focus]: {
        id: focus,
        name: '荷箱',
        properties: { weight: { key: 'weight', type: 'number', defaultValue: 12 } },
      },
    },
    characters: Object.fromEntries(people.map(({ id, name, accuracy }) => [id, {
      id,
      name,
      knowledgeProfiles: [{ domain, accuracy: accuracy ?? roughAccuracy, tolerance: 0.1 }],
    }])),
    beliefs: people.map(({ id, expected }) => ({ character: id, entity: focus, domain, expectations: { weight: expected } })),
    scene: { focus, present: people.map(({ id }) => id) },
  }
  const compared = comparePremiseReactions(premise, ['record', 'rough'])
  reactions.innerHTML = compared.map(({ character, before, after }) => {
    const beforeLabel = before?.noticed ? '違和感あり' : '違和感なし'
    const afterLabel = after?.noticed
      ? (before?.noticed ? '違和感が残る' : '違和感に気づく')
      : (before?.noticed ? '違和感が消える' : '違和感なし')
    return `<tr>
      <th scope="row">${esc(premise.characters[character].name)}<p class="sub">正確さ ${before?.accuracy.toFixed(2) ?? '—'}</p></th>
      ${reactionCell(before, beforeLabel)}
      ${reactionCell(after, afterLabel)}
    </tr>`
  }).join('')
}

form.addEventListener('change', render)
render()
