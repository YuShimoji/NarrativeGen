/**
 * Tabs Handler - Manages tab switching and panel state
 *
 * Provides tab navigation and panel visibility management for the main UI.
 * Supports story, debug, graph, node list, and AI tabs with lazy
 * initialization of expensive operations.
 *
 * @module handlers/tabs
 */

/**
 * Initialize Tabs handler with dependency injection
 *
 * Sets up tab switching functionality with event listeners and panel
 * management. Triggers specific operations (render graph, debug info, etc.)
 * when tabs are activated.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.renderGraph - Render graph function
 * @param {Function} deps.renderDebugInfo - Render debug info function
 * @param {Function} deps.renderNodeOverview - Render node overview function
 * @param {Function} deps.initAiProvider - Initialize AI provider function
 * @param {HTMLElement} deps.storyTab - Story tab button
 * @param {HTMLElement} deps.debugTab - Debug tab button
 * @param {HTMLElement} deps.graphTab - Graph tab button
 * @param {HTMLElement} deps.nodeListTab - Node list tab button
 * @param {HTMLElement} deps.aiTab - AI tab button
 * @param {HTMLElement} deps.storyPanel - Story panel element
 * @param {HTMLElement} deps.debugPanel - Debug panel element
 * @param {HTMLElement} deps.graphPanel - Graph panel element
 * @param {HTMLElement} deps.nodeListPanel - Node list panel element
 * @param {HTMLElement} deps.aiPanel - AI panel element
 * @returns {Object} Handler public API
 * @returns {Function} returns.switchTab - Switch to specified tab
 * @returns {Function} returns.getCurrentTab - Get currently active tab name
 * @returns {Function} returns.isTabActive - Check if specific tab is active
 * @returns {Function} returns.initialize - Initialize tab system
 *
 * @example
 * const handler = initTabs({
 *   renderGraph: () => { /* render */ },
 *   storyTab: document.getElementById('story-tab'),
 *   storyPanel: document.getElementById('story-panel'),
 *   // ... other dependencies
 * });
 * handler.initialize();
 */
export function initTabs(deps) {
  const {
    renderGraph,
    renderDebugInfo,
    renderNodeOverview,
    initAiProvider,
    // DOM references
    storyTab,
    debugTab,
    graphTab,
    nodeListTab,
    aiTab,
    storyPanel,
    debugPanel,
    graphPanel,
    nodeListPanel,
    aiPanel
  } = deps;

  let currentTab = 'story';

  /**
   * Switch to a specific tab and activate its panel
   *
   * Hides all panels, removes active classes, then shows the target panel
   * and activates its tab button. Triggers lazy initialization for tabs
   * that require expensive operations (graph rendering, debug info, etc.).
   *
   * @param {string} tabName - Tab identifier ('story', 'debug', 'graph', 'nodeList', 'ai')
   * @returns {void}
   */
  function switchTab(tabName) {
    // Hide all panels
    [storyPanel, debugPanel, graphPanel, nodeListPanel, aiPanel].forEach(panel => {
      if (panel) panel.classList.remove('active');
    });

    // Remove active class from all tab buttons
    [storyTab, debugTab, graphTab, nodeListTab, aiTab].forEach(tab => {
      if (tab) tab.classList.remove('active');
    });

    // Show selected panel and activate tab
    const panels = { story: storyPanel, debug: debugPanel, graph: graphPanel, nodeList: nodeListPanel, ai: aiPanel };
    const tabs = { story: storyTab, debug: debugTab, graph: graphTab, nodeList: nodeListTab, ai: aiTab };

    const targetPanel = panels[tabName];
    const targetTab = tabs[tabName];

    if (targetPanel) targetPanel.classList.add('active');
    if (targetTab) targetTab.classList.add('active');

    currentTab = tabName;

    // Trigger specific actions for each tab
    switch (tabName) {
      case 'graph':
        if (renderGraph) renderGraph();
        break;
      case 'debug':
        if (renderDebugInfo) renderDebugInfo();
        break;
      case 'nodeList':
        if (renderNodeOverview) renderNodeOverview();
        break;
      case 'ai':
        if (initAiProvider) initAiProvider();
        break;
      case 'story':
        // Story tab doesn't need special initialization
        break;
      default:
        console.warn(`Unknown tab: ${tabName}`);
    }
  }

  /**
   * Get the name of the currently active tab
   *
   * @returns {string} Tab identifier
   */
  function getCurrentTab() {
    return currentTab;
  }

  /**
   * Check if a specific tab is currently active
   *
   * @param {string} tabName - Tab identifier to check
   * @returns {boolean} True if tab is active
   */
  function isTabActive(tabName) {
    return currentTab === tabName;
  }

  /**
   * Setup click event listeners for all tab buttons
   *
   * @returns {void}
   * @private
   */
  function setupTabListeners() {
    const tabButtons = [
      { element: storyTab, name: 'story' },
      { element: debugTab, name: 'debug' },
      { element: graphTab, name: 'graph' },
      { element: nodeListTab, name: 'nodeList' },
      { element: aiTab, name: 'ai' }
    ];

    tabButtons.forEach(({ element, name }) => {
      if (element) {
        element.addEventListener('click', () => switchTab(name));
      }
    });
  }

  /**
   * Initialize tabs and start with story tab active
   *
   * Should be called once during application initialization.
   *
   * @returns {void}
   */
  function initialize() {
    setupTabListeners();
    // Start with story tab active
    switchTab('story');
  }

  // Public API
  return {
    switchTab,
    getCurrentTab,
    isTabActive,
    initialize
  };
}
