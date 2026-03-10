# OpenSpec: Node Hierarchy System
**Spec Version**: 1.1
**Status**: Design Complete ✅
**Priority**: High
**Target Release**: Q1 2026

## Overview

The current flat node structure requires all node IDs to be globally unique across the entire project, making it difficult to manage large narrative projects. This specification introduces a hierarchical folder system that allows local scoping of node IDs while maintaining backward compatibility.

## Problem Statement

### Current Issues
- **Global ID Constraint**: All node IDs must be unique across the entire project
- **Scalability**: Managing hundreds of nodes becomes cumbersome
- **Organization**: No logical grouping (chapters, quests, branches)
- **UI Complexity**: Flat lists are hard to navigate in large projects

### Impact
- Writers struggle with ID naming in large projects
- Code reviews become more complex
- Project maintenance costs increase
- User experience degrades with scale

## Solution Design

### Core Concept
Node Hierarchy is introduced as a **naming + resolution layer** for node identifiers.

**Phase 2 (CSV Integration)** keeps the existing JSON contract (`Model.nodes: Record<string, Node>`). Hierarchy is represented by using a **canonical node id string** as:

- `canonical_node_id = "<node_group>/<node_id>"`
- If `node_group` is empty (root), `canonical_node_id = "<node_id>"`

This allows the engine to stay unchanged while CSV import/export can support folder-like organization.

Future phases may introduce a dedicated `nodeGroups` structure for UI/authoring, but **it is not part of the Phase 2 runtime contract**.

Replace the flat `nodes: Record<string, Node>` authoring experience with a hierarchical folder system where:
- Node IDs are unique only within their group
- Groups can be nested (folders within folders)
- Full node paths are resolved dynamically

### Data Structures

```typescript
interface NodeGroup {
  id: string                    // Group identifier (unique within parent)
  name: string                  // Display name
  description?: string          // Optional description
  nodes: Record<string, Node>   // Nodes in this group
  subgroups?: Record<string, NodeGroup> // Nested groups
  metadata?: Record<string, any> // UI/layout metadata
}

interface HierarchicalModel extends Omit<Model, 'nodes'> {
  nodeGroups: Record<string, NodeGroup>
  rootGroup: string             // Root group ID
}
```

**Note**: The above interfaces are a *design reference for authoring/UI*. Phase 2 does **not** require the runtime JSON model to adopt these fields.

## Canonical Node ID (Phase 2 Contract)

### Definition

- **`node_group`**: slash-separated path (folder path), relative to root.
  - Example: `chapters/intro`, `chapters/main_quest/battlefield`
  - Root group is represented as an empty string.
- **`node_id`**: local node identifier, unique within the same `node_group`.
  - Must not contain `/`.
- **canonical node id**: string used as the node key in `Model.nodes` *and* the value of `NodeDef.id`.
  - Root: `start`
  - Non-root: `chapters/intro/start`

### JSON storage rule

When importing CSV with `node_group`, Phase 2 stores nodes in the existing schema:

- `model.nodes[canonicalId].id === canonicalId`
- `model.startNode` must be a canonical id as well
- `choice.target` / `goto.target` must be canonical ids

### Node Resolution

```typescript
// Example hierarchy:
// (folder-like view)
// root/
//   ├── chapters/
//   │   ├── intro/
//   │   │   ├── start
//   │   │   └── tutorial
//   │   └── main/
//   │       ├── battle
//   │       └── victory
//   └── side_quests/
//       └── shop_visit
//
// Canonical node ids (Phase 2 JSON / runtime)
// - chapters/intro/start
// - chapters/main/battle
// - side_quests/shop_visit

// In Phase 2, resolution rules mainly apply to CSV target strings.
```

## CSV Format Extension (Phase 2)

### Columns

- Existing format (legacy):
  - `node_id,node_text,choice_id,choice_text,choice_target,...`
- Extended format (Phase 2):
  - `node_group,node_id,node_text,choice_id,choice_text,choice_target,...`

### Extended Format (example)
```csv
node_group,node_id,node_text,choice_id,choice_text,choice_target
chapters/intro,start,Welcome...,learn,Learn basics,intro/tutorial
chapters/intro,tutorial,Tutorial...,back,Go back,start
chapters/main,battle,Battle scene...,fight,Fight,main/victory
```

### Target Resolution Rules (Phase 2)

When `node_group` is present, `choice_target` (and `goto:<target>` in effects) is resolved into a **canonical node id**.

