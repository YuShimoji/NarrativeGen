/**
 * @fileoverview Advanced search utilities for node navigation
 * Provides group-scoped search, ranking, filtering, and sorting capabilities
 */

/**
 * @typedef {Object} SearchResult
 * @property {Object[]} matches - Array of matching nodes
 * @property {number} totalCount - Total number of matches
 * @property {number} groupCount - Number of unique groups with matches
 * @property {string[]} groups - Array of group paths with matches
 */

/**
 * @typedef {Object} FilterOptions
 * @property {boolean} [hideEmptyGroups] - Hide groups with no nodes
 * @property {boolean} [showOnlyCurrentBranch] - Show only nodes in current branch
 * @property {string} [currentNodeId] - ID of current node (for branch filtering)
 * @property {boolean} [hideVisited] - Hide already visited nodes
 * @property {Set<string>} [visitedNodeIds] - Set of visited node IDs
 */

/**
 * Search within a specific group scope
 * Searches across node ID, localId, text, and group fields
 *
 * @param {string} searchTerm - Search query
 * @param {Object[]} nodes - Array of node objects
 * @param {string} [groupPath='all'] - Group to search in ('all' or specific path)
 * @returns {SearchResult} Object containing matches and metadata
 *
 * @example
 * const result = searchInGroup('dragon', nodes, 'story/chapter1');
 * console.log(`Found ${result.totalCount} matches in ${result.groupCount} groups`);
 */
export function searchInGroup(searchTerm, nodes, groupPath = 'all') {
  // Filter by group first
  let targetNodes = nodes;
  if (groupPath !== 'all') {
    targetNodes = nodes.filter(n =>
      n.group === groupPath ||
      n.group?.startsWith(groupPath + '/')
    );
  }

  // Search across multiple fields
  const searchLower = searchTerm.toLowerCase();
  const matches = targetNodes.filter(node => {
    return (
      node.id?.toLowerCase().includes(searchLower) ||
      node.localId?.toLowerCase().includes(searchLower) ||
      node.text?.toLowerCase().includes(searchLower) ||
      node.group?.toLowerCase().includes(searchLower)
    );
  });

  // Extract matching groups
  const matchingGroups = new Set(matches.map(n => n.group).filter(Boolean));

  return {
    matches,
    totalCount: matches.length,
    groupCount: matchingGroups.size,
    groups: Array.from(matchingGroups)
  };
}

/**
 * Rank search results by relevance using multi-factor scoring
 *
 * Scoring factors (in order of priority):
 * - Exact ID match (100 points)
 * - Exact localId match (90 points)
 * - ID prefix match (50 points)
 * - Text prefix match (40 points)
 * - ID contains match (30 points, weighted by position)
 * - Word boundary match in text (25 points)
 * - Group match (20 points)
 * - Depth bonus (shallower nodes score higher, up to 20 points)
 * - Term frequency in text (10 points per occurrence)
 *
 * @param {string} searchTerm - Original search query
 * @param {Object[]} matches - Array of matching nodes
 * @returns {Object[]} Nodes sorted by relevance score (highest first)
 *
 * @example
 * const ranked = rankSearchResults('battle', matches);
 * // Returns nodes with exact 'battle' ID first, then prefix matches, etc.
 */
export function rankSearchResults(searchTerm, matches) {
  const scored = matches.map(node => {
    let score = 0;
    const termLower = searchTerm.toLowerCase();

    // Exact ID match (highest priority)
    if (node.id?.toLowerCase() === termLower) score += 100;
    if (node.localId?.toLowerCase() === termLower) score += 90;

    // Prefix match
    if (node.id?.toLowerCase().startsWith(termLower)) score += 50;
    if (node.text?.toLowerCase().startsWith(termLower)) score += 40;

    // Contains match (earlier position = higher score)
    const idIndex = node.id?.toLowerCase().indexOf(termLower);
    if (idIndex >= 0) score += 30 / (idIndex + 1);

    // Word boundary match (whole word match in text)
    const wordBoundary = new RegExp(`\\b${escapeRegExp(termLower)}\\b`, 'i');
    if (wordBoundary.test(node.text || '')) score += 25;

    // Group match
    if (node.group?.toLowerCase().includes(termLower)) score += 20;

    // Depth bonus (shallower = higher score)
    const depth = node.group?.split('/').length || 0;
    score += Math.max(0, 20 - depth * 5);

    // Term frequency in text
    const termFreq = (node.text?.match(new RegExp(escapeRegExp(termLower), 'gi')) || []).length;
    score += termFreq * 10;

    return { node, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map(item => item.node);
}

/**
 * Escape special regex characters in a string
 *
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for use in RegExp
 * @private
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply filter options to nodes
 * Supports filtering by empty groups, current branch, and visited nodes
 *
 * @param {Object[]} nodes - Array of nodes to filter
 * @param {FilterOptions} [options={}] - Filter configuration
 * @returns {Object[]} Filtered array of nodes
 *
 * @example
 * const filtered = applyFilters(nodes, {
 *   hideEmptyGroups: true,
 *   showOnlyCurrentBranch: true,
 *   currentNodeId: 'story/chapter1/scene2',
 *   hideVisited: true,
 *   visitedNodeIds: new Set(['node1', 'node2'])
 * });
 */
export function applyFilters(nodes, options = {}) {
  let filtered = [...nodes];

  // Filter: Hide empty groups
  if (options.hideEmptyGroups) {
    const groupsWithNodes = new Set(
      nodes.filter(n => n.group).map(n => n.group)
    );
    filtered = filtered.filter(item => {
      if (item.isGroup) {
        return groupsWithNodes.has(item.groupPath);
      }
      return true;
    });
  }

  // Filter: Current branch only
  if (options.showOnlyCurrentBranch && options.currentNodeId) {
    const currentNode = nodes.find(n => n.id === options.currentNodeId);
    const currentGroup = currentNode?.group;

    if (currentGroup) {
      filtered = filtered.filter(node => {
        return (
          node.group === currentGroup ||
          node.group?.startsWith(currentGroup + '/') ||
          currentGroup?.startsWith(node.group + '/')
        );
      });
    }
  }

  // Filter: Hide visited nodes
  if (options.hideVisited && options.visitedNodeIds) {
    filtered = filtered.filter(node =>
      !options.visitedNodeIds.has(node.id)
    );
  }

  return filtered;
}

/**
 * Sort nodes by specified criterion
 *
 * @param {Object[]} nodes - Array of nodes to sort
 * @param {'hierarchy'|'alpha'|'relevance'} [sortBy='hierarchy'] - Sort criterion
 *   - 'hierarchy': Group first, then localId (default)
 *   - 'alpha': Alphabetical by ID
 *   - 'relevance': By score property (if present)
 * @returns {Object[]} Sorted array of nodes
 *
 * @example
 * const sorted = sortNodes(nodes, 'alpha');
 * // Returns nodes sorted alphabetically by ID
 */
export function sortNodes(nodes, sortBy = 'hierarchy') {
  const sorted = [...nodes];

  switch (sortBy) {
    case 'alpha':
      return sorted.sort((a, b) => a.id.localeCompare(b.id));

    case 'relevance':
      // Assumes nodes already have score property from ranking
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));

    case 'hierarchy':
    default:
      return sorted.sort((a, b) => {
        // Group first, then localId
        const groupCompare = (a.group || '').localeCompare(b.group || '');
        if (groupCompare !== 0) return groupCompare;
        return (a.localId || a.id).localeCompare(b.localId || b.id);
      });
  }
}
