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

// Local storage key for designer lexicon
const LEXICON_KEY = 'designerParaphraseLexicon'

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
  statusText.textContent = message
  statusText.dataset.type = type
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

function stringifyLexicon(lex) {
  try { return JSON.stringify(lex, null, 2) } catch { return '{}' }
}

function parseLexicon(text) {
  const obj = JSON.parse(text)
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj
  throw new Error('JSON はオブジェクト形式である必要があります')
}

function saveLexiconToStorage(lex) {
  try { localStorage.setItem(LEXICON_KEY, JSON.stringify(lex)) } catch {}
}

function loadLexiconFromStorage() {
  try {
    const raw = localStorage.getItem(LEXICON_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function initLexiconUI() {
  // Tooltip for sidebar button
  if (toggleSidebarBtn) toggleSidebarBtn.title = '選択肢と状態パネルの表示/非表示を切り替えます'

  // Load designer lexicon from storage (replace mode to ensure determinism)
  const stored = loadLexiconFromStorage()
  if (stored) {
    try { setParaphraseLexicon(stored, { merge: false }) } catch {}
  }
  // Prefill textarea with current runtime lexicon
  if (lexiconTextarea) {
    try { lexiconTextarea.value = stringifyLexicon(getParaphraseLexicon()) } catch {}
  }

  // Wire buttons
  if (lexiconLoadBtn) {
    lexiconLoadBtn.addEventListener('click', () => {
      try { lexiconTextarea.value = stringifyLexicon(getParaphraseLexicon()); setStatus('現在の辞書を読み込みました', 'success') } catch (e) { setStatus('辞書の読み込みに失敗しました', 'error') }
    })
  }
  if (lexiconMergeBtn) {
    lexiconMergeBtn.addEventListener('click', () => {
      try {
        const input = parseLexicon(lexiconTextarea.value || '{}')
        setParaphraseLexicon(input, { merge: true })
        const merged = getParaphraseLexicon()
        saveLexiconToStorage(merged)
        setStatus('辞書をマージ適用しました', 'success')
      } catch (e) { setStatus(`辞書の適用に失敗しました: ${e.message}`, 'error') }
    })
  }
  if (lexiconReplaceBtn) {
    lexiconReplaceBtn.addEventListener('click', () => {
      try {
        const input = parseLexicon(lexiconTextarea.value || '{}')
        setParaphraseLexicon(input, { merge: false })
        saveLexiconToStorage(input)
        setStatus('辞書を置換適用しました', 'success')
      } catch (e) { setStatus(`辞書の適用に失敗しました: ${e.message}`, 'error') }
    })
  }
  if (lexiconExportBtn) {
    lexiconExportBtn.addEventListener('click', () => {
      try {
        const blob = new Blob([lexiconTextarea.value || '{}'], { type: 'application/json' })
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
          const text = String(reader.result)
          parseLexicon(text) // validate
          lexiconTextarea.value = text
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

function renderGraph() {
  if (!appState.model) {
    d3.select(graphSvg).selectAll('*').remove()
    return
  }

  const width = graphSvg.clientWidth || graphSvg.parentElement.clientWidth || 800
  const height = graphSvg.clientHeight || graphSvg.parentElement.clientHeight || 600

  // Performance optimization: Limit nodes for large graphs
  const maxNodes = 100
  const allNodes = Object.keys(appState.model.nodes)
  const shouldVirtualize = allNodes.length > maxNodes

  let nodesToShow
  if (shouldVirtualize) {
    // Show current node and its direct connections, plus some random nodes
    const currentSession = getCurrentSession()
    const currentNode = currentSession?.nodeId || appState.model.startNode
    const connectedNodes = new Set([currentNode])

    // Add directly connected nodes
    const currentNodeObj = appState.model.nodes[currentNode]
    if (currentNodeObj?.choices) {
      currentNodeObj.choices.forEach(choice => {
        if (choice.target) connectedNodes.add(choice.target)
      })
    }

    // Add nodes that connect to current node
    Object.entries(appState.model.nodes).forEach(([id, node]) => {
      if (node.choices?.some(c => c.target === currentNode)) {
        connectedNodes.add(id)
      }
    })

    // Fill remaining slots with random nodes
    const remaining = Array.from(allNodes.filter(id => !connectedNodes.has(id)))
    const randomNodes = remaining
      .sort(() => Math.random() - 0.5)
      .slice(0, maxNodes - connectedNodes.size)

    nodesToShow = Array.from(connectedNodes).concat(randomNodes)
  } else {
    nodesToShow = allNodes
  }

  // Clear previous graph
  d3.select(graphSvg).selectAll('*').remove()

  const svg = d3.select(graphSvg)
    .attr('width', width)
    .attr('height', height)

  // Add defs for gradients and filters
  const defs = svg.append('defs')

  // Gradient for nodes
  const gradient = defs.append('linearGradient')
    .attr('id', 'nodeGradient')
    .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%')
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#60a5fa')
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6')

  // Filter for shadow
  const filter = defs.append('filter')
    .attr('id', 'nodeShadow')
    .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
  filter.append('feDropShadow')
    .attr('dx', '2').attr('dy', '2').attr('stdDeviation', '3')
    .attr('flood-color', 'rgba(0,0,0,0.3)')

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      svg.select('g').attr('transform', event.transform)
    })

  svg.call(zoom)

  // Create container group for zoom
  const container = svg.append('g')

  // Create nodes and links data (only for visible nodes)
  const nodes = []
  const links = []

  nodesToShow.forEach(id => {
    const node = appState.model.nodes[id]
    if (!node) return

    nodes.push({
      id: id,
      text: node.text?.substring(0, 50) + (node.text?.length > 50 ? '...' : ''),
      x: Math.random() * (width - 200) + 100,
      y: Math.random() * (height - 200) + 100,
      isVirtualized: shouldVirtualize && !isConnectedToCurrent(id)
    })

    node.choices?.forEach(choice => {
      if (choice.target && nodesToShow.includes(choice.target)) {
        links.push({
          source: id,
          target: choice.target,
          condition: showConditions.checked ? getConditionText(choice.conditions) : null
        })
      }
    })
  })

  // Performance optimization: Use efficient force simulation settings
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(shouldVirtualize ? 100 : 150).strength(0.5))
    .force('charge', d3.forceManyBody().strength(shouldVirtualize ? -200 : -300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(shouldVirtualize ? 40 : 60))
    .alphaDecay(0.05) // Faster convergence for better performance
    .velocityDecay(0.4) 

  // Create links with optimized rendering
  const link = container.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', shouldVirtualize ? 1 : 2)

  // Add condition labels to links (only if enabled and not virtualized)
  let linkLabels
  if (showConditions.checked && !shouldVirtualize) {
    linkLabels = container.append('g')
      .selectAll('text')
      .data(links.filter(l => l.condition))
      .enter().append('text')
      .attr('font-size', `${fontSize.value}px`)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.condition)
  }

  // Create nodes with performance optimizations
  const node = container.append('g')
    .selectAll(nodeShape.value === 'rect' ? 'rect' : 'circle')
    .data(nodes)
    .enter().append(nodeShape.value === 'rect' ? 'rect' : 'circle')

  if (nodeShape.value === 'circle') {
    node.attr('r', d => d.isVirtualized ? 20 : 30)
  } else {
    node.attr('width', d => d.isVirtualized ? 40 : 60)
       .attr('height', d => d.isVirtualized ? 40 : 60)
       .attr('x', d => d.isVirtualized ? -20 : -30)
       .attr('y', d => d.isVirtualized ? -20 : -30)
  }

  node.attr('fill', 'url(#nodeGradient)')
    .attr('filter', 'url(#nodeShadow)')
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.1).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }))

  // Add node labels with conditional rendering
  let labels
  if (!shouldVirtualize) {
    labels = container.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', `${fontSize.value}px`)
      .attr('fill', '#333')
      .text(d => d.id)

    // Position labels based on shape
    if (nodeShape.value === 'circle') {
      labels.attr('x', d => d.x).attr('y', d => d.y)
    } else {
      labels.attr('x', d => d.x + (d.isVirtualized ? 20 : 30)).attr('y', d => d.y + (d.isVirtualized ? 20 : 30))
    }
  }

  // Update positions on simulation tick with throttled updates
  let tickCount = 0
  simulation.on('tick', () => {
    tickCount++
    if (tickCount % 3 !== 0) return // Update every 3 ticks for performance

    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    if (!shouldVirtualize) {
      if (nodeShape.value === 'circle') {
        labels.attr('x', d => d.x).attr('y', d => d.y)
      } else {
        labels.attr('x', d => d.x + (d.isVirtualized ? 20 : 30)).attr('y', d => d.y + (d.isVirtualized ? 20 : 30))
      }
    }

    node
      .attr(nodeShape.value === 'circle' ? 'cx' : 'x', d => d.x)
      .attr(nodeShape.value === 'circle' ? 'cy' : 'y', d => d.y)

    if (showConditions.checked && !shouldVirtualize && linkLabels) {
      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2)
    }
  })

  // Add virtualization notice
  if (shouldVirtualize) {
    svg.append('text')
      .attr('x', width - 10)
      .attr('y', 20)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(`表示中: ${nodesToShow.length}/${allNodes.length} ノード`)
  }

  // Graph controls
  fitGraphBtn.onclick = () => {
    if (!container.node()) return
    const bounds = container.node().getBBox()
    const fullWidth = bounds.width
    const fullHeight = bounds.height
    const midX = bounds.x + fullWidth / 2
    const midY = bounds.y + fullHeight / 2

    const scale = Math.min(width / fullWidth, height / fullHeight) * 0.8
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY]

    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    )
  }

  resetGraphBtn.onclick = () => {
    nodes.forEach(n => {
      n.x = Math.random() * (width - 200) + 100
      n.y = Math.random() * (height - 200) + 100
      n.fx = null
      n.fy = null
    })
    simulation.restart()
  }

  showConditions.onchange = () => renderGraph()
}

