import { startSession, getAvailableChoices, applyChoice, chooseParaphrase } from '@narrativegen/engine-ts/dist/browser.js'

const startBtn = document.getElementById('startBtn')
const choicesContainer = document.getElementById('choices')
const stateView = document.getElementById('stateView')
const statusText = document.getElementById('statusText')
const modelSelect = document.getElementById('modelSelect')
const fileInput = document.getElementById('fileInput')
const uploadBtn = document.getElementById('uploadBtn')
const dropZone = document.getElementById('dropZone')
const previewTopBtn = document.getElementById('previewTopBtn')
const downloadTopBtn = document.getElementById('downloadTopBtn')
const importCsvBtn = document.getElementById('importCsvBtn')
const csvFileInput = document.getElementById('csvFileInput')
const exportCsvBtn = document.getElementById('exportCsvBtn')
const guiEditBtn = document.getElementById('editBtn')
const guiEditMode = document.getElementById('guiEditMode')
const nodeList = document.getElementById('nodeList')
const addNodeBtn = document.getElementById('addNodeBtn')
const previewBtn = document.getElementById('previewBtn')
const downloadBtn = document.getElementById('downloadBtn')
const saveGuiBtn = document.getElementById('saveGuiBtn')
const cancelGuiBtn = document.getElementById('cancelGuiBtn')
const storyView = document.getElementById('storyView')

let session = null
let currentModelName = null
let _model = null
let storyLog = []

function renderState() {
  if (!session) {
    stateView.textContent = JSON.stringify({ status: 'サンプル未実行' }, null, 2)
    return
  }

  const snapshot = session
  const view = {
    model: currentModelName,
    nodeId: snapshot.nodeId,
    time: snapshot.time,
    flags: snapshot.flags,
    resources: snapshot.resources,
  }
  stateView.textContent = JSON.stringify(view, null, 2)
}

function setStatus(message, type = 'info') {
  statusText.textContent = message
  statusText.dataset.type = type
}

function setControlsEnabled(enabled) {
  startBtn.disabled = !enabled
  modelSelect.disabled = !enabled
  uploadBtn.disabled = !enabled
  dropZone.style.pointerEvents = enabled ? 'auto' : 'none'
  dropZone.style.opacity = enabled ? '1' : '0.5'
  guiEditBtn.disabled = !enabled
}

function renderChoices() {
  choicesContainer.innerHTML = ''

  if (!session) {
    const info = document.createElement('p')
    info.textContent = 'セッションを開始すると選択肢が表示されます'
    choicesContainer.appendChild(info)
    return
  }

  const choices = getAvailableChoices(session, _model)
  if (!choices || choices.length === 0) {
    const empty = document.createElement('p')
    empty.textContent = '利用可能な選択肢はありません'
    choicesContainer.appendChild(empty)
    return
  }

  const list = document.createElement('div')
  list.style.display = 'flex'
  list.style.flexDirection = 'column'
  list.style.gap = '0.5rem'

  choices.forEach((choice) => {
    const button = document.createElement('button')
    button.textContent = formatChoiceLabel(choice)
    button.addEventListener('click', () => {
      try {
        session = applyChoice(session, _model, choice.id)
        setStatus(`選択肢「${choice.text}」を適用しました`, 'success')
        appendStoryFromCurrentNode()
      } catch (err) {
        console.error(err)
        setStatus(`選択肢の適用に失敗しました: ${err?.message ?? err}`, 'warn')
      }
      renderState()
      renderChoices()
      renderStory()
    })
    list.appendChild(button)
  })

  choicesContainer.appendChild(list)
}

function formatChoiceLabel(choice) {
  if (choice?.outcome) {
    return `${choice.text} (${choice.outcome.type}: ${choice.outcome.value})`
  }
  return choice?.text ?? '(不明な選択肢)'
}

async function loadCustomModel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        resolve(json)
      } catch (err) {
        reject(new Error('JSON の解析に失敗しました'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}

async function loadSampleModel(sampleId) {
  const url = new URL(`../../models/examples/${sampleId}.json`, import.meta.url)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`モデルの読み込みに失敗しました (${response.status})`)
  }
  return response.json()
}

async function loadEntitiesCatalog() {
  const url = new URL('../../models/entities/Entities.csv', import.meta.url)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Entities.csv の読み込みに失敗しました (${response.status})`)
  }
  const text = await response.text()
  return parseEntitiesCsv(text)
}

function parseEntitiesCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length <= 1) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = {
    id: headers.indexOf('id'),
    brand: headers.indexOf('brand'),
    description: headers.indexOf('description'),
    cost: headers.indexOf('cost'),
  }

  return lines.slice(1)
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((cells) => cells[idx.id])
    .map((cells) => ({
      id: cells[idx.id] ?? '',
      brand: cells[idx.brand] ?? '',
      description: cells[idx.description] ?? '',
      cost: Number.parseFloat(cells[idx.cost] ?? '0') || 0,
    }))
}

startBtn.addEventListener('click', async () => {
  const sampleId = modelSelect.value
  setControlsEnabled(false)
  setStatus(`サンプル ${sampleId} を読み込み中...`)

  try {
    const [model, entities] = await Promise.all([
      loadSampleModel(sampleId),
      loadEntitiesCatalog(),
    ])

    _model = model
    session = startSession(_model)
    currentModelName = sampleId
    setStatus(`サンプル ${sampleId} を実行中`, 'success')
    initStory()
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    setStatus(`サンプルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStory()
  }
})

