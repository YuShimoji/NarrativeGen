# Tree View Quick Start Guide

This guide helps you quickly integrate and use the hierarchical tree view for nodes.

---

## Quick Demo

**Try it now:**
```bash
# Open the demo in your browser
open apps/web-tester/tests/hierarchy-tree-view-demo.html
```

---

## 5-Minute Integration

### Step 1: Import the Handler

```javascript
import { initNodesPanel } from './handlers/nodes-panel.js';
```

### Step 2: Initialize with Dependencies

```javascript
const nodesPanel = initNodesPanel({
  getModel: () => yourModel,
  setModel: (m) => { yourModel = m; },
  getSession: () => yourSession,
  setSession: (s) => { yourSession = s; },
  setStatus: (msg, type) => console.log(msg),
  renderGraph: () => { /* optional */ },
  renderState: () => { /* optional */ },
  renderChoices: () => { /* optional */ },
  initStory: () => { /* optional */ },
  renderStoryEnhanced: () => { /* optional */ },
  nodeOverview: document.getElementById('your-container'),
  storyView: document.getElementById('story-container')
});
```

### Step 3: Render the Tree

```javascript
nodesPanel.renderNodeOverview(); // Auto-detects view mode (tree/grid/list)
// OR
nodesPanel.renderNodeTreeView(); // Force tree view
```

### Step 4: Expose Jump Function (for onclick handlers)

```javascript
window.jumpToNode = (nodeId) => nodesPanel.jumpToNode(nodeId);
```

---

## Node Data Format

Nodes should have a `group` property for hierarchy:

```javascript
{
  nodes: {
    'chapter1/scene1/node1': {
      id: 'chapter1/scene1/node1',
      localId: 'node1',              // Optional: display name
      group: 'chapter1/scene1',       // Required for hierarchy
      text: 'Your narrative text...',
      choices: [ /* ... */ ]
    }
  }
}
```

**Group Path Format:**
- Use forward slashes `/` to create hierarchy
- `chapter1` - Root level group
- `chapter1/scene1` - Nested group under chapter1
- `chapter1/scene1/intro` - Third level

**Ungrouped Nodes:**
- Set `group: null` or omit the property
- Appear at root level after grouped nodes

---

## View Modes

### Tree View
- Hierarchical display with folders
- Expand/collapse groups
- Auto-expand on search

### Grid View
- Card-based layout
- Shows all nodes flat
- Good for quick scanning

### List View
- Compact list format
- Minimal styling
- Fast rendering

**Switch modes programmatically:**
```javascript
localStorage.setItem('ng_node_view_mode', 'tree');
nodesPanel.renderNodeOverview();
```

---

## Search

Tree view search is smart:
- Searches node ID, localId, text, and group
- Auto-expands groups containing matches
- Auto-expands parent groups for visibility
- Highlights matching nodes

**Programmatic search:**
```javascript
// Set search term
const searchInput = document.querySelector('#nodeSearch');
searchInput.value = 'forest';
searchInput.dispatchEvent(new Event('input'));
```

---

## Styling

### Include CSS Files

```html
<link rel="stylesheet" href="./src/styles/main.css" />
<link rel="stylesheet" href="./src/styles/hierarchy.css" />
```

### Custom Styling

Override CSS variables:
```css
:root {
  --color-primary: #your-color;
  --color-surface: #your-bg;
  /* See main.css for all variables */
}
```

### Custom Icons

Replace emoji icons:
```javascript
// In renderTreeGroup() and renderTreeNode()
icon.textContent = '📁'; // Change to your icon
```

---

## Common Tasks

### Expand All Groups
```javascript
import { expandAll, getAllGroups } from './utils/hierarchy-utils.js';

const groups = getAllGroups(Object.values(model.nodes));
expandAll(groups);
nodesPanel.renderNodeTreeView();
```

### Collapse All Groups
```javascript
import { collapseAll, getAllGroups } from './utils/hierarchy-utils.js';

const groups = getAllGroups(Object.values(model.nodes));
collapseAll(groups);
nodesPanel.renderNodeTreeView();
```

### Jump to Specific Node
```javascript
nodesPanel.jumpToNode('chapter1/scene1/node1');
```

