/**
 * トースト通知モジュール
 * @module ui/toast
 */

/**
 * トースト通知を表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - トーストタイプ ('success' | 'error' | 'info' | 'warn')
 * @param {number} duration - 表示時間（ミリ秒）
 */
export function showToast(message, type = 'info', duration = 3000) {
  // 既存のトーストコンテナを取得または作成
  let toastContainer = document.getElementById('toast-container')
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `
    document.body.appendChild(toastContainer)
  }

  // トースト要素を作成
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  
  // タイプごとのアイコンと色
  const typeConfig = {
    success: { icon: '✓', color: '#10b981' },
    error: { icon: '✕', color: '#ef4444' },
    warn: { icon: '⚠', color: '#f59e0b' },
    info: { icon: 'ℹ', color: '#3b82f6' }
  }
  
  const config = typeConfig[type] || typeConfig.info
  
  toast.style.cssText = `
    background: linear-gradient(135deg, ${config.color} 0%, ${adjustBrightness(config.color, -20)} 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 300px;
    max-width: 500px;
    font-size: 0.95rem;
    font-weight: 500;
    pointer-events: auto;
    animation: slideInUp 0.3s ease-out;
    transition: opacity 0.3s ease, transform 0.3s ease;
  `
  
  toast.innerHTML = `
    <span style="font-size: 1.5rem; font-weight: bold;">${config.icon}</span>
    <span style="flex: 1;">${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">閉じる</button>
  `
  
  toastContainer.appendChild(toast)
  
  // 自動削除
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(-20px)'
    setTimeout(() => {
      toast.remove()
      // コンテナが空になったら削除
      if (toastContainer.children.length === 0) {
        toastContainer.remove()
      }
    }, 300)
  }, duration)
}

/**
 * HTMLエスケープ
 * @private
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * 色の明度を調整
 * @private
 * @param {string} color - カラーコード（#RRGGBB形式）
 * @param {number} percent - 調整パーセント（-100〜100）
 * @returns {string} 調整後のカラーコード
 */
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

/**
 * 成功メッセージを表示
 * @param {string} message - 表示するメッセージ
 */
export function showSuccess(message) {
  showToast(message, 'success')
}

/**
 * エラーメッセージを表示
 * @param {string} message - 表示するメッセージ
 */
export function showError(message) {
  showToast(message, 'error')
}

/**
 * 警告メッセージを表示
 * @param {string} message - 表示するメッセージ
 */
export function showWarning(message) {
  showToast(message, 'warn')
}

/**
 * 情報メッセージを表示
 * @param {string} message - 表示するメッセージ
 */
export function showInfo(message) {
  showToast(message, 'info')
}
