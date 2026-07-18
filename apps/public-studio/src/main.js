import {
  applyChoice,
  getAvailableChoices,
  resolveNarrativeDisplayText,
  startSession,
} from '@narrativegen/engine-ts/browser'
import { cloneValue, createPublicSample } from './public-sample.js'
import { hasModelShape, validateDraft, validationCounts } from './validation.js'
import './styles.css'

const STORAGE_KEY = 'narrativegen.public-studio.draft.v0'
const STORAGE_VERSION = 1

const elements = {
  storySpeaker: document.querySelector('#story-speaker'),
  storyText: document.querySelector('#story-text'),
  storyChoices: document.querySelector('#story-choices'),
  playStatus: document.querySelector('#play-status'),
  restartPreview: document.querySelector('#restart-preview'),
  draftStatus: document.querySelector('#draft-status'),
  transferStatus: document.querySelector('#transfer-status'),
  nodeList: document.querySelector('#node-list'),
  nodeText: document.querySelector('#node-text'),
  choiceEditor: document.querySelector('#choice-editor'),
  previewSelected: document.querySelector('#preview-selected'),
  refreshValidation: document.querySelector('#refresh-validation'),
  validationSummary: document.querySelector('#validation-summary'),
  validationList: document.querySelector('#validation-list'),
  exportJson: document.querySelector('#export-json'),
  importJson: document.querySelector('#import-json'),
  resetDraft: document.querySelector('#reset-draft'),
  commercialContact: document.querySelector('#commercial-contact'),
  detailNodeCount: document.querySelector('#detail-node-count'),
  detailCurrentNode: document.querySelector('#detail-current-node'),
  detailChoiceCount: document.querySelector('#detail-choice-count'),
  detailSessionTime: document.querySelector('#detail-session-time'),
}

let model = createPublicSample()
let selectedNodeId = model.startNode
let session = startSession(model)

function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false

    const envelope = JSON.parse(raw)
    if (
      envelope.version !== STORAGE_VERSION ||
      !hasModelShape(envelope.model) ||
      validateDraft(envelope.model).some((item) => item.severity === 'error')
    ) {
      return false
    }

    model = envelope.model
    selectedNodeId = model.startNode
    session = startSession(model)
    elements.draftStatus.textContent = 'このブラウザの下書きを復元しました'
    return true
  } catch {
    return false
  }
}

function persistDraft() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        savedAt: new Date().toISOString(),
        model,
      }),
    )
    elements.draftStatus.textContent = 'このブラウザに自動保存済み'
  } catch {
    elements.draftStatus.textContent = 'このブラウザでは保存できませんでした'
  }
}

function showTransferStatus(message, tone = 'neutral') {
  elements.transferStatus.textContent = message
  elements.transferStatus.dataset.tone = tone
}

function createParagraphs(text) {
  const fragment = document.createDocumentFragment()
  for (const paragraph of text.split(/\n\s*\n/)) {
    const element = document.createElement('p')
    element.textContent = paragraph.trim()
    fragment.append(element)
  }
  return fragment
}

function renderExperience() {
  const node = model.nodes[session.nodeId]
  elements.storyText.replaceChildren()
  elements.storyChoices.replaceChildren()

  if (!node) {
    elements.storySpeaker.textContent = '読み込みエラー'
    elements.storyText.append(createParagraphs('現在のノードがモデルに見つかりません。'))
    elements.playStatus.textContent = 'JSONの遷移先を確認してください。'
    return
  }

  elements.storySpeaker.textContent = node.speaker || 'Narrator'
  const resolved = resolveNarrativeDisplayText(node.text ?? '', model, session)
  elements.storyText.append(createParagraphs(resolved))

  const choices = getAvailableChoices(session, model)
  for (const choice of choices) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'story-choice'
    button.textContent = choice.text
    button.addEventListener('click', () => {
      try {
        session = applyChoice(session, model, choice.id)
        selectedNodeId = session.nodeId
        renderAll()
        elements.playStatus.textContent = '選択を反映しました。'
      } catch (error) {
        elements.playStatus.textContent = error instanceof Error ? error.message : String(error)
      }
    })
    elements.storyChoices.append(button)
  }

  if (choices.length === 0) {
    const ending = document.createElement('p')
    ending.className = 'story-ending'
    ending.textContent = 'このルートはここまでです。最初から別の選択を試せます。'
    elements.storyChoices.append(ending)
  }

  elements.detailNodeCount.textContent = String(Object.keys(model.nodes).length)
  elements.detailCurrentNode.textContent = session.nodeId
  elements.detailChoiceCount.textContent = String(choices.length)
  elements.detailSessionTime.textContent = String(session.time)
}

function nodeLabel(node, nodeId) {
  const firstLine = (node.text ?? '').split('\n')[0].trim()
  if (node.speaker) return node.speaker
  if (firstLine) return firstLine.slice(0, 18)
  return nodeId
}

function renderNodeList() {
  elements.nodeList.replaceChildren()

  for (const [nodeId, node] of Object.entries(model.nodes)) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'node-list-item'
    button.dataset.nodeId = nodeId
    button.setAttribute('aria-pressed', String(nodeId === selectedNodeId))

    const title = document.createElement('strong')
    title.textContent = nodeLabel(node, nodeId)
    const id = document.createElement('span')
    id.textContent = nodeId
    button.append(title, id)

    button.addEventListener('click', () => {
      selectedNodeId = nodeId
      renderNodeList()
      renderEditor()
    })
    elements.nodeList.append(button)
  }
}

