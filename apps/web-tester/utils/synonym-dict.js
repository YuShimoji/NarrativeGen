/**
 * @fileoverview Expandable synonym dictionary for semantic search
 * Provides built-in and custom synonym expansion for Japanese/English cross-language search
 */

/**
 * Built-in synonyms (can be extended by users)
 * Supports Japanese ⇔ English cross-language matching
 *
 * @type {Object.<string, string[]>}
 * @constant
 */
export const BUILTIN_SYNONYMS = {
  // Battle/Combat
  'battle': ['fight', 'combat', 'encounter', 'conflict', '戦闘', '戦い', 'バトル'],
  'fight': ['battle', 'combat', 'brawl', '戦闘', '戦い'],
  'combat': ['battle', 'fight', 'warfare', '戦闘', '戦争'],
  '戦闘': ['battle', 'fight', 'combat', '戦い', 'バトル'],
  '戦い': ['battle', 'fight', 'combat', '戦闘', 'バトル'],
  'バトル': ['battle', 'fight', 'combat', '戦闘', '戦い'],

  // Dragon
  'dragon': ['drake', 'wyrm', 'wyvern', 'ドラゴン', '竜', '龍', '古龍'],
  'ドラゴン': ['dragon', '竜', '龍', '古龍'],
  '竜': ['dragon', 'ドラゴン', '龍'],
  '龍': ['dragon', 'ドラゴン', '竜'],

  // Quest/Mission
  'quest': ['mission', 'task', 'objective', 'クエスト', '任務', 'ミッション'],
  'mission': ['quest', 'task', 'assignment', 'ミッション', '任務'],
  'クエスト': ['quest', 'mission', 'ミッション', '任務'],
  'ミッション': ['mission', 'quest', 'クエスト', '任務'],

  // Village/Town
  'village': ['town', 'settlement', 'hamlet', '村', '町', '街'],
  'town': ['village', 'city', 'settlement', '町', '街', '村'],
  '村': ['village', 'town', '町'],
  '町': ['town', 'village', '街', '村'],
  '街': ['town', 'city', '町', '村'],

  // Hero/Warrior
  'hero': ['warrior', 'champion', 'protagonist', '勇者', '英雄', 'ヒーロー'],
  'warrior': ['hero', 'fighter', 'soldier', '戦士', '勇者'],
  '勇者': ['hero', 'warrior', '英雄', 'ヒーロー'],
  '英雄': ['hero', '勇者', 'ヒーロー'],
  'ヒーロー': ['hero', '勇者', '英雄'],
  '戦士': ['warrior', 'fighter', '勇者'],

  // Treasure/Item
  'treasure': ['item', 'loot', 'reward', '宝物', 'アイテム', '財宝'],
  'item': ['treasure', 'object', 'goods', 'アイテム', '道具'],
  '宝物': ['treasure', 'item', '財宝', 'アイテム'],
  'アイテム': ['item', 'treasure', '道具', '宝物'],
  '財宝': ['treasure', '宝物']
};

/**
 * Expandable synonym dictionary for semantic search
 * Combines built-in and custom user-defined synonyms
 *
 * @example
 * const dict = new SynonymDictionary();
 * const synonyms = dict.getSynonyms('battle');
 * // Returns ['fight', 'combat', 'encounter', 'conflict', '戦闘', '戦い', 'バトル']
 *
 * @example
 * // Add custom synonyms
 * dict.saveCustomSynonyms({
 *   'boss': ['chief', 'leader', 'ボス', '親玉'],
 *   'ボス': ['boss', 'chief', '親玉']
 * });
 */
export class SynonymDictionary {
  /**
   * Create a new synonym dictionary
   *
   * @param {Object.<string, string[]>} [customSynonyms={}] - Initial custom synonyms
   */
  constructor(customSynonyms = {}) {
    /**
     * Combined built-in and custom synonyms
     * @type {Object.<string, string[]>}
     */
    this.synonyms = { ...BUILTIN_SYNONYMS, ...customSynonyms };

    // Load custom synonyms from localStorage
    this.loadCustomSynonyms();
  }

