# render() Call Audit — GraphEditorManager.js

Audited file: `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`
Audit date: 2026-03-16

## Background

`this.render()` triggers a full dagre re-layout, which recalculates all node
positions and can destroy custom positions set by the user via drag.
The safe alternative for selection-only changes is `_updateSelectionStyles()`,
which updates stroke colour/width on existing DOM nodes without touching layout.

Already fixed before this audit:
- Empty-space click (`svg.on('click')`) → `_updateSelectionStyles()`
- Escape key → `_updateSelectionStyles()`
- `_onNodeDragStart` → `_updateSelectionStyles()`

---

## Call Site Inventory

### Line 184 — `_setupResizeObserver` (ResizeObserver callback)

```
this.resizeDebounceTimer = setTimeout(() => {
  if (!this.container || !this.appState?.model) return
  this.render()          // <-- line 184
  this._updateMinimap()
}, this.resizeDebounceDelay)
```

**Trigger:** Container element is resized (debounced).
**Classification:** NEEDS REVIEW
**Rationale:** Resizing the container does not change graph structure or
selection state, but SVG dimensions and viewport calculations may need
refreshing. However, a full dagre re-layout is probably not required — the
graph could instead be re-fitted to the new viewport. If `fitToView()` +
`_updateMinimap()` is sufficient, the dagre pass is unnecessary. Worth
verifying whether render() is only needed here because fitToView is not
called automatically.
**Recommended action:** Investigate whether `fitToView()` + `_updateMinimap()`
alone satisfies the resize use case. If yes, replace `this.render()` with
`this.fitToView()` then `this._updateMinimap()`. If graph geometry (node
sizes) genuinely depends on the container, keep render() but document the
reason.

---

### Line 506 → already fixed (now `_updateSelectionStyles()`)

This call site was already converted before the audit. Listed for completeness;
no further action needed.

---

### Line 506 (current code) — `_renderGraph` edge click handler

```
this.selectedEdge = { from: e.v, to: e.w, choiceId: edge.choiceId }
this.selectedNodeId = null
// render()を呼ばない: dagre再レイアウトでノード位置が崩壊するため
this._updateSelectionStyles()   // <-- already fixed
```

**Trigger:** User clicks an edge.
**Classification:** (Already fixed — UNSAFE → converted to `_updateSelectionStyles()`)
**Recommended action:** None. Fixed.

---

### Line 776 — `_onNodeClick` (node click handler)

```
// Ctrlキー押下時の複数選択 / 通常の選択
this.selectedNodeId = nodeId
this.selectedNodeIds.clear()
this.selectedEdge = null
this.render()    // <-- line 776 (785 in actual file; closest render after selection logic)
```

*(Note: the render call appears at physical line 785 in the file. The grep
result at line 776 refers to the same logical block — the render is at 785.)*

**Trigger:** User clicks a node (single select or Ctrl+multi-select).
**Classification:** UNSAFE
**Rationale:** Only selection state changes (`selectedNodeId`, `selectedNodeIds`,
`selectedEdge`). No node or edge is added/removed from the model. A full dagre
re-layout will destroy any custom positions.
**Recommended action:** Replace `this.render()` with `this._updateSelectionStyles()`.
Note: the call also precedes a `guiEditorManager.selectNode()` sync call and a
double-click inline edit check. Neither of those requires a full render. The
`_updateSelectionStyles()` replacement is sufficient.

---

### Line 826 — `_addNodeAtPosition`

```
this.appState.model.nodes[nodeId] = newNode
// ...
this._syncWithGuiEditor()
this.render()    // <-- line 826
```

**Trigger:** User adds a new node via context menu / drag-to-create.
**Classification:** SAFE
**Rationale:** A new node was added to `appState.model.nodes`. The graph
structure has changed and the DOM must be rebuilt. dagre re-layout is correct
here because the new node has no position yet (unless `graphPosition` is set,
in which case dagre should honour it — but the full render path is still
required to insert the DOM element).
**Recommended action:** No change.

---

### Line 887 — `_deleteNode`

```
delete this.appState.model.nodes[nodeId]
// remove references in other nodes' choices
this._syncWithGuiEditor()
this.render()    // <-- line 887
```

**Trigger:** User deletes a single node.
**Classification:** SAFE
**Rationale:** Graph structure changed (node and potentially edges removed).
Full re-render is required.
**Recommended action:** No change.

---

### Line 926 — `_createEdge`

```
fromNode.choices.push(newChoice)
this._syncWithGuiEditor()
this.render()    // <-- line 926
```

**Trigger:** User creates a new edge (connection) between two nodes.
**Classification:** SAFE
**Rationale:** An edge was added to the model. dagre needs to re-route edges.
Full render is correct.
**Recommended action:** No change.

---

### Line 959 — `_deleteEdge`

```
fromNode.choices.splice(index, 1)
// ...
this._syncWithGuiEditor()
this.render()    // <-- line 959
```

