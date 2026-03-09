/**
 * EndingAnalyzer - エンディング分析エンジン
 * 
 * マルチエンディングの詳細分析を行うモジュール:
 * - 到達条件の複雑度評価
 * - 条件の依存関係グラフ生成
 * - 到達不能エンディングの検出
 * - 条件の重複・冗長性チェック
 * - 条件カバレッジ分析
 */

/**
 * 分析結果のデータ構造
 * @typedef {Object} EndingAnalysisResult
 * @property {string} endingId - エンディングノードID
 * @property {number} pathCount - パス数
 * @property {number} complexity - 複雑度スコア
 * @property {Array<PathAnalysis>} paths - パス分析結果
 * @property {Object} conditionDependencies - 条件依存関係
 * @property {boolean} isReachable - 到達可能かどうか
 * @property {Array<string>} unreachableReasons - 到達不能の理由
 */

/**
 * パス分析結果
 * @typedef {Object} PathAnalysis
 * @property {Array<string>} nodes - パス上のノードID
 * @property {Array<Object>} conditions - 到達に必要な条件
 * @property {number} conditionCount - 条件数
 * @property {number} depth - パスの深さ
 */

export class EndingAnalyzer {
  constructor(appState) {
    this.appState = appState
    this.analysisCache = new Map()
    this.maxDepth = 50
    this.maxPaths = 100
  }

  /**
   * 全エンディングの分析を実行
   * @returns {Object} 分析結果サマリー
   */
  analyzeAll() {
    if (!this.appState.model) return null

    const startTime = performance.now()
    const endingNodes = this._findAllEndingNodes()
    const results = []

    for (const endingId of endingNodes) {
      const analysis = this.analyzeEnding(endingId)
      if (analysis) {
        results.push(analysis)
      }
    }

    const summary = this._generateSummary(results)
    summary.analysisTime = performance.now() - startTime

    return summary
  }

