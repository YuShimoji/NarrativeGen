/**
 * App Controller - Application initialization and event wiring
 * Extracted from main.js to separate concerns
 */

// Session controller utilities
import {
  resolveVariables,
  loadModel,
  applyModelParaphraseLexicon,
  ErrorBoundary
} from './session-controller.js'

// UI bindings
import { getUIElements, getDefaultAIConfig } from './ui-bindings.js'

// Engine functions
import {
  createAIProvider,
  getAvailableChoices,
  applyChoice,
  getParaphraseLexicon,
  setParaphraseLexicon,
} from '../../../packages/engine-ts/dist/browser.js'

// Theme setup
import { setupThemeEventListeners } from './ui/theme.js'

// Utilities
import { parseCsvLine } from './utils/file-utils.js'
import Logger from './core/logger.js'
import {
  getCurrentSession,
  getCurrentModelName,
  setCurrentSession,
  setCurrentModelName,
  clearSession,
  startNewSession,
} from './core/session.js'
import { ModelValidator, ValidationSeverity } from './features/model-validator.js'
import { ExportModal } from './ui/export-modal.js'
import {
  ADVANCED_ENABLED_STORAGE_KEY,
  DRAFT_MODEL_STORAGE_KEY
} from './config/constants.js'
import { setupEditorEvents } from './app-editor-events.js'

/**
 * Initialize the application: wire up DOM events, initialize managers, set up UI
 * @param {Object} config - Application configuration
 * @param {Object} config.appState - Global application state
 * @param {Object} config.managers - All manager instances
 * @param {Object} config.keyBindingManager - Key binding manager
 * @param {Object} config.exportManager - Export manager
 * @returns {Object} References needed for DevTools and global access
 */
