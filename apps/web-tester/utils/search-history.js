/**
 * @fileoverview Search history manager with localStorage persistence
 * Maintains a list of recent searches with autocomplete suggestions
 */

/**
 * Search history manager with localStorage persistence
 * Automatically manages history size and provides prefix-based suggestions
 *
 * @example
 * const history = new SearchHistory(20);
 * history.add('dragon battle');
 * const suggestions = history.getSuggestions('drag', 5);
 * // Returns up to 5 suggestions starting with 'drag'
 */
export class SearchHistory {
  /**
   * Create a new search history manager
   *
   * @param {number} [maxSize=20] - Maximum number of history items to keep
   */
  constructor(maxSize = 20) {
    /**
     * Maximum number of history items
     * @type {number}
     */
    this.maxSize = maxSize;

    /**
     * localStorage key for persistence
     * @type {string}
     */
    this.storageKey = 'ng_search_history';

    /**
     * Current history array (most recent first)
     * @type {string[]}
     */
    this.history = this.load();
  }

  /**
   * Load search history from localStorage
   *
   * @returns {string[]} Loaded history array, or empty array if load fails
   * @private
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Save current history to localStorage
   *
   * @private
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Add a new search term to history
   * Removes duplicates and maintains max size
   *
   * @param {string} term - Search term to add
   *
   * @example
   * history.add('dragon battle');
   * // Adds to front of history, removes older duplicate if present
   */
  add(term) {
    if (!term || term.trim() === '') return;

    // Remove duplicates
    this.history = this.history.filter(t => t !== term);

    // Add to front
    this.history.unshift(term);

    // Maintain max size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }

    this.save();
  }

  /**
   * Get search suggestions based on prefix
   * Returns most recent matches first
   *
   * @param {string} prefix - Search prefix to match
   * @param {number} [limit=5] - Maximum number of suggestions
   * @returns {string[]} Array of matching suggestions
   *
   * @example
   * const suggestions = history.getSuggestions('bat', 5);
   * // Returns ['battle dragon', 'battle scene', ...] (up to 5 items)
   */
  getSuggestions(prefix, limit = 5) {
    if (!prefix) return this.history.slice(0, limit);

    const prefixLower = prefix.toLowerCase();
    return this.history
      .filter(term => term.toLowerCase().startsWith(prefixLower))
      .slice(0, limit);
  }

  /**
   * Get all history items (most recent first)
   *
   * @returns {string[]} Copy of full history array
   *
   * @example
   * const allHistory = history.getAll();
   * // Returns ['recent search', 'older search', ...]
   */
  getAll() {
    return [...this.history];
  }

  /**
   * Clear all search history
   * Removes from both memory and localStorage
   *
   * @example
   * history.clear();
   * // History is now empty
   */
  clear() {
    this.history = [];
    this.save();
  }

  /**
   * Get current history size
   *
   * @returns {number} Number of items in history
   *
   * @example
   * const count = history.size();
   * // Returns number of saved searches
   */
  size() {
    return this.history.length;
  }
}