  /**
   * Load custom synonyms from localStorage
   * Merges with built-in synonyms
   *
   * @private
   */
  loadCustomSynonyms() {
    try {
      const stored = localStorage.getItem('ng_custom_synonyms');
      if (stored) {
        const custom = JSON.parse(stored);
        Object.assign(this.synonyms, custom);
      }
    } catch (error) {
      console.warn('Failed to load custom synonyms:', error);
    }
  }

  /**
   * Save custom synonyms to localStorage
   * Persists across sessions
   *
   * @param {Object.<string, string[]>} customSynonyms - Custom synonym mappings
   *
   * @example
   * dict.saveCustomSynonyms({
   *   'magic': ['spell', 'enchantment', '魔法', 'マジック'],
   *   '魔法': ['magic', 'spell', 'マジック']
   * });
   */
  saveCustomSynonyms(customSynonyms) {
    try {
      localStorage.setItem('ng_custom_synonyms', JSON.stringify(customSynonyms));
      Object.assign(this.synonyms, customSynonyms);
    } catch (error) {
      console.warn('Failed to save custom synonyms:', error);
    }
  }

  /**
   * Get all synonyms for a term
   * Case-insensitive lookup
   *
   * @param {string} term - Term to look up
   * @returns {string[]} Array of synonyms, or empty array if none found
   *
   * @example
   * const synonyms = dict.getSynonyms('battle');
   * // Returns ['fight', 'combat', 'encounter', 'conflict', '戦闘', '戦い', 'バトル']
   */
  getSynonyms(term) {
    const termLower = term.toLowerCase();
    return this.synonyms[termLower] || [];
  }

  /**
   * Expand search term to include synonyms
   * Returns original term plus all synonyms
   *
   * @param {string} term - Term to expand
   * @returns {string[]} Array of term + all synonyms
   *
   * @example
   * const expanded = dict.expandTerm('battle');
   * // Returns ['battle', 'fight', 'combat', 'encounter', 'conflict', '戦闘', '戦い', 'バトル']
   */
  expandTerm(term) {
    const synonyms = this.getSynonyms(term);
    return [term, ...synonyms];
  }

  /**
   * Search with synonym expansion
   * Searches for original term and all synonyms across node fields
   *
   * @param {string} term - Search term
   * @param {Object[]} nodes - Array of node objects
   * @returns {Object[]} Array of matching nodes (deduplicated)
   *
   * @example
   * const results = dict.searchWithSynonyms('battle', nodes);
   * // Finds nodes matching 'battle', 'fight', 'combat', '戦闘', etc.
   */
  searchWithSynonyms(term, nodes) {
    const expandedTerms = this.expandTerm(term);
    const matchedNodes = new Set();

    expandedTerms.forEach(searchTerm => {
      const searchLower = searchTerm.toLowerCase();
      nodes.forEach(node => {
        if (
          node.id?.toLowerCase().includes(searchLower) ||
          node.text?.toLowerCase().includes(searchLower) ||
          node.group?.toLowerCase().includes(searchLower)
        ) {
          matchedNodes.add(node);
        }
      });
    });

    return Array.from(matchedNodes);
  }

  /**
   * Get all synonym mappings
   *
   * @returns {Object.<string, string[]>} All synonym mappings
   *
   * @example
   * const allSynonyms = dict.getAllSynonyms();
   * // Returns complete synonym dictionary
   */
  getAllSynonyms() {
    return { ...this.synonyms };
  }

  /**
   * Clear all custom synonyms
   * Resets to built-in synonyms only
   *
   * @example
   * dict.clearCustomSynonyms();
   * // Custom synonyms removed, only built-ins remain
   */
  clearCustomSynonyms() {
    this.synonyms = { ...BUILTIN_SYNONYMS };
    localStorage.removeItem('ng_custom_synonyms');
  }
}
