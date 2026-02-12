// Error handling and logging
import { startSession, getAvailableChoices, applyChoice, chooseParaphrase, GameSession } from '@narrativegen/engine-ts/dist/browser.js'
import { initStory, appendStoryFromCurrentNode, renderStoryEnhanced } from './handlers/story-handler.js'
import { exportModelToCsv } from './utils/csv-exporter.js'
import { initNodesPanel } from './handlers/nodes-panel.js'
import { initTabs } from './handlers/tabs.js'
import { initGuiEditor } from './handlers/gui-editor.js'
import { initGraphHandler } from './handlers/graph-handler.js'
import { initDebugHandler } from './handlers/debug-handler.js'
import { initCsvImportHandler } from './handlers/csv-import-handler.js'
import { initAiConfig } from './handlers/ai-config.js'
import { initSplitView } from './handlers/split-view.js'
import { validateModel } from './utils/model-utils.js'
import { parseConditions, parseEffects } from './utils/csv-parser.js'

// Browser-compatible model loading (no fs module)
async function loadModel(modelName) {
  const url = `./models/examples/${modelName}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load model: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console[level === 'error' ? 'error' : 'log'](`[${timestamp}] ${level.toUpperCase()}: ${message}`, data)

    // Store in sessionStorage for debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('narrativeGenLogs') || '[]')
      logs.push(logEntry)
      // Keep only last 100 entries
      if (logs.length > 100) logs.shift()
      sessionStorage.setItem('narrativeGenLogs', JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to store log:', error)
    }
  }

  static info(message, data) { this.log('info', message, data) }
  static warn(message, data) { this.log('warn', message, data) }
  static error(message, data) { this.log('error', message, data) }
}

// Error boundary for UI operations
class ErrorBoundary {
  static wrap(operation, fallbackMessage = '操作に失敗しました') {
    return async (...args) => {
      try {
        Logger.info('Operation started', { operation: operation.name, args: args.length })
        const result = await operation.apply(this, args)
        Logger.info('Operation completed', { operation: operation.name })
        return result
      } catch (error) {
        Logger.error('Operation failed', {
          operation: operation.name,
          error: error.message,
          stack: error.stack,
          args: args.length
        })
        setStatus(`${fallbackMessage}: ${error.message}`, 'error')
        throw error
      }
    }
  }
}

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
const editBtn = document.getElementById('editBtn')
const guiEditMode = document.getElementById('guiEditMode')
const nodeList = document.getElementById('nodeList')
const addNodeBtn = document.getElementById('addNodeBtn')
const previewBtn = document.getElementById('previewBtn')
const downloadBtn = document.getElementById('downloadBtn')
const saveGuiBtn = document.getElementById('saveGuiBtn')
const cancelGuiBtn = document.getElementById('cancelGuiBtn')
const storyView = document.getElementById('storyView')
const errorPanel = document.getElementById('errorPanel')
const errorList = document.getElementById('errorList')
const csvPreviewModal = document.getElementById('csvPreviewModal')
const csvFileName = document.getElementById('csvFileName')
const csvPreviewContent = document.getElementById('csvPreviewContent')
const confirmImportBtn = document.getElementById('confirmImportBtn')
const cancelPreviewBtn = document.getElementById('cancelPreviewBtn')

// Tab elements
const storyTab = document.getElementById('storyTab')
const debugTab = document.getElementById('debugTab')
const graphTab = document.getElementById('graphTab')
const aiTab = document.getElementById('aiTab')
const storyPanel = document.getElementById('storyPanel')
const debugPanel = document.getElementById('debugPanel')
const graphPanel = document.getElementById('graphPanel')
const aiPanel = document.getElementById('aiPanel')

// Additional tab elements
const nodeListTab = document.getElementById('nodeListTab')
const nodeListPanel = document.getElementById('nodeListPanel')

// Node list elements
const nodeSearch = document.getElementById('nodeSearch')
const refreshNodeList = document.getElementById('refreshNodeList')
const nodeOverview = document.getElementById('nodeOverview')

// Split view elements (story panel inline split view)
const toggleSplitViewBtn = document.getElementById('toggleSplitViewBtn')
const storyMainContainer = document.getElementById('storyMainContainer')
const storyResizer = document.getElementById('storyResizer')
const storyJsonPanel = document.getElementById('storyJsonPanel')
const storyJsonEditor = document.getElementById('storyJsonEditor')
const applyStoryJsonBtn = document.getElementById('applyStoryJsonBtn')

// Graph elements
const graphSvg = document.getElementById('graphSvg')
const zoomInBtn = document.getElementById('zoomInBtn')
const zoomOutBtn = document.getElementById('zoomOutBtn')
const resetViewBtn = document.getElementById('resetViewBtn')

let highlightedNodes = new Set()

// Debug elements
const flagsDisplay = document.getElementById('flagsDisplay')
const resourcesDisplay = document.getElementById('resourcesDisplay')
const reachableNodes = document.getElementById('reachableNodes')

// AI elements
const aiProvider = document.getElementById('aiProvider')
const openaiSettings = document.getElementById('openaiSettings')
const openaiApiKey = document.getElementById('openaiApiKey')
const openaiModel = document.getElementById('openaiModel')
const saveAiSettings = document.getElementById('saveAiSettings')
const generateNextNodeBtn = document.getElementById('generateNextNodeBtn')
const paraphraseCurrentBtn = document.getElementById('paraphraseCurrentBtn')
const aiOutput = document.getElementById('aiOutput')
const aiHistoryList = document.getElementById('aiHistoryList')

let session = null
let currentModelName = null
let _model = null
let storyLog = []

// Model and session accessors
function getModel() {
  return _model
}

function setModel(newModel) {
  _model = newModel
}

function getSession() {
  return session
}

function setSession(newSession) {
  session = newSession
}

// Inventory UI elements
const inventoryDisplay = document.getElementById('inventoryDisplay')

// Forward declarations for handler functions (assigned during initialization)
let renderGraph = () => {}
let renderDebugInfo = () => {}
let showCsvPreview = () => {}
let hideCsvPreview = () => {}
let importCsvFile = async () => {}
let initAiProvider = async () => {}

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
  }
  stateView.textContent = JSON.stringify(view, null, 2)

  // Update debug info if debug tab is active
  if (debugPanel.classList.contains('active')) {
    renderDebugInfo()
  }
}

function setStatus(message, type = 'info') {
  statusText.textContent = message
  statusText.className = `status-text ${type}`
}

function showErrors(errors) {
  if (!errors || errors.length === 0) {
    hideErrors()
    return
  }

  errorList.innerHTML = ''
  errors.forEach(error => {
    const li = document.createElement('li')
    li.textContent = error
    errorList.appendChild(li)
  })
  errorPanel.classList.add('show')
}

function hideErrors() {
  errorPanel.classList.remove('show')
}

function setControlsEnabled(enabled) {
  startBtn.disabled = !enabled
  modelSelect.disabled = !enabled
  uploadBtn.disabled = !enabled
  dropZone.style.pointerEvents = enabled ? 'auto' : 'none'
  dropZone.style.opacity = enabled ? '1' : '0.5'
  if (editBtn) editBtn.disabled = !enabled
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
        appendStoryFromCurrentNode(session, _model)
      } catch (err) {
        console.error(err)
        setStatus(`選択肢の適用に失敗しました: ${err?.message ?? err}`, 'warn')
      }
      renderState()
      renderChoices()
      renderStoryEnhanced(storyView)
    })
    list.appendChild(button)
  })

  choicesContainer.appendChild(list)
}

// Apply error boundaries to critical operations
const safeStartSession = ErrorBoundary.wrap(async (modelName) => {
  const model = await loadModel(modelName)
  session = startSession(model)
  currentModelName = modelName
  initStory()
  renderState()
  renderChoices()
  renderStoryEnhanced(storyView)
  Logger.info('Session started', { modelName, nodeCount: Object.keys(model.nodes).length })
})

const safeApplyChoice = ErrorBoundary.wrap(async (choiceId) => {
  if (!session || !_model) throw new Error('セッションが開始されていません')
  session = applyChoice(session, _model, choiceId)
  appendStoryFromCurrentNode(session, _model)
  renderState()
  renderChoices()
  renderStoryEnhanced(storyView)
  Logger.info('Choice applied', { choiceId, newNodeId: session.nodeId })
})

const safeImportCsv = ErrorBoundary.wrap(async (file) => {
  await importCsvFile(file)
  Logger.info('CSV imported', { fileName: file.name, fileSize: file.size })
})

const safeGenerateNode = ErrorBoundary.wrap(async () => {
  await generateNextNode()
  Logger.info('Node generated via AI')
})

const safeParaphrase = ErrorBoundary.wrap(async () => {
  await paraphraseCurrentText()
  Logger.info('Text paraphrased via AI')
})

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
  // Use fetch with relative path for local models directory
  const url = `./models/examples/${sampleId}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`モデルの読み込みに失敗しました (${response.status})`)
  }
  return response.json()
}