  /**
   * 単一エンディングの詳細分析
   * @param {string} endingId - エンディングノードID
   * @returns {EndingAnalysisResult}
   */
  analyzeEnding(endingId) {
    if (!this.appState.model) return null

    // キャッシュチェック
    const cacheKey = `${endingId}_${JSON.stringify(this.appState.model.nodes).length}`
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)
    }

    const endingNode = this.appState.model.nodes[endingId]
    if (!endingNode) return null

    const paths = this._findAllPathsToEnding(endingId)
    const pathAnalyses = paths.map(path => this._analyzePath(path))
    const allConditions = this._collectAllConditions(pathAnalyses)
    const conditionDependencies = this._buildConditionDependencyGraph(allConditions)
    const complexity = this._calculateComplexity(pathAnalyses, conditionDependencies)
    const reachabilityCheck = this._checkReachability(endingId, paths, allConditions)

    const result = {
      endingId,
      endingText: endingNode.text || '',
      pathCount: paths.length,
      complexity,
      paths: pathAnalyses,
      allConditions,
      conditionDependencies,
      isReachable: reachabilityCheck.isReachable,
      unreachableReasons: reachabilityCheck.reasons,
      redundantConditions: this._findRedundantConditions(allConditions),
      conditionCoverage: this._calculateConditionCoverage(allConditions)
    }

    this.analysisCache.set(cacheKey, result)
    return result
  }

  /**
   * 全エンディングノードを検出
   */
  _findAllEndingNodes() {
    if (!this.appState.model) return []

    const endingNodes = []
    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
      if (this._isEndingNode(nodeId, node)) {
        endingNodes.push(nodeId)
      }
    }
    return endingNodes
  }

  /**
   * エンディングノード判定
   */
  _isEndingNode(nodeId, node) {
    if (!node) return false

    const hasNoChoices = !node.choices || node.choices.length === 0
    const hasNoValidTargets = node.choices &&
      node.choices.length > 0 &&
      node.choices.every(c => !c.target)

    if (hasNoChoices || hasNoValidTargets) {
      return node.isEnding ||
        node.type === 'ending' ||
        nodeId.toLowerCase().includes('end') ||
        nodeId.toLowerCase().includes('ending')
    }

    return false
  }

  /**
   * エンディングへの全パスを探索
   */
  _findAllPathsToEnding(endingNodeId) {
    if (!this.appState.model) return []

    const startNodeId = this.appState.model.startNode || this.appState.model.meta?.startNodeId || 'start'
    const paths = []

    const dfs = (currentPath) => {
      if (paths.length >= this.maxPaths) return
      if (currentPath.length > this.maxDepth) return

      const currentNodeId = currentPath[currentPath.length - 1]

      if (currentNodeId === endingNodeId) {
        paths.push([...currentPath])
        return
      }

      const currentNode = this.appState.model.nodes[currentNodeId]
      if (!currentNode || !currentNode.choices) return

      for (const choice of currentNode.choices) {
        if (!choice.target) continue
        if (currentPath.includes(choice.target)) continue

        currentPath.push(choice.target)
        dfs(currentPath)
        currentPath.pop()
      }
    }

    if (this.appState.model.nodes[startNodeId]) {
      dfs([startNodeId])
    }

    return paths
  }

  /**
   * パスを分析
   */
  _analyzePath(path) {
    const conditions = []
    let conditionCount = 0

    for (let i = 0; i < path.length - 1; i++) {
      const currentNodeId = path[i]
      const nextNodeId = path[i + 1]
      const currentNode = this.appState.model.nodes[currentNodeId]

      if (!currentNode || !currentNode.choices) continue

      for (const choice of currentNode.choices) {
        if (choice.target === nextNodeId) {
          if (choice.conditions && choice.conditions.length > 0) {
            conditions.push({
              fromNode: currentNodeId,
              toNode: nextNodeId,
              choiceText: choice.text || '',
              conditions: choice.conditions
            })
            conditionCount += choice.conditions.length
          }
          break
        }
      }
    }

    return {
      nodes: path,
      conditions,
      conditionCount,
      depth: path.length
    }
  }

  /**
   * 全条件を収集
   */
  _collectAllConditions(pathAnalyses) {
    const conditionMap = new Map()

    for (const pathAnalysis of pathAnalyses) {
      for (const condGroup of pathAnalysis.conditions) {
        for (const cond of condGroup.conditions) {
          const key = this._getConditionKey(cond)
          if (!conditionMap.has(key)) {
            conditionMap.set(key, {
              condition: cond,
              usageCount: 0,
              paths: []
            })
          }
          const entry = conditionMap.get(key)
          entry.usageCount++
          entry.paths.push(pathAnalysis.nodes)
        }
      }
    }

    return Array.from(conditionMap.values())
  }

  /**
   * 条件のユニークキーを生成
   */
  _getConditionKey(condition) {
    if (typeof condition === 'string') return condition
    if (typeof condition === 'object') {
      return JSON.stringify(condition)
    }
    return String(condition)
  }

  /**
   * 条件依存関係グラフを構築
   */
  _buildConditionDependencyGraph(allConditions) {
    const graph = {
      nodes: [],
      edges: []
    }

    // 条件をノードとして追加
    for (const condEntry of allConditions) {
      const cond = condEntry.condition
      graph.nodes.push({
        id: this._getConditionKey(cond),
        type: cond.type || 'unknown',
        name: cond.key || cond.flag || cond.name || '',
        usageCount: condEntry.usageCount
      })
    }

    // 同じパスに存在する条件間にエッジを追加（依存関係）
    for (const condEntry of allConditions) {
      for (const path of condEntry.paths) {
        // このパス上の他の条件を探す
        for (const otherEntry of allConditions) {
          if (condEntry === otherEntry) continue
          for (const otherPath of otherEntry.paths) {
            if (this._pathsOverlap(path, otherPath)) {
              const edgeId = `${this._getConditionKey(condEntry.condition)}->${this._getConditionKey(otherEntry.condition)}`
              if (!graph.edges.find(e => e.id === edgeId)) {
                graph.edges.push({
                  id: edgeId,
                  source: this._getConditionKey(condEntry.condition),
                  target: this._getConditionKey(otherEntry.condition)
                })
              }
            }
          }
        }
      }
    }

    return graph
  }

  /**
   * パスが重複するかチェック
   */
  _pathsOverlap(path1, path2) {
    return path1.some(node => path2.includes(node))
  }

  /**
   * 複雑度を計算
   */
  _calculateComplexity(pathAnalyses, conditionDependencies) {
    if (pathAnalyses.length === 0) return 0

    // 複雑度 = パス数 * 平均条件数 * 依存関係エッジ数の対数
    const avgConditions = pathAnalyses.reduce((sum, p) => sum + p.conditionCount, 0) / pathAnalyses.length
    const edgeCount = conditionDependencies.edges.length || 1
    const pathFactor = Math.log2(pathAnalyses.length + 1)
    const depthFactor = Math.max(...pathAnalyses.map(p => p.depth)) / 10

    return Math.round((pathFactor * avgConditions * Math.log2(edgeCount + 1) + depthFactor) * 10) / 10
  }

  /**
   * 到達可能性をチェック
   */
  _checkReachability(endingId, paths, allConditions) {
    const result = {
      isReachable: true,
      reasons: []
    }

    // パスがない場合
    if (paths.length === 0) {
      result.isReachable = false
      result.reasons.push('スタートノードからのパスが存在しません')
      return result
    }

    // 相互排他的な条件のチェック
    const mutuallyExclusiveConditions = this._findMutuallyExclusiveConditions(allConditions)
    if (mutuallyExclusiveConditions.length > 0) {
      result.reasons.push(`相互排他的な条件の可能性: ${mutuallyExclusiveConditions.map(c => this._formatConditionBrief(c)).join(', ')}`)
    }

    return result
  }

  /**
   * 相互排他的な条件を検出
   */
  _findMutuallyExclusiveConditions(allConditions) {
    const exclusive = []

    for (let i = 0; i < allConditions.length; i++) {
      for (let j = i + 1; j < allConditions.length; j++) {
        const cond1 = allConditions[i].condition
        const cond2 = allConditions[j].condition

        // 同じキーで異なる値を要求する条件
        if (cond1.type === cond2.type && cond1.type === 'flag') {
          const key1 = cond1.key || cond1.flag
          const key2 = cond2.key || cond2.flag
          if (key1 === key2 && cond1.value !== cond2.value) {
            exclusive.push({ cond1, cond2 })
          }
        }
      }
    }

    return exclusive
  }

  /**
   * 冗長な条件を検出
   */
  _findRedundantConditions(allConditions) {
    const redundant = []

    // 同じ条件が複数回出現
    for (const condEntry of allConditions) {
      if (condEntry.usageCount > 3) {
        redundant.push({
          condition: condEntry.condition,
          count: condEntry.usageCount,
          reason: '同一条件が多数のパスで使用されています'
        })
      }
    }

    return redundant
  }

  /**
   * 条件カバレッジを計算
   */
  _calculateConditionCoverage(allConditions) {
    if (!this.appState.model) return { covered: 0, total: 0, percentage: 0 }

    // モデル内の全フラグを収集
    const allFlags = new Set()
    const usedFlags = new Set()

    for (const node of Object.values(this.appState.model.nodes)) {
      if (!node.choices) continue
      for (const choice of node.choices) {
        // 効果からフラグを収集
        if (choice.effects) {
          for (const effect of choice.effects) {
            if (effect.type === 'setFlag') {
              allFlags.add(effect.key || effect.flag)
            }
          }
        }
        // 条件からフラグを収集
        if (choice.conditions) {
          for (const cond of choice.conditions) {
            if (cond.type === 'flag') {
              allFlags.add(cond.key || cond.flag)
            }
          }
        }
      }
    }

    // このエンディングで使用されているフラグ
    for (const condEntry of allConditions) {
      const cond = condEntry.condition
      if (cond.type === 'flag') {
        usedFlags.add(cond.key || cond.flag)
      }
    }

    const total = allFlags.size
    const covered = usedFlags.size

    return {
      covered,
      total,
      percentage: total > 0 ? Math.round((covered / total) * 100) : 0,
      usedFlags: Array.from(usedFlags),
      allFlags: Array.from(allFlags)
    }
  }

  /**
   * 条件を簡潔にフォーマット
   */
  _formatConditionBrief(condition) {
    if (!condition) return ''
    const cond = condition.cond1 || condition

    if (cond.type === 'flag') {
      return `flag:${cond.key || cond.flag}`
    }
    if (cond.type === 'resource') {
      return `res:${cond.key}`
    }
    return JSON.stringify(cond).substring(0, 30)
  }

  /**
   * 分析サマリーを生成
   */
  _generateSummary(results) {
    const totalEndings = results.length
    const reachableEndings = results.filter(r => r.isReachable).length
    const unreachableEndings = totalEndings - reachableEndings
    const totalPaths = results.reduce((sum, r) => sum + r.pathCount, 0)
    const avgComplexity = totalEndings > 0
      ? Math.round(results.reduce((sum, r) => sum + r.complexity, 0) / totalEndings * 10) / 10
      : 0
    const maxComplexity = totalEndings > 0
      ? Math.max(...results.map(r => r.complexity))
      : 0

    // 全条件を集計
    const allConditionsFlat = []
    for (const result of results) {
      allConditionsFlat.push(...result.allConditions)
    }

    // 条件タイプの分布
    const conditionTypeDistribution = {}
    for (const condEntry of allConditionsFlat) {
      const type = condEntry.condition.type || 'unknown'
      conditionTypeDistribution[type] = (conditionTypeDistribution[type] || 0) + 1
    }

    return {
      totalEndings,
      reachableEndings,
      unreachableEndings,
      totalPaths,
      avgComplexity,
      maxComplexity,
      conditionTypeDistribution,
      endings: results
    }
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.analysisCache.clear()
  }
}
