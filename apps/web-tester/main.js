// Handle potential IDE extension conflicts (e.g., migrationWizard.js errors)
try {
  // Check if we're in an IDE environment that might have conflicting scripts
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Log IDE environment info for debugging (Logger will be available after initialization)
    console.info('Web Tester loaded in IDE environment', {
      userAgent: navigator.userAgent,
      hasMigrationWizard: typeof window.migrationWizard !== 'undefined'
    })
  }
} catch (error) {
  console.warn('IDE environment check failed', { error: error.message })
}

// Import required functions from engine
import {
  createAIProvider,
  startSession,
  getAvailableChoices,
  applyChoice,
  chooseParaphrase,
  paraphraseJa,
  getParaphraseLexicon,
  setParaphraseLexicon,
} from '../../packages/engine-ts/dist/browser.js'

// Import local modules
import { ThemeManager } from './src/ui/theme.js'
import { Toast } from './src/ui/toast.js'
import { AppState } from './src/core/state.js'
import { DOMManager } from './src/ui/dom.js'
import { EventManager } from './src/ui/events.js'
import { StoryManager } from './src/ui/story.js'
import { GraphManager } from './src/ui/graph.js'
import { DebugManager } from './src/ui/debug.js'
import { GuiEditorManager } from './src/ui/gui-editor.js'
import { ReferenceManager } from './src/ui/reference.js'
import { CsvManager } from './src/ui/csv.js'
import { AiManager } from './src/ui/ai.js'
import { LexiconManager } from './src/ui/lexicon.js'
import { validateNotEmpty, validateJson, validateFileExtension } from './src/utils/validation.js'
import { downloadFile, readFileAsText, parseCsv } from './src/utils/file-utils.js'
import { getStorageItem, setStorageItem, removeStorageItem } from './src/utils/storage.js'
import Logger from './src/core/logger.js'
import {
  getCurrentSession,
  getCurrentModelName,
  setCurrentSession,
  setCurrentModelName,
  clearSession,
  startNewSession,
  isSessionActive,
  validateSession,
  saveSessionToStorage,
  loadSessionFromStorage,
  clearSessionFromStorage
} from './src/core/session.js'

// ===========================
// Key binding configuration - extensible and loosely coupled
// ===========================

const KEY_BINDINGS = {
  'inventory': 'z',  // Configurable: can be changed to any key
  'debug': 'd',
  'graph': 'g',
  'story': 's',
  'ai': 'a'
}

// Key binding handler - extensible design
const keyBindingHandlers = {
  'inventory': () => {
    // Placeholder for inventory functionality
    setStatus('インベントリ機能は開発中です', 'info')
    Logger.info('Inventory key pressed')
  },
  
  'debug': () => {
    // Toggle debug panel
    if (debugPanel.classList.contains('active')) {
      debugPanel.classList.remove('active')
      debugTab.classList.remove('active')
    } else {
      debugPanel.classList.add('active')
      debugTab.classList.add('active')
      renderDebugInfo()
    }
    Logger.info('Debug panel toggled')
  },

  'graph': () => {
    // Toggle graph panel
    if (graphPanel.classList.contains('active')) {
      graphPanel.classList.remove('active')
      graphTab.classList.remove('active')
    } else {
      graphPanel.classList.add('active')
      graphTab.classList.add('active')
      renderGraph()
    }
    Logger.info('Graph panel toggled')
  },

  'story': () => {
    // Toggle story panel
    if (storyPanel.classList.contains('active')) {
      storyPanel.classList.remove('active')
      storyTab.classList.remove('active')
    } else {
      storyPanel.classList.add('active')
      storyTab.classList.add('active')
    }
    Logger.info('Story panel toggled')
  },

  'ai': () => {
    // Toggle AI panel
    if (aiPanel.classList.contains('active')) {
      aiPanel.classList.remove('active')
      aiTab.classList.remove('active')
    } else {
      aiPanel.classList.add('active')
      aiTab.classList.add('active')
    }
    Logger.info('AI panel toggled')
  }
}

// Global keyboard event handler
document.addEventListener('keydown', (e) => {
  // Skip if user is typing in an input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return
  }

  const key = e.key.toLowerCase()
  
  // Special handling for Ctrl+S (save) in GUI edit mode
  if (e.ctrlKey && key === 's' && guiEditMode.style.display !== 'none') {
    e.preventDefault()
    saveGuiBtn.click()
    return
  }
  
  // Find matching key binding
  for (const [action, boundKey] of Object.entries(KEY_BINDINGS)) {
    if (key === boundKey.toLowerCase()) {
      e.preventDefault() // Prevent default browser behavior
      const handler = keyBindingHandlers[action]
      if (handler) {
        handler()
      }
      break
    }
  }
})

// Key binding configuration UI (can be added to settings later)
function getKeyBindingInfo() {
  return Object.entries(KEY_BINDINGS)
    .map(([action, key]) => `${action}: ${key.toUpperCase()}`)
    .join(', ')
}

// Display key binding help (can be called from UI)
function showKeyBindingHelp() {
  const helpText = `キーバインド:\n${getKeyBindingInfo()}\n\n入力フィールド内では無効化されます。`
  alert(helpText)
}

// Initialize key binding UI
function initKeyBindingUI() {
  // Load current bindings to UI
  inventoryKey.value = KEY_BINDINGS.inventory
  debugKey.value = KEY_BINDINGS.debug
  graphKey.value = KEY_BINDINGS.graph
  storyKey.value = KEY_BINDINGS.story
  aiKey.value = KEY_BINDINGS.ai
  
  // Update display
  updateKeyBindingDisplay()
}

// Update key binding display
function updateKeyBindingDisplay() {
  keyBindingDisplay.textContent = getKeyBindingInfo()
}

// Save key bindings
function saveKeyBindingsToStorage() {
  const newBindings = {
    inventory: inventoryKey.value.toLowerCase() || 'z',
    debug: debugKey.value.toLowerCase() || 'd',
    graph: graphKey.value.toLowerCase() || 'g',
    story: storyKey.value.toLowerCase() || 's',
    ai: aiKey.value.toLowerCase() || 'a'
  }
  
  // Validate no duplicates
  const values = Object.values(newBindings)
  const uniqueValues = new Set(values)
  if (values.length !== uniqueValues.size) {
    setStatus('❌ 同じキーを複数回使用することはできません', 'error')
    return false
  }
  
  // Update global bindings
  Object.assign(KEY_BINDINGS, newBindings)
  
  // Save to localStorage
  try {
    localStorage.setItem('narrativeGenKeyBindings', JSON.stringify(KEY_BINDINGS))
    setStatus('✅ キーバインドを保存しました', 'success')
    updateKeyBindingDisplay()
    Logger.info('Key bindings saved', { bindings: KEY_BINDINGS })
    return true
  } catch (error) {
    setStatus('❌ キーバインドの保存に失敗しました', 'error')
    Logger.error('Failed to save key bindings', { error: error.message })
    return false
  }
}

// Reset key bindings to defaults
function resetKeyBindingsToDefault() {
  const defaultBindings = {
    inventory: 'z',
    debug: 'd',
    graph: 'g',
    story: 's',
    ai: 'a'
  }
  
  Object.assign(KEY_BINDINGS, defaultBindings)
  initKeyBindingUI()
  
  try {
    localStorage.removeItem('narrativeGenKeyBindings')
    setStatus('✅ キーバインドをデフォルトにリセットしました', 'success')
    Logger.info('Key bindings reset to default')
  } catch (error) {
    setStatus('❌ リセットに失敗しました', 'error')
    Logger.error('Failed to reset key bindings', { error: error.message })
  }
}

// Load key bindings from localStorage
function loadKeyBindingsFromStorage() {
  try {
    const stored = localStorage.getItem('narrativeGenKeyBindings')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate structure
      const requiredKeys = ['inventory', 'debug', 'graph', 'story', 'ai']
      if (requiredKeys.every(key => typeof parsed[key] === 'string' && parsed[key].length === 1)) {
        Object.assign(KEY_BINDINGS, parsed)
        Logger.info('Key bindings loaded from storage', { bindings: KEY_BINDINGS })
      } else {
        Logger.warn('Invalid key binding data in storage, using defaults')
      }
    }
  } catch (error) {
    Logger.warn('Failed to load key bindings from storage', { error: error.message })
  }
}

