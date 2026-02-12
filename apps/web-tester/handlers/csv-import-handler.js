// CSV Import Handler - manages CSV file import and preview
// Extracted from main.js for better maintainability

import { GameSession } from '@narrativegen/engine-ts/dist/browser.js'
import { parseCsvLine, parseKeyValuePairs, parseConditions, parseEffects } from '../utils/csv-parser.js'
import { validateModel } from '../utils/model-utils.js'

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

  function showCsvPreview(file) {
    csvFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.trim().split(/\r?\n/).slice(0, 11); // First 10 lines + header
      const table = document.createElement('table');
      table.className = 'csv-table';
      
      lines.forEach((line, index) => {
        const row = document.createElement('tr');
        const cells = parseCsvLine(line, line.includes('\t') ? '\t' : ',');
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
        cell.colSpan = lines[0].split(line.includes('\t') ? '\t' : ',').length;
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

  function hideCsvPreview() {
    csvPreviewModal.classList.remove('show');
  }

  async function importCsvFile(file, entities) {
    try {
      const text = await file.text();
      const delim = file.name.endsWith('.tsv') || text.includes('\t') ? '\t' : ',';
      const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (rows.length === 0) throw new Error('空のファイルです');

      const headers = rows[0].split(delim).map((h) => h.trim());
      const idx = {
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

      // Process chunks with progress updates
      for (const chunk of chunks) {
        for (const row of chunk) {
          const cells = parseCsvLine(row, delim);
          const nid = (cells[idx.node_id] || '').trim();
          if (!nid) continue;

          if (!nodes[nid]) {
            nodes[nid] = {
              id: nid,
              text: '',
              choices: [],
              type: 'normal',
              tags: [],
              assets: {}
            };
          }

          const node = nodes[nid];

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
          const ctgt = (cells[idx.choice_target] || '').trim();

          if (ctgt || ctext || cid) {
            const choice = {
              id: cid || `c${nodes[nid].choices.length + 1}`,
              text: ctext || '',
              target: ctgt || nid,
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
                choice.effects = parseEffects(cells[idx.choice_effects]);
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

            nodes[nid].choices.push(choice);
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
