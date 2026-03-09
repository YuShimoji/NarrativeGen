/**
 * @fileoverview Hybrid search combining keyword matching and semantic similarity
 * Provides best-of-both-worlds search with configurable weighting
 */

import { searchInGroup, rankSearchResults } from './search-utils.js';
import { SynonymDictionary } from './synonym-dict.js';

/**
 * @typedef {Object} HybridSearchOptions
 * @property {string} [groupPath='all'] - Group scope for search
 * @property {boolean} [useSemanticSearch=true] - Enable semantic search
 * @property {boolean} [useSynonyms=true] - Enable synonym expansion
 * @property {number} [semanticWeight=0.5] - Weight for semantic scores (0-1)
 * @property {number} [minSemanticScore=0.7] - Minimum semantic similarity threshold
 */

/**
 * Hybrid search combining keyword matching and semantic similarity
 * Provides intelligent search that understands both exact matches and meaning
 *
 * @example
 * const hybridSearch = new HybridSearch(semanticSearch, synonymDict);
 * const results = await hybridSearch.search('epic dragon battle', nodes, {
 *   groupPath: 'story/chapter1',
 *   useSemanticSearch: true,
 *   useSynonyms: true,
 *   semanticWeight: 0.5
 * });
 */
export class HybridSearch {
  /**
   * Create a new hybrid search engine
   *
   * @param {Object} semanticSearch - SemanticSearch instance
   * @param {Object} [synonymDict] - SynonymDictionary instance (optional)
   */
  constructor(semanticSearch, synonymDict) {
    /**
     * Semantic search engine
     * @type {Object}
     */
    this.semanticSearch = semanticSearch;

    /**
     * Synonym dictionary
     * @type {SynonymDictionary}
     */
    this.synonymDict = synonymDict || new SynonymDictionary();
  }

  /**
   * Perform hybrid search
   * Combines keyword, synonym, and semantic search with configurable weighting
   *
   * @param {string} query - Search query
   * @param {Object[]} nodes - Array of node objects
   * @param {HybridSearchOptions} [options={}] - Search configuration
   * @returns {Promise<Object[]>} Ranked results with multiple score properties
   *
   * @example
   * const results = await hybridSearch.search('dragon fight', nodes, {
   *   groupPath: 'all',
   *   useSemanticSearch: true,
   *   useSynonyms: true,
   *   semanticWeight: 0.5, // 50% semantic, 50% keyword
   *   minSemanticScore: 0.7
   * });
   *
   * // Results have these properties:
   * // - keywordScore: Keyword ranking score
   * // - semanticScore: Semantic similarity (0-100)
   * // - hybridScore: Combined weighted score
   */
  async search(query, nodes, options = {}) {
    const {
      groupPath = 'all',
      useSemanticSearch = true,
      useSynonyms = true,
      semanticWeight = 0.5, // 0.5 = equal weight
      minSemanticScore = 0.7
    } = options;

    // Step 1: Keyword search
    const keywordResults = searchInGroup(query, nodes, groupPath);
    let keywordMatches = keywordResults.matches;

    // Step 2: Synonym expansion (if enabled)
    if (useSynonyms) {
      const synonymMatches = this.synonymDict.searchWithSynonyms(query, nodes);

      // Filter by group if specified
      const filteredSynonymMatches = groupPath === 'all'
        ? synonymMatches
        : synonymMatches.filter(n =>
            n.group === groupPath ||
            n.group?.startsWith(groupPath + '/')
          );

      // Merge with keyword results (deduplicate)
      const allMatches = new Set([...keywordMatches, ...filteredSynonymMatches]);
      keywordMatches = Array.from(allMatches);
    }

    // Step 3: Semantic search (if enabled and available)
    let semanticMatches = [];
    if (useSemanticSearch && this.semanticSearch.enabled) {
      try {
        // Search in group-filtered nodes if specified
        const targetNodes = groupPath === 'all'
          ? nodes
          : nodes.filter(n =>
              n.group === groupPath ||
              n.group?.startsWith(groupPath + '/')
            );

        semanticMatches = await this.semanticSearch.searchBySemantic(
          query,
          targetNodes,
          minSemanticScore
        );
      } catch (error) {
        console.warn('Semantic search failed, falling back to keyword only:', error);
      }
    }

    // Step 4: Merge results with hybrid scoring
    const allNodes = new Map();

    // Add keyword matches
    const rankedKeyword = rankSearchResults(query, keywordMatches);
    rankedKeyword.forEach((node, index) => {
      allNodes.set(node.id, {
        node,
        keywordScore: rankedKeyword.length - index,
        semanticScore: 0
      });
    });

    // Add semantic matches
    semanticMatches.forEach(node => {
      if (allNodes.has(node.id)) {
        // Node found by both methods - update semantic score
        allNodes.get(node.id).semanticScore = node.semanticScore * 100;
      } else {
        // Node only found by semantic search
        allNodes.set(node.id, {
          node,
          keywordScore: 0,
          semanticScore: node.semanticScore * 100
        });
      }
    });

    // Calculate hybrid score
    const results = Array.from(allNodes.values()).map(item => {
      const hybridScore =
        (item.keywordScore * (1 - semanticWeight)) +
        (item.semanticScore * semanticWeight);

      return {
        ...item.node,
        keywordScore: item.keywordScore,
        semanticScore: item.semanticScore,
        hybridScore
      };
    });

    // Sort by hybrid score
    return results.sort((a, b) => b.hybridScore - a.hybridScore);
  }