export function initializeApp({ appState, managers, keyBindingManager, exportManager }) {
  // Destructure managers
  const {
    dom, eventManager, storyManager, graphManager, debugManager,
    guiEditorManager, referenceManager, csvManager, aiManager,
    lexiconManager, searchManager, themeManager, validationPanel,
    lexiconUIManager, keyBindingUIManager, mermaidPreviewManager, saveManager
  } = managers

  // DOM element references (centralized in ui-bindings.js)
  const {
  startBtn, choicesContainer, stateView, statusText, modelSelect,
  fileInput, uploadBtn, dropZone, previewTopBtn, downloadTopBtn,
  importCsvBtn, csvFileInput, exportCsvBtn, guiEditMode, guiEditBtn,
  nodeList, addNodeBtn, previewBtn, downloadBtn, saveGuiBtn, cancelGuiBtn,
  nodeSearchInput, clearSearchBtn, nodeFilterSelect, searchResultCount,
  storyView, errorPanel, errorList, csvPreviewModal, csvFileName,
  csvPreviewContent, confirmImportBtn, cancelPreviewBtn,
  storyPreviewModal, storyPreviewContent, closePreviewBtn,
  storyContent, toggleSidebarBtn,
  storyTab, graphTab, debugTab, referenceTab,
  storyPanel, graphPanel, debugPanel, referencePanel,
  graphSvg, fitGraphBtn, resetGraphBtn, showConditions,
  graphSettingsBtn, graphSettings, nodeShape, fontSize,
  saveGraphPreset, loadGraphPreset, exportBtn, exportModal,
  flagsDisplay, resourcesDisplay, variablesDisplay, editVariablesBtn,
  reachableNodes, saveLoadSection, saveSlots, refreshSavesBtn,
  advancedTab, advancedPanel, enableAdvancedFeatures,
  aiProvider, openaiSettings, openaiApiKey, openaiModel,
  saveAiSettings, generateNextNodeBtn, paraphraseCurrentBtn, aiOutput,
  lexiconLoadBtn, lexiconMergeBtn, lexiconReplaceBtn,
  lexiconExportBtn, lexiconImportBtn, lexiconFileInput, lexiconTextarea,
  keyBindingDisplay, inventoryKey, debugKey, graphKey,
  storyKey, aiKey, mermaidKey, saveKeyBindings, resetKeyBindings,
  batchEditBtn, batchEditModal, searchText, replaceText,
  applyTextReplaceBtn, choiceSearchText, choiceReplaceText,
  applyChoiceReplaceBtn, oldTargetText, newTargetText,
  applyTargetReplaceBtn, closeBatchEditBtn,
  themeBtn, createQuickNodeBtn, cancelQuickNodeBtn, quickNodeBtn,
  quickNodeModal, batchChoiceBtn, batchChoiceModal,
  batchNodeSelect, batchCondition, batchEffect,
  batchConditionText, batchEffectText, cancelBatchChoiceBtn, applyBatchChoiceBtn,
  snippetBtn, snippetModal, snippetNameInput, saveSnippetBtn,
  snippetList, closeSnippetModalBtn,
  cancelDraftRestoreBtn, confirmDraftRestoreBtn, draftRestoreModal,
  manageTemplatesBtn, templateModal, customTemplateNameInput,
  saveCustomTemplateBtn, customTemplateList, closeTemplateModalBtn,
  customTemplateGroup, runValidationBtn, validationContainer,
  referenceToc, referenceContent, csvImportModal, csvExportModal,
  aiSettings, keyBindingSettings, aiActions, lexiconEditor,
  paraphraseModal, cancelParaphraseBtn
  } = getUIElements()

  // AI configuration
  let aiConfig = getDefaultAIConfig()
  let aiProviderInstance = null

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
    startAutoSave() // Start auto-save when session begins
  } catch (err) {
    console.error(err)
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
    if (enabled) {
      if (aiSettings) aiSettings.style.display = 'block'
      if (keyBindingSettings) keyBindingSettings.style.display = 'block'
      if (aiActions) aiActions.style.display = 'block'
      if (lexiconEditor) lexiconEditor.style.display = 'block'
    } else {
      if (aiSettings) aiSettings.style.display = 'none'
      if (keyBindingSettings) keyBindingSettings.style.display = 'none'
      if (aiActions) aiActions.style.display = 'none'
      if (lexiconEditor) lexiconEditor.style.display = 'none'
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
  // 元モデルを復元
  const restored = guiEditorManager.restoreOriginalModel()

  if (restored) {
    // ドラフトもクリア
    localStorage.removeItem(DRAFT_MODEL_STORAGE_KEY)

    // UIを更新
    if (guiEditorManager.nodeList) {
      guiEditorManager.renderNodeList()
    }

    setStatus('編集をキャンセルし、元のモデルに戻しました', 'info')
  } else {
    setStatus('元のモデルが見つかりませんでした', 'warn')
  }

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

const exportModalInstance = new ExportModal(exportManager)
exportModalInstance.initialize(exportModal)

// Export Button Handler
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    if (!appState.model) {
      setStatus('モデルを読み込んでください', 'warn')
      return
    }
    const currentName = getCurrentModelName() || 'story'
    // extension is added by manager, so just pass name
    const filename = currentName.replace(/\.json$/i, '')
    exportModalInstance.show(filename)
  })
}

// Handle Export Action
exportModalInstance.onExport = async (formatId, filename) => {
  try {
    setStatus(`${formatId}形式でエクスポート中...`)
    await exportManager.export(formatId, appState.model, filename)
    setStatus('エクスポート完了', 'success')
  } catch (error) {
    console.error(error)
    setStatus(`エクスポート失敗: ${error.message}`, 'error')
  }
}

// Editor events are set up via setupEditorEvents() below
setStatus('初期化完了 - モデルを読み込んでください', 'info')

// ============================================================================
// Module Initialization
// ============================================================================

// Initialize story manager
storyManager.initialize(storyPanel)

// Initialize graph manager
graphManager.initialize(graphSvg)

// Initialize debug manager
debugManager.initialize(flagsDisplay, resourcesDisplay, variablesDisplay, reachableNodes)

// Initialize validation panel
validationPanel.initialize(
  validationContainer,
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
  nodeList, guiEditMode, batchEditModal, quickNodeModal,
  batchChoiceModal, paraphraseModal, draftRestoreModal
)

// Initialize reference manager
referenceManager.initialize(referenceToc, referenceContent)

// Initialize CSV manager
csvManager.initialize(csvImportModal, csvExportModal)

// Initialize AI manager
aiManager.initialize(aiOutput, generateNextNodeBtn, paraphraseCurrentBtn)

// Initialize lexicon manager
lexiconManager.initialize()

// Initialize search manager
searchManager.initialize()

// Keep engine runtime paraphrase lexicon in sync with designer lexicon
const applyToRuntimeLexicon = (lexicon, options) => {
  try {
    setParaphraseLexicon(lexicon, options)
  } catch (e) {
    Logger.warn('Failed to apply designer lexicon to engine runtime lexicon', e)
  }
}

