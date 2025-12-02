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

    // Initialize sub-managers
    this.nodeRenderer = new NodeRenderer(appState)
    this.modelUpdater = new ModelUpdater(appState)
    this.nodeManager = new NodeManager(appState)
    this.batchEditor = new BatchEditor(appState)
  }

  initialize(nodeListElement, guiEditModeElement, batchEditModalElement, quickNodeModalElement, batchChoiceModalElement, paraphraseModalElement) {
    this.nodeList = nodeListElement
    this.guiEditMode = guiEditModeElement
    this.batchEditModal = batchEditModalElement
    this.quickNodeModal = quickNodeModalElement
    this.batchChoiceModal = batchChoiceModalElement
    this.paraphraseModal = paraphraseModalElement

    // Initialize sub-managers
    this.nodeRenderer.initialize(nodeListElement)
    this.modelUpdater.initialize(guiEditModeElement)
    this.batchEditor.initialize(batchEditModalElement)

    // Setup condition/effect editor event handlers
    this._setupConditionEffectHandlers()

    // Setup drag and drop functionality
    this.nodeRenderer.setupDragAndDrop()
    this.nodeRenderer.setOnModelUpdate(() => {
      // モデル更新時の追加処理があればここに
    })

    // Setup node selection callback
    this.nodeRenderer.setOnNodeSelect((nodeId) => {
      this.selectNode(nodeId)
    })
  }

  /**
   * 条件/効果エディタのイベントハンドラを設定
   */
  _setupConditionEffectHandlers() {
    if (!this.nodeList) return

    const conditionEffectEditor = this.nodeRenderer.getConditionEffectEditor()
    
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
    return this.nodeRenderer.renderNodeList()
  }

  renderChoicesForNode(nodeId) {
    return this.nodeRenderer.renderChoicesForNode(nodeId)
  }

  // Batch editing functionality
  getBatchEditManager() {
    return {
      openModal: () => this.batchEditor.openModal(),
      closeModal: () => this.batchEditor.closeModal(),
      applyTextReplace: () => this.batchEditor.applyTextReplace(),
      applyChoiceReplace: () => this.batchEditor.applyChoiceTextReplace(),
      applyTargetReplace: () => this.batchEditor.applyTargetReplace(),
      refreshUI: () => this.renderNodeList()
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

    modal.style.display = 'flex'
    modal.classList.add('show')
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

    // Get template
    const template = this.getNodeTemplate(templateKey)
    const newNode = {
      id: nodeId,
      text: nodeText || template.text,
      choices: JSON.parse(JSON.stringify(template.choices)) // Deep copy
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
    this.batchChoiceModal.style.display = 'none'
    this.batchChoiceModal.classList.remove('show')

    // Refresh UI
    if (this.nodeList) {
      this.renderNodeList()
    }

    setStatus(`✅ ${node.choices.length}個の選択肢に変更を適用しました`, 'success')
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
    return this.modelUpdater.saveDraftModel()
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
  }

  /**
   * ノード選択を解除
   */
  clearSelection() {
    this.selectedNodeId = null
    this._updateNodeSelection()
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
          e.type === 'addResource' || e.type === 'setResource'
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
}
