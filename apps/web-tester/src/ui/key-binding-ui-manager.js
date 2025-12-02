/**
 * KeyBindingUIManager - キーバインドUI管理クラス
 *
 * キーバインドのハンドラー定義とUI処理を担当します。
 */

import Logger from '../core/logger.js'

export class KeyBindingUIManager {
  constructor() {
    this.keyBindingManager = null
    this.appState = null
    this.setStatus = null
  }

  /**
   * 初期化
   */
  initialize(keyBindingManager, appState, setStatusCallback, options = {}) {
    this.keyBindingManager = keyBindingManager
    this.appState = appState
    this.setStatus = setStatusCallback
    this.mermaidPreviewManager = options.mermaidPreviewManager || null
    this.guiEditorManager = options.guiEditorManager || null
    this.updateMermaidCallback = options.updateMermaidCallback || null
  }

  /**
   * キーバインドハンドラーを定義
   */
  getHandlers() {
    return {
      'inventory': () => {
        // Placeholder for inventory functionality
        this.setStatus('インベントリ機能は開発中です', 'info')
        Logger.info('Inventory key pressed')
      },

      'debug': () => {
        // Toggle debug panel
        const debugPanel = document.getElementById('debugPanel')
        const debugTab = document.getElementById('debugTab')
        if (debugPanel.classList.contains('active')) {
          debugPanel.classList.remove('active')
          debugTab.classList.remove('active')
        } else {
          debugPanel.classList.add('active')
          debugTab.classList.add('active')
          this._renderDebugInfo()
        }
        Logger.info('Debug panel toggled')
      },

      'graph': () => {
        // Toggle graph panel
        const graphPanel = document.getElementById('graphPanel')
        const graphTab = document.getElementById('graphTab')
        if (graphPanel.classList.contains('active')) {
          graphPanel.classList.remove('active')
          graphTab.classList.remove('active')
        } else {
          graphPanel.classList.add('active')
          graphTab.classList.add('active')
          this._renderGraph()
        }
        Logger.info('Graph panel toggled')
      },

      'story': () => {
        // Toggle story panel
        const storyPanel = document.getElementById('storyPanel')
        const storyTab = document.getElementById('storyTab')
        if (storyPanel.classList.contains('active')) {
          storyPanel.classList.remove('active')
          storyTab.classList.remove('active')
        } else {
          storyPanel.classList.add('active')
          storyTab.classList.add('active')
        }
        Logger.info('Story panel toggled')
      },

      'ai': () => {
        // Toggle AI panel
        const aiPanel = document.getElementById('aiPanel')
        const aiTab = document.getElementById('aiTab')
        if (aiPanel.classList.contains('active')) {
          aiPanel.classList.remove('active')
          aiTab.classList.remove('active')
        } else {
          aiPanel.classList.add('active')
          aiTab.classList.add('active')
        }
        Logger.info('AI panel toggled')
      },

      'mermaid': () => {
        // Toggle Mermaid preview panel
        if (this.mermaidPreviewManager) {
          this.mermaidPreviewManager.toggle()
          if (this.updateMermaidCallback) {
            this.updateMermaidCallback()
          }
          Logger.info('Mermaid preview toggled')
        }
      },

      'quickNode': () => {
        // Quick node creation (only in GUI edit mode)
        const guiEditMode = document.getElementById('guiEditMode')
        if (guiEditMode && guiEditMode.style.display !== 'none') {
          if (this.guiEditorManager) {
            this.guiEditorManager.openQuickNodeModal()
          }
          Logger.info('Quick node modal opened')
        }
      }
    }
  }

  /**
   * デバッグ情報レンダリング（簡易版）
   */
  _renderDebugInfo() {
    // 実際のdebugManagerがあれば委譲、そうでなければ簡易実装
    if (typeof debugManager !== 'undefined' && debugManager) {
      debugManager.render()
    }
  }

  /**
   * グラフレンダリング（簡易版）
   */
  _renderGraph() {
    // 実際のgraphManagerがあれば委譲
    if (typeof renderGraph !== 'undefined') {
      renderGraph()
    }
  }

  /**
   * 変数解決ユーティリティ
   */
  resolveVariables(text, session, model) {
    if (!text || !session) return text

    let resolved = text

    // Replace flag variables: {flag:key}
    Object.entries(session.flags || {}).forEach(([key, value]) => {
      resolved = resolved.replace(new RegExp(`\\{flag:${key}\\}`, 'g'), value ? 'true' : 'false')
    })

    // Replace resource variables: {resource:key}
    Object.entries(session.resources || {}).forEach(([key, value]) => {
      resolved = resolved.replace(new RegExp(`\\{resource:${key}\\}`, 'g'), String(value))
    })

    // Replace variable variables: {variable:key}
    Object.entries(session.variables || {}).forEach(([key, value]) => {
      resolved = resolved.replace(new RegExp(`\\{variable:${key}\\}`, 'g'), String(value))
    })

    // Replace node ID variable: {nodeId}
    resolved = resolved.replace(/\{nodeId\}/g, session.nodeId)

    // Replace time variable: {time}
    resolved = resolved.replace(/\{time\}/g, String(session.time))

    return resolved
  }

  /**
   * モデル読み込みユーティリティ
   */
  async loadModel(modelName) {
    const url = `/models/examples/${modelName}.json`
    const response = await fetch(url)
    return await response.json()
  }
}

export default KeyBindingUIManager
