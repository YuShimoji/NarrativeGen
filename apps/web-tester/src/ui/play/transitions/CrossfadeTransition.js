/**
 * @typedef {object} TransitionStrategy
 * @property {string} name
 * @property {(container: HTMLElement, content: HTMLElement, options?: object) => Promise<void>} enter
 * @property {(container: HTMLElement, options?: object) => Promise<void>} exit
 * @property {(container: HTMLElement) => void} cleanup
 */

/** @type {TransitionStrategy} */
export const CrossfadeTransition = {
  name: 'crossfade',

  /**
   * Fade out existing content in the container.
   * @param {HTMLElement} container
   * @param {object} [options]
   * @param {number} [options.duration] - ms (default 300)
   */
  exit(container, options = {}) {
    const duration = options.duration ?? 300
    return new Promise((resolve) => {
      const existing = container.querySelector('.play-content')
      if (!existing) {
        resolve()
        return
      }
      existing.classList.add('play-exit')
      existing.style.animationDuration = `${duration}ms`
      const onEnd = () => {
        existing.removeEventListener('animationend', onEnd)
        existing.remove()
        resolve()
      }
      existing.addEventListener('animationend', onEnd)
      // Safety timeout in case animationend doesn't fire
      setTimeout(onEnd, duration + 50)
    })
  },

  /**
   * Fade in new content.
   * @param {HTMLElement} container
   * @param {HTMLElement} content - Element with class play-content
   * @param {object} [options]
   * @param {number} [options.duration] - ms (default 300)
   * @param {number} [options.gap] - ms gap after exit before enter (default 100)
   */
  async enter(container, content, options = {}) {
    const gap = options.gap ?? 100
    if (gap > 0) {
      await new Promise((r) => setTimeout(r, gap))
    }
    content.classList.add('play-enter')
    const duration = options.duration ?? 300
    content.style.animationDuration = `${duration}ms`
    container.appendChild(content)
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
    const contents = container.querySelectorAll('.play-content')
    contents.forEach((el) => {
      el.classList.remove('play-enter', 'play-exit')
      el.style.animationDuration = ''
    })
  }
}
