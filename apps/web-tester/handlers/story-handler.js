/**
 * Story rendering and management module
 *
 * Handles story log persistence, rendering, and virtual scrolling for large narratives.
 * Provides functions to initialize, update, and display the story content with
 * performance optimizations for long story logs.
 *
 * @module handlers/story-handler
 */

import { resolveVariables } from '../utils/model-utils.js'

/** @type {string[]} In-memory cache of story entries */
let storyLog = []

/**
 * Initialize story log from current node
 *
 * Clears the story log and appends text from the current node,
 * resolving any variables using the session state.
 *
 * @param {GameSession} session - Current game session with state
 * @param {Model} model - Narrative model containing node definitions
 * @returns {void}
 *
 * @example
 * initStory(session, model);
 */
export function initStory(session, model) {
  storyLog = []
  appendStoryFromCurrentNode(session, model)
}

/**
 * Append current node's text to story log
 *
 * Retrieves the text from the current node, resolves any variable
 * references, and adds it to the story log.
 *
 * @param {GameSession} session - Current game session with state
 * @param {Model} model - Narrative model containing node definitions
 * @returns {void}
 */
export function appendStoryFromCurrentNode(session, model) {
  const node = model?.nodes?.[session?.state?.nodeId]
  if (node?.text) {
    const resolvedText = resolveVariables(node.text, session?.state, model)
    storyLog.push(resolvedText)
  }
}

/**
 * Render story log to DOM with virtual scrolling support
 *
 * Displays the story log in the provided DOM element with performance
 * optimizations for large narratives. Implements virtual scrolling by
 * showing only the most recent 50 entries with an indicator for hidden
 * content and lazy-loading on scroll-to-top.
 *
 * @param {HTMLElement} storyView - DOM element to render story content
 * @returns {void}
 *
 * @example
 * const storyView = document.getElementById('story-view');
 * renderStory(storyView);
 */
export function renderStory(storyView) {
  if (!storyView) return
  storyView.textContent = storyLog.join('\n\n')

  // Performance optimization: Virtual scrolling for long stories
  const maxVisibleEntries = 50
  const shouldVirtualize = storyLog.length > maxVisibleEntries

  let visibleEntries
  let startIndex = 0

  if (shouldVirtualize) {
    // Show the most recent entries by default
    startIndex = Math.max(0, storyLog.length - maxVisibleEntries)
    visibleEntries = storyLog.slice(startIndex)
  } else {
    visibleEntries = storyLog
  }

  storyView.textContent = visibleEntries.join('\n\n')

  // Add virtualization indicator
  if (shouldVirtualize) {
    const indicator = document.createElement('div')
    indicator.className = 'virtualization-indicator'
    indicator.textContent = `... (${startIndex} 件の古いエントリが非表示) ...`
    indicator.style.cssText = `
      text-align: center;
      padding: 1rem;
      color: #666;
      font-style: italic;
      border-top: 1px solid #e5e7eb;
      margin-top: 1rem;
    `

    // Insert at the beginning
    storyView.insertBefore(indicator, storyView.firstChild)

    // Add scroll handler for lazy loading more content
    let scrollTimeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        if (storyView.scrollTop === 0 && startIndex > 0) {
          // Load more content when scrolled to top
          const additionalEntries = Math.min(20, startIndex)
          const newStartIndex = startIndex - additionalEntries
          const newVisibleEntries = storyLog.slice(newStartIndex, startIndex + maxVisibleEntries)

          storyView.textContent = newVisibleEntries.join('\n\n')

          // Update indicator
          const newIndicator = indicator.cloneNode(true)
          newIndicator.textContent = `... (${newStartIndex} 件の古いエントリが非表示) ...`
          storyView.insertBefore(newIndicator, storyView.firstChild)

          startIndex = newStartIndex

          // Scroll to show newly loaded content
          storyView.scrollTop = 50
        }
      }, 100)
    }

    storyView.addEventListener('scroll', handleScroll)
  }
}

/**
 * Get current story log
 *
 * Returns a copy of the current story log array.
 *
 * @returns {string[]} Array of story entries
 */
export function getStoryLog() {
  return storyLog
}

/**
 * Set story log with new entries
 *
 * Replaces the entire story log with new entries.
 * Creates a shallow copy to prevent external mutations.
 *
 * @param {string[]} log - Array of story entries to set
 * @returns {void}
 */
export function setStoryLog(log) {
  storyLog = [...log]
}

/**
 * Clear story log
 *
 * Removes all entries from the story log.
 *
 * @returns {void}
 */
export function clearStoryLog() {
  storyLog = []
}

/**
 * Render story log with enhanced HTML formatting
 *
 * Converts the story log to formatted HTML with proper typography,
 * paragraph breaks, and styling. Each story entry is wrapped in a
 * semantic div with index tracking. Injects stylesheet on first render.
 *
 * @param {HTMLElement} storyView - DOM element to render formatted story
 * @returns {void}
 *
 * @example
 * const storyView = document.getElementById('story-view');
 * renderStoryEnhanced(storyView);
 */
export function renderStoryEnhanced(storyView) {
  if (!storyView) return

  // Create formatted HTML content instead of plain text
  const formattedContent = storyLog.map((entry, index) => {
    // Convert line breaks to HTML paragraphs or proper formatting
    const formattedEntry = entry
      .split('\n\n')  // Split on double line breaks (paragraphs)
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('')

    return `<div class="story-entry" data-entry-index="${index}">${formattedEntry}</div>`
  }).join('')

  storyView.innerHTML = formattedContent

  // Apply CSS for better text formatting
  if (!document.getElementById('story-styles')) {
    const style = document.createElement('style')
    style.id = 'story-styles'
    style.textContent = `
      .story-entry {
        margin-bottom: 1.5rem;
        line-height: 1.6;
      }
      .story-entry p {
        margin: 0.5rem 0;
        text-align: justify;
      }
      .story-entry p:first-child {
        margin-top: 0;
      }
      .story-entry p:last-child {
        margin-bottom: 0;
      }
    `
    document.head.appendChild(style)
  }
}
