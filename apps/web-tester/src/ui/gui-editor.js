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
}
