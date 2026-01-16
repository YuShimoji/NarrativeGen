/**
 * Batch Editor Module
 * Handles batch editing operations for nodes and choices
 * Enhanced with advanced features: regex capture groups, case sensitivity,
 * match highlighting, advanced filtering, and operation history.
 */

// Storage key for batch operation history
const BATCH_HISTORY_KEY = 'narrativegen_batch_history'
const MAX_HISTORY_SIZE = 50

export class BatchEditor {
  constructor(appState) {
    this.appState = appState
    this.batchEditModal = null
    // Operation history for undo/redo
    this.operationHistory = []
    this.historyIndex = -1
    // Current filter settings
    this.filterSettings = {
      nodeTypes: [], // 'passage', 'choice', 'end', 'start'
      hasConditions: null, // true, false, or null (any)
      hasEffects: null,
      hasFlags: null,
      hasResources: null,
      logicMode: 'AND' // 'AND' or 'OR'
    }
    this._loadHistoryFromStorage()
  }

  initialize(batchEditModalElement) {
    this.batchEditModal = batchEditModalElement
    this._setupTabSwitching()
    this._setupPreviewHandlers()
    this._setupFilterHandlers()
    this._setupHistoryHandlers()
  }

  /**
   * Load operation history from localStorage
   */
  _loadHistoryFromStorage() {
    try {
      const stored = localStorage.getItem(BATCH_HISTORY_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.operationHistory = data.history || []
        this.historyIndex = data.historyIndex ?? -1
      }
    } catch (e) {
      console.warn('Failed to load batch history:', e)
      this.operationHistory = []
      this.historyIndex = -1
    }
  }

  /**
   * Save operation history to localStorage
   */
  _saveHistoryToStorage() {
    try {
      const data = {
        history: this.operationHistory.slice(-MAX_HISTORY_SIZE),
        historyIndex: this.historyIndex
      }
      localStorage.setItem(BATCH_HISTORY_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save batch history:', e)
    }
  }

  /**
   * Add operation to history
   * @param {Object} operation - Operation details
   */
  _addToHistory(operation) {
    // Remove any operations after current index (for redo invalidation)
    if (this.historyIndex < this.operationHistory.length - 1) {
      this.operationHistory = this.operationHistory.slice(0, this.historyIndex + 1)
    }
    
    this.operationHistory.push({
      ...operation,
      timestamp: new Date().toISOString()
    })
    this.historyIndex = this.operationHistory.length - 1
    
    // Limit history size
    if (this.operationHistory.length > MAX_HISTORY_SIZE) {
      this.operationHistory = this.operationHistory.slice(-MAX_HISTORY_SIZE)
      this.historyIndex = this.operationHistory.length - 1
    }
    
    this._saveHistoryToStorage()
    this._updateHistoryUI()
  }

  /**
   * Get node type for filtering
   * @param {string} nodeId - Node ID
   * @param {Object} node - Node object
   * @returns {string} Node type
   */
  _getNodeType(nodeId, node) {
    if (!this.appState.model) return 'passage'
    
    // Start node
    if (nodeId === this.appState.model.startNode) {
      return 'start'
    }
    
    // End node (no choices or type is ending)
    if (node.type === 'ending' || (!node.choices || node.choices.length === 0)) {
      return 'end'
    }
    
    // Choice node (has multiple choices)
    if (node.choices && node.choices.length > 1) {
      return 'choice'
    }
    
    // Default passage
    return 'passage'
  }

  /**
   * Check if node matches current filter settings
   * @param {string} nodeId - Node ID
   * @param {Object} node - Node object
   * @returns {boolean} Whether node matches filter
   */
  _matchesFilter(nodeId, node) {
    const checks = []
    
    // Node type filter
    if (this.filterSettings.nodeTypes.length > 0) {
      const nodeType = this._getNodeType(nodeId, node)
      checks.push(this.filterSettings.nodeTypes.includes(nodeType))
    }
    
    // Has conditions filter
    if (this.filterSettings.hasConditions !== null) {
      const hasConditions = node.choices?.some(c => c.conditions?.length > 0) ?? false
      checks.push(hasConditions === this.filterSettings.hasConditions)
    }
    
    // Has effects filter
    if (this.filterSettings.hasEffects !== null) {
      const hasEffects = node.choices?.some(c => c.effects?.length > 0) ?? false
      checks.push(hasEffects === this.filterSettings.hasEffects)
    }
    
    // Has flags filter
    if (this.filterSettings.hasFlags !== null) {
      const hasFlags = node.onEnter?.some(e => e.type === 'setFlag') ?? false
      checks.push(hasFlags === this.filterSettings.hasFlags)
    }
    
    // Has resources filter
    if (this.filterSettings.hasResources !== null) {
      const hasResources = node.onEnter?.some(e => e.type === 'addResource') ?? false
      checks.push(hasResources === this.filterSettings.hasResources)
    }
    
    // If no filters, match all
    if (checks.length === 0) return true
    
    // Apply logic mode
    if (this.filterSettings.logicMode === 'AND') {
      return checks.every(c => c)
    } else {
      return checks.some(c => c)
    }
  }

  /**
   * Get filtered nodes based on current filter settings
   * @returns {Object} Filtered nodes { nodeId: node }
   */
  _getFilteredNodes() {
    if (!this.appState.model?.nodes) return {}
    
    const filtered = {}
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (this._matchesFilter(nodeId, node)) {
        filtered[nodeId] = node
      }
    }
    return filtered
  }

