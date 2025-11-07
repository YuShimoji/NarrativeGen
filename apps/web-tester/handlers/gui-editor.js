import { GameSession } from '@narrativegen/engine-ts/dist/browser.js';
import { serializeConditions, serializeEffects } from '../utils/csv-parser.js';

export function initGuiEditor(deps) {
  const {
    getModel,
    setModel,
    getSession,
    setSession,
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
    storyView,
    chooseParaphrase,
    parseConditions
  } = deps;

  let originalModel = null;

  // Start GUI editing mode
  function startEditing() {
    const _model = getModel();
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

    setModel(originalModel);
    originalModel = null;
    guiEditMode.style.display = 'none';
    setControlsEnabled(true);

    setStatus('GUI編集をキャンセルしました', 'info');
  }

  // Save changes from GUI editing
  function saveEditing() {
    if (!originalModel) return;

    const _model = getModel();
    try {
      // Validate the model before saving
      if (!validateEditedModel(_model)) {
        return;
      }

      // Restart session with updated model
      setSession(new GameSession(_model));

      // Update UI
      renderState();
      renderChoices();
      initStory(getSession(), _model);
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
    const _model = getModel();
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
  };

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
  };

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
        const _model = getModel();
        _model.startNode = e.target.value || undefined;
        setModel(_model);
      });
    }
  }

  // Add a new node
  function addNewNode() {
    const _model = getModel();
    const nodeId = prompt('Enter new node ID:');
    if (!nodeId || _model.nodes[nodeId]) {
      setStatus('無効または重複するノードIDです', 'warn');
      return;
    }

    _model.nodes[nodeId] = { text: '', choices: [] };
    setModel(_model);
    populateEditor();
  }

  // Add a new choice to a node
  function addNewChoice(nodeId) {
    const _model = getModel();
    if (!_model.nodes[nodeId]) return;

    if (!_model.nodes[nodeId].choices) {
      _model.nodes[nodeId].choices = [];
    }

    _model.nodes[nodeId].choices.push({ id: '', text: '', target: '' });
    setModel(_model);
    populateEditor();
  }

  // Delete a node
  function deleteNode(nodeId) {
    const _model = getModel();
    if (!confirm(`ノード "${nodeId}" を削除しますか？`)) return;

    delete _model.nodes[nodeId];
    setModel(_model);
    populateEditor();
  }

  // Validate the edited model
  function validateEditedModel(model) {
    // Basic validation - can be expanded
    if (!model.startNode || !model.nodes[model.startNode]) {
      setStatus('開始ノードが設定されていないか無効です', 'warn');
      return false;
    }

    // Check for empty required fields
    for (const [nodeId, node] of Object.entries(model.nodes)) {
      if (!node.text?.trim()) {
        setStatus(`ノード "${nodeId}" のテキストが空です`, 'warn');
        return false;
      }
    }

    return true;
  };

  // Update model from input changes
  function updateModelFromInput(input) {
    if (!input.dataset.nodeId) return

    const _model = getModel();
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
    setModel(_model);
};

  // Render the node list for editing
  const renderNodeList = () => {
    const _model = getModel();
    const container = guiEditor.querySelector('.node-list') || document.createElement('div')
    container.className = 'node-list'
    container.innerHTML = ''

    for (const [nodeId, node] of Object.entries(_model.nodes)) {
      const nodeDiv = document.createElement('div')
      nodeDiv.className = 'node-item'
      nodeDiv.dataset.nodeId = nodeId

      nodeDiv.innerHTML = `
        <div class="node-header">
          <input type="text" value="${nodeId}" data-node-id="${nodeId}" data-field="id" placeholder="ノードID">
          <button class="delete-node-btn" data-node-id="${nodeId}">削除</button>
        </div>
        <div class="node-fields">
          <label>テキスト:</label>
          <textarea data-node-id="${nodeId}" data-field="text">${node.text || ''}</textarea>
          <label>タイプ:</label>
          <select data-node-id="${nodeId}" data-field="type">
            <option value="normal" ${node.type === 'normal' ? 'selected' : ''}>normal</option>
            <option value="ending" ${node.type === 'ending' ? 'selected' : ''}>ending</option>
            <option value="start" ${node.type === 'start' ? 'selected' : ''}>start</option>
          </select>
          <label>タグ:</label>
          <input type="text" value="${node.tags ? node.tags.join(';') : ''}" data-node-id="${nodeId}" data-field="tags" placeholder="タグ（セミコロン区切り）">
        </div>
        <div class="choices-section">
          <h4>選択肢 <button class="add-choice-btn" data-node-id="${nodeId}">追加</button></h4>
          <div class="choices-list" data-node-id="${nodeId}">
            ${renderChoicesForNode(nodeId)}
          </div>
        </div>
      `

      container.appendChild(nodeDiv)
    }

    if (!guiEditor.querySelector('.node-list')) {
      guiEditor.appendChild(container)
    }
  }

  // Render choices for a specific node
  const renderChoicesForNode = (nodeId) => {
    const _model = getModel();
    const node = _model.nodes[nodeId]
    if (!node || !node.choices) return '<p>選択肢なし</p>'

    return node.choices.map((choice, index) => `
      <div class="choice-item" data-choice-index="${index}">
        <div class="choice-header">
          <input type="text" value="${choice.id || ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="choice-id" placeholder="選択肢ID">
          <button class="delete-choice-btn" data-node-id="${nodeId}" data-choice-index="${index}">削除</button>
        </div>
        <div class="choice-fields">
          <label>テキスト:</label>
          <input type="text" value="${choice.text || ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="choice-text" placeholder="選択肢テキスト">
          <label>ターゲット:</label>
          <select data-node-id="${nodeId}" data-choice-index="${index}" data-field="choice-target">
            <option value="">-- 選択 --</option>
            ${Object.keys(_model.nodes).map(nid => `<option value="${nid}" ${choice.target === nid ? 'selected' : ''}>${nid}</option>`).join('')}
          </select>
          <label>条件:</label>
          <input type="text" value="${choice.conditions ? serializeConditions(choice.conditions) : ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="conditions" placeholder="条件（例: flag:key=true）">
          <label>効果:</label>
          <input type="text" value="${choice.effects ? serializeEffects(choice.effects) : ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="effects" placeholder="効果（例: setFlag:key=true）">
          <label>アウトカム:</label>
          <select data-node-id="${nodeId}" data-choice-index="${index}" data-field="outcome-type">
            <option value="" ${!choice.outcome ? 'selected' : ''}>-- なし --</option>
            <option value="success" ${choice.outcome?.type === 'success' ? 'selected' : ''}>success</option>
            <option value="failure" ${choice.outcome?.type === 'failure' ? 'selected' : ''}>failure</option>
            <option value="ending" ${choice.outcome?.type === 'ending' ? 'selected' : ''}>ending</option>
          </select>
          <input type="text" value="${choice.outcome?.value || ''}" data-node-id="${nodeId}" data-choice-index="${index}" data-field="outcome-value" placeholder="値（任意）">
        </div>
      </div>
    `).join('')
  }

  // Setup GUI editor event listeners
  function setupGuiEditorEvents() {
    guiEditor.addEventListener('input', updateModelFromInput)
    guiEditor.addEventListener('change', updateModelFromInput)

    guiEditor.addEventListener('click', (e) => {
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
        renderNodeList()
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
        renderNodeList()
      }
    })
  }

  // Populate editor with current model
  function populateEditor() {
    renderNodeList()
    setupGuiEditorEvents()
  }

  // Public API
  return {
    startEditing,
    cancelEditing,
    saveEditing,
    updateModelFromInput,
    renderNodeList,
    renderChoicesForNode
  };
}
