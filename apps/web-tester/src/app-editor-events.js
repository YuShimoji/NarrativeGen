/**
 * Editor event handlers - Snippets, templates, batch operations, search, draft management
 * Extracted from app-controller.js
 */
import { DRAFT_MODEL_STORAGE_KEY } from './config/constants.js'
import { startNewSession, setCurrentModelName } from './core/session.js'

/**
 * Set up all editor-related event handlers
 * @param {Object} config
 * @param {Object} config.guiEditorManager - GUI editor manager instance
 * @param {Object} config.appState - Global application state
 * @param {Object} config.dom - DOM element references
 * @param {Object} config.callbacks - Callback functions from app-controller
 * @param {Object} config.storyManager - Story manager instance
 */
export function setupEditorEvents({ guiEditorManager, appState, dom, callbacks, storyManager }) {
  const { setStatus, renderState, renderChoices, renderDebugInfo } = callbacks
  const {
    nodeSearchInput, clearSearchBtn, nodeFilterSelect, searchResultCount,
    snippetBtn, snippetModal, snippetNameInput, saveSnippetBtn, snippetList, closeSnippetModalBtn,
    manageTemplatesBtn, templateModal, customTemplateNameInput, saveCustomTemplateBtn,
    customTemplateList, closeTemplateModalBtn, customTemplateGroup,
    batchEditBtn, applyTextReplaceBtn, applyChoiceReplaceBtn, applyTargetReplaceBtn, closeBatchEditBtn,
    createQuickNodeBtn, cancelQuickNodeBtn, quickNodeBtn,
    batchChoiceBtn, batchChoiceModal, batchNodeSelect, batchCondition, batchEffect,
    batchConditionText, batchEffectText, cancelBatchChoiceBtn, applyBatchChoiceBtn,
    cancelDraftRestoreBtn, confirmDraftRestoreBtn, draftRestoreModal,
    cancelParaphraseBtn, paraphraseModal,
  } = dom

  // ===========================================================================
  // Draft Model System
  // ===========================================================================

  function checkForDraftModel() {
    const draftData = localStorage.getItem(DRAFT_MODEL_STORAGE_KEY)
    if (!draftData) return

    try {
      const draft = JSON.parse(draftData)
      if (!draft.model) return

      if (guiEditorManager && guiEditorManager.openDraftRestoreModal) {
        guiEditorManager.openDraftRestoreModal()
      } else {
        if (confirm('未保存のドラフトモデルが見つかりました。読み込みますか？')) {
          restoreDraftModel(draft)
        }
      }
    } catch (error) {
      console.warn('Failed to load draft model:', error)
    }
  }

  function restoreDraftModel(draft) {
    try {
      appState.model = draft.model
      startNewSession(appState.model)
      setCurrentModelName(draft.modelName || 'draft')
      appState.storyLog = draft.storyLog || []

      setStatus('ドラフトモデルを読み込みました', 'success')
      renderState()
      renderChoices()
      storyManager.renderStory()
      renderDebugInfo()

      localStorage.removeItem(DRAFT_MODEL_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to restore draft model:', error)
      setStatus('ドラフトの復元に失敗しました', 'error')
    }
  }

  // Check for draft on load
  checkForDraftModel()

  // ===========================================================================
  // Paraphrase Modal Events
  // ===========================================================================

  if (cancelParaphraseBtn) {
    cancelParaphraseBtn.addEventListener('click', () => guiEditorManager.hideParaphraseModal())
  }

  if (paraphraseModal) {
    paraphraseModal.addEventListener('click', (e) => {
      if (e.target === paraphraseModal) {
        guiEditorManager.hideParaphraseModal()
      }
    })
  }

  // ===========================================================================
  // Batch Edit Event Listeners
  // ===========================================================================

  if (batchEditBtn) batchEditBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().openModal())
  if (applyTextReplaceBtn) applyTextReplaceBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().applyTextReplace())
  if (applyChoiceReplaceBtn) applyChoiceReplaceBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().applyChoiceReplace())
  if (applyTargetReplaceBtn) applyTargetReplaceBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().applyTargetReplace())
  if (closeBatchEditBtn) closeBatchEditBtn.addEventListener('click', () => guiEditorManager.getBatchEditManager().closeModal())

  // ===========================================================================
  // Quick Node Creation
  // ===========================================================================

  if (createQuickNodeBtn) {
    createQuickNodeBtn.addEventListener('click', () => guiEditorManager.createQuickNode())
  }

  if (cancelQuickNodeBtn) {
    cancelQuickNodeBtn.addEventListener('click', () => guiEditorManager.closeQuickNodeModal())
  }

  if (quickNodeBtn) {
    quickNodeBtn.addEventListener('click', () => guiEditorManager.openQuickNodeModal())
  }

  // ===========================================================================
  // Batch Choice Edit
  // ===========================================================================

  if (batchNodeSelect) {
    batchNodeSelect.addEventListener('change', () => guiEditorManager.updateBatchChoiceList())
  }

  if (batchCondition) {
    batchCondition.addEventListener('change', (e) => {
      batchConditionText.disabled = !e.target.checked
    })
  }

  if (batchEffect) {
    batchEffect.addEventListener('change', (e) => {
      batchEffectText.disabled = !e.target.checked
    })
  }

  if (cancelBatchChoiceBtn) {
    cancelBatchChoiceBtn.addEventListener('click', () => {
      batchChoiceModal.style.display = 'none'
      batchChoiceModal.classList.remove('show')
    })
  }

  if (applyBatchChoiceBtn) {
    applyBatchChoiceBtn.addEventListener('click', () => guiEditorManager.applyBatchChoice())
  }

  if (batchChoiceBtn) {
    batchChoiceBtn.addEventListener('click', () => guiEditorManager.openBatchChoiceModal())
  }

  // ===========================================================================
  // Search and Filter
  // ===========================================================================

  function updateSearchFilter() {
    if (!guiEditorManager || !appState.model) return

    const query = nodeSearchInput?.value || ''
    const filterType = nodeFilterSelect?.value || 'all'

    const result = guiEditorManager.applySearchAndFilter(query, filterType)

    if (result && searchResultCount) {
      if (query || filterType !== 'all') {
        if (result.visible === 0) {
          searchResultCount.textContent = '該当なし'
          searchResultCount.classList.add('no-results')
        } else {
          searchResultCount.textContent = `${result.visible}/${result.total} ノード`
          searchResultCount.classList.remove('no-results')
        }
      } else {
        searchResultCount.textContent = ''
        searchResultCount.classList.remove('no-results')
      }
    }
  }

  let searchDebounceTimer = null
  if (nodeSearchInput) {
    nodeSearchInput.addEventListener('input', () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
      searchDebounceTimer = setTimeout(updateSearchFilter, 300)
    })
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (nodeSearchInput) nodeSearchInput.value = ''
      if (nodeFilterSelect) nodeFilterSelect.value = 'all'
      if (guiEditorManager) guiEditorManager.resetSearchAndFilter()
      if (searchResultCount) searchResultCount.textContent = ''
    })
  }

  if (nodeFilterSelect) {
    nodeFilterSelect.addEventListener('change', updateSearchFilter)
  }

  // ===========================================================================
  // Snippet System
  // ===========================================================================

  function renderSnippetList() {
    if (!snippetList || !guiEditorManager) return

    const snippets = guiEditorManager.getSnippets()

    if (snippets.length === 0) {
      snippetList.innerHTML = `
        <p class="snippet-empty" style="color: var(--color-text-muted); text-align: center; padding: 2rem;">
          スニペットがありません
        </p>
      `
      return
    }

    snippetList.innerHTML = snippets.map(snippet => `
      <div class="snippet-item" data-snippet-id="${snippet.id}">
        <div class="snippet-info">
          <div class="snippet-name">${snippet.name}</div>
          <div class="snippet-meta">作成: ${new Date(snippet.createdAt).toLocaleDateString('ja-JP')}</div>
        </div>
        <div class="snippet-actions-group">
          <button class="insert-snippet-btn primary" data-snippet-id="${snippet.id}">挿入</button>
          <button class="delete-snippet-btn" data-snippet-id="${snippet.id}">削除</button>
        </div>
      </div>
    `).join('')

    snippetList.querySelectorAll('.insert-snippet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const snippetId = btn.dataset.snippetId
        guiEditorManager.insertFromSnippet(snippetId)
        snippetModal.style.display = 'none'
      })
    })

    snippetList.querySelectorAll('.delete-snippet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const snippetId = btn.dataset.snippetId
        if (confirm('このスニペットを削除しますか？')) {
          guiEditorManager.deleteSnippet(snippetId)
          renderSnippetList()
        }
      })
    })
  }

  if (snippetBtn) {
    snippetBtn.addEventListener('click', () => {
      if (snippetModal) {
        snippetModal.style.display = 'flex'
        snippetModal.classList.add('show')
        renderSnippetList()
      }
    })
  }

  if (saveSnippetBtn) {
    saveSnippetBtn.addEventListener('click', () => {
      const name = snippetNameInput?.value.trim() || ''
      if (guiEditorManager.saveAsSnippet(name)) {
        if (snippetNameInput) snippetNameInput.value = ''
        renderSnippetList()
      }
    })
  }

  if (closeSnippetModalBtn) {
    closeSnippetModalBtn.addEventListener('click', () => {
      if (snippetModal) {
        snippetModal.style.display = 'none'
        snippetModal.classList.remove('show')
      }
    })
  }

  if (snippetModal) {
    snippetModal.addEventListener('click', (e) => {
      if (e.target === snippetModal) {
        snippetModal.style.display = 'none'
        snippetModal.classList.remove('show')
      }
    })
  }

  // ===========================================================================
  // Draft Restore Modal
  // ===========================================================================

  if (cancelDraftRestoreBtn) {
    cancelDraftRestoreBtn.addEventListener('click', () => {
      if (guiEditorManager && guiEditorManager.closeDraftRestoreModal) {
        guiEditorManager.closeDraftRestoreModal()
      }
    })
  }

  if (confirmDraftRestoreBtn) {
    confirmDraftRestoreBtn.addEventListener('click', () => {
      if (guiEditorManager && guiEditorManager.getDraftInfo) {
        const draftInfo = guiEditorManager.getDraftInfo()
        if (draftInfo) {
          restoreDraftModel(draftInfo)
          guiEditorManager.closeDraftRestoreModal()
        } else {
          setStatus('ドラフトが見つかりません', 'error')
          guiEditorManager.closeDraftRestoreModal()
        }
      }
    })
  }

  if (draftRestoreModal) {
    draftRestoreModal.addEventListener('click', (e) => {
      if (e.target === draftRestoreModal) {
        if (guiEditorManager && guiEditorManager.closeDraftRestoreModal) {
          guiEditorManager.closeDraftRestoreModal()
        }
      }
    })
  }

  // ===========================================================================
  // Custom Template System
  // ===========================================================================

  function renderCustomTemplateList() {
    if (!customTemplateList || !guiEditorManager) return

    const templates = guiEditorManager.getCustomTemplates()

    if (templates.length === 0) {
      customTemplateList.innerHTML = `
        <p class="template-empty" style="color: var(--color-text-muted); text-align: center; padding: 2rem;">
          カスタムテンプレートがありません
        </p>
      `
      return
    }

    customTemplateList.innerHTML = templates.map(template => `
      <div class="snippet-item" data-template-id="${template.id}">
        <div class="snippet-info">
          <div class="snippet-name">${template.name}</div>
          <div class="snippet-meta">作成: ${new Date(template.createdAt).toLocaleDateString('ja-JP')}</div>
        </div>
        <div class="snippet-actions-group">
          <button class="delete-template-btn" data-template-id="${template.id}">削除</button>
        </div>
      </div>
    `).join('')

    customTemplateList.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const templateId = btn.dataset.templateId
        if (confirm('このテンプレートを削除しますか？')) {
          guiEditorManager.deleteCustomTemplate(templateId)
          renderCustomTemplateList()
          updateCustomTemplateOptions()
        }
      })
    })
  }

  function updateCustomTemplateOptions() {
    if (!customTemplateGroup || !guiEditorManager) return

    const templates = guiEditorManager.getCustomTemplates()

    if (templates.length === 0) {
      customTemplateGroup.innerHTML = '<option disabled>カスタムテンプレートなし</option>'
      return
    }

    customTemplateGroup.innerHTML = templates.map(template =>
      `<option value="${template.id}">${template.name}</option>`
    ).join('')
  }

  if (manageTemplatesBtn) {
    manageTemplatesBtn.addEventListener('click', () => {
      if (templateModal) {
        templateModal.style.display = 'flex'
        templateModal.classList.add('show')
        renderCustomTemplateList()
      }
    })
  }

  if (saveCustomTemplateBtn) {
    saveCustomTemplateBtn.addEventListener('click', () => {
      const name = customTemplateNameInput?.value.trim() || ''
      if (guiEditorManager.saveAsCustomTemplate(name)) {
        if (customTemplateNameInput) customTemplateNameInput.value = ''
        renderCustomTemplateList()
        updateCustomTemplateOptions()
      }
    })
  }

  if (closeTemplateModalBtn) {
    closeTemplateModalBtn.addEventListener('click', () => {
      if (templateModal) {
        templateModal.style.display = 'none'
        templateModal.classList.remove('show')
      }
    })
  }

  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) {
        templateModal.style.display = 'none'
        templateModal.classList.remove('show')
      }
    })
  }
}
