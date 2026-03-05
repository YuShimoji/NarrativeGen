/**
 * Nodes Panel Handler - Manages node overview, search, and navigation
 *
 * Provides node listing, searching, jumping to nodes, and highlighting.
 * Supports node deletion and choice management in edit mode. Integrates
 * with GUI editor for model updates during editing.
 *
 * @module handlers/nodes-panel
 */

// Import hierarchy utilities
import {
  buildHierarchyTree,
  getAllGroups,
  getGroupChildren,
  getChildGroups,
  getParentGroup,
  getGroupDisplayName
} from '../utils/hierarchy-utils.js';

import {
  getExpansionState,
  setExpansionState,
  expandAll,
  collapseAll,
  restoreExpansionState
} from '../src/ui/hierarchy-state.js';

import { escapeHtml, clearContent } from '../src/utils/html-utils.js';

/**
 * Initialize Nodes Panel handler with dependency injection
 *
 * Sets up node overview rendering with search/filter, node jumping,
 * and highlighting capabilities. Optionally integrates with GUI editor
 * for edit mode operations.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.setModel - Update narrative model
 * @param {Function} deps.getSession - Get current game session
 * @param {Function} deps.setSession - Update game session
 * @param {Function} deps.setStatus - Display status message
 * @param {Function} deps.renderGraph - Render narrative graph
 * @param {Function} deps.renderState - Re-render game state display
 * @param {Function} deps.renderChoices - Re-render choice buttons
 * @param {Function} deps.initStory - Initialize story log
 * @param {Function} deps.renderStoryEnhanced - Render formatted story
 * @param {HTMLElement} deps.nodeOverview - Node overview container
 * @param {HTMLInputElement} deps.nodeSearch - Node search input (optional)
 * @param {HTMLElement} deps.storyView - Story view element
 * @returns {Object} Handler public API
 * @returns {Function} returns.renderNodeOverview - Render searchable node list
 * @returns {Function} returns.renderNodeList - Render editable node list (edit mode)
 * @returns {Function} returns.highlightNode - Highlight specific node
 * @returns {Function} returns.jumpToNode - Jump to and load node
 * @returns {Function} returns.renderChoicesForNode - Render node's choices
 * @returns {Function} returns.setupNodeListEvents - Setup edit mode event handlers
 * @returns {Function} returns.clearHighlights - Clear node highlights
 * @returns {Function} returns.setGuiEditor - Set GUI editor reference for edit mode
 *
 * @example
 * const handler = initNodesPanel({
 *   getModel: () => model,
 *   setModel: (m) => model = m,
 *   nodeOverview: document.getElementById('node-list'),
 *   // ... other dependencies
 * });
 * handler.renderNodeOverview();
 * handler.jumpToNode('node-id');
 */