uploadBtn.addEventListener('click', () => {
  fileInput.click()
})

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setControlsEnabled(false)
  setStatus(`ファイル ${file.name} を読み込み中...`)

  try {
    const [model, entities] = await Promise.all([
      loadCustomModel(file),
      loadEntitiesCatalog(),
    ])

    _model = model
    session = startSession(_model)
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    setStatus(`ファイルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
  }
})

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropZone.style.backgroundColor = '#e0e0e0'
})

dropZone.addEventListener('dragleave', () => {
  dropZone.style.backgroundColor = ''
})

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault()
  dropZone.style.backgroundColor = ''
  const file = e.dataTransfer.files[0]
  if (!file || !file.name.endsWith('.json')) {
    setStatus('JSON ファイルをドロップしてください', 'warn')
    return
  }
  setControlsEnabled(false)
  setStatus(`ファイル ${file.name} を読み込み中...`)

  try {
    const [model, entities] = await Promise.all([
      loadCustomModel(file),
      loadEntitiesCatalog(),
    ])

    _model = model
    session = startSession(_model)
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    setStatus(`ファイルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStory()
  }
})

setStatus('サンプルを選択して「サンプルを実行」を押してください')
renderState()
renderChoices()
renderStory()

guiEditBtn.addEventListener('click', () => {
  if (session == null) {
    setStatus('GUI編集するにはまずモデルを読み込んでください', 'warn')
    return
  }
  renderNodeList()
  guiEditMode.style.display = 'block'
  setControlsEnabled(false)
})

function renderNodeList() {
  nodeList.innerHTML = ''
  for (const [nodeId, node] of Object.entries(_model.nodes)) {
    const nodeDiv = document.createElement('div')
    nodeDiv.className = 'node-editor'
    nodeDiv.innerHTML = `
      <h3>ノード: ${nodeId}</h3>
      <label>テキスト: <input type="text" value="${node.text || ''}" data-node-id="${nodeId}" data-field="text"></label>
      <h4>選択肢</h4>
      <div class="choices-editor" data-node-id="${nodeId}"></div>
      <button class="add-choice-btn" data-node-id="${nodeId}">選択肢を追加</button>
      <button class="delete-node-btn" data-node-id="${nodeId}">ノードを削除</button>
    `
    nodeList.appendChild(nodeDiv)
    renderChoicesForNode(nodeId)
  }
}

function renderChoicesForNode(nodeId) {
  const node = _model.nodes[nodeId]
  const choicesDiv = nodeList.querySelector(`.choices-editor[data-node-id="${nodeId}"]`)
  choicesDiv.innerHTML = ''
  node.choices?.forEach((choice, index) => {
    const choiceDiv = document.createElement('div')
    choiceDiv.className = 'choice-editor'
    choiceDiv.innerHTML = `
      <label>テキスト: <input type="text" value="${choice.text}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="text"></label>
      <label>ターゲット: <input type="text" value="${choice.target}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="target"></label>
      <button class="paraphrase-btn" data-node-id="${nodeId}" data-choice-index="${index}">言い換え</button>
      <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${index}">削除</button>
    `
    choicesDiv.appendChild(choiceDiv)
  })
}

addNodeBtn.addEventListener('click', () => {
  const nodeId = prompt('新しいノードIDを入力してください:')
  if (nodeId && !_model.nodes[nodeId]) {
    _model.nodes[nodeId] = { id: nodeId, text: '新しいノード', choices: [] }
    renderNodeList()
  }
})

previewBtn.addEventListener('click', () => {
  if (!_model) return
  let current = _model.startNode
  let story = ''
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = _model.nodes[current]
    if (node?.text) story += node.text + '\n\n'
    if (node?.choices?.length === 1) {
      current = node.choices[0].target
    } else {
      break
    }
  }
  alert('小説プレビュー:\n\n' + story)
})

