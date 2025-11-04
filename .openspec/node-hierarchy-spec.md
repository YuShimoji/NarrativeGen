# OpenSpec: Node Hierarchy System
**Spec Version**: 1.0
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
Replace the flat `nodes: Record<string, Node>` structure with a hierarchical `nodeGroups: Record<string, NodeGroup>` system where:
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

### Node Resolution

```typescript
// Example hierarchy:
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

// Local IDs (unique within group)
resolveNodeId(model, "start", ["chapters", "intro"])     // → "chapters.intro.start"
resolveNodeId(model, "battle", ["chapters", "main"])     // → "chapters.main.battle"

// Full paths
resolveNodeId(model, "chapters.intro.start")             // → "chapters.intro.start"
resolveNodeId(model, "chapters.main.battle")             // → "chapters.main.battle"
```

## CSV Format Extension

### Current Format
```csv
node_id,node_text,choice_id,choice_text,choice_target
start,Welcome...,learn,Learn basics,intro/tutorial
tutorial,Tutorial...,back,Go back,start
```

### Extended Format
```csv
node_group,node_id,node_text,choice_id,choice_text,choice_target
chapters/intro,start,Welcome...,learn,Learn basics,intro/tutorial
chapters/intro/tutorial,tutorial,Tutorial...,back,Go back,start
chapters/main,battle,Battle scene...,fight,Fight,main/victory
```

### Migration Path
- **Phase 1**: Support both formats (backward compatible)
- **Phase 2**: Add migration tool to convert flat → hierarchical
- **Phase 3**: Deprecate flat format with warnings
- **Phase 4**: Remove flat format support

## UI/UX Improvements

### Folder Tree Navigation
```
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

### Backward Compatibility
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
**Last Updated**: 2025-10-31
