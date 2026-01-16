/**
 * PathTracker - インタラクティブパス追跡モジュール
 * 
 * エンディングパスのインタラクティブな追跡機能:
 * - パスクリックでのハイライト
 * - パス上のノード・選択肢の詳細表示
 * - パスのアニメーション表示（1秒かけて追跡）
 * - パスのフォーカス・アンフォーカス機能
 * - パス間の切り替えアニメーション
 */

export class PathTracker {
  constructor(appState) {
    this.appState = appState
    this.currentPath = null
    this.highlightedNodes = new Set()
    this.animationFrame = null
    this.animationDuration = 1000 // ms
    this.onNodeHighlight = null
    this.onPathComplete = null
  }

  /**
   * コールバックを設定
   */
  setCallbacks({ onNodeHighlight, onPathComplete }) {
    if (onNodeHighlight) this.onNodeHighlight = onNodeHighlight
    if (onPathComplete) this.onPathComplete = onPathComplete
  }

  /**
   * パスをハイライト
   * @param {Array<string>} path - ノードIDの配列
   * @param {boolean} animate - アニメーション有効化
   */
  highlightPath(path, animate = true) {
    this.clearHighlight()
    this.currentPath = path

    if (!path || path.length === 0) return

    if (animate) {
      this._animatePath(path)
    } else {
      this._highlightAllNodes(path)
    }
  }

  /**
   * パスをアニメーション表示
   */
  _animatePath(path) {
    const stepDuration = this.animationDuration / path.length
    let currentIndex = 0

    const animate = () => {
      if (currentIndex >= path.length) {
        if (this.onPathComplete) {
          this.onPathComplete(path)
        }
        return
      }

      const nodeId = path[currentIndex]
      this.highlightedNodes.add(nodeId)

      if (this.onNodeHighlight) {
        this.onNodeHighlight(nodeId, currentIndex, path.length)
      }

      this._applyHighlightToDOM(nodeId, currentIndex)

      currentIndex++
      this.animationFrame = setTimeout(animate, stepDuration)
    }

    animate()
  }

  /**
   * 全ノードを即時ハイライト
   */
  _highlightAllNodes(path) {
    path.forEach((nodeId, index) => {
      this.highlightedNodes.add(nodeId)
      this._applyHighlightToDOM(nodeId, index)
    })

    if (this.onPathComplete) {
      this.onPathComplete(path)
    }
  }

  /**
   * DOMにハイライトを適用
   */
  _applyHighlightToDOM(nodeId, index) {
    // パスノード要素をハイライト
    const pathNodes = document.querySelectorAll(`.path-node-small[data-node="${nodeId}"]`)
    pathNodes.forEach(node => {
      node.classList.add('path-highlighted')
      node.style.setProperty('--highlight-delay', `${index * 0.1}s`)
    })

    // エンディングノードIDをハイライト
    const endingNodes = document.querySelectorAll(`.ending-node-id[data-node="${nodeId}"]`)
    endingNodes.forEach(node => {
      node.classList.add('path-highlighted')
    })

    // ノードエディタをハイライト（GUI編集モード時）
    const nodeEditor = document.querySelector(`.node-editor[data-node-id="${nodeId}"]`)
    if (nodeEditor) {
      nodeEditor.classList.add('path-highlighted')
      nodeEditor.style.setProperty('--highlight-order', index)
    }
  }

  /**
   * ハイライトをクリア
   */
  clearHighlight() {
    // アニメーションを停止
    if (this.animationFrame) {
      clearTimeout(this.animationFrame)
      this.animationFrame = null
    }

    // ハイライトクラスを削除
    document.querySelectorAll('.path-highlighted').forEach(el => {
      el.classList.remove('path-highlighted')
      el.style.removeProperty('--highlight-delay')
      el.style.removeProperty('--highlight-order')
    })

    this.highlightedNodes.clear()
    this.currentPath = null
  }

  /**
   * パスをフォーカス（他のパスを薄く表示）
   */
  focusPath(path) {
    // 全パスアイテムを薄く
    document.querySelectorAll('.ending-path-item').forEach(item => {
      item.classList.add('path-unfocused')
    })

    // 指定パスをフォーカス
    this.highlightPath(path, false)

    // フォーカス中のパスアイテムを強調
    const pathKey = path.join('->')
    document.querySelectorAll('.ending-path-item').forEach(item => {
      const itemPath = Array.from(item.querySelectorAll('.path-node-small'))
        .map(n => n.dataset.node)
        .join('->')
      if (itemPath === pathKey) {
        item.classList.remove('path-unfocused')
        item.classList.add('path-focused')
      }
    })
  }

