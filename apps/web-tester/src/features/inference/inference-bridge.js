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
   * 初期化済みかどうか
   * @returns {boolean}
   */
  get isReady() {
    return this._model !== null
  }
}
