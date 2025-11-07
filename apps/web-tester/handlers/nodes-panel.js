// Node Panel Handler - manages node overview, jumping, and highlighting
// Extracted from main.js for better maintainability

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

  // Render the node overview list
  function renderNodeOverview() {
    const _model = getModel();
    if (!nodeOverview || !_model) return

    const searchTerm = nodeSearch.value.toLowerCase()
    const filteredNodes = Object.entries(_model.nodes).filter(([id, node]) => {
      if (searchTerm) {
        return id.toLowerCase().includes(searchTerm) ||
               node.text?.toLowerCase().includes(searchTerm)
      }
      return true
    })

    nodeOverview.innerHTML = ''

    filteredNodes.forEach(([nodeId, node]) => {
      const card = document.createElement('div')
      card.className = 'node-card'
      card.dataset.nodeId = nodeId
      card.innerHTML = `
        <h4>${nodeId}</h4>
        <div class="node-text">${node.text || '（テキストなし）'}</div>
        <div class="node-stats">
          選択肢: ${node.choices?.length || 0}個
        </div>
        <div class="node-actions">
          <button data-action="switch-tab" data-tab="graph" data-node-id="${nodeId}">グラフで表示</button>
          <button data-action="switch-tab" data-tab="story" data-node-id="${nodeId}">ストーリーで表示</button>
        </div>
      `
      nodeOverview.appendChild(card)
    })
  }

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

  // Render node overview with search and filtering
  function renderNodeOverview() {
    const _model = getModel();
    const session = getSession();
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

  // Render the complete node list
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

  // Setup node list event handlers
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
    renderNodeList,
    highlightNode,
    jumpToNode,
    renderChoicesForNode,
    setupNodeListEvents,
    clearHighlights,
    setGuiEditor: (editor) => { guiEditor = editor; }
  };
}

  // Setup event listeners for node list interactions
  function setupNodeListEvents(nodeListElement) {
    // Node overview click events
    nodeOverview.addEventListener('click', (e) => {
      const action = e.target.dataset.action
      if (action === 'switch-tab') {
        const tab = e.target.dataset.tab
        const nodeId = e.target.dataset.nodeId
        // Note: switchTab is not in deps, this needs to be handled by the caller
        // For now, we'll call the global function if available
        if (window.switchTab) {
          window.switchTab(tab)
          if (tab === 'graph') {
            renderGraph()
            highlightNode(nodeId)
          } else if (tab === 'story') {
            jumpToNode(nodeId)
          }
        }
      }
    })

    // Search input event
    nodeSearch.addEventListener('input', () => {
      renderNodeOverview()
    })

    // Refresh button event
    if (window.refreshNodeList) {
      window.refreshNodeList.addEventListener('click', () => {
        renderNodeOverview()
      })
    }

    // Hover events for graph linking
    nodeOverview.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.node-card')
      if (!card) return
      const nid = card.dataset.nodeId
      if (window.highlightedNodes) {
        window.highlightedNodes.clear()
        if (nid) window.highlightedNodes.add(nid)
      }
      if (window.graphPanel && window.graphPanel.classList.contains('active')) {
        renderGraph()
      }
    })

    nodeOverview.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.node-card')
      if (!card) return
      if (window.highlightedNodes) {
        window.highlightedNodes.clear()
      }
      if (window.graphPanel && window.graphPanel.classList.contains('active')) {
        renderGraph()
      }
    })
  }
