/**
 * SaveManager - セーブ/ロード管理クラス
 * 
 * ゲームのセーブ・ロード機能を担当します。
 * スロットベースのセーブとオートセーブをサポートします。
 */

import {
  SAVE_SLOTS,
  SAVE_KEY_PREFIX,
  AUTOSAVE_KEY,
  AUTOSAVE_INTERVAL,
  SAVE_DATA_VERSION
} from '../config/constants.js'
import Logger from '../core/logger.js'
import {
  getCurrentSession,
  getCurrentModelName,
  setCurrentSession,
  setCurrentModelName
} from '../core/session.js'

export class SaveManager {
  constructor() {
    /** @type {AppState|null} アプリケーション状態 */
    this.appState = null
    
    /** @type {Function|null} ステータス表示関数 */
    this.setStatus = null
    
    /** @type {Object} UI更新コールバック */
    this.uiCallbacks = {
      renderState: null,
      renderChoices: null,
      renderStory: null,
      renderDebugInfo: null
    }
    
    /** @type {HTMLElement|null} セーブスロット表示要素 */
    this.saveSlotsContainer = null
    
    /** @type {number|null} オートセーブ用インターバルID */
    this.autoSaveInterval = null
    
    /** @type {boolean} 初期化済みフラグ */
    this.initialized = false
  }

  /**
   * マネージャーを初期化
   * @param {Object} options - 初期化オプション
   * @param {AppState} options.appState - アプリケーション状態
   * @param {Function} options.setStatus - ステータス表示関数
   * @param {Object} options.uiCallbacks - UI更新コールバック
   * @param {HTMLElement} options.saveSlotsContainer - セーブスロット表示要素
   */
  initialize(options = {}) {
    if (options.appState) {
      this.appState = options.appState
    }
    
    if (options.setStatus) {
      this.setStatus = options.setStatus
    }
    
    if (options.uiCallbacks) {
      Object.assign(this.uiCallbacks, options.uiCallbacks)
    }
    
    if (options.saveSlotsContainer) {
      this.saveSlotsContainer = options.saveSlotsContainer
      this.setupEventListeners()
    }
    
    this.initialized = true
    Logger.info('SaveManager initialized')
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    if (this.saveSlotsContainer) {
      this.saveSlotsContainer.addEventListener('click', (e) => this.handleSlotClick(e))
    }
  }

  /**
   * セーブデータを作成
   * @param {Object} session - セッションオブジェクト
   * @param {string} [modelName] - モデル名
   * @returns {Object} セーブデータ
   */
  createSaveData(session, modelName) {
    return {
      version: SAVE_DATA_VERSION,
      timestamp: new Date().toISOString(),
      modelName: modelName || getCurrentModelName(),
      session: {
        nodeId: session.nodeId,
        flags: { ...session.flags },
        resources: { ...session.resources },
        variables: { ...session.variables },
        time: session.time
      },
      storyLog: this.appState ? [...this.appState.storyLog] : []
    }
  }

  /**
   * セーブデータからセッションを復元
   * @param {Object} saveData - セーブデータ
   * @returns {Object} 復元されたセッション
   * @private
   */
  _restoreSessionFromSaveData(saveData) {
    const restoredSession = {
      nodeId: saveData.session.nodeId,
      flags: { ...saveData.session.flags },
      resources: { ...saveData.session.resources },
      variables: { ...saveData.session.variables },
      time: saveData.session.time
    }
    setCurrentSession(restoredSession)
    setCurrentModelName(saveData.modelName)

    if (this.appState) {
      this.appState.storyLog = saveData.storyLog || []
    }

    return restoredSession
  }

  /**
   * 指定スロットに保存
   * @param {number} slotId - スロットID
   * @returns {boolean} 成功した場合true
   */
  saveToSlot(slotId) {
    const currentSession = getCurrentSession()
    if (!currentSession || !this.appState?.model) {
      if (this.setStatus) {
        this.setStatus('保存するセッションがありません', 'warn')
      }
      return false
    }

    try {
      const saveData = this.createSaveData(currentSession)
      const key = `${SAVE_KEY_PREFIX}${slotId}`
      localStorage.setItem(key, JSON.stringify(saveData))

      if (this.setStatus) {
        this.setStatus(`スロット ${slotId} に保存しました`, 'success')
      }
      Logger.info('Game saved', { slotId, nodeId: currentSession.nodeId })
      return true
    } catch (error) {
      if (this.setStatus) {
        this.setStatus(`保存に失敗しました: ${error.message}`, 'error')
      }
      Logger.error('Save failed', { slotId, error: error.message })
      return false
    }
  }

