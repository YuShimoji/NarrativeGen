/**
 * KeyBindingManager - キーバインド管理クラス
 * 
 * キーボードショートカットの管理、保存、読み込みを担当します。
 */

import { DEFAULT_KEY_BINDINGS } from '../config/keybindings.js'
import { KEY_BINDINGS_STORAGE_KEY } from '../config/constants.js'
import Logger from '../core/logger.js'

export class KeyBindingManager {
  constructor() {
    /** @type {Object.<string, string>} 現在のキーバインド設定 */
    this.bindings = { ...DEFAULT_KEY_BINDINGS }
    
    /** @type {Object.<string, Function>} アクションハンドラー */
    this.handlers = {}
    
    /** @type {Function|null} ステータス表示関数 */
    this.setStatus = null
    
    /** @type {Object} UI要素への参照 */
    this.uiElements = {
      inventoryKey: null,
      debugKey: null,
      graphKey: null,
      storyKey: null,
      aiKey: null,
      mermaidKey: null,
      keyBindingDisplay: null
    }
    
    /** @type {boolean} 初期化済みフラグ */
    this.initialized = false
  }

  /**
   * マネージャーを初期化
   * @param {Object} options - 初期化オプション
   * @param {Function} options.setStatus - ステータス表示関数
   * @param {Object} options.handlers - アクションハンドラー
   * @param {Object} options.uiElements - UI要素への参照
   * @param {HTMLElement} options.guiEditMode - GUI編集モードの要素
   * @param {HTMLElement} options.saveGuiBtn - GUI保存ボタン
   */
  initialize(options = {}) {
    if (options.setStatus) {
      this.setStatus = options.setStatus
    }
    
    if (options.handlers) {
      this.handlers = { ...options.handlers }
    }
    
    if (options.uiElements) {
      Object.assign(this.uiElements, options.uiElements)
    }

    if (options.guiEditMode) {
      this.guiEditMode = options.guiEditMode
    }

    if (options.saveGuiBtn) {
      this.saveGuiBtn = options.saveGuiBtn
    }
    
    // ストレージからキーバインドを読み込み
    this.loadFromStorage()
    
    // グローバルキーイベントリスナーを設定
    this.setupGlobalKeyListener()
    
    this.initialized = true
    Logger.info('KeyBindingManager initialized')
  }

  /**
   * ハンドラーを登録
   * @param {string} action - アクション名
   * @param {Function} handler - ハンドラー関数
   */
  registerHandler(action, handler) {
    this.handlers[action] = handler
  }

  /**
   * 複数のハンドラーを一括登録
   * @param {Object.<string, Function>} handlers - ハンドラーマップ
   */
  registerHandlers(handlers) {
    Object.assign(this.handlers, handlers)
  }

