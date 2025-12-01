/**
 * ValidationPanel - モデル検証結果表示パネル
 * 
 * ModelValidatorの結果をUIに表示し、問題箇所へのナビゲーションを提供します。
 */

import { ModelValidator, ValidationSeverity, ValidationCategory } from '../features/model-validator.js'
import Logger from '../core/logger.js'

/**
 * 検証結果パネルクラス
 */
export class ValidationPanel {
  constructor(appState) {
    this.appState = appState
    this.validator = new ModelValidator()
    this.container = null
    this.onNodeClick = null // ノードクリック時のコールバック
  }

  /**
   * パネルを初期化
   * @param {HTMLElement} container - 表示先コンテナ
   * @param {Function} onNodeClick - ノードクリック時のコールバック
   */
  initialize(container, onNodeClick = null) {
    this.container = container
    this.onNodeClick = onNodeClick
    Logger.info('Validation panel initialized')
  }

  /**
   * モデルを検証して結果を表示
   * @returns {Object} 検証サマリー
   */
  validateAndRender() {
    if (!this.appState.model) {
      this._renderNoModel()
      return null
    }

    const issues = this.validator.validate(this.appState.model)
    const summary = this.validator.getSummary()
    
    this._renderResults(issues, summary)
    
    return summary
  }

  /**
   * モデルがない場合の表示
   */
  _renderNoModel() {
    if (!this.container) return
    
    this.container.innerHTML = `
      <div class="validation-panel">
        <div class="validation-empty">
          <span class="validation-icon">📋</span>
          <p>モデルを読み込んでから検証を実行してください</p>
        </div>
      </div>
    `
  }

  /**
   * 検証結果を描画
   */
  _renderResults(issues, summary) {
    if (!this.container) return

    const statusClass = summary.errors > 0 ? 'status-error' : 
                       summary.warnings > 0 ? 'status-warning' : 'status-ok'
    
    const statusIcon = summary.errors > 0 ? '❌' : 
                      summary.warnings > 0 ? '⚠️' : '✅'

    this.container.innerHTML = `
      <div class="validation-panel">
        <div class="validation-header ${statusClass}">
          <span class="validation-status-icon">${statusIcon}</span>
          <span class="validation-title">モデル検証結果</span>
          <button class="btn-refresh" title="再検証">🔄</button>
        </div>
        
        <div class="validation-summary">
          <div class="summary-item ${summary.errors > 0 ? 'has-issues' : ''}">
            <span class="count">${summary.errors}</span>
            <span class="label">エラー</span>
          </div>
          <div class="summary-item ${summary.warnings > 0 ? 'has-issues' : ''}">
            <span class="count">${summary.warnings}</span>
            <span class="label">警告</span>
          </div>
          <div class="summary-item">
            <span class="count">${summary.info}</span>
            <span class="label">情報</span>
          </div>
        </div>

        <div class="validation-issues">
          ${this._renderIssueList(issues)}
        </div>
      </div>
    `

    // イベントリスナーを設定
    this._setupEventListeners()
  }

  /**
   * 問題リストを描画
   */
  _renderIssueList(issues) {
    if (issues.length === 0) {
      return `
        <div class="validation-empty">
          <span class="validation-icon">🎉</span>
          <p>問題は検出されませんでした</p>
        </div>
      `
    }

    return issues.map((issue, index) => this._renderIssueItem(issue, index)).join('')
  }

  /**
   * 個別の問題項目を描画
   */
  _renderIssueItem(issue, index) {
    const severityIcon = this._getSeverityIcon(issue.severity)
    const categoryLabel = this._getCategoryLabel(issue.category)
    
    return `
      <div class="validation-issue ${issue.severity}" data-index="${index}" data-node-id="${issue.nodeId || ''}">
        <div class="issue-header">
          <span class="issue-icon">${severityIcon}</span>
          <span class="issue-category">${categoryLabel}</span>
          ${issue.nodeId ? `<span class="issue-node" data-node="${issue.nodeId}">${issue.nodeId}</span>` : ''}
        </div>
        <div class="issue-message">${issue.message}</div>
        ${this._renderIssueDetails(issue.details)}
      </div>
    `
  }