graphSettingsBtn.onclick = () => {
  graphSettings.style.display = graphSettings.style.display === 'none' ? 'block' : 'none'
}

nodeShape.onchange = () => renderGraph()
fontSize.oninput = () => renderGraph()

saveGraphPreset.onclick = () => {
  const preset = {
    nodeShape: nodeShape.value,
    fontSize: fontSize.value
  }
  localStorage.setItem('graphPreset', JSON.stringify(preset))
  setStatus('グラフプリセットを保存しました', 'success')
}

loadGraphPreset.onclick = () => {
  const stored = localStorage.getItem('graphPreset')
  if (stored) {
    const preset = JSON.parse(stored)
    nodeShape.value = preset.nodeShape
    fontSize.value = preset.fontSize
    renderGraph()
    setStatus('グラフプリセットを読み込みました', 'success')
  } else {
    setStatus('保存されたプリセットがありません', 'warn')
  }
}

function getConditionText(conditions) {
  if (!conditions || conditions.length === 0) return ''
  return conditions.map(cond => {
    if (cond.type === 'flag') return `flag:${cond.key}=${cond.value}`
    if (cond.type === 'resource') return `res:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'variable') return `var:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'timeWindow') return `time:${cond.start}-${cond.end}`
    if (cond.type === 'and') return `AND(${cond.conditions.map(c => getConditionText([c])).join(',')})`
    if (cond.type === 'or') return `OR(${cond.conditions.map(c => getConditionText([c])).join(',')})`
    if (cond.type === 'not') return `NOT(${getConditionText([cond.condition])})`
    return cond.type
  }).join(', ')
}

function renderDebugInfo() {
  const currentSession = getCurrentSession()
  if (!currentSession || !appState.model) {
    flagsDisplay.innerHTML = '<p>セッションを開始してください</p>'
    resourcesDisplay.innerHTML = ''
    reachableNodes.innerHTML = '<p>モデルを読み込んでください</p>'
    return
  }

  // Render flags
  flagsDisplay.innerHTML = '<h4>フラグ</h4>'
  if (currentSession.flags && Object.keys(currentSession.flags).length > 0) {
    Object.entries(currentSession.flags).forEach(([key, value]) => {
      const div = document.createElement('div')
      div.className = 'flag-item'
      div.innerHTML = `<span>${key}</span><span>${value}</span>`
      flagsDisplay.appendChild(div)
    })
  } else {
    flagsDisplay.innerHTML += '<p>フラグなし</p>'
  }

  // Render variables
  variablesDisplay.innerHTML = '<h4>変数</h4>'
  if (currentSession.variables && Object.keys(currentSession.variables).length > 0) {
    Object.entries(currentSession.variables).forEach(([key, value]) => {
      const div = document.createElement('div')
      div.className = 'variable-item'
      div.innerHTML = `<span>${key}</span><span>${value}</span>`
      variablesDisplay.appendChild(div)
    })
  } else {
    variablesDisplay.innerHTML += '<p>変数なし</p>'
  }

  // Render reachability map
  reachableNodes.innerHTML = '<h4>到達可能性</h4>'
  const visited = new Set([currentSession.nodeId])
  const queue = [currentSession.nodeId]
  const reachable = new Set([currentSession.nodeId])

  // BFS to find all reachable nodes
  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    const node = appState.model.nodes[currentNodeId]
    if (!node) continue

    node.choices?.forEach(choice => {
      if (!visited.has(choice.target)) {
        visited.add(choice.target)
        // Check if choice is available in current state
        try {
          const availableChoices = getAvailableChoices(currentSession, appState.model)
          const isAvailable = availableChoices.some(c => c.id === choice.id)
          if (isAvailable) {
            queue.push(choice.target)
            reachable.add(choice.target)
          }
        } catch (e) {
          // If error, assume reachable for now
          reachable.add(choice.target)
        }
      }
    })
  }

  // Display all nodes with reachability status
  Object.keys(appState.model.nodes).forEach(nodeId => {
    const div = document.createElement('div')
    div.className = reachable.has(nodeId) ? 'reachable-node' : 'unreachable-node'
    div.textContent = `${nodeId}: ${reachable.has(nodeId) ? '到達可能' : '未到達'}`
    reachableNodes.appendChild(div)
  })
}