// Utility function for resolving variables in text (browser-compatible)
function resolveVariables(text, session, model) {
  if (!text || !session) return text
  
  let resolved = text
  
  // Replace flag variables: {flag:key}
  Object.entries(session.flags || {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{flag:${key}\\}`, 'g'), value ? 'true' : 'false')
  })
  
  // Replace resource variables: {resource:key}
  Object.entries(session.resources || {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{resource:${key}\\}`, 'g'), String(value))
  })
  
  // Replace variable variables: {variable:key}
  Object.entries(session.variables || {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{variable:${key}\\}`, 'g'), String(value))
  })
  
  // Replace node ID variable: {nodeId}
  resolved = resolved.replace(/\{nodeId\}/g, session.nodeId)
  
  // Replace time variable: {time}
  resolved = resolved.replace(/\{time\}/g, String(session.time))
  
  return resolved
}

// Browser-compatible model loading (no fs module)
async function loadModel(modelName) {
  const url = `/models/examples/${modelName}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load model: ${response.status} ${response.statusText}`)
  }
  return response.json()
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
const guiEditMode = document.getElementById('guiEditMode')
const guiEditBtn = document.getElementById('editBtn')
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

// Story preview modal elements
const storyPreviewModal = document.getElementById('storyPreviewModal')
const storyPreviewContent = document.getElementById('storyPreviewContent')
const closePreviewBtn = document.getElementById('closePreviewBtn')
const storyContent = document.getElementById('storyContent')
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn')

// Tab elements
const storyTab = document.getElementById('storyTab')
const graphTab = document.getElementById('graphTab')
const debugTab = document.getElementById('debugTab')
const storyPanel = document.getElementById('storyPanel')
const graphPanel = document.getElementById('graphPanel')
const debugPanel = document.getElementById('debugPanel')

// Graph elements
const graphSvg = document.getElementById('graphSvg')
const fitGraphBtn = document.getElementById('fitGraphBtn')
const resetGraphBtn = document.getElementById('resetGraphBtn')
const showConditions = document.getElementById('showConditions')
const graphSettingsBtn = document.getElementById('graphSettingsBtn')
const graphSettings = document.getElementById('graphSettings')
const nodeShape = document.getElementById('nodeShape')
const fontSize = document.getElementById('fontSize')
const saveGraphPreset = document.getElementById('saveGraphPreset')
const loadGraphPreset = document.getElementById('loadGraphPreset')

// Debug elements
const flagsDisplay = document.getElementById('flagsDisplay')
const resourcesDisplay = document.getElementById('resourcesDisplay')
const variablesDisplay = document.getElementById('variablesDisplay')
const editVariablesBtn = document.getElementById('editVariablesBtn')
const reachableNodes = document.getElementById('reachableNodes')
const saveLoadSection = document.getElementById('saveLoadSection')
const saveSlots = document.getElementById('saveSlots')
const refreshSavesBtn = document.getElementById('refreshSavesBtn')

// AI elements
const advancedTab = document.getElementById('advancedTab')
const advancedPanel = document.getElementById('advancedPanel')
const enableAdvancedFeatures = document.getElementById('enableAdvancedFeatures')
const aiProvider = document.getElementById('aiProvider')
const openaiSettings = document.getElementById('openaiSettings')
const openaiApiKey = document.getElementById('openaiApiKey')
const openaiModel = document.getElementById('openaiModel')
const ollamaSettings = document.getElementById('ollamaSettings')
const ollamaUrl = document.getElementById('ollamaUrl')
const ollamaModel = document.getElementById('ollamaModel')
const saveAiSettings = document.getElementById('saveAiSettings')
const generateNextNodeBtn = document.getElementById('generateNextNodeBtn')
const paraphraseCurrentBtn = document.getElementById('paraphraseCurrentBtn')
const aiOutput = document.getElementById('aiOutput')

// Designer lexicon UI elements
const lexiconLoadBtn = document.getElementById('lexiconLoadBtn')
const lexiconMergeBtn = document.getElementById('lexiconMergeBtn')
const lexiconReplaceBtn = document.getElementById('lexiconReplaceBtn')
const lexiconExportBtn = document.getElementById('lexiconExportBtn')
const lexiconImportBtn = document.getElementById('lexiconImportBtn')
const lexiconFileInput = document.getElementById('lexiconFileInput')
const lexiconTextarea = document.getElementById('lexiconTextarea')

// Key binding elements
const keyBindingDisplay = document.getElementById('keyBindingDisplay')
const inventoryKey = document.getElementById('inventoryKey')
const debugKey = document.getElementById('debugKey')
const graphKey = document.getElementById('graphKey')
const storyKey = document.getElementById('storyKey')
const aiKey = document.getElementById('aiKey')
const saveKeyBindings = document.getElementById('saveKeyBindings')
const resetKeyBindings = document.getElementById('resetKeyBindings')

// AI configuration
let aiConfig = {
  provider: 'mock',
  openai: {
    apiKey: '',
    model: 'gpt-3.5-turbo'
  },
  ollama: {
    url: 'http://localhost:11434',
    model: 'llama2'
  }
}
let aiProviderInstance = null

// Batch edit elements
const batchEditBtn = document.getElementById('batchEditBtn')
const batchEditModal = document.getElementById('batchEditModal')
const searchText = document.getElementById('searchText')
const replaceText = document.getElementById('replaceText')
const applyTextReplaceBtn = document.getElementById('applyTextReplaceBtn')
const choiceSearchText = document.getElementById('choiceSearchText')
const choiceReplaceText = document.getElementById('choiceReplaceText')
const applyChoiceReplaceBtn = document.getElementById('applyChoiceReplaceBtn')
const oldTargetText = document.getElementById('oldTargetText')
const newTargetText = document.getElementById('newTargetText')
const applyTargetReplaceBtn = document.getElementById('applyTargetReplaceBtn')
const closeBatchEditBtn = document.getElementById('closeBatchEditBtn')

function renderState() {
  const currentSession = getCurrentSession()
  if (!currentSession) {
    stateView.textContent = JSON.stringify({ status: 'サンプル未実行' }, null, 2)
    return
  }

  const snapshot = currentSession
  const view = {
    model: getCurrentModelName(),
    nodeId: snapshot.nodeId,
    time: snapshot.time,
    flags: snapshot.flags,
    resources: snapshot.resources,
    variables: snapshot.variables,
  }
  stateView.textContent = JSON.stringify(view, null, 2)

  // Update debug info if debug tab is active
  if (debugPanel.classList.contains('active')) {
    renderDebugInfo()
  }
}

function setStatus(message, type = 'info') {
  if (!statusText) return

  statusText.dataset.type = type

  let iconId
  switch (type) {
    case 'success':
      iconId = 'icon-status-success'
      break
    case 'error':
      iconId = 'icon-status-error'
      break
    case 'warn':
      iconId = 'icon-status-warn'
      break
    default:
      iconId = 'icon-status-info'
      break
  }

  statusText.innerHTML = `<svg class="icon icon-sm"><use href="#${iconId}"></use></svg>${message}`
}

if (typeof window !== 'undefined') {
  window.setStatus = setStatus
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

// =============================================================================
// Designer Lexicon management
// =============================================================================

function initLexiconUI() {
  // Tooltip for sidebar button
  if (toggleSidebarBtn) toggleSidebarBtn.title = '選択肢と状態パネルの表示/非表示を切り替えます'

  // Prefill textarea with current runtime lexicon
  if (lexiconTextarea) {
    try { lexiconTextarea.value = lexiconManager.exportAsJson() } catch {}
  }

  // Wire buttons
  if (lexiconLoadBtn) {
    lexiconLoadBtn.addEventListener('click', () => {
      try { lexiconTextarea.value = lexiconManager.exportAsJson(); setStatus('現在の辞書を読み込みました', 'success') } catch (e) { setStatus('辞書の読み込みに失敗しました', 'error') }
    })
  }
  if (lexiconMergeBtn) {
    lexiconMergeBtn.addEventListener('click', () => {
      try {
        const input = JSON.parse(lexiconTextarea.value || '{}')
        lexiconManager.setLexicon(input, { merge: true })
        lexiconTextarea.value = lexiconManager.exportAsJson()
        setStatus('辞書をマージ適用しました', 'success')
      } catch (e) { setStatus(`辞書の適用に失敗しました: ${e.message}`, 'error') }
    })
  }
  if (lexiconReplaceBtn) {
    lexiconReplaceBtn.addEventListener('click', () => {
      try {
        const input = JSON.parse(lexiconTextarea.value || '{}')
        lexiconManager.setLexicon(input, { merge: false })
        setStatus('辞書を置換適用しました', 'success')
      } catch (e) { setStatus(`辞書の適用に失敗しました: ${e.message}`, 'error') }
    })
  }
  if (lexiconExportBtn) {
    lexiconExportBtn.addEventListener('click', () => {
      try {
        const blob = new Blob([lexiconManager.exportAsJson()], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'synonyms.json'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setStatus('辞書をエクスポートしました', 'success')
      } catch (e) { setStatus('エクスポートに失敗しました', 'error') }
    })
  }
  if (lexiconImportBtn && lexiconFileInput) {
    lexiconImportBtn.addEventListener('click', () => lexiconFileInput.click())
    lexiconFileInput.addEventListener('change', (ev) => {
      const file = ev.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          lexiconManager.importFromJson(String(reader.result))
          lexiconTextarea.value = lexiconManager.exportAsJson()
          setStatus('辞書ファイルを読み込みました。適用ボタンで反映します', 'info')
        } catch { setStatus('JSON の解析に失敗しました', 'error') }
      }
      reader.readAsText(file)
    })
  }
}

function showCsvPreview(file) {
  csvFileName.textContent = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const lines = text.trim().split(/\r?\n/).slice(0, 11) // First 10 lines + header
    const table = document.createElement('table')
    table.className = 'csv-table'
    
    lines.forEach((line, index) => {
      const row = document.createElement('tr')
      const cells = parseCsvLine(line, line.includes('\t') ? '\t' : ',')
      cells.forEach(cell => {
        const cellEl = document.createElement(index === 0 ? 'th' : 'td')
        cellEl.textContent = cell
        row.appendChild(cellEl)
      })
      table.appendChild(row)
    })
    
    if (lines.length >= 11) {
      const row = document.createElement('tr')
      const cell = document.createElement('td')
      cell.colSpan = lines[0].split(line.includes('\t') ? '\t' : ',').length
      cell.textContent = '... (以降省略)'
      cell.style.textAlign = 'center'
      cell.style.fontStyle = 'italic'
      row.appendChild(cell)
      table.appendChild(row)
    }
    
    csvPreviewContent.innerHTML = ''
    csvPreviewContent.appendChild(table)
    csvPreviewModal.classList.add('show')
  }
  reader.readAsText(file)
}

function hideCsvPreview() {
  csvPreviewModal.classList.remove('show')
}

function getConditionText(conditions) {
  if (!conditions || conditions.length === 0) return ''
  return conditions.map(cond => {
    if (cond.type === 'flag') return `flag:${cond.key}=${cond.value}`
    if (cond.type === 'resource') return `res:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'variable') return `var:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'timeWindow') return `time:${cond.start}-${cond.end}`
    if (cond.type === 'and') return `AND(${serializeConditions(cond.conditions)})`
    if (cond.type === 'or') return `OR(${serializeConditions(cond.conditions)})`
    if (cond.type === 'not') return `NOT(${serializeConditions([cond.condition])})`
    return cond.type
  }).join(', ')
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

  const currentSession = getCurrentSession()
  if (!currentSession) {
    const info = document.createElement('p')
    info.textContent = 'セッションを開始すると選択肢が表示されます'
    choicesContainer.appendChild(info)
    return
  }

  const choices = getAvailableChoices(currentSession, appState.model)
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
        const currentSession = getCurrentSession()
        if (currentSession) {
          setCurrentSession(applyChoice(currentSession, appState.model, choice.id))
          setStatus(`選択肢「${choice.text}」を適用しました`, 'success')
          appendStoryFromCurrentNode()
        }
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

// Apply error boundaries to critical operations
const safeStartSession = ErrorBoundary.wrap(async (modelName) => {
  const model = await loadModel(modelName)
  session = startSession(model)
  currentModelName = modelName
  initStory()
  renderState()
  renderChoices()
  renderStory()
  Logger.info('Session started', { modelName, nodeCount: Object.keys(model.nodes).length })
})

const safeApplyChoice = ErrorBoundary.wrap(async (choiceId) => {
  if (!session || !appState.model) throw new Error('セッションが開始されていません')
  session = applyChoice(session, appState.model, choiceId)
  appendStoryFromCurrentNode()
  renderState()
  renderChoices()
  renderStory()
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

async function initAiProvider() {
  if (!aiProviderInstance || aiConfig.provider !== aiProvider.value) {
    try {
      if (aiProvider.value === 'openai') {
        if (!aiConfig.openai.apiKey) {
          aiOutput.textContent = 'OpenAI APIキーを設定してください'
          return
        }
        aiProviderInstance = createAIProvider({
          provider: 'openai',
          openai: aiConfig.openai
        })
      } else if (aiProvider.value === 'ollama') {
        aiProviderInstance = createAIProvider({
          provider: 'ollama',
          ollama: aiConfig.ollama
        })
      } else {
        aiProviderInstance = createAIProvider({ provider: 'mock' })
      }
      aiOutput.textContent = `${aiProvider.value}プロバイダーが初期化されました`
    } catch (error) {
      console.error('AIプロバイダー初期化エラー:', error)
      aiOutput.textContent = `AIプロバイダーの初期化に失敗しました: ${error.message}`
    }
  }
}

async function generateNextNode() {
  if (!aiProviderInstance || !session || !appState.model) {
    aiOutput.textContent = '❌ モデルを読み込んでから実行してください'
    return
  }

  // Disable buttons during generation
  generateNextNodeBtn.disabled = true
  paraphraseCurrentBtn.disabled = true
  aiOutput.textContent = '⏳ 生成中...'

  try {
    const context = {
      previousNodes: [], // 現在の実装では履歴を保持していない
      currentNodeText: appState.model.nodes[session.nodeId]?.text || '',
      choiceText: '続き'
    }

    const startTime = Date.now()
    const generatedText = await aiProviderInstance.generateNextNode(context)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    aiOutput.textContent = `✅ 生成されたテキスト (${duration}秒):\n${generatedText}`
    Logger.info('AI node generated', { duration, provider: aiConfig.provider })
  } catch (error) {
    console.error('ノード生成エラー:', error)
    const errorMsg = error.message.includes('API error') 
      ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
      : `生成に失敗しました: ${error.message}`
    aiOutput.textContent = `❌ ${errorMsg}`
    Logger.error('AI generation failed', { error: error.message, provider: aiConfig.provider })
  } finally {
    // Re-enable buttons
    generateNextNodeBtn.disabled = false
    paraphraseCurrentBtn.disabled = false
  }
}

async function paraphraseCurrentTextUI() {
  if (!aiProviderInstance || !session || !appState.model) {
    aiOutput.textContent = '❌ モデルを読み込んでから実行してください'
    return
  }

  const currentNode = appState.model.nodes[session.nodeId]
  if (!currentNode?.text) {
    aiOutput.textContent = '❌ 現在のノードにテキストがありません'
    return
  }

  // Disable buttons during generation
  generateNextNodeBtn.disabled = true
  paraphraseCurrentBtn.disabled = true
  aiOutput.textContent = '⏳ 言い換え中...'

  try {
    const startTime = Date.now()
    const paraphrases = await aiProviderInstance.paraphrase(currentNode.text, {
      variantCount: 3,
      // Prefer plain style here; designer lexicon defines phrasing
      style: 'plain',
      tone: 'neutral'
    })
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    aiOutput.textContent = `✅ 言い換え結果 (${duration}秒):\n${paraphrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    Logger.info('AI paraphrase completed', { duration, provider: aiConfig.provider, variantCount: paraphrases.length })
  } catch (error) {
    console.error('言い換えエラー:', error)
    const errorMsg = error.message.includes('API error') 
      ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
      : `言い換えに失敗しました: ${error.message}`
    aiOutput.textContent = `❌ ${errorMsg}`
    Logger.error('AI paraphrase failed', { error: error.message, provider: aiConfig.provider })
  } finally {
    // Re-enable buttons
    generateNextNodeBtn.disabled = false
    paraphraseCurrentBtn.disabled = false
  }
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
  const url = `/models/examples/${sampleId}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`モデルの読み込みに失敗しました (${response.status})`)
  }
  return response.json()
}

async function loadEntitiesCatalog() {
  const url = '/models/entities/Entities.csv'
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

    appState.model = model
    session = startSession(appState.model)
    currentModelName = sampleId
    setStatus(`サンプル ${sampleId} を実行中`, 'success')
    initStory()
    startAutoSave() // Start auto-save when session begins
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    stopAutoSave() // Stop auto-save when session ends
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

    appState.model = model
    session = startSession(appState.model)
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
  } catch (err) {
    console.error(err)
    session = null
    currentModelName = null
    stopAutoSave() // Stop auto-save when session ends
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

    // Validate model
    const validationErrors = validateModel(model.nodes)
    if (validationErrors.length > 0) {
      showErrors(validationErrors)
      setStatus(`モデルにエラーがあります: ${validationErrors.length}件`, 'warn')
      return
    }

    hideErrors()
    appState.model = model
    session = startSession(appState.model)
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
    startAutoSave() // Start auto-save when session begins
  } catch (err) {
    console.error(err)
    showErrors([err?.message ?? err])
    session = null
    currentModelName = null
    stopAutoSave() // Stop auto-save when session ends
    setStatus(`ファイルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStory()
  }
})

