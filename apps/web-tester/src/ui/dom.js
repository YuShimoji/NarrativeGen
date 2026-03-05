/**
 * DOM操作ヘルパーモジュール
 * @module ui/dom
 */

export class DOMManager {
  constructor() {
    this._cache = new Map();
  }

  /**
   * 要素をIDで取得（キャッシュ付き）
   * @param {string} id - 要素ID
   * @returns {HTMLElement|null} HTML要素
   */
  get(id) {
    if (!this._cache.has(id)) {
      const element = document.getElementById(id);
      if (element) {
        this._cache.set(id, element);
      }
    }
    return this._cache.get(id) || null;
  }

  /**
   * セレクタで要素をクエリ
   * @param {string} selector - CSSセレクタ
   * @param {HTMLElement} [parent=document] - 親要素
   * @returns {HTMLElement|null} 最初にマッチした要素
   */
  query(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * セレクタで複数要素をクエリ
   * @param {string} selector - CSSセレクタ
   * @param {HTMLElement} [parent=document] - 親要素
   * @returns {NodeList} マッチした要素のリスト
   */
  queryAll(selector, parent = document) {
    return parent.querySelectorAll(selector);
  }

  /**
   * 新しい要素を作成
   * @param {string} tag - タグ名
   * @param {Object} [attributes] - 属性オブジェクト
   * @param {Array} [children] - 子要素の配列
   * @returns {HTMLElement} 作成された要素
   */
  create(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // 属性の設定
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        element.className = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element[key] = value;
      }
    }
    
    // 子要素の追加
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  }

  /**
   * 要素を親要素に追加
   * @param {HTMLElement} parent - 親要素
   * @param {HTMLElement} child - 追加する子要素
   */
  append(parent, child) {
    parent.appendChild(child);
  }

  /**
   * 要素を削除
   * @param {HTMLElement} element - 削除する要素
   */
  remove(element) {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * 要素の表示を切り替え
   * @param {HTMLElement} element - 対象要素
   * @param {boolean} visible - 表示状態
   */
  toggle(element, visible) {
    element.style.display = visible ? 'block' : 'none';
  }

  /**
   * イベントリスナーを追加
   * @param {HTMLElement} element - 対象要素
   * @param {string} event - イベントタイプ
   * @param {Function} handler - ハンドラ関数
   * @param {Object} [options] - オプション
   * @returns {Function} リスナー削除関数
   */
  on(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  }

  /**
   * クラスを追加
   * @param {HTMLElement} element - 対象要素
   * @param {string} className - 追加するクラス名
   */
  addClass(element, className) {
    element.classList.add(className);
  }

  /**
   * クラスを削除
   * @param {HTMLElement} element - 対象要素
   * @param {string} className - 削除するクラス名
   */
  removeClass(element, className) {
    element.classList.remove(className);
  }

  /**
   * クラスの存在をチェック
   * @param {HTMLElement} element - 対象要素
   * @param {string} className - チェックするクラス名
   * @returns {boolean} クラスの有無
   */
  hasClass(element, className) {
    return element.classList.contains(className);
  }

  /**
   * テキストコンテンツを設定
   * @param {HTMLElement} element - 対象要素
   * @param {string} text - 設定するテキスト
   */
  setText(element, text) {
    element.textContent = text;
  }

  /**
   * HTMLコンテンツを設定
   * @param {HTMLElement} element - 対象要素
   * @param {string} html - 設定するHTML
   */
  setHTML(element, html) {
    element.innerHTML = html;
  }
}

// グローバルDOMマネージャーインスタンス
export const dom = new DOMManager();
