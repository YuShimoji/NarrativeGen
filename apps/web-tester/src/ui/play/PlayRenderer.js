/**
 * PlayRenderer - Integration layer for play immersion (SP-PLAY-001).
 * Orchestrates TransitionRegistry, paragraph fade-in, inline choices,
 * and ending display.
 */

import { TransitionRegistry } from './TransitionRegistry.js'
import { CrossfadeTransition } from './transitions/CrossfadeTransition.js'
import { AppendScrollTransition } from './transitions/AppendScrollTransition.js'

const STORAGE_KEY = 'narrativegen-play-transition-mode'

export class PlayRenderer {
  /** @type {HTMLElement} */
  #storyView
  /** @type {TransitionRegistry} */
  #registry
  /** @type {string} */
  #currentMode
  /** @type {boolean} */
  #transitioning = false

  /**
   * @param {HTMLElement} storyView - The story view container
   * @param {object} [options]
   * @param {string} [options.defaultTransition] - Model-specified default
   * @param {number} [options.paragraphDelay] - ms between paragraph stagger (default 150)
   * @param {number} [options.transitionDuration] - ms for transitions (default 300)
   */
  constructor(storyView, options = {}) {
    this.#storyView = storyView
    this.#registry = new TransitionRegistry()
    this.#registry.register('crossfade', CrossfadeTransition)
    this.#registry.register('append-scroll', AppendScrollTransition)

    this.paragraphDelay = options.paragraphDelay ?? 150
    this.transitionDuration = options.transitionDuration ?? 300

    // Resolve mode: localStorage > model default > 'crossfade'
    const stored = localStorage.getItem(STORAGE_KEY)
    const modelDefault = options.defaultTransition ?? 'crossfade'
    this.#currentMode = stored || modelDefault

    // Ensure mode is valid
    if (!this.#registry.get(this.#currentMode)) {
      this.#currentMode = 'crossfade'
    }

    this.#storyView.classList.add('play-mode')
  }

  /** @returns {TransitionRegistry} */
  get registry() {
    return this.#registry
  }

  /** @returns {string} */
  getTransitionMode() {
    return this.#currentMode
  }

  /** @param {string} mode */
  setTransitionMode(mode) {
    if (!this.#registry.get(mode)) {
      throw new Error(`PlayRenderer: unknown transition mode "${mode}"`)
    }
    this.#currentMode = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }

  /**
   * Toggle between crossfade and append-scroll.
   * @returns {string} The new mode name
   */
  toggleMode() {
    const next = this.#currentMode === 'crossfade' ? 'append-scroll' : 'crossfade'
    this.setTransitionMode(next)
    return next
  }

  /**
   * Render a node with transition effects.
   * @param {string} nodeText - The node text (may contain \n\n for paragraphs)
   * @param {Array<{id: string, text: string}>} choices
   * @param {object} [options]
   * @param {string} [options.speaker] - Speaker name
   * @param {string} [options.choiceText] - The choice text the player selected (for append-scroll quote)
   * @param {string} [options.transition] - Node-specific transition override
   * @param {function} [options.onChoice] - Callback: (choiceId, choiceText) => void
   * @param {function} [options.onRestart] - Callback: () => void
   * @param {function} [options.onUndo] - Callback: () => void
   * @param {boolean} [options.canUndo] - Whether undo is available
   */
  async renderNode(nodeText, choices, options = {}) {
    if (this.#transitioning) return
    this.#transitioning = true

    try {
      const modeName = options.transition || this.#currentMode
      const strategy = this.#registry.resolve(modeName)

      // For crossfade: exit existing, then enter new
      // For append-scroll: no exit, just append
      await strategy.exit(this.#storyView, { duration: this.transitionDuration })

      // Build content
      const content = this.#buildContent(nodeText, choices, options)

      await strategy.enter(this.#storyView, content, {
        duration: this.transitionDuration,
        choiceText: options.choiceText
      })
    } finally {
      this.#transitioning = false
    }
  }

  /**
   * Clear all play content from the story view.
   */
  clear() {
    this.#storyView.querySelectorAll('.play-content, .play-choice-quote, .play-separator').forEach(el => el.remove())
  }

  /**
   * Apply presentation settings from model JSON.
   * @param {object} [presentation] - model.settings.presentation
   */
  applyModelSettings(presentation) {
    if (!presentation) return
    if (presentation.defaultTransition && this.#registry.get(presentation.defaultTransition)) {
      // Only apply model default if user hasn't explicitly set a preference
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        this.#currentMode = presentation.defaultTransition
      }
    }
    if (typeof presentation.paragraphDelay === 'number') {
      this.paragraphDelay = presentation.paragraphDelay
    }
    if (typeof presentation.transitionDuration === 'number') {
      this.transitionDuration = presentation.transitionDuration
    }
  }

  // --- Private helpers ---

  /**
   * Build a play-content element with paragraphs and inline choices.
   * @param {string} nodeText
   * @param {Array} choices
   * @param {object} options
   * @returns {HTMLElement}
   */
  #buildContent(nodeText, choices, options) {
    const container = document.createElement('div')
    container.className = 'play-content'

    // Split text into paragraphs
    const paragraphs = this.#splitParagraphs(nodeText)
    let staggerIndex = 0

    // Speaker name
    if (options.speaker) {
      const speakerEl = document.createElement('div')
      speakerEl.className = 'play-paragraph play-speaker'
      speakerEl.innerHTML = `<strong>${this.#escapeHtml(options.speaker)}</strong>`
      speakerEl.style.animationDelay = `${staggerIndex * this.paragraphDelay}ms`
      container.appendChild(speakerEl)
      staggerIndex++
    }

    // Paragraphs with stagger
    for (const para of paragraphs) {
      const el = document.createElement('div')
      el.className = 'play-paragraph'
      el.innerHTML = this.#formatText(para)
      el.style.animationDelay = `${staggerIndex * this.paragraphDelay}ms`
      container.appendChild(el)
      staggerIndex++
    }

    // Inline choices or ending
    if (choices && choices.length > 0) {
      const choicesEl = this.#buildChoices(choices, options)
      choicesEl.style.animationDelay = `${staggerIndex * this.paragraphDelay}ms`
      container.appendChild(choicesEl)
      staggerIndex++

      // Undo button
      if (options.canUndo && options.onUndo) {
        const undoBtn = document.createElement('button')
        undoBtn.className = 'play-choice-btn'
        undoBtn.style.opacity = '0.6'
        undoBtn.style.fontSize = '0.85rem'
        undoBtn.style.marginTop = '8px'
        undoBtn.textContent = '\u2190 \u623b\u308b'
        undoBtn.style.animationDelay = `${staggerIndex * this.paragraphDelay}ms`
        undoBtn.addEventListener('click', () => options.onUndo())
        container.appendChild(undoBtn)
      }
    } else {
      // Ending
      const endingEl = this.#buildEnding(options)
      container.appendChild(endingEl)
    }

    return container
  }