async function loadEntitiesCatalog() {
  // Use fetch with relative path for local models directory
  const url = './models/entities/Entities.csv'
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

    setModel(model)
    setSession(new GameSession(model, { entities }))
    currentModelName = sampleId
    setStatus(`サンプル ${sampleId} を実行中`, 'success')
    initStory(getSession(), getModel())
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    setStatus(`サンプルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStoryEnhanced(storyView)
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

    setModel(model)
    setSession(new GameSession(model, { entities }))
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
    renderStoryEnhanced(storyView)
  }
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

    // Validate model
    const validationErrors = validateModel(model.nodes)
    if (validationErrors.length > 0) {
      showErrors(validationErrors)
      setStatus(`モデルにエラーがあります: ${validationErrors.length}件`, 'warn')
      return
    }

    hideErrors()
    setModel(model)
    setSession(new GameSession(model, { entities }))
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory(getSession(), getModel())
  } catch (err) {
    console.error(err)
    showErrors([err?.message ?? err])
    session = null
    currentModelName = null
    setStatus(`ファイルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStoryEnhanced(storyView)
  }
})

applyStoryJsonBtn.addEventListener('click', () => {
  try {
    const jsonText = storyJsonEditor.value.trim()
    if (!jsonText) {
      setStatus('JSONが空です', 'warn')
      return
    }

    const newModel = JSON.parse(jsonText)

    // Basic validation
    if (!newModel.nodes || typeof newModel.nodes !== 'object') {
      throw new Error('有効なnodesオブジェクトが必要です')
    }

    // Validate model structure
    const validationErrors = validateModel(newModel.nodes)
    if (validationErrors.length > 0) {
      showErrors(validationErrors)
      setStatus(`JSONにエラーがあります: ${validationErrors.length}件`, 'warn')
      return
    }

    hideErrors()
    setModel(newModel)
    setSession(startSession(getModel()))
    currentModelName = 'json-edited'
    setStatus('JSONを適用しました', 'success')

    // Update all views
    renderState()
    renderChoices()
    initStory(getSession(), getModel())
    renderStoryEnhanced(storyView)
    if (graphPanel.classList.contains('active')) {
      renderGraph()
    }
  } catch (err) {
    console.error('JSON parse error:', err)
    showErrors([err?.message ?? 'JSONパースエラー'])
    setStatus(`JSON適用に失敗しました: ${err?.message ?? err}`, 'warn')
  }
})

