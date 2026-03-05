/**
 * StatsPanel - 統計情報パネル
 * 
 * マルチエンディング統計情報の表示:
 * - 各エンディングへの到達率（理論値）
 * - 条件の使用頻度分析
 * - ストーリーの分岐度・複雑度指標
 * - ノードタイプの分布グラフ
 * - 選択肢の分岐率統計
 */

export class StatsPanel {
  constructor(appState) {
    this.appState = appState
    this.container = null
    this.analysisResult = null
  }

  /**
   * パネルを初期化
   */
  initialize(containerElement) {
    this.container = containerElement
  }

  /**
   * 分析結果を設定して表示を更新
   */
  setAnalysisResult(result) {
    this.analysisResult = result
    this.render()
  }

  /**
   * 統計パネルをレンダリング
   */
  render() {
    if (!this.container) return

    if (!this.analysisResult) {
      this.container.innerHTML = `
        <div class="stats-panel-empty">
          <p>分析結果がありません</p>
          <p>「分析を実行」ボタンをクリックしてください</p>
        </div>
      `
      return
    }

    const stats = this._calculateStatistics()
    
    this.container.innerHTML = `
      <div class="stats-panel">
        <div class="stats-header">
          <h4>統計情報</h4>
          <span class="stats-analysis-time">分析時間: ${this.analysisResult.analysisTime?.toFixed(0) || 0}ms</span>
        </div>
        
        <div class="stats-summary">
          ${this._renderSummaryCards(stats)}
        </div>
        
        <div class="stats-sections">
          ${this._renderReachRates(stats)}
          ${this._renderConditionUsage(stats)}
          ${this._renderComplexityMetrics(stats)}
          ${this._renderNodeTypeDistribution(stats)}
          ${this._renderBranchingStats(stats)}
        </div>
      </div>
    `

    this._attachEventHandlers()
  }

  /**
   * 統計情報を計算
   */
  _calculateStatistics() {
    if (!this.analysisResult || !this.appState.model) {
      return null
    }

    const model = this.appState.model
    const endings = this.analysisResult.endings || []

    // ノードタイプ分布
    const nodeTypeDistribution = this._calculateNodeTypeDistribution()

    // 分岐統計
    const branchingStats = this._calculateBranchingStats()

    // 到達率
    const reachRates = this._calculateReachRates(endings)

    // 条件使用頻度
    const conditionUsage = this._calculateConditionUsage(endings)

    // 複雑度指標
    const complexityMetrics = {
      totalNodes: Object.keys(model.nodes).length,
      totalEndings: endings.length,
      reachableEndings: endings.filter(e => e.isReachable).length,
      totalPaths: this.analysisResult.totalPaths || 0,
      avgComplexity: this.analysisResult.avgComplexity || 0,
      maxComplexity: this.analysisResult.maxComplexity || 0,
      avgPathDepth: this._calculateAvgPathDepth(endings),
      maxPathDepth: this._calculateMaxPathDepth(endings)
    }

    return {
      nodeTypeDistribution,
      branchingStats,
      reachRates,
      conditionUsage,
      complexityMetrics
    }
  }

  /**
   * ノードタイプ分布を計算
   */
  _calculateNodeTypeDistribution() {
    if (!this.appState.model) return {}

    const distribution = {
      passage: 0,
      choice: 0,
      ending: 0,
      start: 0
    }

    const startNode = this.appState.model.startNode || this.appState.model.meta?.startNodeId || 'start'

    for (const [nodeId, node] of Object.entries(this.appState.model.nodes)) {
      if (nodeId === startNode) {
        distribution.start++
      } else if (!node.choices || node.choices.length === 0) {
        distribution.ending++
      } else if (node.choices.length > 1) {
        distribution.choice++
      } else {
        distribution.passage++
      }
    }

    return distribution
  }

  /**
   * 分岐統計を計算
   */
  _calculateBranchingStats() {
    if (!this.appState.model) return {}

    let totalChoices = 0
    let nodesWithChoices = 0
    let maxChoices = 0
    const choiceCounts = []

    for (const node of Object.values(this.appState.model.nodes)) {
      const choiceCount = node.choices?.length || 0
      if (choiceCount > 0) {
        totalChoices += choiceCount
        nodesWithChoices++
        maxChoices = Math.max(maxChoices, choiceCount)
        choiceCounts.push(choiceCount)
      }
    }

    const avgChoices = nodesWithChoices > 0 ? totalChoices / nodesWithChoices : 0

    // 分岐率の分布
    const branchingDistribution = {}
    for (const count of choiceCounts) {
      branchingDistribution[count] = (branchingDistribution[count] || 0) + 1
    }

    return {
      totalChoices,
      nodesWithChoices,
      avgChoices: Math.round(avgChoices * 100) / 100,
      maxChoices,
      branchingDistribution
    }
  }