### Get Current View Mode
```javascript
const viewMode = localStorage.getItem('ng_node_view_mode') || 'grid';
```

### Clear Expansion State
```javascript
import { clearExpansionState } from './src/ui/hierarchy-state.js';
clearExpansionState();
```

---

## Troubleshooting

### Tree View Not Showing
1. Check CSS is loaded: `<link rel="stylesheet" href="./src/styles/hierarchy.css">`
2. Check container exists: `document.getElementById('your-container')`
3. Check model has nodes with groups
4. Check view mode: `localStorage.getItem('ng_node_view_mode')`

### Groups Not Expanding
1. Check localStorage is enabled
2. Check expansion state: `getExpansionState('group/path')`
3. Clear state if corrupted: `clearExpansionState()`

### Search Not Working
1. Check search input event listener is attached
2. Verify nodes have searchable text
3. Check console for errors

### Jump Not Working
1. Ensure `window.jumpToNode` is defined
2. Check node ID exists in model
3. Verify session state structure

---

## Performance Tips

1. **Large Hierarchies (1000+ nodes)**
   - Keep most groups collapsed initially
   - Use search to find specific nodes
   - Consider pagination for very large trees

2. **Deep Nesting (5+ levels)**
   - Limit visual depth with CSS
   - Add horizontal scrolling if needed
   - Consider flattening hierarchy

3. **Frequent Updates**
   - Batch updates before re-rendering
   - Use state management to track changes
   - Avoid unnecessary re-renders

---

## Example: Complete Setup

```javascript
import { initNodesPanel } from './handlers/nodes-panel.js';

// Your model with hierarchical nodes
const model = {
  nodes: {
    'tutorial': {
      id: 'tutorial',
      text: 'Welcome!',
      choices: []
    },
    'chapter1/intro': {
      id: 'chapter1/intro',
      group: 'chapter1',
      text: 'Chapter 1 begins...',
      choices: []
    },
    'chapter1/scene1': {
      id: 'chapter1/scene1',
      group: 'chapter1',
      text: 'Scene 1...',
      choices: []
    }
  }
};

// Your session
const session = {
  state: {
    nodeId: 'tutorial'
  }
};

// Initialize
const nodesPanel = initNodesPanel({
  getModel: () => model,
  setModel: (m) => { model = m; },
  getSession: () => session,
  setSession: (s) => { session = s; },
  setStatus: (msg, type) => console.log(`[${type}] ${msg}`),
  renderGraph: () => {},
  renderState: () => {},
  renderChoices: () => {},
  initStory: () => {},
  renderStoryEnhanced: () => {},
  nodeOverview: document.getElementById('node-container'),
  storyView: document.getElementById('story')
});

// Render
nodesPanel.renderNodeOverview();

// Expose for onclick handlers
window.jumpToNode = (id) => nodesPanel.jumpToNode(id);
```

---

## API Quick Reference

| Function | Description |
|----------|-------------|
| `renderNodeTreeView()` | Render hierarchical tree view |
| `renderNodeOverview()` | Render current view mode (tree/grid/list) |
| `jumpToNode(id)` | Navigate to specific node |
| `highlightNode(id)` | Highlight node without navigation |
| `clearHighlights()` | Remove all highlights |

**From hierarchy-utils.js:**
| Function | Description |
|----------|-------------|
| `buildHierarchyTree(nodes)` | Build tree structure from flat nodes |
| `getAllGroups(nodes)` | Get all unique group paths |
| `getGroupChildren(nodes, path)` | Get nodes in specific group |
| `getParentGroup(path)` | Get parent group path |

**From hierarchy-state.js:**
| Function | Description |
|----------|-------------|
| `getExpansionState(path)` | Check if group is expanded |
| `setExpansionState(path, bool)` | Set group expansion state |
| `expandAll(groups)` | Expand all groups |
| `collapseAll(groups)` | Collapse all groups |

---

## Next Steps

1. Try the demo: `tests/hierarchy-tree-view-demo.html`
2. Read full docs: `docs/PHASE-2B-TREE-VIEW-IMPLEMENTATION.md`
3. Check Phase 2A docs: `docs/PHASE-2A-FOUNDATION.md` (if available)
4. Explore source: `handlers/nodes-panel.js`

---

**Questions?** Check the implementation report or source code comments.