// Load AI config from aiManager
const aiConfigFromManager = aiManager.getConfig()
aiProvider.value = aiConfigFromManager.provider
if (aiConfigFromManager.provider === 'openai') {
  openaiSettings.style.display = 'block'
  openaiApiKey.value = aiConfigFromManager.openai.apiKey || ''
  openaiModel.value = aiConfigFromManager.openai.model || 'gpt-3.5-turbo'
} else if (aiConfigFromManager.provider === 'ollama') {
  ollamaSettings.style.display = 'block'
  ollamaUrl.value = aiConfigFromManager.ollama.url || 'http://localhost:11434'
  ollamaModel.value = aiConfigFromManager.ollama.model || 'llama2'
}

// Load advanced features setting
const advancedEnabled = localStorage.getItem('narrativeGenAdvancedEnabled') === 'true'
if (enableAdvancedFeatures) {
  enableAdvancedFeatures.checked = advancedEnabled
  if (advancedEnabled) {
    advancedTab.style.display = 'inline-block'
  }
  // Trigger change event to set up UI
  enableAdvancedFeatures.dispatchEvent(new Event('change'))
}

// Tab event listeners
function switchTab(tabName) {
  // Hide all panels
  storyPanel.classList.remove('active')
  graphPanel.classList.remove('active')
  debugPanel.classList.remove('active')
  advancedPanel.classList.remove('active')
  if (referencePanel) referencePanel.classList.remove('active')

  // Remove active class from all tabs
  storyTab.classList.remove('active')
  graphTab.classList.remove('active')
  debugTab.classList.remove('active')
  advancedTab.classList.remove('active')
  if (referenceTab) referenceTab.classList.remove('active')

  // Show selected panel and activate tab
  if (tabName === 'story') {
    storyPanel.classList.add('active')
    storyTab.classList.add('active')
  } else if (tabName === 'graph') {
    graphPanel.classList.add('active')
    graphTab.classList.add('active')
    graphManager.render()
  } else if (tabName === 'debug') {
    debugPanel.classList.add('active')
    debugTab.classList.add('active')
    debugManager.render()
  } else if (tabName === 'reference') {
    if (referencePanel) referencePanel.classList.add('active')
    if (referenceTab) referenceTab.classList.add('active')
    referenceManager.render()
  } else if (tabName === 'advanced') {
    advancedPanel.classList.add('active')
    advancedTab.classList.add('active')
    // Initialize key binding system
    loadKeyBindingsFromStorage()
    initKeyBindingUI()
  }
}

