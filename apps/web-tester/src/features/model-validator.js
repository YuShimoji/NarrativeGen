/**
 * ModelValidator - モデル検証機能
 * 
 * ストーリーモデルの整合性を検証し、問題を検出します。
 * - 到達不能ノードの検出
 * - 参照切れ（存在しないノードへの遷移）の検出
 * - 孤立ノード（どこからも参照されていないノード）の検出
 * - 循環参照の検出
 */

import Logger from '../core/logger.js'

/**
 * 検証結果の種類
 */
export const ValidationSeverity = {
  ERROR: 'error',     // 致命的な問題
  WARNING: 'warning', // 警告
  INFO: 'info'        // 情報
}

/**
 * 検証結果のカテゴリ
 */
export const ValidationCategory = {
  BROKEN_REFERENCE: 'broken_reference',
  UNREACHABLE_NODE: 'unreachable_node',
  ORPHAN_NODE: 'orphan_node',
  CIRCULAR_REFERENCE: 'circular_reference',
  MISSING_START_NODE: 'missing_start_node',
  EMPTY_CHOICE: 'empty_choice',
  MISSING_CHOICE_TARGET: 'missing_choice_target'
}

/**
 * 検証結果アイテム
 */
export class ValidationIssue {
  constructor(category, severity, nodeId, message, details = {}) {
    this.category = category
    this.severity = severity
    this.nodeId = nodeId
    this.message = message
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * モデル検証クラス
 */
export class ModelValidator {
  constructor() {
    this.issues = []
  }

  /**
   * モデル全体を検証
   * @param {Object} model - ストーリーモデル
   * @returns {ValidationIssue[]} 検証結果の配列
   */
  validate(model) {
    this.issues = []

    if (!model || !model.nodes) {
      this.issues.push(new ValidationIssue(
        ValidationCategory.MISSING_START_NODE,
        ValidationSeverity.ERROR,
        null,
        'モデルが無効です：ノードが定義されていません'
      ))
      return this.issues
    }

    // 各検証を実行
    this._validateStartNode(model)
    this._validateBrokenReferences(model)
    this._validateUnreachableNodes(model)
    this._validateOrphanNodes(model)
    this._validateEmptyChoices(model)
    this._detectCircularReferences(model)

    // 結果をソート（エラー優先）
    this.issues.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })

    Logger.info('Model validation completed', {
      errors: this.issues.filter(i => i.severity === 'error').length,
      warnings: this.issues.filter(i => i.severity === 'warning').length,
      info: this.issues.filter(i => i.severity === 'info').length
    })

    return this.issues
  }

  /**
   * スタートノードの検証
   */
  _validateStartNode(model) {
    const startNode = model.startNode || 'start'
    if (!model.nodes[startNode]) {
      this.issues.push(new ValidationIssue(
        ValidationCategory.MISSING_START_NODE,
        ValidationSeverity.ERROR,
        startNode,
        `スタートノード「${startNode}」が見つかりません`,
        { expectedStartNode: startNode }
      ))
    }
  }

  /**
   * 参照切れの検証（存在しないノードへの遷移）
   */
  _validateBrokenReferences(model) {
    const nodeIds = new Set(Object.keys(model.nodes))

    for (const [nodeId, node] of Object.entries(model.nodes)) {
      if (!node.choices) continue

      for (let i = 0; i < node.choices.length; i++) {
        const choice = node.choices[i]
        if (choice.target && !nodeIds.has(choice.target)) {
          this.issues.push(new ValidationIssue(
            ValidationCategory.BROKEN_REFERENCE,
            ValidationSeverity.ERROR,
            nodeId,
            `ノード「${nodeId}」の選択肢${i + 1}が存在しないノード「${choice.target}」を参照しています`,
            { choiceIndex: i, targetNode: choice.target, choiceText: choice.text }
          ))
        }
      }
    }
  }

  /**
   * 到達不能ノードの検証
   */
  _validateUnreachableNodes(model) {
    const startNode = model.startNode || 'start'
    const reachable = this._findReachableNodes(model, startNode)
    const allNodes = Object.keys(model.nodes)

    for (const nodeId of allNodes) {
      if (!reachable.has(nodeId)) {
        this.issues.push(new ValidationIssue(
          ValidationCategory.UNREACHABLE_NODE,
          ValidationSeverity.WARNING,
          nodeId,
          `ノード「${nodeId}」はスタートノードから到達できません`,
          { startNode }
        ))
      }
    }
  }