**Trigger:** User deletes an edge.
**Classification:** SAFE
**Rationale:** Edge removed from model. Graph structure changed.
**Recommended action:** No change.

---

### Line 986 — `_editEdge`

```
if (newText !== null) {
  choice.text = newText
  this._syncWithGuiEditor()
  this.render()    // <-- line 986
}
```

**Trigger:** User edits edge label text via `prompt()`.
**Classification:** NEEDS REVIEW
**Rationale:** The edge label text changed but the graph topology did not.
However, changing a label may alter the SVG text element size, which could
affect edge routing and node layout in dagre. If edge labels affect dagre
weight/label dimensions, render() may be needed. If labels are purely cosmetic
overlays that do not feed into dagre, `_updateSelectionStyles()` plus a
targeted text-content update would be safer.
**Recommended action:** Check whether dagre receives label text as part of
layout input. If yes, keep render(). If no, replace with a targeted DOM text
update.

---

### Line 1139 (physically 1148) — `_saveInlineEdit`

```
node.text = textArea.value
// update choices text from inputs
this._cancelInlineEdit()
this._syncWithGuiEditor()
this.render()    // <-- line 1148
```

**Trigger:** User saves inline node editing (text + choice labels).
**Classification:** SAFE
**Rationale:** Node content changed. While this is a content edit rather than a
topology edit, the node text feeds into the node's rendered size (width/height
of the rect), which is recalculated in render(). Without a full render the node
box dimensions could be stale. Acceptable to keep render() here.
**Recommended action:** No change. Keep render() to ensure node box resizes
correctly after text change.

---

### Line 1255 (inside `reset()`, physically 1264) — `reset()`

```
reset() {
  this.render()    // <-- line 1264
}
```

**Trigger:** `reset()` is called explicitly to force a full dagre re-layout.
**Classification:** SAFE (by design)
**Rationale:** `reset()` is a deliberate "re-layout everything" operation. The
method name and JSDoc comment ("レイアウトをリセット（再計算）") confirm this is
intentional.
**Recommended action:** No change. Consider renaming to `resetLayout()` to make
intent clearer and distinguish it from selection-reset operations.

---

### Line 1434 (physically 1443) — `_selectAllNodes`

```
Object.keys(this.appState.model.nodes).forEach(nodeId => {
  this.selectedNodeIds.add(nodeId)
})
this.render()    // <-- line 1443
```

**Trigger:** User presses Ctrl+A (select all nodes).
**Classification:** UNSAFE
**Rationale:** Only selection state changes. No structural change to the model.
This is exactly analogous to the single-node click case.
**Recommended action:** Replace `this.render()` with `this._updateSelectionStyles()`.

---

### Line 1487 (physically 1496) — `_deleteMultipleNodes`

```
this.selectedNodeIds.forEach(nodeId => {
  delete this.appState.model.nodes[nodeId]
})
// remove dangling choice references
this._clearSelection()
this._syncWithGuiEditor()
this.render()    // <-- line 1496
```

**Trigger:** User deletes multiple selected nodes (Delete key or context menu).
**Classification:** SAFE
**Rationale:** Multiple nodes removed from model. Graph structure changed.
**Recommended action:** No change.

---

### Line 1542 (physically 1551) — `duplicateSelectedNodes`

```
this.appState.model.nodes[newNodeId] = newNode
// ...
this._syncWithGuiEditor()
this.render()    // <-- line 1551
```

**Trigger:** User duplicates selected nodes.
**Classification:** SAFE
**Rationale:** New nodes added to model. Graph structure changed.
**Recommended action:** No change. Note: duplicated nodes have `graphPosition`
copied from originals (shifted by +20,+20). Verify that render() honours
pre-existing `graphPosition` values so duplicated nodes land at the expected
offset rather than being re-placed by dagre's auto-layout.

---

### Line 1561 (physically 1570) — `setPanMode`

```
setPanMode(active) {
  this.isPanMode = active
  // ...
  if (active) {
    this._clearSelection()
    this.render() // 再描画してドラッグ動作フィルタを適用
  }
}
```

**Trigger:** Pan mode is activated (toolbar button or keyboard shortcut).
**Classification:** UNSAFE
**Rationale:** `_clearSelection()` only resets selection state variables (sets
them to null/empty). No structural model change occurs. The comment says
"apply drag behaviour filter", but that filter is applied via `this.isPanMode`
which is read during event handlers — not during render. A full dagre
re-layout is not needed to switch interaction mode.
**Recommended action:** Replace `this.render()` with `this._updateSelectionStyles()`.
The `isPanMode` flag will still be checked correctly during subsequent drag/click
events.

---

### Line 1982 (physically 1991) — `_revertMoveNodes` (Undo)

```
moveData.forEach(item => {
  this.appState.model.nodes[item.nodeId].graphPosition = { ...item.from }
})
// ...
this._syncWithGuiEditor()
this._updateMinimap()
this.render()    // <-- line 1991
```