storyTab.addEventListener('click', () => switchTab('story'))
graphTab.addEventListener('click', () => switchTab('graph'))
debugTab.addEventListener('click', () => switchTab('debug'))
advancedTab.addEventListener('click', () => switchTab('advanced'))

// Advanced features toggle
if (enableAdvancedFeatures) {
  enableAdvancedFeatures.addEventListener('change', (e) => {
    const enabled = e.target.checked
    const aiSettings = document.getElementById('aiSettings')
    const keyBindingSettings = document.getElementById('keyBindingSettings')
    const aiActions = document.getElementById('aiActions')
    const lexiconEditor = document.getElementById('lexiconEditor')

    if (enabled) {
      aiSettings.style.display = 'block'
      keyBindingSettings.style.display = 'block'
      aiActions.style.display = 'block'
      lexiconEditor.style.display = 'block'
    } else {
      aiSettings.style.display = 'none'
      keyBindingSettings.style.display = 'none'
      aiActions.style.display = 'none'
      lexiconEditor.style.display = 'none'
    }

    // Save preference
    localStorage.setItem('narrativeGenAdvancedEnabled', enabled.toString())
  })
}

guiEditBtn.addEventListener('click', () => {
  if (session == null) {
    setStatus('GUI編集するにはまずモデルを読み込んでください', 'warn')
    return
  }

  // Hide all tab panels
  storyPanel.classList.remove('active')
  graphPanel.classList.remove('active')
  debugPanel.classList.remove('active')
  advancedPanel.classList.remove('active')
  if (referencePanel) referencePanel.classList.remove('active')

  // Show GUI edit mode
  guiEditorManager.renderNodeList()
  guiEditMode.style.display = 'block'
  setControlsEnabled(false)
})

function initAIProviderInstance() {
  if (!aiProviderInstance) {
    aiProviderInstance = createAIProvider(aiConfig)
  }
}

async function generateNextNodeUI() {
  if (!aiProviderInstance) {
    initAIProviderInstance()
  }

  if (!session || !appState.model) {
    setStatus('まずモデルを読み込んでセッションを開始してください', 'warn')
    return
  }

  const currentNode = appState.model.nodes[session.nodeId]
  if (!currentNode) {
    setStatus('現在のノードが見つかりません', 'error')
    return
  }

  // Disable button during generation
  generateNextNodeBtn.disabled = true
  generateNextNodeBtn.textContent = '生成中...'

  try {
    setStatus('AIで次のノードを生成中...', 'info')

    // Prepare context for AI generation
    const context = {
      previousNodes: appState.storyLog.slice(-3).map(text => ({ id: 'previous', text })), // Last 3 story entries
      currentNodeText: currentNode.text,
      choiceText: '次のシーンへ進む' // Default choice text
    }

    const generatedText = await aiProviderInstance.generateNextNode(context)

    // Create new node with AI-generated content
    const newNodeId = `ai_generated_${Date.now()}`
    const newChoiceId = `c_ai_${Date.now()}`

    // Add AI-generated node to model
    appState.model.nodes[newNodeId] = {
      id: newNodeId,
      text: generatedText,
      choices: [
        {
          id: newChoiceId,
          text: '続ける',
          target: newNodeId // Loop back to self for now (can be edited later)
        }
      ]
    }

    // Update current node's choice to point to new node
    const currentChoices = currentNode.choices || []
    if (currentChoices.length > 0) {
      // Update the first choice to point to AI-generated node
      currentChoices[0].target = newNodeId
    } else {
      // Add new choice if none exist
      currentNode.choices = [{
        id: newChoiceId,
        text: 'AI生成シーンへ',
        target: newNodeId
      }]
    }

    setStatus(`AIで新しいノードを生成しました: ${newNodeId}`, 'success')
    aiOutput.textContent = `生成されたテキスト:\n${generatedText}`

    // Optionally update graph if visible
    if (graphPanel.classList.contains('active')) {
      graphManager.render()
    }

  } catch (error) {
    console.error('AI generation error:', error)
    setStatus(`AI生成に失敗しました: ${error.message}`, 'error')
    aiOutput.textContent = `エラー: ${error.message}`
  } finally {
    generateNextNodeBtn.disabled = false
    generateNextNodeBtn.textContent = '次のノードを生成'
  }
}

