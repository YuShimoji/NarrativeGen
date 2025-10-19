import { GameSession } from '@narrativegen/engine-ts/dist/game-session.js'
import { loadModel } from '@narrativegen/engine-ts/dist/index.js'

const startBtn = document.getElementById('startBtn')
const choicesContainer = document.getElementById('choices')
const stateView = document.getElementById('stateView')
const statusText = document.getElementById('statusText')
const modelSelect = document.getElementById('modelSelect')
const fileInput = document.getElementById('fileInput')
const uploadBtn = document.getElementById('uploadBtn')
const dropZone = document.getElementById('dropZone')
const guiEditBtn = document.getElementById('editBtn')
const editMode = document.getElementById('editMode')
const jsonEditor = document.getElementById('jsonEditor')
const saveBtn = document.getElementById('saveBtn')
const cancelBtn = document.getElementById('cancelBtn')
const guiEditMode = document.getElementById('guiEditMode')
const nodeList = document.getElementById('nodeList')
const addNodeBtn = document.getElementById('addNodeBtn')
const previewBtn = document.getElementById('previewBtn')
const downloadBtn = document.getElementById('downloadBtn')
const saveGuiBtn = document.getElementById('saveGuiBtn')
const cancelGuiBtn = document.getElementById('cancelGuiBtn')

let session = null
let currentModelName = null
let _model = null

function renderState() {
  if (!session) {
    stateView.textContent = JSON.stringify({ status: 'サンプル未実行' }, null, 2)
    return
  }

  const snapshot = session.state
  const view = {
    model: currentModelName,
    nodeId: snapshot.nodeId,
    time: snapshot.time,
    flags: snapshot.flags,
    resources: snapshot.resources,
    inventory: session.listInventory(),
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

  const choices = session.getAvailableChoices()
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
        session.applyChoice(choice.id)
        setStatus(`選択肢「${choice.text}」を適用しました`, 'success')
      } catch (err) {
        console.error(err)
        setStatus(`選択肢の適用に失敗しました: ${err?.message ?? err}`, 'warn')
      }
      renderState()
      renderChoices()
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
    session = new GameSession(model, {
      entities,
      initialInventory: [],
    })
    currentModelName = sampleId
    setStatus(`サンプル ${sampleId} を実行中`, 'success')
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    setStatus(`サンプルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
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
    session = new GameSession(model, {
      entities,
      initialInventory: [],
    })
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
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
    session = new GameSession(model, {
      entities,
      initialInventory: [],
    })
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
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

setStatus('サンプルを選択して「サンプルを実行」を押してください')
renderState()
renderChoices()

editBtn.addEventListener('click', () => {
  if (session == null) {
    setStatus('編集するにはまずモデルを読み込んでください', 'warn')
    return
  }
  jsonEditor.value = JSON.stringify(_model, null, 2)
  editMode.style.display = 'block'
  setControlsEnabled(false)
})

saveBtn.addEventListener('click', () => {
  try {
    const newModel = JSON.parse(jsonEditor.value)
    // ここで loadModel を呼び、検証
    _model = loadModel(newModel) // loadModel は import が必要
    session = new GameSession(_model, { entities: [], initialInventory: [] })
    currentModelName = 'edited'
    editMode.style.display = 'none'
    setStatus('モデルを保存しました', 'success')
    setControlsEnabled(true)
    renderState()
    renderChoices()
  } catch (err) {
    setStatus(`モデル保存に失敗しました: ${err?.message ?? err}`, 'warn')
  }
})

cancelBtn.addEventListener('click', () => {
  editMode.style.display = 'none'
  setControlsEnabled(true)
})

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
      <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${index}">削除</button>
    `
    choicesDiv.appendChild(choiceDiv)
  })
}

addNodeBtn.addEventListener('click', () => { const nodeId = prompt('新しいノードIDを入力してください:'); if (nodeId && !_model.nodes[nodeId]) { _model.nodes[nodeId] = { id: nodeId, text: '新しいノード', choices: [] }; renderNodeList(); } }); previewBtn.addEventListener('click', () => { let current = _model.startNode; let story = ''; const visited = new Set(); while (current && !visited.has(current)) { visited.add(current); const node = _model.nodes[current]; if (node?.text) story += node.text + '\n\n'; if (node?.choices?.length === 1) { current = node.choices[0].target; } else { break; } } alert('小説プレビュー:\n\n' + story); }); downloadBtn.addEventListener('click', () => { const json = JSON.stringify(_model, null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'model.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }); saveGuiBtn.addEventListener('click', () => { try { _model = loadModel(_model); session = new GameSession(_model, { entities: [], initialInventory: [] }); currentModelName = 'gui-edited'; guiEditMode.style.display = 'none'; setStatus('GUI編集を保存しました', 'success'); setControlsEnabled(true); renderState(); renderChoices(); } catch (err) { setStatus(`GUI保存に失敗しました: ${err?.message ?? err}`, 'warn'); } }); cancelGuiBtn.addEventListener('click', () => { guiEditMode.style.display = 'none'; setControlsEnabled(true); });
