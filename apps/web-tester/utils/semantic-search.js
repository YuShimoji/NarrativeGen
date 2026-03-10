/**
 * @fileoverview Semantic search using OpenAI Embeddings API
 * Provides AI-powered meaning-based search with vector similarity
 */

import { EmbeddingsCache } from './embeddings-cache.js';

/**
 * Semantic search using OpenAI Embeddings API
 * Finds nodes by meaning rather than keyword matching
 *
 * @example
 * const search = new SemanticSearch(aiProvider);
 * await search.initialize();
 * const results = await search.searchBySemantic('epic dragon battle', nodes, 0.7);
 * // Returns nodes semantically similar to query
 */
export class SemanticSearch {
  /**
   * Create a new semantic search engine
   *
   * @param {Object} aiProvider - AI provider configuration from ai-config.js
   * @param {string} aiProvider.apiKey - OpenAI API key
   * @param {string} [aiProvider.model] - Optional model override
   */
  constructor(aiProvider) {
    /**
     * AI provider configuration
     * @type {Object}
     */
    this.aiProvider = aiProvider;

    /**
     * Embeddings cache for API call reduction
     * @type {EmbeddingsCache}
     */
    this.cache = new EmbeddingsCache();

    /**
     * Whether semantic search is available
     * @type {boolean}
     */
    this.enabled = false;

    /**
     * Embedding model to use
     * @type {string}
     */
    this.embeddingModel = 'text-embedding-3-small'; // Cheap and fast
  }

  /**
   * Check if semantic search is available
   * Tests embeddings API and sets enabled flag
   *
   * @returns {Promise<boolean>} True if available, false otherwise
   *
   * @example
   * const isAvailable = await search.initialize();
   * if (isAvailable) {
   *   console.log('Semantic search ready');
   * }
   */
  async initialize() {
    try {
      if (!this.aiProvider || !this.aiProvider.apiKey) {
        console.info('Semantic search unavailable: No API key configured');
        this.enabled = false;
        return false;
      }

      // Test if embeddings API is available
      const testEmbedding = await this.getEmbedding('test');
      this.enabled = testEmbedding !== null;

      if (this.enabled) {
        console.info('Semantic search initialized successfully');
      }

      return this.enabled;
    } catch (error) {
      console.warn('Semantic search unavailable:', error.message);
      this.enabled = false;
      return false;
    }
  }

  /**
   * Get embedding vector for text (with caching)
   * Uses OpenAI text-embedding-3-small model
   *
   * @param {string} text - Text to embed
   * @returns {Promise<number[]|null>} Embedding vector, or null on failure
   *
   * @example
   * const embedding = await search.getEmbedding('dragon battle');
   * // Returns [0.123, -0.456, 0.789, ...] (1536 dimensions)
   */
  async getEmbedding(text) {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }

    try {
      // Call OpenAI embeddings API
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.aiProvider.apiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: this.embeddingModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Embeddings API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      // Cache the result
      this.cache.set(text, embedding);

      return embedding;
    } catch (error) {
      console.error('Failed to get embedding:', error.message);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (higher = more similar)
   *
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   *
   * @example
   * const similarity = search.cosineSimilarity(vec1, vec2);
   * // Returns 0.85 (highly similar)
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Search nodes by semantic similarity
   * Finds nodes whose meaning is similar to the query
   *
   * @param {string} query - Search query
   * @param {Object[]} nodes - Array of node objects
   * @param {number} [threshold=0.7] - Similarity threshold (0-1)
   * @returns {Promise<Object[]>} Nodes with similarity scores (sorted by score)
   *
   * @example
   * const results = await search.searchBySemantic('epic dragon battle', nodes, 0.7);
   * // Returns nodes like 'dragon_fight_01', 'wyrm_combat', etc.
   * // Each node has .semanticScore property (0-1)
   */
  async searchBySemantic(query, nodes, threshold = 0.7) {
    if (!this.enabled) {
      console.info('Semantic search not enabled, returning empty results');
      return [];
    }

    try {
      // Get query embedding
      const queryEmbedding = await this.getEmbedding(query);
      if (!queryEmbedding) {
        console.warn('Failed to get query embedding');
        return [];
      }

      // Calculate similarities for all nodes
      const results = await Promise.all(
        nodes.map(async (node) => {
          // Combine node fields for embedding
          const nodeText = [
            node.id,
            node.localId,
            node.text,
            node.group
          ].filter(Boolean).join(' ');

          const nodeEmbedding = await this.getEmbedding(nodeText);

          if (!nodeEmbedding) {
            return { node, similarity: 0 };
          }

          const similarity = this.cosineSimilarity(queryEmbedding, nodeEmbedding);
          return { node, similarity };
        })
      );

      // Filter by threshold and sort
      return results
        .filter(r => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .map(r => ({ ...r.node, semanticScore: r.similarity }));

    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   * @returns {number} return.size - Number of cached embeddings
   * @returns {number} return.estimatedBytes - Estimated storage size
   *
   * @example
   * const stats = search.getCacheStats();
   * console.log(`Cached ${stats.size} embeddings (~${stats.estimatedBytes} bytes)`);
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear embeddings cache
   * Useful for testing or storage management
   *
   * @example
   * search.clearCache();
   * // All cached embeddings removed
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if semantic search is enabled
   *
   * @returns {boolean} True if enabled, false otherwise
   *
   * @example
   * if (search.isEnabled()) {
   *   // Use semantic search
   * } else {
   *   // Fall back to keyword search
   * }
   */
  isEnabled() {
    return this.enabled;
  }
}
