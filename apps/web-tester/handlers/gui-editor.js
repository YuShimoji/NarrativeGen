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

  // Update model from input changes
  function updateModelFromInput(input) {
    if (!input.dataset.nodeId) return

    const nodeId = input.dataset.nodeId
    const choiceIndex = input.dataset.choiceIndex
    const field = input.dataset.field
    const value = input.value

    if (choiceIndex !== undefined) {
      // 選択肢のフィールド更新
      const node = _model.nodes[nodeId]
      const choice = node.choices[parseInt(choiceIndex)]
      if (choice) {
        if (field === 'choice-text') {
          choice.text = value
        } else if (field === 'target') {
          choice.target = value
        } else if (field === 'outcome-type') {
          if (value) {
            if (!choice.outcome) choice.outcome = {}
            choice.outcome.type = value
          } else {
            delete choice.outcome
          }
        } else if (field === 'outcome-value') {
          if (choice.outcome && value) {
            choice.outcome.value = value
          } else if (choice.outcome && !value) {
            delete choice.outcome.value
          }
        } else if (field === 'conditions') {
          try {
            choice.conditions = value ? parseConditions(value) : undefined
          } catch (err) {
            console.warn('条件パースエラー:', err.message)
            choice.conditions = undefined
          }
        }
      }
    } else {
      // ノードのフィールド更新
      const node = _model.nodes[nodeId]
      if (node) {
        if (field === 'type') {
          node.type = value || 'normal'
        } else if (field === 'tags') {
          node.tags = value ? value.split(';').map(t => t.trim()).filter(Boolean) : []
        } else {
          node[field] = value
        }
      }
    }
  // Render the node list for GUI editing
  function renderNodeList() {
    if (!nodeList) return

    nodeList.innerHTML = ''
    for (const [nodeId, node] of Object.entries(_model.nodes)) {
      const nodeDiv = document.createElement('div')
      nodeDiv.className = 'node-editor'
      nodeDiv.innerHTML = `
        <h3>ノード: ${nodeId}</h3>
        <label>テキスト: <input type="text" value="${node.text || ''}" data-node-id="${nodeId}" data-field="text"></label>
        <label>タイプ:
          <select data-node-id="${nodeId}" data-field="type">
            <option value="normal" ${node.type === 'normal' || !node.type ? 'selected' : ''}>通常</option>
            <option value="ending" ${node.type === 'ending' ? 'selected' : ''}>エンディング</option>
            <option value="branch" ${node.type === 'branch' ? 'selected' : ''}>分岐点</option>
          </select>
        </label>
        <label>タグ: <input type="text" placeholder="tag1;tag2;tag3" value="${node.tags ? node.tags.join(';') : ''}" data-node-id="${nodeId}" data-field="tags"></label>
        <h4>選択肢</h4>
        <div class="choices-editor" data-node-id="${nodeId}"></div>
        <button class="add-choice-btn" data-node-id="${nodeId}">選択肢を追加</button>
        <button class="delete-node-btn" data-node-id="${nodeId}">ノードを削除</button>
      `
      nodeList.appendChild(nodeDiv)
      renderChoicesForNode(nodeId)
    }

    // Add input listeners for real-time validation
    nodeList.addEventListener('input', (e) => {
      const input = e.target
      if (input.tagName === 'INPUT') {
        const nodeId = input.dataset.nodeId
        const field = input.dataset.field
        const choiceIndex = input.dataset.choiceIndex

        if (field === 'text') {
          _model.nodes[nodeId].text = input.value
        } else if (field === 'target') {
          _model.nodes[nodeId].choices[choiceIndex].target = input.value
        } else if (field === 'choice-text') {
          _model.nodes[nodeId].choices[choiceIndex].text = input.value
        }

        // Real-time validation
        const errors = validateModel(_model.nodes)
        if (errors.length > 0) {
          showErrors(errors)
        } else {
          hideErrors()
        }
      }
    })
  }

  // Render choices for a specific node in GUI editor
  function renderChoicesForNode(nodeId) {
    const node = _model.nodes[nodeId]
    const choicesDiv = nodeList.querySelector(`.choices-editor[data-node-id="${nodeId}"]`)
    if (!choicesDiv) return

    choicesDiv.innerHTML = ''
    node.choices?.forEach((choice, index) => {
      const choiceDiv = document.createElement('div')
      choiceDiv.className = 'choice-editor'
      choiceDiv.innerHTML = `
        <label>テキスト: <input type="text" value="${choice.text}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="choice-text"></label>
        <label>ターゲット: <input type="text" value="${choice.target}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="target"></label>
        <div class="outcome-editor">
          <label>Outcome:
            <select data-node-id="${nodeId}" data-choice-index="${index}" data-field="outcome-type">
              <option value="">なし</option>
              <option value="ADD_ITEM" ${choice.outcome?.type === 'ADD_ITEM' ? 'selected' : ''}>アイテム追加</option>
              <option value="REMOVE_ITEM" ${choice.outcome?.type === 'REMOVE_ITEM' ? 'selected' : ''}>アイテム削除</option>
            </select>
            <input type="text" placeholder="アイテムID" value="${choice.outcome?.value || ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="outcome-value">
          </label>
        </div>
        <div class="conditions-editor">
          <label>条件: <input type="text" placeholder="flag:key=true; resource:health>=10" value="${choice.conditions ? serializeConditions(choice.conditions) : ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="conditions"></label>
        </div>
        <button class="paraphrase-btn" data-node-id="${nodeId}" data-choice-index="${index}">言い換え</button>
        <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${index}">削除</button>
      `
      choicesDiv.appendChild(choiceDiv)
    })
  // Public API
  return {
    startEditing,
    cancelEditing,
    saveEditing,
    updateModelFromInput,
    renderNodeList,
    renderChoicesForNode,
    isEditing: () => originalModel !== null
  };