  /**
   * 到達率を計算（理論値）
   */
  _calculateReachRates(endings) {
    if (endings.length === 0) return []

    const totalPaths = endings.reduce((sum, e) => sum + e.pathCount, 0)

    return endings.map(ending => ({
      endingId: ending.endingId,
      endingText: ending.endingText?.substring(0, 30) || '',
      pathCount: ending.pathCount,
      reachRate: totalPaths > 0 ? Math.round((ending.pathCount / totalPaths) * 100 * 10) / 10 : 0,
      isReachable: ending.isReachable,
      complexity: ending.complexity
    })).sort((a, b) => b.reachRate - a.reachRate)
  }

  /**
   * 条件使用頻度を計算
   */
  _calculateConditionUsage(endings) {
    const conditionMap = new Map()

    for (const ending of endings) {
      for (const condEntry of ending.allConditions || []) {
        const cond = condEntry.condition
        const key = this._getConditionDisplayKey(cond)
        
        if (!conditionMap.has(key)) {
          conditionMap.set(key, {
            key,
            type: cond.type || 'unknown',
            name: cond.key || cond.flag || cond.name || '',
            count: 0,
            endingCount: 0
          })
        }

        const entry = conditionMap.get(key)
        entry.count += condEntry.usageCount
        entry.endingCount++
      }
    }

    return Array.from(conditionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10
  }

  /**
   * 条件の表示キーを取得
   */
  _getConditionDisplayKey(condition) {
    if (!condition) return 'unknown'
    const type = condition.type || 'unknown'
    const name = condition.key || condition.flag || condition.name || ''
    return `${type}:${name}`
  }

  /**
   * 平均パス深度を計算
   */
  _calculateAvgPathDepth(endings) {
    if (endings.length === 0) return 0

    let totalDepth = 0
    let pathCount = 0

    for (const ending of endings) {
      for (const path of ending.paths || []) {
        totalDepth += path.depth
        pathCount++
      }
    }

    return pathCount > 0 ? Math.round(totalDepth / pathCount * 10) / 10 : 0
  }

  /**
   * 最大パス深度を計算
   */
  _calculateMaxPathDepth(endings) {
    let maxDepth = 0

    for (const ending of endings) {
      for (const path of ending.paths || []) {
        maxDepth = Math.max(maxDepth, path.depth)
      }
    }

    return maxDepth
  }

  /**
   * サマリーカードをレンダリング
   */
  _renderSummaryCards(stats) {
    if (!stats) return ''

    const { complexityMetrics } = stats

    return `
      <div class="stats-cards">
        <div class="stats-card">
          <div class="stats-card-value">${complexityMetrics.totalNodes}</div>
          <div class="stats-card-label">総ノード数</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${complexityMetrics.totalEndings}</div>
          <div class="stats-card-label">エンディング数</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${complexityMetrics.reachableEndings}</div>
          <div class="stats-card-label">到達可能</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${complexityMetrics.totalPaths}</div>
          <div class="stats-card-label">総パス数</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">${complexityMetrics.avgComplexity}</div>
          <div class="stats-card-label">平均複雑度</div>
        </div>
      </div>
    `
  }

  /**
   * 到達率セクションをレンダリング
   */
  _renderReachRates(stats) {
    if (!stats || !stats.reachRates) return ''

    const rates = stats.reachRates

    return `
      <div class="stats-section">
        <h5 class="stats-section-title">エンディング到達率（理論値）</h5>
        <div class="stats-reach-rates">
          ${rates.map(r => `
            <div class="stats-reach-item ${r.isReachable ? '' : 'unreachable'}">
              <div class="stats-reach-bar-container">
                <div class="stats-reach-bar" style="width: ${r.reachRate}%"></div>
              </div>
              <div class="stats-reach-info">
                <span class="stats-reach-id" data-ending="${r.endingId}">${this._escapeHtml(r.endingId)}</span>
                <span class="stats-reach-rate">${r.reachRate}%</span>
                <span class="stats-reach-paths">(${r.pathCount}パス)</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  /**
   * 条件使用頻度セクションをレンダリング
   */
  _renderConditionUsage(stats) {
    if (!stats || !stats.conditionUsage || stats.conditionUsage.length === 0) return ''

    const usage = stats.conditionUsage
    const maxCount = Math.max(...usage.map(u => u.count))

    return `
      <div class="stats-section">
        <h5 class="stats-section-title">条件使用頻度 (Top 10)</h5>
        <div class="stats-condition-usage">
          ${usage.map(u => `
            <div class="stats-condition-item">
              <div class="stats-condition-bar-container">
                <div class="stats-condition-bar" style="width: ${(u.count / maxCount) * 100}%"></div>
              </div>
              <div class="stats-condition-info">
                <span class="stats-condition-type ${u.type}">${u.type}</span>
                <span class="stats-condition-name">${this._escapeHtml(u.name)}</span>
                <span class="stats-condition-count">${u.count}回</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  /**
   * 複雑度メトリクスをレンダリング
   */
  _renderComplexityMetrics(stats) {
    if (!stats) return ''

    const { complexityMetrics } = stats

    return `
      <div class="stats-section">
        <h5 class="stats-section-title">複雑度指標</h5>
        <div class="stats-metrics-grid">
          <div class="stats-metric">
            <span class="stats-metric-label">平均パス深度</span>
            <span class="stats-metric-value">${complexityMetrics.avgPathDepth}</span>
          </div>
          <div class="stats-metric">
            <span class="stats-metric-label">最大パス深度</span>
            <span class="stats-metric-value">${complexityMetrics.maxPathDepth}</span>
          </div>
          <div class="stats-metric">
            <span class="stats-metric-label">最大複雑度</span>
            <span class="stats-metric-value">${complexityMetrics.maxComplexity}</span>
          </div>
        </div>
      </div>
    `
  }

  /**
   * ノードタイプ分布をレンダリング
   */
  _renderNodeTypeDistribution(stats) {
    if (!stats || !stats.nodeTypeDistribution) return ''

    const dist = stats.nodeTypeDistribution
    const total = Object.values(dist).reduce((sum, v) => sum + v, 0)

    const typeLabels = {
      start: 'スタート',
      passage: '通過',
      choice: '分岐',
      ending: 'エンディング'
    }

    const typeColors = {
      start: '#4CAF50',
      passage: '#2196F3',
      choice: '#FF9800',
      ending: '#9C27B0'
    }

    return `
      <div class="stats-section">
        <h5 class="stats-section-title">ノードタイプ分布</h5>
        <div class="stats-node-distribution">
          <div class="stats-distribution-bar">
            ${Object.entries(dist).map(([type, count]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0
              return `<div class="stats-dist-segment" style="width: ${percentage}%; background: ${typeColors[type]}" title="${typeLabels[type]}: ${count}"></div>`
            }).join('')}
          </div>
          <div class="stats-distribution-legend">
            ${Object.entries(dist).map(([type, count]) => `
              <div class="stats-legend-item">
                <span class="stats-legend-color" style="background: ${typeColors[type]}"></span>
                <span class="stats-legend-label">${typeLabels[type]}: ${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }

  /**
   * 分岐統計をレンダリング
   */
  _renderBranchingStats(stats) {
    if (!stats || !stats.branchingStats) return ''

    const { branchingStats } = stats

    return `
      <div class="stats-section">
        <h5 class="stats-section-title">分岐統計</h5>
        <div class="stats-branching">
          <div class="stats-branching-summary">
            <div class="stats-branching-item">
              <span class="stats-branching-label">総選択肢数</span>
              <span class="stats-branching-value">${branchingStats.totalChoices}</span>
            </div>
            <div class="stats-branching-item">
              <span class="stats-branching-label">分岐ノード数</span>
              <span class="stats-branching-value">${branchingStats.nodesWithChoices}</span>
            </div>
            <div class="stats-branching-item">
              <span class="stats-branching-label">平均分岐数</span>
              <span class="stats-branching-value">${branchingStats.avgChoices}</span>
            </div>
            <div class="stats-branching-item">
              <span class="stats-branching-label">最大分岐数</span>
              <span class="stats-branching-value">${branchingStats.maxChoices}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * イベントハンドラを設定
   */
  _attachEventHandlers() {
    if (!this.container) return

    // エンディングIDクリックでフォーカス
    this.container.querySelectorAll('.stats-reach-id').forEach(el => {
      el.addEventListener('click', () => {
        const endingId = el.dataset.ending
        if (endingId && this.onEndingClick) {
          this.onEndingClick(endingId)
        }
      })
    })
  }

  /**
   * エンディングクリック時のコールバックを設定
   */
  setOnEndingClick(callback) {
    this.onEndingClick = callback
  }

  /**
   * HTMLエスケープ
   */
  _escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 統計データをJSON形式で取得
   */
  getStatsAsJson() {
    if (!this.analysisResult) return null

    const stats = this._calculateStatistics()
    return {
      analysisTime: this.analysisResult.analysisTime,
      summary: this.analysisResult,
      statistics: stats
    }
  }
}