  /**
   * 問題の詳細情報を描画
   */
  _renderIssueDetails(details) {
    if (!details || Object.keys(details).length === 0) return ''

    const items = []
    if (details.targetNode) items.push(`遷移先: ${details.targetNode}`)
    if (details.choiceText) items.push(`選択肢: "${details.choiceText}"`)
    if (details.choiceIndex !== undefined) items.push(`選択肢番号: ${details.choiceIndex + 1}`)
    if (details.cycle) items.push(`循環: ${details.cycle.join(' → ')}`)

    if (items.length === 0) return ''

    return `<div class="issue-details">${items.join(' | ')}</div>`
  }

  /**
   * 重要度に応じたアイコンを取得
   */
  _getSeverityIcon(severity) {
    switch (severity) {
      case ValidationSeverity.ERROR: return '❌'
      case ValidationSeverity.WARNING: return '⚠️'
      case ValidationSeverity.INFO: return 'ℹ️'
      default: return '📌'
    }
  }

  /**
   * カテゴリのラベルを取得
   */
  _getCategoryLabel(category) {
    const labels = {
      [ValidationCategory.BROKEN_REFERENCE]: '参照切れ',
      [ValidationCategory.UNREACHABLE_NODE]: '到達不能',
      [ValidationCategory.ORPHAN_NODE]: '孤立ノード',
      [ValidationCategory.CIRCULAR_REFERENCE]: '循環参照',
      [ValidationCategory.MISSING_START_NODE]: 'スタートノード欠損',
      [ValidationCategory.EMPTY_CHOICE]: '空の選択肢',
      [ValidationCategory.MISSING_CHOICE_TARGET]: '遷移先未設定'
    }
    return labels[category] || category
  }

  /**
   * イベントリスナーを設定
   */
  _setupEventListeners() {
    if (!this.container) return

    // 再検証ボタン
    const refreshBtn = this.container.querySelector('.btn-refresh')
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.validateAndRender())
    }

    // ノードクリック
    const nodeElements = this.container.querySelectorAll('.issue-node')
    nodeElements.forEach(el => {
      el.addEventListener('click', (e) => {
        const nodeId = e.target.dataset.node
        if (nodeId && this.onNodeClick) {
          this.onNodeClick(nodeId)
        }
      })
    })

    // 問題項目クリック（詳細表示やハイライト用）
    const issueElements = this.container.querySelectorAll('.validation-issue')
    issueElements.forEach(el => {
      el.addEventListener('click', () => {
        // 選択状態をトグル
        el.classList.toggle('expanded')
      })
    })
  }

  /**
   * 特定のノードの問題を取得
   */
  getIssuesForNode(nodeId) {
    return this.validator.getIssuesForNode(nodeId)
  }

  /**
   * 検証サマリーを取得
   */
  getSummary() {
    return this.validator.getSummary()
  }

  /**
   * エラーがあるかどうか
   */
  hasErrors() {
    return this.validator.hasErrors()
  }

  /**
   * ノードにバッジを表示するためのマークアップを生成
   */
  getNodeBadge(nodeId) {
    const issues = this.getIssuesForNode(nodeId)
    if (issues.length === 0) return ''

    const hasError = issues.some(i => i.severity === ValidationSeverity.ERROR)
    const hasWarning = issues.some(i => i.severity === ValidationSeverity.WARNING)
    
    const badgeClass = hasError ? 'badge-error' : hasWarning ? 'badge-warning' : 'badge-info'
    const icon = hasError ? '❌' : hasWarning ? '⚠️' : 'ℹ️'
    
    return `<span class="node-validation-badge ${badgeClass}" title="${issues.length}件の問題">${icon}</span>`
  }
}

export default ValidationPanel
