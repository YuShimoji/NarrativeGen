/**
 * テーマ管理モジュール
 * @module ui/theme
 */

import { COLOR_PALETTES, getPalette } from '../config/palettes.js'

const STORAGE_KEY = 'narrativeGenTheme'

/**
 * テーマ管理クラス
 */
export class ThemeManager {
  constructor() {
    this.currentTheme = 'default'
    this.listeners = new Map()
  }

  /**
   * パレットを適用
   * @param {string} paletteKey - 適用するパレットキー
   * @returns {boolean} 成功した場合true
   */
  applyPalette(paletteKey) {
    const palette = getPalette(paletteKey)
    if (!palette) {
      console.warn(`Unknown palette: ${paletteKey}`)
      return false
    }

    const root = document.documentElement
    for (const [variable, value] of Object.entries(palette.colors)) {
      root.style.setProperty(variable, value)
    }

    this.currentTheme = paletteKey
    this._saveThem(paletteKey)
    this._emit('theme:changed', { paletteKey, palette })
    
    return true
  }

  /**
   * 保存されたパレットを読み込み
   * @returns {boolean} 読み込みに成功した場合true
   */
  loadSavedPalette() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && COLOR_PALETTES[saved]) {
        return this.applyPalette(saved)
      }
    } catch (error) {
      console.error('Failed to load saved theme', error)
    }
    return false
  }

  /**
   * 現在のテーマキーを取得
   * @returns {string} テーマキー
   */
  getCurrentTheme() {
    return this.currentTheme
  }

  /**
   * イベントリスナーを登録
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * テーマを保存
   * @private
   * @param {string} paletteKey - パレットキー
   */
  _saveThem(paletteKey) {
    try {
      localStorage.setItem(STORAGE_KEY, paletteKey)
    } catch (error) {
      console.error('Failed to save theme', error)
    }
  }

  /**
   * イベントを発火
   * @private
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   */
  _emit(event, data) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => {
      try {
        cb(data)
      } catch (error) {
        console.error(`Error in ${event} listener:`, error)
      }
    })
  }
}

/**
 * パレットモーダルUIを初期化
 * @param {ThemeManager} themeManager - テーママネージャーインスタンス
 * @param {Function} setStatus - ステータス表示関数
 */
export function initPaletteUI(themeManager, setStatus) {
  const paletteOptions = document.getElementById('paletteOptions')
  if (!paletteOptions) {
    console.warn('paletteOptions element not found')
    return
  }

  paletteOptions.innerHTML = ''
  
  for (const [key, palette] of Object.entries(COLOR_PALETTES)) {
    const option = document.createElement('div')
    option.style.cssText = `
      padding: 1rem;
      border-radius: 8px;
      border: 2px solid rgba(0,0,0,0.15);
      background: linear-gradient(135deg, ${palette.colors['--color-primary']} 0%, ${palette.colors['--color-primary-dark']} 100%);
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `
    option.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 0.5rem; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${palette.name}</div>
      <div style="display: flex; gap: 4px; justify-content: center;">
        <div style="width: 30px; height: 30px; border-radius: 4px; background: ${palette.colors['--color-secondary']}; border: 2px solid rgba(255,255,255,0.3);"></div>
        <div style="width: 30px; height: 30px; border-radius: 4px; background: ${palette.colors['--color-secondary-dark']}; border: 2px solid rgba(255,255,255,0.3);"></div>
      </div>
    `
    
    option.addEventListener('mouseenter', () => {
      option.style.transform = 'translateY(-4px) scale(1.02)'
      option.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)'
    })
    option.addEventListener('mouseleave', () => {
      option.style.transform = 'translateY(0) scale(1)'
      option.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    })
    option.addEventListener('click', () => {
      if (themeManager.applyPalette(key)) {
        setStatus(`テーマ「${palette.name}」を適用しました`, 'success')
        const paletteModal = document.getElementById('paletteModal')
        if (paletteModal) {
          paletteModal.style.display = 'none'
        }
      }
    })
    
    paletteOptions.appendChild(option)
  }
}

/**
 * テーマイベントリスナーを設定
 * @param {ThemeManager} themeManager - テーママネージャーインスタンス
 */
export function setupThemeEventListeners(themeManager) {
  const themeBtn = document.getElementById('themeBtn')
  const paletteModal = document.getElementById('paletteModal')
  const closePaletteBtn = document.getElementById('closePaletteBtn')

  if (themeBtn && paletteModal) {
    themeBtn.addEventListener('click', () => {
      initPaletteUI(themeManager, window.setStatus || console.log)
      paletteModal.style.display = 'flex'
      paletteModal.classList.add('show')
    })
  }

  if (closePaletteBtn && paletteModal) {
    closePaletteBtn.addEventListener('click', () => {
      paletteModal.classList.remove('show')
      setTimeout(() => {
        paletteModal.style.display = 'none'
      }, 300)
    })
  }

  // モーダル外クリックで閉じる
  if (paletteModal) {
    paletteModal.addEventListener('click', (e) => {
      if (e.target === paletteModal) {
        paletteModal.classList.remove('show')
        setTimeout(() => {
          paletteModal.style.display = 'none'
        }, 300)
      }
    })
  }
}
