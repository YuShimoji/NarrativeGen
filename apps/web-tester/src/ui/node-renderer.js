/**
 * Node Renderer Module
 * Handles rendering of nodes and choices in GUI editor
 */

import { ConditionEffectEditor } from './condition-effect-editor.js'

export class NodeRenderer {
  constructor(appState) {
    this.appState = appState
    this.nodeList = null
    this.conditionEffectEditor = new ConditionEffectEditor()
    this.onNodeSelect = null // Callback for node selection
  }

  initialize(nodeListElement) {
    this.nodeList = nodeListElement
  }

  /**
   * ノード選択時のコールバックを設定
   * @param {Function} callback - (nodeId) => void
   */
  setOnNodeSelect(callback) {
    this.onNodeSelect = callback
  }

  /**
   * ConditionEffectEditor インスタンスを取得
   * @returns {ConditionEffectEditor}
   */
  getConditionEffectEditor() {
    return this.conditionEffectEditor
  }

  // Main rendering function
  renderNodeList() {
    if (!this.nodeList) return

    const fragment = document.createDocumentFragment()
    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
      const nodeDiv = document.createElement('div')
      nodeDiv.className = 'node-editor'
      nodeDiv.dataset.nodeId = nodeId
      nodeDiv.draggable = true
      nodeDiv.innerHTML = `
        <div class="node-header" data-node-id="${nodeId}">
          <h3>ノード: ${nodeId}</h3>
          <button class="select-node-btn" data-node-id="${nodeId}" title="選択 (Ctrl+Cでコピー)">選択</button>
        </div>
        <div class="node-id-row">
          <label>ID: <input type="text" value="${nodeId}" data-node-id="${nodeId}" data-field="id"></label>
          <button class="rename-node-btn" data-node-id="${nodeId}">ID変更</button>
        </div>
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

    // Add click handlers for node selection
    this._setupNodeSelectionHandlers()

    // Render choices after DOM is updated
    for (const [nodeId] of Object.entries(this.appState.model.nodes)) {
      this.renderChoicesForNode(nodeId)
    }
  }

  /**
   * ノード選択のイベントハンドラを設定
   */
  _setupNodeSelectionHandlers() {
    if (!this.nodeList) return

    // Select button click handlers
    this.nodeList.querySelectorAll('.select-node-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const nodeId = btn.dataset.nodeId
        if (this.onNodeSelect) {
          this.onNodeSelect(nodeId)
        }
      })
    })
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
      choiceDiv.dataset.choiceIndex = index
      choiceDiv.draggable = true
      
      // 条件と効果のエディタHTML
      const conditionsHtml = this.conditionEffectEditor.renderConditionsEditor(
        choice.conditions, nodeId, index
      )
      const effectsHtml = this.conditionEffectEditor.renderEffectsEditor(
        choice.effects, nodeId, index
      )
      
      choiceDiv.innerHTML = `
        <div class="choice-basic">
          <label>テキスト: <input type="text" value="${(choice.text || '').replace(/"/g, '&quot;')}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="text"></label>
          <label>ターゲット: <input type="text" value="${choice.target || ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="target"></label>
        </div>
        <details class="choice-advanced">
          <summary>条件・効果を編集</summary>
          <div class="choice-conditions-effects">
            ${conditionsHtml}
            ${effectsHtml}
          </div>
        </details>
        <div class="choice-actions">
          <button class="paraphrase-btn" data-node-id="${nodeId}" data-choice-index="${index}">言い換え</button>
          <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${index}">削除</button>
        </div>
      `
      fragment.appendChild(choiceDiv)
    })
    choicesDiv.innerHTML = ''
    choicesDiv.appendChild(fragment)
  }

  /**
   * ドラッグ＆ドロップ並べ替え機能をセットアップ
   */
  setupDragAndDrop() {
    if (!this.nodeList) return

    // ノードのドラッグ＆ドロップ
    this.nodeList.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('node-editor')) {
        e.target.classList.add('dragging')
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', e.target.dataset.nodeId)
      }
    })

    this.nodeList.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('node-editor')) {
        e.target.classList.remove('dragging')
        // ドラッグ中のスタイルをクリア
        document.querySelectorAll('.node-editor.drag-over').forEach(el => {
          el.classList.remove('drag-over')
        })
      }
    })

    this.nodeList.addEventListener('dragover', (e) => {
      e.preventDefault()
      const nodeEditor = e.target.closest('.node-editor')
      if (nodeEditor && !nodeEditor.classList.contains('dragging')) {
        e.dataTransfer.dropEffect = 'move'
        // ドロップ可能な場所を示すスタイル
        document.querySelectorAll('.node-editor.drag-over').forEach(el => {
          el.classList.remove('drag-over')
        })
        nodeEditor.classList.add('drag-over')
      }
    })

    this.nodeList.addEventListener('dragleave', (e) => {
      const nodeEditor = e.target.closest('.node-editor')
      if (nodeEditor && !nodeEditor.contains(e.relatedTarget)) {
        nodeEditor.classList.remove('drag-over')
      }
    })

    this.nodeList.addEventListener('drop', (e) => {
      e.preventDefault()
      const draggedNodeId = e.dataTransfer.getData('text/plain')
      const targetNodeEditor = e.target.closest('.node-editor')
      
      if (targetNodeEditor && draggedNodeId && targetNodeEditor.dataset.nodeId !== draggedNodeId) {
        this._reorderNodes(draggedNodeId, targetNodeEditor.dataset.nodeId)
      }
      
      // スタイルをクリア
      document.querySelectorAll('.node-editor.drag-over').forEach(el => {
        el.classList.remove('drag-over')
      })
    })

    // 選択肢のドラッグ＆ドロップ
    this.nodeList.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('choice-editor')) {
        e.target.classList.add('dragging')
        e.dataTransfer.effectAllowed = 'move'
        const nodeId = e.target.closest('.node-editor').dataset.nodeId
        const choiceIndex = e.target.dataset.choiceIndex
        e.dataTransfer.setData('text/plain', `${nodeId}:${choiceIndex}`)
      }
    })

    this.nodeList.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('choice-editor')) {
        e.target.classList.remove('dragging')
        document.querySelectorAll('.choice-editor.drag-over').forEach(el => {
          el.classList.remove('drag-over')
        })
      }
    })

    this.nodeList.addEventListener('dragover', (e) => {
      e.preventDefault()
      const choiceEditor = e.target.closest('.choice-editor')
      if (choiceEditor && !choiceEditor.classList.contains('dragging')) {
        e.dataTransfer.dropEffect = 'move'
        document.querySelectorAll('.choice-editor.drag-over').forEach(el => {
          el.classList.remove('drag-over')
        })
        choiceEditor.classList.add('drag-over')
      }
    })

    this.nodeList.addEventListener('dragleave', (e) => {
      const choiceEditor = e.target.closest('.choice-editor')
      if (choiceEditor && !choiceEditor.contains(e.relatedTarget)) {
        choiceEditor.classList.remove('drag-over')
      }
    })

    this.nodeList.addEventListener('drop', (e) => {
      e.preventDefault()
      const dragData = e.dataTransfer.getData('text/plain')
      const targetChoiceEditor = e.target.closest('.choice-editor')
      
      if (targetChoiceEditor && dragData) {
        const [draggedNodeId, draggedChoiceIndex] = dragData.split(':')
        const targetNodeId = targetChoiceEditor.closest('.node-editor').dataset.nodeId
        const targetChoiceIndex = targetChoiceEditor.dataset.choiceIndex
        
        if (draggedNodeId === targetNodeId && draggedChoiceIndex !== targetChoiceIndex) {
          this._reorderChoices(draggedNodeId, parseInt(draggedChoiceIndex), parseInt(targetChoiceIndex))
        }
      }
      
      document.querySelectorAll('.choice-editor.drag-over').forEach(el => {
        el.classList.remove('drag-over')
      })
    })
  }

  /**
   * ノードの順序を変更
   */
  _reorderNodes(draggedNodeId, targetNodeId) {
    const nodes = this.appState.model.nodes
    const nodeIds = Object.keys(nodes)
    
    const draggedIndex = nodeIds.indexOf(draggedNodeId)
    const targetIndex = nodeIds.indexOf(targetNodeId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    // 配列から要素を削除して挿入
    nodeIds.splice(draggedIndex, 1)
    nodeIds.splice(targetIndex, 0, draggedNodeId)
    
    // 新しい順序でオブジェクトを再構築
    const reorderedNodes = {}
    nodeIds.forEach(id => {
      reorderedNodes[id] = nodes[id]
    })
    
    this.appState.model.nodes = reorderedNodes

    // 順序の永続化（任意）: metadata.nodeOrder があれば更新、なければ生成
    if (!this.appState.model.metadata) {
      this.appState.model.metadata = {}
    }
    this.appState.model.metadata.nodeOrder = [...nodeIds]

    this.renderNodeList()
    this._notifyModelUpdate()
  }

  /**
   * 選択肢の順序を変更
   */
  _reorderChoices(nodeId, draggedIndex, targetIndex) {
    const node = this.appState.model.nodes[nodeId]
    if (!node || !node.choices) return
    
    const choices = node.choices
    const draggedChoice = choices[draggedIndex]
    
    // 配列から要素を削除して挿入
    choices.splice(draggedIndex, 1)
    choices.splice(targetIndex, 0, draggedChoice)
    
    this.renderChoicesForNode(nodeId)
    this._notifyModelUpdate()
  }

  /**
   * モデル更新を通知
   */
  _notifyModelUpdate() {
    // ModelUpdaterがあれば保存
    if (this.appState.modelUpdater) {
      this.appState.modelUpdater.saveDraftModel()
    }
    
    // 外部リスナーへの通知
    if (this.onModelUpdate) {
      this.onModelUpdate()
    }
  }

  /**
   * モデル更新リスナーを設定
   */
  setOnModelUpdate(callback) {
    this.onModelUpdate = callback
  }
}