export function initNodesPanel(deps) {
  const {
    getModel,
    setModel,
    getSession,
    setSession,
    setStatus,
    renderGraph,
    renderState,
    renderChoices,
    initStory,
    renderStoryEnhanced,
    nodeOverview,
    nodeSearch,
    storyView
    // guiEditor removed from deps
  } = deps;

  let guiEditor = null; // Will be set later

  let currentSearchTerm = '';
  let lastHighlightedNode = null;
  let currentViewMode = 'grid'; // 'grid', 'tree', 'list'

  /**
   * Clear all node highlights from the overview
   *
   * @returns {void}
   * @private
   */
  function clearHighlights() {
    const allNodes = nodeOverview.querySelectorAll('.node-item');
    allNodes.forEach(node => {
      node.classList.remove('highlighted');
      node.style.backgroundColor = '';
    });
    lastHighlightedNode = null;
  }

  /**
   * Render a single node in the tree view
   *
   * @param {Object} node - Node object
   * @param {number} depth - Nesting depth level
   * @returns {HTMLElement} Node element
   * @private
   */
  function renderTreeNode(node, depth) {
    const session = getSession();
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'hierarchy-node';
    nodeDiv.style.paddingLeft = `${depth * 20 + 20}px`;
    nodeDiv.dataset.nodeId = node.id;

    // Highlight current node
    if (session?.state?.nodeId === node.id) {
      nodeDiv.classList.add('current-node');
      nodeDiv.style.backgroundColor = '#e3f2fd';
    }

    // File icon
    const icon = document.createElement('span');
    icon.className = 'hierarchy-icon';
    icon.textContent = '📄';
    icon.style.marginRight = '6px';
    nodeDiv.appendChild(icon);

    // Node name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'hierarchy-node-name';
    nameSpan.textContent = escapeHtml(node.localId || node.id);
    nameSpan.style.fontWeight = '500';
    nameSpan.style.marginRight = '8px';
    nodeDiv.appendChild(nameSpan);

    // Node text preview
    if (node.text) {
      const textSpan = document.createElement('span');
      textSpan.className = 'hierarchy-node-text';
      textSpan.textContent = escapeHtml(node.text.substring(0, 40));
      textSpan.style.color = 'var(--color-text-muted)';
      textSpan.style.fontSize = '11px';
      textSpan.style.marginRight = '8px';
      nodeDiv.appendChild(textSpan);
    }

    // Jump button
    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'btn-small jump-btn';
    jumpBtn.textContent = 'Jump';
    jumpBtn.style.marginLeft = 'auto';
    jumpBtn.onclick = (e) => {
      e.stopPropagation();
      jumpToNode(node.id);
    };
    nodeDiv.appendChild(jumpBtn);

    // Make node clickable
    nodeDiv.style.cursor = 'pointer';
    nodeDiv.style.display = 'flex';
    nodeDiv.style.alignItems = 'center';
    nodeDiv.style.padding = '4px 8px';
    nodeDiv.style.borderRadius = 'var(--radius-sm)';
    nodeDiv.style.marginBottom = '2px';

    nodeDiv.addEventListener('mouseenter', () => {
      if (session?.state?.nodeId !== node.id) {
        nodeDiv.style.backgroundColor = 'var(--color-hover)';
      }
    });

    nodeDiv.addEventListener('mouseleave', () => {
      if (session?.state?.nodeId !== node.id) {
        nodeDiv.style.backgroundColor = '';
      }
    });

    nodeDiv.addEventListener('click', (e) => {
      if (e.target === nodeDiv || e.target === nameSpan || e.target === textSpan || e.target === icon) {
        jumpToNode(node.id);
      }
    });

    return nodeDiv;
  }

  /**
   * Render a group in the tree view with children
   *
   * @param {string} groupPath - Group path to render
   * @param {Array} nodes - All nodes array
   * @param {number} depth - Nesting depth level
   * @returns {HTMLElement} Group container element
   * @private
   */
  function renderTreeGroup(groupPath, nodes, depth) {
    const children = getGroupChildren(nodes, groupPath);
    const allGroups = getAllGroups(nodes);
    const childGroups = getChildGroups(allGroups, groupPath);
    const isExpanded = getExpansionState(groupPath);

    // Create container for entire group
    const container = document.createElement('div');
    container.className = 'hierarchy-group-container';
    container.dataset.group = groupPath;

    // Create group header
    const groupDiv = document.createElement('div');
    groupDiv.className = 'hierarchy-group';
    groupDiv.style.paddingLeft = `${depth * 20}px`;
    groupDiv.style.display = 'flex';
    groupDiv.style.alignItems = 'center';
    groupDiv.style.padding = '4px 8px';
    groupDiv.style.borderRadius = 'var(--radius-sm)';
    groupDiv.style.cursor = 'pointer';
    groupDiv.style.marginBottom = '2px';
    groupDiv.dataset.group = groupPath;

    // Add expand button if has children
    if (childGroups.length > 0 || children.length > 0) {
      const expandBtn = document.createElement('button');
      expandBtn.className = 'hierarchy-expand-btn';
      expandBtn.textContent = isExpanded ? '▼' : '▶';
      expandBtn.style.background = 'none';
      expandBtn.style.border = 'none';
      expandBtn.style.color = 'var(--color-text-muted)';
      expandBtn.style.cursor = 'pointer';
      expandBtn.style.fontSize = '10px';
      expandBtn.style.width = '16px';
      expandBtn.style.height = '16px';
      expandBtn.style.display = 'flex';
      expandBtn.style.alignItems = 'center';
      expandBtn.style.justifyContent = 'center';
      expandBtn.style.marginRight = '4px';
      expandBtn.dataset.group = groupPath;
      groupDiv.appendChild(expandBtn);
    } else {
      // Spacer for alignment
      const spacer = document.createElement('span');
      spacer.style.width = '16px';
      spacer.style.marginRight = '4px';
      groupDiv.appendChild(spacer);
    }

    // Add folder icon
    const icon = document.createElement('span');
    icon.className = 'hierarchy-icon';
    icon.textContent = '📁';
    icon.style.marginRight = '6px';
    groupDiv.appendChild(icon);

    // Add group name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'hierarchy-group-name';
    nameSpan.textContent = getGroupDisplayName(groupPath);
    nameSpan.style.fontWeight = '600';
    nameSpan.style.marginRight = '8px';
    groupDiv.appendChild(nameSpan);

    // Add count
    const countSpan = document.createElement('span');
    countSpan.className = 'node-count';
    countSpan.textContent = `(${children.length})`;
    countSpan.style.color = 'var(--color-text-muted)';
    countSpan.style.fontSize = '11px';
    groupDiv.appendChild(countSpan);

    // Hover effect
    groupDiv.addEventListener('mouseenter', () => {
      groupDiv.style.backgroundColor = 'var(--color-hover)';
    });

    groupDiv.addEventListener('mouseleave', () => {
      groupDiv.style.backgroundColor = '';
    });

    container.appendChild(groupDiv);

    // Render children if expanded
    if (isExpanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'hierarchy-children';

      // Render child groups first
      childGroups.forEach(childPath => {
        childrenContainer.appendChild(renderTreeGroup(childPath, nodes, depth + 1));
      });

      // Render nodes
      children.forEach(node => {
        childrenContainer.appendChild(renderTreeNode(node, depth + 1));
      });

      container.appendChild(childrenContainer);
    }

    return container;
  }

  /**
   * Render node tree view with hierarchy
   *
   * Displays nodes in a hierarchical tree structure with groups,
   * expand/collapse functionality, and proper indentation.
   *
   * @returns {void}
   */
  function renderNodeTreeView() {
    const _model = getModel();
    const session = getSession();
    if (!_model?.nodes || !nodeOverview) return;

    const nodes = Object.values(_model.nodes);
    const allGroups = getAllGroups(nodes);

    // Clear container
    clearContent(nodeOverview);

    // Create header with controls
    const headerDiv = document.createElement('div');
    headerDiv.className = 'node-overview-header';
    headerDiv.style.padding = '12px 16px';
    headerDiv.style.background = 'var(--color-surface)';
    headerDiv.style.borderBottom = '1px solid var(--color-border)';
    headerDiv.style.display = 'flex';
    headerDiv.style.flexDirection = 'column';
    headerDiv.style.gap = '8px';

    // Title and view controls
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.alignItems = 'center';

    const title = document.createElement('h3');
    title.textContent = `Node Overview (${nodes.length} nodes)`;
    title.style.margin = '0';
    title.style.fontSize = '13px';
    titleRow.appendChild(title);

    // View mode controls
    const viewControls = document.createElement('div');
    viewControls.className = 'view-mode-controls';
    viewControls.style.display = 'flex';
    viewControls.style.gap = '8px';
    viewControls.style.alignItems = 'center';

    // View mode selector
    const viewLabel = document.createElement('label');
    viewLabel.textContent = 'View: ';
    viewLabel.style.fontSize = '12px';
    viewLabel.style.marginRight = '4px';

    const viewSelect = document.createElement('select');
    viewSelect.id = 'viewModeSelect';
    viewSelect.style.fontSize = '12px';
    viewSelect.innerHTML = `
      <option value="tree">Tree View</option>
      <option value="grid">Grid View</option>
      <option value="list">List View</option>
    `;
    viewSelect.value = currentViewMode;

    viewLabel.appendChild(viewSelect);
    viewControls.appendChild(viewLabel);

    // Expand/Collapse buttons (only show in tree mode)
    if (currentViewMode === 'tree') {
      const expandBtn = document.createElement('button');
      expandBtn.id = 'expandAllBtn';
      expandBtn.textContent = 'Expand All';
      expandBtn.className = 'btn-small';
      expandBtn.style.fontSize = '11px';
      viewControls.appendChild(expandBtn);

      const collapseBtn = document.createElement('button');
      collapseBtn.id = 'collapseAllBtn';
      collapseBtn.textContent = 'Collapse All';
      collapseBtn.className = 'btn-small';
      collapseBtn.style.fontSize = '11px';
      viewControls.appendChild(collapseBtn);
    }

    titleRow.appendChild(viewControls);
    headerDiv.appendChild(titleRow);

    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.width = '100%';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'nodeSearch';
    searchInput.placeholder = 'Search nodes...';
    searchInput.value = currentSearchTerm;
    searchInput.style.width = '100%';

    searchContainer.appendChild(searchInput);
    headerDiv.appendChild(searchContainer);

    nodeOverview.appendChild(headerDiv);

    // Create tree container
    const treeContainer = document.createElement('div');
    treeContainer.className = 'hierarchy-tree';
    treeContainer.style.padding = '8px';
    treeContainer.style.overflow = 'auto';
    treeContainer.style.flex = '1';

    // Get root groups (groups with no parent)
    const rootGroups = allGroups.filter(groupPath => !getParentGroup(groupPath));

    // Render root level groups
    rootGroups.forEach(groupPath => {
      treeContainer.appendChild(renderTreeGroup(groupPath, nodes, 0));
    });

    // Render ungrouped nodes
    const ungrouped = nodes.filter(n => !n.group);
    ungrouped.forEach(node => {
      treeContainer.appendChild(renderTreeNode(node, 0));
    });

    nodeOverview.appendChild(treeContainer);

    // Setup event listeners
    setupTreeViewEventListeners(searchInput, viewSelect);

    // Highlight current node if exists
    if (session?.state?.nodeId) {
      highlightNode(session.state.nodeId);
    }
  }

  /**
   * Setup event listeners for tree view
   *
   * @param {HTMLInputElement} searchInput - Search input element
   * @param {HTMLSelectElement} viewSelect - View mode select element
   * @private
   */
  function setupTreeViewEventListeners(searchInput, viewSelect) {
    // Search handler
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        handleTreeSearch(currentSearchTerm);
      });
    }

    // View mode change handler
    if (viewSelect) {
      viewSelect.addEventListener('change', (e) => {
        currentViewMode = e.target.value;
        localStorage.setItem('ng_node_view_mode', currentViewMode);

        if (currentViewMode === 'tree') {
          renderNodeTreeView();
        } else if (currentViewMode === 'grid') {
          renderNodeOverview();
        } else if (currentViewMode === 'list') {
          renderNodeList();
        }
      });
    }

    // Expand/Collapse All buttons
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        const _model = getModel();
        if (!_model?.nodes) return;
        const groups = getAllGroups(Object.values(_model.nodes));
        expandAll(groups);
        renderNodeTreeView();
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        const _model = getModel();
        if (!_model?.nodes) return;
        const groups = getAllGroups(Object.values(_model.nodes));
        collapseAll(groups);
        renderNodeTreeView();
      });
    }

    // Expand/Collapse button click handler (event delegation)
    nodeOverview.addEventListener('click', (e) => {
      if (e.target.classList.contains('hierarchy-expand-btn')) {
        const groupPath = e.target.dataset.group;
        const currentState = getExpansionState(groupPath);
        setExpansionState(groupPath, !currentState);

        // Re-render tree view
        if (currentViewMode === 'tree') {
          renderNodeTreeView();
        }
      }
    });
  }

  /**
   * Handle search in tree view
   *
   * Auto-expands groups that contain matching nodes
   *
   * @param {string} searchTerm - Search term
   * @private
   */
  function handleTreeSearch(searchTerm) {
    const _model = getModel();
    if (!_model?.nodes) return;

    if (!searchTerm) {
      renderNodeTreeView();
      return;
    }

    const nodes = Object.values(_model.nodes);
    const term = searchTerm.toLowerCase();

    // Find matching nodes
    const matchingNodes = nodes.filter(node =>
      node.id.toLowerCase().includes(term) ||
      (node.localId && node.localId.toLowerCase().includes(term)) ||
      (node.text && node.text.toLowerCase().includes(term)) ||
      (node.group && node.group.toLowerCase().includes(term))
    );

    // Collect groups to expand
    const matchingGroups = new Set();
    matchingNodes.forEach(node => {
      if (node.group) {
        matchingGroups.add(node.group);
        // Also expand parent groups
        let parent = getParentGroup(node.group);
        while (parent) {
          matchingGroups.add(parent);
          parent = getParentGroup(parent);
        }
      }
    });

    // Expand matching groups
    matchingGroups.forEach(group => {
      setExpansionState(group, true);
    });

    // Re-render tree
    renderNodeTreeView();

    // Highlight matching nodes
    matchingNodes.forEach(node => {
      const nodeEl = nodeOverview.querySelector(`[data-node-id="${node.id}"]`);
      if (nodeEl) {
        nodeEl.style.background = 'rgba(251, 191, 36, 0.3)';
      }
    });
  }

  /**
   * Highlight a specific node in the overview
   *
   * Applies highlight styling to the node element and scrolls into view.
   *
   * @param {string} nodeId - Node ID to highlight
   * @returns {void}
   */
  function highlightNode(nodeId) {
    clearHighlights();

    const nodeElement = nodeOverview.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.classList.add('highlighted');
      nodeElement.style.backgroundColor = '#e3f2fd';
      nodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      lastHighlightedNode = nodeId;
    }
  }

  /**
   * Jump to and load a specific node
   *
   * Updates session state to the target node, re-renders game state,
   * choices, story, and graph. Shows error messages if node not found
   * or if model/session missing.
   *
   * @param {string} nodeId - Node ID to jump to
   * @returns {void}
   */
  function jumpToNode(nodeId) {
    const _model = getModel();
    const session = getSession();
    if (!_model || !session) {
      setStatus('モデルが読み込まれていません', 'warn');
      return;
    }

    if (!_model.nodes[nodeId]) {
      setStatus(`ノード '${nodeId}' が見つかりません`, 'warn');
      return;
    }

    try {
      // Update session state to jump to the node
      session.state.nodeId = nodeId;
      setSession(session);
      setStatus(`ノード '${nodeId}' に移動しました`, 'success');

      // Update UI
      renderState();
      renderChoices();
      initStory(session, _model);
      renderStoryEnhanced(storyView);

      // Update graph if active
      if (document.querySelector('.tab-btn[data-tab="graph"].active')) {
        renderGraph();
      }

      // Highlight the node in overview
      highlightNode(nodeId);
    } catch (e) {
      console.error('Node jump error:', e);
      setStatus(`ノード移動に失敗しました: ${e?.message ?? e}`, 'warn');
    }
  }

  /**
   * Render node overview with search and filtering
   *
   * Displays all nodes with filter capability. Shows node ID, group,
   * choice count, and preview text. Supports searching by ID, group,
   * or text content.
   *
   * @returns {void}
   */
  function renderNodeOverview() {
    const _model = getModel();
    const session = getSession();
    if (!_model || !nodeOverview) return;

    // Restore view mode from localStorage
    const savedMode = localStorage.getItem('ng_node_view_mode');
    if (savedMode && savedMode !== currentViewMode) {
      currentViewMode = savedMode;
    }

    // If tree mode is active, render tree view instead
    if (currentViewMode === 'tree') {
      renderNodeTreeView();
      return;
    }

    const nodes = _model.nodes;
    const nodeIds = Object.keys(nodes);

    // Filter nodes based on search term (includes group and text)
    const filteredNodes = currentSearchTerm
      ? nodeIds.filter(id => {
        const node = nodes[id];
        const term = currentSearchTerm.toLowerCase();
        return id.toLowerCase().includes(term) ||
          (node.group && node.group.toLowerCase().includes(term)) ||
          node.text?.toLowerCase().includes(term);
      })
      : nodeIds;

    // Create node list HTML
    const nodeListHtml = filteredNodes.map(nodeId => {
      const node = nodes[nodeId];
      const isCurrentNode = session?.state?.nodeId === nodeId;
      const choiceCount = node.choices?.length || 0;
      const displayId = node.localId || nodeId;
      const groupInfo = node.group ? `<span class="node-group" style="color: var(--color-text-muted); font-size: 11px;">${escapeHtml(node.group)}/</span>` : '';

      return `
        <div class="node-item ${isCurrentNode ? 'current-node' : ''}"
             data-node-id="${nodeId}"
             style="padding: 8px 12px; margin-bottom: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer;"
             onclick="window.jumpToNode('${nodeId}')">
          <div class="node-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong>${groupInfo}${escapeHtml(displayId)}</strong>
            <span class="node-meta" style="color: var(--color-text-muted); font-size: 11px;">${choiceCount} choices</span>
          </div>
          <div class="node-text" style="color: var(--color-text-muted); font-size: 12px; margin-bottom: 4px;">${escapeHtml(node.text?.substring(0, 100) || 'No text')}${node.text?.length > 100 ? '...' : ''}</div>
          <div class="node-actions">
            <button onclick="event.stopPropagation(); window.jumpToNode('${nodeId}')"
                    class="jump-btn btn-small">Jump</button>
          </div>
        </div>
      `;
    }).join('');

    const emptyState = filteredNodes.length === 0 ? `
      <div class="empty-state" style="padding: 20px; text-align: center; color: var(--color-text-muted);">
        ${currentSearchTerm ? `「${escapeHtml(currentSearchTerm)}」に一致するノードが見つかりません` : 'ノードがありません'}
      </div>
    ` : '';

    nodeOverview.innerHTML = `
      <div class="node-overview-header" style="padding: 12px 16px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px;">Node Overview (${filteredNodes.length}/${nodeIds.length})</h3>
          <div class="view-mode-controls" style="display: flex; gap: 8px; align-items: center;">
            <label style="fontSize: 12px;">
              View:
              <select id="viewModeSelect" style="font-size: 12px; margin-left: 4px;">
                <option value="tree">Tree View</option>
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
              </select>
            </label>
          </div>
        </div>
        <div class="search-container" style="width: 100%;">
          <input type="text"
                 id="nodeSearch"
                 placeholder="Search nodes..."
                 value="${escapeHtml(currentSearchTerm)}"
                 style="width: 100%;">
        </div>
      </div>
      <div class="node-list" style="padding: 8px; overflow: auto; flex: 1;">
        ${nodeListHtml}
        ${emptyState}
      </div>
    `;

    // Setup view mode select
    const viewModeSelect = nodeOverview.querySelector('#viewModeSelect');
    if (viewModeSelect) {
      viewModeSelect.value = currentViewMode;
      viewModeSelect.addEventListener('change', (e) => {
        currentViewMode = e.target.value;
        localStorage.setItem('ng_node_view_mode', currentViewMode);

        if (currentViewMode === 'tree') {
          renderNodeTreeView();
        } else if (currentViewMode === 'grid') {
          renderNodeOverview();
        } else if (currentViewMode === 'list') {
          renderNodeList();
        }
      });
    }

    // Setup search event listener
    const searchInput = nodeOverview.querySelector('#nodeSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        renderNodeOverview();
      });
    }

    // Highlight current node if exists
    if (session?.state?.nodeId) {
      highlightNode(session.state.nodeId);
    }
  }

  /**
   * Render choices for a specific node
   *
   * Returns HTML string of choices for the given node ID.
   * Used in node details views.
   *
   * @param {string} nodeId - Node ID to get choices for
   * @returns {string} HTML string of choice items
   */
  function renderChoicesForNode(nodeId) {
    const _model = getModel();
    if (!_model) return;

    const node = _model.nodes[nodeId];
    if (!node || !node.choices) return '';

    return node.choices.map(choice => `
      <div class="choice-item" data-choice-id="${choice.id}">
        <strong>${choice.id}:</strong> ${choice.text}
        ${choice.target ? ` → ${choice.target}` : ''}
      </div>
    `).join('');
  }

  /**
   * Render complete node list for edit mode
   *
   * Displays all nodes with full editing capabilities including
   * inline text editing, choice management, and deletion buttons.
   * Used in GUI editor mode.
   *
   * @returns {void}
   */
  function renderNodeList() {
    const _model = getModel();
    const session = getSession();
    if (!nodeOverview || !_model) return

    const nodes = Object.keys(_model.nodes)
    let html = '<h3>ノード一覧</h3>'

    if (nodes.length === 0) {
      html += '<p>ノードがありません</p>'
    } else {
      html += '<div class="node-list">'
      nodes.forEach(nodeId => {
        const node = _model.nodes[nodeId]
        const isCurrent = session?.state?.nodeId === nodeId
        html += `
          <div class="node-item ${isCurrent ? 'current-node' : ''}" data-node-id="${nodeId}">
            <div class="node-header">
              <span class="node-id">${nodeId}</span>
              <div class="node-actions">
                <button class="jump-btn" onclick="jumpToNode('${nodeId}')">Jump</button>
                <button class="delete-node-btn" data-node-id="${nodeId}">削除</button>
              </div>
            </div>
            <div class="node-content">
              <div class="node-text">${node.text?.substring(0, 100) || '(テキストなし)'}...</div>
              <div class="node-choices">
                ${node.choices?.map((choice, idx) => `
                  <div class="choice-preview">
                    <span>${choice.id}: ${choice.text?.substring(0, 50) || '(テキストなし)'}...</span>
                    <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${idx}">×</button>
                  </div>
                `).join('') || '<em>選択肢なし</em>'}
              </div>
            </div>
          </div>
        `
      })
      html += '</div>'
    }

    nodeOverview.innerHTML = html

    // Highlight current node if exists
    if (session?.state?.nodeId) {
      highlightNode(session.state.nodeId)
    }
  }

  /**
   * Setup event handlers for node list edit mode operations
   *
   * Attaches listeners for node/choice deletion, addition, editing,
   * and paraphrasing operations. Integrates with GUI editor for
   * model updates.
   *
   * @param {HTMLElement} nodeList - Node list container element
   * @returns {void}
   */
  function setupNodeListEvents(nodeList) {
    // 言い換えイベント（非AI）
    nodeList.addEventListener('click', (e) => {
      if (e.target.classList.contains('paraphrase-btn')) {
        const nodeId = e.target.dataset.nodeId
        const choiceIndex = e.target.dataset.choiceIndex
        const input = nodeList.querySelector(
          `input[data-node-id="${nodeId}"][data-choice-index="${choiceIndex}"][data-field="text"]`,
        )
        if (!input) return
        try {
          input.value = chooseParaphrase(input.value, { style: 'desu-masu' })
        } catch (err) {
          console.error('言い換えエラー:', err)
          setStatus(`言い換えに失敗しました: ${err?.message ?? err}`, 'warn')
        }
      }

      if (e.target.classList.contains('add-choice-btn')) {
        const nodeId = e.target.dataset.nodeId
        const _model = getModel();
        const node = _model.nodes[nodeId]
        if (!node.choices) node.choices = []
        const choiceId = `c${node.choices.length + 1}`
        node.choices.push({
          id: choiceId,
          text: `選択肢 ${choiceId}`,
          target: nodeId
        })
        setModel(_model);
        renderChoicesForNode(nodeId)
      }

      if (e.target.classList.contains('delete-node-btn')) {
        const nodeId = e.target.dataset.nodeId
        const _model = getModel();
        if (Object.keys(_model.nodes).length <= 1) {
          setStatus('少なくとも1つのノードが必要です', 'warn')
          return
        }
        delete _model.nodes[nodeId]
        // Remove references to deleted node
        for (const [nid, node] of Object.entries(_model.nodes)) {
          node.choices = node.choices?.filter(c => c.target !== nodeId) ?? []
        }
        setModel(_model);
        renderNodeList()
      }

      if (e.target.classList.contains('delete-choice-btn')) {
        const nodeId = e.target.dataset.nodeId
        const choiceIndex = parseInt(e.target.dataset.choiceIndex)
        const _model = getModel();
        const node = _model.nodes[nodeId]
        node.choices.splice(choiceIndex, 1)
        setModel(_model);
        renderChoicesForNode(nodeId)
      }
    })

    // 入力変更でモデル更新
    nodeList.addEventListener('input', (e) => {
      if (guiEditor?.updateModelFromInput) {
        guiEditor.updateModelFromInput(e.target)
      }
    })

    // フォーカス外れ時にもモデル更新（フォールバック）
    nodeList.addEventListener('blur', (e) => {
      if (e.target.tagName === 'INPUT' && guiEditor?.updateModelFromInput) {
        guiEditor.updateModelFromInput(e.target)
      }
    }, true)
  }

  // Public API
  return {
    renderNodeOverview,
    renderNodeTreeView,
    renderNodeList,
    highlightNode,
    jumpToNode,
    renderChoicesForNode,
    setupNodeListEvents,
    clearHighlights,
    setGuiEditor: (editor) => { guiEditor = editor; }
  };
}
