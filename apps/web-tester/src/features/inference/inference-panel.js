/**
 * Inference Panel
 *
 * Live Previewパネル内に推論分析セクションを描画する。
 * 選択ノードへの到達パスをインタラクティブに表示する。
 */
import { escapeHtml } from '../../utils/html-utils.js'

/**
 * 推論分析パネルのUI管理
 */
export class InferencePanel {
  /**
   * @param {object} options
   * @param {import('./inference-bridge.js').InferenceBridge} options.bridge
   * @param {function(string): void} options.onNodeClick - ノードIDクリック時のコールバック
   */
  constructor({ bridge, onNodeClick }) {
    this._bridge = bridge
    this._onNodeClick = onNodeClick
    /** @type {HTMLElement | null} */
    this._container = null
    /** @type {HTMLElement | null} */
    this._pathContent = null
    /** @type {boolean} */
    this._collapsed = false
  }

  /**
   * パネルのDOM要素を生成して返す。
   * 親要素に appendChild して使う。
   * @returns {HTMLElement}
   */
  createElement() {
    const section = document.createElement('div')
    section.id = 'inferenceAnalysis'
    section.className = 'inference-analysis-section'

    // ヘッダー (折りたたみ可)
    const header = document.createElement('div')
    header.className = 'inference-header'
    header.addEventListener('click', () => this._toggleCollapse())

    const headerTitle = document.createElement('span')
    headerTitle.className = 'inference-header-title'
    headerTitle.textContent = '到達パス分析'

    const headerToggle = document.createElement('span')
    headerToggle.className = 'inference-header-toggle'
    headerToggle.textContent = '\u25BC'

    header.appendChild(headerTitle)
    header.appendChild(headerToggle)
    section.appendChild(header)

    // コンテンツ
    const content = document.createElement('div')
    content.className = 'inference-path-content'
    section.appendChild(content)

    this._container = section
    this._pathContent = content
    return section
  }

  /**
   * 指定ノードの到達パスを表示する。
   * @param {string | null} nodeId
   */
  update(nodeId) {
    if (!this._pathContent) return

    if (!nodeId || !this._bridge.isReady) {
      this._pathContent.innerHTML = ''
      return
    }

    const { path, startNode } = this._bridge.findPath(nodeId)

    if (path === null) {
      // 到達不能
      this._pathContent.innerHTML =
        '<div class="inference-no-path">スタートノードから到達不能</div>'
      return
    }

    if (path.length === 0) {
      // スタートノード自身
      this._pathContent.innerHTML =
        '<div class="inference-start-node">スタートノード</div>'
      return
    }

    // パスステップを描画
    const frag = document.createDocumentFragment()

    // スタートノード
    const startSpan = this._createNodeSpan(startNode)
    frag.appendChild(startSpan)

    for (const step of path) {
      // 矢印 + 選択肢ラベル
      const arrow = document.createElement('span')
      arrow.className = 'inference-path-arrow'
      arrow.textContent = ' \u2192 '
      frag.appendChild(arrow)

      const choiceLabel = document.createElement('span')
      choiceLabel.className = 'inference-path-choice'
      choiceLabel.textContent = step.choiceId
      frag.appendChild(choiceLabel)

      const arrow2 = document.createElement('span')
      arrow2.className = 'inference-path-arrow'
      arrow2.textContent = ' \u2192 '
      frag.appendChild(arrow2)

      // ターゲットノード
      const nodeSpan = this._createNodeSpan(step.target)
      frag.appendChild(nodeSpan)
    }

    this._pathContent.innerHTML = ''
    this._pathContent.appendChild(frag)
  }

  /**
   * クリック可能なノードIDスパンを作成する。
   * @param {string} nodeId
   * @returns {HTMLSpanElement}
   * @private
   */
  _createNodeSpan(nodeId) {
    const span = document.createElement('span')
    span.className = 'inference-path-node'
    span.textContent = nodeId
    span.dataset.nodeId = nodeId
    span.addEventListener('click', () => {
      if (this._onNodeClick) this._onNodeClick(nodeId)
    })
    return span
  }

  /** @private */
  _toggleCollapse() {
    this._collapsed = !this._collapsed
    if (this._container) {
      this._container.classList.toggle('collapsed', this._collapsed)
    }
  }

  /**
   * bridgeの参照を更新する（モデル変更時）
   * @param {import('./inference-bridge.js').InferenceBridge} bridge
   */
  setBridge(bridge) {
    this._bridge = bridge
  }
}