downloadBtn.addEventListener('click', () => {
  if (!_model) return
  const json = JSON.stringify(_model, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'model.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
})

// Story log helpers
function initStory() {
  storyLog = []
  appendStoryFromCurrentNode()
}

function appendStoryFromCurrentNode() {
  const node = _model?.nodes?.[session?.nodeId]
  if (node?.text) {
    storyLog.push(node.text)
  }
}

function renderStory() {
  if (!storyView) return
  storyView.textContent = storyLog.join('\n\n')
}

// CSV / TSV import/export
importCsvBtn.addEventListener('click', () => csvFileInput.click())

csvFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const delim = file.name.endsWith('.tsv') || text.includes('\t') ? '\t' : ','
    const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (rows.length === 0) throw new Error('空のファイルです')
    const headers = rows[0].split(delim).map((h) => h.trim())
    const idx = {
      node_id: headers.indexOf('node_id'),
      node_text: headers.indexOf('node_text'),
      choice_id: headers.indexOf('choice_id'),
      choice_text: headers.indexOf('choice_text'),
      choice_target: headers.indexOf('choice_target'),
    }
    const nodes = {}
    for (const line of rows.slice(1)) {
      const cells = line.split(delim)
      const nid = (cells[idx.node_id] || '').trim()
      if (!nid) continue
      if (!nodes[nid]) nodes[nid] = { id: nid, text: '', choices: [] }
      const ntext = (cells[idx.node_text] || '').trim()
      if (ntext) nodes[nid].text = ntext
      const cid = (cells[idx.choice_id] || '').trim()
      const ctext = (cells[idx.choice_text] || '').trim()
      const ctgt = (cells[idx.choice_target] || '').trim()
      if (ctgt || ctext || cid) {
        nodes[nid].choices.push({ id: cid || `c${nodes[nid].choices.length + 1}`, text: ctext || '', target: ctgt || nid })
      }
    }
    const firstNode = Object.keys(nodes)[0]
    _model = { modelType: 'adventure-playthrough', startNode: firstNode, nodes }
    session = startSession(_model)
    currentModelName = file.name
    setStatus('CSV を読み込みました', 'success')
    initStory()
    renderState()
    renderChoices()
    renderStory()
  } catch (err) {
    console.error(err)
    setStatus(`CSV 読み込みに失敗: ${err?.message ?? err}`, 'warn')
  }
})

exportCsvBtn.addEventListener('click', () => {
  if (!_model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  const header = ['node_id','node_text','choice_id','choice_text','choice_target']
  const rows = [header.join(',')]
  for (const [nid, node] of Object.entries(_model.nodes)) {
    if (!node.choices || node.choices.length === 0) {
      rows.push([nid, escapeCsv(node.text ?? ''), '', '', ''].join(','))
      continue
    }
    for (const ch of node.choices) {
      rows.push([nid, escapeCsv(node.text ?? ''), ch.id ?? '', escapeCsv(ch.text ?? ''), ch.target ?? ''].join(','))
    }
  }
  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (currentModelName ? currentModelName.replace(/\.[^.]+$/, '') : 'model') + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
})

function escapeCsv(s) {
  if (s == null) return ''
  const needsQuote = /[",\n]/.test(s)
  const t = String(s).replace(/"/g, '""')
  return needsQuote ? '"' + t + '"' : t
}

saveGuiBtn.addEventListener('click', () => {
  try {
    session = startSession(_model)
    currentModelName = 'gui-edited'
    guiEditMode.style.display = 'none'
    setStatus('GUI編集を保存しました', 'success')
    setControlsEnabled(true)
    renderState()
    renderChoices()
    initStory()
    renderStory()
  } catch (err) {
    setStatus(`GUI保存に失敗しました: ${err?.message ?? err}`, 'warn')
  }
})

cancelGuiBtn.addEventListener('click', () => {
  guiEditMode.style.display = 'none'
  setControlsEnabled(true)
})

// 言い換えイベント（非AI）
nodeList.addEventListener('click', (e) => {
  if (e.target.classList.contains('paraphrase-btn')) {
    const nodeId = e.target.dataset.nodeId
    const choiceIndex = e.target.dataset.choiceIndex
    const input = nodeList.querySelector(
      `input[data-node-id="${nodeId}"][data-choice-index="${choiceIndex}"][data-field="text"]`,
    )
    if (!input) return
    try {
      input.value = chooseParaphrase(input.value, { style: 'desu-masu' })
    } catch (err) {
      console.error('言い換えエラー:', err)
      setStatus(`言い換えに失敗しました: ${err?.message ?? err}`, 'warn')
    }
  }
})

// トップレベルのプレビュー/ダウンロード
previewTopBtn.addEventListener('click', () => {
  if (!_model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  let current = _model.startNode
  let story = ''
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = _model.nodes[current]
    if (node?.text) story += node.text + '\n\n'
    if (node?.choices?.length === 1) current = node.choices[0].target
    else break
  }
  alert('小説プレビュー:\n\n' + story)
})

downloadTopBtn.addEventListener('click', () => {
  if (!_model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  const json = JSON.stringify(_model, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = currentModelName ? `${currentModelName}.json` : 'model.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
})