  /**
   * グローバルキーイベントリスナーを設定
   */
  setupGlobalKeyListener() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e))
  }

  /**
   * キーダウンイベントを処理
   * @param {KeyboardEvent} e - キーボードイベント
   */
  handleKeyDown(e) {
    // 入力フィールド内では無視
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }

    const key = e.key.toLowerCase()
    
    // Special handling for Ctrl+S (save) in GUI edit mode
    if (e.ctrlKey && key === 's' && this.guiEditMode && this.guiEditMode.style.display !== 'none') {
      e.preventDefault()
      if (this.saveGuiBtn) {
        this.saveGuiBtn.click()
      }
      return
    }
    
    // キーバインドに一致するアクションを検索
    for (const [action, boundKey] of Object.entries(this.bindings)) {
      if (key === boundKey.toLowerCase()) {
        e.preventDefault()
        const handler = this.handlers[action]
        if (handler) {
          handler()
        }
        break
      }
    }
  }

  /**
   * キーバインド情報を取得
   * @returns {string} キーバインド情報の文字列
   */
  getBindingInfo() {
    return Object.entries(this.bindings)
      .map(([action, key]) => `${action}: ${key.toUpperCase()}`)
      .join(', ')
  }

  /**
   * キーバインドヘルプを表示
   */
  showHelp() {
    const helpText = `キーバインド:\n${this.getBindingInfo()}\n\n入力フィールド内では無効化されます。`
    alert(helpText)
  }

  /**
   * UI要素を現在のバインドで更新
   */
  updateUI() {
    const { inventoryKey, debugKey, graphKey, storyKey, aiKey, mermaidKey, keyBindingDisplay } = this.uiElements
    
    if (inventoryKey) inventoryKey.value = this.bindings.inventory
    if (debugKey) debugKey.value = this.bindings.debug
    if (graphKey) graphKey.value = this.bindings.graph
    if (storyKey) storyKey.value = this.bindings.story
    if (aiKey) aiKey.value = this.bindings.ai
    if (mermaidKey && this.bindings.mermaid) mermaidKey.value = this.bindings.mermaid
    
    if (keyBindingDisplay) {
      keyBindingDisplay.textContent = this.getBindingInfo()
    }
  }

  /**
   * UI要素から新しいバインドを取得
   * @returns {Object|null} 新しいバインド設定、またはnull（バリデーション失敗時）
   */
  getBindingsFromUI() {
    const { inventoryKey, debugKey, graphKey, storyKey, aiKey, mermaidKey } = this.uiElements
    
    const newBindings = {
      inventory: inventoryKey?.value?.toLowerCase() || 'z',
      debug: debugKey?.value?.toLowerCase() || 'd',
      graph: graphKey?.value?.toLowerCase() || 'g',
      story: storyKey?.value?.toLowerCase() || 's',
      ai: aiKey?.value?.toLowerCase() || 'a',
      mermaid: mermaidKey?.value?.toLowerCase() || 'm'
    }
    
    // 重複チェック
    const values = Object.values(newBindings)
    const uniqueValues = new Set(values)
    if (values.length !== uniqueValues.size) {
      if (this.setStatus) {
        this.setStatus('❌ 同じキーを複数回使用することはできません', 'error')
      }
      return null
    }
    
    return newBindings
  }

  /**
   * キーバインドを保存
   * @returns {boolean} 成功した場合true
   */
  save() {
    const newBindings = this.getBindingsFromUI()
    if (!newBindings) return false
    
    Object.assign(this.bindings, newBindings)
    
    try {
      localStorage.setItem(KEY_BINDINGS_STORAGE_KEY, JSON.stringify(this.bindings))
      if (this.setStatus) {
        this.setStatus('✅ キーバインドを保存しました', 'success')
      }
      this.updateUI()
      Logger.info('Key bindings saved', { bindings: this.bindings })
      return true
    } catch (error) {
      if (this.setStatus) {
        this.setStatus('❌ キーバインドの保存に失敗しました', 'error')
      }
      Logger.error('Failed to save key bindings', { error: error.message })
      return false
    }
  }

  /**
   * キーバインドをデフォルトにリセット
   */
  reset() {
    Object.assign(this.bindings, DEFAULT_KEY_BINDINGS)
    this.updateUI()
    
    try {
      localStorage.removeItem(KEY_BINDINGS_STORAGE_KEY)
      if (this.setStatus) {
        this.setStatus('✅ キーバインドをデフォルトにリセットしました', 'success')
      }
      Logger.info('Key bindings reset to default')
    } catch (error) {
      if (this.setStatus) {
        this.setStatus('❌ リセットに失敗しました', 'error')
      }
      Logger.error('Failed to reset key bindings', { error: error.message })
    }
  }

  /**
   * ストレージからキーバインドを読み込み
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const requiredKeys = Object.keys(DEFAULT_KEY_BINDINGS)
        if (requiredKeys.every(key => typeof parsed[key] === 'string' && parsed[key].length === 1)) {
          Object.assign(this.bindings, parsed)
          Logger.info('Key bindings loaded from storage', { bindings: this.bindings })
        } else {
          Logger.warn('Invalid key binding data in storage, using defaults')
        }
      }
    } catch (error) {
      Logger.warn('Failed to load key bindings from storage', { error: error.message })
    }
  }

  /**
   * 現在のバインドを取得
   * @returns {Object} 現在のキーバインド設定
   */
  getBindings() {
    return { ...this.bindings }
  }

  /**
   * 特定のアクションのキーを取得
   * @param {string} action - アクション名
   * @returns {string|undefined} バインドされているキー
   */
  getKey(action) {
    return this.bindings[action]
  }
}
