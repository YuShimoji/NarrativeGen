// GUI Editor Handler - manages GUI editing mode and model manipulation
// Extracted from main.js for better maintainability

export function initGuiEditor(deps) {
  const {
    _model,
    session,
    setStatus,
    setControlsEnabled,
    renderState,
    renderChoices,
    initStory,
    renderStoryEnhanced,
    // DOM references
    guiEditMode,
    guiEditor,
    saveGuiBtn,
    cancelGuiBtn,
    storyView
  } = deps;

  let originalModel = null;

  // Start GUI editing mode
  function startEditing() {
    if (!_model) {
      setStatus('編集するモデルがありません', 'warn');
      return;
    }

    originalModel = JSON.parse(JSON.stringify(_model)); // Deep copy
    guiEditMode.style.display = 'block';
    setControlsEnabled(false);

    // Populate editor with current model
    populateEditor();

    setStatus('GUI編集モードを開始しました', 'info');
  }

  // Cancel editing and revert changes
  function cancelEditing() {
    if (!originalModel) return;

    _model = originalModel;
    originalModel = null;
    guiEditMode.style.display = 'none';
    setControlsEnabled(true);

    setStatus('GUI編集をキャンセルしました', 'info');
  }

  // Save changes from GUI editing
  function saveEditing() {
    if (!originalModel) return;

    try {
      // Validate the model before saving
      if (!validateEditedModel()) {
        return;
      }

      // Restart session with updated model
      session = new GameSession(_model);

      // Update UI
      renderState();
      renderChoices();
      initStory(session, _model);
      renderStoryEnhanced(storyView);

      originalModel = null;
      guiEditMode.style.display = 'none';
      setControlsEnabled(true);

      setStatus('GUI編集を保存しました', 'success');
    } catch (err) {
      console.error('GUI save error:', err);
      setStatus(`GUI保存に失敗しました: ${err?.message ?? err}`, 'warn');
    }
  }

  // Populate editor with current model data
  function populateEditor() {
    if (!guiEditor || !_model) return;

    const editorContent = generateEditorContent(_model);
    guiEditor.innerHTML = editorContent;

    // Setup dynamic event listeners for editor interactions
    setupEditorListeners();
  }

  // Generate HTML content for the editor
  function generateEditorContent(model) {
    const nodes = Object.entries(model.nodes || {}).map(([id, node]) => `
      <div class="node-editor-item" data-node-id="${id}">
        <h4>Node: ${id}</h4>
        <div class="form-group">
          <label>Text:</label>
          <textarea class="node-text" rows="3">${node.text || ''}</textarea>
        </div>
        <div class="choices-container">
          <h5>Choices:</h5>
          ${generateChoicesEditor(node.choices || [])}
          <button class="add-choice-btn" data-node-id="${id}">+ Add Choice</button>
        </div>
        <button class="delete-node-btn" data-node-id="${id}">Delete Node</button>
      </div>
    `).join('');

    return `
      <div class="gui-editor-content">
        <div class="model-info">
          <h3>Editing Model</h3>
          <div class="model-meta">
            <span>Nodes: ${Object.keys(model.nodes || {}).length}</span>
            <span>Start Node: ${model.startNode || 'Not set'}</span>
          </div>
        </div>

        <div class="nodes-editor">
          <h3>Nodes</h3>
          ${nodes}
          <button class="add-node-btn">+ Add New Node</button>
        </div>

        <div class="model-settings">
          <h3>Model Settings</h3>
          <div class="form-group">
            <label>Start Node:</label>
            <select class="start-node-select">
              <option value="">Select start node...</option>
              ${Object.keys(model.nodes || {}).map(id =>
                `<option value="${id}" ${model.startNode === id ? 'selected' : ''}>${id}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>
    `;
  }

  // Generate HTML for choices editor
  function generateChoicesEditor(choices) {
    return choices.map((choice, index) => `
      <div class="choice-editor-item" data-choice-index="${index}">
        <input type="text" class="choice-id" placeholder="Choice ID" value="${choice.id || ''}">
        <textarea class="choice-text" rows="2" placeholder="Choice text">${choice.text || ''}</textarea>
        <input type="text" class="choice-target" placeholder="Target node" value="${choice.target || ''}">
        <button class="delete-choice-btn">×</button>
      </div>
    `).join('');
  }

  // Setup event listeners for editor interactions
  function setupEditorListeners() {
    // Add node button
    const addNodeBtn = guiEditor.querySelector('.add-node-btn');
    if (addNodeBtn) {
      addNodeBtn.addEventListener('click', () => addNewNode());
    }

    // Add choice buttons
    guiEditor.querySelectorAll('.add-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nodeId = e.target.dataset.nodeId;
        addNewChoice(nodeId);
      });
    });

    // Delete node buttons
    guiEditor.querySelectorAll('.delete-node-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nodeId = e.target.dataset.nodeId;
        deleteNode(nodeId);
      });
    });

    // Delete choice buttons
    guiEditor.querySelectorAll('.delete-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const choiceItem = e.target.closest('.choice-editor-item');
        choiceItem.remove();
      });
    });

    // Start node selector
    const startNodeSelect = guiEditor.querySelector('.start-node-select');
    if (startNodeSelect) {
      startNodeSelect.addEventListener('change', (e) => {
        _model.startNode = e.target.value || undefined;
      });
    }
  }

  // Add a new node
  function addNewNode() {
    const nodeId = prompt('Enter new node ID:');
    if (!nodeId || _model.nodes[nodeId]) {
      setStatus('無効または重複するノードIDです', 'warn');
      return;
    }

    _model.nodes[nodeId] = { text: '', choices: [] };
    populateEditor();
  }

  // Add a new choice to a node
  function addNewChoice(nodeId) {
    if (!_model.nodes[nodeId]) return;

    if (!_model.nodes[nodeId].choices) {
      _model.nodes[nodeId].choices = [];
    }

    _model.nodes[nodeId].choices.push({ id: '', text: '', target: '' });
    populateEditor();
  }

  // Delete a node
  function deleteNode(nodeId) {
    if (!confirm(`ノード "${nodeId}" を削除しますか？`)) return;

    delete _model.nodes[nodeId];
    populateEditor();
  }

  // Validate the edited model
  function validateEditedModel() {
    // Basic validation - can be expanded
    if (!_model.startNode || !_model.nodes[_model.startNode]) {
      setStatus('開始ノードが設定されていないか無効です', 'warn');
      return false;
    }

    // Check for empty required fields
    for (const [nodeId, node] of Object.entries(_model.nodes)) {
      if (!node.text?.trim()) {
        setStatus(`ノード "${nodeId}" のテキストが空です`, 'warn');
        return false;
      }
    }

    return true;
  }

  // Public API
  return {
    startEditing,
    cancelEditing,
    saveEditing,
    isEditing: () => originalModel !== null
  };
}
