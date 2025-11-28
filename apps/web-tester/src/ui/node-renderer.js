/**
 * Node Renderer Module
 * Handles rendering of nodes and choices in GUI editor
 */

export class NodeRenderer {
  constructor(appState) {
    this.appState = appState
    this.nodeList = null
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
}