  /**
   * 指定スロットから読み込み
   * @param {number} slotId - スロットID
   * @returns {boolean} 成功した場合true
   */
  loadFromSlot(slotId) {
    try {
      const key = `${SAVE_KEY_PREFIX}${slotId}`
      const savedData = localStorage.getItem(key)

      if (!savedData) {
        if (this.setStatus) {
          this.setStatus(`スロット ${slotId} にセーブデータがありません`, 'warn')
        }
        return false
      }

      const saveData = JSON.parse(savedData)

      // Validate save data
      if (!saveData.session || !saveData.modelName) {
        throw new Error('不正なセーブデータです')
      }

      // Restore session using helper method
      const restoredSession = this._restoreSessionFromSaveData(saveData)

      // Update UI
      this.updateUI()

      if (this.setStatus) {
        this.setStatus(`スロット ${slotId} から読み込みました`, 'success')
      }
      Logger.info('Game loaded', { slotId, nodeId: restoredSession.nodeId })
      return true
    } catch (error) {
      if (this.setStatus) {
        this.setStatus(`読み込みに失敗しました: ${error.message}`, 'error')
      }
      Logger.error('Load failed', { slotId, error: error.message })
      return false
    }
  }

  /**
   * オートセーブを実行
   */
  autoSave() {
    const currentSession = getCurrentSession()
    if (!currentSession || !this.appState?.model) return

    try {
      const saveData = this.createSaveData(currentSession)
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData))
      Logger.info('Auto-saved', { nodeId: currentSession.nodeId })
    } catch (error) {
      Logger.error('Auto-save failed', { error: error.message })
    }
  }

  /**
   * オートセーブから読み込み
   * @returns {boolean} 成功した場合true
   */
  loadAutoSave() {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY)
      if (!savedData) return false

      const saveData = JSON.parse(savedData)
      if (!saveData.session) return false

      // Restore session using helper method
      const restoredSession = this._restoreSessionFromSaveData(saveData)

      Logger.info('Auto-save loaded', { nodeId: restoredSession.nodeId })
      return true
    } catch (error) {
      Logger.error('Auto-save load failed', { error: error.message })
      return false
    }
  }

  /**
   * スロット情報を取得
   * @param {number} slotId - スロットID
   * @returns {Object|null} スロット情報
   */
  getSlotInfo(slotId) {
    try {
      const key = `${SAVE_KEY_PREFIX}${slotId}`
      const savedData = localStorage.getItem(key)

      if (!savedData) return null

      const saveData = JSON.parse(savedData)
      return {
        slotId,
        timestamp: saveData.timestamp,
        modelName: saveData.modelName,
        nodeId: saveData.session?.nodeId,
        time: saveData.session?.time
      }
    } catch (error) {
      Logger.error('Failed to read save slot info', { slotId, error: error.message })
      return null
    }
  }

  /**
   * スロットをクリア
   * @param {number} slotId - スロットID
   * @returns {boolean} 成功した場合true
   */
  clearSlot(slotId) {
    try {
      const key = `${SAVE_KEY_PREFIX}${slotId}`
      localStorage.removeItem(key)
      if (this.setStatus) {
        this.setStatus(`スロット ${slotId} をクリアしました`, 'info')
      }
      Logger.info('Save slot cleared', { slotId })
      return true
    } catch (error) {
      if (this.setStatus) {
        this.setStatus(`スロットのクリアに失敗しました: ${error.message}`, 'error')
      }
      return false
    }
  }

  /**
   * オートセーブをクリア
   */
  clearAutoSave() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY)
      if (this.setStatus) {
        this.setStatus('オートセーブをクリアしました', 'info')
      }
      Logger.info('Auto-save cleared')
    } catch (error) {
      Logger.error('Failed to clear auto-save', { error: error.message })
    }
  }

  /**
   * オートセーブを開始
   * @param {number} [intervalMs=AUTOSAVE_INTERVAL] - インターバル（ミリ秒）
   */
  startAutoSave(intervalMs = AUTOSAVE_INTERVAL) {
    this.stopAutoSave()
    this.autoSaveInterval = setInterval(() => this.autoSave(), intervalMs)
    Logger.info('Auto-save started', { intervalMs })
  }

  /**
   * オートセーブを停止
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
      Logger.info('Auto-save stopped')
    }
  }

  /**
   * セーブスロットUIをレンダリング
   */
  renderSlots() {
    if (!this.saveSlotsContainer) return

    this.saveSlotsContainer.innerHTML = ''

    for (let i = 1; i <= SAVE_SLOTS; i++) {
      const slotInfo = this.getSlotInfo(i)
      const slotDiv = document.createElement('div')
      slotDiv.className = 'save-slot'
      slotDiv.innerHTML = `
        <div class="slot-header">
          <strong>スロット ${i}</strong>
          ${slotInfo ? `<span class="slot-info">${slotInfo.modelName} - ${slotInfo.nodeId} (時間: ${slotInfo.time})</span>` : '<span class="slot-empty">空</span>'}
        </div>
        <div class="slot-timestamp">
          ${slotInfo ? `保存日時: ${new Date(slotInfo.timestamp).toLocaleString()}` : ''}
        </div>
        <div class="slot-buttons">
          <button class="save-btn" data-slot="${i}" ${!getCurrentSession() ? 'disabled' : ''}>保存</button>
          <button class="load-btn" data-slot="${i}" ${!slotInfo ? 'disabled' : ''}>読み込み</button>
          <button class="clear-btn" data-slot="${i}" ${!slotInfo ? 'disabled' : ''}>クリア</button>
        </div>
      `
      this.saveSlotsContainer.appendChild(slotDiv)
    }

    // Add auto-save info
    const autoSaveDiv = document.createElement('div')
    autoSaveDiv.className = 'save-slot autosave'
    autoSaveDiv.innerHTML = `
      <div class="slot-header">
        <strong>オートセーブ</strong>
        <span class="slot-info">${getCurrentSession() ? '有効' : '無効'}</span>
      </div>
      <div class="slot-buttons">
        <button id="loadAutoSaveBtn" ${!localStorage.getItem(AUTOSAVE_KEY) ? 'disabled' : ''}>オートセーブから読み込み</button>
        <button id="clearAutoSaveBtn" ${!localStorage.getItem(AUTOSAVE_KEY) ? 'disabled' : ''}>オートセーブをクリア</button>
      </div>
    `
    this.saveSlotsContainer.appendChild(autoSaveDiv)
  }

  /**
   * スロットクリックを処理
   * @param {Event} event - クリックイベント
   */
  handleSlotClick(event) {
    const button = event.target

    // Handle auto-save buttons
    if (button.id === 'loadAutoSaveBtn') {
      if (this.loadAutoSave()) {
        this.updateUI()
        if (this.setStatus) {
          this.setStatus('オートセーブから読み込みました', 'success')
        }
        this.renderSlots()
      }
      return
    }

    if (button.id === 'clearAutoSaveBtn') {
      if (confirm('オートセーブデータを削除しますか？')) {
        this.clearAutoSave()
        this.renderSlots()
      }
      return
    }

    // Handle slot buttons
    if (!button.classList.contains('save-btn') && 
        !button.classList.contains('load-btn') && 
        !button.classList.contains('clear-btn')) {
      return
    }

    const slotId = parseInt(button.dataset.slot)

    if (button.classList.contains('save-btn')) {
      this.saveToSlot(slotId)
      this.renderSlots()
    } else if (button.classList.contains('load-btn')) {
      if (this.loadFromSlot(slotId)) {
        this.renderSlots()
      }
    } else if (button.classList.contains('clear-btn')) {
      if (confirm(`スロット ${slotId} のセーブデータを削除しますか？`)) {
        this.clearSlot(slotId)
        this.renderSlots()
      }
    }
  }

  /**
   * UIを更新
   */
  updateUI() {
    const { renderState, renderChoices, renderStory, renderDebugInfo } = this.uiCallbacks
    if (renderState) renderState()
    if (renderChoices) renderChoices()
    if (renderStory) renderStory()
    if (renderDebugInfo) renderDebugInfo()
  }

  /**
   * オートセーブが存在するかチェック
   * @returns {boolean}
   */
  hasAutoSave() {
    return localStorage.getItem(AUTOSAVE_KEY) !== null
  }

  /**
   * スロットにセーブが存在するかチェック
   * @param {number} slotId - スロットID
   * @returns {boolean}
   */
  hasSlotSave(slotId) {
    return localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`) !== null
  }
}