function renderNodeList() {
  const fragment = document.createDocumentFragment()
  for (const [nodeId, node] of Object.entries(appState.model.nodes)) {
    const nodeDiv = document.createElement('div')
    nodeDiv.className = 'node-editor'
    nodeDiv.innerHTML = `
      <h3>ノード: ${nodeId}</h3>
      <label>テキスト: <input type="text" value="${(node.text || '').replace(/"/g, '&quot;')}" data-node-id="${nodeId}" data-field="text"></label>
      <h4>選択肢</h4>
      <div class="choices-editor" data-node-id="${nodeId}"></div>
      <button class="add-choice-btn" data-node-id="${nodeId}">選択肢を追加</button>
      <button class="delete-node-btn" data-node-id="${nodeId}">ノードを削除</button>
    `
    fragment.appendChild(nodeDiv)
  }
  nodeList.innerHTML = ''
  nodeList.appendChild(fragment)

  // Render choices after DOM is updated
  for (const [nodeId] of Object.entries(appState.model.nodes)) {
    renderChoicesForNode(nodeId)
  }
}

function renderChoicesForNode(nodeId) {
  const node = appState.model.nodes[nodeId]
  const choicesDiv = nodeList.querySelector(`.choices-editor[data-node-id="${nodeId}"]`)
  if (!choicesDiv) {
    console.warn(`Choices editor not found for node ${nodeId}`)
    return
  }

  if (!node.choices || node.choices.length === 0) {
    choicesDiv.innerHTML = '<p>選択肢なし</p>'
    return
  }

  const fragment = document.createDocumentFragment()
  node.choices.forEach((choice, index) => {
    const choiceDiv = document.createElement('div')
    choiceDiv.className = 'choice-editor'
    choiceDiv.innerHTML = `
      <label>テキスト: <input type="text" value="${(choice.text || '').replace(/"/g, '&quot;')}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="text"></label>
      <label>ターゲット: <input type="text" value="${choice.target || ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="target"></label>
      <button class="paraphrase-btn" data-node-id="${nodeId}" data-choice-index="${index}">言い換え</button>
      <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${index}">削除</button>
    `
    fragment.appendChild(choiceDiv)
  })
  choicesDiv.innerHTML = ''
  choicesDiv.appendChild(fragment)
}

addNodeBtn.addEventListener('click', () => {
  const nodeId = prompt('新しいノードIDを入力してください:')
  if (nodeId && !appState.model.nodes[nodeId]) {
    appState.model.nodes[nodeId] = { id: nodeId, text: '新しいノード', choices: [] }
    renderNodeList()
  }
})

previewBtn.addEventListener('click', () => {
  if (!appState.model) return
  let current = appState.model.startNode
  let story = ''
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = appState.model.nodes[current]
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
  if (!appState.model) return
  const json = JSON.stringify(appState.model, null, 2)
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
  appState.storyLog = []
  appendStoryFromCurrentNode()
}

function appendStoryFromCurrentNode() {
  const node = appState.model?.nodes?.[session?.nodeId]
  if (node?.text) {
    const resolvedText = resolveVariables(node.text, session, appState.model)
    appState.storyLog.push(resolvedText)
  }
}

function renderStory() {
  if (!storyView) return

  // Performance optimization: Virtual scrolling for long stories
  const maxVisibleEntries = 50
  const shouldVirtualize = appState.storyLog.length > maxVisibleEntries

  let visibleEntries
  let startIndex = 0

  if (shouldVirtualize) {
    // Show the most recent entries by default
    startIndex = Math.max(0, appState.storyLog.length - maxVisibleEntries)
    visibleEntries = appState.storyLog.slice(startIndex)
  } else {
    visibleEntries = appState.storyLog
  }

  storyView.textContent = visibleEntries.join('\n\n')

  // Add virtualization indicator
  if (shouldVirtualize) {
    const indicator = document.createElement('div')
    indicator.className = 'virtualization-indicator'
    indicator.textContent = `... (${startIndex} 件の古いエントリが非表示) ...`
    indicator.style.cssText = `
      text-align: center;
      padding: 1rem;
      color: #666;
      font-style: italic;
      border-top: 1px solid #e5e7eb;
      margin-top: 1rem;
    `

    // Insert at the beginning
    storyView.insertBefore(indicator, storyView.firstChild)

    // Add scroll handler for lazy loading more content
    let scrollTimeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        if (storyView.scrollTop === 0 && startIndex > 0) {
          // Load more content when scrolled to top
          const additionalEntries = Math.min(20, startIndex)
          const newStartIndex = startIndex - additionalEntries
          const newVisibleEntries = appState.storyLog.slice(newStartIndex, startIndex + maxVisibleEntries)

          storyView.textContent = newVisibleEntries.join('\n\n')

          // Update indicator
          const newIndicator = indicator.cloneNode(true)
          newIndicator.textContent = `... (${newStartIndex} 件の古いエントリが非表示) ...`
          storyView.insertBefore(newIndicator, storyView.firstChild)

          startIndex = newStartIndex

          // Scroll to show newly loaded content
          storyView.scrollTop = 50
        }
      }, 100)
    }

    storyView.addEventListener('scroll', handleScroll)
  }
}

// CSVプレビューモーダル
confirmImportBtn.addEventListener('click', async () => {
  const file = csvFileInput.files[0]
  if (!file) return
  hideCsvPreview()
  await safeImportCsv(file)
})

cancelPreviewBtn.addEventListener('click', () => {
  hideCsvPreview()
})

saveGuiBtn.addEventListener('click', () => {
  try {
    // Validate model before saving
    const validationErrors = validateModel(appState.model.nodes)
    if (validationErrors.length > 0) {
      showErrors(validationErrors)
      setStatus(`モデルにエラーがあります: ${validationErrors.length}件`, 'warn')
      return
    }

    hideErrors()
    // Restart session with current model
    session = startSession(appState.model)
    currentModelName = 'gui-edited'
    guiEditMode.style.display = 'none'

    // Show story panel
    storyPanel.classList.add('active')

    setStatus('GUI編集を保存しました', 'success')
    setControlsEnabled(true)
    renderState()
    renderChoices()
    storyManager.initStory()
    storyManager.renderStory()
  } catch (err) {
    showErrors([err?.message ?? err])
    setStatus(`GUI保存に失敗しました: ${err?.message ?? err}`, 'warn')
  }
})

cancelGuiBtn.addEventListener('click', () => {
  guiEditMode.style.display = 'none'
  
  // Show story panel
  storyPanel.classList.add('active')
  
  setControlsEnabled(true)
})

