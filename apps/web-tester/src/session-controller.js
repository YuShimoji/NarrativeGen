/**
 * Session Controller module - Model loading and session management utilities
 * @module session-controller
 */

import {
    setParaphraseLexicon,
} from '../../../packages/engine-ts/dist/browser.js'
import Logger from './core/logger.js'
import {
    startNewSession,
    setCurrentModelName,
} from './core/session.js'
import { DRAFT_MODEL_STORAGE_KEY } from './config/constants.js'

/**
 * Resolve variables in text (browser-compatible)
 * @param {string} text - Text with variable placeholders
 * @param {Object} session - Current session state
 * @param {Object} model - Current model (unused but kept for API compatibility)
 * @returns {string} Text with variables resolved
 */
export function resolveVariables(text, session, model) {
    if (!text || !session) return text

    let resolved = text

    // Replace flag variables: {flag:key}
    Object.entries(session.flags || {}).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{flag:${key}\\}`, 'g'), value ? 'true' : 'false')
    })

    // Replace resource variables: {resource:key}
    Object.entries(session.resources || {}).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{resource:${key}\\}`, 'g'), String(value))
    })

    // Replace variable variables: {variable:key}
    Object.entries(session.variables || {}).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{variable:${key}\\}`, 'g'), String(value))
    })

    // Replace node ID variable: {nodeId}
    resolved = resolved.replace(/\{nodeId\}/g, session.nodeId)

    // Replace time variable: {time}
    resolved = resolved.replace(/\{time\}/g, String(session.time))

    return resolved
}

/**
 * Load a model from the examples directory
 * @param {string} modelName - Name of the model to load
 * @returns {Promise<Object>} Loaded model object
 */
export async function loadModel(modelName) {
    const url = `/models/examples/${modelName}.json`
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to load model: ${response.status} ${response.statusText}`)
    }
    return response.json()
}

/**
 * Apply model's embedded paraphrase lexicon to runtime
 * @param {Object} model - Model object with optional meta.paraphraseLexicon
 * @param {Object} [lexiconManager] - Optional lexicon manager instance
 */
export function applyModelParaphraseLexicon(model, lexiconManager = null) {
    if (!model || !model.meta || !model.meta.paraphraseLexicon) return

    const runtimeLexicon = model.meta.paraphraseLexicon

    try {
        setParaphraseLexicon(runtimeLexicon, { merge: true })
    } catch (e) {
        Logger.warn('Failed to apply model embedded paraphrase lexicon to engine', e)
    }

    try {
        if (lexiconManager && typeof lexiconManager.applyRuntimeLexicon === 'function') {
            lexiconManager.applyRuntimeLexicon(runtimeLexicon)
        }
    } catch (e) {
        Logger.warn('Failed to apply model embedded paraphrase lexicon to UI lexicon manager', e)
    }
}

/**
 * Check for and restore draft model from localStorage
 * @param {Object} guiEditorManager - GUI editor manager instance
 * @param {Function} restoreCallback - Callback to restore draft
 * @returns {boolean} Whether a draft was found
 */
export function checkForDraftModel(guiEditorManager, restoreCallback) {
    const draftData = localStorage.getItem(DRAFT_MODEL_STORAGE_KEY)
    if (!draftData) return false

    try {
        const draft = JSON.parse(draftData)
        if (!draft.model) return false

        // モーダルでドラフト情報を表示
        if (guiEditorManager && guiEditorManager.openDraftRestoreModal) {
            guiEditorManager.openDraftRestoreModal()
        } else {
            // フォールバック: 簡易ダイアログ
            if (confirm('未保存のドラフトモデルが見つかりました。読み込みますか？')) {
                restoreCallback(draft)
            }
        }
        return true
    } catch (error) {
        console.warn('Failed to load draft model:', error)
        return false
    }
}

/**
 * Restore draft model
 * @param {Object} draft - Draft data object
 * @param {Object} appState - Application state
 * @param {Function} setStatus - Status setter function
 * @param {Object} uiCallbacks - UI update callbacks
 */
export function restoreDraftModel(draft, appState, setStatus, uiCallbacks) {
    try {
        // Restore model and session using centralized state
        appState.model = draft.model
        startNewSession(appState.model)
        setCurrentModelName(draft.modelName || 'draft')
        appState.storyLog = draft.storyLog || []

        setStatus('ドラフトモデルを読み込みました', 'success')

        if (uiCallbacks) {
            if (uiCallbacks.renderState) uiCallbacks.renderState()
            if (uiCallbacks.renderChoices) uiCallbacks.renderChoices()
            if (uiCallbacks.renderStory) uiCallbacks.renderStory()
            if (uiCallbacks.renderDebugInfo) uiCallbacks.renderDebugInfo()
        }

        // ドラフトを削除
        localStorage.removeItem(DRAFT_MODEL_STORAGE_KEY)
    } catch (error) {
        console.error('Failed to restore draft model:', error)
        setStatus('ドラフトの復元に失敗しました', 'error')
    }
}

/**
 * Error boundary for UI operations
 */
export class ErrorBoundary {
    static wrap(operation, fallbackMessage = '操作に失敗しました', setStatus) {
        return async (...args) => {
            try {
                Logger.info('Operation started', { operation: operation.name, args: args.length })
                const result = await operation.apply(this, args)
                Logger.info('Operation completed', { operation: operation.name })
                return result
            } catch (error) {
                Logger.error('Operation failed', {
                    operation: operation.name,
                    error: error.message,
                    stack: error.stack,
                    args: args.length
                })
                if (setStatus) {
                    setStatus(`${fallbackMessage}: ${error.message}`, 'error')
                }
                throw error
            }
        }
    }
}