  /**
   * 孤立ノードの検証（どこからも参照されていないノード）
   */
  _validateOrphanNodes(model) {
    const startNode = model.startNode || 'start'
    const referencedNodes = new Set([startNode])

    // 全ての参照先を収集
    for (const node of Object.values(model.nodes)) {
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.target) {
            referencedNodes.add(choice.target)
          }
        }
      }
    }

    // 参照されていないノードを検出
    for (const nodeId of Object.keys(model.nodes)) {
      if (!referencedNodes.has(nodeId)) {
        this.issues.push(new ValidationIssue(
          ValidationCategory.ORPHAN_NODE,
          ValidationSeverity.INFO,
          nodeId,
          `ノード「${nodeId}」はどこからも参照されていません（孤立ノード）`
        ))
      }
    }
  }

  /**
   * 空の選択肢の検証
   */
  _validateEmptyChoices(model) {
    for (const [nodeId, node] of Object.entries(model.nodes)) {
      if (!node.choices) continue

      for (let i = 0; i < node.choices.length; i++) {
        const choice = node.choices[i]
        
        // ターゲットが未設定
        if (!choice.target) {
          this.issues.push(new ValidationIssue(
            ValidationCategory.MISSING_CHOICE_TARGET,
            ValidationSeverity.WARNING,
            nodeId,
            `ノード「${nodeId}」の選択肢${i + 1}に遷移先が設定されていません`,
            { choiceIndex: i, choiceText: choice.text }
          ))
        }

        // テキストが空
        if (!choice.text || choice.text.trim() === '') {
          this.issues.push(new ValidationIssue(
            ValidationCategory.EMPTY_CHOICE,
            ValidationSeverity.WARNING,
            nodeId,
            `ノード「${nodeId}」の選択肢${i + 1}のテキストが空です`,
            { choiceIndex: i, target: choice.target }
          ))
        }
      }
    }
  }

  /**
   * 循環参照の検出
   */
  _detectCircularReferences(model) {
    const cycles = this._findCycles(model)
    
    for (const cycle of cycles) {
      this.issues.push(new ValidationIssue(
        ValidationCategory.CIRCULAR_REFERENCE,
        ValidationSeverity.INFO,
        cycle[0],
        `循環参照を検出: ${cycle.join(' → ')} → ${cycle[0]}`,
        { cycle }
      ))
    }
  }

  /**
   * 到達可能なノードを探索（BFS）
   */
  _findReachableNodes(model, startNodeId) {
    const reachable = new Set()
    const queue = [startNodeId]

    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (reachable.has(nodeId)) continue
      if (!model.nodes[nodeId]) continue

      reachable.add(nodeId)
      const node = model.nodes[nodeId]

      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.target && !reachable.has(choice.target)) {
            queue.push(choice.target)
          }
        }
      }
    }

    return reachable
  }

  /**
   * 循環参照を検出（DFS）
   */
  _findCycles(model) {
    const cycles = []
    const visited = new Set()
    const recursionStack = new Set()
    const path = []

    const dfs = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        // 循環を検出
        const cycleStart = path.indexOf(nodeId)
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart))
        }
        return
      }

      if (visited.has(nodeId)) return
      if (!model.nodes[nodeId]) return

      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const node = model.nodes[nodeId]
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.target) {
            dfs(choice.target)
          }
        }
      }

      path.pop()
      recursionStack.delete(nodeId)
    }

    for (const nodeId of Object.keys(model.nodes)) {
      if (!visited.has(nodeId)) {
        dfs(nodeId)
      }
    }

    return cycles
  }

  /**
   * 検証結果のサマリーを取得
   */
  getSummary() {
    return {
      total: this.issues.length,
      errors: this.issues.filter(i => i.severity === ValidationSeverity.ERROR).length,
      warnings: this.issues.filter(i => i.severity === ValidationSeverity.WARNING).length,
      info: this.issues.filter(i => i.severity === ValidationSeverity.INFO).length,
      categories: this._groupByCategory()
    }
  }

  /**
   * カテゴリ別にグループ化
   */
  _groupByCategory() {
    const grouped = {}
    for (const issue of this.issues) {
      if (!grouped[issue.category]) {
        grouped[issue.category] = []
      }
      grouped[issue.category].push(issue)
    }
    return grouped
  }

  /**
   * 特定のノードに関する問題を取得
   */
  getIssuesForNode(nodeId) {
    return this.issues.filter(i => i.nodeId === nodeId)
  }

  /**
   * エラーがあるかどうか
   */
  hasErrors() {
    return this.issues.some(i => i.severity === ValidationSeverity.ERROR)
  }

  /**
   * 警告以上の問題があるかどうか
   */
  hasWarningsOrErrors() {
    return this.issues.some(i => 
      i.severity === ValidationSeverity.ERROR || 
      i.severity === ValidationSeverity.WARNING
    )
  }
}

export default ModelValidator
