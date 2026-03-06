/**
 * ContextMenuManager - Right-click context menu for graph editor
 * Extracted from GraphEditorManager for modularity
 */

export class ContextMenuManager {
  /**
   * @param {object} options
   * @param {function(string, string?, object?, Event): void} options.onAction - Callback for menu actions
   */
  constructor({ onAction }) {
    this.onAction = onAction
    this.element = null
    this._boundDocumentClick = null
  }

  /** Create the context menu DOM element */
  initialize() {
    const existing = document.getElementById('graph-context-menu')
    if (existing) existing.remove()

    this.element = document.createElement('div')
    this.element.id = 'graph-context-menu'
    this.element.className = 'context-menu'
    this.element.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      padding: 4px 0;
      display: none;
      z-index: 1000;
      min-width: 150px;
    `
    document.body.appendChild(this.element)

    this._boundDocumentClick = (event) => {
      if (this.element && !this.element.contains(event.target)) {
        this.hide()
      }
    }
    document.addEventListener('click', this._boundDocumentClick)
  }

  /**
   * Show context menu at event position
   * @param {MouseEvent} event
   * @param {string|null} nodeId - Node ID if right-clicked on a node
   * @param {object|null} edge - Edge info if right-clicked on an edge
   * @param {{ gridEnabled: boolean, gridVisible: boolean, minimapEnabled: boolean }} toggleState
   */
  show(event, nodeId = null, edge = null, toggleState = {}) {
    if (!this.element) return

    event.preventDefault()
    event.stopPropagation()

    this.element.style.left = `${event.clientX}px`
    this.element.style.top = `${event.clientY}px`
    this.element.style.display = 'block'

    let menuHTML = ''

    if (nodeId) {
      menuHTML = `
        <div class="context-menu-item" data-action="edit-node">編集</div>
        <div class="context-menu-item" data-action="delete-node">削除</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="add-node-from">ここから接続を作成</div>
      `
    } else if (edge) {
      menuHTML = `
        <div class="context-menu-item" data-action="edit-edge">編集</div>
        <div class="context-menu-item" data-action="delete-edge">削除</div>
      `
    } else {
      menuHTML = `
        <div class="context-menu-item" data-action="add-node-conversation">会話ノードを追加</div>
        <div class="context-menu-item" data-action="add-node-choice">選択ノードを追加</div>
        <div class="context-menu-item" data-action="add-node-branch">分岐ノードを追加</div>
        <div class="context-menu-item" data-action="add-node-ending">終了ノードを追加</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="toggle-grid-snap">グリッドスナップ: ${toggleState.gridEnabled ? 'ON' : 'OFF'}</div>
        <div class="context-menu-item" data-action="toggle-grid-display">グリッド表示: ${toggleState.gridVisible ? 'ON' : 'OFF'}</div>
        <div class="context-menu-item" data-action="toggle-minimap">ミニマップ: ${toggleState.minimapEnabled ? 'ON' : 'OFF'}</div>
      `
    }

    this.element.innerHTML = menuHTML

    this.element.querySelectorAll('.context-menu-item').forEach(item => {
      item.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      `
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f0f0'
      })
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent'
      })
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        this.onAction(item.dataset.action, nodeId, edge, event)
        this.hide()
      })
    })
  }

  /** Hide the context menu */
  hide() {
    if (this.element) {
      this.element.style.display = 'none'
    }
  }

  /** Clean up DOM and event listeners */
  destroy() {
    if (this._boundDocumentClick) {
      document.removeEventListener('click', this._boundDocumentClick)
    }
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }
}