// 言い換えイベント（非AI）
nodeList.addEventListener('click', (e) => {
  if (e.target.classList.contains('rename-node-btn')) {
    const nodeId = e.target.dataset.nodeId
    const input = nodeList.querySelector(
      `input[data-node-id="${nodeId}"][data-field="id"]`,
    )
    if (!input) {
      setStatus('ノードID入力欄が見つかりません', 'error')
      return
    }
    guiEditorManager.renameNodeId(nodeId, input.value)
  }

  if (e.target.classList.contains('paraphrase-btn')) {
    const nodeId = e.target.dataset.nodeId
    const choiceIndex = e.target.dataset.choiceIndex
    const input = nodeList.querySelector(
      `input[data-node-id="${nodeId}"][data-choice-index="${choiceIndex}"][data-field="text"]`,
    )
    if (!input) return

    try {
      // 複数のバリアントを生成（デザイナー辞書を使用）
      const variants = lexiconManager.paraphrase(input.value, { variantCount: 3 })
      if (variants.length === 0) {
        setStatus('言い換えバリアントを生成できませんでした', 'warn')
        return
      }

      // バリアント選択モーダルを表示
      guiEditorManager.showParaphraseVariants(input, variants)
    } catch (err) {
      console.error('言い換えエラー:', err)
      setStatus(`言い換えに失敗しました: ${err?.message ?? err}`, 'warn')
    }
  }
  if (e.target.classList.contains('add-choice-btn')) {
    const nodeId = e.target.dataset.nodeId
    guiEditorManager.addChoice(nodeId)
  }

  if (e.target.classList.contains('delete-node-btn')) {
    const nodeId = e.target.dataset.nodeId
    guiEditorManager.deleteNode(nodeId)
  }

  if (e.target.classList.contains('delete-choice-btn')) {
    const nodeId = e.target.dataset.nodeId
    const choiceIndex = parseInt(e.target.dataset.choiceIndex)
    guiEditorManager.deleteChoice(nodeId, choiceIndex)
  }
})

// 入力変更でモデル更新
nodeList.addEventListener('input', (e) => {
  guiEditorManager.updateModelFromInput(e.target)
})

// フォーカス外れ時にもモデル更新（フォールバック）
nodeList.addEventListener('blur', (e) => {
  if (e.target.tagName === 'INPUT') {
    guiEditorManager.updateModelFromInput(e.target)
  }
}, true)

function showVariableEditor() {
  const variables = session.variables || {}
  const varKeys = Object.keys(variables)
  
  let message = '変数を編集してください (key=value の形式で入力)\n\n現在の変数:\n'
  message += varKeys.length > 0 ? varKeys.map(key => `${key}=${variables[key]}`).join('\n') : 'なし'
  message += '\n\n新しい変数を追加または既存の変数を編集 (空行でスキップ):'
  
  const input = prompt(message)
  if (input === null) return // Cancelled
  
  const newVariables = { ...variables }
  
  if (input.trim()) {
    const parts = input.split('=')
    if (parts.length === 2) {
      const key = parts[0].trim()
      const value = parts[1].trim()
      if (key) {
        newVariables[key] = value
        setStatus(`変数 ${key} を ${value} に設定しました`, 'success')
      } else {
        setStatus('変数キーが無効です', 'warn')
        return
      }
    } else {
      setStatus('形式が正しくありません (key=value)', 'warn')
      return
    }
  }
  
  // Update session
  session = { ...session, variables: newVariables }
  renderState()
  renderDebugInfo()
}

// トップレベルのプレビュー/ダウンロード
previewTopBtn.addEventListener('click', () => {
  if (!appState.model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  let current = appState.model.startNode
  let story = ''
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = appState.model.nodes[current]
    if (node?.text) story += node.text + '\n\n'
    if (node?.choices?.length === 1) current = node.choices[0].target
    else break
  }
  storyPreviewContent.textContent = story
  storyPreviewModal.classList.add('show')
})

// Close story preview modal
closePreviewBtn.addEventListener('click', () => {
  storyPreviewModal.classList.remove('show')
})

toggleSidebarBtn.addEventListener('click', () => {
  storyContent.classList.toggle('sidebar-hidden')
})

downloadTopBtn.addEventListener('click', () => {
  if (!appState.model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  const json = JSON.stringify(appState.model, null, 2)
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

// ============================================================================
// Save/Load System
// ============================================================================

const SAVE_SLOTS = 5
const SAVE_KEY_PREFIX = 'narrativeGen_save_slot_'
const AUTOSAVE_KEY = 'narrativeGen_autosave'

// Save data structure
function createSaveData(session, modelName) {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    modelName: modelName || currentModelName,
    session: {
      nodeId: session.nodeId,
      flags: { ...session.flags },
      resources: { ...session.resources },
      variables: { ...session.variables },
      time: session.time
    },
    storyLog: [...appState.storyLog]
  }
}

// Save to specific slot
function saveToSlot(slotId) {
  if (!session || !appState.model) {
    setStatus('保存するセッションがありません', 'warn')
    return false
  }

  try {
    const saveData = createSaveData(session, currentModelName)
    const key = `${SAVE_KEY_PREFIX}${slotId}`
    localStorage.setItem(key, JSON.stringify(saveData))

    setStatus(`スロット ${slotId} に保存しました`, 'success')
    Logger.info('Game saved', { slotId, nodeId: session.nodeId })
    return true
  } catch (error) {
    setStatus(`保存に失敗しました: ${error.message}`, 'error')
    Logger.error('Save failed', { slotId, error: error.message })
    return false
  }
}

// Load from specific slot
function loadFromSlot(slotId) {
  try {
    const key = `${SAVE_KEY_PREFIX}${slotId}`
    const savedData = localStorage.getItem(key)

    if (!savedData) {
      setStatus(`スロット ${slotId} にセーブデータがありません`, 'warn')
      return false
    }

    const saveData = JSON.parse(savedData)

    // Validate save data
    if (!saveData.session || !saveData.modelName) {
      throw new Error('不正なセーブデータです')
    }

    // Restore session
    session = {
      nodeId: saveData.session.nodeId,
      flags: { ...saveData.session.flags },
      resources: { ...saveData.session.resources },
      variables: { ...saveData.session.variables },
      time: saveData.session.time
    }

    // Restore story log
    appState.storyLog = saveData.storyLog || []

    currentModelName = saveData.modelName

    // Update UI
    renderState()
    renderChoices()
    storyManager.renderStory()
    renderDebugInfo()

    setStatus(`スロット ${slotId} から読み込みました`, 'success')
    Logger.info('Game loaded', { slotId, nodeId: session.nodeId })
    return true
  } catch (error) {
    setStatus(`読み込みに失敗しました: ${error.message}`, 'error')
    Logger.error('Load failed', { slotId, error: error.message })
    return false
  }
}

// Auto-save functionality
function autoSave() {
  if (!session || !appState.model) return

  try {
    const saveData = createSaveData(session, currentModelName)
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData))
    Logger.info('Auto-saved', { nodeId: session.nodeId })
  } catch (error) {
    Logger.error('Auto-save failed', { error: error.message })
  }
}

// Load auto-save
function loadAutoSave() {
  try {
    const savedData = localStorage.getItem(AUTOSAVE_KEY)
    if (!savedData) return false

    const saveData = JSON.parse(savedData)
    if (!saveData.session) return false

    // Restore session
    session = {
      nodeId: saveData.session.nodeId,
      flags: { ...saveData.session.flags },
      resources: { ...saveData.session.resources },
      variables: { ...saveData.session.variables },
      time: saveData.session.time
    }

    storyLog = saveData.storyLog || []
    currentModelName = saveData.modelName

    Logger.info('Auto-save loaded', { nodeId: session.nodeId })
    return true
  } catch (error) {
    Logger.error('Auto-save load failed', { error: error.message })
    return false
  }
}

// Get save slot info
function getSaveSlotInfo(slotId) {
  try {
    const key = `${SAVE_KEY_PREFIX}${slotId}`
    const savedData = localStorage.getItem(key)

    if (!savedData) return null

    const saveData = JSON.parse(savedData)
    return {
      slotId,
      timestamp: saveData.timestamp,
      modelName: saveData.modelName,
      nodeId: saveData.session?.nodeId,
      time: saveData.session?.time
    }
  } catch (error) {
    Logger.error('Failed to read save slot info', { slotId, error: error.message })
    return null
  }
}

// Clear save slot
function clearSaveSlot(slotId) {
  try {
    const key = `${SAVE_KEY_PREFIX}${slotId}`
    localStorage.removeItem(key)
    setStatus(`スロット ${slotId} をクリアしました`, 'info')
    Logger.info('Save slot cleared', { slotId })
    return true
  } catch (error) {
    setStatus(`スロットのクリアに失敗しました: ${error.message}`, 'error')
    return false
  }
}

// Initialize auto-save (save every 30 seconds when session is active)
let autoSaveInterval = null

