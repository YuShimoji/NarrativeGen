/**
 * CSV Import Handler - Manages CSV/TSV file import with preview and validation
 *
 * Handles narrative model import from CSV/TSV files with comprehensive parsing
 * of nodes, choices, conditions, effects, and metadata. Supports progress updates
 * for large files, validation, and preview display before committing changes.
 *
 * @module handlers/csv-import-handler
 */

import { GameSession, resolveNodeId } from '@narrativegen/engine-ts/dist/browser.js'
import { parseCsvLine, parseKeyValuePairs, parseConditions, parseEffects } from '../utils/csv-parser.js'
import { validateModel } from '../utils/model-utils.js'

/**
 * Initialize CSV Import handler with dependency injection
 *
 * Sets up CSV import functionality with preview modal, file parsing,
 * validation, and session initialization from imported data.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.setModel - Update narrative model
 * @param {Function} deps.getSession - Get current game session
 * @param {Function} deps.setSession - Update game session
 * @param {Function} deps.setStatus - Display status message
 * @param {Function} deps.showErrors - Display validation errors
 * @param {Function} deps.hideErrors - Clear error display
 * @param {Function} deps.renderState - Re-render game state display
 * @param {Function} deps.renderChoices - Re-render choice buttons
 * @param {Function} deps.initStory - Initialize story log
 * @param {Function} deps.renderStoryEnhanced - Render formatted story
 * @param {HTMLElement} deps.csvPreviewModal - CSV preview modal element
 * @param {HTMLElement} deps.csvFileName - File name display element
 * @param {HTMLElement} deps.csvPreviewContent - Preview content container
 * @param {HTMLElement} deps.storyView - Story view element
 * @returns {Object} Handler public API
 * @returns {Function} returns.showCsvPreview - Display CSV preview modal
 * @returns {Function} returns.hideCsvPreview - Close CSV preview modal
 * @returns {Function} returns.importCsvFile - Parse and import CSV file
 *
 * @example
 * const handler = initCsvImportHandler({
 *   getModel: () => model,
 *   setModel: (m) => model = m,
 *   csvPreviewModal: document.getElementById('csv-modal'),
 *   // ... other dependencies
 * });
 * handler.showCsvPreview(file);
 */
