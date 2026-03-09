/**
 * Bootstrap module - Environment initialization and layout isolation
 * @module bootstrap
 */

import Logger from './core/logger.js'

/**
 * Check for IDE environment conflicts
 */
function checkIDEEnvironment() {
    try {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.info('Web Tester loaded in IDE environment', {
                userAgent: navigator.userAgent,
                hasMigrationWizard: typeof window.migrationWizard !== 'undefined'
            })
        }
    } catch (error) {
        console.warn('IDE environment check failed', { error: error.message })
    }
}

/**
 * Force layout isolation from external styles (IDE preview, extensions, etc.)
 */
function forceLayoutIsolation() {
    const forceStyles = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
    }
    .app-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 9999 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .panel {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
    }
  `
    const styleEl = document.createElement('style')
    styleEl.id = 'narrativegen-layout-isolation'
    styleEl.textContent = forceStyles
    document.head.appendChild(styleEl)

    // Also apply inline styles as fallback
    const appContainer = document.querySelector('.app-container')
    if (appContainer) {
        appContainer.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; max-width: 100vw !important; margin: 0 !important; padding: 0 !important; z-index: 9999 !important; display: flex !important; flex-direction: column !important; overflow: hidden;'
    }

    const panel = document.querySelector('.panel')
    if (panel) {
        panel.style.cssText = 'width: 100% !important; max-width: none !important; margin: 0 !important; flex: 1; display: flex; flex-direction: column; min-height: 0;'
    }
}

/**
 * Initialize environment - should be called first before any other initialization
 */
export function initializeEnvironment() {
    checkIDEEnvironment()
    forceLayoutIsolation()
    Logger.info('Environment initialized')
}