- **Empty target**: treated as self-loop (`canonical(current)`)
- **Absolute target**: starts with `/`
  - Example: `/chapters/intro/start` → `chapters/intro/start`
- **Relative-to-parent target**: contains `/` but does not start with `/`, `./`, or `../`
  - Interpret as relative to the **parent folder** of the current `node_group` (equivalent to `../<target>`)
  - Example:
    - current `node_group = chapters/intro`
    - `choice_target = intro/tutorial` → `chapters/intro/tutorial`
- **Relative-to-current target**: starts with `./`
  - Example: `./tutorial` from `chapters/intro` → `chapters/intro/tutorial`
- **Relative-up target**: starts with `../` (may repeat)
  - Example: `../main/battle` from `chapters/intro` → `chapters/main/battle`
- **Local id**: does not contain `/` and does not start with `.`
  - Example: `tutorial` from `chapters/intro` → `chapters/intro/tutorial`

### Backward Compatibility

- If the CSV has no `node_group` column, the loader behaves as today:
  - `choice_target` is treated as a flat `node_id`.
- In Phase 2, engines and validators remain unchanged as long as the importer outputs canonical ids into the existing `Model.nodes` structure.

### Migration Path
- **Phase 1**: Support both formats (backward compatible)
- **Phase 2**: Add migration tool to convert flat → hierarchical
- **Phase 3**: Deprecate flat format with warnings
- **Phase 4**: Remove flat format support

## UI/UX Improvements

### Folder Tree Navigation
```text
📁 chapters/
├── 📁 intro/
│   ├── 📄 start
│   └── 📄 tutorial
├── 📁 main/
│   ├── 📄 battle
│   └── 📄 victory
└── 📁 side_quests/
    └── 📄 shop_visit
```

### Benefits
- **Search & Filter**: Search within specific groups
- **Drag & Drop**: Move nodes between groups
- **Visual Organization**: Clear project structure
- **Collaboration**: Team members work in separate branches

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- [x] Design data structures
- [x] Create TypeScript interfaces
- [x] Implement resolution functions
- [x] Design CSV extension format

### Phase 2: CSV Integration (Q1 2026)
- [ ] Extend CSV parser to handle `node_group` column
- [ ] Add group validation logic
- [ ] Implement import/export with hierarchy
- [ ] Add backward compatibility layer

### Phase 3: UI Implementation (Q1 2026)
- [ ] Implement folder tree component
- [ ] Add drag-and-drop functionality
- [ ] Update node editor for group context
- [ ] Enhance search with group filtering

### Phase 4: Migration & Polish (Q2 2026)
- [ ] Create migration tools
- [ ] Add comprehensive tests
- [ ] Update documentation
- [ ] Performance optimization

## Technical Considerations

### Performance
- **Lazy Loading**: Load node groups on demand
- **Caching**: Cache resolved node paths
- **Indexing**: Build efficient lookup tables

### Backward Compatibility (Design)
- **Dual Support**: Support both flat and hierarchical models
- **Migration Tools**: Automated conversion utilities
- **Graceful Degradation**: Fall back to flat mode for legacy models

### Validation
- **Group Integrity**: Ensure no circular references
- **ID Uniqueness**: Validate local uniqueness within groups
- **Path Resolution**: Verify all node references are resolvable

## Success Criteria

### Functional
- ✅ Node IDs are locally scoped within groups
- ✅ Large projects (>500 nodes) are manageable
- ✅ CSV import/export supports hierarchy
- ✅ UI provides intuitive folder navigation

### Non-Functional
- ✅ Backward compatibility maintained
- ✅ Performance impact <5% for small projects
- ✅ Migration path clearly defined
- ✅ Documentation updated

## Risk Assessment

### High Risk
- **Breaking Changes**: Migration could break existing projects
- **Complexity**: Increased code complexity in core engine

### Mitigation
- **Phased Rollout**: Gradual introduction with compatibility
- **Comprehensive Testing**: Extensive test coverage for migration
- **Rollback Plan**: Ability to revert to flat structure

## Dependencies

### Required
- TypeScript interfaces update
- CSV parser enhancement
- UI component development

### Optional
- Graph visualization updates
- Search functionality enhancement
- Collaboration features

## Related Specifications

- [Enhanced Text Formatting](enhanced-text-formatting-spec.md)
- [Visual Model Visualization](visual-model-spec.md)
- [GUI Editing Capabilities](gui-editing-spec.md)

---
**Spec Owner**: AI Assistant
**Reviewers**: Development Team
**Last Updated**: 2025-12-17
