/**
 * TransitionRegistry - Strategy pattern for node transition effects.
 * Register named TransitionStrategy instances and retrieve them by name.
 *
 * TransitionStrategy interface:
 *   name: string
 *   enter(container, content, options) -> Promise<void>
 *   exit(container, options) -> Promise<void>
 *   cleanup(container) -> void
 */

export class TransitionRegistry {
  /** @type {Map<string, import('./transitions/CrossfadeTransition.js').TransitionStrategy>} */
  #strategies = new Map()
  #defaultName = 'crossfade'

  /**
   * @param {string} name
   * @param {object} strategy - TransitionStrategy
   */
  register(name, strategy) {
    this.#strategies.set(name, strategy)
  }

  /**
   * @param {string} name
   * @returns {object|undefined}
   */
  get(name) {
    return this.#strategies.get(name)
  }

  /** @returns {string[]} */
  list() {
    return [...this.#strategies.keys()]
  }

  /** @returns {string} */
  get default() {
    return this.#defaultName
  }

  set default(name) {
    if (!this.#strategies.has(name)) {
      throw new Error(`TransitionRegistry: unknown strategy "${name}"`)
    }
    this.#defaultName = name
  }

  /**
   * Resolve a strategy by name, falling back to the default.
   * @param {string} [name]
   * @returns {object}
   */
  resolve(name) {
    if (name && this.#strategies.has(name)) {
      return this.#strategies.get(name)
    }
    return this.#strategies.get(this.#defaultName)
  }
}