// CSVファイルのインポート処理
async function importCsvFile(file) {
  try {
    const text = await file.text()
    const delim = file.name.endsWith('.tsv') || text.includes('\t') ? '\t' : ','
    const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (rows.length === 0) throw new Error('空のファイルです')

    const headers = rows[0].split(delim).map((h) => h.trim())
    const idx = {
      node_id: headers.indexOf('node_id'),
      node_text: headers.indexOf('node_text'),
      node_type: headers.indexOf('node_type'),
      node_tags: headers.indexOf('node_tags'),
      node_assets: headers.indexOf('node_assets'),
      choice_id: headers.indexOf('choice_id'),
      choice_text: headers.indexOf('choice_text'),
      choice_target: headers.indexOf('choice_target'),
      choice_conditions: headers.indexOf('choice_conditions'),
      choice_effects: headers.indexOf('choice_effects'),
      choice_outcome_type: headers.indexOf('choice_outcome_type'),
      choice_outcome_value: headers.indexOf('choice_outcome_value'),
      choice_metadata: headers.indexOf('choice_metadata'),
      choice_variables: headers.indexOf('choice_variables'),
      initial_flags: headers.indexOf('initial_flags'),
      initial_resources: headers.indexOf('initial_resources'),
      global_metadata: headers.indexOf('global_metadata'),
    }

    // Performance optimization: Process in chunks for large files
    const totalRows = rows.length - 1 // Exclude header
    const chunkSize = 100
    const chunks = []

    for (let i = 1; i < rows.length; i += chunkSize) {
      chunks.push(rows.slice(i, i + chunkSize))
    }

    // 初期値の抽出（最初の行）
    let initialFlags = {}
    let initialResources = {}
    if (rows.length > 1) {
      const firstRow = parseCsvLine(rows[1], delim)
      if (idx.initial_flags >= 0 && firstRow[idx.initial_flags]) {
        initialFlags = parseKeyValuePairs(firstRow[idx.initial_flags], 'boolean')
      }
      if (idx.initial_resources >= 0 && firstRow[idx.initial_resources]) {
        initialResources = parseKeyValuePairs(firstRow[idx.initial_resources], 'number')
      }
    }

    const nodes = {}
    const errors = []
    let processedRows = 0

    // Progress indicator
    setStatus(`CSV読み込み中... (0/${totalRows})`)

    // Process chunks with progress updates
    for (const chunk of chunks) {
      for (const row of chunk) {
        const cells = parseCsvLine(row, delim)
        const nid = (cells[idx.node_id] || '').trim()
        if (!nid) continue

        if (!nodes[nid]) {
          nodes[nid] = {
            id: nid,
            text: '',
            choices: [],
            type: 'normal',
            tags: [],
            assets: {}
          }
        }

        const node = nodes[nid]

        const ntext = (cells[idx.node_text] || '').trim()
        if (ntext) node.text = ntext

        // Parse node metadata
        if (idx.node_type >= 0 && cells[idx.node_type]) {
          node.type = cells[idx.node_type].trim()
        }

        if (idx.node_tags >= 0 && cells[idx.node_tags]) {
          node.tags = cells[idx.node_tags].split(';').map(t => t.trim()).filter(Boolean)
        }

        if (idx.node_assets >= 0 && cells[idx.node_assets]) {
          node.assets = parseKeyValuePairs(cells[idx.node_assets])
        }

        const cid = (cells[idx.choice_id] || '').trim()
        const ctext = (cells[idx.choice_text] || '').trim()
        const ctgt = (cells[idx.choice_target] || '').trim()

        if (ctgt || ctext || cid) {
          const choice = {
            id: cid || `c${nodes[nid].choices.length + 1}`,
            text: ctext || '',
            target: ctgt || nid,
            metadata: {},
            variables: {}
          }

          // Parse choice metadata
          if (idx.choice_metadata >= 0 && cells[idx.choice_metadata]) {
            choice.metadata = parseKeyValuePairs(cells[idx.choice_metadata])
          }

          // Parse choice variables
          if (idx.choice_variables >= 0 && cells[idx.choice_variables]) {
            choice.variables = parseKeyValuePairs(cells[idx.choice_variables])
          }

          // 条件のパース
          if (idx.choice_conditions >= 0 && cells[idx.choice_conditions]) {
            try {
              choice.conditions = parseConditions(cells[idx.choice_conditions])
            } catch (err) {
              errors.push(`行${processedRows + 2}: 条件パースエラー: ${err.message}`)
            }
          }

          // 効果のパース
          if (idx.choice_effects >= 0 && cells[idx.choice_effects]) {
            try {
              choice.effects = parseEffects(cells[idx.choice_effects])
            } catch (err) {
              errors.push(`行${processedRows + 2}: 効果パースエラー: ${err.message}`)
            }
          }

          // アウトカムのパース
          if (idx.choice_outcome_type >= 0 && cells[idx.choice_outcome_type]) {
            choice.outcome = {
              type: cells[idx.choice_outcome_type].trim(),
              value: idx.choice_outcome_value >= 0 ? cells[idx.choice_outcome_value]?.trim() : undefined
            }
          }

          nodes[nid].choices.push(choice)
        }

        processedRows++

        // Update progress every 100 rows
        if (processedRows % 100 === 0) {
          setStatus(`CSV読み込み中... (${processedRows}/${totalRows})`)
          // Allow UI to update
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    }

    // バリデーション
    const validationErrors = validateModel(nodes)
    errors.push(...validationErrors)

    if (errors.length > 0) {
      showErrors(errors)
      setStatus(`CSV読み込みに失敗しました（${errors.length}件のエラー）`, 'warn')
    } else {
      hideErrors()
      setStatus('CSV を読み込みました', 'success')
    }

    // グローバルメタデータのパース（最初の行）
    let globalMetadata = {}
    if (rows.length > 1 && idx.global_metadata >= 0) {
      const firstRow = parseCsvLine(rows[1], delim)
      if (firstRow[idx.global_metadata]) {
        globalMetadata = parseKeyValuePairs(firstRow[idx.global_metadata])
      }
    }

    const firstNode = Object.keys(nodes)[0]
    appState.model = {
      modelType: 'adventure-playthrough',
      startNode: firstNode,
      flags: initialFlags,
      resources: initialResources,
      nodes,
      metadata: globalMetadata
    }
    session = startSession(appState.model)
    currentModelName = file.name
    initStory()
    renderState()
    renderChoices()
    renderStory()
  } catch (err) {
    console.error(err)
    setStatus(`CSV 読み込みに失敗: ${err?.message ?? err}`, 'warn')
  }
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

// Load AI config from localStorage on startup
const savedAiConfig = localStorage.getItem('narrativeGenAiConfig')
if (savedAiConfig) {
  try {
    aiConfig = { ...aiConfig, ...JSON.parse(savedAiConfig) }
    aiProvider.value = aiConfig.provider
    if (aiConfig.provider === 'openai') {
      openaiSettings.style.display = 'block'
      openaiApiKey.value = aiConfig.openai.apiKey || ''
      openaiModel.value = aiConfig.openai.model || 'gpt-3.5-turbo'
    } else if (aiConfig.provider === 'ollama') {
      ollamaSettings.style.display = 'block'
      ollamaUrl.value = aiConfig.ollama.url || 'http://localhost:11434'
      ollamaModel.value = aiConfig.ollama.model || 'llama2'
    }
  } catch (error) {
    console.warn('Failed to load AI config from localStorage:', error)
  }
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
    renderGraph()
  } else if (tabName === 'debug') {
    debugPanel.classList.add('active')
    debugTab.classList.add('active')
    renderDebugInfo()
  } else if (tabName === 'reference') {
    if (referencePanel) referencePanel.classList.add('active')
    if (referenceTab) referenceTab.classList.add('active')
    renderReferenceContent()
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
  renderNodeList()
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
      renderGraph()
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


saveAiSettings.addEventListener('click', () => {
  aiConfig.provider = aiProvider.value
  if (aiProvider.value === 'openai') {
    aiConfig.openai.apiKey = openaiApiKey.value
    aiConfig.openai.model = openaiModel.value
    if (!aiConfig.openai.apiKey) {
      aiOutput.textContent = 'OpenAI APIキーを入力してください'
      return
    }
  } else if (aiProvider.value === 'ollama') {
    aiConfig.ollama.url = ollamaUrl.value
    aiConfig.ollama.model = ollamaModel.value
  }
  // Save to localStorage
  localStorage.setItem('narrativeGenAiConfig', JSON.stringify(aiConfig))
  aiOutput.textContent = 'AI設定を保存しました'
  aiProviderInstance = null // Reset to use new config
})

generateNextNodeBtn.addEventListener('click', generateNextNodeUI)
paraphraseCurrentBtn.addEventListener('click', paraphraseCurrentTextUI)

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
  await importCsvFile(file)
})

cancelPreviewBtn.addEventListener('click', () => {
  hideCsvPreview()
})

csvFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  showCsvPreview(file)
})
function parseCsvLine(line, delim) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delim && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

// キー=値ペアのパース（セミコロン区切り）
function parseKeyValuePairs(text, type = 'string') {
  const result = {}
  text.split(';').forEach((pair) => {
    const [key, val] = pair.split('=').map((s) => s.trim())
    if (!key || val === undefined) return
    if (type === 'boolean') {
      result[key] = val.toLowerCase() === 'true'
    } else if (type === 'number') {
      result[key] = parseFloat(val)
    } else {
      result[key] = val
    }
  })
  return result
}

// 条件のパース
function parseConditions(text) {
  const conditions = []
  text.split(';').forEach((cond) => {
    cond = cond.trim()
    if (!cond) return
    
    if (cond.startsWith('flag:')) {
      const [key, val] = cond.slice(5).split('=')
      conditions.push({ type: 'flag', key: key.trim(), value: val.trim().toLowerCase() === 'true' })
    } else if (cond.startsWith('resource:')) {
      const match = cond.slice(9).match(/^(\w+)(>=|<=|>|<|==)(.+)$/)
      if (!match) throw new Error(`不正なリソース条件: ${cond}`)
      conditions.push({ type: 'resource', key: match[1].trim(), op: match[2], value: parseFloat(match[3]) })
    } else if (cond.startsWith('variable:')) {
      const match = cond.slice(9).match(/^(\w+)(==|!=|contains|!contains)(.+)$/)
      if (!match) throw new Error(`不正な変数条件: ${cond}`)
      conditions.push({ type: 'variable', key: match[1].trim(), op: match[2], value: match[3].trim() })
    } else if (cond.startsWith('timeWindow:')) {
      const [start, end] = cond.slice(11).split('-').map((s) => parseInt(s.trim()))
      conditions.push({ type: 'timeWindow', start, end })
    } else if (cond.startsWith('and(') && cond.endsWith(')')) {
      const innerText = cond.slice(4, -1)
      const subConditions = parseConditions(innerText)
      conditions.push({ type: 'and', conditions: subConditions })
    } else if (cond.startsWith('or(') && cond.endsWith(')')) {
      const innerText = cond.slice(3, -1)
      const subConditions = parseConditions(innerText)
      conditions.push({ type: 'or', conditions: subConditions })
    } else if (cond.startsWith('not(') && cond.endsWith(')')) {
      const innerText = cond.slice(4, -1)
      const subCondition = parseConditions(innerText)[0]
      if (!subCondition) throw new Error(`不正な否定条件: ${cond}`)
      conditions.push({ type: 'not', condition: subCondition })
    } else {
      throw new Error(`不明な条件タイプ: ${cond}`)
    }
  })
  return conditions
}

