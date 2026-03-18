/**
 * AppendScrollTransition - Appends new content below existing content
 * and scrolls to the new section (chat-novel style).
 *
 * @type {import('./CrossfadeTransition.js').TransitionStrategy}
 */
export const AppendScrollTransition = {
  name: 'append-scroll',

  /**
   * No-op for append mode — existing content stays visible.
   */
  async exit(_container, _options) {
    // Nothing to do: content remains in place
  },

  /**
   * Append a separator and the new content, then smooth-scroll into view.
   * @param {HTMLElement} container
   * @param {HTMLElement} content - Element with class play-content
   * @param {object} [options]
   * @param {string} [options.choiceText] - The choice the player selected (shown as quote)
   */
  async enter(container, content, options = {}) {
    // If there is already content, insert the player's choice as a quote + separator
    const hasExisting = container.querySelector('.play-content')
    if (hasExisting && options.choiceText) {
      const quote = document.createElement('blockquote')
      quote.className = 'play-choice-quote'
      quote.textContent = options.choiceText
      container.appendChild(quote)
    }
    if (hasExisting) {
      const hr = document.createElement('hr')
      hr.className = 'play-separator'
      container.appendChild(hr)
    }

    content.classList.add('play-enter')
    container.appendChild(content)

    // Scroll the new content into view
    content.scrollIntoView({ behavior: 'smooth', block: 'start' })

    // Wait for enter animation
    const duration = 300
    content.style.animationDuration = `${duration}ms`
    return new Promise((resolve) => {
      const onEnd = () => {
        content.removeEventListener('animationend', onEnd)
        content.classList.remove('play-enter')
        resolve()
      }
      content.addEventListener('animationend', onEnd)
      setTimeout(onEnd, duration + 50)
    })
  },

  cleanup(container) {
    container.querySelectorAll('.play-content').forEach((el) => {
      el.classList.remove('play-enter', 'play-exit')
      el.style.animationDuration = ''
    })
  }
}
