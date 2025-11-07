// Error handling and logging
import { startSession, getAvailableChoices, applyChoice, chooseParaphrase, createAIProvider, GameSession } from '@narrativegen/engine-ts/dist/browser.js'
import { initStory, appendStoryFromCurrentNode, renderStoryEnhanced } from './handlers/story-handler.js'
import { exportModelToCsv } from './utils/csv-exporter.js'
import { initNodesPanel } from './handlers/nodes-panel.js'
import { initTabs } from './handlers/tabs.js'
import { initGuiEditor } from './handlers/gui-editor.js'
import { resolveVariables, validateModel } from './utils/model-utils.js'
import { parseCsvLine, parseKeyValuePairs, parseConditions, parseEffects, serializeConditions, serializeEffects, serializeKeyValuePairs } from './utils/csv-parser.js'

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
const guiEditBtn = document.getElementById('editBtn')
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

// Split view state
let splitModeActive = false
let storyResizerInitialized = false

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

// AI configuration
let aiConfig = {
  provider: 'mock',
  openai: {
    apiKey: '',
    model: 'gpt-3.5-turbo'
  }
}
let aiProviderInstance = null

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

function renderDebugInfo() {
  const _model = getModel();
  if (!session || !_model) {
    flagsDisplay.innerHTML = '<p>セッションを開始してください</p>'
    resourcesDisplay.innerHTML = ''
    inventoryDisplay.innerHTML = ''
    reachableNodes.innerHTML = '<p>モデルを読み込んでください</p>'
    return
  }

  // Render flags
  flagsDisplay.innerHTML = '<h4>フラグ</h4>'
  if (session.state.flags && Object.keys(session.state.flags).length > 0) {
    Object.entries(session.state.flags).forEach(([key, value]) => {
      const div = document.createElement('div')
      div.className = 'flag-item'
      div.innerHTML = `<span>${key}</span><span>${value}</span>`
      flagsDisplay.appendChild(div)
    })
  } else {
    flagsDisplay.innerHTML += '<p>フラグなし</p>'
  }

  // Render resources
  resourcesDisplay.innerHTML = '<h4>リソース</h4>'
  if (session.state.resources && Object.keys(session.state.resources).length > 0) {
    Object.entries(session.state.resources).forEach(([key, value]) => {
      const div = document.createElement('div')
      div.className = 'resource-item'
      div.innerHTML = `<span>${key}</span><span>${value}</span>`
      resourcesDisplay.appendChild(div)
    })
  } else {
    resourcesDisplay.innerHTML += '<p>リソースなし</p>'
  }

  // Render inventory
  inventoryDisplay.innerHTML = '<h4>インベントリ</h4>'
  const inventory = session.listInventory()
  if (inventory && inventory.length > 0) {
    inventory.forEach((item) => {
      const div = document.createElement('div')
      div.className = 'resource-item'
      div.innerHTML = `<span>${item.id}</span><span>${item.brand} - ${item.description}</span>`
      inventoryDisplay.appendChild(div)
    })
  } else {
    inventoryDisplay.innerHTML += '<p>アイテムなし</p>'
  }

  // Render reachability map
  reachableNodes.innerHTML = '<h4>到達可能性</h4>'
  const visited = new Set([session.state.nodeId])
  const queue = [session.state.nodeId]
  const reachable = new Set([session.state.nodeId])

  // BFS to find all reachable nodes
  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    const node = _model.nodes[currentNodeId]
    if (!node) continue

    node.choices?.forEach(choice => {
      if (!visited.has(choice.target)) {
        visited.add(choice.target)
        // Check if choice is available in current state
        try {
          const availableChoices = session.getAvailableChoices()
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
  Object.keys(_model.nodes).forEach(nodeId => {
    const div = document.createElement('div')
    div.className = reachable.has(nodeId) ? 'reachable-node' : 'unreachable-node'
    div.textContent = `${nodeId}: ${reachable.has(nodeId) ? '到達可能' : '未到達'}`
    reachableNodes.appendChild(div)
  })
}

let graphScale = 1
let graphTranslateX = 0
let graphTranslateY = 0

function renderGraph() {
  const _model = getModel();
  if (!graphSvg || !_model) {
    graphSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666">モデルを読み込んでください</text>'
    return
  }

  const svg = graphSvg
  svg.innerHTML = ''

  const nodes = Object.values(_model.nodes)
  const nodeMap = new Map()
  nodes.forEach((node, i) => {
    nodeMap.set(node.id, { ...node, x: 100 + (i % 5) * 150, y: 100 + Math.floor(i / 5) * 150 })
  })

  // Draw connections
  nodes.forEach(node => {
    const sourcePos = nodeMap.get(node.id)
    node.choices?.forEach(choice => {
      const targetPos = nodeMap.get(choice.target)
      if (targetPos) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', sourcePos.x)
        line.setAttribute('y1', sourcePos.y)
        line.setAttribute('x2', targetPos.x)
        line.setAttribute('y2', targetPos.y)
        line.setAttribute('stroke', '#999')
        line.setAttribute('stroke-width', '2')
        svg.appendChild(line)

        // Arrow head
        const dx = targetPos.x - sourcePos.x
        const dy = targetPos.y - sourcePos.y
        const angle = Math.atan2(dy, dx)
        const arrowLength = 10
        const arrowX = targetPos.x - arrowLength * Math.cos(angle)
        const arrowY = targetPos.y - arrowLength * Math.sin(angle)

        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        arrow.setAttribute('points', `${targetPos.x},${targetPos.y} ${arrowX - 5 * Math.sin(angle)},${arrowY + 5 * Math.cos(angle)} ${arrowX + 5 * Math.sin(angle)},${arrowY - 5 * Math.cos(angle)}`)
        arrow.setAttribute('fill', '#999')
        svg.appendChild(arrow)
      }
    })
  })

  // Draw nodes
  nodes.forEach(node => {
    const pos = nodeMap.get(node.id)
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    const isCurrent = node.id === session?.state?.nodeId
    const isHighlighted = highlightedNodes.has(node.id)
    
    circle.setAttribute('cx', pos.x)
    circle.setAttribute('cy', pos.y)
    circle.setAttribute('r', isHighlighted ? '35' : '30')
    circle.setAttribute('fill', isCurrent ? '#4CAF50' : isHighlighted ? '#FF9800' : '#2196F3')
    circle.setAttribute('stroke', isHighlighted ? '#FF9800' : '#fff')
    circle.setAttribute('stroke-width', isHighlighted ? '4' : '2')
    svg.appendChild(circle)

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', pos.x)
    text.setAttribute('y', pos.y + 5)
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('fill', isCurrent ? '#4CAF50' : isHighlighted ? '#FF9800' : '#fff')
    text.setAttribute('font-size', '12')
    text.setAttribute('font-weight', isHighlighted ? 'bold' : 'normal')
    text.textContent = node.id
    svg.appendChild(text)
  })

  // Apply transform
  svg.style.transform = `translate(${graphTranslateX}px, ${graphTranslateY}px) scale(${graphScale})`
}

// Graph controls
zoomInBtn?.addEventListener('click', () => {
  graphScale *= 1.2
  renderGraph()
})

zoomOutBtn?.addEventListener('click', () => {
  graphScale /= 1.2
  renderGraph()
})

resetViewBtn?.addEventListener('click', () => {
  graphScale = 1
  graphTranslateX = 0
  graphTranslateY = 0
  renderGraph()
})

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
    setModel({
      modelType: 'adventure-playthrough',
      startNode: firstNode,
      flags: initialFlags,
      resources: initialResources,
      nodes,
      metadata: globalMetadata
    })
    setSession(new GameSession(getModel(), { entities }))
    currentModelName = file.name
    initStory(getSession(), getModel())
    renderState()
    renderChoices()
    renderStoryEnhanced(storyView)
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
  if (!aiProviderInstance || !session || !_model) {
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
      currentNodeText: _model.nodes[session.state.nodeId]?.text || '',
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

async function paraphraseCurrentText() {
  if (!aiProviderInstance || !session || !_model) {
    aiOutput.textContent = '❌ モデルを読み込んでから実行してください'
    return
  }

  const currentNode = _model.nodes[session.state.nodeId]
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
      style: 'desu-masu',
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
    }
  } catch (error) {
    console.warn('Failed to load AI config from localStorage:', error)
  }
}

// Split View Mode Toggle
toggleSplitViewBtn.addEventListener('click', () => {
  splitModeActive = !splitModeActive
  
  if (splitModeActive) {
    // Enable split mode
    toggleSplitViewBtn.classList.add('active')
    toggleSplitViewBtn.textContent = '分割ビュー: ON'
    storyMainContainer.classList.add('split-mode')
    
    // Update JSON editor with current model
    storyJsonEditor.value = _model ? JSON.stringify(_model, null, 2) : '{}'
    
    // Initialize resizer (once)
    initStoryResizer()
    storyResizer.style.cursor = 'ew-resize'
  } else {
    // Disable split mode
    toggleSplitViewBtn.classList.remove('active')
    toggleSplitViewBtn.textContent = '分割ビュー'
    storyMainContainer.classList.remove('split-mode')
    storyResizer.style.cursor = 'default'
  }
})

function initStoryResizer() {
  if (storyResizerInitialized) return
  
  let isResizing = false
  const leftPanel = storyMainContainer.querySelector('.story-left-panel')
  
  storyResizer.addEventListener('mousedown', (e) => {
    isResizing = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  })
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return
    
    const containerRect = storyMainContainer.getBoundingClientRect()
    const newLeftWidth = e.clientX - containerRect.left
    const minWidth = 300
    const maxWidth = containerRect.width - 300
    
    if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
      const percentage = (newLeftWidth / containerRect.width * 100).toFixed(2)
      leftPanel.style.flex = `0 0 ${percentage}%`
    }
  })
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  })
  
  storyResizerInitialized = true
}

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

