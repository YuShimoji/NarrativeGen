/**
 * Node Manager Module
 * Handles node operations like add, delete, rename
 */

import { NODE_ID_PREFIX } from '../config/constants.js'

export class NodeManager {
  constructor(appState) {
    this.appState = appState
  }

  // Node management
  renameNodeId(oldId, newIdRaw) {
    if (!this.appState.model || !this.appState.model.nodes) {
      setStatus('モデルが読み込まれていません', 'warn')
      return
    }

    const model = this.appState.model
    const newId = (newIdRaw || '').trim()

    if (!model.nodes[oldId]) {
      setStatus(`ノードID「${oldId}」が見つかりません`, 'error')
      return
    }

    if (!newId) {
      setStatus('新しいノードIDを入力してください', 'warn')
      return
    }

    if (newId === oldId) {
      setStatus('同じノードIDが指定されています', 'info')
      return
    }

    if (model.nodes[newId]) {
      setStatus(`❌ ノードID「${newId}」は既に存在します`, 'error')
      return
    }

    if (/\s/.test(newId)) {
      setStatus('ノードIDに空白を含めることはできません', 'warn')
      return
    }

    const node = model.nodes[oldId]

    // 再インデックス
    delete model.nodes[oldId]
    model.nodes[newId] = node
    if (node) {
      node.id = newId
    }

    // startNode の更新
    if (model.startNode === oldId) {
      model.startNode = newId
    }

    // choices.target の更新
    let updatedTargets = 0
    for (const [, n] of Object.entries(model.nodes)) {
      if (!n.choices) continue
      for (const choice of n.choices) {
        if (choice.target === oldId) {
          choice.target = newId
          updatedTargets++
        }
      }
    }

    // metadata.nodeOrder の更新（存在する場合）
    if (model.metadata && Array.isArray(model.metadata.nodeOrder)) {
      model.metadata.nodeOrder = model.metadata.nodeOrder.map(id => id === oldId ? newId : id)
    }

    let message = `ノードID「${oldId}」を「${newId}」に変更しました`
    if (updatedTargets > 0) {
      message += ` (${updatedTargets}個のターゲットを更新)`
    }
    setStatus(`✅ ${message}`, 'success')
  }

  addChoice(nodeId) {
    const node = this.appState.model.nodes[nodeId]
    if (!node.choices) node.choices = []
    node.choices.push({
      id: `c${node.choices.length + 1}`,
      text: '新しい選択肢',
      target: nodeId
    })
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
  }

  deleteChoice(nodeId, choiceIndex) {
    const node = this.appState.model.nodes[nodeId]
    node.choices.splice(choiceIndex, 1)
  }

  // Utility functions
  generateNodeId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `${NODE_ID_PREFIX}${timestamp}_${random}`
  }
}
