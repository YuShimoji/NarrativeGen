/**
 * GUI Editor handler - Provides in-browser visual editing of narrative models
 *
 * Allows users to create, edit, and delete story nodes and choices with
 * visual feedback. Supports drag-and-drop reordering, conditions/effects
 * editing, and draft auto-save. Changes can be saved or discarded atomically.
 *
 * @module handlers/gui-editor
 */

import { GameSession } from '@narrativegen/engine-ts/dist/browser.js';
import { serializeConditions, serializeEffects } from '../utils/csv-parser.js';

/**
 * Initialize GUI editor with dependency injection
 *
 * Sets up event listeners for node and choice editing, validates changes,
 * and manages UI state transitions between edit and play modes.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.setModel - Update narrative model
 * @param {Function} deps.getSession - Get current game session
 * @param {Function} deps.setSession - Update game session
 * @param {Function} deps.setStatus - Display status message
 * @param {Function} deps.setControlsEnabled - Enable/disable play controls
 * @param {Function} deps.renderState - Re-render game state display
 * @param {Function} deps.renderChoices - Re-render choice buttons
 * @param {Function} deps.initStory - Initialize story log
 * @param {Function} deps.renderStoryEnhanced - Render formatted story
 * @param {Object} deps.saveLoadHandler - Save/load handler for triggering auto-save
 * @param {HTMLElement} deps.guiEditMode - Edit mode container
 * @param {HTMLElement} deps.guiEditor - Editor content container
 * @param {HTMLElement} deps.saveGuiBtn - Save changes button
 * @param {HTMLElement} deps.cancelGuiBtn - Cancel editing button
 * @param {HTMLElement} deps.storyView - Story display element
 * @param {Function} deps.chooseParaphrase - Paraphrase generation function
 * @param {Function} deps.parseConditions - Parse condition strings
 * @param {Function} deps.parseEffects - Parse effect strings
 * @returns {Object} Handler public API
 * @returns {Function} returns.startEditing - Enter edit mode
 * @returns {Function} returns.cancelEditing - Discard changes and exit
 * @returns {Function} returns.saveEditing - Apply changes and exit
 * @returns {Function} returns.updateModelFromInput - Update model from input fields
 * @returns {Function} returns.renderNodeList - Render editable node list
 * @returns {Function} returns.renderChoicesForNode - Render choices for specific node
 *
 * @example
 * const editor = initGuiEditor({
 *   getModel: () => model,
 *   setModel: (m) => model = m,
 *   guiEditMode: document.getElementById('edit-mode'),
 *   guiEditor: document.getElementById('editor'),
 *   // ... other dependencies
 * });
 * editor.startEditing();
 */
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
    saveLoadHandler, // For auto-save after edit
    // DOM references
    guiEditMode,
    guiEditor,
    saveGuiBtn,
    cancelGuiBtn,
    storyView,
    chooseParaphrase,
    parseConditions,
    parseEffects
  } = deps;

  /** @type {Model|null} Snapshot of model at edit start for reverting changes */
  let originalModel = null;

  /**
   * Save current model to localStorage as draft
   *
   * Persists model draft to browser storage for recovery in case
   * of accidental edits or browser crashes. Errors are silently ignored.
   *
   * @returns {void}
   * @private
   */
  function saveDraft() {
    try {
      const m = getModel();
      if (m) localStorage.setItem('ng_model_draft', JSON.stringify(m));
    } catch (_) {}
  }

  /**
   * Start GUI editing mode
   *
   * Saves current model snapshot, disables play controls, and populates
   * editor with node list for visual editing.
   *
   * @returns {void}
   * @public
   */
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

  /**
   * Cancel editing and revert changes
   *
   * Reverts model to snapshot taken at edit start, closes editor,
   * and re-enables play controls.
   *
   * @returns {void}
   * @public
   */
  function cancelEditing() {
    if (!originalModel) return;

    setModel(originalModel);
    originalModel = null;
    guiEditMode.style.display = 'none';
    setControlsEnabled(true);

    setStatus('GUI編集をキャンセルしました', 'info');
  }

  /**
   * Save changes from GUI editing
   *
   * Validates edited model, recreates game session, updates all UI,
   * and triggers auto-save. All changes are atomic.
   *
   * @returns {void}
   * @public
   */
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

      // Trigger auto-save for model changes
      if (saveLoadHandler) {
        saveLoadHandler.scheduleAutoSave();
      }
    } catch (err) {
      console.error('GUI save error:', err);
      setStatus(`GUI保存に失敗しました: ${err?.message ?? err}`, 'warn');
    }
  }

  /**
   * Populate editor with current model data (legacy - replaced by renderNodeList)
   *
   * @returns {void}
   * @private
   * @deprecated Use populateEditor() which calls renderNodeList instead
   */
  function populateEditorLegacy() {
    const _model = getModel();
    if (!guiEditor || !_model) return;

    const editorContent = generateEditorContent(_model);
    guiEditor.innerHTML = editorContent;

    // Setup dynamic event listeners for editor interactions
    setupEditorListeners();
  }

  /**
   * Generate HTML content for the editor
   *
   * Creates HTML representation of all nodes and choices for
   * legacy editor interface.
   *
   * @param {Model} model - Narrative model to render
   * @returns {string} HTML content for editor
   * @private
   */
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

  /**
   * Generate HTML for choices editor
   *
   * Creates HTML representation of choices with edit fields.
   *
   * @param {Choice[]} choices - Array of choices to render
   * @returns {string} HTML content for choices
   * @private
   */
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

  /**
   * Setup event listeners for editor interactions (legacy)
   *
   * Attaches click handlers to add/delete buttons and change handlers
   * to form fields.
   *
   * @returns {void}
   * @private
   * @deprecated
   */
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

  /**
   * Add a new node
   *
   * Prompts user for node ID, validates uniqueness, and adds new node
   * with empty text and choices array.
   *
   * @returns {void}
   * @private
   */
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

  /**
   * Add a new choice to a node
   *
   * Appends a new empty choice to a node's choice array and re-renders.
   *
   * @param {string} nodeId - ID of node to add choice to
   * @returns {void}
   * @private
   */
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

  /**
   * Delete a node
   *
   * Removes node after user confirmation. Does not clean up choice
   * references to deleted node.
   *
   * @param {string} nodeId - ID of node to delete
   * @returns {void}
   * @private
   */
  function deleteNode(nodeId) {
    const _model = getModel();
    if (!confirm(`ノード "${nodeId}" を削除しますか？`)) return;

    delete _model.nodes[nodeId];
    setModel(_model);
    populateEditor();
  }

  /**
   * Validate the edited model
   *
   * Checks that start node is valid and all nodes have non-empty text.
   * Displays status messages on validation failure.
   *
   * @param {Model} model - Model to validate
   * @returns {boolean} True if model passes all validations
   * @private
   */
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
  }

  /**
   * Rename node ID and update all references
   *
   * Renames a node and updates all choice targets, start node, and
   * node order metadata. Validates new ID is unique and non-empty.
   *
   * @param {string} oldId - Current node ID
   * @param {string} newId - New node ID
   * @returns {boolean} True if rename succeeded
   * @private
   */
  function renameNodeId(oldId, newId) {
    const model = getModel();
    if (!model?.nodes?.[oldId]) return false;
    if (!newId || newId === oldId) return false;
    if (model.nodes[newId]) {
      setStatus(`重複するノードIDです: ${newId}`, 'warn');
      return false;
    }
    model.nodes[newId] = model.nodes[oldId];
    delete model.nodes[oldId];
    for (const [, n] of Object.entries(model.nodes)) {
      n.choices?.forEach(c => { if (c.target === oldId) c.target = newId; });
    }
    if (model.startNode === oldId) model.startNode = newId;
    if (model.metadata && Array.isArray(model.metadata.nodeOrder)) {
      const i = model.metadata.nodeOrder.indexOf(oldId);
      if (i !== -1) model.metadata.nodeOrder.splice(i, 1, newId);
    }
    setModel(model);
    saveDraft();
    renderNodeList();
    return true;
  }

  /**
   * Update model from input changes
   *
   * Handles real-time model updates from form input fields.
   * Supports node properties (text, type, tags), choice fields
   * (id, text, target, conditions, effects, outcome), and
   * auto-parsing of conditions/effects strings.
   *
   * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - Changed input element
   * @returns {void}
   * @private
   */
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
        if (field === 'choice-id') {
          choice.id = value
        } else if (field === 'choice-target' || field === 'target') {
          choice.target = value
        } else if (field === 'effects') {
          try {
            choice.effects = value ? parseEffects(value) : undefined
          } catch (err) {
            console.warn('効果パースエラー:', err.message)
            choice.effects = undefined
          }
        } else if (field === 'conditions') {
          try {
            choice.conditions = value ? parseConditions(value) : undefined
          } catch (err) {
            console.warn('条件パースエラー:', err.message)
            choice.conditions = undefined
          }
        } else if (field === 'choice-text') {
          choice.text = value
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
        }
      }
    } else {
      const node = _model.nodes[nodeId]
      if (node) {
        if (field === 'id') {
          if (renameNodeId(nodeId, value.trim())) {
            renderNodeList();
          }
        } else if (field === 'type') {
          node.type = value || 'normal'
          setModel(_model);
          saveDraft();
        } else if (field === 'tags') {
          node.tags = value ? value.split(';').map(t => t.trim()).filter(Boolean) : []
          setModel(_model);
          saveDraft();
        } else {
          node[field] = value
          setModel(_model);
          saveDraft();
        }
      }
    }
    if (field !== 'id') setModel(_model);
    if (field !== 'id') saveDraft();
  }

  /**
   * Render the node list for editing
   *
   * Creates editable DOM representation of all nodes with fields for
   * text, type, tags, and choices. Supports drag-and-drop reordering
   * via metadata.nodeOrder.
   *
   * @returns {void}
   * @public
   */
  // =========================================================================
  // Entity Panel
  // =========================================================================

  function renderEntities() {
    const _model = getModel();
    const entities = _model.entities || {};
    const keys = Object.keys(entities);
    const tbody = document.getElementById('entityTableBody');
    const countEl = document.getElementById('entityCount');
    if (!tbody) return;

    countEl.textContent = `(${keys.length})`;

    if (keys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="entity-empty-hint">エンティティが定義されていません</td></tr>';
      return;
    }

    tbody.innerHTML = keys.map(id => {
      const e = entities[id];
      return `<tr data-entity-id="${id}">
        <td><input type="text" value="${id}" data-entity-field="id" data-entity-old-id="${id}"></td>
        <td><input type="text" value="${e.name || ''}" data-entity-field="name" data-entity-id="${id}"></td>
        <td><input type="text" value="${e.description || ''}" data-entity-field="description" data-entity-id="${id}"></td>
        <td><input type="number" value="${e.cost ?? 0}" data-entity-field="cost" data-entity-id="${id}" step="1"></td>
        <td><button class="entity-delete-btn" data-entity-id="${id}" title="削除">x</button></td>
      </tr>`;
    }).join('');
  }

  function addEntity() {
    const _model = getModel();
    if (!_model.entities) _model.entities = {};
    let idx = Object.keys(_model.entities).length + 1;
    let newId = `item_${idx}`;
    while (_model.entities[newId]) { idx++; newId = `item_${idx}`; }
    _model.entities[newId] = { id: newId, name: `アイテム${idx}`, description: '', cost: 0 };
    setModel(_model);
    renderEntities();
    saveDraft();

    // Expand panel if collapsed
    const panel = document.getElementById('entityPanel');
    if (panel && panel.classList.contains('collapsed')) {
      panel.classList.remove('collapsed');
      panel.querySelector('.entity-panel-header')?.setAttribute('aria-expanded', 'true');
    }
  }

  function deleteEntity(entityId) {
    const _model = getModel();
    if (!_model.entities || !_model.entities[entityId]) return;
    delete _model.entities[entityId];
    setModel(_model);
    renderEntities();
    saveDraft();
  }

  function updateEntityField(input) {
    const field = input.dataset.entityField;
    if (!field) return;
    const _model = getModel();
    if (!_model.entities) return;

    if (field === 'id') {
      const oldId = input.dataset.entityOldId;
      const newId = input.value.trim();
      if (!newId || newId === oldId) return;
      if (_model.entities[newId]) {
        setStatus(`エンティティID "${newId}" は既に使用されています`, 'warn');
        input.value = oldId;
        return;
      }
      const entity = _model.entities[oldId];
      delete _model.entities[oldId];
      entity.id = newId;
      _model.entities[newId] = entity;
      setModel(_model);
      renderEntities();
      saveDraft();
      return;
    }

    const entityId = input.dataset.entityId;
    const entity = _model.entities[entityId];
    if (!entity) return;

    if (field === 'cost') {
      const num = Number(input.value);
      entity.cost = Number.isFinite(num) ? num : 0;
    } else {
      entity[field] = input.value;
    }
    setModel(_model);
    saveDraft();
  }

  function setupEntityEvents() {
    const panel = document.getElementById('entityPanel');
    const header = panel?.querySelector('.entity-panel-header');
    const addBtn = document.getElementById('addEntityBtn');
    const tbody = document.getElementById('entityTableBody');

    if (header) {
      header.addEventListener('click', () => {
        const isCollapsed = panel.classList.toggle('collapsed');
        header.setAttribute('aria-expanded', String(!isCollapsed));
      });
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', addEntity);
    }

    if (tbody) {
      tbody.addEventListener('click', (e) => {
        if (e.target.classList.contains('entity-delete-btn')) {
          deleteEntity(e.target.dataset.entityId);
        }
      });
      tbody.addEventListener('change', (e) => {
        if (e.target.dataset.entityField) {
          updateEntityField(e.target);
        }
      });
    }
  }

  const renderNodeList = () => {
    const _model = getModel();
    const container = guiEditor.querySelector('.node-list') || document.createElement('div')
    container.className = 'node-list'
    container.innerHTML = ''

    const order = _model.metadata?.nodeOrder ?? Object.keys(_model.nodes)
    for (const nodeId of order) {
      const node = _model.nodes[nodeId]
      if (!node) continue
      const nodeDiv = document.createElement('div')
      nodeDiv.className = 'node-item'
      nodeDiv.dataset.nodeId = nodeId
      nodeDiv.setAttribute('draggable', 'true')

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

  /**
   * Render choices for a specific node
   *
   * Creates editable DOM representation of choices with fields for
   * text, target node, conditions, effects, and outcome.
   *
   * @param {string} nodeId - Node ID to render choices for
   * @returns {string} HTML content for choices list
   * @public
   */
  const renderChoicesForNode = (nodeId) => {
    const _model = getModel();
    const node = _model.nodes[nodeId]
    if (!node || !node.choices) return '<p>選択肢なし</p>'

    return node.choices.map((choice, index) => `
      <div class="choice-item" data-choice-index="${index}" draggable="true">
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

  /**
   * Setup GUI editor event listeners
   *
   * Attaches handlers for input/change events and click handlers for
   * node/choice add/delete buttons. Implements drag-and-drop for
   * reordering nodes and choices.
   *
   * @returns {void}
   * @private
   */
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

    let dragInfo = null
    guiEditor.addEventListener('dragstart', (e) => {
      const choiceItem = e.target.closest('.choice-item')
      if (choiceItem) {
        const list = choiceItem.closest('.choices-list')
        dragInfo = {
          type: 'choice',
          fromNodeId: list?.dataset.nodeId,
          fromIndex: parseInt(choiceItem.dataset.choiceIndex)
        }
        e.dataTransfer.effectAllowed = 'move'
        return
      }
      const nodeItem = e.target.closest('.node-item')
      if (nodeItem) {
        dragInfo = { type: 'node', fromNodeId: nodeItem.dataset.nodeId }
        e.dataTransfer.effectAllowed = 'move'
      }
    })

    guiEditor.addEventListener('dragover', (e) => {
      if (dragInfo) e.preventDefault()
    })

    guiEditor.addEventListener('drop', (e) => {
      if (!dragInfo) return
      e.preventDefault()
      const _model = getModel();
      if (dragInfo.type === 'choice') {
        const targetItem = e.target.closest('.choice-item')
        const list = e.target.closest('.choices-list')
        const toNodeId = list?.dataset.nodeId
        if (!targetItem || !toNodeId || toNodeId !== dragInfo.fromNodeId) { dragInfo = null; return }
        const toIndex = parseInt(targetItem.dataset.choiceIndex)
        const arr = _model.nodes[toNodeId].choices || []
        const [moved] = arr.splice(dragInfo.fromIndex, 1)
        arr.splice(toIndex, 0, moved)
        setModel(_model)
        renderNodeList()
        saveDraft()
      } else if (dragInfo.type === 'node') {
        const targetNodeItem = e.target.closest('.node-item')
        const toId = targetNodeItem?.dataset.nodeId
        if (!toId || toId === dragInfo.fromNodeId) { dragInfo = null; return }
        if (!_model.metadata) _model.metadata = {}
        if (!Array.isArray(_model.metadata.nodeOrder)) _model.metadata.nodeOrder = Object.keys(_model.nodes)
        const order = _model.metadata.nodeOrder
        const fromIdx = order.indexOf(dragInfo.fromNodeId)
        const toIdx = order.indexOf(toId)
        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = order.splice(fromIdx, 1)
          order.splice(toIdx, 0, moved)
          setModel(_model)
          renderNodeList()
          saveDraft()
        }
      }
      dragInfo = null
    })
  }

  /**
   * Populate editor with current model
   *
   * Renders the node list and sets up event listeners for
   * editor interaction.
   *
   * @returns {void}
   * @private
   */
  function populateEditor() {
    renderEntities()
    setupEntityEvents()
    renderNodeList()
    setupGuiEditorEvents()
  }

  // Public API
  return {
    /** Enter edit mode with model snapshot for revert capability */
    startEditing,
    /** Discard changes and exit edit mode */
    cancelEditing,
    /** Apply and save all changes, validate, and exit edit mode */
    saveEditing,
    /** Handle real-time model updates from input fields */
    updateModelFromInput,
    /** Re-render node list with current model state */
    renderNodeList,
    /** Render choices for a specific node */
    renderChoicesForNode,
    /** Re-render entity definition table */
    renderEntities
  };
}
