// Debug Handler - manages debug info rendering (flags, resources, inventory, reachability)
// Extracted from main.js for better maintainability

export function initDebugHandler(deps) {
  const {
    getModel,
    getSession,
    flagsDisplay,
    resourcesDisplay,
    inventoryDisplay,
    reachableNodes,
  } = deps;

  function renderDebugInfo() {
    const _model = getModel();
    const session = getSession();
    if (!session || !_model) {
      flagsDisplay.innerHTML = '<p>セッションを開始してください</p>';
      resourcesDisplay.innerHTML = '';
      inventoryDisplay.innerHTML = '';
      reachableNodes.innerHTML = '<p>モデルを読み込んでください</p>';
      return;
    }

    // Render flags
    flagsDisplay.innerHTML = '<h4>フラグ</h4>';
    if (session.state.flags && Object.keys(session.state.flags).length > 0) {
      Object.entries(session.state.flags).forEach(([key, value]) => {
        const div = document.createElement('div');
        div.className = 'flag-item';
        div.innerHTML = `<span>${key}</span><span>${value}</span>`;
        flagsDisplay.appendChild(div);
      });
    } else {
      flagsDisplay.innerHTML += '<p>フラグなし</p>';
    }

    // Render resources
    resourcesDisplay.innerHTML = '<h4>リソース</h4>';
    if (session.state.resources && Object.keys(session.state.resources).length > 0) {
      Object.entries(session.state.resources).forEach(([key, value]) => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `<span>${key}</span><span>${value}</span>`;
        resourcesDisplay.appendChild(div);
      });
    } else {
      resourcesDisplay.innerHTML += '<p>リソースなし</p>';
    }

    // Render inventory
    inventoryDisplay.innerHTML = '<h4>インベントリ</h4>';
    const inventory = session.listInventory();
    if (inventory && inventory.length > 0) {
      inventory.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `<span>${item.id}</span><span>${item.brand} - ${item.description}</span>`;
        inventoryDisplay.appendChild(div);
      });
    } else {
      inventoryDisplay.innerHTML += '<p>アイテムなし</p>';
    }

    // Render reachability map
    reachableNodes.innerHTML = '<h4>到達可能性</h4>';
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