function startAutoSave() {
  stopAutoSave() // Clear existing interval
  autoSaveInterval = setInterval(autoSave, 30000) // 30 seconds
  Logger.info('Auto-save started')
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
    Logger.info('Auto-save stopped')
  }
}

// Render save slots UI
function renderSaveSlots() {
  saveSlots.innerHTML = ''

  for (let i = 1; i <= SAVE_SLOTS; i++) {
    const slotInfo = getSaveSlotInfo(i)
    const slotDiv = document.createElement('div')
    slotDiv.className = 'save-slot'
    slotDiv.innerHTML = `
      <div class="slot-header">
        <strong>スロット ${i}</strong>
        ${slotInfo ? `<span class="slot-info">${slotInfo.modelName} - ${slotInfo.nodeId} (時間: ${slotInfo.time})</span>` : '<span class="slot-empty">空</span>'}
      </div>
      <div class="slot-timestamp">
        ${slotInfo ? `保存日時: ${new Date(slotInfo.timestamp).toLocaleString()}` : ''}
      </div>
      <div class="slot-buttons">
        <button class="save-btn" data-slot="${i}" ${!session ? 'disabled' : ''}>保存</button>
        <button class="load-btn" data-slot="${i}" ${!slotInfo ? 'disabled' : ''}>読み込み</button>
        <button class="clear-btn" data-slot="${i}" ${!slotInfo ? 'disabled' : ''}>クリア</button>
      </div>
    `
    saveSlots.appendChild(slotDiv)
  }

  // Add auto-save info
  const autoSaveDiv = document.createElement('div')
  autoSaveDiv.className = 'auto-save-info'
  autoSaveDiv.innerHTML = `
    <div class="slot-header">
      <strong>オートセーブ</strong>
      <span class="slot-info">${session ? '有効' : '無効'}</span>
    </div>
    <div class="slot-buttons">
      <button id="loadAutoSaveBtn" ${!localStorage.getItem(AUTOSAVE_KEY) ? 'disabled' : ''}>オートセーブから読み込み</button>
      <button id="clearAutoSaveBtn" ${!localStorage.getItem(AUTOSAVE_KEY) ? 'disabled' : ''}>オートセーブをクリア</button>
    </div>
  `
  saveSlots.appendChild(autoSaveDiv)
}

// Handle save slot button clicks
function handleSaveSlotClick(event) {
  const button = event.target
  if (!button.classList.contains('save-btn') && !button.classList.contains('load-btn') && !button.classList.contains('clear-btn')) return

  const slotId = parseInt(button.dataset.slot)

  if (button.classList.contains('save-btn')) {
    saveToSlot(slotId)
    renderSaveSlots()
  } else if (button.classList.contains('load-btn')) {
    if (loadFromSlot(slotId)) {
      renderSaveSlots()
    }
  } else if (button.classList.contains('clear-btn')) {
    if (confirm(`スロット ${slotId} のセーブデータを削除しますか？`)) {
      clearSaveSlot(slotId)
      renderSaveSlots()
    }
  }
}

// Handle auto-save buttons
function handleAutoSaveClick(event) {
  const button = event.target

  if (button.id === 'loadAutoSaveBtn') {
    if (loadAutoSave()) {
      renderState()
      renderChoices()
      storyManager.renderStory()
      renderDebugInfo()
      setStatus('オートセーブから読み込みました', 'success')
      renderSaveSlots()
    }
  } else if (button.id === 'clearAutoSaveBtn') {
    if (confirm('オートセーブデータを削除しますか？')) {
      localStorage.removeItem(AUTOSAVE_KEY)
      setStatus('オートセーブをクリアしました', 'info')
      renderSaveSlots()
    }
  }
}

// ============================================================================
// 言い換えバリアント選択モーダル
// ============================================================================

let currentParaphraseTarget = null

// ============================================================================
// Batch Edit Manager
// ============================================================================

const batchEditManager = {
  openModal() {
    if (guiEditMode.style.display === 'none') {
      setStatus('GUI編集モードでのみ使用可能です', 'warn')
      return
    }
    batchEditModal.style.display = 'flex'
    batchEditModal.classList.add('show')
  },

  closeModal() {
    batchEditModal.style.display = 'none'
    batchEditModal.classList.remove('show')
  },

  applyTextReplace() {
    const search = searchText.value.trim()
    const replace = replaceText.value.trim()
    
    if (!search) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }
    
    let replacedCount = 0
    for (const nodeId in _model.nodes) {
      const node = _model.nodes[nodeId]
      if (node.text && node.text.includes(search)) {
        node.text = node.text.replaceAll(search, replace)
        replacedCount++
      }
    }
    
    if (replacedCount > 0) {
      this.refreshUI()
      setStatus(`${replacedCount}個のノードテキストを置換しました`, 'success')
    } else {
      setStatus('該当するテキストが見つかりませんでした', 'info')
    }
  },

  applyChoiceReplace() {
    const search = choiceSearchText.value.trim()
    const replace = choiceReplaceText.value.trim()
    
    if (!search) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }
    
    let replacedCount = 0
    for (const nodeId in _model.nodes) {
      const node = _model.nodes[nodeId]
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.text && choice.text.includes(search)) {
            choice.text = choice.text.replaceAll(search, replace)
            replacedCount++
          }
        }
      }
    }
    
    if (replacedCount > 0) {
      this.refreshUI()
      setStatus(`${replacedCount}個の選択肢テキストを置換しました`, 'success')
    } else {
      setStatus('該当するテキストが見つかりませんでした', 'info')
    }
  },

  applyTargetReplace() {
    const oldTarget = oldTargetText.value.trim()
    const newTarget = newTargetText.value.trim()
    
    if (!oldTarget || !newTarget) {
      setStatus('変更元と変更先のノードIDを入力してください', 'warn')
      return
    }
    
    if (!_model.nodes[newTarget]) {
      setStatus('変更先のノードが存在しません', 'warn')
      return
    }
    
    let replacedCount = 0
    for (const nodeId in _model.nodes) {
      const node = _model.nodes[nodeId]
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.target === oldTarget) {
            choice.target = newTarget
            replacedCount++
          }
        }
      }
    }
    
    if (replacedCount > 0) {
      this.refreshUI()
      setStatus(`${replacedCount}個のターゲットを変更しました`, 'success')
    } else {
      setStatus('該当するターゲットが見つかりませんでした', 'info')
    }
  },

  refreshUI() {
    renderNodeList()
  }
}

function checkForDraftModel() {
  const draftData = localStorage.getItem('draft_model')
  if (draftData) {
    try {
      const draft = JSON.parse(draftData)
      if (confirm('未保存のドラフトモデルが見つかりました。読み込みますか？')) {
        _model = draft.model
        session = startSession(_model)
        currentModelName = draft.modelName || 'draft'
        storyLog = draft.storyLog || []
        setStatus('ドラフトモデルを読み込みました', 'success')
        renderState()
        renderChoices()
        storyManager.renderStory()
        renderDebugInfo()
        localStorage.removeItem('draft_model') // Clear draft after loading
      } else {
        localStorage.removeItem('draft_model') // User declined, clear draft
      }
    } catch (error) {
      console.warn('Failed to load draft model:', error)
      localStorage.removeItem('draft_model')
    }
  }
}

function saveDraftModel() {
  if (!_model) return

  try {
    const draftData = {
      model: _model,
      modelName: currentModelName,
      storyLog: storyLog,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('draft_model', JSON.stringify(draftData))
    setStatus('ドラフトを自動保存しました', 'info')
  } catch (error) {
    console.warn('Failed to save draft model:', error)
  }
}

// モーダルイベントリスナー
document.getElementById('cancelParaphraseBtn').removeEventListener('click', () => guiEditorManager.hideParaphraseModal())

// モーダル外クリックで閉じる
document.getElementById('paraphraseModal').removeEventListener('click', (e) => {
  if (e.target.id === 'paraphraseModal') {
    guiEditorManager.hideParaphraseModal()
  }
})

// Initialize status and check for draft model on load
initLexiconUI()
checkForDraftModel()
setStatus('初期化完了 - モデルを読み込んでください', 'info')

// Batch edit event listeners
if (batchEditBtn) batchEditBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().openModal())
if (applyTextReplaceBtn) applyTextReplaceBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().applyTextReplace())
if (applyChoiceReplaceBtn) applyChoiceReplaceBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().applyChoiceReplace())
if (applyTargetReplaceBtn) applyTargetReplaceBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().applyTargetReplace())
if (closeBatchEditBtn) closeBatchEditBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().closeModal())