// 効果のパース
function parseEffects(text) {
  const effects = []
  text.split(';').forEach((eff) => {
    eff = eff.trim()
    if (!eff) return
    
    if (eff.startsWith('setFlag:')) {
      const [key, val] = eff.slice(8).split('=')
      effects.push({ type: 'setFlag', key: key.trim(), value: val.trim().toLowerCase() === 'true' })
    } else if (eff.startsWith('addResource:')) {
      const [key, val] = eff.slice(12).split('=')
      effects.push({ type: 'addResource', key: key.trim(), delta: parseFloat(val) })
    } else if (eff.startsWith('setVariable:')) {
      const [key, val] = eff.slice(12).split('=')
      effects.push({ type: 'setVariable', key: key.trim(), value: val.trim() })
    } else if (eff.startsWith('multiplyResource:')) {
      const [key, val] = eff.slice(16).split('=')
      effects.push({ type: 'multiplyResource', key: key.trim(), factor: parseFloat(val) })
    } else if (eff.startsWith('setResource:')) {
      const [key, val] = eff.slice(12).split('=')
      effects.push({ type: 'setResource', key: key.trim(), value: parseFloat(val) })
    } else if (eff.startsWith('randomEffect:')) {
      const effectList = eff.slice(12).split('|').map(e => e.trim())
      const parsedEffects = effectList.map(e => parseEffects(e)[0]).filter(Boolean)
      effects.push({ type: 'randomEffect', effects: parsedEffects })
    } else if (eff.startsWith('conditionalEffect:')) {
      const parts = eff.slice(17).split('?')
      if (parts.length === 2) {
        const condition = parseConditions(parts[0])[0]
        const effectText = parts[1]
        const effect = parseEffects(effectText)[0]
        if (condition && effect) {
          effects.push({ type: 'conditionalEffect', condition, effect })
        }
      }
    } else if (eff.startsWith('goto:')) {
      effects.push({ type: 'goto', target: eff.slice(5).trim() })
    } else {
      throw new Error(`不明な効果タイプ: ${eff}`)
    }
  })
  return effects
}

// モデル検証
function validateModel(nodes) {
  const errors = []
  const nodeIds = Object.keys(nodes)
  
  for (const [nid, node] of Object.entries(nodes)) {
    for (const choice of node.choices || []) {
      if (choice.target && !nodeIds.includes(choice.target)) {
        errors.push(`ノード'${nid}'の選択肢'${choice.id}': 存在しないターゲット'${choice.target}'`)
      }
    }
  }
  
  return errors
}

