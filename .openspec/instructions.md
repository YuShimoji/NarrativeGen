# NarrativeGen OpenSpec Instructions

## Project Overview
NarrativeGen is an interactive story engine that allows users to create, edit, and test narrative models through multiple interfaces.

## Components
- **engine-ts**: Core TypeScript runtime engine for story execution
- **web-tester**: Web-based testing and editing interface
- **sdk-unity**: Unity integration SDK

## Current Specifications
- Model execution with state management (flags, resources)
- GUI model editing in web-tester
- CSV import/export for model data
- AI-assisted content generation
- Virtual scrolling for long stories
- Error validation for models

## Development Principles
- Specification-driven development using OpenSpec
- Tiered permissions: Tier 1 (low risk) for autonomous execution
- Pre-flight checks for all operations
- Comprehensive logging and monitoring

## Priority Features
1. **Node Hierarchy System** (High Priority - Q1 2026)
   - **Status**: Design Phase Complete ✅
   - **Goal**: Organize nodes in hierarchical folder structure to eliminate global ID constraints
   - **Current Issue**: All node IDs must be globally unique across entire project
   - **Solution**: Implement NodeGroup system with local scoping
   - **Benefits**:
     - Easier management of large story projects
     - Logical organization (chapters, quests, etc.)
     - Improved UI navigation with folder trees
   - **Implementation Plan**:
     - Phase 1: Data structure design ✅
     - Phase 2: CSV format extension with `node_group` column
     - Phase 3: UI folder tree implementation
     - Phase 4: Migration tools and backward compatibility

2. **Enhanced Text Formatting** (Medium Priority - Q1 2026)
   - **Status**: Implementation Complete ✅
   - **Goal**: Improve story text display with proper paragraph formatting
   - **Solution**: HTML-based rendering with CSS styling for better readability
   - **Features**: Automatic paragraph breaks, improved typography, responsive design

3. **main.js Refactoring (Phase 2)** (High Priority - Immediate)
   - **Status**: In Progress 🔄
   - **Goal**: Complete modularization of main.js for better maintainability
   - **Current State**: Phase 1 complete (handlers/, utils/ separation)
   - **Remaining Tasks**:
     - Create `handlers/nodes-panel.js` (renderNodeOverview, jumpToNode, highlightNode)
     - Create `handlers/tabs.js` (switchTab, tab event management)
     - Create `handlers/gui-editor.js` (GUI editing mode logic)
   - **Expected Outcome**: main.js < 1000 lines, clear separation of concerns

4. **CI/CD Stabilization** (High Priority - Q1 2026)
   - **Status**: Pending ⏳
   - **Issues**: web-tester lint/build failures, Unity license requirements
   - **Solutions**: ESLint/Prettier config unification, dependency lock management

5. Visual model visualization (graph view)
6. Enhanced GUI editing capabilities
7. Testing framework improvements

## Critical Blind Spots & Strategic Improvements

### Architectural Blind Spots
- **State Management Centralization**: Replace global variables with Zustand/Redux Toolkit
- **Unified Error Handling**: Implement structured error classes (ValidationError, NetworkError, UserError)
- **Event-Driven Communication**: Replace DOM manipulation with custom event system

### User Experience Blind Spots
- **Progressive UX Design**: Implement beginner/intermediate/advanced modes
- **Real-time Feedback**: Add live syntax checking and preview
- **Collaboration Features**: Add simultaneous editing and review workflows

### Technical Blind Spots
- **Security Hardening**: Encrypt API keys, implement CSP, sandbox execution
- **Performance Scalability**: Web Workers for heavy processing, advanced virtualization
- **Comprehensive Testing**: E2E tests with Playwright, visual regression testing

### Business Blind Spots
- **Market Positioning**: Specialize in educational interactive novels or game prototyping
- **Monetization Models**: SaaS platform, enterprise features, template marketplace
- **Community Building**: Showcase gallery, Discord community, tutorial workshops

### Innovation Opportunities
- **AI Emotional Analysis**: Automatic emotion curve analysis for stories
- **Dynamic Branching**: Real-time story generation based on player actions
- **Visual Programming**: No-code development environment for narrative design

## Development Roadmap

### Phase 1: Foundation Strengthening (Immediate - 1 week)
1. Error handling unification (1 day)
2. State management library introduction (2-3 days)
3. Security enhancements (1-2 days)
4. Complete main.js modularization (2-3 days)

### Phase 2: UX Enhancement (Q1 2026 - 4 weeks)
1. Progressive interface design (2 weeks)
2. Real-time feedback systems (1 week)
3. Performance optimizations (1 week)
4. Node hierarchy Phase 2 implementation (2 weeks)

### Phase 3: Scalability & Collaboration (Q2 2026 - 6 weeks)
1. Plugin architecture foundation (3 weeks)
2. Collaboration features (3 weeks)
3. Testing automation enhancement (2 weeks)
4. CI/CD stabilization (1-2 weeks)

### Phase 4: Business Expansion (Q3 2026 - 8 weeks)
1. SaaS platform development (6 weeks)
2. Community building initiatives (ongoing)
3. Monetization model establishment (2 weeks)

## Quality Metrics
- **Code Quality**: Test coverage >80%, ESLint zero warnings
- **Performance**: 100+ node models perform smoothly
- **Maintainability**: main.js <1000 lines, clear module boundaries
- **User Experience**: <30 second learning curve for basic features
