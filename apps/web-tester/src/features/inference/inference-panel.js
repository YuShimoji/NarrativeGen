/**
 * Inference Panel
 *
 * Live Previewパネル内に推論分析セクションを描画する。
 * - 到達パス分析 (UC-1)
 * - 影響分析 (UC-3)
 * - 状態キー使用状況 (UC-4)
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
    /** @type {HTMLElement | null} */
    this._impactContent = null
    /** @type {HTMLElement | null} */
    this._stateKeysContent = null
    /** @type {HTMLElement | null} */
    this._whatIfContent = null
    /** @type {HTMLElement | null} */
    this._reachableContent = null
    /** @type {object | null} - 現在のセッション状態（外部から設定） */
    this._session = null
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
    headerTitle.textContent = '推論分析'

    const headerToggle = document.createElement('span')
    headerToggle.className = 'inference-header-toggle'
    headerToggle.textContent = '\u25BC'

    header.appendChild(headerTitle)
    header.appendChild(headerToggle)
    section.appendChild(header)

    // 到達パスセクション
    const pathLabel = document.createElement('div')
    pathLabel.className = 'inference-sub-label'
    pathLabel.textContent = '到達パス'
    section.appendChild(pathLabel)

    const pathContent = document.createElement('div')
    pathContent.className = 'inference-path-content'
    section.appendChild(pathContent)
    this._pathContent = pathContent

    // 影響分析セクション
    const impactLabel = document.createElement('div')
    impactLabel.className = 'inference-sub-label'
    impactLabel.textContent = '影響分析'
    section.appendChild(impactLabel)

    const impactContent = document.createElement('div')
    impactContent.className = 'inference-impact-content'
    section.appendChild(impactContent)
    this._impactContent = impactContent

    // 状態キー使用状況セクション
    const stateKeysLabel = document.createElement('div')
    stateKeysLabel.className = 'inference-sub-label'
    stateKeysLabel.textContent = '状態キー使用状況'
    section.appendChild(stateKeysLabel)

    const stateKeysContent = document.createElement('div')
    stateKeysContent.className = 'inference-state-keys-content'
    section.appendChild(stateKeysContent)
    this._stateKeysContent = stateKeysContent

    // What-if シミュレーションセクション
    const whatIfLabel = document.createElement('div')
    whatIfLabel.className = 'inference-sub-label'
    whatIfLabel.textContent = 'What-if シミュレーション'
    section.appendChild(whatIfLabel)

    const whatIfContent = document.createElement('div')
    whatIfContent.className = 'inference-whatif-content'
    section.appendChild(whatIfContent)
    this._whatIfContent = whatIfContent

    // 到達可能ノードセクション (UC-2)
    const reachableLabel = document.createElement('div')
    reachableLabel.className = 'inference-sub-label'
    reachableLabel.textContent = '到達可能ノード'
    section.appendChild(reachableLabel)

    const reachableContent = document.createElement('div')
    reachableContent.className = 'inference-reachable-content'
    section.appendChild(reachableContent)
    this._reachableContent = reachableContent

    this._container = section
    return section
  }

  /**
   * 指定ノードの推論分析を全て更新する。
   * @param {string | null} nodeId
   */
  update(nodeId) {
    this._updatePath(nodeId)
    this._updateImpact(nodeId)
    this._updateStateKeys(nodeId)
    this._updateWhatIf(nodeId)
    this._updateReachable()
  }

  /**
   * 外部からセッション状態を設定する。What-ifシミュレーションに必要。
   * @param {object | null} session
   */
  setSession(session) {
    this._session = session
  }

  /**
   * 到達パス分析を更新する (UC-1)。
   * @param {string | null} nodeId
   * @private
   */
  _updatePath(nodeId) {
    if (!this._pathContent) return

    if (!nodeId || !this._bridge.isReady) {
      this._pathContent.innerHTML = ''
      return
    }

    const { path, startNode } = this._bridge.findPath(nodeId)

    if (path === null) {
      this._pathContent.innerHTML =
        '<div class="inference-no-path">スタートノードから到達不能</div>'
      return
    }

    if (path.length === 0) {
      this._pathContent.innerHTML =
        '<div class="inference-start-node">スタートノード</div>'
      return
    }

    const frag = document.createDocumentFragment()
    const startSpan = this._createNodeSpan(startNode)
    frag.appendChild(startSpan)

    for (const step of path) {
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

      const nodeSpan = this._createNodeSpan(step.target)
      frag.appendChild(nodeSpan)
    }

    this._pathContent.innerHTML = ''
    this._pathContent.appendChild(frag)
  }

  /**
   * 影響分析を更新する (UC-3)。
   * 選択ノードの各選択肢について、その選択肢を選んだ場合に影響を受ける他の選択肢を表示する。
   * @param {string | null} nodeId
   * @private
   */
  _updateImpact(nodeId) {
    if (!this._impactContent) return

    if (!nodeId || !this._bridge.isReady || !this._bridge._model) {
      this._impactContent.innerHTML = ''
      return
    }

    const node = this._bridge._model.nodes[nodeId]
    if (!node || !node.choices || node.choices.length === 0) {
      this._impactContent.innerHTML =
        '<div class="inference-empty">選択肢なし</div>'
      return
    }

    const frag = document.createDocumentFragment()
    let hasAnyImpact = false

    for (const choice of node.choices) {
      if (!choice.effects || choice.effects.length === 0) continue
      const affected = this._bridge.getAffectedByChoice(nodeId, choice.id)
      if (affected.length === 0) continue

      hasAnyImpact = true
      const choiceDiv = document.createElement('div')
      choiceDiv.className = 'inference-impact-choice'

      const choiceHeader = document.createElement('span')
      choiceHeader.className = 'inference-impact-choice-label'
      choiceHeader.textContent = `${escapeHtml(choice.text || choice.id)}`
      choiceDiv.appendChild(choiceHeader)

      const affectedList = document.createElement('div')
      affectedList.className = 'inference-impact-list'
      for (const key of affected) {
        const [affNodeId] = key.split(':')
        const item = document.createElement('span')
        item.className = 'inference-impact-item'
        item.textContent = key
        item.addEventListener('click', () => {
          if (this._onNodeClick && affNodeId) this._onNodeClick(affNodeId)
        })
        affectedList.appendChild(item)
      }
      choiceDiv.appendChild(affectedList)
      frag.appendChild(choiceDiv)
    }

    this._impactContent.innerHTML = ''
    if (hasAnyImpact) {
      this._impactContent.appendChild(frag)
    } else {
      this._impactContent.innerHTML =
        '<div class="inference-empty">影響先なし</div>'
    }
  }

  /**
   * 状態キー使用状況を更新する (UC-4)。
   * 選択ノードで使われている状態キーについて、他ノードでの参照・変更箇所を表示する。
   * @param {string | null} nodeId
   * @private
   */
  _updateStateKeys(nodeId) {
    if (!this._stateKeysContent) return

    if (!nodeId || !this._bridge.isReady || !this._bridge._model) {
      this._stateKeysContent.innerHTML = ''
      return
    }

    const node = this._bridge._model.nodes[nodeId]
    if (!node) {
      this._stateKeysContent.innerHTML = ''
      return
    }

    // このノードで使われている状態キーを収集
    const relevantKeys = new Set()
    for (const choice of node.choices || []) {
      for (const cond of choice.conditions || []) {
        if (cond.key) relevantKeys.add(`${cond.type}:${cond.key}`)
      }
      for (const eff of choice.effects || []) {
        if (eff.key) relevantKeys.add(`${eff.type}:${eff.key}`)
      }
    }

    if (relevantKeys.size === 0) {
      this._stateKeysContent.innerHTML =
        '<div class="inference-empty">状態キーなし</div>'
      return
    }

    const frag = document.createDocumentFragment()
    for (const stateKey of [...relevantKeys].sort()) {
      const usage = this._bridge.findStateKeyUsage(stateKey)
      const keyDiv = document.createElement('div')
      keyDiv.className = 'inference-state-key-item'

      const keyLabel = document.createElement('span')
      keyLabel.className = 'inference-state-key-label'
      keyLabel.textContent = stateKey
      keyDiv.appendChild(keyLabel)

      if (usage.conditions.length > 0) {
        const condDiv = document.createElement('div')
        condDiv.className = 'inference-state-key-refs'
        condDiv.innerHTML = `<span class="inference-ref-label">条件参照:</span> `
        for (const ref of usage.conditions) {
          const [refNodeId] = ref.split(':')
          const refSpan = document.createElement('span')
          refSpan.className = 'inference-state-key-ref'
          refSpan.textContent = ref
          refSpan.addEventListener('click', () => {
            if (this._onNodeClick && refNodeId) this._onNodeClick(refNodeId)
          })
          condDiv.appendChild(refSpan)
        }
        keyDiv.appendChild(condDiv)
      }

      if (usage.effects.length > 0) {
        const effDiv = document.createElement('div')
        effDiv.className = 'inference-state-key-refs'
        effDiv.innerHTML = `<span class="inference-ref-label">効果変更:</span> `
        for (const ref of usage.effects) {
          const [refNodeId] = ref.split(':')
          const refSpan = document.createElement('span')
          refSpan.className = 'inference-state-key-ref'
          refSpan.textContent = ref
          refSpan.addEventListener('click', () => {
            if (this._onNodeClick && refNodeId) this._onNodeClick(refNodeId)
          })
          effDiv.appendChild(refSpan)
        }
        keyDiv.appendChild(effDiv)
      }

      frag.appendChild(keyDiv)
    }

    this._stateKeysContent.innerHTML = ''
    this._stateKeysContent.appendChild(frag)
  }

  /**
   * What-if シミュレーションを更新する (UC-5)。
   * 選択ノードの各選択肢について、選択後の状態変化と新たに到達可能になるノードを表示する。
   * @param {string | null} nodeId
   * @private
   */
  _updateWhatIf(nodeId) {
    if (!this._whatIfContent) return

    if (!nodeId || !this._bridge.isReady || !this._bridge._model || !this._session) {
      this._whatIfContent.innerHTML = this._session
        ? ''
        : '<div class="inference-empty">セッション未設定</div>'
      return
    }

    const node = this._bridge._model.nodes[nodeId]
    if (!node || !node.choices || node.choices.length === 0) {
      this._whatIfContent.innerHTML =
        '<div class="inference-empty">選択肢なし</div>'
      return
    }

    const frag = document.createDocumentFragment()
    let hasAnyResult = false

    for (const choice of node.choices) {
      const result = this._bridge.simulateChoice(this._session, nodeId, choice.id)
      if (!result) continue

      // 条件未充足の選択肢はラベル付きで表示
      if (result.unavailable) {
        hasAnyResult = true
        const choiceDiv = document.createElement('div')
        choiceDiv.className = 'inference-whatif-choice inference-whatif-unavailable'
        const choiceHeader = document.createElement('div')
        choiceHeader.className = 'inference-whatif-choice-label'
        choiceHeader.textContent = escapeHtml(choice.text || choice.id) + ' (条件未充足)'
        choiceDiv.appendChild(choiceHeader)
        frag.appendChild(choiceDiv)
        continue
      }

      const hasDiff = result.diff.length > 0
      const hasNewReachable = result.newReachable.length > 0
      if (!hasDiff && !hasNewReachable) continue

      hasAnyResult = true
      const choiceDiv = document.createElement('div')
      choiceDiv.className = 'inference-whatif-choice'

      const choiceHeader = document.createElement('div')
      choiceHeader.className = 'inference-whatif-choice-label'
      choiceHeader.textContent = escapeHtml(choice.text || choice.id)
      choiceDiv.appendChild(choiceHeader)

      // 状態差分
      if (hasDiff) {
        const diffDiv = document.createElement('div')
        diffDiv.className = 'inference-whatif-diff'
        for (const d of result.diff) {
          const line = document.createElement('div')
          line.className = 'inference-whatif-diff-line'
          const fromStr = d.from === undefined ? '(none)' : String(d.from)
          const toStr = d.to === undefined ? '(none)' : String(d.to)
          line.textContent = `${d.key}: ${fromStr} → ${toStr}`
          diffDiv.appendChild(line)
        }
        choiceDiv.appendChild(diffDiv)
      }

      // 新たに到達可能なノード
      if (hasNewReachable) {
        const reachDiv = document.createElement('div')
        reachDiv.className = 'inference-whatif-reachable'
        const reachLabel = document.createElement('span')
        reachLabel.className = 'inference-ref-label'
        reachLabel.textContent = '新規到達可能: '
        reachDiv.appendChild(reachLabel)
        for (const rNodeId of result.newReachable) {
          const nodeSpan = this._createNodeSpan(rNodeId)
          reachDiv.appendChild(nodeSpan)
          reachDiv.appendChild(document.createTextNode(' '))
        }
        choiceDiv.appendChild(reachDiv)
      }

      frag.appendChild(choiceDiv)
    }

    this._whatIfContent.innerHTML = ''
    if (hasAnyResult) {
      this._whatIfContent.appendChild(frag)
    } else {
      this._whatIfContent.innerHTML =
        '<div class="inference-empty">状態変化なし</div>'
    }
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

  /**
   * 到達可能ノード一覧を更新する (UC-2)。
   * セッション状態が設定されている場合のみ表示。
   * @private
   */
  _updateReachable() {
    if (!this._reachableContent) return

    if (!this._session || !this._bridge.isReady || !this._bridge._model) {
      this._reachableContent.innerHTML = this._session
        ? ''
        : '<div class="inference-empty">セッション未設定</div>'
      return
    }

    const reachable = this._bridge.getReachableNodes(this._session)
    const allNodeIds = Object.keys(this._bridge._model.nodes)

    if (allNodeIds.length === 0) {
      this._reachableContent.innerHTML = ''
      return
    }

    const frag = document.createDocumentFragment()

    // 到達可能ノード
    const reachableIds = new Set(reachable.keys())
    const reachableCount = reachableIds.size
    const totalCount = allNodeIds.length

    const summary = document.createElement('div')
    summary.className = 'inference-reachable-summary'
    summary.textContent = `${reachableCount} / ${totalCount} ノード到達可能`
    frag.appendChild(summary)

    const list = document.createElement('div')
    list.className = 'inference-reachable-list'

    for (const nodeId of allNodeIds) {
      const isReachable = reachableIds.has(nodeId)
      const item = document.createElement('span')
      item.className = isReachable
        ? 'inference-reachable-node'
        : 'inference-unreachable-node'
      item.textContent = nodeId
      item.addEventListener('click', () => {
        if (this._onNodeClick) this._onNodeClick(nodeId)
      })
      list.appendChild(item)
    }

    frag.appendChild(list)
    this._reachableContent.innerHTML = ''
    this._reachableContent.appendChild(frag)
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