exportCsvBtn.addEventListener('click', () => {
  if (!appState.model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  const header = [
    'node_id', 'node_text', 'node_type', 'node_tags', 'node_assets',
    'choice_id', 'choice_text', 'choice_target',
    'choice_conditions', 'choice_effects', 'choice_outcome_type', 'choice_outcome_value',
    'choice_metadata', 'choice_variables',
    'initial_flags', 'initial_resources', 'global_metadata'
  ]
  const rows = [header.join(',')]
  
  let firstRow = true
  for (const [nid, node] of Object.entries(appState.model.nodes)) {
    const initialFlags = firstRow && appState.model.flags ? serializeKeyValuePairs(appState.model.flags) : ''
    const initialResources = firstRow && appState.model.resources ? serializeKeyValuePairs(appState.model.resources) : ''
    const globalMetadata = firstRow && appState.model.metadata ? serializeKeyValuePairs(appState.model.metadata) : ''
    firstRow = false
    
    // Node metadata
    const nodeType = node.type || 'normal'
    const nodeTags = node.tags ? node.tags.join(';') : ''
    const nodeAssets = node.assets ? serializeKeyValuePairs(node.assets) : ''
    
    if (!node.choices || node.choices.length === 0) {
      rows.push([
        nid, escapeCsv(node.text ?? ''), nodeType, escapeCsv(nodeTags), escapeCsv(nodeAssets),
        '', '', '',
        '', '', '', '',
        '', '',
        initialFlags, initialResources, globalMetadata
      ].join(','))
      continue
    }
    
    for (const ch of node.choices) {
      const conditions = ch.conditions ? serializeConditions(ch.conditions) : ''
      const effects = ch.effects ? serializeEffects(ch.effects) : ''
      const outcomeType = ch.outcome?.type || ''
      const outcomeValue = ch.outcome?.value || ''
      
      // Choice metadata and variables
      const choiceMetadata = ch.metadata ? serializeKeyValuePairs(ch.metadata) : ''
      const choiceVariables = ch.variables ? serializeKeyValuePairs(ch.variables) : ''
      
      rows.push([
        nid, escapeCsv(node.text ?? ''), nodeType, escapeCsv(nodeTags), escapeCsv(nodeAssets),
        ch.id ?? '', escapeCsv(ch.text ?? ''), ch.target ?? '',
        escapeCsv(conditions), escapeCsv(effects), outcomeType, outcomeValue,
        escapeCsv(choiceMetadata), escapeCsv(choiceVariables),
        initialFlags, initialResources, globalMetadata
      ].join(','))
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

// 条件のシリアライズ
function serializeConditions(conditions) {
  return conditions.map((cond) => {
    if (cond.type === 'flag') return `flag:${cond.key}=${cond.value}`
    if (cond.type === 'resource') return `resource:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'variable') return `variable:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'timeWindow') return `timeWindow:${cond.start}-${cond.end}`
    if (cond.type === 'and') return `and(${serializeConditions(cond.conditions)})`
    if (cond.type === 'or') return `or(${serializeConditions(cond.conditions)})`
    if (cond.type === 'not') return `not(${serializeConditions([cond.condition])})`
    return ''
  }).filter(Boolean).join(';')
}

// 効果のシリアライズ
function serializeEffects(effects) {
  return effects.map((eff) => {
    if (eff.type === 'setFlag') return `setFlag:${eff.key}=${eff.value}`
    if (eff.type === 'addResource') return `addResource:${eff.key}=${eff.delta}`
    if (eff.type === 'setVariable') return `setVariable:${eff.key}=${eff.value}`
    if (eff.type === 'multiplyResource') return `multiplyResource:${eff.key}=${eff.factor}`
    if (eff.type === 'setResource') return `setResource:${eff.key}=${eff.value}`
    if (eff.type === 'randomEffect') {
      const effectStrings = eff.effects.map(e => serializeEffects([e])[0])
      return `randomEffect:${effectStrings.join('|')}`
    }
    if (eff.type === 'conditionalEffect') {
      const conditionStr = serializeConditions([eff.condition])[0]
      const effectStr = serializeEffects([eff.effect])[0]
      return `conditionalEffect:${conditionStr}?${effectStr}`
    }
    if (eff.type === 'goto') return `goto:${eff.target}`
    return ''
  }).filter(Boolean).join(';')
}

// キー=値ペアのシリアライズ
function serializeKeyValuePairs(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(';')
}

function escapeCsv(s) {
  if (s == null) return ''
  const needsQuote = /[",\n]/.test(s)
  const t = String(s).replace(/"/g, '""')
  return needsQuote ? '"' + t + '"' : t
}

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
  if (e.target.classList.contains('paraphrase-btn')) {
    const nodeId = e.target.dataset.nodeId
    const choiceIndex = e.target.dataset.choiceIndex
    const input = nodeList.querySelector(
      `input[data-node-id="${nodeId}"][data-choice-index="${choiceIndex}"][data-field="text"]`,
    )
    if (!input) return

    try {
      // 複数のバリアントを生成（デザイナー辞書を使用）
      const variants = paraphraseJa(input.value, { variantCount: 3 })
      if (variants.length === 0) {
        setStatus('言い換えバリアントを生成できませんでした', 'warn')
        return
      }

      // バリアント選択モーダルを表示
      showParaphraseVariants(input, variants)
    } catch (err) {
      console.error('言い換えエラー:', err)
      setStatus(`言い換えに失敗しました: ${err?.message ?? err}`, 'warn')
    }
  }
  if (e.target.classList.contains('add-choice-btn')) {
    const nodeId = e.target.dataset.nodeId
    const node = appState.model.nodes[nodeId]
    if (!node.choices) node.choices = []
    node.choices.push({
      id: `c${node.choices.length + 1}`,
      text: '新しい選択肢',
      target: nodeId
    })
    renderChoicesForNode(nodeId)
  }

  if (e.target.classList.contains('delete-node-btn')) {
    const nodeId = e.target.dataset.nodeId
    if (Object.keys(appState.model.nodes).length <= 1) {
      setStatus('少なくとも1つのノードが必要です', 'warn')
      return
    }
    delete appState.model.nodes[nodeId]
    // Remove references to deleted node
    for (const [nid, node] of Object.entries(appState.model.nodes)) {
      node.choices = node.choices?.filter(c => c.target !== nodeId) ?? []
    }
    renderNodeList()
  }

  if (e.target.classList.contains('delete-choice-btn')) {
    const nodeId = e.target.dataset.nodeId
    const choiceIndex = parseInt(e.target.dataset.choiceIndex)
    const node = appState.model.nodes[nodeId]
    node.choices.splice(choiceIndex, 1)
    renderChoicesForNode(nodeId)
  }
})

// 入力変更でモデル更新
nodeList.addEventListener('input', (e) => {
  updateModelFromInput(e.target)
})

// フォーカス外れ時にもモデル更新（フォールバック）
nodeList.addEventListener('blur', (e) => {
  if (e.target.tagName === 'INPUT') {
    updateModelFromInput(e.target)
  }
}, true)

function updateModelFromInput(input) {
  if (!input.dataset.nodeId) return

  const nodeId = input.dataset.nodeId
  const choiceIndex = input.dataset.choiceIndex
  const field = input.dataset.field
  const value = input.value

  if (choiceIndex !== undefined) {
    // 選択肢のフィールド更新
    const node = appState.model.nodes[nodeId]
    const choice = node.choices[parseInt(choiceIndex)]
    if (choice) {
      choice[field] = value
    }
  } else {
    // ノードのフィールド更新
    const node = appState.model.nodes[nodeId]
    if (node) {
      node[field] = value
    }
  }

  // Auto-save draft when editing in GUI mode
  if (guiEditMode.style.display !== 'none') {
    saveDraftModel()
  }
}

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

function showParaphraseVariants(targetInput, variants) {
  currentParaphraseTarget = targetInput
  const variantList = document.getElementById('variantList')
  variantList.innerHTML = ''

  variants.forEach((variant, index) => {
    const variantItem = document.createElement('div')
    variantItem.className = 'variant-item'
    variantItem.textContent = `${index + 1}. ${variant}`
    variantItem.addEventListener('click', () => {
      selectParaphraseVariant(variant)
    })
    variantList.appendChild(variantItem)
  })

  const modal = document.getElementById('paraphraseModal')
  modal.style.display = 'flex'
  modal.classList.add('show')
}

function selectParaphraseVariant(variant) {
  if (currentParaphraseTarget) {
    currentParaphraseTarget.value = variant
    // モデルに変更を反映
    updateModelFromInput(currentParaphraseTarget)
    setStatus('言い換えバリアントを適用しました', 'success')
  }
  hideParaphraseModal()
}

function hideParaphraseModal() {
  const modal = document.getElementById('paraphraseModal')
  modal.style.display = 'none'
  modal.classList.remove('show')
  currentParaphraseTarget = null
}

// モーダルイベントリスナー
document.getElementById('cancelParaphraseBtn').addEventListener('click', hideParaphraseModal)

// モーダル外クリックで閉じる
document.getElementById('paraphraseModal').addEventListener('click', (e) => {
  if (e.target.id === 'paraphraseModal') {
    hideParaphraseModal()
  }
})

// Initialize status and check for draft model on load
initLexiconUI()
checkForDraftModel()
setStatus('初期化完了 - モデルを読み込んでください', 'info')

// Batch edit event listeners
if (batchEditBtn) batchEditBtn.addEventListener('click', () => batchEditManager.openModal())
if (applyTextReplaceBtn) applyTextReplaceBtn.addEventListener('click', () => batchEditManager.applyTextReplace())
if (applyChoiceReplaceBtn) applyChoiceReplaceBtn.addEventListener('click', () => batchEditManager.applyChoiceReplace())
if (applyTargetReplaceBtn) applyTargetReplaceBtn.addEventListener('click', () => batchEditManager.applyTargetReplace())
if (closeBatchEditBtn) closeBatchEditBtn.addEventListener('click', () => batchEditManager.closeModal())

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

function generateNodeId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `node_${timestamp}_${random}`
}

function openQuickNodeModal() {
  if (!_model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  
  const modal = document.getElementById('quickNodeModal')
  document.getElementById('quickNodeId').value = ''
  document.getElementById('quickNodeText').value = ''
  document.getElementById('nodeTemplate').value = 'blank'
  modal.style.display = 'flex'
  modal.classList.add('show')
}

function createQuickNode() {
  const templateKey = document.getElementById('nodeTemplate').value
  let nodeId = document.getElementById('quickNodeId').value.trim()
  const nodeText = document.getElementById('quickNodeText').value.trim()
  
  // Generate ID if not provided
  if (!nodeId) {
    nodeId = generateNodeId()
  }
  
  // Check if ID already exists
  if (_model.nodes[nodeId]) {
    setStatus(`❌ ノードID「${nodeId}」は既に存在します`, 'error')
    return
  }
  
  // Get template
  const template = NODE_TEMPLATES[templateKey]
  const newNode = {
    id: nodeId,
    text: nodeText || template.text,
    choices: JSON.parse(JSON.stringify(template.choices)) // Deep copy
  }
  
  // Add to model
  _model.nodes[nodeId] = newNode
  
  // Close modal
  document.getElementById('quickNodeModal').style.display = 'none'
  document.getElementById('quickNodeModal').classList.remove('show')
  
  // Refresh UI
  if (typeof renderNodeList === 'function') {
    renderNodeList()
  }
  
  setStatus(`✅ ノード「${nodeId}」を作成しました`, 'success')
  Logger.info('Quick node created', { nodeId, template: templateKey })
}

// Event listeners for quick node creation
const cancelQuickNodeBtn = document.getElementById('cancelQuickNodeBtn')
const createQuickNodeBtn = document.getElementById('createQuickNodeBtn')

if (cancelQuickNodeBtn) {
  cancelQuickNodeBtn.addEventListener('click', () => {
    document.getElementById('quickNodeModal').style.display = 'none'
    document.getElementById('quickNodeModal').classList.remove('show')
  })
}

if (createQuickNodeBtn) {
  createQuickNodeBtn.addEventListener('click', createQuickNode)
}

// Add keyboard shortcut: N key for quick node creation (in GUI edit mode)
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  
  if (e.key.toLowerCase() === 'n' && guiEditMode && guiEditMode.style.display !== 'none') {
    e.preventDefault()
    openQuickNodeModal()
  }
})

// ===========================
// Batch Choice Edit
// ===========================
function openBatchChoiceModal() {
  if (!_model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  
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

function updateBatchChoiceList() {
  const nodeId = document.getElementById('batchNodeSelect').value
  const choiceList = document.getElementById('batchChoiceList')
  
  if (!nodeId || !_model.nodes[nodeId]) {
    choiceList.innerHTML = '<p style="color: #6b7280;">ノードを選択してください</p>'
    return
  }
  
  const node = _model.nodes[nodeId]
  const choices = node.choices || []
  
  if (choices.length === 0) {
    choiceList.innerHTML = '<p style="color: #6b7280;">このノードには選択肢がありません</p>'
    return
  }
  
  choiceList.innerHTML = '<div style="display: flex; flex-direction: column; gap: 0.5rem;"></div>'
  const container = choiceList.firstElementChild
  
  choices.forEach((choice, index) => {
    const div = document.createElement('div')
    div.style.cssText = 'padding: 0.75rem; background: rgba(255,255,255,0.5); border-radius: 4px; border: 1px solid rgba(0,0,0,0.1);'
    div.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.25rem;">選択肢 ${index + 1}</div>
      <div style="font-size: 0.9em; color: #6b7280;">${choice.text || '(テキストなし)'}</div>
      <div style="font-size: 0.85em; color: #9ca3af; margin-top: 0.25rem;">→ ${choice.target || '(ターゲットなし)'}</div>
    `
    container.appendChild(div)
  })
}

function applyBatchChoice() {
  const nodeId = document.getElementById('batchNodeSelect').value
  if (!nodeId || !_model.nodes[nodeId]) {
    setStatus('❌ ノードを選択してください', 'error')
    return
  }
  
  const node = _model.nodes[nodeId]
  const applyCondition = document.getElementById('batchCondition').checked
  const applyEffect = document.getElementById('batchEffect').checked
  const conditionText = document.getElementById('batchConditionText').value.trim()
  const effectText = document.getElementById('batchEffectText').value.trim()
  
  let modified = 0
  
  if (node.choices) {
    node.choices.forEach(choice => {
      if (applyCondition && conditionText) {
        choice.conditions = choice.conditions || []
        // Simple parsing - in production, use proper parser
        choice.conditions.push(conditionText)
        modified++
      }
      if (applyEffect && effectText) {
        choice.effects = choice.effects || []
        choice.effects.push(effectText)
        modified++
      }
    })
  }
  
  // Close modal
  document.getElementById('batchChoiceModal').style.display = 'none'
  document.getElementById('batchChoiceModal').classList.remove('show')
  
  // Refresh UI
  if (typeof renderNodeList === 'function') {
    renderNodeList()
  }
  
  setStatus(`✅ ${node.choices.length}個の選択肢に変更を適用しました`, 'success')
  Logger.info('Batch choice edit applied', { nodeId, modified })
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
  batchNodeSelect.addEventListener('change', updateBatchChoiceList)
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
  applyBatchChoiceBtn.addEventListener('click', applyBatchChoice)
}

// Add button listeners for quick node and batch choice
const quickNodeBtn = document.getElementById('quickNodeBtn')
const batchChoiceBtn = document.getElementById('batchChoiceBtn')

if (quickNodeBtn) {
  quickNodeBtn.addEventListener('click', openQuickNodeModal)
}

if (batchChoiceBtn) {
  batchChoiceBtn.addEventListener('click', openBatchChoiceModal)
}

// ===========================
// Reference / API Documentation System
// ===========================

const REFERENCE_DOCS = [
  {
    id: 'model-structure',
    category: 'basic',
    title: 'モデルの基本構造',
    tags: ['モデル', '構造', 'JSON', 'ノード'],
    content: `
## モデルの基本構造

NarrativeGenのストーリーモデルは以下の構造を持ちます：

\`\`\`json
{
  "metadata": {
    "title": "ストーリータイトル",
    "author": "作者名",
    "version": "1.0.0"
  },
  "startNode": "start",
  "nodes": {
    "start": {
      "id": "start",
      "text": "物語の始まり",
      "choices": []
    }
  }
}
\`\`\`

### 必須フィールド

- **startNode**: 開始ノードのID
- **nodes**: ノードの辞書（キー: ノードID, 値: ノードオブジェクト）

### オプションフィールド

- **metadata**: メタデータ（タイトル、作者、バージョン等）
`
  },
  {
    id: 'node-structure',
    category: 'basic',
    title: 'ノードの構造',
    tags: ['ノード', 'テキスト', '選択肢'],
    content: `
## ノードの構造

各ノードは以下の構造を持ちます：

\`\`\`json
{
  "id": "node1",
  "text": "ノードのテキスト",
  "choices": [
    {
      "id": "choice1",
      "text": "選択肢のテキスト",
      "target": "next_node"
    }
  ]
}
\`\`\`

### フィールド説明

- **id** (必須): ノードの一意なID
- **text** (必須): ノードに表示されるテキスト
- **choices** (オプション): 選択肢の配列（空の場合はエンディング）
`
  },
  {
    id: 'choices',
    category: 'choice',
    title: '選択肢の作成',
    tags: ['選択肢', 'choice', 'ターゲット'],
    content: `
## 選択肢の作成

選択肢は\`choices\`配列に定義します：

\`\`\`json
"choices": [
  {
    "id": "choice1",
    "text": "友好的に話しかける",
    "target": "friendly_path"
  },
  {
    "id": "choice2",
    "text": "警戒する",
    "target": "cautious_path"
  }
]
\`\`\`

### 選択肢の必須フィールド

- **id**: 選択肢の一意なID
- **text**: プレイヤーに表示される選択肢のテキスト
- **target**: 選択時に移動する次のノードのID

### 選択肢がないノード

選択肢がない（\`choices: []\`）ノードはエンディングとして扱われます。
`
  },
  {
    id: 'conditions',
    category: 'condition',
    title: '条件分岐',
    tags: ['条件', 'condition', 'フラグ', 'flag'],
    content: `
## 条件分岐

選択肢に条件を設定して、特定の状況でのみ表示できます：

\`\`\`json
{
  "id": "special_choice",
  "text": "特別な選択肢",
  "target": "special_path",
  "conditions": [
    {"type": "flag", "key": "has_key", "value": true}
  ]
}
\`\`\`

### 条件タイプ

#### 1. フラグ条件
\`\`\`json
{"type": "flag", "key": "visited_town", "value": true}
\`\`\`

#### 2. リソース条件
\`\`\`json
{"type": "resource", "key": "gold", "value": 100, "operator": ">="}
\`\`\`

#### 3. 複数条件（AND）
\`\`\`json
"conditions": [
  {"type": "flag", "key": "has_sword", "value": true},
  {"type": "resource", "key": "hp", "value": 50, "operator": ">"}
]
\`\`\`

すべての条件が満たされた場合のみ選択肢が表示されます。
`
  },
  {
    id: 'effects',
    category: 'effect',
    title: '効果の設定',
    tags: ['効果', 'effect', 'フラグ設定', 'リソース変更'],
    content: `
## 効果の設定

選択肢に効果を設定して、選択時に状態を変更できます：

\`\`\`json
{
  "id": "buy_item",
  "text": "剣を購入する",
  "target": "shop_success",
  "effects": [
    {"type": "setFlag", "key": "has_sword", "value": true},
    {"type": "modifyResource", "key": "gold", "value": -100}
  ]
}
\`\`\`

### 効果タイプ

#### 1. フラグ設定
\`\`\`json
{"type": "setFlag", "key": "quest_completed", "value": true}
\`\`\`

#### 2. リソース変更
\`\`\`json
{"type": "modifyResource", "key": "hp", "value": -20}
{"type": "modifyResource", "key": "gold", "value": 50}
\`\`\`

#### 3. 複数効果
選択時に複数の効果を同時に適用できます：

\`\`\`json
"effects": [
  {"type": "setFlag", "key": "battle_won", "value": true},
  {"type": "modifyResource", "key": "exp", "value": 100},
  {"type": "modifyResource", "key": "hp", "value": -30}
]
\`\`\`
`
  },
  {
    id: 'resources',
    category: 'resource',
    title: 'リソース管理',
    tags: ['リソース', 'resource', 'HP', 'ゴールド'],
    content: `
## リソース管理

リソースはゲーム内の数値を管理します（HP、ゴールド、経験値など）。

### 初期リソース設定

モデルのトップレベルで初期値を設定：

\`\`\`json
{
  "startNode": "start",
  "initialState": {
    "resources": {
      "hp": 100,
      "gold": 50,
      "exp": 0
    }
  },
  "nodes": { ... }
}
\`\`\`

### リソースの変更

選択肢の効果で変更：

\`\`\`json
"effects": [
  {"type": "modifyResource", "key": "gold", "value": -30}
]
\`\`\`

### リソース条件

特定のリソース値で選択肢の表示を制御：

\`\`\`json
"conditions": [
  {"type": "resource", "key": "gold", "value": 100, "operator": ">="}
]
\`\`\`

#### 演算子

- \`>=\`: 以上
- \`>\`: より大きい
- \`<=\`: 以下
- \`<\`: より小さい
- \`==\`: 等しい
`
  },
  {
    id: 'flags',
    category: 'condition',
    title: 'フラグシステム',
    tags: ['フラグ', 'flag', 'bool', '状態管理'],
    content: `
## フラグシステム

フラグはゲーム内の状態を真偽値で管理します。

### フラグの設定

選択肢の効果で設定：

\`\`\`json
"effects": [
  {"type": "setFlag", "key": "met_npc_alice", "value": true}
]
\`\`\`

### フラグ条件

フラグで選択肢の表示を制御：

\`\`\`json
"conditions": [
  {"type": "flag", "key": "has_key", "value": true}
]
\`\`\`

### フラグの否定

フラグがfalseの場合に選択肢を表示：

\`\`\`json
"conditions": [
  {"type": "flag", "key": "door_opened", "value": false}
]
\`\`\`

### ベストプラクティス

- フラグ名は分かりやすく（例: \`quest_1_completed\`, \`met_boss\`）
- 命名規則を統一（スネークケース推奨）
- 重要なイベントにフラグを設定
`
  },
  {
    id: 'multiple-endings',
    category: 'advanced',
    title: 'マルチエンディング',
    tags: ['エンディング', 'ending', '分岐', 'マルチ'],
    content: `
## マルチエンディング

複数のエンディングを持つストーリーを作成できます。

### エンディングノードの作成

エンディングは選択肢がないノードとして定義：

\`\`\`json
{
  "good_ending": {
    "id": "good_ending",
    "text": "【ハッピーエンド】\\n\\nあなたは平和を取り戻しました。",
    "choices": []
  },
  "bad_ending": {
    "id": "bad_ending",
    "text": "【バッドエンド】\\n\\n残念ながら失敗してしまいました。",
    "choices": []
  },
  "true_ending": {
    "id": "true_ending",
    "text": "【トゥルーエンド】\\n\\n真実を知り、新たな未来が開けました。",
    "choices": []
  }
}
\`\`\`

### エンディング分岐の設計

フラグやリソースで分岐：

\`\`\`json
{
  "final_choice": {
    "id": "final_choice",
    "text": "最後の選択...",
    "choices": [
      {
        "id": "heroic",
        "text": "勇気を持って立ち向かう",
        "target": "good_ending",
        "conditions": [
          {"type": "flag", "key": "hero_path", "value": true}
        ]
      },
      {
        "id": "peaceful",
        "text": "平和的な解決を目指す",
        "target": "true_ending",
        "conditions": [
          {"type": "flag", "key": "wisdom_path", "value": true},
          {"type": "resource", "key": "charisma", "value": 80, "operator": ">="}
        ]
      }
    ]
  }
}
\`\`\`
`
  },
  {
    id: 'time-gate',
    category: 'advanced',
    title: 'タイムゲート',
    tags: ['タイムゲート', '時間制限', 'タイマー'],
    content: `
## タイムゲート

時間制限付きの選択肢や、プレイ時間による分岐を実装できます。

### タイムゲート条件

\`\`\`json
{
  "id": "timed_choice",
  "text": "急いで決断しなければならない",
  "choices": [
    {
      "id": "quick_decision",
      "text": "即座に行動する",
      "target": "quick_path",
      "conditions": [
        {"type": "time", "key": "elapsed_seconds", "value": 10, "operator": "<"}
      ]
    },
    {
      "id": "slow_decision",
      "text": "慎重に考える",
      "target": "slow_path",
      "conditions": [
        {"type": "time", "key": "elapsed_seconds", "value": 10, "operator": ">="}
      ]
    }
  ]
}
\`\`\`

### 実装例

実際のゲーム実装では、セッション開始からの経過時間を追跡します。

**注意**: 現在のWeb Testerでは時間条件は部分的なサポートのみです。
`
  },
  {
    id: 'paraphrase',
    category: 'advanced',
    title: 'テキスト言い換え',
    tags: ['言い換え', 'paraphrase', 'バリエーション', 'AI'],
    content: `
## テキスト言い換え

同じテキストに複数のバリエーションを持たせることができます。

### 辞書ベースの言い換え

アドバンスドタブの「言い換え辞書」でキーワードと同義語を定義：

\`\`\`json
{
  "剣": ["刀", "ブレード", "剣閃"],
  "勇者": ["英雄", "戦士", "冒険者"],
  "魔王": ["魔神", "暗黒卿", "邪悪な王"]
}
\`\`\`

### AI言い換え（オプション）

AIプロバイダーを設定することで、自動言い換えが可能：

1. アドバンスド設定でAIを有効化
2. プロバイダー（OpenAI / Ollama）を選択
3. API Keyを設定
4. ノードを選択して「言い換え」ボタンをクリック

### ユースケース

- 同じストーリーでも読むたびに印象が変わる
- プレイヤーの好みに合わせた語彙選択
- ローカライゼーション対応
`
  },
  {
    id: 'csv-import-export',
    category: 'basic',
    title: 'CSV インポート/エクスポート',
    tags: ['CSV', 'スプレッドシート', 'Excel', 'インポート', 'エクスポート'],
    content: `
## CSV インポート/エクスポート

スプレッドシート（Excel, Google Sheetsなど）でストーリーを編集できます。

### CSVエクスポート

1. ストーリータブで「CSV出力」ボタンをクリック
2. CSVファイルがダウンロードされる
3. Excel / Google Sheetsで開く

### CSV形式

| NodeID | Text | ChoiceID | ChoiceText | Target | Conditions | Effects |
|--------|------|----------|------------|--------|------------|---------|
| start | 始まりのテキスト | c1 | 選択肢1 | node2 | | |
| start | | c2 | 選択肢2 | node3 | flag:has_key=true | setFlag:visited=true |

### CSVインポート

1. CSVを編集して保存
2. ストーリータブで「CSV読込」ボタンをクリック
3. ファイルを選択

### 注意事項

- NodeIDは一意である必要がある
- 条件と効果は簡易記法を使用（例: \`flag:key=true\`, \`resource:gold>=100\`）
- 複数の選択肢は同じNodeIDで複数行に記述
`
  },
  {
    id: 'gui-editor',
    category: 'basic',
    title: 'GUIエディタの使い方',
    tags: ['エディタ', 'GUI', '編集', 'ノード作成'],
    content: `
## GUIエディタの使い方

ビジュアルエディタでストーリーを編集できます。

### エディタを開く

1. モデルを読み込む
2. ストーリータブで「編集」ボタンをクリック

### 基本操作

#### ノードの追加

- **従来方式**: 「ノードを追加」ボタン
- **クイック作成**: 「クイックノード作成」ボタンまたは \`N\` キー

#### ノードの編集

- ノードをクリックして展開
- テキストを編集
- 選択肢を追加/削除

#### 選択肢の一括編集

1. 「選択肢一括編集」ボタンをクリック
2. 対象ノードを選択
3. 共通条件・効果を設定

### ショートカット

- \`N\`: クイックノード作成
- \`Ctrl+S\`: 保存（GUIモード内）

### 保存と適用

「保存して適用」ボタンで編集内容を反映します。
`
  },
  {
    id: 'validation',
    category: 'advanced',
    title: 'モデル検証',
    tags: ['検証', 'バリデーション', 'エラー', 'デバッグ'],
    content: `
## モデル検証

ストーリーモデルの整合性を自動チェックします。

### 自動検証項目

#### 1. 必須フィールド

- \`startNode\` が存在するか
- \`nodes\` が定義されているか
- 各ノードに \`id\` と \`text\` があるか

#### 2. 参照整合性

- \`startNode\` が \`nodes\` に存在するか
- 選択肢の \`target\` が存在するノードを指しているか

#### 3. 到達不可能ノード

- すべてのノードがストーリーから到達可能か
- 孤立したノードの検出

#### 4. 無限ループ

- 選択肢がなく次のノードにも進めないループ
- 循環参照の検出

### エラー確認方法

1. モデルを読み込む
2. エラーがある場合、画面上部にエラーパネルが表示される
3. デバッグタブで詳細を確認

### デバッグのコツ

- エラーメッセージをよく読む
- ノードグラフタブでビジュアル確認
- 1つずつ修正してテスト
`
  }
]

// 目次を生成
function renderReferenceToc(filter = { category: 'all', search: '' }) {
  const tocContainer = document.getElementById('referenceToc')
  if (!tocContainer) return

  let filteredDocs = REFERENCE_DOCS

  // カテゴリーフィルタ
  if (filter.category !== 'all') {
    filteredDocs = filteredDocs.filter(doc => doc.category === filter.category)
  }

  // 検索フィルタ
  if (filter.search.trim()) {
    const query = filter.search.toLowerCase()
    filteredDocs = filteredDocs.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
      doc.content.toLowerCase().includes(query)
    )
  }

  // 目次レンダリング
  if (filteredDocs.length === 0) {
    tocContainer.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 1rem; font-size: 0.9rem;">該当する項目がありません</p>`
    return
  }

  tocContainer.innerHTML = filteredDocs.map(doc => `
    <div class="ref-toc-item" data-doc-id="${doc.id}" style="padding: 0.5rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; transition: all 0.2s ease; font-size: 0.9rem;">
      ${doc.title}
    </div>
  `).join('')

  // 目次アイテムのクリックイベント
  document.querySelectorAll('.ref-toc-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(59, 130, 246, 0.1)'
      item.style.color = 'var(--color-secondary)'
    })
    item.addEventListener('mouseleave', () => {
      if (!item.classList.contains('active')) {
        item.style.background = 'transparent'
        item.style.color = 'inherit'
      }
    })
    item.addEventListener('click', () => {
      document.querySelectorAll('.ref-toc-item').forEach(i => {
        i.classList.remove('active')
        i.style.background = 'transparent'
        i.style.color = 'inherit'
      })
      item.classList.add('active')
      item.style.background = 'rgba(59, 130, 246, 0.15)'
      item.style.color = 'var(--color-secondary)'
      item.style.fontWeight = '600'
      
      const docId = item.dataset.docId
      renderSingleDoc(docId)
    })
  })
}

// 簡易Markdownパーサー
function parseMarkdown(markdown) {
  let html = markdown
  
  // 1. コードブロックを一時的に保護
  const codeBlocks = []
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length
    const trimmedCode = code.trim()
    const isJson = lang === 'json' || (trimmedCode.startsWith('{') || trimmedCode.startsWith('['))
    const codeId = `code-${Date.now()}-${index}`
    
    let buttons = `
      <div style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.5rem; opacity: 0.8;">
        <button onclick="copyCodeToClipboard('${codeId}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: rgba(59, 130, 246, 0.8); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;" title="コピー">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          コピー
        </button>`
    
    if (isJson) {
      buttons += `
        <button onclick="loadJsonSample('${codeId}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: rgba(16, 185, 129, 0.8); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;" title="このサンプルを読み込む">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
          読み込む
        </button>`
    }
    
    buttons += `</div>`
    
    codeBlocks.push(`<pre id="${codeId}" style="position: relative; background: #1e1e2f; color: #e0e7ff; padding: 1rem; padding-top: 2.5rem; border-radius: 4px; overflow-x: auto; margin: 1rem 0;">${buttons}<code>${trimmedCode}</code></pre>`)
    return `__CODE_BLOCK_${index}__`
  })
  
  // 2. 見出しの変換
  html = html.replace(/^#### (.+)$/gm, '<h4 style="color: var(--color-text); margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 style="color: var(--color-text); margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="color: var(--color-secondary); margin-top: 2.5rem; margin-bottom: 1.25rem; border-bottom: 3px solid var(--color-secondary); padding-bottom: 0.75rem;">$1</h2>')
  
  // 3. 箇条書きリストの変換
  html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem;">$1</li>')
  html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin: 1rem 0; padding-left: 0;">$&</ul>')
  
  // 4. インラインコードの変換
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 0.2rem 0.4rem; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>')
  
  // 5. 太字の変換
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  
  // 6. 段落の変換
  html = html.split('\n\n').map(para => {
    para = para.trim()
    if (para && !para.startsWith('<')) {
      return `<p style="margin: 1rem 0;">${para}</p>`
    }
    return para
  }).join('\n')
  
  // 7. コードブロックを復元
  codeBlocks.forEach((code, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, code)
  })
  
  return html
}