// GUI編集モード開始ボタンのハンドラ
guiEditBtn.addEventListener('click', () => {
  if (session == null) {
    setStatus('GUI編集するにはまずモデルを読み込んでください', 'warn')
    return
  }
  guiEditor.renderNodeList()
  guiEditMode.style.display = 'block'
  setControlsEnabled(false)
})

// AI settings event handlers
aiProvider.addEventListener('change', () => {
  if (aiProvider.value === 'openai') {
    openaiSettings.style.display = 'block'
  } else {
    openaiSettings.style.display = 'none'
  }
  aiProviderInstance = null // Reset provider when changed
})

saveAiSettings.addEventListener('click', () => {
  aiConfig.provider = aiProvider.value
  if (aiProvider.value === 'openai') {
    aiConfig.openai.apiKey = openaiApiKey.value
    aiConfig.openai.model = openaiModel.value
    if (!aiConfig.openai.apiKey) {
      aiOutput.textContent = 'OpenAI APIキーを入力してください'
      return
    }
  }
  // Save to localStorage
  localStorage.setItem('narrativeGenAiConfig', JSON.stringify(aiConfig))
  aiOutput.textContent = 'AI設定を保存しました'
  aiProviderInstance = null // Reset to use new config
})

generateNextNodeBtn.addEventListener('click', generateNextNode)
paraphraseCurrentBtn.addEventListener('click', paraphraseCurrentText)

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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (guiEditMode.style.display !== 'none') {
      saveGuiBtn.click()
    }
  }
})

// Initialize handlers with dependency injection
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
  storyView,
  guiEditor
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
  guiEditor,
  saveGuiBtn,
  cancelGuiBtn,
  storyView,
  chooseParaphrase,
  parseConditions
})

// Setup GUI editor buttons
editGuiBtn.addEventListener('click', () => guiEditor.startEditing())
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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (guiEditMode.style.display !== 'none') {
      saveGuiBtn.click()
    }
  }
})
