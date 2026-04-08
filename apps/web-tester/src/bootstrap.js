/**
 * Bootstrap module - Environment initialization and layout isolation
 * @module bootstrap
 */

import Logger from './core/logger.js'

const a11yModalState = {
    activeModal: null,
    lastFocusedElement: null
}

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

function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
    ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
}

function setupGlobalModalA11y() {
    const modals = Array.from(document.querySelectorAll('.modal'))
    for (const modal of modals) {
        modal.setAttribute('role', 'dialog')
        modal.setAttribute('aria-modal', 'true')
        modal.setAttribute('aria-hidden', modal.classList.contains('show') ? 'false' : 'true')

        const title = modal.querySelector('h3')
        if (title) {
            if (!title.id) title.id = `${modal.id || 'modal'}Title`
            modal.setAttribute('aria-labelledby', title.id)
        }
    }

    const observer = new MutationObserver(() => {
        for (const modal of modals) {
            const visible = modal.classList.contains('show') || modal.style.display === 'flex'
            modal.setAttribute('aria-hidden', visible ? 'false' : 'true')
            if (visible && a11yModalState.activeModal !== modal) {
                a11yModalState.lastFocusedElement = document.activeElement
                a11yModalState.activeModal = modal
                const focusables = getFocusableElements(modal)
                ;(focusables[0] || modal).focus()
            } else if (!visible && a11yModalState.activeModal === modal) {
                a11yModalState.activeModal = null
                if (a11yModalState.lastFocusedElement instanceof HTMLElement) {
                    a11yModalState.lastFocusedElement.focus()
                }
            }
        }
    })

    for (const modal of modals) {
        observer.observe(modal, { attributes: true, attributeFilter: ['class', 'style'] })
    }

    document.addEventListener('keydown', (event) => {
        const modal = a11yModalState.activeModal
        if (!modal) return

        if (event.key === 'Escape') {
            const closeButton = modal.querySelector(
                '#cancelExportBtn, #cancelPreviewBtn, #closePreviewBtn, #closeBatchEditBtn, #cancelQuickNodeBtn, #cancelBatchChoiceBtn, #closeTemplateModalBtn, #closeSnippetModalBtn, #cancelParaphraseBtn, #cancelDraftRestoreBtn, #closePaletteBtn'
            )
            if (closeButton instanceof HTMLElement) {
                closeButton.click()
                event.preventDefault()
            }
            return
        }

        if (event.key !== 'Tab') return
        const focusables = getFocusableElements(modal)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const current = document.activeElement
        if (event.shiftKey && current === first) {
            last.focus()
            event.preventDefault()
        } else if (!event.shiftKey && current === last) {
            first.focus()
            event.preventDefault()
        }
    })
}

function setupTabA11y() {
    const tabList = document.querySelector('.tabs')
    if (!(tabList instanceof HTMLElement)) return
    tabList.setAttribute('role', 'tablist')

    const tabs = Array.from(tabList.querySelectorAll('.tab-btn'))
    const panelMap = {
        storyTab: 'storyPanel',
        graphTab: 'graphPanel',
        debugTab: 'debugPanel',
        referenceTab: 'referencePanel',
        advancedTab: 'advancedPanel'
    }

    for (const tab of tabs) {
        const panelId = panelMap[tab.id]
        tab.setAttribute('role', 'tab')
        tab.setAttribute('aria-controls', panelId || '')
        tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false')
        tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1')

        const panel = panelId ? document.getElementById(panelId) : null
        if (panel) {
            panel.setAttribute('role', 'tabpanel')
            panel.setAttribute('aria-labelledby', tab.id)
        }
    }

    tabList.addEventListener('click', () => {
        for (const tab of tabs) {
            const active = tab.classList.contains('active')
            tab.setAttribute('aria-selected', active ? 'true' : 'false')
            tab.setAttribute('tabindex', active ? '0' : '-1')
        }
    })
}

function setupLandmarkA11y() {
    const storyView = document.getElementById('storyView')
    if (storyView) {
        storyView.setAttribute('role', 'region')
        storyView.setAttribute('aria-label', 'ストーリー表示')
        storyView.setAttribute('aria-live', 'polite')
        storyView.setAttribute('tabindex', '0')
    }

    const graphSvg = document.getElementById('graphSvg')
    if (graphSvg) {
        graphSvg.setAttribute('role', 'img')
        graphSvg.setAttribute('aria-label', 'ノードグラフ表示')
        graphSvg.setAttribute('tabindex', '0')
    }

    const choices = document.getElementById('choices')
    if (choices) {
        choices.setAttribute('role', 'region')
        choices.setAttribute('aria-label', '選択肢一覧')
    }
}

function initializeAccessibility() {
    setupLandmarkA11y()
    setupTabA11y()
    setupGlobalModalA11y()
    Logger.info('Accessibility bootstrap initialized')
}

/**
 * Initialize environment - should be called first before any other initialization
 */
export function initializeEnvironment() {
    checkIDEEnvironment()
    forceLayoutIsolation()
    initializeAccessibility()
    Logger.info('Environment initialized')
}