export function initCsvImportHandler(deps) {
  const {
    getModel,
    setModel,
    getSession,
    setSession,
    setStatus,
    showErrors,
    hideErrors,
    renderState,
    renderChoices,
    initStory,
    renderStoryEnhanced,
    // DOM references
    csvPreviewModal,
    csvFileName,
    csvPreviewContent,
    storyView,
  } = deps;

  /**
   * Display CSV file preview in modal
   *
   * Reads the first 10 data rows from the CSV file and displays them
   * in a table format for user preview before import.
   *
   * @param {File} file - CSV file to preview
   * @returns {void}
   * @private
   */
  function showCsvPreview(file) {
    csvFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const previewDelim = text.includes('\t') ? '\t' : ',';
      const lines = text.trim().split(/\r?\n/).slice(0, 11); // First 10 lines + header
      const table = document.createElement('table');
      table.className = 'csv-table';

      lines.forEach((line, index) => {
        const row = document.createElement('tr');
        const cells = parseCsvLine(line, previewDelim);
        cells.forEach(cell => {
          const cellEl = document.createElement(index === 0 ? 'th' : 'td');
          cellEl.textContent = cell;
          row.appendChild(cellEl);
        });
        table.appendChild(row);
      });

      if (lines.length >= 11) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = parseCsvLine(lines[0], previewDelim).length;
        cell.textContent = '... (以降省略)';
        cell.style.textAlign = 'center';
        cell.style.fontStyle = 'italic';
        row.appendChild(cell);
        table.appendChild(row);
      }

      csvPreviewContent.innerHTML = '';
      csvPreviewContent.appendChild(table);
      csvPreviewModal.classList.add('show');
    };
    reader.readAsText(file);
  }

  /**
   * Close CSV preview modal
   *
   * @returns {void}
   * @private
   */
  function hideCsvPreview() {
    csvPreviewModal.classList.remove('show');
  }

  /**
   * Parse and import CSV file into narrative model
   *
   * Processes CSV file with comprehensive parsing of node hierarchy, choices,
   * conditions, effects, and metadata. Validates model, shows progress updates
   * for large files, and initializes session with imported data.
   *
   * Supports CSV and TSV formats with auto-detection. Handles node groups
   * and resolves cross-group references.
   *
   * @async
   * @param {File} file - CSV/TSV file to import
   * @param {Array} entities - Entity definitions for inventory support
   * @returns {Promise<string|null>} File name on success, null on failure
   * @private
   */
  async function importCsvFile(file, entities) {
    try {
      const text = await file.text();
      const delim = file.name.endsWith('.tsv') || text.includes('\t') ? '\t' : ',';
      const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (rows.length === 0) throw new Error('空のファイルです');

      const headers = rows[0].split(delim).map((h) => h.trim());
      const idx = {
        node_group: headers.indexOf('node_group'),
        node_id: headers.indexOf('node_id'),
        node_text: headers.indexOf('node_text'),
        node_type: headers.indexOf('node_type'),
        node_tags: headers.indexOf('node_tags'),
        node_assets: headers.indexOf('node_assets'),
        choice_id: headers.indexOf('choice_id'),
        choice_text: headers.indexOf('choice_text'),
        choice_target: headers.indexOf('choice_target'),
        choice_conditions: headers.indexOf('choice_conditions'),
        choice_effects: headers.indexOf('choice_effects'),
        choice_outcome_type: headers.indexOf('choice_outcome_type'),
        choice_outcome_value: headers.indexOf('choice_outcome_value'),
        choice_metadata: headers.indexOf('choice_metadata'),
        choice_variables: headers.indexOf('choice_variables'),
        initial_flags: headers.indexOf('initial_flags'),
        initial_resources: headers.indexOf('initial_resources'),
        global_metadata: headers.indexOf('global_metadata'),
      };

      // Performance optimization: Process in chunks for large files
      const totalRows = rows.length - 1; // Exclude header
      const chunkSize = 100;
      const chunks = [];

      for (let i = 1; i < rows.length; i += chunkSize) {
        chunks.push(rows.slice(i, i + chunkSize));
      }

      // 初期値の抽出（最初の行）
      let initialFlags = {};
      let initialResources = {};
      if (rows.length > 1) {
        const firstRow = parseCsvLine(rows[1], delim);
        if (idx.initial_flags >= 0 && firstRow[idx.initial_flags]) {
          initialFlags = parseKeyValuePairs(firstRow[idx.initial_flags], 'boolean');
        }
        if (idx.initial_resources >= 0 && firstRow[idx.initial_resources]) {
          initialResources = parseKeyValuePairs(firstRow[idx.initial_resources], 'number');
        }
      }

      const nodes = {};
      const errors = [];
      let processedRows = 0;

      // Progress indicator
      setStatus(`CSV読み込み中... (0/${totalRows})`);

      // 渡された row から canonicalId を計算するためのヘルパー
      const getCanonicalId = (cells) => {
        const group = idx.node_group >= 0 ? (cells[idx.node_group] || '').trim() : '';
        const nid = (cells[idx.node_id] || '').trim();
        if (!nid) return null;
        return group ? `${group}/${nid}` : nid;
      };

      // Process chunks with progress updates
      for (const chunk of chunks) {
        for (const row of chunk) {
          const cells = parseCsvLine(row, delim);
          const canonicalId = getCanonicalId(cells);
          if (!canonicalId) continue;

          const group = idx.node_group >= 0 ? (cells[idx.node_group] || '').trim() : '';
          const localId = (cells[idx.node_id] || '').trim();

          if (!nodes[canonicalId]) {
            nodes[canonicalId] = {
              id: canonicalId,
              localId: localId,
              group: group,
              text: '',
              choices: [],
              type: 'normal',
              tags: [],
              assets: {}
            };
          }

          const node = nodes[canonicalId];

          const ntext = (cells[idx.node_text] || '').trim();
          if (ntext) node.text = ntext;

          // Parse node metadata
          if (idx.node_type >= 0 && cells[idx.node_type]) {
            node.type = cells[idx.node_type].trim();
          }

          if (idx.node_tags >= 0 && cells[idx.node_tags]) {
            node.tags = cells[idx.node_tags].split(';').map(t => t.trim()).filter(Boolean);
          }

          if (idx.node_assets >= 0 && cells[idx.node_assets]) {
            node.assets = parseKeyValuePairs(cells[idx.node_assets]);
          }

          const cid = (cells[idx.choice_id] || '').trim();
          const ctext = (cells[idx.choice_text] || '').trim();
          const rawTarget = (cells[idx.choice_target] || '').trim();

          // Resolve target ID based on hierarchy
          const ctgt = rawTarget ? resolveNodeId(rawTarget, group) : canonicalId;
          const normalizedTarget = ctgt || '__ROOT__';

          if (ctext || cid || rawTarget) {
            const choice = {
              id: cid || `c${node.choices.length + 1}`,
              text: ctext || '',
              target: normalizedTarget,
              metadata: {},
              variables: {}
            };

            // Parse choice metadata
            if (idx.choice_metadata >= 0 && cells[idx.choice_metadata]) {
              choice.metadata = parseKeyValuePairs(cells[idx.choice_metadata]);
            }

            // Parse choice variables
            if (idx.choice_variables >= 0 && cells[idx.choice_variables]) {
              choice.variables = parseKeyValuePairs(cells[idx.choice_variables]);
            }

            // 条件のパース
            if (idx.choice_conditions >= 0 && cells[idx.choice_conditions]) {
              try {
                choice.conditions = parseConditions(cells[idx.choice_conditions]);
              } catch (err) {
                errors.push(`行${processedRows + 2}: 条件パースエラー: ${err.message}`);
              }
            }

            // 効果のパース
            if (idx.choice_effects >= 0 && cells[idx.choice_effects]) {
              try {
                const effects = parseEffects(cells[idx.choice_effects]);
                // goto 効果のターゲットも解決する
                effects.forEach(e => {
                  if (e.type === 'goto' && e.target) {
                    e.target = resolveNodeId(e.target, group) || '__ROOT__';
                  }
                });
                choice.effects = effects;
              } catch (err) {
                errors.push(`行${processedRows + 2}: 効果パースエラー: ${err.message}`);
              }
            }

            // アウトカムのパース
            if (idx.choice_outcome_type >= 0 && cells[idx.choice_outcome_type]) {
              choice.outcome = {
                type: cells[idx.choice_outcome_type].trim(),
                value: idx.choice_outcome_value >= 0 ? cells[idx.choice_outcome_value]?.trim() : undefined
              };
            }

            node.choices.push(choice);
          }

          processedRows++;

          // Update progress every 100 rows
          if (processedRows % 100 === 0) {
            setStatus(`CSV読み込み中... (${processedRows}/${totalRows})`);
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }

      // バリデーション
      const validationErrors = validateModel(nodes);
      errors.push(...validationErrors);

      if (errors.length > 0) {
        showErrors(errors);
        setStatus(`CSV読み込みに失敗しました（${errors.length}件のエラー）`, 'warn');
      } else {
        hideErrors();
        setStatus('CSV を読み込みました', 'success');
      }

      // グローバルメタデータのパース（最初の行）
      let globalMetadata = {};
      if (rows.length > 1 && idx.global_metadata >= 0) {
        const firstRow = parseCsvLine(rows[1], delim);
        if (firstRow[idx.global_metadata]) {
          globalMetadata = parseKeyValuePairs(firstRow[idx.global_metadata]);
        }
      }

      const firstNode = Object.keys(nodes)[0];
      const rootNode = Object.keys(nodes).find((id) => !id.includes('/')) || firstNode;
      Object.values(nodes).forEach((node) => {
        (node.choices || []).forEach((choice) => {
          if (choice.target === '__ROOT__') {
            choice.target = rootNode;
          }
          (choice.effects || []).forEach((effect) => {
            if (effect.type === 'goto' && effect.target === '__ROOT__') {
              effect.target = rootNode;
            }
          });
        });
      });
      setModel({
        modelType: 'adventure-playthrough',
        startNode: firstNode,
        flags: initialFlags,
        resources: initialResources,
        nodes,
        metadata: globalMetadata
      });
      setSession(new GameSession(getModel(), { entities }));
      renderState();
      renderChoices();
      renderStoryEnhanced(storyView);

      return file.name;
    } catch (err) {
      console.error(err);
      setStatus(`CSV 読み込みに失敗: ${err?.message ?? err}`, 'warn');
      return null;
    }
  }

  // Public API
  return {
    showCsvPreview,
    hideCsvPreview,
    importCsvFile,
  };
}
