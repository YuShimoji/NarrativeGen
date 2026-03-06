/**
 * Graph Handler - Renders narrative flow graph with zoom and pan controls
 *
 * Visualizes the narrative structure as a node-link diagram with SVG.
 * Supports zoom in/out, view reset, and node highlighting. Uses CSS
 * variables for theming and responsive color selection.
 *
 * @module handlers/graph-handler
 */

/**
 * Initialize Graph handler with dependency injection
 *
 * Sets up graph rendering and control event handlers for zoom and view manipulation.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.getSession - Get current game session
 * @param {SVGElement} deps.graphSvg - SVG element for graph rendering
 * @param {HTMLButtonElement} deps.zoomInBtn - Zoom in button
 * @param {HTMLButtonElement} deps.zoomOutBtn - Zoom out button
 * @param {HTMLButtonElement} deps.resetViewBtn - Reset view button
 * @param {Set<string>} deps.highlightedNodes - Set of node IDs to highlight
 * @returns {Object} Handler public API
 * @returns {Function} returns.renderGraph - Render the narrative graph
 * @returns {Function} returns.setupGraphControls - Setup zoom and pan controls
 *
 * @example
 * const handler = initGraphHandler({
 *   getModel: () => model,
 *   getSession: () => session,
 *   graphSvg: document.getElementById('graph'),
 *   // ... other dependencies
 * });
 * handler.setupGraphControls();
 * handler.renderGraph();
 */
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

  /**
   * Render the narrative flow graph as SVG
   *
   * Creates an SVG visualization showing nodes as circles and connections
   * as directed edges with arrow heads. Colors indicate current node,
   * highlighted nodes, and normal nodes. Applies CSS theme variables
   * for dynamic styling.
   *
   * @returns {void}
   */
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

    // Get CSS variables for colors
    const styles = getComputedStyle(document.documentElement);
    const edgeColor = styles.getPropertyValue('--color-graph-edge').trim();
    const currentColor = styles.getPropertyValue('--color-graph-node-current').trim();
    const highlightColor = styles.getPropertyValue('--color-graph-node-highlight').trim();
    const normalColor = styles.getPropertyValue('--color-graph-node-normal').trim();
    const graphTextColor = styles.getPropertyValue('--color-graph-text').trim();

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
          line.setAttribute('stroke', edgeColor);
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
          arrow.setAttribute('fill', edgeColor);
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
      circle.setAttribute('fill',
        isCurrent ? currentColor :
        isHighlighted ? highlightColor :
        normalColor
      );
      circle.setAttribute('stroke', isHighlighted ? highlightColor : graphTextColor);
      circle.setAttribute('stroke-width', isHighlighted ? '4' : '2');
      svg.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', graphTextColor);
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', isHighlighted ? 'bold' : 'normal');
      text.textContent = node.id;
      svg.appendChild(text);
    });

    // Apply transform
    svg.style.transform = `translate(${graphTranslateX}px, ${graphTranslateY}px) scale(${graphScale})`;
  }

  /**
   * Setup graph zoom and view reset controls
   *
   * Attaches event listeners to zoom in/out/reset buttons that
   * manipulate graph scale and translation, then re-render.
   *
   * @returns {void}
   */
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
