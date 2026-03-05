/**
 * Save/Load handler - Manages session persistence and auto-save functionality
 *
 * Provides comprehensive save/load operations with auto-save capability,
 * session resumption, and storage quota management. Uses dependency injection
 * for flexible integration with the main application state.
 *
 * @module handlers/save-load-handler
 */

import { StorageManager } from '../utils/storage-utils.js'
import { GameSession } from '@narrativegen/engine-ts/dist/browser.js'

/**
 * Initialize Save/Load handler with dependency injection
 *
 * Sets up event listeners for save, load, and auto-save operations.
 * Manages session state persistence and recovery with change detection
 * to optimize storage operations.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Function to retrieve current model
 * @param {Function} deps.setModel - Function to update model
 * @param {Function} deps.getSession - Function to retrieve current session
 * @param {Function} deps.setSession - Function to update session
 * @param {Function} deps.setStatus - Function to display status messages
 * @param {Function} deps.getStoryLog - Function to retrieve story entries
 * @param {Function} deps.setStoryLog - Function to update story entries
 * @param {Function} deps.clearStoryLog - Function to clear story entries
 * @param {HTMLElement} deps.saveBtn - Save button element
 * @param {HTMLElement} deps.loadBtn - Load button element
 * @param {HTMLElement} deps.clearSaveBtn - Clear saves button element
 * @param {HTMLInputElement} deps.autoSaveToggle - Auto-save checkbox
 * @param {HTMLElement} deps.autoSaveIndicator - Auto-save status indicator
 * @param {HTMLElement} deps.resumeModal - Resume modal dialog
 * @param {HTMLElement} deps.resumeInfo - Resume info display area
 * @param {HTMLElement} deps.resumeBtn - Resume button
 * @param {HTMLElement} deps.newSessionBtn - New session button
 * @param {Object} deps.Logger - Logger instance
 * @param {Function} deps.renderState - Function to render current state
 * @param {Function} deps.renderChoices - Function to render choices
 * @param {Function} deps.initStory - Function to initialize story
 * @param {Function} deps.renderStoryEnhanced - Function to render formatted story
 * @param {HTMLElement} deps.storyView - Story view element
 * @param {Function} deps.currentModelName - Function to get current model name
 * @param {Function} deps.entities - Function to get entity list
 * @returns {Object} Handler public API
 * @returns {Function} returns.scheduleAutoSave - Schedule auto-save operation
 * @returns {Function} returns.manualSave - Perform manual save
 * @returns {Function} returns.manualLoad - Perform manual load
 * @returns {Function} returns.clearSave - Clear saved data
 * @returns {Function} returns.checkForSavedSession - Check for saved session on load
 * @returns {Function} returns.restoreSession - Restore session from saved data
 *
 * @example
 * const handler = initSaveLoadHandler({
 *   getModel: () => model,
 *   setModel: (m) => model = m,
 *   getSession: () => session,
 *   setSession: (s) => session = s,
 *   setStatus: (msg, type) => showStatus(msg, type),
 *   saveBtn: document.getElementById('save-btn'),
 *   // ... other dependencies
 * });
 * handler.scheduleAutoSave();
 */
