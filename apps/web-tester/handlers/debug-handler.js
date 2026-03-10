/**
 * Debug Handler - Displays game state debug information
 *
 * Renders real-time game state information including flags, resources,
 * inventory items, and node reachability analysis. Uses BFS to compute
 * reachable nodes from current position based on available choices.
 *
 * @module handlers/debug-handler
 */

import { escapeHtml, clearContent } from '../src/utils/html-utils.js'

/**
 * Initialize Debug handler with dependency injection
 *
 * Sets up debug information rendering for game state inspection.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.getSession - Get current game session
 * @param {HTMLElement} deps.flagsDisplay - Flags display container
 * @param {HTMLElement} deps.resourcesDisplay - Resources display container
 * @param {HTMLElement} deps.inventoryDisplay - Inventory display container
 * @param {HTMLElement} deps.reachableNodes - Reachable nodes display container
 * @returns {Object} Handler public API
 * @returns {Function} returns.renderDebugInfo - Render all debug information
 *
 * @example
 * const handler = initDebugHandler({
 *   getModel: () => model,
 *   getSession: () => session,
 *   flagsDisplay: document.getElementById('flags'),
 *   // ... other dependencies
 * });
 * handler.renderDebugInfo();
 */
export function initDebugHandler(deps) {
  const {
    getModel,
    getSession,
    flagsDisplay,
    resourcesDisplay,
    inventoryDisplay,
    reachableNodes,
  } = deps;

  /**
   * Render all game state debug information
   *
   * Displays current flags, resources, inventory, and reachable nodes.
   * Uses BFS algorithm to compute reachable nodes from current position
   * based on available choices. Shows session not loaded message if
   * session or model is missing.
   *
   * @returns {void}
   */
  function renderDebugInfo() {
    const _model = getModel();
    const session = getSession();
    if (!session || !_model) {
      clearContent(flagsDisplay);
      const p1 = document.createElement('p');
      p1.textContent = 'セッションを開始してください';
      flagsDisplay.appendChild(p1);

      clearContent(resourcesDisplay);
      clearContent(inventoryDisplay);

      clearContent(reachableNodes);
      const p2 = document.createElement('p');
      p2.textContent = 'モデルを読み込んでください';
      reachableNodes.appendChild(p2);
      return;
    }

    // Render flags
    clearContent(flagsDisplay);
    const h4Flags = document.createElement('h4');
    h4Flags.textContent = 'フラグ';
    flagsDisplay.appendChild(h4Flags);

    if (session.state.flags && Object.keys(session.state.flags).length > 0) {
      Object.entries(session.state.flags).forEach(([key, value]) => {
        const div = document.createElement('div');
        div.className = 'flag-item';
        const keySpan = document.createElement('span');
        keySpan.textContent = escapeHtml(key);
        const valueSpan = document.createElement('span');
        valueSpan.textContent = escapeHtml(String(value));
        div.appendChild(keySpan);
        div.appendChild(valueSpan);
        flagsDisplay.appendChild(div);
      });
    } else {
      const pFlags = document.createElement('p');
      pFlags.textContent = 'フラグなし';
      flagsDisplay.appendChild(pFlags);
    }

    // Render resources
    clearContent(resourcesDisplay);
    const h4Resources = document.createElement('h4');
    h4Resources.textContent = 'リソース';
    resourcesDisplay.appendChild(h4Resources);

    if (session.state.resources && Object.keys(session.state.resources).length > 0) {
      Object.entries(session.state.resources).forEach(([key, value]) => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        const keySpan = document.createElement('span');
        keySpan.textContent = escapeHtml(key);
        const valueSpan = document.createElement('span');
        valueSpan.textContent = escapeHtml(String(value));
        div.appendChild(keySpan);
        div.appendChild(valueSpan);
        resourcesDisplay.appendChild(div);
      });
    } else {
      const pResources = document.createElement('p');
      pResources.textContent = 'リソースなし';
      resourcesDisplay.appendChild(pResources);
    }

    // Render inventory
    clearContent(inventoryDisplay);
    const h4Inventory = document.createElement('h4');
    h4Inventory.textContent = 'インベントリ';
    inventoryDisplay.appendChild(h4Inventory);

    const inventory = session.listInventory();
    if (inventory && inventory.length > 0) {
      inventory.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        const idSpan = document.createElement('span');
        idSpan.textContent = escapeHtml(item.id);
        const infoSpan = document.createElement('span');
        infoSpan.textContent = `${escapeHtml(item.brand)} - ${escapeHtml(item.description)}`;
        div.appendChild(idSpan);
        div.appendChild(infoSpan);
        inventoryDisplay.appendChild(div);
      });
    } else {
      const pInventory = document.createElement('p');
      pInventory.textContent = 'アイテムなし';
      inventoryDisplay.appendChild(pInventory);
    }

    // Render reachability map
    clearContent(reachableNodes);
    const h4Reachable = document.createElement('h4');
    h4Reachable.textContent = '到達可能性';
    reachableNodes.appendChild(h4Reachable);
    const visited = new Set([session.state.nodeId]);
    const queue = [session.state.nodeId];
    const reachable = new Set([session.state.nodeId]);

    // BFS to find all reachable nodes
    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const node = _model.nodes[currentNodeId];
      if (!node) continue;

      node.choices?.forEach(choice => {
        if (!visited.has(choice.target)) {
          visited.add(choice.target);
          // Check if choice is available in current state
          try {
            const availableChoices = session.getAvailableChoices();
            const isAvailable = availableChoices.some(c => c.id === choice.id);
            if (isAvailable) {
              queue.push(choice.target);
              reachable.add(choice.target);
            }
          } catch (e) {
            // If error, assume reachable for now
            reachable.add(choice.target);
          }
        }
      });
    }

    // Display all nodes with reachability status
    Object.keys(_model.nodes).forEach(nodeId => {
      const div = document.createElement('div');
      div.className = reachable.has(nodeId) ? 'reachable-node' : 'unreachable-node';
      div.textContent = `${nodeId}: ${reachable.has(nodeId) ? '到達可能' : '未到達'}`;
      reachableNodes.appendChild(div);
    });
  }

  // Public API
  return {
    renderDebugInfo,
  };
}
