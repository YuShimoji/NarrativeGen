/**
 * GUI Editor Manager Module
 * Handles all GUI-based story editing functionality
 */

import { getCurrentModelName } from '../core/session.js'
import { NODE_TEMPLATES, DRAFT_MODEL_STORAGE_KEY } from '../config/constants.js'
import { NodeRenderer } from './node-renderer.js'
import { ModelUpdater } from './model-updater.js'
import { NodeManager } from './node-manager.js'
import { BatchEditor } from './batch-editor.js'
import { EndingAnalyzer } from './ending-analyzer.js'
import { PathTracker } from './path-tracker.js'
import { StatsPanel } from './stats-panel.js'
import {
  exportEndingStructureAsText,
  exportConditionsAsCsv,
  exportStatsAsJson,
  exportVisualizationAsPng,
  exportReportAsPdf,
  exportAll
} from '../utils/export-utils.js'

export class GuiEditorManager {
  constructor(appState) {
    this.appState = appState
    this.nodeList = null
    this.guiEditMode = null
    this.batchEditModal = null
    this.quickNodeModal = null
    this.batchChoiceModal = null
    this.paraphraseModal = null
    this.currentParaphraseTarget = null

    // Clipboard for copy/paste
    this.clipboard = null
    this.selectedNodeId = null

    // Live preview elements
    this.livePreviewPanel = null
    this.previewNodeDisplay = null
    this.previewChoices = null
    this.pathDisplay = null
    this.endingVisualizationDisplay = null
    this.endingStatsPanel = null

    // Initialize sub-managers
    this.nodeRenderer = new NodeRenderer(appState)
    this.modelUpdater = new ModelUpdater(appState)
    this.nodeManager = new NodeManager(appState)
    this.batchEditor = new BatchEditor(appState)

    // Initialize ending analysis modules
    this.endingAnalyzer = new EndingAnalyzer(appState)
    this.pathTracker = new PathTracker(appState)
    this.statsPanel = new StatsPanel(appState)

    // Analysis state
    this.currentAnalysisResult = null
    this.selectedEndingId = null
  }

  initialize(nodeListElement, guiEditModeElement, batchEditModalElement, quickNodeModalElement, batchChoiceModalElement, paraphraseModalElement, draftRestoreModalElement) {
    this.nodeList = nodeListElement
    this.guiEditMode = guiEditModeElement
    this.batchEditModal = batchEditModalElement
    this.quickNodeModal = quickNodeModalElement
    this.batchChoiceModal = batchChoiceModalElement
    this.paraphraseModal = paraphraseModalElement
    this.draftRestoreModal = draftRestoreModalElement

    // Initialize sub-managers
    this.nodeRenderer.initialize(nodeListElement)
    this.modelUpdater.initialize(guiEditModeElement)
    this.batchEditor.initialize(batchEditModalElement)

    // Setup condition/effect editor event handlers
    this._setupConditionEffectHandlers()

    // Setup drag and drop functionality
    this.nodeRenderer.setupDragAndDrop()
    this.nodeRenderer.setOnModelUpdate(() => {
      // モデル更新時にマルチエンディング可視化を更新
      this._updateEndingVisualization()
    })

    // Setup node selection callback
    this.nodeRenderer.setOnNodeSelect((nodeId) => {
      this.selectNode(nodeId)
    })

    // Initialize live preview
    this._initializeLivePreview()
    
    // モデル変更時にマルチエンディング可視化を更新
    if (this.appState.model) {
      this._updateEndingVisualization()
    }
  }

  /**
   * リアルタイムプレビューを初期化
   */
  _initializeLivePreview() {
    this.livePreviewPanel = document.getElementById('livePreviewPanel')
    this.previewNodeDisplay = document.getElementById('previewNodeDisplay')
    this.previewChoices = document.getElementById('previewChoices')
    this.pathDisplay = document.getElementById('pathDisplay')
    this.endingVisualizationDisplay = document.getElementById('endingVisualizationDisplay')
    this.endingStatsPanel = document.getElementById('endingStatsPanel')

    const toggleBtn = document.getElementById('togglePreviewBtn')
    if (toggleBtn && this.livePreviewPanel) {
      toggleBtn.addEventListener('click', () => {
        this.livePreviewPanel.classList.toggle('collapsed')
      })
    }

    // Initialize stats panel
    if (this.endingStatsPanel) {
      this.statsPanel.initialize(this.endingStatsPanel)
      this.statsPanel.setOnEndingClick((endingId) => {
        this._focusEnding(endingId)
      })
    }

    // Setup path tracker callbacks
    this.pathTracker.setCallbacks({
      onNodeHighlight: (nodeId, index, total) => {
        // Update UI during path animation
      },
      onPathComplete: (path) => {
        // Path animation complete
      }
    })

    // Setup export button handlers
    this._setupExportHandlers()
  }

  /**
   * リアルタイムプレビューを更新
   */
  updateLivePreview(nodeId) {
    if (!this.previewNodeDisplay || !this.appState.model) return

    const node = nodeId ? this.appState.model.nodes[nodeId] : null

    if (!node) {
      this.previewNodeDisplay.innerHTML = `
        <p class="preview-placeholder">ノードを選択するとプレビューが表示されます</p>
      `
      if (this.previewChoices) this.previewChoices.innerHTML = ''
      if (this.pathDisplay) this.pathDisplay.innerHTML = ''
      return
    }

    // Display node content
    this.previewNodeDisplay.innerHTML = `
      <div class="preview-node-id">${nodeId}</div>
      <div class="preview-node-text">${this._escapeHtml(node.text || '(テキストなし)')}</div>
    `

    // Display choices
    if (this.previewChoices) {
      if (node.choices && node.choices.length > 0) {
        this.previewChoices.innerHTML = node.choices.map((choice, i) => `
          <div class="preview-choice-item" data-target="${choice.target || ''}">
            <span class="preview-choice-arrow">→</span>
            <span class="preview-choice-text">${this._escapeHtml(choice.text || '(選択肢' + (i + 1) + ')')}</span>
            <span class="preview-choice-target">${choice.target || '未設定'}</span>
          </div>
        `).join('')

        // Add click handlers for choices
        this.previewChoices.querySelectorAll('.preview-choice-item').forEach(item => {
          item.addEventListener('click', () => {
            const target = item.dataset.target
            if (target && this.appState.model.nodes[target]) {
              this.selectNode(target)
            }
          })
        })
      } else {
        this.previewChoices.innerHTML = `
          <p style="color: var(--color-text-muted); font-size: 0.85rem;">選択肢なし（エンディング候補）</p>
        `
      }
    }

    // Display path from start
    if (this.pathDisplay) {
      const path = this._findPathToNode(nodeId)
      if (path.length > 0) {
        this.pathDisplay.innerHTML = path.map((id, i) => 
          `<span class="path-node" data-node="${id}">${id}</span>` +
          (i < path.length - 1 ? '<span class="path-arrow">→</span>' : '')
        ).join('')

        // Add click handlers for path nodes
        this.pathDisplay.querySelectorAll('.path-node').forEach(node => {
          node.addEventListener('click', () => {
            const targetId = node.dataset.node
            if (targetId) this.selectNode(targetId)
          })
        })
      } else {
        this.pathDisplay.innerHTML = '<span style="color: var(--color-text-muted);">スタートノードから到達不能</span>'
      }
    }
  }