  /**
   * Get search statistics
   * Reports on available search methods
   *
   * @returns {Object} Search capabilities
   * @returns {boolean} return.semanticAvailable - Whether semantic search is available
   * @returns {boolean} return.synonymsAvailable - Whether synonym expansion is available
   * @returns {number} return.cachedEmbeddings - Number of cached embeddings
   *
   * @example
   * const stats = hybridSearch.getStats();
   * console.log(`Semantic: ${stats.semanticAvailable}`);
   * console.log(`Cached embeddings: ${stats.cachedEmbeddings}`);
   */
  getStats() {
    return {
      semanticAvailable: this.semanticSearch.enabled,
      synonymsAvailable: true,
      cachedEmbeddings: this.semanticSearch.cache.size()
    };
  }

  /**
   * Quick keyword-only search (no async)
   * Useful when semantic search is not needed
   *
   * @param {string} query - Search query
   * @param {Object[]} nodes - Array of nodes
   * @param {string} [groupPath='all'] - Group scope
   * @returns {Object[]} Ranked keyword results
   *
   * @example
   * const results = hybridSearch.keywordOnly('dragon', nodes, 'story/chapter1');
   * // Synchronous, no AI calls
   */
  keywordOnly(query, nodes, groupPath = 'all') {
    const results = searchInGroup(query, nodes, groupPath);
    return rankSearchResults(query, results.matches);
  }

  /**
   * Quick synonym search (no async)
   * Expands query with synonyms but doesn't use AI
   *
   * @param {string} query - Search query
   * @param {Object[]} nodes - Array of nodes
   * @param {string} [groupPath='all'] - Group scope
   * @returns {Object[]} Ranked synonym-expanded results
   *
   * @example
   * const results = hybridSearch.synonymOnly('battle', nodes);
   * // Finds 'battle', 'fight', 'combat', '戦闘', etc.
   */
  synonymOnly(query, nodes, groupPath = 'all') {
    const synonymMatches = this.synonymDict.searchWithSynonyms(query, nodes);

    // Filter by group if specified
    const filtered = groupPath === 'all'
      ? synonymMatches
      : synonymMatches.filter(n =>
          n.group === groupPath ||
          n.group?.startsWith(groupPath + '/')
        );

    return rankSearchResults(query, filtered);
  }
}