try {
  const designerLexicon = lexiconManager.getLexicon()
  applyToRuntimeLexicon(designerLexicon, { merge: true })
} catch (e) {
  Logger.warn('Failed to initialize engine runtime lexicon from designer lexicon', e)
}

// Initialize lexicon UI manager
lexiconUIManager.initialize(lexiconManager, setStatus, applyToRuntimeLexicon)
lexiconUIManager.initUI()

// Initialize key binding UI manager with dependencies
keyBindingUIManager.initialize(keyBindingManager, appState, setStatus, {
  mermaidPreviewManager,
  guiEditorManager,
  graphManager,
  searchManager,
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
// Phase 2: 新しいGraphEditorManager用のイベントリスナー
if (fitGraphBtn) {
  fitGraphBtn.onclick = () => {
    if (graphManager && typeof graphManager.fitToView === 'function') {
      graphManager.fitToView()
    }
  }
}
if (resetGraphBtn) {
  resetGraphBtn.onclick = () => {
    if (graphManager && typeof graphManager.reset === 'function') {
      graphManager.reset()
    }
  }
}
if (graphSettingsBtn) {
  graphSettingsBtn.onclick = () => {
    if (graphSettings) graphSettings.style.display = graphSettings.style.display === 'none' ? 'block' : 'none'
  }
}
// Phase 2: 以下の機能は将来の拡張として実装予定
// if (nodeShape) {
//   nodeShape.onchange = () => graphManager.setNodeShape(nodeShape.value)
// }
// if (fontSize) {
//   fontSize.oninput = () => graphManager.setFontSize(parseInt(fontSize.value))
// }
// if (showConditions) {
//   showConditions.onchange = () => graphManager.setShowConditions(showConditions.checked)
// }
// if (saveGraphPreset) {
//   saveGraphPreset.onclick = () => {
//     if (graphManager.savePreset()) {
//       setStatus('グラフプリセットを保存しました', 'success')
//     } else {
//       setStatus('プリセットの保存に失敗しました', 'warn')
//     }
//   }
// }
// if (loadGraphPreset) {
//   loadGraphPreset.onclick = () => {
//     if (graphManager.loadPreset()) {
//       setStatus('グラフプリセットを読み込みました', 'success')
//     } else {
//       setStatus('保存されたプリセットがありません', 'warn')
//     }
//   }
// }

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
      // 元モデルを保存（ロールバック用）
      guiEditorManager.saveOriginalModel()

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

// Set up editor event handlers (snippets, templates, batch, search, draft)
setupEditorEvents({
  guiEditorManager,
  appState,
  dom: getUIElements(),
  callbacks: { setStatus, renderState, renderChoices, renderDebugInfo },
  storyManager,
})

// Phase 2: GraphEditorManagerからアクセスできるようにグローバル変数を公開
window.guiEditorManager = guiEditorManager
window.switchTab = switchTab

if (import.meta.env.DEV) {
  window.__NARRATIVEGEN_DEVTOOLS__ = {
    getState() {
      const currentSession = getCurrentSession()
      return {
        hasModel: Boolean(appState.model),
        currentModelName: getCurrentModelName(),
        currentNodeId: currentSession?.nodeId ?? null,
        nodeCount: appState.model ? Object.keys(appState.model.nodes || {}).length : 0,
        graphHistoryDepth: graphManager.history.length,
        graphRedoDepth: graphManager.redoStack.length,
        mermaidVisible: Boolean(mermaidPreviewManager?.isVisible),
      }
    },
    getExportFormats() {
      return exportManager.getAvailableFormats()
    },
    renderGraph() {
      graphManager.render()
      return {
        hasSvg: Boolean(graphSvg?.childElementCount),
        childCount: graphSvg?.childElementCount ?? 0,
      }
    },
    undoGraph() {
      graphManager.undo()
      return {
        graphHistoryDepth: graphManager.history.length,
        graphRedoDepth: graphManager.redoStack.length,
      }
    },
    redoGraph() {
      graphManager.redo()
      return {
        graphHistoryDepth: graphManager.history.length,
        graphRedoDepth: graphManager.redoStack.length,
      }
    },
  }
}

  // Return references for external access
  return { switchTab, setStatus, renderState, renderChoices, renderStory }
}