  /**
   * スタートノードから指定ノードへのパスを探索（BFS）
   */
  _findPathToNode(targetNodeId) {
    if (!this.appState.model) return []

    const startNode = this.appState.model.startNode || 'start'
    if (targetNodeId === startNode) return [startNode]

    const queue = [[startNode]]
    const visited = new Set([startNode])

    while (queue.length > 0) {
      const path = queue.shift()
      const currentId = path[path.length - 1]
      const current = this.appState.model.nodes[currentId]

      if (!current || !current.choices) continue

      for (const choice of current.choices) {
        if (!choice.target || visited.has(choice.target)) continue

        const newPath = [...path, choice.target]
        if (choice.target === targetNodeId) {
          return newPath
        }

        visited.add(choice.target)
        queue.push(newPath)
      }
    }

    return []
  }

  /**
   * HTMLエスケープ
   */
  _escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * エンディングノードかどうかを判定
   */
  _isEndingNode(nodeId, node) {
    if (!node) return false
    
    // 選択肢がない、または空の選択肢配列
    const hasNoChoices = !node.choices || node.choices.length === 0
    
    // 有効な遷移先を持つ選択肢がない
    const hasNoValidTargets = node.choices && 
      node.choices.length > 0 && 
      node.choices.every(c => !c.target)

    if (hasNoChoices || hasNoValidTargets) {
      // エンディングノードとしてマークされているかチェック
      return node.isEnding || 
             node.type === 'ending' ||
             nodeId.toLowerCase().includes('end') ||
             nodeId.toLowerCase().includes('ending')
    }
    
    return false
  }

