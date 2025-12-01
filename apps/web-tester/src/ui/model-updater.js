/**
 * Model Updater Module
 * Handles updating the model from UI inputs and draft saving
 */

import { getCurrentModelName } from '../core/session.js'
import { DRAFT_MODEL_STORAGE_KEY } from '../config/constants.js'

export class ModelUpdater {
  constructor(appState) {
    this.appState = appState
    this.guiEditMode = null
  }

  initialize(guiEditModeElement) {
    this.guiEditMode = guiEditModeElement
  }

  // Model update from input
  updateModelFromInput(input) {
    if (!input.dataset.nodeId) return

    const nodeId = input.dataset.nodeId
    const choiceIndex = input.dataset.choiceIndex
    const field = input.dataset.field
    const value = input.value

    // ノードIDの変更は renameNodeId でのみ行い、ここでは処理しない
    if (field === 'id') {
      return
    }

    if (choiceIndex !== undefined) {
      // Update choice field
      const node = this.appState.model.nodes[nodeId]
      const choice = node.choices[parseInt(choiceIndex)]
      if (choice) {
        choice[field] = value
      }
    } else {
      // Update node field
      const node = this.appState.model.nodes[nodeId]
      if (node) {
        node[field] = value
      }
    }

    // Auto-save draft when editing in GUI mode
    if (this.guiEditMode && this.guiEditMode.style.display !== 'none') {
      this.saveDraftModel()
    }
  }

  // Draft model functionality
  saveDraftModel() {
    if (!this.appState.model) return

    try {
      const draftData = {
        model: this.appState.model,
        modelName: getCurrentModelName(),
        storyLog: this.appState.storyLog,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(DRAFT_MODEL_STORAGE_KEY, JSON.stringify(draftData))
      setStatus('ドラフトを自動保存しました', 'info')
    } catch (error) {
      console.warn('Failed to save draft model:', error)
    }
  }
}
