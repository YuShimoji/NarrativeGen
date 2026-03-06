# Hierarchy API Quick Reference

## Overview

Phase 2A provides foundational utilities for node hierarchy management in NarrativeGen. This document serves as a quick reference for developers.

---

## Module 1: hierarchy-utils.js

**Location:** `apps/web-tester/utils/hierarchy-utils.js`

### Core Functions

#### buildHierarchyTree(nodes)
Converts flat node object to hierarchical tree structure.

```javascript
const tree = buildHierarchyTree(model.nodes)
// Returns: {
//   groups: {
//     'chapter1': { path: 'chapter1', name: 'chapter1', nodes: [...], depth: 0, count: 5 },
//     'chapter1/intro': { path: 'chapter1/intro', name: 'intro', nodes: [...], depth: 1, count: 3 }
//   },
//   ungrouped: [...]
// }
```

#### getGroupChildren(nodes, groupPath)
Get all nodes in a specific group (sorted by localId).

```javascript
const ch1Nodes = getGroupChildren(model.nodes, 'chapter1')
// Returns: [node1, node2, node3, ...]
```

#### getGroupDepth(groupPath)
Calculate nesting level (count slashes).

```javascript
getGroupDepth('chapter1')           // 0 (root level)
getGroupDepth('chapter1/intro')     // 1 (nested once)
getGroupDepth('ch1/intro/tutorial') // 2 (nested twice)
```

#### getAllGroups(nodes)
Extract unique group paths (sorted alphabetically).

```javascript
const groups = getAllGroups(model.nodes)
// Returns: ['chapter1', 'chapter1/intro', 'chapter2', 'endings']
```

#### sortHierarchically(nodes)
Sort nodes by group then localId (ungrouped at end).

```javascript
const sorted = sortHierarchically(model.nodes)
// Returns: [ch1/start, ch1/next, ch2/start, ..., ungrouped1, ungrouped2]
```

### Helper Functions

#### getParentGroup(groupPath)
Get parent group path.

```javascript
getParentGroup('chapter1/intro/tutorial') // 'chapter1/intro'
getParentGroup('chapter1')                // null (root level)
```

#### isChildGroup(childPath, parentPath)
Check if one group is child of another.

```javascript
isChildGroup('ch1/intro', 'ch1')         // true
isChildGroup('ch1/intro/tutorial', 'ch1') // true
isChildGroup('ch2', 'ch1')                // false
```

#### getChildGroups(allGroups, parentPath, directOnly)
Get child groups of a parent.

```javascript
const allGroups = ['ch1', 'ch1/intro', 'ch1/intro/tutorial', 'ch2']

// Direct children only
getChildGroups(allGroups, 'ch1', true)  // ['ch1/intro']

// All descendants
getChildGroups(allGroups, 'ch1', false) // ['ch1/intro', 'ch1/intro/tutorial']
```

#### getGroupDisplayName(groupPath)
Get last segment as display name.

```javascript
getGroupDisplayName('chapter1/intro/tutorial') // 'tutorial'
getGroupDisplayName('chapter1')                // 'chapter1'
```

---

## Module 2: hierarchy-state.js

**Location:** `apps/web-tester/src/ui/hierarchy-state.js`

### Core Functions

#### getExpansionState(groupPath)
Get expansion state (defaults to true/expanded).

```javascript
const isExpanded = getExpansionState('chapter1')
// Returns: true or false
```

#### setExpansionState(groupPath, isExpanded)
Set expansion state (saves to localStorage).

```javascript
setExpansionState('chapter1', false) // Collapse
setExpansionState('chapter1', true)  // Expand
// Returns: true if successful
```

#### expandAll(groups)
Set all groups to expanded.

```javascript
const allGroups = ['ch1', 'ch2', 'endings']
expandAll(allGroups)
```

#### collapseAll(groups)
Set all groups to collapsed.

```javascript
collapseAll(allGroups)
```

#### restoreExpansionState(groups)
Load saved states on initialization.

```javascript
const states = restoreExpansionState(allGroups)
// Returns: { 'ch1': true, 'ch2': false, ... }
```

### Management Functions

#### toggleExpansionState(groupPath)
Flip current state.

```javascript
const newState = toggleExpansionState('chapter1')
// If was true, returns false; if was false, returns true
```

#### clearExpansionState()
Reset all states (clears localStorage).

```javascript
clearExpansionState()
```

#### initHierarchyState()
Initialize and validate storage.

```javascript
if (initHierarchyState()) {
  console.log('Hierarchy state ready')
}
```

#### getAllExpansionStates()
Get complete state map.

```javascript
const allStates = getAllExpansionStates()
// Returns: { 'ch1': true, 'ch1/intro': false, ... }
```

#### exportHierarchyState()
Export as JSON string (for backup).

```javascript
const backup = exportHierarchyState()
// Returns: '{"ch1":true,"ch2":false}'
```

#### importHierarchyState(jsonState)
Import from JSON string (restore backup).

```javascript
importHierarchyState('{"ch1":true,"ch2":false}')
```

---

## CSS Classes

**Location:** `apps/web-tester/src/styles/inline.css`

### Container
- `.hierarchy-tree` - Main container

### Group Elements
- `.hierarchy-group` - Group header row
- `.hierarchy-group-name` - Group display name
- `.hierarchy-expand-btn` - Expand/collapse button (▶/▼)
- `.node-count` - Node count badge

### Node Elements
- `.hierarchy-node` - Individual node row
- `.hierarchy-node-name` - Node name/ID
- `.hierarchy-node-text` - Node text preview
- `.hierarchy-icon` - Icon (folder 📁 or file 📄)