**Trigger:** User triggers Undo (Ctrl+Z) for a node move operation.
**Classification:** SAFE
**Rationale:** `graphPosition` values in the model were changed. The nodes must
be repositioned on the canvas to reflect the reverted positions. render() is
the correct mechanism here (assuming render() honours `graphPosition`). Note:
the intent is to restore positions, not run a fresh dagre auto-layout. Verify
that `graphPosition` overrides dagre positioning in the render path; if it
does not, undo will not correctly restore positions.
**Recommended action:** Keep render(). Verify that `graphPosition` is respected
in the dagre initialisation step of render(). This is a known risk point.

---

### Line 2005 (physically 2014) — `_applyMoveNodes` (Redo)

```
moveData.forEach(item => {
  this.appState.model.nodes[item.nodeId].graphPosition = { ...item.to }
})
// ...
this._syncWithGuiEditor()
this._updateMinimap()
this.render()    // <-- line 2014
```

**Trigger:** User triggers Redo (Ctrl+Y / Ctrl+Shift+Z) for a node move.
**Classification:** SAFE (same caveats as `_revertMoveNodes`)
**Rationale:** `graphPosition` values updated. Same analysis as line 1991.
**Recommended action:** Same as line 1991. Keep render(). Verify `graphPosition`
is seeded into dagre correctly.

---

### Line 2477 — `_onSelectionDragEnd` (rubber-band selection)

```
// Intersect nodes within lasso rectangle → add to selectedNodeIds
this.selectedNodeIds.add(d)
// ...
this.render()    // <-- line 2477
```

**Trigger:** User finishes a rubber-band (lasso) selection drag on the canvas.
**Classification:** UNSAFE
**Rationale:** Only `selectedNodeIds` changes. No model structure change. This
is the same pattern as `_selectAllNodes` (line 1443) and `_onNodeClick`
(line 785).
**Recommended action:** Replace `this.render()` with `this._updateSelectionStyles()`.

---

## Summary Table

| Line | Method | Trigger | Classification | Action |
|------|--------|---------|----------------|--------|
| 184 | `_setupResizeObserver` | Container resize | NEEDS REVIEW | Consider `fitToView()` + `_updateMinimap()` |
| 506 | edge click (in `_renderGraph`) | Edge click | *(already fixed)* | None |
| 785 | `_onNodeClick` | Node click / Ctrl+click | **UNSAFE** | Replace with `_updateSelectionStyles()` |
| 826 | `_addNodeAtPosition` | Add node | SAFE | No change |
| 887 | `_deleteNode` | Delete single node | SAFE | No change |
| 926 | `_createEdge` | Create edge | SAFE | No change |
| 959 | `_deleteEdge` | Delete edge | SAFE | No change |
| 986 | `_editEdge` | Edit edge label | NEEDS REVIEW | Check if label feeds dagre layout |
| 1148 | `_saveInlineEdit` | Save inline node edit | SAFE | No change |
| 1264 | `reset()` | Explicit re-layout request | SAFE (by design) | Consider rename to `resetLayout()` |
| 1443 | `_selectAllNodes` | Ctrl+A | **UNSAFE** | Replace with `_updateSelectionStyles()` |
| 1496 | `_deleteMultipleNodes` | Delete selected nodes | SAFE | No change |
| 1551 | `duplicateSelectedNodes` | Duplicate nodes | SAFE | Verify `graphPosition` honoured |
| 1570 | `setPanMode` | Pan mode on | **UNSAFE** | Replace with `_updateSelectionStyles()` |
| 1991 | `_revertMoveNodes` | Undo node move | SAFE | Verify `graphPosition` seeds dagre |
| 2014 | `_applyMoveNodes` | Redo node move | SAFE | Verify `graphPosition` seeds dagre |
| 2477 | `_onSelectionDragEnd` | Rubber-band selection | **UNSAFE** | Replace with `_updateSelectionStyles()` |

### Counts
- SAFE: 9
- UNSAFE (fix needed): 4 (lines 785, 1443, 1570, 2477)
- NEEDS REVIEW: 2 (lines 184, 986)
- Already fixed: 1 (line 506 / edge click)

### Priority order for fixes
1. **Line 785 `_onNodeClick`** — highest-frequency user interaction; every single node click triggers unnecessary re-layout.
2. **Line 2477 `_onSelectionDragEnd`** — rubber-band selection ends with re-layout; positions visibly jump after each lasso.
3. **Line 1443 `_selectAllNodes`** — Ctrl+A triggers re-layout; all custom positions are destroyed.
4. **Line 1570 `setPanMode`** — less frequent, but still incorrect; clear-selection + render() destroys positions on mode switch.
5. **Line 184 `_setupResizeObserver`** — investigate whether a viewport-only update suffices.
6. **Line 986 `_editEdge`** — lower risk; depends on whether edge labels affect dagre sizing.
