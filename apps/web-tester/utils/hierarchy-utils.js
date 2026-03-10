/**
 * Hierarchy Utilities - Node grouping and tree structure management
 * @module utils/hierarchy-utils
 */

/**
 * Build a hierarchical tree structure from a flat nodes object
 * @param {Object.<string, Node>} nodes - Flat object of nodes keyed by ID
 * @returns {Object} Tree structure with groups and ungrouped nodes
 * @example
 * const tree = buildHierarchyTree(model.nodes)
 * // Returns: { groups: { 'chapter1': { nodes: [...], children: {} } }, ungrouped: [...] }
 */
export function buildHierarchyTree(nodes) {
  if (!nodes || typeof nodes !== 'object') {
    return { groups: {}, ungrouped: [] }
  }

  const tree = {
    groups: {},
    ungrouped: []
  }

  // Convert object to array for processing
  const nodeArray = Object.values(nodes)

  // First pass: collect all nodes by group
  for (const node of nodeArray) {
    if (!node) continue

    if (node.group && node.group.trim() !== '') {
      const groupPath = node.group.trim()

      // Initialize group if it doesn't exist
      if (!tree.groups[groupPath]) {
        tree.groups[groupPath] = {
          path: groupPath,
          name: groupPath.split('/').pop() || groupPath, // Last segment as display name
          nodes: [],
          depth: getGroupDepth(groupPath),
          count: 0
        }
      }

      tree.groups[groupPath].nodes.push(node)
      tree.groups[groupPath].count++
    } else {
      // No group, add to ungrouped
      tree.ungrouped.push(node)
    }
  }

  // Sort nodes within each group by localId
  for (const groupPath in tree.groups) {
    tree.groups[groupPath].nodes.sort((a, b) => {
      const aLocal = a.localId || a.id || ''
      const bLocal = b.localId || b.id || ''
      return aLocal.localeCompare(bLocal)
    })
  }

  // Sort ungrouped nodes by localId
  tree.ungrouped.sort((a, b) => {
    const aLocal = a.localId || a.id || ''
    const bLocal = b.localId || b.id || ''
    return aLocal.localeCompare(bLocal)
  })

  return tree
}

/**
 * Get all nodes that belong to a specific group
 * @param {Object.<string, Node>} nodes - Flat object of nodes
 * @param {string} groupPath - Group path to filter by (e.g., "chapters/intro")
 * @returns {Node[]} Array of nodes in the specified group
 * @example
 * const chapterNodes = getGroupChildren(model.nodes, 'chapter1')
 */
export function getGroupChildren(nodes, groupPath) {
  if (!nodes || typeof nodes !== 'object') {
    return []
  }

  if (!groupPath || typeof groupPath !== 'string') {
    return []
  }

  const normalizedPath = groupPath.trim()
  const children = []

  // Convert object to array and filter by group
  const nodeArray = Object.values(nodes)

  for (const node of nodeArray) {
    if (node && node.group === normalizedPath) {
      children.push(node)
    }
  }

  // Sort by localId
  children.sort((a, b) => {
    const aLocal = a.localId || a.id || ''
    const bLocal = b.localId || b.id || ''
    return aLocal.localeCompare(bLocal)
  })

  return children
}

/**
 * Calculate the nesting depth of a group path
 * Depth is determined by counting forward slashes
 * @param {string} groupPath - Group path (e.g., "chapters/intro/tutorial")
 * @returns {number} Depth level (0 for root level, 1+ for nested)
 * @example
 * getGroupDepth('chapters') // 0
 * getGroupDepth('chapters/intro') // 1
 * getGroupDepth('chapters/intro/tutorial') // 2
 */
