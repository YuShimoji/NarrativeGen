/**
 * Split View Handler - Manages story panel split view with drag-to-resize
 *
 * Provides toggleable side-by-side view of story text and JSON model.
 * Implements mouse-based resizing with minimum/maximum width constraints
 * and visual feedback during resize operations.
 *
 * @module handlers/split-view
 */

/**
 * Initialize Split View handler with dependency injection
 *
 * Sets up split view toggle and implements drag-to-resize functionality
 * for the story container and JSON editor panes.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {HTMLButtonElement} deps.toggleSplitViewBtn - Toggle split view button
 * @param {HTMLElement} deps.storyMainContainer - Main story container
 * @param {HTMLElement} deps.storyResizer - Resizer element between panes
 * @param {HTMLTextAreaElement} deps.storyJsonEditor - JSON editor textarea
 * @returns {Object} Handler public API
 * @returns {Function} returns.toggle - Toggle split view mode on/off
 * @returns {Function} returns.isSplitModeActive - Check if split mode is active
 * @returns {Function} returns.setupListeners - Setup event listeners
 *
 * @example
 * const handler = initSplitView({
 *   getModel: () => model,
 *   toggleSplitViewBtn: document.getElementById('toggle-split'),
 *   storyMainContainer: document.getElementById('story-container'),
 *   // ... other dependencies
 * });
 * handler.setupListeners();
 * handler.toggle(); // Enable split view
 */
export function initSplitView(deps) {
  const {
    getModel,
    toggleSplitViewBtn,
    storyMainContainer,
    storyResizer,
    storyJsonEditor,
  } = deps;

  let splitModeActive = false;
  let storyResizerInitialized = false;

  /**
   * Initialize story resizer with drag-to-resize functionality
   *
   * Sets up mouse event handlers for dragging the resizer between left
   * and right panes. Implements minimum and maximum width constraints.
   * Only initializes once, subsequent calls are no-ops.
   *
   * @returns {void}
   * @private
   */
  function initStoryResizer() {
    if (storyResizerInitialized) return;
    
    let isResizing = false;
    const leftPanel = storyMainContainer.querySelector('.story-left-panel');
    
    storyResizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const containerRect = storyMainContainer.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;
      const minWidth = 300;
      const maxWidth = containerRect.width - 300;
      
      if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
        const percentage = (newLeftWidth / containerRect.width * 100).toFixed(2);
        leftPanel.style.flex = `0 0 ${percentage}%`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
    
    storyResizerInitialized = true;
  }

  /**
   * Toggle split view mode on/off
   *
   * When enabled, shows side-by-side view of story and JSON editor
   * with resizable panes. When disabled, hides JSON editor and returns
   * to single-pane view. Populates JSON editor with current model when
   * enabling.
   *
   * @returns {void}
   */
  function toggle() {
    splitModeActive = !splitModeActive;
    
    if (splitModeActive) {
      // Enable split mode
      toggleSplitViewBtn.classList.add('active');
      toggleSplitViewBtn.textContent = '分割ビュー: ON';
      storyMainContainer.classList.add('split-mode');
      
      // Update JSON editor with current model
      storyJsonEditor.value = getModel() ? JSON.stringify(getModel(), null, 2) : '{}';
      
      // Initialize resizer (once)
      initStoryResizer();
      storyResizer.style.cursor = 'ew-resize';
    } else {
      // Disable split mode
      toggleSplitViewBtn.classList.remove('active');
      toggleSplitViewBtn.textContent = '分割ビュー';
      storyMainContainer.classList.remove('split-mode');
      storyResizer.style.cursor = 'default';
    }
  }

  /**
   * Check if split view mode is currently active
   *
   * @returns {boolean} True if split view is enabled
   */
  function isSplitModeActive() {
    return splitModeActive;
  }

  /**
   * Setup event listeners for split view operations
   *
   * Attaches toggle button click handler.
   *
   * @returns {void}
   */
  function setupListeners() {
    toggleSplitViewBtn.addEventListener('click', () => toggle());
  }

  // Public API
  return {
    toggle,
    isSplitModeActive,
    setupListeners,
  };
}
