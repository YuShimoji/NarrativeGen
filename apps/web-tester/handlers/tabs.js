// Tab Handler - manages tab switching and panel state
// Extracted from main.js for better maintainability

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

  // Switch to a specific tab
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

  // Get current active tab
  function getCurrentTab() {
    return currentTab;
  }

  // Check if a specific tab is active
  function isTabActive(tabName) {
    return currentTab === tabName;
  }

  // Setup tab event listeners
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

  // Initialize tabs (call this once during app initialization)
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