  /**
   * Setup filter event handlers
   */
  _setupFilterHandlers() {
    if (!this.batchEditModal) return
    
    // Node type checkboxes
    const nodeTypeCheckboxes = this.batchEditModal.querySelectorAll('.batch-filter-node-type')
    nodeTypeCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        this.filterSettings.nodeTypes = Array.from(
          this.batchEditModal.querySelectorAll('.batch-filter-node-type:checked')
        ).map(el => el.value)
        this.updateReplacePreview()
      })
    })
    
    // Condition filters
    const conditionFilter = this.batchEditModal.querySelector('#batchFilterConditions')
    if (conditionFilter) {
      conditionFilter.addEventListener('change', () => {
        const val = conditionFilter.value
        this.filterSettings.hasConditions = val === '' ? null : val === 'true'
        this.updateReplacePreview()
      })
    }
    
    // Logic mode toggle
    const logicModeToggle = this.batchEditModal.querySelector('#batchFilterLogicMode')
    if (logicModeToggle) {
      logicModeToggle.addEventListener('change', () => {
        this.filterSettings.logicMode = logicModeToggle.value
        this.updateReplacePreview()
      })
    }
    
    // Reset filters button
    const resetFiltersBtn = this.batchEditModal.querySelector('#batchResetFiltersBtn')
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters())
    }
  }

  /**
   * Setup history event handlers
   */
  _setupHistoryHandlers() {
    if (!this.batchEditModal) return
    
    const undoBtn = this.batchEditModal.querySelector('#batchUndoBtn')
    const redoBtn = this.batchEditModal.querySelector('#batchRedoBtn')
    const exportBtn = this.batchEditModal.querySelector('#batchExportHistoryBtn')
    const importBtn = this.batchEditModal.querySelector('#batchImportHistoryBtn')
    const clearBtn = this.batchEditModal.querySelector('#batchClearHistoryBtn')
    
    if (undoBtn) undoBtn.addEventListener('click', () => this.undo())
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo())
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory())
    if (importBtn) importBtn.addEventListener('click', () => this._showImportDialog())
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearHistory())
  }

  /**
   * Update history UI (undo/redo buttons)
   */
  _updateHistoryUI() {
    if (!this.batchEditModal) return
    
    const undoBtn = this.batchEditModal.querySelector('#batchUndoBtn')
    const redoBtn = this.batchEditModal.querySelector('#batchRedoBtn')
    const historyCount = this.batchEditModal.querySelector('#batchHistoryCount')
    
    if (undoBtn) {
      undoBtn.disabled = this.historyIndex < 0
    }
    if (redoBtn) {
      redoBtn.disabled = this.historyIndex >= this.operationHistory.length - 1
    }
    if (historyCount) {
      historyCount.textContent = `${this.historyIndex + 1}/${this.operationHistory.length}`
    }
  }

  /**
   * タブ切り替え機能を設定
   */
  _setupTabSwitching() {
    if (!this.batchEditModal) return

    const tabButtons = this.batchEditModal.querySelectorAll('.batch-edit-tab')
    const tabContents = this.batchEditModal.querySelectorAll('.batch-edit-tab-content')

    // タブ名からIDへのマッピング
    const tabIdMap = {
      'node-text': 'batchTabNodeText',
      'choice-text': 'batchTabChoiceText',
      'target': 'batchTabTarget'
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab

        // 全てのタブとコンテンツを非アクティブ化
        tabButtons.forEach(btn => btn.classList.remove('active'))
        tabContents.forEach(content => {
          content.classList.remove('active')
          content.style.display = 'none'
        })

        // 選択されたタブとコンテンツをアクティブ化
        button.classList.add('active')
        const targetContentId = tabIdMap[targetTab]
        if (targetContentId) {
          const targetContent = this.batchEditModal.querySelector(`#${targetContentId}`)
          if (targetContent) {
            targetContent.classList.add('active')
            targetContent.style.display = 'block'
          }
        }
      })
    })
  }

  /**
   * プレビュー更新のイベントハンドラを設定
   */
  _setupPreviewHandlers() {
    if (!this.batchEditModal) return

    const searchText = this.batchEditModal.querySelector('#searchText')
    const replaceText = this.batchEditModal.querySelector('#replaceText')
    const useRegex = this.batchEditModal.querySelector('#useRegex')
    const updatePreviewBtn = this.batchEditModal.querySelector('#updatePreviewBtn')

    // プレビュー更新ボタン
    if (updatePreviewBtn) {
      updatePreviewBtn.addEventListener('click', () => {
        this.updateReplacePreview()
      })
    }

    // 検索テキスト変更時に自動プレビュー更新（デバウンス付き）
    if (searchText) {
      let debounceTimer
      searchText.addEventListener('input', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          this.updateReplacePreview()
        }, 500)
      })
    }

    // 置換テキスト変更時に自動プレビュー更新（デバウンス付き）
    if (replaceText) {
      let debounceTimer
      replaceText.addEventListener('input', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          this.updateReplacePreview()
        }, 500)
      })
    }

    // 正規表現チェックボックス変更時に自動プレビュー更新
    if (useRegex) {
      useRegex.addEventListener('change', () => {
        this.updateReplacePreview()
      })
    }
    
    // 大文字小文字区別チェックボックス変更時に自動プレビュー更新
    const caseSensitive = this.batchEditModal.querySelector('#caseSensitive')
    if (caseSensitive) {
      caseSensitive.addEventListener('change', () => {
        this.updateReplacePreview()
      })
    }
  }

  openModal() {
    if (this.appState.guiEditMode && this.appState.guiEditMode.style.display === 'none') {
      setStatus('GUI編集モードでのみ使用可能です', 'warn')
      return
    }

    if (!this.batchEditModal) return

    this.batchEditModal.style.display = 'flex'
    this.batchEditModal.classList.add('show')

    // モーダルを開いた時にプレビューを更新
    setTimeout(() => {
      this.updateReplacePreview()
    }, 100)
  }

  closeModal() {
    if (!this.batchEditModal) return

    this.batchEditModal.style.display = 'none'
    this.batchEditModal.classList.remove('show')
  }

  /**
   * 正規表現をエスケープする（正規表現モードでない場合）
   * @param {string} text - エスケープするテキスト
   * @returns {string} エスケープされたテキスト
   */
  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Build regex flags based on settings
   * @param {boolean} isCaseSensitive - Case sensitivity flag
   * @returns {string} Regex flags
   */
  _buildRegexFlags(isCaseSensitive) {
    return isCaseSensitive ? 'g' : 'gi'
  }

  /**
   * Highlight matches in text with HTML markup
   * @param {string} text - Original text
   * @param {RegExp} regex - Regex to match
   * @returns {string} HTML with highlighted matches
   */
  _highlightMatches(text, regex) {
    regex.lastIndex = 0
    const escaped = this._escapeHtml(text)
    
    // Find all matches and their positions
    const matches = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, text: match[0] })
      if (match.index === regex.lastIndex) regex.lastIndex++
    }
    regex.lastIndex = 0
    
    if (matches.length === 0) return escaped
    
    // Build highlighted string
    let result = ''
    let lastEnd = 0
    for (const m of matches) {
      result += this._escapeHtml(text.substring(lastEnd, m.start))
      result += `<mark class="batch-match-highlight">${this._escapeHtml(m.text)}</mark>`
      lastEnd = m.end
    }
    result += this._escapeHtml(text.substring(lastEnd))
    
    return result
  }

  /**
   * Generate diff view between original and replaced text
   * @param {string} original - Original text
   * @param {string} replaced - Replaced text
   * @param {RegExp} regex - Regex used for matching
   * @returns {string} HTML diff view
   */
  _generateDiffView(original, replaced, regex) {
    const originalHighlighted = this._highlightMatches(original, regex)
    return `
      <div class="batch-diff-container">
        <div class="batch-diff-original">
          <span class="batch-diff-label">変更前:</span>
          <div class="batch-diff-content">${originalHighlighted}</div>
        </div>
        <div class="batch-diff-arrow">→</div>
        <div class="batch-diff-replaced">
          <span class="batch-diff-label">変更後:</span>
          <div class="batch-diff-content">${this._escapeHtml(replaced)}</div>
        </div>
      </div>
    `
  }

  /**
   * 置換プレビューを更新（拡張版）
   */
  updateReplacePreview() {
    const searchText = document.getElementById('searchText')
    const replaceText = document.getElementById('replaceText')
    const useRegex = document.getElementById('useRegex')
    const caseSensitive = document.getElementById('caseSensitive')
    const previewContainer = document.getElementById('replacePreview')

    if (!searchText || !previewContainer || !this.appState.model) return

    const searchValue = searchText.value.trim()
    if (!searchValue) {
      previewContainer.innerHTML = '<p style="color: var(--color-text-muted); margin: 0; font-style: italic;">検索テキストを入力してプレビューを更新してください</p>'
      return
    }

    const replaceValue = replaceText?.value ?? ''
    const isRegex = useRegex?.checked ?? false
    const isCaseSensitive = caseSensitive?.checked ?? false
    const flags = this._buildRegexFlags(isCaseSensitive)

    let regex
    try {
      if (isRegex) {
        regex = new RegExp(searchValue, flags)
      } else {
        const escaped = this._escapeRegex(searchValue)
        regex = new RegExp(escaped, flags)
      }
    } catch (error) {
      previewContainer.innerHTML = `<p style="color: var(--color-error); margin: 0;">正規表現エラー: ${this._escapeHtml(error.message)}</p>`
      return
    }

    // Use filtered nodes
    const filteredNodes = this._getFilteredNodes()
    const totalNodes = Object.keys(this.appState.model.nodes).length
    const filteredCount = Object.keys(filteredNodes).length
    
    const matches = []
    for (const nodeId in filteredNodes) {
      const node = filteredNodes[nodeId]
      if (!node.text) continue

      const matchesInNode = []
      let match
      const text = node.text

      // マッチを検索
      while ((match = regex.exec(text)) !== null) {
        matchesInNode.push({
          index: match.index,
          length: match[0].length,
          matched: match[0],
          groups: match.slice(1) // Capture groups
        })

        if (!regex.global) break
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }

      if (matchesInNode.length > 0) {
        regex.lastIndex = 0
        
        // 置換後のテキストを計算（capture groups対応）
        const replacedText = text.replace(regex, replaceValue)

        matches.push({
          nodeId,
          nodeType: this._getNodeType(nodeId, node),
          originalText: node.text,
          replacedText,
          matchCount: matchesInNode.length,
          captureGroups: matchesInNode[0]?.groups || []
        })
      }

      regex.lastIndex = 0
    }

    if (matches.length === 0) {
      const filterNote = filteredCount < totalNodes 
        ? `（フィルタ適用中: ${filteredCount}/${totalNodes}ノード対象）`
        : ''
      previewContainer.innerHTML = `<p style="color: var(--color-text-muted); margin: 0; font-style: italic;">該当するノードが見つかりませんでした${filterNote}</p>`
      return
    }

    // Show capture groups info if regex mode and has groups
    const hasCaptureGroups = isRegex && matches.some(m => m.captureGroups.length > 0)
    const captureGroupsInfo = hasCaptureGroups 
      ? `<div style="margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 4px; font-size: 0.75rem;">
           <strong>ヒント:</strong> 置換テキストで <code>$1</code>, <code>$2</code> などでキャプチャグループを参照できます
         </div>`
      : ''

    // Filter info
    const filterInfo = filteredCount < totalNodes
      ? `<div style="font-size: 0.75rem; color: var(--color-warning); margin-bottom: 0.25rem;">フィルタ適用中: ${filteredCount}/${totalNodes}ノード対象</div>`
      : ''

    // プレビューを表示（拡張版）
    const previewHtml = `
      <div style="margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--color-text-muted);">
        ${filterInfo}
        対象ノード数: <strong>${matches.length}</strong>件
        ${isCaseSensitive ? '' : '<span style="font-size: 0.7rem; margin-left: 0.5rem;">(大文字小文字区別なし)</span>'}
      </div>
      ${captureGroupsInfo}
      <div class="batch-preview-list" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 300px; overflow-y: auto;">
        ${matches.slice(0, 20).map(match => `
          <div class="batch-preview-item" style="padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-weight: 600; color: var(--color-primary); font-size: 0.85rem;">
                ${this._escapeHtml(match.nodeId)}
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span class="batch-node-type-badge" style="font-size: 0.7rem; padding: 0.125rem 0.375rem; border-radius: 4px; background: var(--color-surface-alt); color: var(--color-text-muted);">
                  ${match.nodeType}
                </span>
                <span style="font-size: 0.75rem; color: var(--color-text-muted);">${match.matchCount}箇所</span>
              </div>
            </div>
            ${this._generateDiffView(match.originalText, match.replacedText, regex)}
          </div>
        `).join('')}
        ${matches.length > 20 ? `<div style="text-align: center; padding: 0.5rem; color: var(--color-text-muted); font-size: 0.85rem;">... 他 ${matches.length - 20} 件</div>` : ''}
      </div>
    `
    previewContainer.innerHTML = previewHtml
  }

  /**
   * HTMLエスケープ
   * @param {string} text - エスケープするテキスト
   * @returns {string} エスケープされたテキスト
   */
  _escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  applyTextReplace() {
    const searchText = document.getElementById('searchText')
    const replaceText = document.getElementById('replaceText')
    const useRegex = document.getElementById('useRegex')
    const caseSensitive = document.getElementById('caseSensitive')

    if (!searchText || !searchText.value.trim()) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }

    const searchValue = searchText.value.trim()
    const replaceValue = replaceText?.value ?? ''
    const isRegex = useRegex?.checked ?? false
    const isCaseSensitive = caseSensitive?.checked ?? false
    const flags = this._buildRegexFlags(isCaseSensitive)

    let regex
    try {
      if (isRegex) {
        regex = new RegExp(searchValue, flags)
      } else {
        const escaped = this._escapeRegex(searchValue)
        regex = new RegExp(escaped, flags)
      }
    } catch (error) {
      setStatus(`正規表現エラー: ${error.message}`, 'error')
      return
    }

    // Use filtered nodes
    const filteredNodes = this._getFilteredNodes()
    
    // Collect changes for history
    const changes = []
    let replacedCount = 0
    
    for (const nodeId in filteredNodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.text) continue

      const originalText = node.text
      const newText = originalText.replace(regex, replaceValue)

      if (originalText !== newText) {
        changes.push({
          nodeId,
          originalText,
          newText
        })
        node.text = newText
        replacedCount++
      }

      regex.lastIndex = 0
    }

    if (replacedCount > 0) {
      // Add to history for undo/redo
      this._addToHistory({
        type: 'textReplace',
        searchValue,
        replaceValue,
        isRegex,
        isCaseSensitive,
        changes,
        filterSettings: { ...this.filterSettings }
      })
      
      setStatus(`${replacedCount}個のノードテキストを置換しました`, 'success')
      
      if (this.appState.onModelUpdate) {
        this.appState.onModelUpdate()
      }
    } else {
      setStatus('該当するテキストが見つかりませんでした', 'info')
    }
  }

  applyChoiceTextReplace() {
    const choiceSearchText = document.getElementById('choiceSearchText')
    const choiceReplaceText = document.getElementById('choiceReplaceText')

    if (!choiceSearchText || !choiceSearchText.value.trim()) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }

    let replacedCount = 0
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.choices) continue

      for (const choice of node.choices) {
        if (choice.text && choice.text.includes(choiceSearchText.value)) {
          choice.text = choice.text.replaceAll(choiceSearchText.value, choiceReplaceText?.value ?? '')
          replacedCount++
        }
      }
    }

    if (replacedCount > 0) {
      setStatus(`${replacedCount}個の選択肢テキストを置換しました`, 'success')
    } else {
      setStatus('該当するテキストが見つかりませんでした', 'info')
    }
  }

  applyTargetReplace() {
    const oldTargetText = document.getElementById('oldTargetText')
    const newTargetText = document.getElementById('newTargetText')

    if (!oldTargetText || !oldTargetText.value.trim() || !newTargetText || !newTargetText.value.trim()) {
      setStatus('変更元と変更先のノードIDを入力してください', 'warn')
      return
    }

    if (!this.appState.model?.nodes?.[newTargetText.value]) {
      setStatus('変更先のノードが存在しません', 'warn')
      return
    }

    let replacedCount = 0
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.choices) continue

      for (const choice of node.choices) {
        if (choice.target === oldTargetText.value) {
          choice.target = newTargetText.value
          replacedCount++
        }
      }
    }

    if (replacedCount > 0) {
      setStatus(`${replacedCount}個のターゲットを変更しました`, 'success')
    } else {
      setStatus('該当するターゲットが見つかりませんでした', 'info')
    }
  }

  /**
   * Undo last batch operation
   */
  undo() {
    if (this.historyIndex < 0 || this.operationHistory.length === 0) {
      setStatus('元に戻す操作がありません', 'info')
      return
    }

    const operation = this.operationHistory[this.historyIndex]
    
    if (operation.type === 'textReplace' && operation.changes) {
      // Revert text changes
      for (const change of operation.changes) {
        const node = this.appState.model.nodes[change.nodeId]
        if (node) {
          node.text = change.originalText
        }
      }
      
      this.historyIndex--
      this._saveHistoryToStorage()
      this._updateHistoryUI()
      
      setStatus(`${operation.changes.length}個のノードを元に戻しました`, 'success')
      
      if (this.appState.onModelUpdate) {
        this.appState.onModelUpdate()
      }
      
      this.updateReplacePreview()
    } else {
      setStatus('この操作は元に戻せません', 'warn')
    }
  }

  /**
   * Redo last undone batch operation
   */
  redo() {
    if (this.historyIndex >= this.operationHistory.length - 1) {
      setStatus('やり直す操作がありません', 'info')
      return
    }

    this.historyIndex++
    const operation = this.operationHistory[this.historyIndex]
    
    if (operation.type === 'textReplace' && operation.changes) {
      // Reapply text changes
      for (const change of operation.changes) {
        const node = this.appState.model.nodes[change.nodeId]
        if (node) {
          node.text = change.newText
        }
      }
      
      this._saveHistoryToStorage()
      this._updateHistoryUI()
      
      setStatus(`${operation.changes.length}個のノードをやり直しました`, 'success')
      
      if (this.appState.onModelUpdate) {
        this.appState.onModelUpdate()
      }
      
      this.updateReplacePreview()
    } else {
      setStatus('この操作はやり直せません', 'warn')
    }
  }

  /**
   * Export operation history as JSON file
   */
  exportHistory() {
    if (this.operationHistory.length === 0) {
      setStatus('エクスポートする履歴がありません', 'info')
      return
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      history: this.operationHistory,
      historyIndex: this.historyIndex
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-history-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setStatus(`${this.operationHistory.length}件の履歴をエクスポートしました`, 'success')
  }

  /**
   * Import operation history from JSON file
   * @param {File} file - JSON file to import
   */
  async importHistory(file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !Array.isArray(data.history)) {
        setStatus('無効な履歴ファイルです', 'error')
        return
      }

      // Merge or replace history
      const mergeConfirm = this.operationHistory.length > 0
        ? confirm('既存の履歴とマージしますか？\n「OK」でマージ、「キャンセル」で置換')
        : false

      if (mergeConfirm) {
        this.operationHistory = [...this.operationHistory, ...data.history]
        this.historyIndex = this.operationHistory.length - 1
      } else {
        this.operationHistory = data.history
        this.historyIndex = data.historyIndex ?? data.history.length - 1
      }

      this._saveHistoryToStorage()
      this._updateHistoryUI()

      setStatus(`${data.history.length}件の履歴をインポートしました`, 'success')
    } catch (error) {
      setStatus(`インポートエラー: ${error.message}`, 'error')
    }
  }

  /**
   * Show import dialog for history file
   */
  _showImportDialog() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        this.importHistory(file)
      }
    }
    input.click()
  }

  /**
   * Clear all operation history
   */
  clearHistory() {
    if (this.operationHistory.length === 0) {
      setStatus('クリアする履歴がありません', 'info')
      return
    }

    if (!confirm('すべての履歴を削除しますか？この操作は元に戻せません。')) {
      return
    }

    this.operationHistory = []
    this.historyIndex = -1
    this._saveHistoryToStorage()
    this._updateHistoryUI()

    setStatus('履歴をクリアしました', 'success')
  }

  /**
   * Get current history state for external access
   * @returns {Object} History state
   */
  getHistoryState() {
    return {
      history: this.operationHistory,
      historyIndex: this.historyIndex,
      canUndo: this.historyIndex >= 0,
      canRedo: this.historyIndex < this.operationHistory.length - 1
    }
  }

  /**
   * Get current filter settings for external access
   * @returns {Object} Filter settings
   */
  getFilterSettings() {
    return { ...this.filterSettings }
  }

  /**
   * Update filter settings
   * @param {Object} settings - New filter settings
   */
  updateFilterSettings(settings) {
    this.filterSettings = { ...this.filterSettings, ...settings }
    this.updateReplacePreview()
  }

  /**
   * Reset all filter settings to defaults
   */
  resetFilters() {
    this.filterSettings = {
      nodeTypes: [],
      hasConditions: null,
      hasEffects: null,
      hasFlags: null,
      hasResources: null,
      logicMode: 'AND'
    }
    
    // Reset UI checkboxes
    if (this.batchEditModal) {
      const checkboxes = this.batchEditModal.querySelectorAll('.batch-filter-node-type')
      checkboxes.forEach(cb => cb.checked = false)
      
      const conditionFilter = this.batchEditModal.querySelector('#batchFilterConditions')
      if (conditionFilter) conditionFilter.value = ''
      
      const logicMode = this.batchEditModal.querySelector('#batchFilterLogicMode')
      if (logicMode) logicMode.value = 'AND'
    }
    
    this.updateReplacePreview()
    setStatus('フィルタをリセットしました', 'info')
  }
}