  /**
   * フォーカスを解除
   */
  unfocusPath() {
    this.clearHighlight()

    document.querySelectorAll('.ending-path-item').forEach(item => {
      item.classList.remove('path-unfocused', 'path-focused')
    })
  }

  /**
   * パス間を切り替え（アニメーション付き）
   */
  switchPath(fromPath, toPath) {
    return new Promise((resolve) => {
      // 現在のパスをフェードアウト
      if (fromPath) {
        this._fadeOutPath(fromPath)
      }

      // 少し遅延して新しいパスをフェードイン
      setTimeout(() => {
        this.highlightPath(toPath, true)
        resolve()
      }, 200)
    })
  }

  /**
   * パスをフェードアウト
   */
  _fadeOutPath(path) {
    path.forEach(nodeId => {
      const elements = document.querySelectorAll(`[data-node="${nodeId}"].path-highlighted`)
      elements.forEach(el => {
        el.classList.add('path-fading')
        setTimeout(() => {
          el.classList.remove('path-highlighted', 'path-fading')
        }, 200)
      })
    })
  }

  /**
   * パスの詳細情報を取得
   */
  getPathDetails(path) {
    if (!this.appState.model || !path) return null

    const details = {
      nodes: [],
      transitions: [],
      totalConditions: 0,
      totalEffects: 0,
      depth: path.length
    }

    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i]
      const node = this.appState.model.nodes[nodeId]

      if (!node) continue

      const nodeDetail = {
        id: nodeId,
        text: node.text || '',
        choiceCount: node.choices?.length || 0,
        isEnding: !node.choices || node.choices.length === 0
      }
      details.nodes.push(nodeDetail)

      // 次のノードへの遷移情報
      if (i < path.length - 1) {
        const nextNodeId = path[i + 1]
        const transition = this._findTransition(node, nextNodeId)
        if (transition) {
          details.transitions.push(transition)
          details.totalConditions += transition.conditions?.length || 0
          details.totalEffects += transition.effects?.length || 0
        }
      }
    }

    return details
  }

  /**
   * 遷移情報を取得
   */
  _findTransition(node, targetNodeId) {
    if (!node.choices) return null

    for (const choice of node.choices) {
      if (choice.target === targetNodeId) {
        return {
          text: choice.text || '',
          target: targetNodeId,
          conditions: choice.conditions || [],
          effects: choice.effects || []
        }
      }
    }

    return null
  }

  /**
   * パスの詳細HTMLを生成
   */
  renderPathDetails(path) {
    const details = this.getPathDetails(path)
    if (!details) return '<p>パス情報を取得できません</p>'

    let html = `
      <div class="path-details">
        <div class="path-details-header">
          <span class="path-depth">深さ: ${details.depth}</span>
          <span class="path-conditions-count">条件: ${details.totalConditions}</span>
          <span class="path-effects-count">効果: ${details.totalEffects}</span>
        </div>
        <div class="path-details-nodes">
    `

    for (let i = 0; i < details.nodes.length; i++) {
      const node = details.nodes[i]
      html += `
        <div class="path-detail-node ${node.isEnding ? 'is-ending' : ''}">
          <div class="path-detail-node-id">${this._escapeHtml(node.id)}</div>
          <div class="path-detail-node-text">${this._escapeHtml(node.text.substring(0, 50))}${node.text.length > 50 ? '...' : ''}</div>
        </div>
      `

      if (i < details.transitions.length) {
        const trans = details.transitions[i]
        html += `
          <div class="path-detail-transition">
            <div class="path-detail-arrow">↓</div>
            <div class="path-detail-choice">${this._escapeHtml(trans.text)}</div>
            ${trans.conditions.length > 0 ? `<div class="path-detail-conditions">[条件: ${trans.conditions.length}]</div>` : ''}
            ${trans.effects.length > 0 ? `<div class="path-detail-effects">[効果: ${trans.effects.length}]</div>` : ''}
          </div>
        `
      }
    }

    html += '</div></div>'
    return html
  }

  /**
   * HTMLエスケープ
   */
  _escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * アニメーション速度を設定
   */
  setAnimationDuration(ms) {
    this.animationDuration = ms
  }

  /**
   * 現在ハイライト中のパスを取得
   */
  getCurrentPath() {
    return this.currentPath
  }

  /**
   * ノードがハイライト中かチェック
   */
  isNodeHighlighted(nodeId) {
    return this.highlightedNodes.has(nodeId)
  }
}
