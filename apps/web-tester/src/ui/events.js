/**
 * イベント管理モジュール
 * @module ui/events
 */

export class EventManager {
  constructor() {
    this._handlers = new Map();
  }

  /**
   * イベントリスナーを登録
   * @param {HTMLElement} element - 対象要素
   * @param {string} event - イベントタイプ
   * @param {Function} handler - ハンドラ関数
   * @param {Object} [options] - オプション
   * @returns {Function} 登録解除関数
   */
  on(element, event, handler, options = {}) {
    const wrappedHandler = (e) => {
      try {
        handler(e);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    };
    
    element.addEventListener(event, wrappedHandler, options);
    
    const key = this._getKey(element, event);
    if (!this._handlers.has(key)) {
      this._handlers.set(key, []);
    }
    this._handlers.get(key).push({ handler, wrappedHandler });
    
    return () => this.off(element, event, handler);
  }

  /**
   * イベントリスナーを解除
   * @param {HTMLElement} element - 対象要素
   * @param {string} event - イベントタイプ
   * @param {Function} handler - ハンドラ関数
   */
  off(element, event, handler) {
    const key = this._getKey(element, event);
    const handlers = this._handlers.get(key) || [];
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      const { wrappedHandler } = handlers[index];
      element.removeEventListener(event, wrappedHandler);
      handlers.splice(index, 1);
    }
  }

  /**
   * 特定の要素のイベントリスナーを全解除
   * @param {HTMLElement} element - 対象要素
   * @param {string} [event] - イベントタイプ（省略時は全イベント）
   */
  clear(element, event) {
    if (event) {
      const key = this._getKey(element, event);
      const handlers = this._handlers.get(key) || [];
      handlers.forEach(({ wrappedHandler }) => {
        element.removeEventListener(event, wrappedHandler);
      });
      this._handlers.delete(key);
    } else {
      const keys = Array.from(this._handlers.keys()).filter(k => k.startsWith(`${element.id}_`));
      keys.forEach(key => {
        const [_, event] = key.split('_');
        const handlers = this._handlers.get(key) || [];
        handlers.forEach(({ wrappedHandler }) => {
          element.removeEventListener(event, wrappedHandler);
        });
        this._handlers.delete(key);
      });
    }
  }

  /**
   * すべてのイベントリスナーを解除
   */
  clearAll() {
    this._handlers.forEach((handlers, key) => {
      const [elementId, event] = key.split('_');
      const element = document.getElementById(elementId);
      if (element) {
        handlers.forEach(({ wrappedHandler }) => {
          element.removeEventListener(event, wrappedHandler);
        });
      }
    });
    this._handlers.clear();
  }

  /**
   * 内部キーを生成
   * @private
   * @param {HTMLElement} element - 対象要素
   * @param {string} event - イベントタイプ
   * @returns {string} キー文字列
   */
  _getKey(element, event) {
    return `${element.id}_${event}`;
  }
}

// グローバルイベントマネージャーインスタンス
export const eventManager = new EventManager();
