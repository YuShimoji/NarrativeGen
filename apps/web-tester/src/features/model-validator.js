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
  MISSING_CHOICE_TARGET: 'missing_choice_target',
  SELF_REFERENCE: 'self_reference',
  DEAD_END: 'dead_end',
  EMPTY_NODE_TEXT: 'empty_node_text',
  UNDEFINED_FLAG: 'undefined_flag'
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
    this._validateSelfReferences(model)
    this._validateDeadEnds(model)
    this._validateEmptyNodeText(model)
    this._validateFlags(model)

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
   * 自己参照の検出（ノードが自分自身に遷移）
   */
  _validateSelfReferences(model) {
    for (const [nodeId, node] of Object.entries(model.nodes)) {
      if (!node.choices) continue

      for (let i = 0; i < node.choices.length; i++) {
        const choice = node.choices[i]
        if (choice.target === nodeId) {
          this.issues.push(new ValidationIssue(
            ValidationCategory.SELF_REFERENCE,
            ValidationSeverity.WARNING,
            nodeId,
            `ノード「${nodeId}」の選択肢${i + 1}が自分自身を参照しています`,
            { choiceIndex: i, choiceText: choice.text }
          ))
        }
      }
    }
  }

  /**
   * デッドエンド検出（選択肢がなく、エンディングでもないノード）
   */
  _validateDeadEnds(model) {
    for (const [nodeId, node] of Object.entries(model.nodes)) {
      // 選択肢がない、または空の選択肢配列
      const hasNoChoices = !node.choices || node.choices.length === 0
      
      // 有効な遷移先を持つ選択肢がない
      const hasNoValidTargets = node.choices && 
        node.choices.length > 0 && 
        node.choices.every(c => !c.target)

      if (hasNoChoices || hasNoValidTargets) {
        // エンディングノードとしてマークされているかチェック
        const isEnding = node.isEnding || 
                        node.type === 'ending' ||
                        nodeId.toLowerCase().includes('end') ||
                        nodeId.toLowerCase().includes('ending')

        if (!isEnding) {
          this.issues.push(new ValidationIssue(
            ValidationCategory.DEAD_END,
            ValidationSeverity.WARNING,
            nodeId,
            `ノード「${nodeId}」は遷移先がありません（デッドエンドの可能性）`,
            { hasChoices: !!node.choices, choiceCount: node.choices?.length || 0 }
          ))
        }
      }
    }
  }

  /**
   * 空のノードテキスト検出
   */
  _validateEmptyNodeText(model) {
    for (const [nodeId, node] of Object.entries(model.nodes)) {
      if (!node.text || node.text.trim() === '') {
        this.issues.push(new ValidationIssue(
          ValidationCategory.EMPTY_NODE_TEXT,
          ValidationSeverity.INFO,
          nodeId,
          `ノード「${nodeId}」のテキストが空です`
        ))
      }
    }
  }

  /**
   * フラグの整合性チェック（条件で使用されるフラグが効果で設定されているか）
   */
  _validateFlags(model) {
    const setFlags = new Set()    // 効果で設定されるフラグ
    const usedFlags = new Map()   // 条件で使用されるフラグ → ノードID

    // 全ノードをスキャンしてフラグを収集
    for (const [nodeId, node] of Object.entries(model.nodes)) {
      if (!node.choices) continue

      for (const choice of node.choices) {
        // 効果からフラグを収集
        if (choice.effects) {
          for (const effect of choice.effects) {
            if (!effect || typeof effect !== 'object') continue
            if (effect.type !== 'setFlag') continue
            const flagKey = effect.key ?? effect.flag
            if (!flagKey) continue
            setFlags.add(flagKey)
          }
        }

        // 条件からフラグを収集
        if (choice.conditions) {
          for (const condition of choice.conditions) {
            if (!condition || typeof condition !== 'object') continue
            if (condition.type !== 'flag') continue
            const flagKey = condition.key ?? condition.flag
            if (!flagKey) continue

            if (!usedFlags.has(flagKey)) {
              usedFlags.set(flagKey, [])
            }
            usedFlags.get(flagKey).push({ nodeId, choiceText: choice.text })
          }
        }
      }
    }

    // 使用されているが設定されていないフラグを検出
    for (const [flag, usages] of usedFlags) {
      if (!setFlags.has(flag)) {
        for (const usage of usages) {
          this.issues.push(new ValidationIssue(
            ValidationCategory.UNDEFINED_FLAG,
            ValidationSeverity.WARNING,
            usage.nodeId,
            `フラグ「${flag}」が条件で使用されていますが、どこにも設定されていません`,
            { flag, choiceText: usage.choiceText }
          ))
        }
      }
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