export function getGroupDepth(groupPath) {
  if (!groupPath || typeof groupPath !== 'string') {
    return 0
  }

  const trimmed = groupPath.trim()
  if (trimmed === '') {
    return 0
  }

  // Count forward slashes
  const slashCount = (trimmed.match(/\//g) || []).length
  return slashCount
}

/**
 * Extract all unique group paths from nodes
 * @param {Object.<string, Node>} nodes - Flat object of nodes
 * @returns {string[]} Sorted array of unique group paths
 * @example
 * const groups = getAllGroups(model.nodes)
 * // Returns: ['chapter1', 'chapter2', 'endings']
 */
export function getAllGroups(nodes) {
  if (!nodes || typeof nodes !== 'object') {
    return []
  }

  const groupSet = new Set()
  const nodeArray = Object.values(nodes)

  for (const node of nodeArray) {
    if (node && node.group && node.group.trim() !== '') {
      groupSet.add(node.group.trim())
    }
  }

  // Convert to array and sort alphabetically
  const groups = Array.from(groupSet)
  groups.sort((a, b) => a.localeCompare(b))

  return groups
}

/**
 * Sort nodes hierarchically by group then localId
 * Groups are sorted alphabetically, then nodes within each group by localId
 * Ungrouped nodes appear at the end
 * @param {Object.<string, Node>} nodes - Flat object of nodes
 * @returns {Node[]} Sorted array of nodes
 * @example
 * const sorted = sortHierarchically(model.nodes)
 * // Returns nodes grouped and sorted
 */
export function sortHierarchically(nodes) {
  if (!nodes || typeof nodes !== 'object') {
    return []
  }

  const tree = buildHierarchyTree(nodes)
  const sorted = []

  // Get sorted group paths
  const groupPaths = Object.keys(tree.groups).sort((a, b) => a.localeCompare(b))

  // Add nodes from each group in order
  for (const groupPath of groupPaths) {
    const group = tree.groups[groupPath]
    sorted.push(...group.nodes)
  }

  // Add ungrouped nodes at the end
  sorted.push(...tree.ungrouped)

  return sorted
}

/**
 * Get parent group path from a nested group path
 * @param {string} groupPath - Child group path (e.g., "chapters/intro/tutorial")
 * @returns {string|null} Parent group path or null if root level
 * @example
 * getParentGroup('chapters/intro/tutorial') // 'chapters/intro'
 * getParentGroup('chapters') // null
 */
export function getParentGroup(groupPath) {
  if (!groupPath || typeof groupPath !== 'string') {
    return null
  }

  const trimmed = groupPath.trim()
  const lastSlashIndex = trimmed.lastIndexOf('/')

  if (lastSlashIndex === -1) {
    return null // Root level group
  }

  return trimmed.substring(0, lastSlashIndex)
}

/**
 * Check if a group is a child of another group
 * @param {string} childPath - Potential child group path
 * @param {string} parentPath - Potential parent group path
 * @returns {boolean} True if childPath is under parentPath
 * @example
 * isChildGroup('chapters/intro/tutorial', 'chapters/intro') // true
 * isChildGroup('chapters/intro', 'chapters') // true
 * isChildGroup('chapters', 'endings') // false
 */
export function isChildGroup(childPath, parentPath) {
  if (!childPath || !parentPath) {
    return false
  }

  const child = childPath.trim()
  const parent = parentPath.trim()

  if (child === parent) {
    return false // Same group, not a child
  }

  return child.startsWith(parent + '/')
}

/**
 * Get all child groups of a parent group
 * @param {string[]} allGroups - Array of all group paths
 * @param {string} parentPath - Parent group path
 * @param {boolean} directOnly - If true, only return direct children (default: true)
 * @returns {string[]} Array of child group paths
 * @example
 * getChildGroups(['ch1', 'ch1/intro', 'ch1/intro/start'], 'ch1', true)
 * // Returns: ['ch1/intro']
 */
export function getChildGroups(allGroups, parentPath, directOnly = true) {
  if (!Array.isArray(allGroups) || !parentPath) {
    return []
  }

  const parent = parentPath.trim()
  const children = []

  for (const groupPath of allGroups) {
    if (isChildGroup(groupPath, parent)) {
      if (directOnly) {
        // Only include direct children (one level down)
        const relativePath = groupPath.substring(parent.length + 1)
        if (!relativePath.includes('/')) {
          children.push(groupPath)
        }
      } else {
        // Include all descendants
        children.push(groupPath)
      }
    }
  }

  return children.sort((a, b) => a.localeCompare(b))
}

/**
 * Build a nested tree structure with parent-child relationships
 * @param {string[]} groups - Array of all group paths
 * @returns {Object} Nested tree structure
 * @example
 * buildNestedTree(['ch1', 'ch1/intro', 'ch2'])
 * // Returns: { 'ch1': { path: 'ch1', children: { 'ch1/intro': {...} } }, 'ch2': {...} }
 */
export function buildNestedTree(groups) {
  if (!Array.isArray(groups)) {
    return {}
  }

  const tree = {}

  // Sort groups by depth (root level first)
  const sorted = [...groups].sort((a, b) => {
    const depthA = getGroupDepth(a)
    const depthB = getGroupDepth(b)
    if (depthA !== depthB) {
      return depthA - depthB
    }
    return a.localeCompare(b)
  })

  for (const groupPath of sorted) {
    const depth = getGroupDepth(groupPath)

    if (depth === 0) {
      // Root level group
      tree[groupPath] = {
        path: groupPath,
        name: groupPath,
        depth: 0,
        children: {}
      }
    } else {
      // Nested group - find parent
      const parent = getParentGroup(groupPath)
      if (parent && tree[parent]) {
        tree[parent].children[groupPath] = {
          path: groupPath,
          name: groupPath.split('/').pop(),
          depth: depth,
          children: {}
        }
      } else {
        // Parent not found, treat as root
        tree[groupPath] = {
          path: groupPath,
          name: groupPath,
          depth: depth,
          children: {}
        }
      }
    }
  }

  return tree
}

/**
 * Get display name for a group (last segment of path)
 * @param {string} groupPath - Full group path
 * @returns {string} Display name
 * @example
 * getGroupDisplayName('chapters/intro/tutorial') // 'tutorial'
 * getGroupDisplayName('chapters') // 'chapters'
 */
export function getGroupDisplayName(groupPath) {
  if (!groupPath || typeof groupPath !== 'string') {
    return ''
  }

  const trimmed = groupPath.trim()
  const segments = trimmed.split('/')
  return segments[segments.length - 1] || trimmed
}
