/**
 * Inference Engine Bridge
 *
 * engine-ts の推論APIをweb-testerから利用するためのラッパー。
 * 依存グラフのキャッシュとエラーハンドリングを提供する。
 */
import {
  findPathToGoal,
  findReachableNodes,
  buildDependencyGraph,
  getAffectedChoices,
  applyChoice,
  getAvailableChoices,
  startSession,
  registerBuiltins,
} from '../../../../../packages/engine-ts/dist/browser.js'

let builtinsRegistered = false

/**
 * 推論エンジンAPIのブリッジ。
 * モデル単位で依存グラフをキャッシュし、パス探索・影響分析を提供する。
 */
export class InferenceBridge {
  constructor() {
    /** @type {import('../../../../../packages/engine-ts/dist/browser.js').DependencyGraph | null} */
    this._depGraph = null
    /** @type {object | null} */
    this._model = null
  }

  /**
   * モデルロード時に呼び出す。依存グラフを構築してキャッシュする。
   * @param {object} model - NarrativeGenモデル
   */
  initialize(model) {
    if (!builtinsRegistered) {
      registerBuiltins()
      builtinsRegistered = true
    }
    this._model = model
    try {
      this._depGraph = buildDependencyGraph(model)
    } catch (e) {
      console.warn('[InferenceBridge] Failed to build dependency graph:', e)
      this._depGraph = null
    }
  }

  /**
   * モデルが変わった場合にキャッシュを破棄・再構築する。
   * @param {object} model
   */
  updateModel(model) {
    this._model = model
    try {
      this._depGraph = buildDependencyGraph(model)
    } catch (e) {
      console.warn('[InferenceBridge] Failed to rebuild dependency graph:', e)
      this._depGraph = null
    }
  }

  /** キャッシュを破棄する */
  dispose() {
    this._depGraph = null
    this._model = null
  }

  /**
   * スタートノードからゴールノードへの到達パスを探索する (Backward Chaining)。
   * @param {string} goalNodeId - 目標ノードID
   * @param {number} [maxDepth=20] - 探索深度上限
   * @returns {{ path: Array<{nodeId: string, choiceId: string, target: string}> | null, startNode: string }}
   */
  findPath(goalNodeId, maxDepth = 20) {
    if (!this._model) return { path: null, startNode: '' }
    const startNode = this._model.startNode || 'start'
    if (goalNodeId === startNode) {
      return { path: [], startNode }
    }
    try {
      const path = findPathToGoal(
        this._model,
        startNode,
        { type: 'reachNode', nodeId: goalNodeId },
        maxDepth,
      )
      return { path, startNode }
    } catch (e) {
      console.warn('[InferenceBridge] findPath error:', e)
      return { path: null, startNode }
    }
  }

  /**
   * 現在のセッション状態から到達可能なノード一覧を取得する (Backward Chaining)。
   * @param {object} session - SessionState
   * @param {number} [maxDepth=20]
   * @returns {Map<string, Array<{nodeId: string, choiceId: string, target: string}>>}
   */
  getReachableNodes(session, maxDepth = 20) {
    if (!this._model) return new Map()
    try {
      return findReachableNodes(this._model, session, maxDepth)
    } catch (e) {
      console.warn('[InferenceBridge] getReachableNodes error:', e)
      return new Map()
    }
  }

  /**
   * 指定ノードの選択肢を選んだ場合に影響を受ける選択肢を取得する (Forward Chaining)。
   * @param {string} nodeId
   * @param {string} choiceId
   * @returns {string[]} 影響を受ける選択肢キー ("nodeId:choiceId" 形式)
   */
  getAffectedByChoice(nodeId, choiceId) {
    if (!this._model || !this._depGraph) return []
    const node = this._model.nodes[nodeId]
    if (!node) return []
    const choice = (node.choices || []).find((c) => c.id === choiceId)
    if (!choice || !choice.effects) return []
    try {
      return getAffectedChoices(this._depGraph, choice.effects)
    } catch (e) {
      console.warn('[InferenceBridge] getAffectedByChoice error:', e)
      return []
    }
  }

