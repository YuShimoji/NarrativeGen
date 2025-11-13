/**
 * GUI Editor Manager Module
 * Handles all GUI-based story editing functionality
 */

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
  }

  initialize(nodeListElement, guiEditModeElement, batchEditModalElement, quickNodeModalElement, batchChoiceModalElement, paraphraseModalElement) {
    this.nodeList = nodeListElement
    this.guiEditMode = guiEditModeElement
    this.batchEditModal = batchEditModalElement
    this.quickNodeModal = quickNodeModalElement
    this.batchChoiceModal = batchChoiceModalElement
    this.paraphraseModal = paraphraseModalElement
  }

  // Main rendering function
  renderNodeList() {
    if (!this.nodeList) return

    const fragment = document.createDocumentFragment()
    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
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
    this.nodeList.innerHTML = ''
    this.nodeList.appendChild(fragment)

    // Render choices after DOM is updated
    for (const [nodeId] of Object.entries(this.appState.model.nodes)) {
      this.renderChoicesForNode(nodeId)
    }
  }

  renderChoicesForNode(nodeId) {
    const node = this.appState.model.nodes[nodeId]
    const choicesDiv = this.nodeList.querySelector(`.choices-editor[data-node-id="${nodeId}"]`)
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

  // Batch editing functionality
  getBatchEditManager() {
    return {
      openModal: () => {
        if (this.guiEditMode.style.display === 'none') {
          setStatus('GUI編集モードでのみ使用可能です', 'warn')
          return
        }
        this.batchEditModal.style.display = 'flex'
        this.batchEditModal.classList.add('show')
      },

      closeModal: () => {
        this.batchEditModal.style.display = 'none'
        this.batchEditModal.classList.remove('show')
      },

      applyTextReplace: () => {
        const searchText = document.getElementById('searchText')
        const replaceText = document.getElementById('replaceText')

        if (!searchText || !searchText.value.trim()) {
          setStatus('検索テキストを入力してください', 'warn')
          return
        }

        let replacedCount = 0
        for (const nodeId in this.appState.model.nodes) {
          const node = this.appState.model.nodes[nodeId]
          if (node.text && node.text.includes(searchText.value)) {
            node.text = node.text.replaceAll(searchText.value, replaceText.value)
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

      applyChoiceReplace: () => {
        const choiceSearchText = document.getElementById('choiceSearchText')
        const choiceReplaceText = document.getElementById('choiceReplaceText')

        if (!choiceSearchText || !choiceSearchText.value.trim()) {
          setStatus('検索テキストを入力してください', 'warn')
          return
        }

        let replacedCount = 0
        for (const nodeId in this.appState.model.nodes) {
          const node = this.appState.model.nodes[nodeId]
          if (node.choices) {
            for (const choice of node.choices) {
              if (choice.text && choice.text.includes(choiceSearchText.value)) {
                choice.text = choice.text.replaceAll(choiceSearchText.value, choiceReplaceText.value)
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

      applyTargetReplace: () => {
        const oldTargetText = document.getElementById('oldTargetText')
        const newTargetText = document.getElementById('newTargetText')

        if (!oldTargetText || !oldTargetText.value.trim() || !newTargetText || !newTargetText.value.trim()) {
          setStatus('変更元と変更先のノードIDを入力してください', 'warn')
          return
        }

        if (!this.appState.model.nodes[newTargetText.value]) {
          setStatus('変更先のノードが存在しません', 'warn')
          return
        }

        let replacedCount = 0
        for (const nodeId in this.appState.model.nodes) {
          const node = this.appState.model.nodes[nodeId]
          if (node.choices) {
            for (const choice of node.choices) {
              if (choice.target === oldTargetText.value) {
                choice.target = newTargetText.value
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

      refreshUI: () => {
        this.renderNodeList()
      }
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
      choiceList.innerHTML = '<p style="color: #6b7280;">ノードを選択してください</p>'
      return
    }

    const node = this.appState.model.nodes[nodeId]
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
    if (!input.dataset.nodeId) return

    const nodeId = input.dataset.nodeId
    const choiceIndex = input.dataset.choiceIndex
    const field = input.dataset.field
    const value = input.value

    if (choiceIndex !== undefined) {
      // Update choice field
      const node = this.appState.model.nodes[nodeId]
      const choice = node.choices[parseInt(choiceIndex)]
      if (choice) {
        choice[field] = value
      }
    } else {
      // Update node field
      const node = this.appState.model.nodes[nodeId]
      if (node) {
        node[field] = value
      }
    }

    // Auto-save draft when editing in GUI mode
    if (this.guiEditMode && this.guiEditMode.style.display !== 'none') {
      this.saveDraftModel()
    }
  }

  // Draft model functionality
  saveDraftModel() {
    if (!this.appState.model) return

    try {
      const draftData = {
        model: this.appState.model,
        modelName: getCurrentModelName(),
        storyLog: this.appState.storyLog,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('draft_model', JSON.stringify(draftData))
      setStatus('ドラフトを自動保存しました', 'info')
    } catch (error) {
      console.warn('Failed to save draft model:', error)
    }
  }

  // Node management
  addChoice(nodeId) {
    const node = this.appState.model.nodes[nodeId]
    if (!node.choices) node.choices = []
    node.choices.push({
      id: `c${node.choices.length + 1}`,
      text: '新しい選択肢',
      target: nodeId
    })
    this.renderChoicesForNode(nodeId)
  }

  deleteNode(nodeId) {
    if (Object.keys(this.appState.model.nodes).length <= 1) {
      setStatus('少なくとも1つのノードが必要です', 'warn')
      return
    }
    delete this.appState.model.nodes[nodeId]
    // Remove references to deleted node
    for (const [nid, node] of Object.entries(this.appState.model.nodes)) {
      node.choices = node.choices?.filter(c => c.target !== nodeId) ?? []
    }
    this.renderNodeList()
  }

  deleteChoice(nodeId, choiceIndex) {
    const node = this.appState.model.nodes[nodeId]
    node.choices.splice(choiceIndex, 1)
    this.renderChoicesForNode(nodeId)
  }

  // Utility functions
  generateNodeId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `node_${timestamp}_${random}`
  }

  getNodeTemplate(templateKey) {
    const templates = {
      conversation: { text: '「会話テキストをここに入力」', choices: [] },
      choice: {
        text: '選択肢の説明をここに入力',
        choices: [
          { id: 'choice1', text: '選択肢1', target: '' },
          { id: 'choice2', text: '選択肢2', target: '' }
        ]
      },
      info: { text: '状況説明をここに入力', choices: [] },
      action: { text: 'イベントの説明をここに入力', choices: [] },
      blank: { text: '', choices: [] }
    }
    return templates[templateKey] || templates.blank
  }
}