// ===========================
// Color Palette Event Listeners
// ===========================
const themeBtn = document.getElementById('themeBtn')
const paletteModal = document.getElementById('paletteModal')
const closePaletteBtn = document.getElementById('closePaletteBtn')

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    initPaletteUI()
    paletteModal.style.display = 'flex'
    paletteModal.classList.add('show')
  })
}

if (closePaletteBtn) {
  closePaletteBtn.addEventListener('click', () => {
    paletteModal.style.display = 'none'
    paletteModal.classList.remove('show')
  })
}

if (paletteModal) {
  paletteModal.addEventListener('click', (e) => {
    if (e.target.id === 'paletteModal') {
      paletteModal.style.display = 'none'
      paletteModal.classList.remove('show')
    }
  })
}

// Load saved theme on startup
loadSavedPalette()

// ===========================
// Quick Node Creation
// ===========================
const NODE_TEMPLATES = {
  conversation: { text: '「会話テキストをここに入力」', choices: [] },
  choice: { text: '選択肢の説明をここに入力', choices: [
    { id: 'choice1', text: '選択肢1', target: '' },
    { id: 'choice2', text: '選択肢2', target: '' }
  ]},
  info: { text: '状況説明をここに入力', choices: [] },
  action: { text: 'イベントの説明をここに入力', choices: [] },
  blank: { text: '', choices: [] }
}

if (createQuickNodeBtn) {
  createQuickNodeBtn.addEventListener('click', () => guiEditorManager.createQuickNode())
}

// Add keyboard shortcut: N key for quick node creation (in GUI edit mode)
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  
  if (e.key.toLowerCase() === 'n' && guiEditMode && guiEditMode.style.display !== 'none') {
    e.preventDefault()
    guiEditorManager.openQuickNodeModal()
  }
})

// Batch Choice Edit
// ===========================
function openBatchChoiceModal() {
  const modal = document.getElementById('batchChoiceModal')
  const nodeSelect = document.getElementById('batchNodeSelect')
  
  // Populate node list
  nodeSelect.innerHTML = '<option value="">ノードを選択...</option>'
  Object.keys(_model.nodes).forEach(nodeId => {
    const option = document.createElement('option')
    option.value = nodeId
    option.textContent = `${nodeId} - ${_model.nodes[nodeId].text?.substring(0, 30) || '(テキストなし)'}`
    nodeSelect.appendChild(option)
  })
  
  modal.style.display = 'flex'
  modal.classList.add('show')
}

// Event listeners for batch choice edit
const batchNodeSelect = document.getElementById('batchNodeSelect')
const batchCondition = document.getElementById('batchCondition')
const batchEffect = document.getElementById('batchEffect')
const batchConditionText = document.getElementById('batchConditionText')
const batchEffectText = document.getElementById('batchEffectText')
const cancelBatchChoiceBtn = document.getElementById('cancelBatchChoiceBtn')
const applyBatchChoiceBtn = document.getElementById('applyBatchChoiceBtn')

if (batchNodeSelect) {
  batchNodeSelect.addEventListener('change', () => guiEditorManager.updateBatchChoiceList())
}

if (batchCondition) {
  batchCondition.addEventListener('change', (e) => {
    batchConditionText.disabled = !e.target.checked
  })
}

if (batchEffect) {
  batchEffect.addEventListener('change', (e) => {
    batchEffectText.disabled = !e.target.checked
  })
}

if (cancelBatchChoiceBtn) {
  cancelBatchChoiceBtn.addEventListener('click', () => {
    document.getElementById('batchChoiceModal').style.display = 'none'
    document.getElementById('batchChoiceModal').classList.remove('show')
  })
}

if (applyBatchChoiceBtn) {
  applyBatchChoiceBtn.addEventListener('click', () => guiEditorManager.applyBatchChoice())
}

// Add button listeners for quick node and batch choice
const quickNodeBtn = document.getElementById('quickNodeBtn')
const batchChoiceBtn = document.getElementById('batchChoiceBtn')

if (quickNodeBtn) {
  quickNodeBtn.addEventListener('click', () => guiEditorManager.openQuickNodeModal())
}

if (batchChoiceBtn) {
  batchChoiceBtn.addEventListener('click', () => guiEditorManager.openBatchChoiceModal())
}

// ============================================================================
// Module Initialization
// ============================================================================

// Initialize modules
const appState = new AppState()
const dom = new DOMManager()
const eventManager = new EventManager()
const storyManager = new StoryManager(appState)
const graphManager = new GraphManager(appState)
const debugManager = new DebugManager(appState)
const guiEditorManager = new GuiEditorManager(appState)
const referenceManager = new ReferenceManager()
const csvManager = new CsvManager(appState)
const aiManager = new AiManager(appState)
const lexiconManager = new LexiconManager()

// Initialize story manager
storyManager.initialize(document.getElementById('storyPanel'))

// Initialize graph manager
graphManager.initialize(document.getElementById('graphSvg'))

// Initialize debug manager
debugManager.initialize(
  document.getElementById('flagsDisplay'),
  document.getElementById('resourcesDisplay'),
  document.getElementById('variablesDisplay'),
  document.getElementById('reachableNodes')
)

// Initialize GUI editor manager
guiEditorManager.initialize(
  document.getElementById('nodeList'),
  document.getElementById('guiEditMode'),
  document.getElementById('batchEditModal'),
  document.getElementById('quickNodeModal'),
  document.getElementById('batchChoiceModal'),
  document.getElementById('paraphraseModal')
)

// Initialize reference manager
referenceManager.initialize(
  document.getElementById('referenceToc'),
  document.getElementById('referenceContent')
)

// Initialize CSV manager
csvManager.initialize(
  document.getElementById('csvImportModal'),
  document.getElementById('csvExportModal')
)

// Initialize AI manager
aiManager.initialize(
  document.getElementById('aiOutput'),
  document.getElementById('generateNextNodeBtn'),
  document.getElementById('paraphraseCurrentBtn')
)

// Initialize lexicon manager
lexiconManager.initialize()

// Set up graph control event listeners
if (fitGraphBtn) {
  fitGraphBtn.onclick = () => graphManager.fitToView()
}
if (resetGraphBtn) {
  resetGraphBtn.onclick = () => graphManager.reset()
}
if (graphSettingsBtn) {
  graphSettingsBtn.onclick = () => {
    const graphSettings = document.getElementById('graphSettings')
    graphSettings.style.display = graphSettings.style.display === 'none' ? 'block' : 'none'
  }
}
if (nodeShape) {
  nodeShape.onchange = () => graphManager.setNodeShape(nodeShape.value)
}
if (fontSize) {
  fontSize.oninput = () => graphManager.setFontSize(parseInt(fontSize.value))
}
if (showConditions) {
  showConditions.onchange = () => graphManager.setShowConditions(showConditions.checked)
}
if (saveGraphPreset) {
  saveGraphPreset.onclick = () => {
    if (graphManager.savePreset()) {
      setStatus('グラフプリセットを保存しました', 'success')
    } else {
      setStatus('プリセットの保存に失敗しました', 'warn')
    }
  }
}
if (loadGraphPreset) {
  loadGraphPreset.onclick = () => {
    if (graphManager.loadPreset()) {
      setStatus('グラフプリセットを読み込みました', 'success')
    } else {
      setStatus('保存されたプリセットがありません', 'warn')
    }
  }
}

// CSV import/export event listeners
if (importCsvBtn) {
  importCsvBtn.addEventListener('click', () => {
    csvManager.showCsvImportModal()
  })
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    csvManager.showCsvExportModal()
  })
}