export function initSaveLoadHandler(deps) {
  const {
    getModel,
    setModel,
    getSession,
    setSession,
    setStatus,
    getStoryLog,
    setStoryLog,
    clearStoryLog,
    // DOM references
    saveBtn,
    loadBtn,
    clearSaveBtn,
    autoSaveToggle,
    autoSaveIndicator,
    resumeModal,
    resumeInfo,
    resumeBtn,
    newSessionBtn,
    Logger,
    // Render functions
    renderState,
    renderChoices,
    initStory,
    renderStoryEnhanced,
    storyView,
    // Dynamic accessors
    currentModelName,
    entities
  } = deps

  let autoSaveTimeout = null
  let lastSaveHash = null

  /**
   * Calculate hash of session state for change detection
   *
   * Creates a deterministic hash of critical session state to detect
   * changes and optimize auto-save operations.
   *
   * @param {GameSession} session - Session to hash
   * @returns {string} JSON string hash of session state
   * @private
   */
  function getSessionHash(session) {
    if (!session) return ''
    const state = session.state
    return JSON.stringify({
      node: state.nodeId,
      flags: state.flags,
      resources: state.resources,
      vars: state.variables,
      time: state.time
    })
  }

  /**
   * Show auto-save indicator briefly
   *
   * Displays the auto-save indicator for 2 seconds to provide
   * visual feedback to the user.
   *
   * @returns {void}
   * @private
   */
  function showAutoSaveIndicator() {
    if (!autoSaveIndicator) return

    autoSaveIndicator.style.display = 'inline'

    setTimeout(() => {
      autoSaveIndicator.style.display = 'none'
    }, 2000)
  }

  /**
   * Perform auto-save operation
   *
   * Saves session, model, and story log if state has changed since
   * last save. Includes error handling and logging.
   *
   * @returns {void}
   * @private
   */
  function performAutoSave() {
    try {
      const session = getSession()
      const model = getModel()

      if (!session || !model) {
        Logger.warn('Auto-save skipped: no session or model')
        return
      }

      // Check if state actually changed
      const currentHash = getSessionHash(session)
      if (currentHash === lastSaveHash) {
        Logger.info('Auto-save skipped: no state change')
        return
      }

      const storyLog = getStoryLog()
      const entityList = entities ? entities() : []
      const modelName = currentModelName ? currentModelName() : 'unknown'

      const success = StorageManager.saveSession(
        session,
        model,
        storyLog,
        entityList,
        modelName
      )

      if (success) {
        lastSaveHash = currentHash
        showAutoSaveIndicator()
        Logger.info('Auto-save completed successfully')
      } else {
        Logger.error('Auto-save failed')
      }
    } catch (error) {
      Logger.error('Auto-save error', { error: error.message })
      // Don't show error to user for auto-save failures
    }
  }

  /**
   * Schedule auto-save with debouncing
   *
   * Schedules an auto-save operation after 500ms, clearing any
   * previous timeout. Respects auto-save enabled setting.
   *
   * @returns {void}
   * @public
   */
  function scheduleAutoSave() {
    if (!StorageManager.isAutoSaveEnabled()) {
      Logger.info('Auto-save disabled, skipping')
      return
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Schedule new save after 500ms
    autoSaveTimeout = setTimeout(() => {
      performAutoSave()
    }, 500)
  }

  /**
   * Manual save operation
   *
   * Explicitly saves the current session, model, and story log.
   * Displays user-facing status messages on success or failure.
   *
   * @returns {void}
   * @public
   */
  function manualSave() {
    try {
      const session = getSession()
      const model = getModel()

      if (!session || !model) {
        setStatus('保存するセッションがありません', 'error')
        return
      }

      const storyLog = getStoryLog()
      const entityList = entities ? entities() : []
      const modelName = currentModelName ? currentModelName() : 'unknown'

      const success = StorageManager.saveSession(
        session,
        model,
        storyLog,
        entityList,
        modelName
      )

      if (success) {
        lastSaveHash = getSessionHash(session)
        setStatus('💾 セッションを保存しました', 'success')
        Logger.info('Manual save completed')
      } else {
        setStatus('❌ 保存に失敗しました', 'error')
      }
    } catch (error) {
      Logger.error('Manual save error', { error: error.message })
      setStatus(`❌ 保存エラー: ${error.message}`, 'error')
    }
  }

  /**
   * Manual load operation
   *
   * Loads a saved session if one exists. Requires current model
   * to be loaded. Delegates to restoreSession for actual loading.
   *
   * @returns {void}
   * @public
   */
  function manualLoad() {
    try {
      if (!StorageManager.hasSavedSession()) {
        setStatus('保存されたセッションがありません', 'error')
        return
      }

      const model = getModel()
      if (!model) {
        setStatus('モデルを読み込んでください', 'error')
        return
      }

      restoreSession(model)
    } catch (error) {
      Logger.error('Manual load error', { error: error.message })
      setStatus(`❌ 読み込みエラー: ${error.message}`, 'error')
    }
  }

  /**
   * Clear saved data
   *
   * Deletes all saved session data after user confirmation.
   * Resets the save hash to allow fresh saves.
   *
   * @returns {void}
   * @public
   */
  function clearSave() {
    try {
      if (!StorageManager.hasSavedSession()) {
        setStatus('保存データがありません', 'info')
        return
      }

      const confirmed = confirm('保存データを削除しますか？この操作は取り消せません。')
      if (!confirmed) {
        return
      }

      const success = StorageManager.clearSavedState()
      if (success) {
        lastSaveHash = null
        setStatus('🗑️ 保存データを削除しました', 'success')
        Logger.info('Save data cleared')
      } else {
        setStatus('❌ 削除に失敗しました', 'error')
      }
    } catch (error) {
      Logger.error('Clear save error', { error: error.message })
      setStatus(`❌ 削除エラー: ${error.message}`, 'error')
    }
  }

  /**
   * Toggle auto-save preference
   *
   * Toggles auto-save enabled state in storage and updates UI accordingly.
   * Immediately performs save when enabling auto-save.
   *
   * @returns {void}
   * @private
   */
  function toggleAutoSave() {
    const enabled = autoSaveToggle.checked
    StorageManager.setAutoSaveEnabled(enabled)

    if (enabled) {
      setStatus('✓ 自動保存を有効にしました', 'success')
      scheduleAutoSave() // Save immediately
    } else {
      setStatus('自動保存を無効にしました', 'info')
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
        autoSaveTimeout = null
      }
    }

    Logger.info('Auto-save toggled', { enabled })
  }

  /**
   * Restore session from saved data
   *
   * Loads saved session state, reconstructs GameSession with entities,
   * restores inventory, updates all UI components. Handles model name
   * mismatches with user confirmation.
   *
   * @param {Model} model - Current model instance
   * @returns {void}
   * @public
   */
  function restoreSession(model) {
    try {
      const savedData = StorageManager.loadSession(model)

      if (!savedData) {
        setStatus('保存データの読み込みに失敗しました', 'error')
        return
      }

      // Restore model if different
      const currentModelName_val = currentModelName ? currentModelName() : null
      if (savedData.modelName !== currentModelName_val) {
        Logger.warn('Model name mismatch', {
          saved: savedData.modelName,
          current: currentModelName_val
        })
        // Continue anyway - user confirmed in modal
      }

      // Create GameSession from saved state
      const initialSession = {
        nodeId: savedData.sessionState.nodeId,
        flags: savedData.sessionState.flags,
        resources: savedData.sessionState.resources,
        variables: savedData.sessionState.variables,
        time: savedData.sessionState.time
      }

      // Get entities for inventory restoration
      const entityList = savedData.entities || []
      const session = new GameSession(model, initialSession, entityList)

      // Restore inventory
      const savedInventory = savedData.inventory || []
      for (const entityId of savedInventory) {
        const entity = entityList.find(e => e.id === entityId)
        if (entity) {
          session.addToInventory(entity)
        } else {
          Logger.warn('Inventory entity not found', { entityId })
        }
      }

      // Set restored session
      setSession(session)

      // Restore story log
      const savedStoryLog = savedData.storyLog || []
      setStoryLog(savedStoryLog)

      // Update all UI
      renderState()
      renderChoices()

      // Initialize story view
      if (initStory) {
        initStory()
      }
      renderStoryEnhanced(storyView)

      lastSaveHash = getSessionHash(session)

      setStatus('📂 セッションを復元しました', 'success')
      Logger.info('Session restored successfully', {
        nodeId: savedData.sessionState.nodeId,
        timestamp: savedData.timestamp
      })
    } catch (error) {
      Logger.error('Failed to restore session', { error: error.message })
      setStatus(`❌ 復元エラー: ${error.message}`, 'error')
    }
  }

  /**
   * Show resume modal with saved session info
   *
   * Displays modal dialog with saved session metadata including
   * model name and save timestamp, allowing user to resume or start new.
   *
   * @returns {void}
   * @private
   */
  function showResumeModal() {
    try {
      const metadata = StorageManager.getSavedMetadata()

      if (!metadata || !resumeModal || !resumeInfo) {
        return
      }

      // Format timestamp
      const saveDate = new Date(metadata.timestamp)
      const formattedDate = saveDate.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })

      // Populate resume info
      resumeInfo.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
          <strong>モデル:</strong> ${metadata.modelName || 'Unknown'}
        </div>
        <div style="margin-bottom: 0.5rem;">
          <strong>保存日時:</strong> ${formattedDate}
        </div>
        <div style="font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); margin-top: 0.5rem;">
          セッションを再開しますか？それとも新しいセッションを開始しますか？
        </div>
      `

      // Show modal
      resumeModal.style.display = 'flex'

      Logger.info('Resume modal shown', { metadata })
    } catch (error) {
      Logger.error('Failed to show resume modal', { error: error.message })
    }
  }

  /**
   * Hide resume modal
   *
   * Closes the resume session modal dialog.
   *
   * @returns {void}
   * @private
   */
  function hideResumeModal() {
    if (resumeModal) {
      resumeModal.style.display = 'none'
    }
  }

  /**
   * Handle resume button click
   *
   * Closes modal and restores the saved session after validation.
   *
   * @returns {void}
   * @private
   */
  function handleResume() {
    hideResumeModal()

    const model = getModel()
    if (!model) {
      // Try to load saved model (future enhancement)
      setStatus('モデルを読み込んでください', 'error')
      return
    }

    restoreSession(model)
  }

  /**
   * Handle new session button click
   *
   * Closes modal and starts a fresh session, keeping existing saved data.
   *
   * @returns {void}
   * @private
   */
  function handleNewSession() {
    hideResumeModal()
    // Optionally clear saved state
    // StorageManager.clearSavedState()
    setStatus('新しいセッションを開始します', 'info')
    Logger.info('User chose new session, keeping saved data')
  }

  /**
   * Check for saved session on page load
   *
   * Displays resume modal if saved session exists, allowing user
   * to choose between resuming or starting fresh.
   *
   * @returns {void}
   * @public
   */
  function checkForSavedSession() {
    if (StorageManager.hasSavedSession()) {
      Logger.info('Saved session detected')
      showResumeModal()
    } else {
      Logger.info('No saved session found')
    }
  }

  // Event listeners
  if (saveBtn) {
    saveBtn.addEventListener('click', manualSave)
  }

  if (loadBtn) {
    loadBtn.addEventListener('click', manualLoad)
  }

  if (clearSaveBtn) {
    clearSaveBtn.addEventListener('click', clearSave)
  }

  if (autoSaveToggle) {
    // Initialize state from localStorage
    autoSaveToggle.checked = StorageManager.isAutoSaveEnabled()
    autoSaveToggle.addEventListener('change', toggleAutoSave)
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', handleResume)
  }

  if (newSessionBtn) {
    newSessionBtn.addEventListener('click', handleNewSession)
  }

  // Handle storage events (quota exceeded, corrupted data)
  window.addEventListener('storage:quota-exceeded', (event) => {
    const { stats, message } = event.detail
    setStatus(message, 'error')

    if (confirm('古い保存データを削除しますか？')) {
      clearSave()
    }
  })

  window.addEventListener('storage:corrupted', (event) => {
    const { error } = event.detail
    setStatus(`保存データが破損しています: ${error}`, 'error')

    if (confirm('破損したデータを削除しますか？')) {
      StorageManager.clearSavedState()
      setStatus('破損データを削除しました', 'success')
    }
  })

  // Public API
  return {
    scheduleAutoSave,
    manualSave,
    manualLoad,
    clearSave,
    checkForSavedSession,
    restoreSession
  }
}