function renderEditor() {
  const node = model.nodes[selectedNodeId]
  elements.choiceEditor.replaceChildren()

  if (!node) {
    elements.nodeText.value = ''
    elements.nodeText.disabled = true
    return
  }

  elements.nodeText.disabled = false
  elements.nodeText.value = node.text ?? ''

  for (const [index, choice] of (node.choices ?? []).entries()) {
    const fieldset = document.createElement('fieldset')
    fieldset.className = 'choice-row'
    fieldset.dataset.choiceIndex = String(index)

    const legend = document.createElement('legend')
    legend.textContent = `選択肢 ${index + 1}`

    const textLabel = document.createElement('label')
    textLabel.textContent = '表示文'
    const textInput = document.createElement('input')
    textInput.type = 'text'
    textInput.value = choice.text ?? ''
    textInput.dataset.field = 'choice-text'
    textInput.addEventListener('input', () => {
      choice.text = textInput.value
      persistDraft()
      renderExperience()
      renderValidation()
    })
    textLabel.append(textInput)

    const targetLabel = document.createElement('label')
    targetLabel.textContent = '遷移先'
    const targetSelect = document.createElement('select')
    targetSelect.dataset.field = 'choice-target'
    for (const targetId of Object.keys(model.nodes)) {
      const option = document.createElement('option')
      option.value = targetId
      option.textContent = targetId
      option.selected = targetId === choice.target
      targetSelect.append(option)
    }
    targetSelect.addEventListener('change', () => {
      choice.target = targetSelect.value
      persistDraft()
      renderExperience()
      renderValidation()
    })
    targetLabel.append(targetSelect)

    fieldset.append(legend, textLabel, targetLabel)
    elements.choiceEditor.append(fieldset)
  }

  if ((node.choices ?? []).length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty-editor'
    empty.textContent = 'このノードは終端です。選択肢はありません。'
    elements.choiceEditor.append(empty)
  }
}

function renderValidation() {
  const issues = validateDraft(model)
  const counts = validationCounts(issues)
  elements.validationList.replaceChildren()

  if (counts.error === 0 && counts.warning === 0) {
    elements.validationSummary.textContent = '再生を止める問題はありません'
    elements.validationSummary.dataset.tone = 'success'
  } else {
    elements.validationSummary.textContent = `エラー ${counts.error}件・注意 ${counts.warning}件`
    elements.validationSummary.dataset.tone = counts.error > 0 ? 'error' : 'warning'
  }

  for (const item of issues.slice(0, 8)) {
    const listItem = document.createElement('li')
    listItem.dataset.severity = item.severity
    listItem.textContent = item.message
    elements.validationList.append(listItem)
  }

  if (issues.length === 0) {
    const listItem = document.createElement('li')
    listItem.dataset.severity = 'success'
    listItem.textContent = '開始ノードと遷移先を確認しました。'
    elements.validationList.append(listItem)
  }
}

function renderAll() {
  renderExperience()
  renderNodeList()
  renderEditor()
  renderValidation()
}

function resetPreview(nodeId = model.startNode) {
  session = startSession(model, { nodeId })
  selectedNodeId = nodeId
  renderAll()
  elements.playStatus.textContent = nodeId === model.startNode ? '物語を最初から表示しました。' : '選んだノードを表示しました。'
}

function exportModel() {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'narrativegen-public-studio-draft.json'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  showTransferStatus('JSONを書き出しました。', 'success')
}

async function importModel(file) {
  try {
    const parsed = JSON.parse(await file.text())
    const issues = validateDraft(parsed)
    if (issues.some((item) => item.severity === 'error')) {
      throw new Error('開始ノード、本文、または遷移先にエラーがあります。')
    }

    model = cloneValue(parsed)
    selectedNodeId = model.startNode
    session = startSession(model)
    persistDraft()
    renderAll()
    showTransferStatus('JSONを読み込み、プレビューを更新しました。', 'success')
  } catch (error) {
    showTransferStatus(error instanceof Error ? error.message : 'JSONを読み込めませんでした。', 'error')
  } finally {
    elements.importJson.value = ''
  }
}

function configureCommercialContact() {
  const configured = (import.meta.env.VITE_PUBLIC_STUDIO_CONTACT_URL ?? '').trim()
  if (!configured) return

  try {
    const url = new URL(configured)
    if (url.protocol !== 'https:') return
    elements.commercialContact.href = url.toString()
    elements.commercialContact.hidden = false
  } catch {
    elements.commercialContact.hidden = true
  }
}

elements.nodeText.addEventListener('input', () => {
  const node = model.nodes[selectedNodeId]
  if (!node) return
  node.text = elements.nodeText.value
  persistDraft()
  renderExperience()
  renderNodeList()
  renderValidation()
})

elements.restartPreview.addEventListener('click', () => resetPreview())
elements.previewSelected.addEventListener('click', () => resetPreview(selectedNodeId))
elements.refreshValidation.addEventListener('click', renderValidation)
elements.exportJson.addEventListener('click', exportModel)
elements.importJson.addEventListener('change', () => {
  const file = elements.importJson.files?.[0]
  if (file) importModel(file)
})
elements.resetDraft.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY)
  model = createPublicSample()
  selectedNodeId = model.startNode
  session = startSession(model)
  elements.draftStatus.textContent = 'サンプルへ戻しました。新しい編集から自動保存します'
  showTransferStatus('正本サンプルの公開用コピーへ戻しました。')
  renderAll()
})

restoreDraft()
configureCommercialContact()
renderAll()
