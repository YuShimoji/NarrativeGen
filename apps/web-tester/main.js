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

// Force layout isolation from external styles (IDE preview, extensions, etc.)
// This runs immediately to prevent layout shift
;(function forceLayoutIsolation() {
  const forceStyles = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
    }
    .app-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 9999 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .panel {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
    }
  `
  const styleEl = document.createElement('style')
  styleEl.id = 'narrativegen-layout-isolation'
  styleEl.textContent = forceStyles
  document.head.appendChild(styleEl)
  
  // Also apply inline styles as fallback
  const appContainer = document.querySelector('.app-container')
  if (appContainer) {
    appContainer.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; max-width: 100vw !important; margin: 0 !important; padding: 0 !important; z-index: 9999 !important; display: flex !important; flex-direction: column !important; overflow: hidden;'
  }
  
  const panel = document.querySelector('.panel')
  if (panel) {
    panel.style.cssText = 'width: 100% !important; max-width: none !important; margin: 0 !important; flex: 1; display: flex; flex-direction: column; min-height: 0;'
  }
})()

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
import { ThemeManager, setupThemeEventListeners } from './src/ui/theme.js'
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
import { MermaidPreviewManager } from './src/ui/mermaid-preview.js'
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
import { KeyBindingManager } from './src/ui/keybinding-manager.js'
import { SaveManager } from './src/features/save-manager.js'
import { ValidationPanel } from './src/ui/validation-panel.js'
import { ModelValidator, ValidationSeverity } from './src/features/model-validator.js'
import { LexiconUIManager } from './src/ui/lexicon-ui-manager.js'
import { KeyBindingUIManager } from './src/ui/key-binding-ui-manager.js'
import {
  SAVE_SLOTS,
  SAVE_KEY_PREFIX,
  AUTOSAVE_KEY,
  NODE_TEMPLATES,
  ADVANCED_ENABLED_STORAGE_KEY,
  DRAFT_MODEL_STORAGE_KEY
} from './src/config/constants.js'

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

function applyModelParaphraseLexicon(model) {
  if (!model || !model.meta || !model.meta.paraphraseLexicon) return

  const runtimeLexicon = model.meta.paraphraseLexicon

  try {
    setParaphraseLexicon(runtimeLexicon, { merge: true })
  } catch (e) {
    Logger.warn('Failed to apply model embedded paraphrase lexicon to engine', e)
  }

  try {
    if (typeof lexiconManager !== 'undefined' && lexiconManager && typeof lexiconManager.applyRuntimeLexicon === 'function') {
      lexiconManager.applyRuntimeLexicon(runtimeLexicon)
    }
  } catch (e) {
    Logger.warn('Failed to apply model embedded paraphrase lexicon to UI lexicon manager', e)
  }
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

// Initialize AppState early to avoid TDZ errors
const appState = new AppState()
let mermaidPreviewManager
const keyBindingManager = new KeyBindingManager()

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

// Search and Filter elements
const nodeSearchInput = document.getElementById('nodeSearchInput')
const clearSearchBtn = document.getElementById('clearSearchBtn')
const nodeFilterSelect = document.getElementById('nodeFilterSelect')
const searchResultCount = document.getElementById('searchResultCount')
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
const referenceTab = document.getElementById('referenceTab')
const storyPanel = document.getElementById('storyPanel')
const graphPanel = document.getElementById('graphPanel')
const debugPanel = document.getElementById('debugPanel')
const referencePanel = document.getElementById('referencePanel')

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
const mermaidKey = document.getElementById('mermaidKey')
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
    stateView.textContent = JSON.stringify({ status: 'サンプル未実行' })
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
  stateView.textContent = JSON.stringify(view)

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

// Debug info rendering (delegates to debugManager when available)
function renderDebugInfo() {
  if (typeof debugManager !== 'undefined' && debugManager) {
    debugManager.render()
  }
}

function validateModel(nodesOrModel) {
  try {
    const model = nodesOrModel?.nodes ? nodesOrModel : { nodes: nodesOrModel }
    const validator = new ModelValidator()
    const issues = validator.validate(model)
    return issues
      .filter((i) => i.severity === ValidationSeverity.ERROR)
      .map((i) => `${i.nodeId ? `[${i.nodeId}] ` : ''}${i.message}`)
  } catch (err) {
    return [err?.message ?? String(err)]
  }
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
// Save/Load System (via SaveManager)
// ============================================================================

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

// Update Mermaid diagram when visible and model is available
function updateMermaidDiagramIfVisible() {
  if (!mermaidPreviewManager || !mermaidPreviewManager.isVisible) return
  if (!appState?.model) return
  mermaidPreviewManager.updateDiagram(appState.model)
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
  applyModelParaphraseLexicon(model)
  appState.model = model
  startNewSession(appState.model)
  setCurrentModelName(modelName)
  initStory()
  renderState()
  renderChoices()
  renderStory()
  updateMermaidDiagramIfVisible()
  Logger.info('Session started', { modelName, nodeCount: Object.keys(model.nodes).length })
})

const safeApplyChoice = ErrorBoundary.wrap(async (choiceId) => {
  const currentSession = getCurrentSession()
  if (!currentSession || !appState.model) throw new Error('セッションが開始されていません')
  const nextSession = applyChoice(currentSession, appState.model, choiceId)
  setCurrentSession(nextSession)
  appendStoryFromCurrentNode()
  renderState()
  renderChoices()
  renderStory()
  updateMermaidDiagramIfVisible()
  Logger.info('Choice applied', { choiceId, newNodeId: nextSession.nodeId })
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
  const currentSession = getCurrentSession()
  if (!aiProviderInstance || !currentSession || !appState.model) {
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
      currentNodeText: appState.model.nodes[currentSession.nodeId]?.text || '',
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
  const currentSession = getCurrentSession()
  if (!aiProviderInstance || !currentSession || !appState.model) {
    aiOutput.textContent = '❌ モデルを読み込んでから実行してください'
    return
  }

  const currentNode = appState.model.nodes[currentSession.nodeId]
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

    applyModelParaphraseLexicon(model)
    appState.model = model
    startNewSession(appState.model)
    setCurrentModelName(sampleId)
    setStatus(`サンプル ${sampleId} を実行中`, 'success')
    initStory()
    startAutoSave() // Start auto-save when session begins
  } catch (err) {
    console.error(err)
    clearSession()
    stopAutoSave() // Stop auto-save when session ends
    setStatus(`サンプルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStory()
    updateMermaidDiagramIfVisible()
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

    applyModelParaphraseLexicon(model)
    appState.model = model
    startNewSession(appState.model)
    setCurrentModelName(file.name)
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
  } catch (err) {
    console.error(err)
    clearSession()
    stopAutoSave() // Stop auto-save when session ends
    setStatus(`ファイルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    updateMermaidDiagramIfVisible()
  }
})

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropZone.style.backgroundColor = '#e0e0e0'
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
    applyModelParaphraseLexicon(model)
    appState.model = model
    startNewSession(appState.model)
    setCurrentModelName(file.name)
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
    startAutoSave() // Start auto-save when session begins
  } catch (err) {
    console.error(err)
    showErrors([err?.message ?? err])
    clearSession()
    stopAutoSave() // Stop auto-save when session ends
    setStatus(`ファイルの初期化に失敗しました: ${err?.message ?? err}`, 'warn')
  } finally {
    setControlsEnabled(true)
    renderState()
    renderChoices()
    renderStory()
    updateMermaidDiagramIfVisible()
  }
})

// Load advanced features setting
const advancedEnabled = localStorage.getItem(ADVANCED_ENABLED_STORAGE_KEY) === 'true'
if (enableAdvancedFeatures) {
  enableAdvancedFeatures.checked = advancedEnabled
  if (advancedEnabled) {
    advancedTab.style.display = 'inline-block'
  }
  // Trigger change event to set up UI
  enableAdvancedFeatures.dispatchEvent(new Event('change'))
}

// Tab event listeners
function exitGuiEditMode() {
  if (!guiEditMode) return

  const isActive = guiEditMode.classList.contains('active') || guiEditMode.style.display !== 'none'
  if (!isActive) return

  guiEditMode.classList.remove('active')
  guiEditMode.style.display = 'none'

  if (storyPanel) {
    storyPanel.classList.add('active')
  }

  if (guiEditBtn) {
    guiEditBtn.textContent = '編集'
    guiEditBtn.innerHTML = '<svg class="icon icon-sm"><use href="#icon-edit"></use></svg>編集'
  }
}

function switchTab(tabName) {
  // タブ切り替え時は必ず GUI 編集モードを終了する
  exitGuiEditMode()

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
    keyBindingManager.updateUI()
  }
}

storyTab.addEventListener('click', () => switchTab('story'))
graphTab.addEventListener('click', () => switchTab('graph'))
debugTab.addEventListener('click', () => switchTab('debug'))
if (referenceTab) referenceTab.addEventListener('click', () => switchTab('reference'))
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
    localStorage.setItem(ADVANCED_ENABLED_STORAGE_KEY, enabled.toString())
  })
}

function initAIProviderInstance() {
  if (!aiProviderInstance) {
    aiProviderInstance = createAIProvider(aiConfig)
  }
}

async function generateNextNodeUI() {
  if (!aiProviderInstance) {
    initAIProviderInstance()
  }

  const currentSession = getCurrentSession()
  if (!currentSession || !appState.model) {
    setStatus('まずモデルを読み込んでセッションを開始してください', 'warn')
    return
  }

  const currentNode = appState.model.nodes[currentSession.nodeId]
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

function buildExportModel() {
  if (!appState.model) return null

  const exportModel = {
    ...appState.model,
    nodes: appState.model.nodes,
    meta: appState.model.meta ? { ...appState.model.meta } : {}
  }

  try {
    const runtimeLexicon = getParaphraseLexicon()
    if (runtimeLexicon && typeof runtimeLexicon === 'object' && Object.keys(runtimeLexicon).length > 0) {
      exportModel.meta.paraphraseLexicon = runtimeLexicon
    }
  } catch (e) {
    Logger.warn('Failed to embed paraphrase lexicon into exported model', e)
  }

  if (exportModel.meta && Object.keys(exportModel.meta).length === 0) {
    delete exportModel.meta
  }

  return exportModel
}

function downloadExportModel(filename) {
  const exportModel = buildExportModel()
  if (!exportModel) return
  const json = JSON.stringify(exportModel, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

downloadBtn.addEventListener('click', () => {
  if (!appState.model) return
  downloadExportModel('model.json')
})

// Story log helpers
function initStory() {
  appState.storyLog = []
  appendStoryFromCurrentNode()
}

function appendStoryFromCurrentNode() {
  const currentSession = getCurrentSession()
  const node = appState.model?.nodes?.[currentSession?.nodeId]
  if (node?.text && currentSession) {
    const resolvedText = resolveVariables(node.text, currentSession, appState.model)
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
    startNewSession(appState.model)
    setCurrentModelName('gui-edited')
    exitGuiEditMode()

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
  exitGuiEditMode()
  
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
  const currentSession = getCurrentSession()
  if (!currentSession) {
    setStatus('セッションを開始してください', 'warn')
    return
  }

  const variables = currentSession.variables || {}
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
  const updatedSession = { ...currentSession, variables: newVariables }
  setCurrentSession(updatedSession)
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
  const modelName = getCurrentModelName()
  downloadExportModel(modelName ? `${modelName}.json` : 'model.json')
})

// ============================================================================
// Save/Load System (via SaveManager)
// ============================================================================

// SaveManager instance will be initialized later with proper dependencies
const saveManager = new SaveManager()

// Legacy function wrappers for backward compatibility
function renderSaveSlots() {
  saveManager.renderSlots()
}

function startAutoSave() {
  saveManager.startAutoSave()
}

function stopAutoSave() {
  saveManager.stopAutoSave()
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
  const draftData = localStorage.getItem(DRAFT_MODEL_STORAGE_KEY)
  if (!draftData) return

  try {
    const draft = JSON.parse(draftData)
    if (confirm('未保存のドラフトモデルが見つかりました。読み込みますか？')) {
      // Restore model and session using centralized state
      appState.model = draft.model
      startNewSession(appState.model)
      setCurrentModelName(draft.modelName || 'draft')
      appState.storyLog = draft.storyLog || []

      setStatus('ドラフトモデルを読み込みました', 'success')
      renderState()
      renderChoices()
      storyManager.renderStory()
      renderDebugInfo()
    }
  } catch (error) {
    console.warn('Failed to load draft model:', error)
  } finally {
    // Clear draft after handling (success or failure)
    localStorage.removeItem(DRAFT_MODEL_STORAGE_KEY)
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
// ===========================
// Quick Node Creation
// ===========================
// NOTE: NODE_TEMPLATES is imported from constants.js

if (createQuickNodeBtn) {
  createQuickNodeBtn.addEventListener('click', () => guiEditorManager.createQuickNode())
}

// N key for quick node creation is now handled by KeyBindingManager (quickNode action)

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
// Search and Filter Event Listeners
// ============================================================================

// Helper function to update search results
function updateSearchFilter() {
  if (!guiEditorManager || !appState.model) return

  const query = nodeSearchInput?.value || ''
  const filterType = nodeFilterSelect?.value || 'all'
  
  const result = guiEditorManager.applySearchAndFilter(query, filterType)
  
  if (result && searchResultCount) {
    if (query || filterType !== 'all') {
      if (result.visible === 0) {
        searchResultCount.textContent = '該当なし'
        searchResultCount.classList.add('no-results')
      } else {
        searchResultCount.textContent = `${result.visible}/${result.total} ノード`
        searchResultCount.classList.remove('no-results')
      }
    } else {
      searchResultCount.textContent = ''
      searchResultCount.classList.remove('no-results')
    }
  }
}

// Search input event listener with debounce
let searchDebounceTimer = null
if (nodeSearchInput) {
  nodeSearchInput.addEventListener('input', () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(updateSearchFilter, 300)
  })
}

// Clear search button
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (nodeSearchInput) nodeSearchInput.value = ''
    if (nodeFilterSelect) nodeFilterSelect.value = 'all'
    if (guiEditorManager) guiEditorManager.resetSearchAndFilter()
    if (searchResultCount) searchResultCount.textContent = ''
  })
}

// Filter select event listener
if (nodeFilterSelect) {
  nodeFilterSelect.addEventListener('change', updateSearchFilter)
}

// ============================================================================
// Snippet Event Listeners
// ============================================================================

const snippetBtn = document.getElementById('snippetBtn')
const snippetModal = document.getElementById('snippetModal')
const snippetNameInput = document.getElementById('snippetNameInput')
const saveSnippetBtn = document.getElementById('saveSnippetBtn')
const snippetList = document.getElementById('snippetList')
const closeSnippetModalBtn = document.getElementById('closeSnippetModalBtn')

// Render snippet list
function renderSnippetList() {
  if (!snippetList || !guiEditorManager) return

  const snippets = guiEditorManager.getSnippets()

  if (snippets.length === 0) {
    snippetList.innerHTML = `
      <p class="snippet-empty" style="color: var(--color-text-muted); text-align: center; padding: 2rem;">
        スニペットがありません
      </p>
    `
    return
  }

  snippetList.innerHTML = snippets.map(snippet => `
    <div class="snippet-item" data-snippet-id="${snippet.id}">
      <div class="snippet-info">
        <div class="snippet-name">${snippet.name}</div>
        <div class="snippet-meta">作成: ${new Date(snippet.createdAt).toLocaleDateString('ja-JP')}</div>
      </div>
      <div class="snippet-actions-group">
        <button class="insert-snippet-btn primary" data-snippet-id="${snippet.id}">挿入</button>
        <button class="delete-snippet-btn" data-snippet-id="${snippet.id}">削除</button>
      </div>
    </div>
  `).join('')

  // Add event listeners for insert and delete buttons
  snippetList.querySelectorAll('.insert-snippet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const snippetId = btn.dataset.snippetId
      guiEditorManager.insertFromSnippet(snippetId)
      snippetModal.style.display = 'none'
    })
  })

  snippetList.querySelectorAll('.delete-snippet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const snippetId = btn.dataset.snippetId
      if (confirm('このスニペットを削除しますか？')) {
        guiEditorManager.deleteSnippet(snippetId)
        renderSnippetList()
      }
    })
  })
}

// Open snippet modal
if (snippetBtn) {
  snippetBtn.addEventListener('click', () => {
    if (snippetModal) {
      snippetModal.style.display = 'flex'
      snippetModal.classList.add('show')
      renderSnippetList()
    }
  })
}

// Save snippet
if (saveSnippetBtn) {
  saveSnippetBtn.addEventListener('click', () => {
    const name = snippetNameInput?.value.trim() || ''
    if (guiEditorManager.saveAsSnippet(name)) {
      if (snippetNameInput) snippetNameInput.value = ''
      renderSnippetList()
    }
  })
}

// Close snippet modal
if (closeSnippetModalBtn) {
  closeSnippetModalBtn.addEventListener('click', () => {
    if (snippetModal) {
      snippetModal.style.display = 'none'
      snippetModal.classList.remove('show')
    }
  })
}

// Close modal on backdrop click
if (snippetModal) {
  snippetModal.addEventListener('click', (e) => {
    if (e.target === snippetModal) {
      snippetModal.style.display = 'none'
      snippetModal.classList.remove('show')
    }
  })
}

// ============================================================================
// Custom Template Event Listeners
// ============================================================================

const manageTemplatesBtn = document.getElementById('manageTemplatesBtn')
const templateModal = document.getElementById('templateModal')
const customTemplateNameInput = document.getElementById('customTemplateNameInput')
const saveCustomTemplateBtn = document.getElementById('saveCustomTemplateBtn')
const customTemplateList = document.getElementById('customTemplateList')
const closeTemplateModalBtn = document.getElementById('closeTemplateModalBtn')
const customTemplateGroup = document.getElementById('customTemplateGroup')

// Render custom template list in modal
function renderCustomTemplateList() {
  if (!customTemplateList || !guiEditorManager) return

  const templates = guiEditorManager.getCustomTemplates()

  if (templates.length === 0) {
    customTemplateList.innerHTML = `
      <p class="template-empty" style="color: var(--color-text-muted); text-align: center; padding: 2rem;">
        カスタムテンプレートがありません
      </p>
    `
    return
  }

  customTemplateList.innerHTML = templates.map(template => `
    <div class="snippet-item" data-template-id="${template.id}">
      <div class="snippet-info">
        <div class="snippet-name">${template.name}</div>
        <div class="snippet-meta">作成: ${new Date(template.createdAt).toLocaleDateString('ja-JP')}</div>
      </div>
      <div class="snippet-actions-group">
        <button class="delete-template-btn" data-template-id="${template.id}">削除</button>
      </div>
    </div>
  `).join('')

  // Add delete event listeners
  customTemplateList.querySelectorAll('.delete-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = btn.dataset.templateId
      if (confirm('このテンプレートを削除しますか？')) {
        guiEditorManager.deleteCustomTemplate(templateId)
        renderCustomTemplateList()
        updateCustomTemplateOptions()
      }
    })
  })
}

// Update custom template options in quick node modal
function updateCustomTemplateOptions() {
  if (!customTemplateGroup || !guiEditorManager) return

  const templates = guiEditorManager.getCustomTemplates()

  if (templates.length === 0) {
    customTemplateGroup.innerHTML = '<option disabled>カスタムテンプレートなし</option>'
    return
  }

  customTemplateGroup.innerHTML = templates.map(template => 
    `<option value="${template.id}">${template.name}</option>`
  ).join('')
}

// Open template manager modal
if (manageTemplatesBtn) {
  manageTemplatesBtn.addEventListener('click', () => {
    if (templateModal) {
      templateModal.style.display = 'flex'
      templateModal.classList.add('show')
      renderCustomTemplateList()
    }
  })
}

// Save custom template
if (saveCustomTemplateBtn) {
  saveCustomTemplateBtn.addEventListener('click', () => {
    const name = customTemplateNameInput?.value.trim() || ''
    if (guiEditorManager.saveAsCustomTemplate(name)) {
      if (customTemplateNameInput) customTemplateNameInput.value = ''
      renderCustomTemplateList()
      updateCustomTemplateOptions()
    }
  })
}

// Close template modal
if (closeTemplateModalBtn) {
  closeTemplateModalBtn.addEventListener('click', () => {
    if (templateModal) {
      templateModal.style.display = 'none'
      templateModal.classList.remove('show')
    }
  })
}

// Close modal on backdrop click
if (templateModal) {
  templateModal.addEventListener('click', (e) => {
    if (e.target === templateModal) {
      templateModal.style.display = 'none'
      templateModal.classList.remove('show')
    }
  })
}

// ============================================================================
// Module Initialization
// ============================================================================

// Initialize modules (appState is already initialized at the top of the file)
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
const themeManager = new ThemeManager()
const validationPanel = new ValidationPanel(appState)
const lexiconUIManager = new LexiconUIManager()
const keyBindingUIManager = new KeyBindingUIManager()
mermaidPreviewManager = new MermaidPreviewManager()

// Initialize story manager
storyManager.initialize(document.getElementById('storyPanel'))

// Initialize graph manager
graphManager.initialize(document.getElementById('graphSvg'))

graphManager.setOnNodeClick((nodeId) => {
  if (!appState.model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }

  switchTab('story')

  guiEditMode.classList.add('active')
  guiEditMode.style.removeProperty('display')
  if (storyPanel) {
    storyPanel.classList.remove('active')
  }
  if (guiEditBtn) {
    guiEditBtn.textContent = '閲覧'
    guiEditBtn.innerHTML = '<svg class="icon icon-sm"><use href="#icon-eye"></use></svg>閲覧'
  }

  guiEditorManager.nodeRenderer.renderNodeList()
  guiEditorManager.selectNode(nodeId)

  const nodeCard = document.querySelector(`[data-node-id="${nodeId}"]`)
  if (nodeCard) {
    nodeCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    nodeCard.classList.add('highlight')
    setTimeout(() => nodeCard.classList.remove('highlight'), 2000)
  }

  setStatus(`ノード「${nodeId}」にジャンプしました`, 'success')
})

// Initialize debug manager
debugManager.initialize(
  document.getElementById('flagsDisplay'),
  document.getElementById('resourcesDisplay'),
  document.getElementById('variablesDisplay'),
  document.getElementById('reachableNodes')
)

// Initialize validation panel
validationPanel.initialize(
  document.getElementById('validationContainer'),
  (nodeId) => {
    // Navigate to node in GUI editor when clicked
    if (guiEditMode && guiEditMode.classList.contains('active')) {
      const nodeCard = document.querySelector(`[data-node-id="${nodeId}"]`)
      if (nodeCard) {
        nodeCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        nodeCard.classList.add('highlight')
        setTimeout(() => nodeCard.classList.remove('highlight'), 2000)
      }
    }
  }
)

// Initialize Mermaid preview manager
mermaidPreviewManager.initialize(document.querySelector('.app-container'))

// Validation button event listener
const runValidationBtn = document.getElementById('runValidationBtn')
if (runValidationBtn) {
  runValidationBtn.addEventListener('click', () => {
    const summary = validationPanel.validateAndRender()
    if (summary) {
      if (summary.errors > 0) {
        setStatus(`検証完了: ${summary.errors}件のエラー、${summary.warnings}件の警告`, 'error')
      } else if (summary.warnings > 0) {
        setStatus(`検証完了: ${summary.warnings}件の警告`, 'warn')
      } else {
        setStatus('検証完了: 問題は検出されませんでした', 'success')
      }
    }
  })
}

saveManager.initialize({
  appState,
  setStatus,
  uiCallbacks: {
    renderState,
    renderChoices,
    renderStory,
    renderDebugInfo
  },
  saveSlotsContainer: saveSlots
})

// Extend SaveManager UI updates to refresh Mermaid preview after load
const originalSaveManagerUpdateUI = saveManager.updateUI.bind(saveManager)
saveManager.updateUI = function () {
  originalSaveManagerUpdateUI()
  updateMermaidDiagramIfVisible()
}

// Key binding initialization is done after keyBindingUIManager setup (see below)

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

// Initialize lexicon UI manager
lexiconUIManager.initialize(lexiconManager, setStatus)
lexiconUIManager.initUI()

// Initialize key binding UI manager with dependencies
keyBindingUIManager.initialize(keyBindingManager, appState, setStatus, {
  mermaidPreviewManager,
  guiEditorManager,
  updateMermaidCallback: updateMermaidDiagramIfVisible
})

// Initialize KeyBindingManager with handlers from keyBindingUIManager
keyBindingManager.initialize({
  setStatus,
  handlers: keyBindingUIManager.getHandlers(),
  uiElements: {
    inventoryKey,
    debugKey,
    graphKey,
    storyKey,
    aiKey,
    mermaidKey,
    keyBindingDisplay
  },
  guiEditMode,
  saveGuiBtn
})

// Key binding UI event listeners
if (saveKeyBindings) {
  saveKeyBindings.addEventListener('click', () => keyBindingManager.save())
}
if (resetKeyBindings) {
  resetKeyBindings.addEventListener('click', () => keyBindingManager.reset())
}

// Initialize theme manager (palette UI and saved theme)
setupThemeEventListeners(themeManager)
themeManager.loadSavedPalette()

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

if (refreshSavesBtn) {
  refreshSavesBtn.addEventListener('click', () => {
    renderSaveSlots()
  })
}

// GUI Edit Mode Toggle
if (guiEditBtn) {
  guiEditBtn.addEventListener('click', () => {
    if (!appState.model) {
      setStatus('まずモデルを読み込んでください', 'warn')
      return
    }
    
    const isCurrentlyEditing = guiEditMode.classList.contains('active')
    
    if (isCurrentlyEditing) {
      // Exit GUI edit mode
      guiEditMode.classList.remove('active')
      guiEditMode.style.display = 'none'
      if (storyPanel) {
        storyPanel.classList.add('active')
      }
      guiEditBtn.textContent = '編集'
      guiEditBtn.innerHTML = '<svg class="icon icon-sm"><use href="#icon-edit"></use></svg>編集'
      setStatus('GUI編集モードを終了しました')
    } else {
      // Enter GUI edit mode
      guiEditMode.classList.add('active')
      guiEditMode.style.removeProperty('display')
      if (storyPanel) {
        storyPanel.classList.remove('active')
      }
      guiEditBtn.textContent = '閲覧'
      guiEditBtn.innerHTML = '<svg class="icon icon-sm"><use href="#icon-eye"></use></svg>閲覧'
      guiEditorManager.nodeRenderer.renderNodeList()
      setStatus('GUI編集モードを開始しました', 'success')
    }
  })
}
