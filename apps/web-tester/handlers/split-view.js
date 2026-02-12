// Split View Handler - manages story panel split view toggle and resizer
// Extracted from main.js for better maintainability

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

  function isSplitModeActive() {
    return splitModeActive;
  }

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
