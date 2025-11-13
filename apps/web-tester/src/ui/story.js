/**
 * Story Management Module
 * Handles story display, navigation, and content rendering
 */

import Logger from '../core/logger.js'
import { getCurrentSession } from '../core/session.js'

export class StoryManager {
  constructor(appState) {
    this.appState = appState
    this.storyContainer = null
    this.scrollContainer = null
    this.virtualScrollEnabled = true
    this.maxVisibleEntries = 50
  }

  initialize(container) {
    this.storyContainer = container
    this.scrollContainer = container.querySelector('#storyContent')
    if (!this.scrollContainer) {
      Logger.warn('Story container not found')
      return false
    }
    Logger.info('Story manager initialized')
    return true
  }

  initStory() {
    this.appState.storyLog = []
    this.appendStoryFromCurrentNode()
    Logger.info('Story initialized')
  }

  appendStoryFromCurrentNode() {
    const currentSession = getCurrentSession()
    if (!currentSession) {
      Logger.warn('No active session for story append')
      return
    }

    const node = this.appState.model?.nodes?.[currentSession.nodeId]
    if (node?.text) {
      const resolvedText = this.resolveVariables(node.text, currentSession, this.appState.model)
      this.appState.storyLog.push(resolvedText)
      Logger.info('Story entry appended', { nodeId: currentSession.nodeId, textLength: resolvedText.length })
    }
  }

  resolveVariables(text, session, model) {
    if (!text || !session) return text

    return text.replace(/\{([^}]+)\}/g, (match, variable) => {
      try {
        // Check session variables first
        if (session.variables && session.variables[variable] !== undefined) {
          return String(session.variables[variable])
        }

        // Check flags
        if (session.flags && session.flags[variable] !== undefined) {
          return String(session.flags[variable])
        }

        // Check resources
        if (session.resources && session.resources[variable] !== undefined) {
          return String(session.resources[variable])
        }

        // Check model metadata
        if (model?.metadata && model.metadata[variable] !== undefined) {
          return String(model.metadata[variable])
        }

        Logger.debug('Variable not found in resolution', { variable, available: {
          variables: Object.keys(session.variables || {}),
          flags: Object.keys(session.flags || {}),
          resources: Object.keys(session.resources || {})
        }})

        return match // Return original if not found
      } catch (error) {
        Logger.error('Error resolving variable', { variable, error: error.message })
        return match
      }
    })
  }

  renderStory() {
    if (!this.scrollContainer || !this.appState.storyLog) {
      Logger.warn('Story container or story log not available')
      return
    }

    const storyLog = this.appState.storyLog
    if (storyLog.length === 0) {
      this.scrollContainer.innerHTML = '<p>ストーリーがありません</p>'
      return
    }

    // Virtual scrolling for performance
    if (this.virtualScrollEnabled && storyLog.length > this.maxVisibleEntries) {
      this.renderVirtualScroll(storyLog)
    } else {
      this.renderFullStory(storyLog)
    }

    // Auto-scroll to bottom
    this.scrollToBottom()
    Logger.debug('Story rendered', { entries: storyLog.length, virtualScroll: this.virtualScrollEnabled })
  }

  renderFullStory(storyLog) {
    this.scrollContainer.innerHTML = storyLog
      .map((entry, index) => `<div class="story-entry" data-index="${index}">${this.formatStoryEntry(entry, index)}</div>`)
      .join('')
  }

  renderVirtualScroll(storyLog) {
    const totalEntries = storyLog.length
    const visibleStart = Math.max(0, totalEntries - this.maxVisibleEntries)

    const visibleEntries = storyLog.slice(visibleStart)
    const content = visibleEntries
      .map((entry, index) => `<div class="story-entry" data-index="${visibleStart + index}">${this.formatStoryEntry(entry, visibleStart + index)}</div>`)
      .join('')

    const hiddenCount = visibleStart
    const header = hiddenCount > 0 ? `<div class="story-header">${hiddenCount} 件の古いエントリが非表示</div>` : ''

    this.scrollContainer.innerHTML = header + content
  }

  formatStoryEntry(entry, index) {
    // Basic formatting - can be enhanced with markdown processing
    const formatted = entry
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')

    return `<div class="story-text">${formatted}</div><div class="story-index">#${index + 1}</div>`
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight
    }
  }

  toggleVirtualScroll(enabled) {
    this.virtualScrollEnabled = enabled
    this.renderStory()
    Logger.info('Virtual scroll toggled', { enabled })
  }

  clearStory() {
    this.appState.storyLog = []
    this.renderStory()
    Logger.info('Story cleared')
  }

  getStoryAsText() {
    return this.appState.storyLog?.join('\n\n') || ''
  }

  exportStory(filename = 'story.txt') {
    const content = this.getStoryAsText()
    if (!content) {
      Logger.warn('No story content to export')
      return false
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    Logger.info('Story exported', { filename, length: content.length })
    return true
  }
}
