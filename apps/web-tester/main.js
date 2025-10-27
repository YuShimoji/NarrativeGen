// Error handling and logging
import { startSession, getAvailableChoices, applyChoice, chooseParaphrase, createAIProvider } from '@narrativegen/engine-ts/dist/browser.js'
import * as d3 from 'd3'

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
  
  // Replace node ID variable: {nodeId}
  resolved = resolved.replace(/\{nodeId\}/g, session.nodeId)
  
  // Replace time variable: {time}
  resolved = resolved.replace(/\{time\}/g, String(session.time))
  
  return resolved
}

// Browser-compatible model loading (no fs module)
async function loadModel(modelName) {
  const url = new URL(`../../models/examples/${modelName}.json`, import.meta.url)
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

// Debug elements
const flagsDisplay = document.getElementById('flagsDisplay')
const resourcesDisplay = document.getElementById('resourcesDisplay')
const reachableNodes = document.getElementById('reachableNodes')

// AI elements
const aiTab = document.getElementById('aiTab')
const aiPanel = document.getElementById('aiPanel')
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

  const snapshot = session
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
  statusText.dataset.type = type
}

<<<<<<< HEAD
=======
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

function renderGraph() {
  if (!_model) {
    d3.select(graphSvg).selectAll('*').remove()
    return
  }

  const width = graphSvg.clientWidth
  const height = graphSvg.clientHeight

  // Performance optimization: Limit nodes for large graphs
  const maxNodes = 100
  const allNodes = Object.keys(_model.nodes)
  const shouldVirtualize = allNodes.length > maxNodes

  let nodesToShow
  if (shouldVirtualize) {
    // Show current node and its direct connections, plus some random nodes
    const currentNode = session?.nodeId || _model.startNode
    const connectedNodes = new Set([currentNode])

    // Add directly connected nodes
    const currentNodeObj = _model.nodes[currentNode]
    if (currentNodeObj?.choices) {
      currentNodeObj.choices.forEach(choice => {
        if (choice.target) connectedNodes.add(choice.target)
      })
    }

    // Add nodes that connect to current node
    Object.entries(_model.nodes).forEach(([id, node]) => {
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

  // Create nodes and links data (only for visible nodes)
  const nodes = []
  const links = []

  nodesToShow.forEach(id => {
    const node = _model.nodes[id]
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
    .alphaDecay(0.02) // Faster convergence for better performance

  // Create links with optimized rendering
  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', shouldVirtualize ? 1 : 2)

  // Add condition labels to links (only if enabled and not virtualized)
  if (showConditions.checked && !shouldVirtualize) {
    const linkLabels = svg.append('g')
      .selectAll('text')
      .data(links.filter(l => l.condition))
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.condition)
  }

  // Create nodes with performance optimizations
  const node = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => d.isVirtualized ? 20 : 30)
    .attr('fill', d => {
      if (d.id === _model.startNode) return '#4ade80'
      if (d.isVirtualized) return '#94a3b8'
      return '#60a5fa'
    })
    .attr('stroke', d => d.id === (session?.nodeId || _model.startNode) ? '#ef4444' : '#fff')
    .attr('stroke-width', d => d.id === (session?.nodeId || _model.startNode) ? 3 : 2)
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
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
  if (!shouldVirtualize) {
    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => d.id)
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
      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    }

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    if (showConditions.checked && !shouldVirtualize) {
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
    const bounds = svg.node().getBBox()
    const fullWidth = bounds.width
    const fullHeight = bounds.height
    const midX = bounds.x + fullWidth / 2
    const midY = bounds.y + fullHeight / 2

    const scale = 0.8 / Math.max(fullWidth / width, fullHeight / height)
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY]

    svg.transition().duration(750).call(
      d3.zoom().transform,
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

function isConnectedToCurrent(nodeId) {
  if (!session) return nodeId === _model.startNode
  const currentNode = session.nodeId

  // Direct connection
  if (nodeId === currentNode) return true

  // Current node connects to this node
  const currentNodeObj = _model.nodes[currentNode]
  if (currentNodeObj?.choices?.some(c => c.target === nodeId)) return true

  // This node connects to current node
  const nodeObj = _model.nodes[nodeId]
  if (nodeObj?.choices?.some(c => c.target === currentNode)) return true

  return false
}

function renderDebugInfo() {
  if (!session || !_model) {
    flagsDisplay.innerHTML = '<p>セッションを開始してください</p>'
    resourcesDisplay.innerHTML = ''
    reachableNodes.innerHTML = '<p>モデルを読み込んでください</p>'
    return
  }

  // Render flags
  flagsDisplay.innerHTML = '<h4>フラグ</h4>'
  if (session.flags && Object.keys(session.flags).length > 0) {
    Object.entries(session.flags).forEach(([key, value]) => {
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
  if (session.resources && Object.keys(session.resources).length > 0) {
    Object.entries(session.resources).forEach(([key, value]) => {
      const div = document.createElement('div')
      div.className = 'resource-item'
      div.innerHTML = `<span>${key}</span><span>${value}</span>`
      resourcesDisplay.appendChild(div)
    })
  } else {
    resourcesDisplay.innerHTML += '<p>リソースなし</p>'
  }

  // Render reachability map
  reachableNodes.innerHTML = '<h4>到達可能性</h4>'
  const visited = new Set([session.nodeId])
  const queue = [session.nodeId]
  const reachable = new Set([session.nodeId])

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
          const availableChoices = getAvailableChoices(session, _model)
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
    _model = {
      modelType: 'adventure-playthrough',
      startNode: firstNode,
      flags: initialFlags,
      resources: initialResources,
      nodes,
      metadata: globalMetadata
    }
    session = startSession(_model)
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

>>>>>>> master
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
  if (!session || !_model) throw new Error('セッションが開始されていません')
  session = applyChoice(session, _model, choiceId)
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
      currentNodeText: _model.nodes[session.nodeId]?.text || '',
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

  const currentNode = _model.nodes[session.nodeId]
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

<<<<<<< HEAD
=======
    // Validate model
    const validationErrors = validateModel(model.nodes)
    if (validationErrors.length > 0) {
      showErrors(validationErrors)
      setStatus(`モデルにエラーがあります: ${validationErrors.length}件`, 'warn')
      return
    }

    hideErrors()
>>>>>>> master
    _model = model
    session = startSession(_model)
    currentModelName = file.name
    setStatus(`ファイル ${file.name} を実行中`, 'success')
    initStory()
  } catch (err) {
    console.error(err)
<<<<<<< HEAD
=======
    showErrors([err?.message ?? err])
>>>>>>> master
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

<<<<<<< HEAD
setStatus('サンプルを選択して「サンプルを実行」を押してください')
renderState()
renderChoices()
renderStory()
=======
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

// Tab event listeners
function switchTab(tabName) {
  // Hide all panels
  storyPanel.classList.remove('active')
  graphPanel.classList.remove('active')
  debugPanel.classList.remove('active')
  aiPanel.classList.remove('active')

  // Remove active class from all tabs
  storyTab.classList.remove('active')
  graphTab.classList.remove('active')
  debugTab.classList.remove('active')
  aiTab.classList.remove('active')

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
  } else if (tabName === 'ai') {
    aiPanel.classList.add('active')
    aiTab.classList.add('active')
    initAiProvider()
  }
}

storyTab.addEventListener('click', () => switchTab('story'))
graphTab.addEventListener('click', () => switchTab('graph'))
debugTab.addEventListener('click', () => switchTab('debug'))
aiTab.addEventListener('click', () => switchTab('ai'))
>>>>>>> master

guiEditBtn.addEventListener('click', () => {
  if (session == null) {
    setStatus('GUI編集するにはまずモデルを読み込んでください', 'warn')
    return
  }
  renderNodeList()
  guiEditMode.style.display = 'block'
  setControlsEnabled(false)
})

<<<<<<< HEAD
=======
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

>>>>>>> master
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
<<<<<<< HEAD
    storyLog.push(node.text)
=======
    const resolvedText = resolveVariables(node.text, session, _model)
    storyLog.push(resolvedText)
>>>>>>> master
  }
}

function renderStory() {
  if (!storyView) return
<<<<<<< HEAD
  storyView.textContent = storyLog.join('\n\n')
}

// CSV / TSV import/export
importCsvBtn.addEventListener('click', () => csvFileInput.click())
=======

  // Performance optimization: Virtual scrolling for long stories
  const maxVisibleEntries = 50
  const shouldVirtualize = storyLog.length > maxVisibleEntries

  let visibleEntries
  let startIndex = 0

  if (shouldVirtualize) {
    // Show the most recent entries by default
    startIndex = Math.max(0, storyLog.length - maxVisibleEntries)
    visibleEntries = storyLog.slice(startIndex)
  } else {
    visibleEntries = storyLog
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
          const newVisibleEntries = storyLog.slice(newStartIndex, startIndex + maxVisibleEntries)

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
>>>>>>> master

csvFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
<<<<<<< HEAD
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
      choice_conditions: headers.indexOf('choice_conditions'),
      choice_effects: headers.indexOf('choice_effects'),
      choice_outcome_type: headers.indexOf('choice_outcome_type'),
      choice_outcome_value: headers.indexOf('choice_outcome_value'),
      initial_flags: headers.indexOf('initial_flags'),
      initial_resources: headers.indexOf('initial_resources'),
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
    
    for (let i = 1; i < rows.length; i++) {
      const cells = parseCsvLine(rows[i], delim)
      const nid = (cells[idx.node_id] || '').trim()
      if (!nid) continue
      
      if (!nodes[nid]) nodes[nid] = { id: nid, text: '', choices: [] }
      
      const ntext = (cells[idx.node_text] || '').trim()
      if (ntext) nodes[nid].text = ntext
      
      const cid = (cells[idx.choice_id] || '').trim()
      const ctext = (cells[idx.choice_text] || '').trim()
      const ctgt = (cells[idx.choice_target] || '').trim()
      
      if (ctgt || ctext || cid) {
        const choice = {
          id: cid || `c${nodes[nid].choices.length + 1}`,
          text: ctext || '',
          target: ctgt || nid
        }
        
        // 条件のパース
        if (idx.choice_conditions >= 0 && cells[idx.choice_conditions]) {
          try {
            choice.conditions = parseConditions(cells[idx.choice_conditions])
          } catch (err) {
            errors.push(`行${i + 1}: 条件パースエラー: ${err.message}`)
          }
        }
        
        // 効果のパース
        if (idx.choice_effects >= 0 && cells[idx.choice_effects]) {
          try {
            choice.effects = parseEffects(cells[idx.choice_effects])
          } catch (err) {
            errors.push(`行${i + 1}: 効果パースエラー: ${err.message}`)
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
    }
    
    // バリデーション
    const validationErrors = validateModel(nodes)
    errors.push(...validationErrors)
    
    if (errors.length > 0) {
      console.warn('CSV検証警告:', errors)
      setStatus(`CSV読み込み成功（警告${errors.length}件あり）`, 'warn')
    } else {
      setStatus('CSV を読み込みました', 'success')
    }
    
    const firstNode = Object.keys(nodes)[0]
    _model = {
      modelType: 'adventure-playthrough',
      startNode: firstNode,
      flags: initialFlags,
      resources: initialResources,
      nodes
    }
    session = startSession(_model)
    currentModelName = file.name
    initStory()
    renderState()
    renderChoices()
    renderStory()
  } catch (err) {
    console.error(err)
    setStatus(`CSV 読み込みに失敗: ${err?.message ?? err}`, 'warn')
  }
})

// CSV行のパース（引用符対応）
=======
  showCsvPreview(file)
})
>>>>>>> master
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
    } else if (cond.startsWith('timeWindow:')) {
      const [start, end] = cond.slice(11).split('-').map((s) => parseInt(s.trim()))
      conditions.push({ type: 'timeWindow', start, end })
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
<<<<<<< HEAD
=======
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
>>>>>>> master
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
  if (!_model) {
    setStatus('まずモデルを読み込んでください', 'warn')
    return
  }
  const header = [
<<<<<<< HEAD
    'node_id', 'node_text', 'choice_id', 'choice_text', 'choice_target',
    'choice_conditions', 'choice_effects', 'choice_outcome_type', 'choice_outcome_value',
    'initial_flags', 'initial_resources'
=======
    'node_id', 'node_text', 'node_type', 'node_tags', 'node_assets',
    'choice_id', 'choice_text', 'choice_target',
    'choice_conditions', 'choice_effects', 'choice_outcome_type', 'choice_outcome_value',
    'choice_metadata', 'choice_variables',
    'initial_flags', 'initial_resources', 'global_metadata'
>>>>>>> master
  ]
  const rows = [header.join(',')]
  
  let firstRow = true
  for (const [nid, node] of Object.entries(_model.nodes)) {
    const initialFlags = firstRow && _model.flags ? serializeKeyValuePairs(_model.flags) : ''
    const initialResources = firstRow && _model.resources ? serializeKeyValuePairs(_model.resources) : ''
<<<<<<< HEAD
    firstRow = false
    
    if (!node.choices || node.choices.length === 0) {
      rows.push([
        nid, escapeCsv(node.text ?? ''), '', '', '',
        '', '', '', '', initialFlags, initialResources
=======
    const globalMetadata = firstRow && _model.metadata ? serializeKeyValuePairs(_model.metadata) : ''
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
>>>>>>> master
      ].join(','))
      continue
    }
    
    for (const ch of node.choices) {
      const conditions = ch.conditions ? serializeConditions(ch.conditions) : ''
      const effects = ch.effects ? serializeEffects(ch.effects) : ''
      const outcomeType = ch.outcome?.type || ''
      const outcomeValue = ch.outcome?.value || ''
      
<<<<<<< HEAD
      rows.push([
        nid, escapeCsv(node.text ?? ''), ch.id ?? '', escapeCsv(ch.text ?? ''), ch.target ?? '',
        escapeCsv(conditions), escapeCsv(effects), outcomeType, outcomeValue,
        initialFlags, initialResources
=======
      // Choice metadata and variables
      const choiceMetadata = ch.metadata ? serializeKeyValuePairs(ch.metadata) : ''
      const choiceVariables = ch.variables ? serializeKeyValuePairs(ch.variables) : ''
      
      rows.push([
        nid, escapeCsv(node.text ?? ''), nodeType, escapeCsv(nodeTags), escapeCsv(nodeAssets),
        ch.id ?? '', escapeCsv(ch.text ?? ''), ch.target ?? '',
        escapeCsv(conditions), escapeCsv(effects), outcomeType, outcomeValue,
        escapeCsv(choiceMetadata), escapeCsv(choiceVariables),
        initialFlags, initialResources, globalMetadata
>>>>>>> master
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
    if (cond.type === 'timeWindow') return `timeWindow:${cond.start}-${cond.end}`
    return ''
  }).filter(Boolean).join(';')
}

// 効果のシリアライズ
function serializeEffects(effects) {
  return effects.map((eff) => {
    if (eff.type === 'setFlag') return `setFlag:${eff.key}=${eff.value}`
    if (eff.type === 'addResource') return `addResource:${eff.key}=${eff.delta}`
<<<<<<< HEAD
=======
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
>>>>>>> master
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
<<<<<<< HEAD
=======
    // Validate model before saving
    const validationErrors = validateModel(_model.nodes)
    if (validationErrors.length > 0) {
      showErrors(validationErrors)
      setStatus(`モデルにエラーがあります: ${validationErrors.length}件`, 'warn')
      return
    }

    hideErrors()
    // Restart session with current model
>>>>>>> master
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
<<<<<<< HEAD
=======
    showErrors([err?.message ?? err])
>>>>>>> master
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
<<<<<<< HEAD
})

=======

  if (e.target.classList.contains('add-choice-btn')) {
    const nodeId = e.target.dataset.nodeId
    const node = _model.nodes[nodeId]
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
    if (Object.keys(_model.nodes).length <= 1) {
      setStatus('少なくとも1つのノードが必要です', 'warn')
      return
    }
    delete _model.nodes[nodeId]
    // Remove references to deleted node
    for (const [nid, node] of Object.entries(_model.nodes)) {
      node.choices = node.choices?.filter(c => c.target !== nodeId) ?? []
    }
    renderNodeList()
  }

  if (e.target.classList.contains('delete-choice-btn')) {
    const nodeId = e.target.dataset.nodeId
    const choiceIndex = parseInt(e.target.dataset.choiceIndex)
    const node = _model.nodes[nodeId]
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
    const node = _model.nodes[nodeId]
    const choice = node.choices[parseInt(choiceIndex)]
    if (choice) {
      choice[field] = value
    }
  } else {
    // ノードのフィールド更新
    const node = _model.nodes[nodeId]
    if (node) {
      node[field] = value
    }
  }
}

>>>>>>> master
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
