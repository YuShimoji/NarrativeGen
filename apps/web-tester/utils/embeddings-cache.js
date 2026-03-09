/**
 * @fileoverview Cache for OpenAI embeddings to minimize API calls
 * Provides localStorage persistence for embedding vectors
 */

/**
 * Cache for OpenAI embeddings to minimize API calls
 * Automatically persists to localStorage for cross-session reuse
 *
 * @example
 * const cache = new EmbeddingsCache();
 * cache.set('dragon battle', [0.123, -0.456, ...]);
 * const embedding = cache.get('dragon battle');
 */
export class EmbeddingsCache {
  /**
   * Create a new embeddings cache
   * Automatically loads from localStorage
   */
  constructor() {
    /**
     * In-memory cache (Map of text -> embedding vector)
     * @type {Map<string, number[]>}
     */
    this.cache = new Map();

    /**
     * localStorage key for persistence
     * @type {string}
     */
    this.storageKey = 'ng_embeddings_cache';

    // Load existing cache from localStorage
    this.load();
  }

  /**
   * Load embeddings cache from localStorage
   * Populates in-memory cache
   *
   * @private
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load embeddings cache:', error);
    }
  }

  /**
   * Save embeddings cache to localStorage
   * Persists in-memory cache for future sessions
   *
   * @private
   */
  save() {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save embeddings cache:', error);
      // If quota exceeded, try clearing old entries
      if (error.name === 'QuotaExceededError') {
        this.pruneCache();
      }
    }
  }

  /**
   * Get cached embedding for text
   *
   * @param {string} text - Text to look up
   * @returns {number[]|undefined} Embedding vector, or undefined if not cached
   *
   * @example
   * const embedding = cache.get('dragon battle');
   * if (embedding) {
   *   // Use cached embedding
   * }
   */
  get(text) {
    return this.cache.get(text);
  }

  /**
   * Store embedding for text
   * Automatically saves to localStorage
   *
   * @param {string} text - Text key
   * @param {number[]} embedding - Embedding vector
   *
   * @example
   * cache.set('dragon battle', [0.123, -0.456, 0.789, ...]);
   */
  set(text, embedding) {
    this.cache.set(text, embedding);
    this.save();
  }

  /**
   * Check if text has cached embedding
   *
   * @param {string} text - Text to check
   * @returns {boolean} True if cached, false otherwise
   *
   * @example
   * if (cache.has('dragon battle')) {
   *   const embedding = cache.get('dragon battle');
   * }
   */
  has(text) {
    return this.cache.has(text);
  }

  /**
   * Clear all cached embeddings
   * Removes from both memory and localStorage
   *
   * @example
   * cache.clear();
   * // All embeddings removed
   */
  clear() {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Get current cache size
   *
   * @returns {number} Number of cached embeddings
   *
   * @example
   * console.log(`Cache contains ${cache.size()} embeddings`);
   */
  size() {
    return this.cache.size;
  }

  /**
   * Prune cache to reduce size
   * Removes half of the oldest entries (FIFO)
   *
   * @private
   */
  pruneCache() {
    const entries = Array.from(this.cache.entries());
    const keepCount = Math.floor(entries.length / 2);
    this.cache = new Map(entries.slice(-keepCount));
    this.save();
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   * @returns {number} return.size - Number of cached items
   * @returns {number} return.estimatedBytes - Estimated storage size in bytes
   *
   * @example
   * const stats = cache.getStats();
   * console.log(`Cache: ${stats.size} items, ~${stats.estimatedBytes} bytes`);
   */
  getStats() {
    const stored = localStorage.getItem(this.storageKey);
    const estimatedBytes = stored ? new Blob([stored]).size : 0;

    return {
      size: this.cache.size,
      estimatedBytes
    };
  }
}
