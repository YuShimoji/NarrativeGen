// Graph Handler - manages graph rendering and zoom controls
// Extracted from main.js for better maintainability

export function initGraphHandler(deps) {
  const {
    getModel,
    getSession,
    graphSvg,
    zoomInBtn,
    zoomOutBtn,
    resetViewBtn,
    highlightedNodes,
  } = deps;

  let graphScale = 1;
  let graphTranslateX = 0;
  let graphTranslateY = 0;

  function renderGraph() {
    const _model = getModel();
    if (!graphSvg || !_model) {
      graphSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666">モデルを読み込んでください</text>';
      return;
    }

    const svg = graphSvg;
    svg.innerHTML = '';

    const session = getSession();
    const nodes = Object.values(_model.nodes);
    const nodeMap = new Map();
    nodes.forEach((node, i) => {
      nodeMap.set(node.id, { ...node, x: 100 + (i % 5) * 150, y: 100 + Math.floor(i / 5) * 150 });
    });

    // Draw connections
    nodes.forEach(node => {
      const sourcePos = nodeMap.get(node.id);
      node.choices?.forEach(choice => {
        const targetPos = nodeMap.get(choice.target);
        if (targetPos) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', sourcePos.x);
          line.setAttribute('y1', sourcePos.y);
          line.setAttribute('x2', targetPos.x);
          line.setAttribute('y2', targetPos.y);
          line.setAttribute('stroke', '#999');
          line.setAttribute('stroke-width', '2');
          svg.appendChild(line);

          // Arrow head
          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const angle = Math.atan2(dy, dx);
          const arrowLength = 10;
          const arrowX = targetPos.x - arrowLength * Math.cos(angle);
          const arrowY = targetPos.y - arrowLength * Math.sin(angle);

          const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          arrow.setAttribute('points', `${targetPos.x},${targetPos.y} ${arrowX - 5 * Math.sin(angle)},${arrowY + 5 * Math.cos(angle)} ${arrowX + 5 * Math.sin(angle)},${arrowY - 5 * Math.cos(angle)}`);
          arrow.setAttribute('fill', '#999');
          svg.appendChild(arrow);
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = nodeMap.get(node.id);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const isCurrent = node.id === session?.state?.nodeId;
      const isHighlighted = highlightedNodes.has(node.id);
      
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', isHighlighted ? '35' : '30');
      circle.setAttribute('fill', isCurrent ? '#4CAF50' : isHighlighted ? '#FF9800' : '#2196F3');
      circle.setAttribute('stroke', isHighlighted ? '#FF9800' : '#fff');
      circle.setAttribute('stroke-width', isHighlighted ? '4' : '2');
      svg.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', isCurrent ? '#4CAF50' : isHighlighted ? '#FF9800' : '#fff');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', isHighlighted ? 'bold' : 'normal');
      text.textContent = node.id;
      svg.appendChild(text);
    });

    // Apply transform
    svg.style.transform = `translate(${graphTranslateX}px, ${graphTranslateY}px) scale(${graphScale})`;
  }

  // Graph controls
  function setupGraphControls() {
    zoomInBtn?.addEventListener('click', () => {
      graphScale *= 1.2;
      renderGraph();
    });

    zoomOutBtn?.addEventListener('click', () => {
      graphScale /= 1.2;
      renderGraph();
    });

    resetViewBtn?.addEventListener('click', () => {
      graphScale = 1;
      graphTranslateX = 0;
      graphTranslateY = 0;
      renderGraph();
    });
  }

  // Public API
  return {
    renderGraph,
    setupGraphControls,
  };
}
