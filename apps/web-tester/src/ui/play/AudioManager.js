/**
 * AudioManager - BGM playback with crossfade support.
 *
 * Uses two HTMLAudioElements (double-buffering) to enable
 * smooth crossfade transitions between tracks.
 * Handles browser autoplay policy via unlock().
 */
export class AudioManager {
  /** @type {HTMLAudioElement} */
  #audioA
  /** @type {HTMLAudioElement} */
  #audioB
  /** @type {'a'|'b'|null} */
  #current = null
  /** @type {string|null} */
  #currentSrc = null
  /** @type {number} */
  #volume
  /** @type {number} */
  #crossfadeDuration
  /** @type {boolean} */
  #unlocked = false
  /** @type {number|null} */
  #fadeInterval = null

  /**
   * @param {object} [options]
   * @param {number} [options.volume=0.5]
   * @param {number} [options.crossfadeDuration=1000]
   */
  constructor(options = {}) {
    this.#volume = options.volume ?? 0.5
    this.#crossfadeDuration = options.crossfadeDuration ?? 1000
    this.#audioA = new Audio()
    this.#audioB = new Audio()
    this.#audioA.loop = true
    this.#audioB.loop = true
    this.#audioA.volume = 0
    this.#audioB.volume = 0
  }

  /** Resolve autoplay policy restriction. Call on first user gesture. */
  unlock() {
    if (this.#unlocked) return
    this.#unlocked = true

    // Resume any pending playback
    const active = this.#getActive()
    if (active && active.paused && active.src) {
      active.play().catch(() => {})
    }
  }

  /** @returns {boolean} */
  get isUnlocked() {
    return this.#unlocked
  }

  /** @returns {string|null} Currently playing BGM URL */
  get currentBgm() {
    return this.#currentSrc
  }

  /** @param {number} v Volume 0-1 */
  set volume(v) {
    this.#volume = Math.max(0, Math.min(1, v))
    const active = this.#getActive()
    if (active && !active.paused) {
      active.volume = this.#volume
    }
  }

  /** @param {number} ms Crossfade duration in milliseconds */
  set crossfadeDuration(ms) {
    this.#crossfadeDuration = Math.max(0, ms)
  }

  /**
   * Play BGM. If same URL is already playing, do nothing.
   * @param {string} url
   */
  play(url) {
    if (this.#currentSrc === url) return
    this.#stopFade()
    this.#stopAll()

    const audio = this.#getInactive()
    audio.src = url
    audio.volume = this.#volume
    this.#current = audio === this.#audioA ? 'a' : 'b'
    this.#currentSrc = url

    if (this.#unlocked) {
      audio.play().catch(() => {})
    }
  }

  /**
   * Crossfade from current track to a new one.
   * If nothing is playing, just plays the new track.
   * @param {string} url
   */
  crossfadeTo(url) {
    if (this.#currentSrc === url) return

    const oldAudio = this.#getActive()
    if (!oldAudio || oldAudio.paused) {
      this.play(url)
      return
    }

    this.#stopFade()

    const newAudio = this.#getInactive()
    newAudio.src = url
    newAudio.volume = 0
    this.#current = newAudio === this.#audioA ? 'a' : 'b'
    this.#currentSrc = url

    if (this.#unlocked) {
      newAudio.play().catch(() => {})
    }

    this.#fade(oldAudio, oldAudio.volume, 0, newAudio, 0, this.#volume, this.#crossfadeDuration)
  }

  /** Fade out current BGM and stop. */
  fadeOut() {
    const active = this.#getActive()
    if (!active || active.paused) {
      this.#currentSrc = null
      this.#current = null
      return
    }

    this.#stopFade()
    const duration = this.#crossfadeDuration
    this.#currentSrc = null

    this.#fade(active, active.volume, 0, null, 0, 0, duration, () => {
      active.pause()
      active.src = ''
      this.#current = null
    })
  }

  /** Immediately stop all audio. */
  stop() {
    this.#stopFade()
    this.#stopAll()
    this.#currentSrc = null
    this.#current = null
  }

  /** Release all resources. */
  dispose() {
    this.stop()
    this.#audioA.src = ''
    this.#audioB.src = ''
  }

  // --- Private helpers ---

  /** @returns {HTMLAudioElement|null} */
  #getActive() {
    if (this.#current === 'a') return this.#audioA
    if (this.#current === 'b') return this.#audioB
    return null
  }

  /** @returns {HTMLAudioElement} */
  #getInactive() {
    return this.#current === 'a' ? this.#audioB : this.#audioA
  }

  #stopAll() {
    this.#audioA.pause()
    this.#audioA.src = ''
    this.#audioA.volume = 0
    this.#audioB.pause()
    this.#audioB.src = ''
    this.#audioB.volume = 0
  }

  #stopFade() {
    if (this.#fadeInterval !== null) {
      clearInterval(this.#fadeInterval)
      this.#fadeInterval = null
    }
  }

  /**
   * Fade volume on one or two audio elements.
   * @param {HTMLAudioElement} outAudio - Element to fade out (or null)
   * @param {number} outFrom
   * @param {number} outTo
   * @param {HTMLAudioElement|null} inAudio - Element to fade in (or null)
   * @param {number} inFrom
   * @param {number} inTo
   * @param {number} duration - ms
   * @param {function} [onComplete]
   */
  #fade(outAudio, outFrom, outTo, inAudio, inFrom, inTo, duration, onComplete) {
    const stepMs = 50
    const steps = Math.max(1, Math.round(duration / stepMs))
    let step = 0

    this.#fadeInterval = setInterval(() => {
      step++
      const t = Math.min(step / steps, 1)

      if (outAudio) {
        outAudio.volume = outFrom + (outTo - outFrom) * t
      }
      if (inAudio) {
        inAudio.volume = inFrom + (inTo - inFrom) * t
      }

      if (step >= steps) {
        this.#stopFade()
        if (outAudio && outTo === 0) {
          outAudio.pause()
          outAudio.src = ''
        }
        if (onComplete) onComplete()
      }
    }, stepMs)
  }
}
