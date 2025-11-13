/**
 * localStorage操作ユーティリティモジュール
 * @module utils/storage
 */

const STORAGE_PREFIX = 'narrativeGen_'

/**
 * ストレージキーを生成
 * @param {string} key - キー
 * @returns {string} プレフィックス付きキー
 */
function getStorageKey(key) {
  return STORAGE_PREFIX + key
}

/**
 * localStorageにデータを保存
 * @param {string} key - キー
 * @param {*} value - 保存する値
 * @returns {boolean} 成功した場合true
 */
export function setStorageItem(key, value) {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(getStorageKey(key), serialized)
    return true
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error)
    return false
  }
}

/**
 * localStorageからデータを取得
 * @param {string} key - キー
 * @param {*} defaultValue - デフォルト値
 * @returns {*} 保存された値またはデフォルト値
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(getStorageKey(key))
    if (item === null) return defaultValue
    return JSON.parse(item)
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * localStorageからデータを削除
 * @param {string} key - キー
 * @returns {boolean} 成功した場合true
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(getStorageKey(key))
    return true
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error)
    return false
  }
}

/**
 * 全てのアプリデータを削除
 * @returns {boolean} 成功した場合true
 */
export function clearAllStorage() {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
    return false
  }
}

/**
 * ストレージの使用状況を取得
 * @returns {Object} 使用状況情報
 */
export function getStorageInfo() {
  try {
    const keys = Object.keys(localStorage)
    const appKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX))

    let totalSize = 0
    appKeys.forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        totalSize += item.length
      }
    })

    return {
      totalKeys: keys.length,
      appKeys: appKeys.length,
      totalSize,
      formattedSize: formatBytes(totalSize)
    }
  } catch (error) {
    console.error('Failed to get storage info:', error)
    return null
  }
}

/**
 * ストレージが利用可能かチェック
 * @returns {boolean} 利用可能な場合true
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * バイト数を人間可読形式に変換
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたサイズ
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 設定データを保存
 * @param {Object} settings - 設定オブジェクト
 * @returns {boolean} 成功した場合true
 */
export function saveSettings(settings) {
  return setStorageItem('settings', settings)
}

/**
 * 設定データを読み込み
 * @param {Object} defaultSettings - デフォルト設定
 * @returns {Object} 設定データ
 */
export function loadSettings(defaultSettings = {}) {
  return getStorageItem('settings', defaultSettings)
}

/**
 * テーマ設定を保存
 * @param {string} theme - テーマキー
 * @returns {boolean} 成功した場合true
 */
export function saveTheme(theme) {
  return setStorageItem('theme', theme)
}

/**
 * テーマ設定を読み込み
 * @param {string} defaultTheme - デフォルトテーマ
 * @returns {string} テーマキー
 */
export function loadTheme(defaultTheme = 'default') {
  return getStorageItem('theme', defaultTheme)
}

/**
 * キーバインド設定を保存
 * @param {Object} keyBindings - キーバインドオブジェクト
 * @returns {boolean} 成功した場合true
 */
export function saveKeyBindings(keyBindings) {
  return setStorageItem('keyBindings', keyBindings)
}

/**
 * キーバインド設定を読み込み
 * @param {Object} defaultBindings - デフォルトキーバインド
 * @returns {Object} キーバインド設定
 */
export function loadKeyBindings(defaultBindings = {}) {
  return getStorageItem('keyBindings', defaultBindings)
}

/**
 * AI設定を保存
 * @param {Object} aiConfig - AI設定オブジェクト
 * @returns {boolean} 成功した場合true
 */
export function saveAiConfig(aiConfig) {
  return setStorageItem('aiConfig', aiConfig)
}

/**
 * AI設定を読み込み
 * @param {Object} defaultConfig - デフォルトAI設定
 * @returns {Object} AI設定
 */
export function loadAiConfig(defaultConfig = {}) {
  return getStorageItem('aiConfig', defaultConfig)
}

/**
 * 辞書データを保存
 * @param {Object} lexicon - 辞書オブジェクト
 * @returns {boolean} 成功した場合true
 */
export function saveLexicon(lexicon) {
  return setStorageItem('lexicon', lexicon)
}

/**
 * 辞書データを読み込み
 * @param {Object} defaultLexicon - デフォルト辞書
 * @returns {Object} 辞書データ
 */
export function loadLexicon(defaultLexicon = {}) {
  return getStorageItem('lexicon', defaultLexicon)
}

/**
 * セッション履歴を保存
 * @param {Array} history - 履歴配列
 * @returns {boolean} 成功した場合true
 */
export function saveSessionHistory(history) {
  // 履歴はサイズが大きくなる可能性があるため、最新50件のみ保存
  const limited = history.slice(-50)
  return setStorageItem('sessionHistory', limited)
}

/**
 * セッション履歴を読み込み
 * @returns {Array} セッション履歴
 */
export function loadSessionHistory() {
  return getStorageItem('sessionHistory', [])
}

/**
 * 保存スロットを保存
 * @param {number} slot - スロット番号
 * @param {Object} data - 保存データ
 * @returns {boolean} 成功した場合true
 */
export function saveGameSlot(slot, data) {
  return setStorageItem(`saveSlot_${slot}`, data)
}

/**
 * 保存スロットを読み込み
 * @param {number} slot - スロット番号
 * @returns {Object|null} 保存データ
 */
export function loadGameSlot(slot) {
  return getStorageItem(`saveSlot_${slot}`, null)
}

/**
 * 保存スロットを削除
 * @param {number} slot - スロット番号
 * @returns {boolean} 成功した場合true
 */
export function deleteGameSlot(slot) {
  return removeStorageItem(`saveSlot_${slot}`)
}

/**
 * 全ての保存スロットを取得
 * @returns {Object} スロット番号をキーとした保存データ
 */
export function getAllGameSlots() {
  const slots = {}
  for (let i = 1; i <= 5; i++) { // スロット1-5を想定
    const data = loadGameSlot(i)
    if (data) {
      slots[i] = data
    }
  }
  return slots
}
