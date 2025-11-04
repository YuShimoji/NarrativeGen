// Node Panel Handler - manages node overview, jumping, and highlighting
// Extracted from main.js for better maintainability

export function initNodesPanel(deps) {
  const {
    _model,
    session,
    setStatus,
    renderGraph,
    renderState,
    renderChoices,
    initStory,
    renderStoryEnhanced,
    nodeOverview,
    nodeSearch,
    storyView
  } = deps;

  let currentSearchTerm = '';
  let lastHighlightedNode = null;

  // Clear any existing highlights
  function clearHighlights() {
    const allNodes = nodeOverview.querySelectorAll('.node-item');
    allNodes.forEach(node => {
      node.classList.remove('highlighted');
      node.style.backgroundColor = '';
    });
    lastHighlightedNode = null;
  }

  // Highlight a specific node in the overview
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

  // Jump to a specific node
  function jumpToNode(nodeId) {
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

  // Render node overview with search and filtering
  function renderNodeOverview() {
    if (!_model || !nodeOverview) return;

    const nodes = _model.nodes;
    const nodeIds = Object.keys(nodes);

    // Filter nodes based on search term
    const filteredNodes = currentSearchTerm
      ? nodeIds.filter(id =>
          id.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
          nodes[id].text?.toLowerCase().includes(currentSearchTerm.toLowerCase())
        )
      : nodeIds;

    // Create node list HTML
    const nodeListHtml = filteredNodes.map(nodeId => {
      const node = nodes[nodeId];
      const isCurrentNode = session?.state?.nodeId === nodeId;
      const choiceCount = node.choices?.length || 0;

      return `
        <div class="node-item ${isCurrentNode ? 'current-node' : ''}"
             data-node-id="${nodeId}"
             onclick="window.jumpToNode('${nodeId}')">
          <div class="node-header">
            <strong>${nodeId}</strong>
            <span class="node-meta">${choiceCount} choices</span>
          </div>
          <div class="node-text">${node.text?.substring(0, 100) || 'No text'}${node.text?.length > 100 ? '...' : ''}</div>
          <div class="node-actions">
            <button onclick="event.stopPropagation(); window.jumpToNode('${nodeId}')"
                    class="jump-btn">Jump</button>
          </div>
        </div>
      `;
    }).join('');

    const emptyState = filteredNodes.length === 0 ? `
      <div class="empty-state">
        ${currentSearchTerm ? `「${currentSearchTerm}」に一致するノードが見つかりません` : 'ノードがありません'}
      </div>
    ` : '';

    nodeOverview.innerHTML = `
      <div class="node-overview-header">
        <h3>Node Overview (${filteredNodes.length}/${nodeIds.length})</h3>
        <div class="search-container">
          <input type="text"
                 id="nodeSearch"
                 placeholder="Search nodes..."
                 value="${currentSearchTerm}">
        </div>
      </div>
      <div class="node-list">
        ${nodeListHtml}
        ${emptyState}
      </div>
    `;

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

  // Render choices for a specific node (used in node details)
  function renderChoicesForNode(nodeId) {
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

  // Public API
  return {
    renderNodeOverview,
    highlightNode,
    jumpToNode,
    renderChoicesForNode,
    clearHighlights
  };
}

// Global helper for onclick handlers (temporary bridge)
window.jumpToNode = function(nodeId) {
  // This will be overridden when initNodesPanel is called
  console.warn('jumpToNode called before nodes panel initialized');
};
