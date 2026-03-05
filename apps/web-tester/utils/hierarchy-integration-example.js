/**
 * Integration Example - How to use hierarchy-utils and hierarchy-state together
 * This example demonstrates the complete Phase 2A foundation usage
 */

import {
  buildHierarchyTree,
  getAllGroups,
  sortHierarchically,
  getGroupDisplayName,
  getGroupDepth
} from './hierarchy-utils.js'

import {
  initHierarchyState,
  restoreExpansionState,
  setExpansionState,
  getExpansionState,
  toggleExpansionState,
  expandAll,
  collapseAll
} from '../src/ui/hierarchy-state.js'

/**
 * Example: Initialize hierarchy system for a narrative model
 * @param {Object} model - NarrativeGen model with nodes
 */
export function initializeHierarchy(model) {
  // Step 1: Initialize state management
  const stateReady = initHierarchyState()
  if (!stateReady) {
    console.warn('localStorage not available - expansion state will not persist')
  }

  // Step 2: Extract all groups from model
  const groups = getAllGroups(model.nodes)
  console.log(`Found ${groups.length} groups:`, groups)

  // Step 3: Build tree structure
  const tree = buildHierarchyTree(model.nodes)
  console.log('Hierarchy tree:', tree)

  // Step 4: Restore saved expansion states
  const expansionStates = restoreExpansionState(groups)
  console.log('Restored expansion states:', expansionStates)

  return {
    tree,
    groups,
    expansionStates
  }
}

/**
 * Example: Render a simple hierarchy view (console output)
 * @param {Object} tree - Tree structure from buildHierarchyTree
 * @param {Object} expansionStates - Map of group -> expanded state
 */
export function renderHierarchyConsole(tree, expansionStates) {
  console.log('\n=== Hierarchy View ===\n')

  // Render ungrouped nodes first
  if (tree.ungrouped.length > 0) {
    console.log('[Ungrouped Nodes]')
    for (const node of tree.ungrouped) {
      console.log(`  • ${node.localId || node.id}: ${node.text?.substring(0, 40) || '(no text)'}`)
    }
    console.log('')
  }

  // Render groups
  const sortedGroups = Object.keys(tree.groups).sort()
  for (const groupPath of sortedGroups) {
    const group = tree.groups[groupPath]
    const isExpanded = expansionStates[groupPath] !== false

    // Indent based on depth
    const indent = '  '.repeat(group.depth)
    const icon = isExpanded ? '▼' : '▶'

    console.log(`${indent}${icon} ${group.name} (${group.count} nodes)`)

    // Show nodes if expanded
    if (isExpanded) {
      for (const node of group.nodes) {
        console.log(`${indent}  • ${node.localId || node.id}: ${node.text?.substring(0, 40) || '(no text)'}`)
      }
    }
  }

  console.log('\n=== End Hierarchy View ===\n')
}

/**
 * Example: Handle user clicking a group to toggle expansion
 * @param {string} groupPath - Group that was clicked
 * @returns {boolean} New expansion state
 */
export function handleGroupClick(groupPath) {
  const newState = toggleExpansionState(groupPath)
  console.log(`Group "${groupPath}" is now ${newState ? 'expanded' : 'collapsed'}`)
  return newState
}

/**
 * Example: Create HTML for a hierarchy node
 * @param {Object} node - Node object
 * @param {string} currentNodeId - Currently active node ID
 * @returns {string} HTML string
 */
export function createNodeHTML(node, currentNodeId) {
  const isCurrent = node.id === currentNodeId
  const classes = ['hierarchy-node']
  if (isCurrent) {
    classes.push('current-node')
  }

  const text = node.text ? node.text.substring(0, 60) : '(no text)'

  return `
    <div class="${classes.join(' ')}" data-node-id="${node.id}">
      <span class="hierarchy-icon">📄</span>
      <span class="hierarchy-node-name">${node.localId || node.id}</span>
      <span class="hierarchy-node-text">${text}</span>
    </div>
  `
}

/**
 * Example: Create HTML for a hierarchy group
 * @param {string} groupPath - Group path
 * @param {Object} groupData - Group data from tree
 * @param {boolean} isExpanded - Expansion state
 * @returns {string} HTML string
 */