// 単一ドキュメントを表示
function renderSingleDoc(docId) {
  const container = document.getElementById('referenceContent')
  if (!container) return

  const doc = REFERENCE_DOCS.find(d => d.id === docId)
  if (!doc) return

  container.innerHTML = `
    <div>
      <h2 style="margin-top: 0; color: var(--color-secondary);">${doc.title}</h2>
      <div style="margin-bottom: 1.5rem;">
        ${doc.tags.map(tag => `<span style="display: inline-block; background: rgba(59, 130, 246, 0.1); color: var(--color-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85em; margin-right: 0.5rem;">${tag}</span>`).join('')}
      </div>
      <div class="ref-content" style="line-height: 1.8; font-size: 1rem;">
        ${parseMarkdown(doc.content)}
      </div>
    </div>
  `
  
  // スクロールをトップに
  container.scrollTop = 0
}

// コードブロックをクリップボードにコピー
window.copyCodeToClipboard = function(codeId) {
  const codeBlock = document.getElementById(codeId)
  if (!codeBlock) return
  
  const codeElement = codeBlock.querySelector('code')
  const code = codeElement.textContent
  
  navigator.clipboard.writeText(code).then(() => {
    // コピー成功のフィードバック
    const button = codeBlock.querySelector('button[onclick*="copyCodeToClipboard"]')
    const originalText = button.innerHTML
    button.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> コピー完了！`
    button.style.background = 'rgba(16, 185, 129, 0.8)'
    
    setTimeout(() => {
      button.innerHTML = originalText
      button.style.background = 'rgba(59, 130, 246, 0.8)'
    }, 2000)
  }).catch(err => {
    console.error('コピーに失敗しました:', err)
    alert('クリップボードへのコピーに失敗しました')
  })
}

// JSONサンプルをストーリータブに読み込む（GUI編集モードを有効化）
window.loadJsonSample = function(codeId) {
  const codeBlock = document.getElementById(codeId)
  if (!codeBlock) {
    console.error('Code block not found:', codeId)
    return
  }
  
  const codeElement = codeBlock.querySelector('code')
  if (!codeElement) {
    console.error('Code element not found in block:', codeId)
    return
  }
  
  // textContentで取得し、余分な空白を除去
  let jsonString = codeElement.textContent.trim()
  
  // HTMLエンティティをデコード
  const textarea = document.createElement('textarea')
  textarea.innerHTML = jsonString
  jsonString = textarea.value
  
  console.log('Attempting to parse JSON:', jsonString.substring(0, 100))
  
  try {
    // JSONの妥当性チェック
    const parsed = JSON.parse(jsonString)
    console.log('JSON parsed successfully:', parsed)
    
    // GUI編集モードを有効化してJSONを読み込む
    if (session == null) {
      setStatus('モデルを読み込んでからサンプルを読み込んでください', 'warn')
      return
    }
    
    // 現在のモデルを更新
    Object.assign(_model, parsed)
    
    // GUI編集モードを表示
    storyPanel.classList.remove('active')
    graphPanel.classList.remove('active')
    debugPanel.classList.remove('active')
    if (referencePanel) referencePanel.classList.remove('active')
    
    renderNodeList()
    guiEditMode.style.display = 'block'
    setControlsEnabled(false)
    
    // 成功のフィードバック
    console.log('Showing success toast')
    showToast('サンプルをGUI編集モードに読み込みました', 'success')
    
    // ボタンのフィードバック
    const button = codeBlock.querySelector('button[onclick*="loadJsonSample"]')
    if (button) {
      const originalText = button.innerHTML
      button.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 読み込み完了`
      
      setTimeout(() => {
        button.innerHTML = originalText
      }, 2000)
    }
  } catch (err) {
    console.error('JSONのパースに失敗しました:', err)
    console.error('Failed JSON string:', jsonString)
    showToast(`JSONの形式が正しくありません: ${err.message}`, 'error')
  }
}