### States
- `.hierarchy-group:hover` - Group hover effect
- `.hierarchy-node:hover` - Node hover effect
- `.hierarchy-node.current-node` - Active node highlight

---

## localStorage Format

**Key:** `ng_hierarchy_expansion_state`

**Value:** JSON object mapping group paths to boolean states

```json
{
  "chapter1": true,
  "chapter2": false,
  "chapter1/intro": true,
  "endings": false
}
```

- `true` = expanded (show children)
- `false` = collapsed (hide children)
- Missing = defaults to `true`

---

## Error Handling

### localStorage Quota Exceeded

When localStorage quota is exceeded, a custom event is dispatched:

```javascript
window.addEventListener('hierarchy:quota-exceeded', (event) => {
  console.warn('Quota exceeded:', event.detail)
  // Show user notification
})
```

### Invalid Input

All functions gracefully handle:
- `null` or `undefined` inputs
- Empty strings
- Invalid data types

Default behaviors:
- `getExpansionState(null)` → returns `true`
- `setExpansionState(null, true)` → returns `false`
- `buildHierarchyTree(null)` → returns `{ groups: {}, ungrouped: [] }`

---

## Common Patterns

### Pattern 1: Initialize Hierarchy on Page Load

```javascript
import { buildHierarchyTree, getAllGroups } from './utils/hierarchy-utils.js'
import { initHierarchyState, restoreExpansionState } from './src/ui/hierarchy-state.js'

// Initialize state management
initHierarchyState()

// Build tree
const tree = buildHierarchyTree(model.nodes)
const groups = getAllGroups(model.nodes)

// Restore saved states
const states = restoreExpansionState(groups)
```

### Pattern 2: Handle Group Click

```javascript
function onGroupClick(groupPath) {
  // Toggle state
  const newState = toggleExpansionState(groupPath)

  // Update UI
  const icon = document.querySelector(`[data-group="${groupPath}"] .hierarchy-expand-btn`)
  icon.textContent = newState ? '▼' : '▶'

  // Show/hide children
  const children = document.querySelector(`[data-group="${groupPath}"] + .children`)
  children.style.display = newState ? 'block' : 'none'
}
```

### Pattern 3: Render Tree

```javascript
function renderHierarchy(model, currentNodeId) {
  const tree = buildHierarchyTree(model.nodes)
  const groups = getAllGroups(model.nodes)
  const states = restoreExpansionState(groups)

  let html = '<div class="hierarchy-tree">'

  // Render groups
  for (const groupPath in tree.groups) {
    const group = tree.groups[groupPath]
    const isExpanded = states[groupPath] !== false

    html += `
      <div class="hierarchy-group" data-group="${groupPath}">
        <button class="hierarchy-expand-btn">${isExpanded ? '▼' : '▶'}</button>
        <span class="hierarchy-icon">📁</span>
        <span class="hierarchy-group-name">${group.name}</span>
        <span class="node-count">(${group.count})</span>
      </div>
    `

    if (isExpanded) {
      for (const node of group.nodes) {
        const isCurrent = node.id === currentNodeId
        html += `
          <div class="hierarchy-node ${isCurrent ? 'current-node' : ''}" data-node-id="${node.id}">
            <span class="hierarchy-icon">📄</span>
            <span class="hierarchy-node-name">${node.localId}</span>
            <span class="hierarchy-node-text">${node.text?.substring(0, 60)}</span>
          </div>
        `
      }
    }
  }

  html += '</div>'
  return html
}
```

### Pattern 4: Expand/Collapse All

```javascript
function setupToolbarButtons(groups) {
  document.getElementById('expandAll').addEventListener('click', () => {
    expandAll(groups)
    refreshHierarchyUI()
  })

  document.getElementById('collapseAll').addEventListener('click', () => {
    collapseAll(groups)
    refreshHierarchyUI()
  })
}
```

---

## Testing

### Run Unit Tests

```javascript
// In browser console
import './utils/hierarchy-utils.test.js'
import './src/ui/hierarchy-state.test.js'
```

### Manual Testing Checklist

- [ ] Build tree from model with groups
- [ ] Build tree from model without groups
- [ ] Toggle group expansion
- [ ] Expand all groups
- [ ] Collapse all groups
- [ ] Refresh page (verify state persists)
- [ ] Clear localStorage (verify defaults to expanded)
- [ ] Test with deeply nested groups (3+ levels)

---

## Performance Notes

- Tree building is O(n) where n = number of nodes
- Group lookups are O(1) using object keys
- Sorting is O(n log n)
- localStorage operations are synchronous (minimal overhead)

### Recommendations

- Cache tree structure when model doesn't change
- Rebuild only when nodes are added/removed/modified
- Use event delegation for click handlers
- Debounce expansion state saves if rapid toggling

---

## Browser Compatibility

- Requires ES6+ (arrow functions, const/let, template literals)
- localStorage API (all modern browsers)
- No polyfills needed for modern browsers
- Graceful degradation if localStorage unavailable

---

## Migration Guide

If upgrading from flat node list rendering:

1. Import new modules
2. Build tree on initialization
3. Replace flat render with hierarchical render
4. Add group click handlers
5. Restore expansion state on load

No breaking changes to existing code - these are additive utilities.

---

## Support & Questions

For issues or questions about the hierarchy system:

1. Check this API reference
2. Review examples in `hierarchy-integration-example.js`
3. Run unit tests for validation
4. Check browser console for errors

---

**Version:** Phase 2A
**Last Updated:** March 5, 2026
**Status:** Stable