nodeOverview.addEventListener('click', (e) => {
  const action = e.target.dataset.action
  if (action === 'switch-tab') {
    const tab = e.target.dataset.tab
    const nodeId = e.target.dataset.nodeId
    switchTab(tab)
    if (tab === 'graph') {
      renderGraph()
      if (nodesPanel && nodesPanel.highlightNode) {
        nodesPanel.highlightNode(nodeId)
      } else if (window.highlightNode) {
        window.highlightNode(nodeId)
      }
    } else if (tab === 'story') {
      jumpToNode(nodeId)
    }
    guiEditor.renderNodeList()
  }
})

previewBtn.addEventListener('click', () => {
  if (!getModel()) return
  let current = getModel().startNode
  let story = ''
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = getModel().nodes[current]
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
  if (!getModel()) return
  const json = JSON.stringify(getModel(), null, 2)
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
// Note: initStory, appendStoryFromCurrentNode, renderStory are now imported from story-handler.js

// CSVプレビューモーダル
confirmImportBtn.addEventListener('click', async () => {
  const file = csvFileInput.files[0]
  if (!file) return
  hideCsvPreview()
  await importCsvFile(file)
})

// トップレベルのプレビュー/ダウンロード
previewTopBtn.addEventListener('click', () => {
  if (!getModel()) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  let current = getModel().startNode
  let story = ''
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = getModel().nodes[current]
    if (node?.text) story += node.text + '\n\n'
    if (node?.choices?.length === 1) current = node.choices[0].target
    else break
  }
  alert('小説プレビュー:\n\n' + story)
})

downloadTopBtn.addEventListener('click', () => {
  if (!getModel()) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  const json = JSON.stringify(getModel(), null, 2)
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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (guiEditMode.style.display !== 'none') {
      saveGuiBtn.click()
    }
  }
})

