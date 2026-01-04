/**
 * Batch Editor Module
 * Handles batch editing operations for nodes and choices
 */

export class BatchEditor {
  constructor(appState) {
    this.appState = appState
    this.batchEditModal = null
  }

  initialize(batchEditModalElement) {
    this.batchEditModal = batchEditModalElement
    this._setupTabSwitching()
    this._setupPreviewHandlers()
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
   * 置換プレビューを更新
   */
  updateReplacePreview() {
    const searchText = document.getElementById('searchText')
    const replaceText = document.getElementById('replaceText')
    const useRegex = document.getElementById('useRegex')
    const previewContainer = document.getElementById('replacePreview')

    if (!searchText || !previewContainer || !this.appState.model) return

    const searchValue = searchText.value.trim()
    if (!searchValue) {
      previewContainer.innerHTML = '<p style="color: var(--color-text-muted); margin: 0; font-style: italic;">検索テキストを入力してプレビューを更新してください</p>'
      return
    }

    const replaceValue = replaceText?.value ?? ''
    const isRegex = useRegex?.checked ?? false

    let regex
    try {
      if (isRegex) {
        regex = new RegExp(searchValue, 'g')
      } else {
        const escaped = this._escapeRegex(searchValue)
        regex = new RegExp(escaped, 'g')
      }
    } catch (error) {
      previewContainer.innerHTML = `<p style="color: var(--color-error); margin: 0;">正規表現エラー: ${this._escapeHtml(error.message)}</p>`
      return
    }

    const matches = []
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.text) continue

      const matchesInNode = []
      let match
      const text = node.text
      let lastIndex = 0

      // マッチを検索
      while ((match = regex.exec(text)) !== null) {
        matchesInNode.push({
          index: match.index,
          length: match[0].length,
          matched: match[0]
        })
        lastIndex = match.index + match[0].length

        // 無限ループ防止（グローバルフラグがない場合）
        if (!regex.global) break
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }

      if (matchesInNode.length > 0) {
        // 正規表現をリセットしてから置換を実行
        regex.lastIndex = 0
        
        // 置換後のテキストを計算
        const replacedText = isRegex
          ? text.replace(regex, replaceValue)
          : text.replaceAll(searchValue, replaceValue)

        matches.push({
          nodeId,
          originalText: node.text,
          replacedText,
          matchCount: matchesInNode.length
        })
      }

      // 正規表現をリセット（次のノードで使用するため）
      regex.lastIndex = 0
    }

    if (matches.length === 0) {
      previewContainer.innerHTML = '<p style="color: var(--color-text-muted); margin: 0; font-style: italic;">該当するノードが見つかりませんでした</p>'
      return
    }

    // プレビューを表示
    const previewHtml = `
      <div style="margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--color-text-muted);">
        対象ノード数: <strong>${matches.length}</strong>件
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 250px; overflow-y: auto;">
        ${matches.map(match => `
          <div style="padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px;">
            <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--color-primary); font-size: 0.85rem;">
              ${this._escapeHtml(match.nodeId)} (${match.matchCount}箇所)
            </div>
            <div style="margin-bottom: 0.5rem;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">置換前:</div>
              <div style="padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 4px; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word;">
                ${this._escapeHtml(match.originalText)}
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">置換後:</div>
              <div style="padding: 0.5rem; background: rgba(74, 222, 128, 0.1); border-radius: 4px; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word;">
                ${this._escapeHtml(match.replacedText)}
              </div>
            </div>
          </div>
        `).join('')}
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

    if (!searchText || !searchText.value.trim()) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }

    const searchValue = searchText.value.trim()
    const replaceValue = replaceText?.value ?? ''
    const isRegex = useRegex?.checked ?? false

    let regex
    try {
      if (isRegex) {
        regex = new RegExp(searchValue, 'g')
      } else {
        const escaped = this._escapeRegex(searchValue)
        regex = new RegExp(escaped, 'g')
      }
    } catch (error) {
      setStatus(`正規表現エラー: ${error.message}`, 'error')
      return
    }

    let replacedCount = 0
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.text) continue

      const originalText = node.text
      const newText = originalText.replace(regex, replaceValue)

      if (originalText !== newText) {
        node.text = newText
        replacedCount++
      }

      // 正規表現をリセット（次のノードで使用するため）
      regex.lastIndex = 0
    }

    if (replacedCount > 0) {
      setStatus(`${replacedCount}個のノードテキストを置換しました`, 'success')
      // UIを更新
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
}