  /**
   * @param {string} text
   * @returns {string[]}
   */
  #splitParagraphs(text) {
    if (!text) return []
    // Split on double newlines or <br><br>
    return text
      .split(/\n\n|<br\s*\/?>\s*<br\s*\/?>/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
  }

  /**
   * @param {Array} choices
   * @param {object} options
   * @returns {HTMLElement}
   */
  #buildChoices(choices, options) {
    const wrapper = document.createElement('div')
    wrapper.className = 'play-choices'

    for (const choice of choices) {
      const btn = document.createElement('button')
      btn.className = 'play-choice-btn'
      btn.textContent = choice.text || '(?)'
      btn.addEventListener('click', () => {
        if (options.onChoice) {
          options.onChoice(choice.id, choice.text)
        }
      })
      wrapper.appendChild(btn)
    }

    return wrapper
  }

  /**
   * @param {object} options
   * @returns {HTMLElement}
   */
  #buildEnding(options) {
    const ending = document.createElement('div')
    ending.className = 'play-ending'

    const mark = document.createElement('div')
    mark.className = 'play-ending-mark'
    mark.textContent = 'End'
    ending.appendChild(mark)

    const actions = document.createElement('div')
    actions.className = 'play-ending-actions'

    if (options.onRestart) {
      const restartBtn = document.createElement('button')
      restartBtn.className = 'play-ending-btn'
      restartBtn.textContent = '\u6700\u521d\u304b\u3089'
      restartBtn.addEventListener('click', () => options.onRestart())
      actions.appendChild(restartBtn)
    }

    if (options.onUndo) {
      const exploreBtn = document.createElement('button')
      exploreBtn.className = 'play-ending-btn'
      exploreBtn.textContent = '\u5225\u306e\u7d50\u672b\u3092\u63a2\u3059'
      exploreBtn.addEventListener('click', () => options.onUndo())
      actions.appendChild(exploreBtn)
    }

    ending.appendChild(actions)
    return ending
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  #escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * Escape HTML then apply simple Markdown formatting.
   * @param {string} text
   * @returns {string}
   */
  #formatText(text) {
    let safe = this.#escapeHtml(text)
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>')
    safe = safe.replace(/\n/g, '<br>')
    return safe
  }
}