  /**
   * 全エンディングノードを検出
   */
  _findAllEndingNodes() {
    if (!this.appState.model) return []
    
    const endingNodes = []
    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
      if (this._isEndingNode(nodeId, node)) {
        endingNodes.push(nodeId)
      }
    }
    return endingNodes
  }

  /**
   * 条件を文字列としてフォーマット
   */
  _formatCondition(condition) {
    if (!condition) return ''
    
    if (condition.type === 'flag') {
      return `flag:${condition.key}=${condition.value}`
    }
    if (condition.type === 'resource') {
      return `res:${condition.key}${condition.op}${condition.value}`
    }
    if (condition.type === 'variable') {
      return `var:${condition.key}${condition.op}${condition.value}`
    }
    if (condition.type === 'timeWindow') {
      return `time:${condition.start}-${condition.end}`
    }
    if (condition.type === 'and') {
      return `AND(${condition.conditions.map(c => this._formatCondition(c)).join(', ')})`
    }
    if (condition.type === 'or') {
      return `OR(${condition.conditions.map(c => this._formatCondition(c)).join(', ')})`
    }
    if (condition.type === 'not') {
      return `NOT(${this._formatCondition(condition.condition)})`
    }
    return JSON.stringify(condition)
  }

  /**
   * パスの到達条件を計算（パス上の全選択肢の条件を結合）
   */
  _calculatePathConditions(path) {
    if (!this.appState.model || path.length < 2) return []
    
    const conditions = []
    
    for (let i = 0; i < path.length - 1; i++) {
      const currentNodeId = path[i]
      const nextNodeId = path[i + 1]
      const currentNode = this.appState.model.nodes[currentNodeId]
      
      if (!currentNode || !currentNode.choices) continue
      
      // 次のノードへの選択肢を探す
      for (const choice of currentNode.choices) {
        if (choice.target === nextNodeId) {
          // この選択肢の条件を追加
          if (choice.conditions && choice.conditions.length > 0) {
            conditions.push({
              fromNode: currentNodeId,
              toNode: nextNodeId,
              choiceText: choice.text || '',
              conditions: choice.conditions
            })
          }
          break
        }
      }
    }
    
    return conditions
  }

  /**
   * エンディングノードへの全パスを抽出（DFS、最適化版）
   * 大規模モデルでもパフォーマンスを維持するため、深さ制限と最大パス数を設定
   */
  _findAllPathsToEnding(endingNodeId, visited = new Set(), currentPath = [], maxDepth = 50, maxPaths = 100) {
    if (!this.appState.model) return []
    
    const startNodeId = this.appState.model.startNode || this.appState.model.meta?.startNodeId || 'start'
    
    // スタートノードから開始
    if (currentPath.length === 0) {
      currentPath = [startNodeId]
      visited = new Set([startNodeId])
    }
    
    // 深さ制限チェック
    if (currentPath.length > maxDepth) {
      return []
    }
    
    const paths = []
    const currentNodeId = currentPath[currentPath.length - 1]
    
    // エンディングノードに到達した場合
    if (currentNodeId === endingNodeId) {
      return [currentPath]
    }
    
    // 最大パス数に達した場合は探索を停止
    if (paths.length >= maxPaths) {
      return paths
    }
    
    const currentNode = this.appState.model.nodes[currentNodeId]
    if (!currentNode || !currentNode.choices) return []
    
    // 各選択肢を探索
    for (const choice of currentNode.choices) {
      if (!choice.target) continue
      
      const targetNodeId = choice.target
      
      // 循環参照を防ぐ（既にパスに含まれている場合はスキップ）
      if (currentPath.includes(targetNodeId)) continue
      
      // 新しいパスを作成
      const newPath = [...currentPath, targetNodeId]
      
      // 再帰的に探索
      const subPaths = this._findAllPathsToEnding(endingNodeId, visited, newPath, maxDepth, maxPaths - paths.length)
      paths.push(...subPaths)
      
      // 最大パス数に達した場合は探索を停止
      if (paths.length >= maxPaths) {
        break
      }
    }
    
    return paths
  }

  /**
   * マルチエンディング可視化を更新
   */
  _updateEndingVisualization() {
    if (!this.endingVisualizationDisplay || !this.appState.model) return
    
    const endingNodes = this._findAllEndingNodes()
    
    if (endingNodes.length === 0) {
      this.endingVisualizationDisplay.innerHTML = `
        <p style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 1rem;">
          エンディングノードが見つかりません
        </p>
      `
      return
    }
    
    let html = `<div class="ending-visualization-header">
      <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600;">
        エンディング一覧 (${endingNodes.length}個)
      </h4>
    </div>`
    
    // 各エンディングについて処理
    for (const endingNodeId of endingNodes) {
      const endingNode = this.appState.model.nodes[endingNodeId]
      const paths = this._findAllPathsToEnding(endingNodeId)
      
      html += `<div class="ending-item" style="margin-bottom: 1rem; padding: 0.75rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
        <div class="ending-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span class="ending-node-id" style="font-weight: 600; color: var(--color-primary); cursor: pointer;" data-node="${endingNodeId}">${endingNodeId}</span>
          <span class="ending-path-count" style="font-size: 0.75rem; color: var(--color-text-muted);">(${paths.length}パス)</span>
        </div>
        <div class="ending-node-text" style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.5rem; max-height: 3em; overflow: hidden; text-overflow: ellipsis;">
          ${this._escapeHtml((endingNode.text || '(テキストなし)').substring(0, 100))}
        </div>
        <div class="ending-paths" style="margin-top: 0.5rem;">
      `
      
      if (paths.length === 0) {
        html += `<p style="font-size: 0.75rem; color: var(--color-text-muted); font-style: italic;">スタートノードから到達不能</p>`
      } else {
        // パスを表示（最大5パスまで）
        const displayPaths = paths.slice(0, 5)
        for (let i = 0; i < displayPaths.length; i++) {
          const path = displayPaths[i]
          const conditions = this._calculatePathConditions(path)
          
          html += `<div class="ending-path-item" style="margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(91, 141, 239, 0.05); border-radius: var(--radius-sm);">
            <div class="path-nodes" style="display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; margin-bottom: 0.25rem;">
          `
          
          // パス上のノードを表示
          path.forEach((nodeId, idx) => {
            html += `<span class="path-node-small" style="padding: 0.125rem 0.375rem; background: var(--color-surface); border-radius: 3px; font-size: 0.75rem; cursor: pointer; color: var(--color-primary);" data-node="${nodeId}">${nodeId}</span>`
            if (idx < path.length - 1) {
              html += `<span style="color: var(--color-text-muted); font-size: 0.75rem;">→</span>`
            }
          })
          
          html += `</div>`
          
          // 到達条件を表示
          if (conditions.length > 0) {
            html += `<div class="path-conditions" style="margin-top: 0.25rem; padding-top: 0.25rem; border-top: 1px solid var(--color-border);">
              <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">到達条件:</div>
            `
            
            conditions.forEach(condGroup => {
              if (condGroup.conditions && condGroup.conditions.length > 0) {
                const condTexts = condGroup.conditions.map(c => this._formatCondition(c))
                html += `<div style="font-size: 0.7rem; color: var(--color-text-muted); padding-left: 0.5rem;">
                  ${condGroup.fromNode} → ${condGroup.toNode}: ${condTexts.join(', ')}
                </div>`
              }
            })
            
            html += `</div>`
          }
          
          html += `</div>`
        }
        
        if (paths.length > 5) {
          html += `<p style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic; margin-top: 0.25rem;">
            他 ${paths.length - 5} パスがあります
          </p>`
        }
      }
      
      html += `</div></div>`
    }
    
    this.endingVisualizationDisplay.innerHTML = html
    
    // ノードクリックハンドラを追加
    this.endingVisualizationDisplay.querySelectorAll('.path-node-small, .ending-node-id').forEach(el => {
      el.addEventListener('click', () => {
        const nodeId = el.dataset.node
        if (nodeId) {
          this.selectNode(nodeId)
        }
      })
    })

    // パスアイテムにインタラクティブハンドラを追加
    this.endingVisualizationDisplay.querySelectorAll('.ending-path-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        const nodes = Array.from(item.querySelectorAll('.path-node-small')).map(n => n.dataset.node)
        if (nodes.length > 0) {
          this.pathTracker.highlightPath(nodes, false)
        }
      })

      item.addEventListener('mouseleave', () => {
        this.pathTracker.clearHighlight()
      })

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('path-node-small')) return
        const nodes = Array.from(item.querySelectorAll('.path-node-small')).map(n => n.dataset.node)
        if (nodes.length > 0) {
          this.pathTracker.focusPath(nodes)
          this._showPathDetails(nodes)
        }
      })
    })
  }

  /**
   * エンディング分析を実行
   */
  runEndingAnalysis() {
    if (!this.appState.model) return null

    this.endingAnalyzer.clearCache()
    this.currentAnalysisResult = this.endingAnalyzer.analyzeAll()

    // 統計パネルを更新
    if (this.statsPanel && this.currentAnalysisResult) {
      this.statsPanel.setAnalysisResult(this.currentAnalysisResult)
    }

    // 可視化を更新
    this._updateEndingVisualization()

    return this.currentAnalysisResult
  }

  /**
   * エンディングにフォーカス
   */
  _focusEnding(endingId) {
    this.selectedEndingId = endingId

    // エンディングアイテムをハイライト
    this.endingVisualizationDisplay?.querySelectorAll('.ending-item').forEach(item => {
      const nodeIdEl = item.querySelector('.ending-node-id')
      if (nodeIdEl?.dataset.node === endingId) {
        item.classList.add('ending-focused')
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else {
        item.classList.remove('ending-focused')
      }
    })

    // 最初のパスをハイライト
    const endingResult = this.currentAnalysisResult?.endings?.find(e => e.endingId === endingId)
    if (endingResult?.paths?.[0]) {
      this.pathTracker.highlightPath(endingResult.paths[0].nodes, true)
    }
  }

  /**
   * パス詳細を表示
   */
  _showPathDetails(path) {
    const detailsHtml = this.pathTracker.renderPathDetails(path)
    
    // パス詳細パネルがあれば更新
    const pathDetailsPanel = document.getElementById('pathDetailsPanel')
    if (pathDetailsPanel) {
      pathDetailsPanel.innerHTML = detailsHtml
      pathDetailsPanel.classList.add('visible')
    }
  }

  /**
   * エクスポートハンドラをセットアップ
   */
  _setupExportHandlers() {
    const exportTextBtn = document.getElementById('exportEndingText')
    const exportCsvBtn = document.getElementById('exportEndingCsv')
    const exportJsonBtn = document.getElementById('exportEndingJson')
    const exportPngBtn = document.getElementById('exportEndingPng')
    const exportPdfBtn = document.getElementById('exportEndingPdf')
    const exportAllBtn = document.getElementById('exportEndingAll')
    const runAnalysisBtn = document.getElementById('runEndingAnalysis')

    const getModelName = () => getCurrentModelName() || 'model'

    if (exportTextBtn) {
      exportTextBtn.addEventListener('click', () => {
        if (this.currentAnalysisResult) {
          exportEndingStructureAsText(this.currentAnalysisResult, getModelName())
        }
      })
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        if (this.currentAnalysisResult) {
          exportConditionsAsCsv(this.currentAnalysisResult, getModelName())
        }
      })
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        if (this.currentAnalysisResult && this.statsPanel) {
          exportStatsAsJson(this.statsPanel.getStatsAsJson(), getModelName())
        }
      })
    }

    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', async () => {
        if (this.endingVisualizationDisplay) {
          await exportVisualizationAsPng(this.endingVisualizationDisplay, `ending-viz-${getModelName()}.png`)
        }
      })
    }

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', async () => {
        if (this.currentAnalysisResult) {
          await exportReportAsPdf(this.currentAnalysisResult, this.statsPanel?.getStatsAsJson(), getModelName())
        }
      })
    }

    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', async () => {
        if (this.currentAnalysisResult) {
          await exportAll(
            this.currentAnalysisResult,
            this.statsPanel?.getStatsAsJson(),
            this.endingVisualizationDisplay,
            getModelName()
          )
        }
      })
    }

    if (runAnalysisBtn) {
      runAnalysisBtn.addEventListener('click', () => {
        this.runEndingAnalysis()
      })
    }
  }

  /**
   * 条件/効果エディタのイベントハンドラを設定
   */
  _setupConditionEffectHandlers() {
    if (!this.nodeList) return

    try {
      const conditionEffectEditor = this.nodeRenderer.getConditionEffectEditor()
      if (!conditionEffectEditor) {
        console.warn('[GuiEditorManager] conditionEffectEditor not available')
        return
      }
      
      conditionEffectEditor.setupEventListeners(this.nodeList, {
        onAddCondition: (nodeId, choiceIndex, newCondition) => {
          this._addConditionToChoice(nodeId, choiceIndex, newCondition)
        },
        onAddEffect: (nodeId, choiceIndex, newEffect) => {
          this._addEffectToChoice(nodeId, choiceIndex, newEffect)
        },
        onDeleteCondition: (nodeId, choiceIndex, conditionIndex) => {
          this._deleteConditionFromChoice(nodeId, choiceIndex, conditionIndex)
        },
        onDeleteEffect: (nodeId, choiceIndex, effectIndex) => {
          this._deleteEffectFromChoice(nodeId, choiceIndex, effectIndex)
        },
        onValueChange: (e) => {
          this._handleConditionEffectChange(e)
        }
      })
    } catch (error) {
      console.warn('[GuiEditorManager] _setupConditionEffectHandlers failed:', error)
    }
  }

  /**
   * 選択肢に条件を追加
   */
  _addConditionToChoice(nodeId, choiceIndex, newCondition) {
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices || !node.choices[choiceIndex]) return

    if (!node.choices[choiceIndex].conditions) {
      node.choices[choiceIndex].conditions = []
    }
    node.choices[choiceIndex].conditions.push(newCondition)
    
    this.renderChoicesForNode(nodeId)
    this.modelUpdater.saveDraftModel()
  }

  /**
   * 選択肢に効果を追加
   */
  _addEffectToChoice(nodeId, choiceIndex, newEffect) {
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices || !node.choices[choiceIndex]) return

    if (!node.choices[choiceIndex].effects) {
      node.choices[choiceIndex].effects = []
    }
    node.choices[choiceIndex].effects.push(newEffect)
    
    this.renderChoicesForNode(nodeId)
    this.modelUpdater.saveDraftModel()
  }

  /**
   * 選択肢から条件を削除
   */
  _deleteConditionFromChoice(nodeId, choiceIndex, conditionIndex) {
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices || !node.choices[choiceIndex]) return
    if (!node.choices[choiceIndex].conditions) return

    node.choices[choiceIndex].conditions.splice(conditionIndex, 1)
    
    this.renderChoicesForNode(nodeId)
    this.modelUpdater.saveDraftModel()
  }

  /**
   * 選択肢から効果を削除
   */
  _deleteEffectFromChoice(nodeId, choiceIndex, effectIndex) {
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices || !node.choices[choiceIndex]) return
    if (!node.choices[choiceIndex].effects) return

    node.choices[choiceIndex].effects.splice(effectIndex, 1)
    
    this.renderChoicesForNode(nodeId)
    this.modelUpdater.saveDraftModel()
  }

  /**
   * 条件/効果の値変更を処理（デバウンス付き）
   */
  _handleConditionEffectChange(e) {
    // Debounce to avoid too many updates
    if (this._conditionEffectDebounceTimer) {
      clearTimeout(this._conditionEffectDebounceTimer)
    }
    
    this._conditionEffectDebounceTimer = setTimeout(() => {
      const conditionItem = e.target.closest('.condition-item')
      const effectItem = e.target.closest('.effect-item')
      
      if (conditionItem) {
        this._updateConditionFromElement(conditionItem)
      } else if (effectItem) {
        this._updateEffectFromElement(effectItem)
      }
    }, 300)
  }

  /**
   * DOM要素から条件を更新
   */
  _updateConditionFromElement(itemElement) {
    const editorContainer = itemElement.closest('.conditions-editor')
    if (!editorContainer) return

    const nodeId = editorContainer.dataset.nodeId
    const choiceIndex = parseInt(editorContainer.dataset.choiceIndex)
    const conditionIndex = parseInt(itemElement.dataset.conditionIndex)
    
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices || !node.choices[choiceIndex]) return
    if (!node.choices[choiceIndex].conditions) return

    const conditionEffectEditor = this.nodeRenderer.getConditionEffectEditor()
    const newCondition = conditionEffectEditor.readConditionFromElement(itemElement)
    
    if (newCondition) {
      node.choices[choiceIndex].conditions[conditionIndex] = newCondition
      this.modelUpdater.saveDraftModel()
    }
  }

  /**
   * DOM要素から効果を更新
   */
  _updateEffectFromElement(itemElement) {
    const editorContainer = itemElement.closest('.effects-editor')
    if (!editorContainer) return

    const nodeId = editorContainer.dataset.nodeId
    const choiceIndex = parseInt(editorContainer.dataset.choiceIndex)
    const effectIndex = parseInt(itemElement.dataset.effectIndex)
    
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices || !node.choices[choiceIndex]) return
    if (!node.choices[choiceIndex].effects) return

    const conditionEffectEditor = this.nodeRenderer.getConditionEffectEditor()
    const newEffect = conditionEffectEditor.readEffectFromElement(itemElement)
    
    if (newEffect) {
      node.choices[choiceIndex].effects[effectIndex] = newEffect
      this.modelUpdater.saveDraftModel()
    }
  }

  // Main rendering function
  renderNodeList() {
    const result = this.nodeRenderer.renderNodeList()
    // ノードリスト更新時にマルチエンディング可視化を更新
    this._updateEndingVisualization()
    return result
  }

  renderChoicesForNode(nodeId) {
    return this.nodeRenderer.renderChoicesForNode(nodeId)
  }

  // Batch editing functionality
  getBatchEditManager() {
    return {
      openModal: () => {
        this.batchEditor.openModal()
        this.batchEditor._updateHistoryUI()
      },
      closeModal: () => this.batchEditor.closeModal(),
      applyTextReplace: () => {
        this.batchEditor.applyTextReplace()
        this.renderNodeList()
      },
      applyChoiceReplace: () => {
        this.batchEditor.applyChoiceTextReplace()
        this.renderNodeList()
      },
      applyTargetReplace: () => {
        this.batchEditor.applyTargetReplace()
        this.renderNodeList()
      },
      updatePreview: () => this.batchEditor.updateReplacePreview(),
      refreshUI: () => this.renderNodeList(),
      // Advanced batch operations
      undo: () => {
        this.batchEditor.undo()
        this.renderNodeList()
      },
      redo: () => {
        this.batchEditor.redo()
        this.renderNodeList()
      },
      exportHistory: () => this.batchEditor.exportHistory(),
      importHistory: (file) => this.batchEditor.importHistory(file),
      clearHistory: () => this.batchEditor.clearHistory(),
      getHistoryState: () => this.batchEditor.getHistoryState(),
      getFilterSettings: () => this.batchEditor.getFilterSettings(),
      updateFilterSettings: (settings) => this.batchEditor.updateFilterSettings(settings),
      resetFilters: () => this.batchEditor.resetFilters()
    }
  }

  // Quick node creation
  openQuickNodeModal() {
    if (!this.appState.model) {
      setStatus('まずモデルを読み込んでください', 'warn')
      return
    }

    const modal = this.quickNodeModal
    const quickNodeId = document.getElementById('quickNodeId')
    const quickNodeText = document.getElementById('quickNodeText')
    const nodeTemplate = document.getElementById('nodeTemplate')

    if (quickNodeId) quickNodeId.value = ''
    if (quickNodeText) quickNodeText.value = ''
    if (nodeTemplate) nodeTemplate.value = 'blank'

    // Update custom template options
    this._updateCustomTemplateOptions()

    modal.style.display = 'flex'
    modal.classList.add('show')
  }

  /**
   * カスタムテンプレートのセレクトオプションを更新
   */
  _updateCustomTemplateOptions() {
    const customTemplateGroup = document.getElementById('customTemplateGroup')
    if (!customTemplateGroup) return

    const templates = this.getCustomTemplates()

    if (templates.length === 0) {
      customTemplateGroup.innerHTML = '<option disabled>カスタムテンプレートなし</option>'
      return
    }

    customTemplateGroup.innerHTML = templates.map(template => 
      `<option value="${template.id}">${template.name}</option>`
    ).join('')
  }

  createQuickNode() {
    const nodeTemplateSelect = document.getElementById('nodeTemplate')
    const quickNodeId = document.getElementById('quickNodeId')
    const quickNodeText = document.getElementById('quickNodeText')

    const templateKey = nodeTemplateSelect.value
    let nodeId = quickNodeId.value.trim()
    const nodeText = quickNodeText.value.trim()

    // Generate ID if not provided
    if (!nodeId) {
      nodeId = this.generateNodeId()
    }

    // Check if ID already exists
    if (this.appState.model.nodes[nodeId]) {
      setStatus(`❌ ノードID「${nodeId}」は既に存在します`, 'error')
      return
    }

    // Get template (supports both built-in and custom templates)
    const template = this.getTemplateNodeData(templateKey)
    const newNode = {
      id: nodeId,
      text: nodeText || template.text,
      choices: template.choices ? JSON.parse(JSON.stringify(template.choices)) : []
    }

    // Add to model
    this.appState.model.nodes[nodeId] = newNode

    // Close modal
    this.quickNodeModal.style.display = 'none'
    this.quickNodeModal.classList.remove('show')

    // Refresh UI
    if (this.nodeList) {
      this.renderNodeList()
    }

    setStatus(`✅ ノード「${nodeId}」を作成しました`, 'success')
  }

  // Batch choice editing
  openBatchChoiceModal() {
    if (!this.appState.model) {
      setStatus('まずモデルを読み込んでください', 'warn')
      return
    }

    const modal = this.batchChoiceModal
    const nodeSelect = document.getElementById('batchNodeSelect')

    // Populate node list
    if (nodeSelect) {
      nodeSelect.innerHTML = '<option value="">ノードを選択...</option>'
      Object.keys(this.appState.model.nodes).forEach(nodeId => {
        const option = document.createElement('option')
        option.value = nodeId
        option.textContent = `${nodeId} - ${this.appState.model.nodes[nodeId].text?.substring(0, 30) || '(テキストなし)'}`
        nodeSelect.appendChild(option)
      })
    }

    modal.style.display = 'flex'
    modal.classList.add('show')
  }

  updateBatchChoiceList() {
    const nodeSelect = document.getElementById('batchNodeSelect')
    const choiceList = document.getElementById('batchChoiceList')

    if (!nodeSelect || !choiceList) return

    const nodeId = nodeSelect.value
    if (!nodeId || !this.appState.model.nodes[nodeId]) {
      choiceList.innerHTML = '<p class="gui-batch-choice-empty">ノードを選択してください</p>'
      return
    }

    const node = this.appState.model.nodes[nodeId]
    const choices = node.choices || []

    if (choices.length === 0) {
      choiceList.innerHTML = '<p class="gui-batch-choice-empty">このノードには選択肢がありません</p>'
      return
    }

    choiceList.innerHTML = '<div class="gui-batch-choice-list"></div>'
    const container = choiceList.firstElementChild

    choices.forEach((choice, index) => {
      const div = document.createElement('div')
      div.className = 'gui-batch-choice-item'
      div.innerHTML = `
        <div class="gui-batch-choice-item-title">選択肢 ${index + 1}</div>
        <div class="gui-batch-choice-item-text">${choice.text || '(テキストなし)'}</div>
        <div class="gui-batch-choice-item-target">→ ${choice.target || '(ターゲットなし)'}</div>
      `
      container.appendChild(div)
    })
  }

  applyBatchChoice() {
    const nodeSelect = document.getElementById('batchNodeSelect')
    if (!nodeSelect) return

    const nodeId = nodeSelect.value
    if (!nodeId || !this.appState.model.nodes[nodeId]) {
      setStatus('❌ ノードを選択してください', 'error')
      return
    }

    const node = this.appState.model.nodes[nodeId]
    const applyCondition = document.getElementById('batchCondition')?.checked
    const applyEffect = document.getElementById('batchEffect')?.checked
    const conditionText = document.getElementById('batchConditionText')?.value.trim()
    const effectText = document.getElementById('batchEffectText')?.value.trim()

    const conditionEffectEditor = this.nodeRenderer.getConditionEffectEditor()
    if (!conditionEffectEditor) {
      setStatus('❌ 条件/効果エディタが初期化されていません', 'error')
      return
    }

    if (!applyCondition && !applyEffect) {
      setStatus('❌ 適用対象（条件/効果）を選択してください', 'error')
      return
    }

    if (applyCondition && !conditionText) {
      setStatus('❌ 共通条件の入力が空です', 'error')
      return
    }

    if (applyEffect && !effectText) {
      setStatus('❌ 共通効果の入力が空です', 'error')
      return
    }

    const parsedCondition = applyCondition ? conditionEffectEditor.parseConditionInput(conditionText) : null
    if (applyCondition && !parsedCondition) {
      setStatus('❌ 共通条件をパースできませんでした', 'error')
      return
    }

    const parsedEffect = applyEffect ? conditionEffectEditor.parseEffectInput(effectText) : null
    if (applyEffect && !parsedEffect) {
      setStatus('❌ 共通効果をパースできませんでした', 'error')
      return
    }

    const cloneValue = (v) => {
      if (!v || typeof v !== 'object') return v
      try {
        return JSON.parse(JSON.stringify(v))
      } catch {
        return v
      }
    }

    let modifiedChoices = 0

    if (node.choices) {
      node.choices.forEach(choice => {
        let changed = false
        if (applyCondition && conditionText) {
          choice.conditions = choice.conditions || []
          choice.conditions.push(cloneValue(parsedCondition))
          changed = true
        }
        if (applyEffect && effectText) {
          choice.effects = choice.effects || []
          choice.effects.push(cloneValue(parsedEffect))
          changed = true
        }

        if (changed) modifiedChoices++
      })
    }

    // Close modal
    this.batchChoiceModal.style.display = 'none'
    this.batchChoiceModal.classList.remove('show')

    // Refresh UI
    if (this.nodeList) {
      this.renderNodeList()
    }

    this.modelUpdater.saveDraftModel()

    setStatus(`✅ ${modifiedChoices}個の選択肢に変更を適用しました`, 'success')
  }

  // Paraphrase functionality
  showParaphraseVariants(targetInput, variants) {
    this.currentParaphraseTarget = targetInput
    const variantList = document.getElementById('variantList')
    if (!variantList) return

    variantList.innerHTML = ''

    variants.forEach((variant, index) => {
      const variantItem = document.createElement('div')
      variantItem.className = 'variant-item'
      variantItem.textContent = `${index + 1}. ${variant}`
      variantItem.addEventListener('click', () => {
        this.selectParaphraseVariant(variant)
      })
      variantList.appendChild(variantItem)
    })

    const modal = this.paraphraseModal
    modal.style.display = 'flex'
    modal.classList.add('show')
  }

  selectParaphraseVariant(variant) {
    if (this.currentParaphraseTarget) {
      this.currentParaphraseTarget.value = variant
      // Update model
      this.updateModelFromInput(this.currentParaphraseTarget)
      setStatus('言い換えバリアントを適用しました', 'success')
    }
    this.hideParaphraseModal()
  }

  hideParaphraseModal() {
    const modal = this.paraphraseModal
    modal.style.display = 'none'
    modal.classList.remove('show')
    this.currentParaphraseTarget = null
  }

  // Model update from input
  updateModelFromInput(input) {
    return this.modelUpdater.updateModelFromInput(input)
  }

  // Draft model functionality
  saveDraftModel() {
    const result = this.modelUpdater.saveDraftModel()
    // モデル保存時にマルチエンディング可視化を更新
    this._updateEndingVisualization()
    return result
  }

  /**
   * GUI編集モード開始時に元モデルを保存
   * キャンセル時に復元するために使用
   */
  saveOriginalModel() {
    if (!this.appState.model) return

    try {
      const originalData = {
        model: JSON.parse(JSON.stringify(this.appState.model)), // Deep copy
        modelName: getCurrentModelName(),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(ORIGINAL_MODEL_STORAGE_KEY, JSON.stringify(originalData))
    } catch (error) {
      console.warn('Failed to save original model:', error)
    }
  }

  /**
   * 元モデルを復元
   * @returns {boolean} 復元に成功したかどうか
   */
  restoreOriginalModel() {
    try {
      const originalDataStr = localStorage.getItem(ORIGINAL_MODEL_STORAGE_KEY)
      if (!originalDataStr) {
        return false
      }

      const originalData = JSON.parse(originalDataStr)
      if (!originalData.model) {
        return false
      }

      // 元モデルを復元
      this.appState.model = JSON.parse(JSON.stringify(originalData.model)) // Deep copy
      
      // 元モデルのストレージをクリア
      localStorage.removeItem(ORIGINAL_MODEL_STORAGE_KEY)
      
      return true
    } catch (error) {
      console.warn('Failed to restore original model:', error)
      return false
    }
  }

  /**
   * 元モデルのストレージをクリア
   */
  clearOriginalModel() {
    localStorage.removeItem(ORIGINAL_MODEL_STORAGE_KEY)
  }

  // Node management
  renameNodeId(oldId, newIdRaw) {
    this.nodeManager.renameNodeId(oldId, newIdRaw)
    // UI 更新
    if (this.nodeList) {
      this.renderNodeList()
    }
    // ドラフト保存
    this.saveDraftModel()
  }

  addChoice(nodeId) {
    this.nodeManager.addChoice(nodeId)
    this.renderChoicesForNode(nodeId)
  }

  deleteNode(nodeId) {
    this.nodeManager.deleteNode(nodeId)
    this.renderNodeList()
  }

  deleteChoice(nodeId, choiceIndex) {
    this.nodeManager.deleteChoice(nodeId, choiceIndex)
    this.renderChoicesForNode(nodeId)
  }

  // Utility functions
  generateNodeId() {
    return this.nodeManager.generateNodeId()
  }

  getNodeTemplate(templateKey) {
    return NODE_TEMPLATES[templateKey] || NODE_TEMPLATES.blank
  }

  // ============================================================================
  // Copy & Paste functionality
  // ============================================================================

  /**
   * 選択中のノードを設定
   * @param {string} nodeId - ノードID
   */
  selectNode(nodeId) {
    this.selectedNodeId = nodeId
    // 選択状態をUIに反映
    this._updateNodeSelection()
    // リアルタイムプレビューを更新
    this.updateLivePreview(nodeId)
  }

  /**
   * ノード選択を解除
   */
  clearSelection() {
    this.selectedNodeId = null
    this._updateNodeSelection()
    this.updateLivePreview(null)
  }

  /**
   * ノード選択のUIを更新
   */
  _updateNodeSelection() {
    if (!this.nodeList) return

    // 全ての選択状態をクリア
    const allCards = this.nodeList.querySelectorAll('.gui-node-card')
    allCards.forEach(card => card.classList.remove('selected'))

    // 選択中のノードをハイライト
    if (this.selectedNodeId) {
      const selectedCard = this.nodeList.querySelector(`[data-node-id="${this.selectedNodeId}"]`)
      if (selectedCard) {
        selectedCard.classList.add('selected')
      }
    }
  }

  /**
   * ノードをクリップボードにコピー
   * @param {string} [nodeId] - コピーするノードID（省略時は選択中のノード）
   * @returns {boolean} 成功時true
   */
  copyNode(nodeId = null) {
    const targetId = nodeId || this.selectedNodeId
    if (!targetId) {
      if (typeof setStatus !== 'undefined') {
        setStatus('コピーするノードを選択してください', 'warn')
      }
      return false
    }

    if (!this.appState.model || !this.appState.model.nodes[targetId]) {
      if (typeof setStatus !== 'undefined') {
        setStatus('ノードが見つかりません', 'error')
      }
      return false
    }

    // Deep copy the node
    const node = this.appState.model.nodes[targetId]
    this.clipboard = {
      originalId: targetId,
      node: JSON.parse(JSON.stringify(node))
    }

    if (typeof setStatus !== 'undefined') {
      setStatus(`ノード「${targetId}」をコピーしました`, 'success')
    }
    return true
  }

  /**
   * クリップボードからノードをペースト
   * @returns {string|null} 作成されたノードID、またはnull
   */
  pasteNode() {
    if (!this.clipboard) {
      if (typeof setStatus !== 'undefined') {
        setStatus('クリップボードが空です', 'warn')
      }
      return null
    }

    if (!this.appState.model) {
      if (typeof setStatus !== 'undefined') {
        setStatus('モデルを読み込んでください', 'warn')
      }
      return null
    }

    // Generate unique ID
    const newId = this._generateUniqueNodeId(this.clipboard.originalId)

    // Deep copy the node data
    const newNode = JSON.parse(JSON.stringify(this.clipboard.node))
    newNode.id = newId

    // Add to model
    this.appState.model.nodes[newId] = newNode

    // Refresh UI
    if (this.nodeList) {
      this.renderNodeList()
    }

    // Save draft
    this.saveDraftModel()

    // Select the new node
    this.selectNode(newId)

    if (typeof setStatus !== 'undefined') {
      setStatus(`ノード「${newId}」をペーストしました`, 'success')
    }

    return newId
  }

  /**
   * ユニークなノードIDを生成
   * @param {string} baseId - 元のID
   * @returns {string} ユニークなID
   */
  _generateUniqueNodeId(baseId) {
    let counter = 1
    let newId = `${baseId}_copy`
    
    while (this.appState.model.nodes[newId]) {
      counter++
      newId = `${baseId}_copy${counter}`
    }
    
    return newId
  }

  /**
   * クリップボードにデータがあるか確認
   * @returns {boolean}
   */
  hasClipboardData() {
    return this.clipboard !== null
  }

  /**
   * 選択中のノードIDを取得
   * @returns {string|null}
   */
  getSelectedNodeId() {
    return this.selectedNodeId
  }

  // ============================================================================
  // Search & Filter functionality
  // ============================================================================

  /**
   * ノードを検索
   * @param {string} query - 検索クエリ
   * @param {Object} options - 検索オプション
   * @returns {string[]} マッチしたノードIDの配列
   */
  searchNodes(query, options = {}) {
    if (!this.appState.model || !query.trim()) {
      return Object.keys(this.appState.model?.nodes || {})
    }

    const lowerQuery = query.toLowerCase().trim()
    const results = []

    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
      let matched = false

      // ID検索
      if (nodeId.toLowerCase().includes(lowerQuery)) {
        matched = true
      }

      // テキスト検索
      if (!matched && node.text && node.text.toLowerCase().includes(lowerQuery)) {
        matched = true
      }

      // 選択肢テキスト検索
      if (!matched && node.choices) {
        for (const choice of node.choices) {
          if (choice.text && choice.text.toLowerCase().includes(lowerQuery)) {
            matched = true
            break
          }
          if (choice.target && choice.target.toLowerCase().includes(lowerQuery)) {
            matched = true
            break
          }
        }
      }

      if (matched) {
        results.push(nodeId)
      }
    }

    return results
  }

  /**
   * フィルタ条件に基づいてノードをフィルタリング
   * @param {string} filterType - フィルタタイプ
   * @returns {string[]} フィルタされたノードIDの配列
   */
  filterNodes(filterType) {
    if (!this.appState.model) return []

    const nodes = this.appState.model.nodes
    const allNodeIds = Object.keys(nodes)

    switch (filterType) {
      case 'all':
        return allNodeIds

      case 'unreachable':
        return this._findUnreachableNodes()

      case 'orphan':
        return this._findOrphanNodes()

      case 'hasFlags':
        return this._findNodesWithFlags()

      case 'hasResources':
        return this._findNodesWithResources()

      case 'noChoices':
        return allNodeIds.filter(id => !nodes[id].choices || nodes[id].choices.length === 0)

      default:
        return allNodeIds
    }
  }

  /**
   * 到達不能ノードを検出
   * @returns {string[]}
   */
  _findUnreachableNodes() {
    const nodes = this.appState.model.nodes
    const startNodeId = this.appState.model.meta?.startNodeId || 'start'
    const reachable = new Set()
    const queue = [startNodeId]

    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (reachable.has(nodeId) || !nodes[nodeId]) continue

      reachable.add(nodeId)
      const node = nodes[nodeId]

      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.target && !reachable.has(choice.target)) {
            queue.push(choice.target)
          }
        }
      }
    }

    return Object.keys(nodes).filter(id => !reachable.has(id))
  }

  /**
   * 孤立ノード（どこからも参照されていないノード）を検出
   * @returns {string[]}
   */
  _findOrphanNodes() {
    const nodes = this.appState.model.nodes
    const startNodeId = this.appState.model.meta?.startNodeId || 'start'
    const referenced = new Set([startNodeId])

    for (const node of Object.values(nodes)) {
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.target) {
            referenced.add(choice.target)
          }
        }
      }
    }

    return Object.keys(nodes).filter(id => !referenced.has(id))
  }

  /**
   * フラグを使用しているノードを検出
   * @returns {string[]}
   */
  _findNodesWithFlags() {
    const nodes = this.appState.model.nodes
    return Object.keys(nodes).filter(id => {
      const node = nodes[id]
      if (!node.choices) return false
      return node.choices.some(choice => {
        const hasConditionFlag = choice.conditions?.some(c => c.type === 'flag')
        const hasEffectFlag = choice.effects?.some(e => e.type === 'setFlag')
        return hasConditionFlag || hasEffectFlag
      })
    })
  }

  /**
   * リソースを使用しているノードを検出
   * @returns {string[]}
   */
  _findNodesWithResources() {
    const nodes = this.appState.model.nodes
    return Object.keys(nodes).filter(id => {
      const node = nodes[id]
      if (!node.choices) return false
      return node.choices.some(choice => {
        const hasConditionResource = choice.conditions?.some(c => c.type === 'resource')
        const hasEffectResource = choice.effects?.some(e => 
          e.type === 'addResource'
        )
        return hasConditionResource || hasEffectResource
      })
    })
  }

  /**
   * 検索・フィルタ結果に基づいてノードリストを更新
   * @param {string} query - 検索クエリ
   * @param {string} filterType - フィルタタイプ
   */
  applySearchAndFilter(query = '', filterType = 'all') {
    if (!this.appState.model) return

    // フィルタを適用
    let visibleNodeIds = this.filterNodes(filterType)

    // 検索を適用
    if (query.trim()) {
      const searchResults = this.searchNodes(query)
      visibleNodeIds = visibleNodeIds.filter(id => searchResults.includes(id))
    }

    // UIを更新
    this._updateNodeVisibility(visibleNodeIds)

    // 結果数を返す
    return {
      total: Object.keys(this.appState.model.nodes).length,
      visible: visibleNodeIds.length
    }
  }

  /**
   * ノードの表示/非表示を更新
   * @param {string[]} visibleNodeIds - 表示するノードID
   */
  _updateNodeVisibility(visibleNodeIds) {
    if (!this.nodeList) return

    const visibleSet = new Set(visibleNodeIds)
    const allNodeCards = this.nodeList.querySelectorAll('.node-editor')

    allNodeCards.forEach(card => {
      const nodeId = card.dataset.nodeId
      if (visibleSet.has(nodeId)) {
        card.style.display = ''
        card.classList.remove('filtered-out')
      } else {
        card.style.display = 'none'
        card.classList.add('filtered-out')
      }
    })
  }

  /**
   * 検索・フィルタをリセット
   */
  resetSearchAndFilter() {
    if (!this.nodeList) return

    const allNodeCards = this.nodeList.querySelectorAll('.node-editor')
    allNodeCards.forEach(card => {
      card.style.display = ''
      card.classList.remove('filtered-out')
    })
  }

  // ============================================================================
  // Snippet functionality
  // ============================================================================

  static SNIPPET_STORAGE_KEY = 'narrativegen_snippets'
  static CUSTOM_TEMPLATE_STORAGE_KEY = 'narrativegen_custom_templates'

  /**
   * 選択中のノードをスニペットとして保存
   * @param {string} snippetName - スニペット名
   * @returns {boolean} 成功したかどうか
   */
  saveAsSnippet(snippetName) {
    if (!this.selectedNodeId) {
      if (typeof setStatus !== 'undefined') {
        setStatus('スニペット保存するノードを選択してください', 'warn')
      }
      return false
    }

    if (!this.appState.model || !this.appState.model.nodes[this.selectedNodeId]) {
      if (typeof setStatus !== 'undefined') {
        setStatus('ノードが見つかりません', 'error')
      }
      return false
    }

    const node = this.appState.model.nodes[this.selectedNodeId]
    const snippet = {
      id: `snippet_${Date.now()}`,
      name: snippetName || `スニペット (${this.selectedNodeId})`,
      createdAt: new Date().toISOString(),
      nodeData: JSON.parse(JSON.stringify(node))
    }

    const snippets = this.getSnippets()
    snippets.push(snippet)
    this._saveSnippetsToStorage(snippets)

    if (typeof setStatus !== 'undefined') {
      setStatus(`スニペット「${snippet.name}」を保存しました`, 'success')
    }
    return true
  }

  /**
   * スニペット一覧を取得
   * @returns {Array} スニペット配列
   */
  getSnippets() {
    try {
      const stored = localStorage.getItem(GuiEditorManager.SNIPPET_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.warn('Failed to load snippets:', e)
      return []
    }
  }

  /**
   * スニペットをストレージに保存
   * @param {Array} snippets - スニペット配列
   */
  _saveSnippetsToStorage(snippets) {
    try {
      localStorage.setItem(GuiEditorManager.SNIPPET_STORAGE_KEY, JSON.stringify(snippets))
    } catch (e) {
      console.error('Failed to save snippets:', e)
    }
  }

  /**
   * スニペットからノードを挿入
   * @param {string} snippetId - スニペットID
   * @returns {string|null} 作成されたノードID、またはnull
   */
  insertFromSnippet(snippetId) {
    const snippets = this.getSnippets()
    const snippet = snippets.find(s => s.id === snippetId)

    if (!snippet) {
      if (typeof setStatus !== 'undefined') {
        setStatus('スニペットが見つかりません', 'error')
      }
      return null
    }

    if (!this.appState.model) {
      if (typeof setStatus !== 'undefined') {
        setStatus('モデルを読み込んでください', 'warn')
      }
      return null
    }

    // Generate unique ID based on snippet name
    const baseId = snippet.nodeData.id || 'snippet_node'
    const newId = this._generateUniqueNodeId(baseId)

    // Deep copy the node data
    const newNode = JSON.parse(JSON.stringify(snippet.nodeData))
    newNode.id = newId

    // Add to model
    this.appState.model.nodes[newId] = newNode

    // Refresh UI
    if (this.nodeList) {
      this.renderNodeList()
    }

    // Save draft
    this.saveDraftModel()

    // Select the new node
    this.selectNode(newId)

    if (typeof setStatus !== 'undefined') {
      setStatus(`スニペット「${snippet.name}」から「${newId}」を挿入しました`, 'success')
    }

    return newId
  }

  /**
   * スニペットを削除
   * @param {string} snippetId - スニペットID
   * @returns {boolean} 成功したかどうか
   */
  deleteSnippet(snippetId) {
    const snippets = this.getSnippets()
    const index = snippets.findIndex(s => s.id === snippetId)

    if (index === -1) {
      if (typeof setStatus !== 'undefined') {
        setStatus('スニペットが見つかりません', 'error')
      }
      return false
    }

    const deletedSnippet = snippets.splice(index, 1)[0]
    this._saveSnippetsToStorage(snippets)

    if (typeof setStatus !== 'undefined') {
      setStatus(`スニペット「${deletedSnippet.name}」を削除しました`, 'success')
    }
    return true
  }

  /**
   * スニペット名を更新
   * @param {string} snippetId - スニペットID
   * @param {string} newName - 新しい名前
   * @returns {boolean} 成功したかどうか
   */
  renameSnippet(snippetId, newName) {
    const snippets = this.getSnippets()
    const snippet = snippets.find(s => s.id === snippetId)

    if (!snippet) {
      return false
    }

    snippet.name = newName
    this._saveSnippetsToStorage(snippets)
    return true
  }

  // ============================================================================
  // Custom Template functionality
  // ============================================================================

  /**
   * 選択中のノードをカスタムテンプレートとして保存
   * @param {string} templateName - テンプレート名
   * @returns {boolean} 成功したかどうか
   */
  saveAsCustomTemplate(templateName) {
    if (!this.selectedNodeId) {
      if (typeof setStatus !== 'undefined') {
        setStatus('テンプレート保存するノードを選択してください', 'warn')
      }
      return false
    }

    if (!this.appState.model || !this.appState.model.nodes[this.selectedNodeId]) {
      if (typeof setStatus !== 'undefined') {
        setStatus('ノードが見つかりません', 'error')
      }
      return false
    }

    if (!templateName || !templateName.trim()) {
      if (typeof setStatus !== 'undefined') {
        setStatus('テンプレート名を入力してください', 'warn')
      }
      return false
    }

    const node = this.appState.model.nodes[this.selectedNodeId]
    const template = {
      id: `custom_${Date.now()}`,
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
      // Store only the essential node structure (no id)
      nodeData: {
        text: node.text || '',
        choices: node.choices ? JSON.parse(JSON.stringify(node.choices)) : []
      }
    }

    const templates = this.getCustomTemplates()
    templates.push(template)
    this._saveCustomTemplatesToStorage(templates)

    if (typeof setStatus !== 'undefined') {
      setStatus(`テンプレート「${template.name}」を保存しました`, 'success')
    }
    return true
  }

  /**
   * カスタムテンプレート一覧を取得
   * @returns {Array} テンプレート配列
   */
  getCustomTemplates() {
    try {
      const stored = localStorage.getItem(GuiEditorManager.CUSTOM_TEMPLATE_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.warn('Failed to load custom templates:', e)
      return []
    }
  }

  /**
   * カスタムテンプレートをストレージに保存
   * @param {Array} templates - テンプレート配列
   */
  _saveCustomTemplatesToStorage(templates) {
    try {
      localStorage.setItem(GuiEditorManager.CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
    } catch (e) {
      console.error('Failed to save custom templates:', e)
    }
  }

  /**
   * カスタムテンプレートを削除
   * @param {string} templateId - テンプレートID
   * @returns {boolean} 成功したかどうか
   */
  deleteCustomTemplate(templateId) {
    const templates = this.getCustomTemplates()
    const index = templates.findIndex(t => t.id === templateId)

    if (index === -1) {
      if (typeof setStatus !== 'undefined') {
        setStatus('テンプレートが見つかりません', 'error')
      }
      return false
    }

    const deletedTemplate = templates.splice(index, 1)[0]
    this._saveCustomTemplatesToStorage(templates)

    if (typeof setStatus !== 'undefined') {
      setStatus(`テンプレート「${deletedTemplate.name}」を削除しました`, 'success')
    }
    return true
  }

  /**
   * カスタムテンプレートを取得（IDで検索）
   * @param {string} templateId - テンプレートID
   * @returns {Object|null} テンプレートデータ
   */
  getCustomTemplateById(templateId) {
    const templates = this.getCustomTemplates()
    return templates.find(t => t.id === templateId) || null
  }

  /**
   * テンプレート（組み込み＋カスタム）からノードデータを取得
   * @param {string} templateKey - テンプレートキー（組み込み）またはカスタムテンプレートID
   * @returns {Object} ノードデータ
   */
  getTemplateNodeData(templateKey) {
    // Check if it's a custom template
    if (templateKey.startsWith('custom_')) {
      const customTemplate = this.getCustomTemplateById(templateKey)
      if (customTemplate) {
        return JSON.parse(JSON.stringify(customTemplate.nodeData))
      }
    }
    // Fall back to built-in templates
    return this.getNodeTemplate(templateKey)
  }

  // ============================================================================
  // Draft Restore UI functionality
  // ============================================================================

  /**
   * ドラフト情報を取得
   * @returns {Object|null} ドラフトデータ、またはnull
   */
  getDraftInfo() {
    try {
      const draftData = localStorage.getItem(DRAFT_MODEL_STORAGE_KEY)
      if (!draftData) return null

      const draft = JSON.parse(draftData)
      if (!draft.model) return null

      return {
        model: draft.model,
        modelName: draft.modelName || 'draft',
        storyLog: draft.storyLog || [],
        timestamp: draft.timestamp || new Date().toISOString(),
        nodeCount: draft.model.nodes ? Object.keys(draft.model.nodes).length : 0,
        storyLogCount: draft.storyLog ? draft.storyLog.length : 0
      }
    } catch (error) {
      console.warn('Failed to get draft info:', error)
      return null
    }
  }

  /**
   * ドラフト復元モーダルを開く
   * @returns {boolean} ドラフトが存在する場合true
   */
  openDraftRestoreModal() {
    const draftInfo = this.getDraftInfo()
    if (!draftInfo) {
      if (typeof setStatus !== 'undefined') {
        setStatus('復元可能なドラフトが見つかりません', 'warn')
      }
      return false
    }

    const modal = this.draftRestoreModal
    if (!modal) {
      console.warn('[GuiEditorManager] draftRestoreModal not initialized')
      return false
    }

    // ドラフト情報を表示
    const modelNameEl = document.getElementById('draftModelName')
    const timestampEl = document.getElementById('draftTimestamp')
    const nodeCountEl = document.getElementById('draftNodeCount')
    const storyLogCountEl = document.getElementById('draftStoryLogCount')

    if (modelNameEl) {
      modelNameEl.textContent = draftInfo.modelName
    }
    if (timestampEl) {
      const date = new Date(draftInfo.timestamp)
      timestampEl.textContent = date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    if (nodeCountEl) {
      nodeCountEl.textContent = `${draftInfo.nodeCount}個`
    }
    if (storyLogCountEl) {
      storyLogCountEl.textContent = `${draftInfo.storyLogCount}件`
    }

    // モーダルを表示
    modal.style.display = 'flex'
    modal.classList.add('show')

    return true
  }

  /**
   * ドラフト復元モーダルを閉じる
   */
  closeDraftRestoreModal() {
    if (!this.draftRestoreModal) return

    this.draftRestoreModal.classList.remove('show')
    setTimeout(() => {
      this.draftRestoreModal.style.display = 'none'
    }, 300)
  }
}
