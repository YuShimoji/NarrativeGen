import { esc } from './format.js'
import { choiceWording } from './edit.js'
import './ash-ferry.css'

export function isInquiry(model, source) {
  return model?.variables?.表示形式 === '聞き込み' || (source?.kind === 'sample' && source.file === 'models/examples/ash-ferry.json')
}

function choiceButton(choice, label, cls) {
  return `<button type="button" class="${cls}" data-choice="${esc(choice.id)}">${esc(label)}</button>`
}

// Link only words that are currently actionable in the engine's trace.
function dialogueText(text, topics) {
  const byWord = new Map(topics.filter((c) => c.text).map((c) => [c.text, c]))
  const words = [...byWord.keys()].sort((a, b) => b.length - a.length)
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = words.length ? new RegExp(`(${escaped.join('|')})`, 'g') : null
  return text.split(/\n\s*\n/).map((p) => {
    const parts = pattern ? p.split(pattern) : [p]
    return `<p>${parts.map((word) => byWord.has(word) ? choiceButton(byWord.get(word), word, 'ferry-word') : esc(word)).join('')}</p>`
  }).join('')
}

function choiceGroup(label, choices, visited, travel = false) {
  if (!choices.length) return ''
  return `<section class="ferry-group"><h3>${label}</h3><ul>${choices.map((c) => {
    const cls = travel ? 'ferry-destination' : `ferry-topic${visited.has(c.target) ? ' asked' : ''}`
    return `<li>${choiceButton(c, c.text, cls)}</li>`
  }).join('')}</ul></section>`
}

function speakerAt(model, nodeId) {
  const [place, speaker] = (model.nodes[nodeId]?.speaker || '').split('｜')
  return { place: speaker ? place : '', name: speaker || place }
}

export function ferryWindow(model, step, route) {
  const { scene } = step
  const { place, name } = speakerAt(model, scene.nodeId)
  const visited = new Set(route.map((s) => s.scene.nodeId))
  const choices = scene.choices.filter((c) => c.available).map(({ choice }) => ({ ...choice, text: choiceWording(choice.text) }))
  const topics = choices.filter((c) => !c.id.startsWith('go_'))
  const travel = choices.filter((c) => c.id.startsWith('go_'))
  const isNote = (c) => c.kind === 'event' || c.kind === 'eventUpdate'
  const notes = route.flatMap((s) => s.changes.filter(isNote).map((c) => {
    const props = s.session.events[c.key]?.properties
    const actor = (props?.asker ?? props?.speaker ?? props?.observer)?.defaultValue
    const source = s.perceptions.find((p) => p.eventId === c.key)?.characterName ?? model.characters?.[actor]?.name ?? speakerAt(model, s.fromNodeId || s.scene.nodeId).name
    return { source, text: c.name }
  }))
  const newNote = step.changes.some(isNote)
  const journalTitle = scene.ending ? '完了した依頼' : '依頼'
  const goal = esc(step.session.variables?.依頼)
  return `<article class="ferry-window">
    <header class="ferry-hero">
      <div class="ferry-titles">
        <p class="ferry-region"><i aria-hidden="true"></i>${esc(step.session.variables?.地域 ?? '灰渡りの港')}</p>
        <h1>${esc(step.session.variables?.依頼名)}</h1>
      </div>
      <button class="ferry-book" type="button" data-ferry="journal" aria-haspopup="dialog"><i aria-hidden="true"></i>旅の手帳<span>${notes.length + 1}</span></button>
    </header>
    <section class="ferry-frame" aria-labelledby="ferry-speaker">
      <div class="ferry-bar"><span>${scene.ending ? '結末' : '会話'}</span><i aria-hidden="true"></i><span>${esc(place)}</span></div>
      <div class="ferry-body">
        <div class="ferry-speech">
          <h2 id="ferry-speaker" class="ferry-speaker" tabindex="-1">${esc(name)}</h2>
          <div class="ferry-prose">${dialogueText(scene.text.text, topics)}</div>
          ${newNote ? '<p class="ferry-ink"><i aria-hidden="true">✧</i> 旅の手帳に記した</p>' : ''}
        </div>
        <nav class="ferry-menu" aria-label="会話と移動">
          ${choiceGroup('話題', topics, visited)}
          ${choiceGroup('行き先', travel, visited, true)}
          ${scene.ending ? `<section class="ferry-group"><h3>依頼完了</h3><button type="button" class="ferry-topic" data-ferry="journal">手帳を読み返す</button>
          ${route.length > 1 ? `<button type="button" class="ferry-destination" data-step="${route.length - 2}">最後の選択に戻る</button>` : ''}</section>` : ''}
        </nav>
      </div>
    </section>
    <footer class="ferry-tools"><button type="button" data-ferry="studio">Studioで道筋・判断を見る <span aria-hidden="true">↗</span></button></footer>
    <dialog id="ferry-journal" aria-labelledby="ferry-journal-title">
      <header><h2 id="ferry-journal-title">旅の手帳</h2><form method="dialog"><button autofocus>閉じる</button></form></header>
      <p class="ferry-journal-caption">${journalTitle}</p><h3>${esc(step.session.variables?.依頼名)}</h3><p>${goal}</p>
      ${notes.length ? `<ol>${notes.map((n) => `<li><b>${esc(n.source)}</b><p>${esc(n.text)}</p></li>`).join('')}</ol>` : ''}
    </dialog>
  </article>`
}