// Initialize extracted handlers with dependency injection
const graphHandler = initGraphHandler({
  getModel,
  getSession,
  graphSvg,
  zoomInBtn,
  zoomOutBtn,
  resetViewBtn,
  highlightedNodes,
})
renderGraph = graphHandler.renderGraph
graphHandler.setupGraphControls()

const debugHandler = initDebugHandler({
  getModel,
  getSession,
  flagsDisplay,
  resourcesDisplay,
  inventoryDisplay,
  reachableNodes,
})
renderDebugInfo = debugHandler.renderDebugInfo

const csvImportHandler = initCsvImportHandler({
  getModel,
  setModel,
  getSession,
  setSession,
  setStatus,
  showErrors,
  hideErrors,
  renderState,
  renderChoices,
  initStory,
  renderStoryEnhanced,
  csvPreviewModal,
  csvFileName,
  csvPreviewContent,
  storyView,
})
showCsvPreview = csvImportHandler.showCsvPreview
hideCsvPreview = csvImportHandler.hideCsvPreview
importCsvFile = csvImportHandler.importCsvFile

const aiConfigHandler = initAiConfig({
  getModel,
  getSession,
  setStatus,
  onAdopt: (nodeId, text) => {
    const model = getModel()
    if (!model || !model.nodes[nodeId]) {
      setStatus(`\u30CE\u30FC\u30C9 ${nodeId} \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`, 'warn')
      return
    }
    model.nodes[nodeId].text = text
    setStatus(`\u30CE\u30FC\u30C9 ${nodeId} \u306E\u30C6\u30AD\u30B9\u30C8\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F`, 'success')
    renderState()
    renderStoryEnhanced(storyView)
    if (graphPanel.classList.contains('active')) {
      renderGraph()
    }
  },
  aiProvider,
  openaiSettings,
  openaiApiKey,
  openaiModel,
  saveAiSettings,
  generateNextNodeBtn,
  paraphraseCurrentBtn,
  aiOutput,
  aiHistoryList,
  Logger,
})
initAiProvider = aiConfigHandler.initAiProvider
aiConfigHandler.loadSavedConfig()
aiConfigHandler.setupListeners()

const splitViewHandler = initSplitView({
  getModel,
  toggleSplitViewBtn,
  storyMainContainer,
  storyResizer,
  storyJsonEditor,
})
splitViewHandler.setupListeners()

// Initialize existing handlers
const nodesPanel = initNodesPanel({
  getModel,
  setModel,
  getSession,
  setSession,
  setStatus,
  renderGraph,
  renderState,
  renderChoices,
  initStory,
  renderStoryEnhanced,
  nodeOverview,
  nodeSearch,
  storyView
})

// Setup node list events
nodesPanel.setupNodeListEvents(nodeList)

// Override global jumpToNode function
window.jumpToNode = nodesPanel.jumpToNode

// Override global highlightNode function
window.highlightNode = nodesPanel.highlightNode

const tabs = initTabs({
  renderGraph,
  renderDebugInfo,
  renderNodeOverview: nodesPanel.renderNodeOverview,
  initAiProvider,
  storyTab,
  debugTab,
  graphTab,
  nodeListTab,
  aiTab,
  storyPanel,
  debugPanel,
  graphPanel,
  nodeListPanel,
  aiPanel
})

// Initialize tabs
tabs.initialize()

const guiEditor = initGuiEditor({
  getModel,
  setModel,
  getSession,
  setSession,
  setStatus,
  setControlsEnabled,
  renderState,
  renderChoices,
  initStory,
  renderStoryEnhanced,
  // DOM references
  guiEditMode,
  guiEditor: nodeList,
  addNodeBtn,
  previewBtn,
  downloadBtn,
  saveGuiBtn,
  cancelGuiBtn,
  storyView,
  chooseParaphrase,
  parseConditions,
  parseEffects
})

// Set guiEditor reference in nodesPanel
nodesPanel.setGuiEditor(guiEditor);

// Setup GUI editor buttons
if (editBtn) {
  editBtn.addEventListener('click', () => guiEditor.startEditing())
}
saveGuiBtn.addEventListener('click', () => guiEditor.saveEditing())
cancelGuiBtn.addEventListener('click', () => guiEditor.cancelEditing())

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
