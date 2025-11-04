// Story rendering and management

import { resolveVariables } from '../utils/model-utils.js'

let storyLog = []

// Story log helpers
export function initStory(session, model) {
  storyLog = []
  appendStoryFromCurrentNode(session, model)
}

export function appendStoryFromCurrentNode(session, model) {
  const node = model?.nodes?.[session?.state?.nodeId]
  if (node?.text) {
    const resolvedText = resolveVariables(node.text, session?.state, model)
    storyLog.push(resolvedText)
  }
}

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

export function getStoryLog() {
  return storyLog
}

// Enhanced story rendering with proper text formatting
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