// トースト通知を表示
function showToast(message, type = 'info') {
  const existingToast = document.getElementById('toast-notification')
  if (existingToast) {
    existingToast.remove()
  }
  
  const toast = document.createElement('div')
  toast.id = 'toast-notification'
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-size: 0.95rem;
    z-index: 10000;
    animation: slideInUp 0.3s ease-out;
  `
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.animation = 'slideOutDown 0.3s ease-in'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

function renderReferenceContent(filter = { category: 'all', search: '' }) {
  renderReferenceToc(filter)
}

// リファレンスタブのイベントリスナー
const referenceTab = document.getElementById('referenceTab')
const referencePanel = document.getElementById('referencePanel')
const refSearch = document.getElementById('refSearch')
const refCategorySelect = document.getElementById('refCategorySelect')

if (referenceTab && referencePanel) {
  referenceTab.addEventListener('click', () => switchTab('reference'))
  
  // 初期レンダリング
  renderReferenceContent()

  // 検索
  if (refSearch) {
    refSearch.addEventListener('input', (e) => {
      const category = refCategorySelect?.value || 'all'
      renderReferenceContent({ category, search: e.target.value })
    })
  }

  // カテゴリー切り替え
  if (refCategorySelect) {
    refCategorySelect.addEventListener('change', (e) => {
      const search = refSearch?.value || ''
      renderReferenceContent({ category: e.target.value, search })
    })
  }
}

// ============================================================================
// Module Initialization
// ============================================================================

// Initialize modules
const appState = new AppState()
const dom = new DOMManager()
const eventManager = new EventManager()
const storyManager = new StoryManager(appState)

// Initialize story manager
storyManager.initialize(document.getElementById('storyPanel'))