  /**
   * 状態キーの使用箇所を逆引きする (UC-4)。
   * 依存グラフから、指定キーを条件で参照している選択肢と、効果で変更している選択肢を返す。
   * @param {string} stateKey - "flag:keyName" / "resource:keyName" / "variable:keyName" 形式
   * @returns {{ conditions: string[], effects: string[] }} "nodeId:choiceId" 形式のリスト
   */
  findStateKeyUsage(stateKey) {
    if (!this._depGraph) return { conditions: [], effects: [] }
    const conditions = []
    const condSet = this._depGraph.stateToChoices.get(stateKey)
    if (condSet) {
      conditions.push(...condSet)
    }
    const effects = []
    for (const [choiceKey, keys] of this._depGraph.choiceToAffectedKeys) {
      if (keys.has(stateKey)) {
        effects.push(choiceKey)
      }
    }
    return { conditions, effects }
  }

  /**
   * 全ての状態キーを取得する。
   * @returns {string[]} 状態キーのリスト
   */
  getAllStateKeys() {
    if (!this._depGraph) return []
    const keys = new Set()
    for (const key of this._depGraph.stateToChoices.keys()) {
      keys.add(key)
    }
    for (const affectedKeys of this._depGraph.choiceToAffectedKeys.values()) {
      for (const key of affectedKeys) {
        keys.add(key)
      }
    }
    return [...keys].sort()
  }

  /**
   * 選択肢を仮選択した場合の状態変化をシミュレートする (UC-5 What-if)。
   * セッションのクローンに対して applyChoice を実行し、差分と到達可能ノードを返す。
   * @param {object} session - 現在の SessionState
   * @param {string} nodeId - 対象ノードID
   * @param {string} choiceId - 選択肢ID
   * @returns {{ before: object, after: object, diff: Array<{key: string, from: *, to: *}>, newReachable: string[] } | null}
   */
  simulateChoice(session, nodeId, choiceId) {
    if (!this._model) return null
    const node = this._model.nodes[nodeId]
    if (!node) return null
    const choice = (node.choices || []).find((c) => c.id === choiceId)
    if (!choice) return null

    try {
      // 仮セッションを nodeId に移動して選択肢を適用
      const simSession = { ...session, nodeId }

      // 条件未充足の選択肢はスキップ（applyChoice は例外を投げる）
      const available = getAvailableChoices(simSession, this._model)
      if (!available.some((c) => c.id === choiceId)) {
        return { before: session, after: session, diff: [], newReachable: [], unavailable: true }
      }

      const after = applyChoice(simSession, this._model, choiceId)

      // 状態差分を計算
      const diff = []
      // flags
      for (const k of new Set([...Object.keys(session.flags || {}), ...Object.keys(after.flags || {})])) {
        const from = (session.flags || {})[k]
        const to = (after.flags || {})[k]
        if (from !== to) diff.push({ key: `flag:${k}`, from: from ?? undefined, to })
      }
      // resources
      for (const k of new Set([...Object.keys(session.resources || {}), ...Object.keys(after.resources || {})])) {
        const from = (session.resources || {})[k]
        const to = (after.resources || {})[k]
        if (from !== to) diff.push({ key: `resource:${k}`, from: from ?? 0, to })
      }
      // variables
      for (const k of new Set([...Object.keys(session.variables || {}), ...Object.keys(after.variables || {})])) {
        const from = (session.variables || {})[k]
        const to = (after.variables || {})[k]
        if (from !== to) diff.push({ key: `variable:${k}`, from: from ?? undefined, to })
      }
      // inventory
      const invBefore = new Set(session.inventory || [])
      const invAfter = new Set(after.inventory || [])
      for (const id of invAfter) {
        if (!invBefore.has(id)) diff.push({ key: `item:${id}`, from: undefined, to: true })
      }
      for (const id of invBefore) {
        if (!invAfter.has(id)) diff.push({ key: `item:${id}`, from: true, to: undefined })
      }

      // 新たに到達可能になるノード
      const reachableBefore = findReachableNodes(this._model, session)
      const reachableAfter = findReachableNodes(this._model, after)
      const newReachable = []
      for (const nodeKey of reachableAfter.keys()) {
        if (!reachableBefore.has(nodeKey)) newReachable.push(nodeKey)
      }

      return { before: session, after, diff, newReachable }
    } catch (e) {
      console.warn('[InferenceBridge] simulateChoice error:', e)
      return null
    }
  }

  /**
   * 初期化済みかどうか
   * @returns {boolean}
   */
  get isReady() {
    return this._model !== null
  }
}