export function createGroupHTML(groupPath, groupData, isExpanded) {
  const icon = isExpanded ? '▼' : '▶'
  const displayName = getGroupDisplayName(groupPath)

  return `
    <div class="hierarchy-group" data-group="${groupPath}">
      <button class="hierarchy-expand-btn">${icon}</button>
      <span class="hierarchy-icon">📁</span>
      <span class="hierarchy-group-name">${displayName}</span>
      <span class="node-count">(${groupData.count})</span>
    </div>
  `
}

/**
 * Example: Full render of hierarchy to HTML
 * @param {Object} model - NarrativeGen model
 * @param {string} currentNodeId - Currently active node
 * @returns {string} Complete HTML string
 */
export function renderHierarchyHTML(model, currentNodeId) {
  const tree = buildHierarchyTree(model.nodes)
  const groups = getAllGroups(model.nodes)
  const expansionStates = restoreExpansionState(groups)

  let html = '<div class="hierarchy-tree">'

  // Render ungrouped nodes
  if (tree.ungrouped.length > 0) {
    html += '<div class="hierarchy-ungrouped">'
    for (const node of tree.ungrouped) {
      html += createNodeHTML(node, currentNodeId)
    }
    html += '</div>'
  }

  // Render groups
  const sortedGroups = Object.keys(tree.groups).sort()
  for (const groupPath of sortedGroups) {
    const group = tree.groups[groupPath]
    const isExpanded = expansionStates[groupPath] !== false

    html += createGroupHTML(groupPath, group, isExpanded)

    // Render nodes if expanded
    if (isExpanded) {
      html += '<div class="hierarchy-group-children">'
      for (const node of group.nodes) {
        html += createNodeHTML(node, currentNodeId)
      }
      html += '</div>'
    }
  }

  html += '</div>'
  return html
}

/**
 * Example: Setup event listeners for hierarchy UI
 * @param {HTMLElement} container - Container element with hierarchy
 * @param {Function} onNodeClick - Callback when node is clicked
 */
export function setupHierarchyEventListeners(container, onNodeClick) {
  // Handle group expansion toggle
  container.addEventListener('click', (event) => {
    const groupBtn = event.target.closest('.hierarchy-expand-btn')
    if (groupBtn) {
      const groupDiv = groupBtn.closest('.hierarchy-group')
      const groupPath = groupDiv.dataset.group

      // Toggle state
      const newState = toggleExpansionState(groupPath)

      // Update UI
      groupBtn.textContent = newState ? '▼' : '▶'

      // Re-render children visibility
      const childrenDiv = groupDiv.nextElementSibling
      if (childrenDiv && childrenDiv.classList.contains('hierarchy-group-children')) {
        childrenDiv.style.display = newState ? 'block' : 'none'
      }

      return
    }

    // Handle node click
    const nodeDiv = event.target.closest('.hierarchy-node')
    if (nodeDiv && onNodeClick) {
      const nodeId = nodeDiv.dataset.nodeId
      onNodeClick(nodeId)
    }
  })
}

/**
 * Example: Complete initialization and render
 */
export function exampleUsage() {
  // Mock model data
  const mockModel = {
    nodes: {
      'ch1/start': { id: 'ch1/start', group: 'ch1', localId: 'start', text: 'Chapter 1 Start' },
      'ch1/next': { id: 'ch1/next', group: 'ch1', localId: 'next', text: 'Chapter 1 Next' },
      'ch2/start': { id: 'ch2/start', group: 'ch2', localId: 'start', text: 'Chapter 2 Start' },
      'ending': { id: 'ending', group: '', localId: 'ending', text: 'The End' }
    }
  }

  console.log('=== Example Usage ===\n')

  // 1. Initialize
  const { tree, groups, expansionStates } = initializeHierarchy(mockModel)

  // 2. Render console view
  renderHierarchyConsole(tree, expansionStates)

  // 3. Simulate user interactions
  console.log('User clicks "ch1" to collapse it:')
  handleGroupClick('ch1')

  console.log('\nUser clicks "ch1" again to expand it:')
  handleGroupClick('ch1')

  // 4. Expand/collapse all examples
  console.log('\nExpanding all groups:')
  expandAll(groups)

  console.log('\nCollapsing all groups:')
  collapseAll(groups)

  // 5. Generate HTML
  console.log('\nGenerated HTML:')
  const html = renderHierarchyHTML(mockModel, 'ch1/start')
  console.log(html.substring(0, 500) + '...')

  console.log('\n=== Example Complete ===')
}

// Uncomment to run example:
// exampleUsage()
