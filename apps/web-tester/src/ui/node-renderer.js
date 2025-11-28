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
  }

  initialize(nodeListElement) {
    this.nodeList = nodeListElement
  }

  // Main rendering function
  renderNodeList() {
    if (!this.nodeList) return

    const fragment = document.createDocumentFragment()
    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
      const nodeDiv = document.createElement('div')
      nodeDiv.className = 'node-editor'
      nodeDiv.dataset.nodeId = nodeId
      nodeDiv.innerHTML = `
        <h3>ノード: ${nodeId}</h3>
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
      choiceDiv.dataset.choiceIndex = index
      
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
   * 条件/効果エディタのインスタンスを取得
   */
  getConditionEffectEditor() {
    return this.conditionEffectEditor
  }
}
