/**
 * Hierarchy State Manager - Manages expansion/collapse state of group nodes
 * @module ui/hierarchy-state
 */

const STORAGE_KEY = 'ng_hierarchy_expansion_state'

/**
 * Get expansion state for a specific group from localStorage
 * @param {string} groupPath - Group path to check
 * @returns {boolean} True if expanded, false if collapsed (defaults to true)
 * @example
 * const isExpanded = getExpansionState('chapter1/intro')
 */
export function getExpansionState(groupPath) {
  if (!groupPath || typeof groupPath !== 'string') {
    return true // Default to expanded
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return true // Default to expanded if no state saved
    }

    const state = JSON.parse(stored)

    // If state for this group exists, return it; otherwise default to true
    return state[groupPath] !== undefined ? state[groupPath] : true
  } catch (error) {
    console.error('Failed to get expansion state:', error)
    return true // Default to expanded on error
  }
}

/**
 * Set expansion state for a specific group in localStorage
 * @param {string} groupPath - Group path to update
 * @param {boolean} isExpanded - True to expand, false to collapse
 * @returns {boolean} True if save was successful
 * @example
 * setExpansionState('chapter1/intro', false) // Collapse the group
 */
export function setExpansionState(groupPath, isExpanded) {
  if (!groupPath || typeof groupPath !== 'string') {
    return false
  }

  try {
    // Load existing state
    let state = {}
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      state = JSON.parse(stored)
    }

    // Update state for this group
    state[groupPath] = Boolean(isExpanded)

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error('Failed to set expansion state:', error)

    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded - expansion state not saved')

      // Dispatch event for UI notification
      window.dispatchEvent(new CustomEvent('hierarchy:quota-exceeded', {
        detail: { groupPath, error: error.message }
      }))
    }

    return false
  }
}

/**
 * Expand all groups (set all to expanded state)
 * @param {string[]} groups - Array of all group paths
 * @returns {boolean} True if save was successful
 * @example
 * expandAll(['chapter1', 'chapter2', 'endings'])
 */
export function expandAll(groups) {
  if (!Array.isArray(groups)) {
    return false
  }

  try {
    const state = {}

    // Set all groups to expanded
    for (const groupPath of groups) {
      if (groupPath && typeof groupPath === 'string') {
        state[groupPath] = true
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error('Failed to expand all groups:', error)

    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded - expansion state not saved')
      window.dispatchEvent(new CustomEvent('hierarchy:quota-exceeded', {
        detail: { error: error.message }
      }))
    }

    return false
  }
}

/**
 * Collapse all groups (set all to collapsed state)
 * @param {string[]} groups - Array of all group paths
 * @returns {boolean} True if save was successful
 * @example
 * collapseAll(['chapter1', 'chapter2', 'endings'])
 */
export function collapseAll(groups) {
  if (!Array.isArray(groups)) {
    return false
  }

  try {
    const state = {}

    // Set all groups to collapsed
    for (const groupPath of groups) {
      if (groupPath && typeof groupPath === 'string') {
        state[groupPath] = false
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error('Failed to collapse all groups:', error)

    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded - expansion state not saved')
      window.dispatchEvent(new CustomEvent('hierarchy:quota-exceeded', {
        detail: { error: error.message }
      }))
    }

    return false
  }
}

/**
 * Restore expansion state for all groups on initialization
 * Returns a map of group paths to their expansion states
 * @param {string[]} groups - Array of all group paths
 * @returns {Object.<string, boolean>} Map of group path to expansion state
 * @example
 * const state = restoreExpansionState(['chapter1', 'chapter2'])
 * // Returns: { 'chapter1': true, 'chapter2': false }
 */
export function restoreExpansionState(groups) {
  if (!Array.isArray(groups)) {
    return {}
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const savedState = stored ? JSON.parse(stored) : {}
    const restoredState = {}

    // For each group, restore its state or default to expanded
    for (const groupPath of groups) {
      if (groupPath && typeof groupPath === 'string') {
        restoredState[groupPath] = savedState[groupPath] !== undefined
          ? savedState[groupPath]
          : true // Default to expanded
      }
    }

    return restoredState
  } catch (error) {
    console.error('Failed to restore expansion state:', error)

    // Return all expanded as fallback
    const fallbackState = {}
    for (const groupPath of groups) {
      if (groupPath && typeof groupPath === 'string') {
        fallbackState[groupPath] = true
      }
    }
    return fallbackState
  }
}

/**
 * Clear all expansion state from localStorage
 * Useful for resetting to defaults
 * @returns {boolean} True if clear was successful
 * @example
 * clearExpansionState() // Reset all groups to default (expanded)
 */
export function clearExpansionState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear expansion state:', error)
    return false
  }
}

/**
 * Get all stored expansion states
 * Useful for debugging or exporting state
 * @returns {Object.<string, boolean>|null} Map of all stored states or null on error
 * @example
 * const allStates = getAllExpansionStates()
 */
export function getAllExpansionStates() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to get all expansion states:', error)
    return null
  }
}

/**
 * Toggle expansion state for a group (flip current state)
 * @param {string} groupPath - Group path to toggle
 * @returns {boolean} New expansion state after toggle
 * @example
 * const newState = toggleExpansionState('chapter1')
 * // If was true, returns false; if was false, returns true
 */
export function toggleExpansionState(groupPath) {
  const currentState = getExpansionState(groupPath)
  const newState = !currentState
  setExpansionState(groupPath, newState)
  return newState
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
function isStorageAvailable() {
  try {
    const test = '__test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Initialize hierarchy state management
 * Checks if storage is available and sets up error handling
 * @returns {boolean} True if initialization successful
 * @example
 * if (initHierarchyState()) {
 *   console.log('Hierarchy state management ready')
 * }
 */
export function initHierarchyState() {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available - expansion state will not persist')
    return false
  }

  // Verify stored data is valid JSON
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      JSON.parse(stored) // Test parse
    }
    return true
  } catch (error) {
    console.error('Corrupted expansion state data - clearing:', error)
    clearExpansionState()
    return true
  }
}

/**
 * Export hierarchy state as JSON string
 * Useful for backup or debugging
 * @returns {string|null} JSON string of state or null on error
 * @example
 * const backup = exportHierarchyState()
 * // Save to file or clipboard
 */
export function exportHierarchyState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored || '{}'
  } catch (error) {
    console.error('Failed to export hierarchy state:', error)
    return null
  }
}

/**
 * Import hierarchy state from JSON string
 * Useful for restoring from backup
 * @param {string} jsonState - JSON string of state
 * @returns {boolean} True if import was successful
 * @example
 * importHierarchyState('{"chapter1":true,"chapter2":false}')
 */
export function importHierarchyState(jsonState) {
  if (!jsonState || typeof jsonState !== 'string') {
    return false
  }

  try {
    // Validate JSON
    const state = JSON.parse(jsonState)

    // Validate structure (should be object with boolean values)
    if (typeof state !== 'object' || state === null) {
      throw new Error('Invalid state structure')
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error('Failed to import hierarchy state:', error)
    return false
  }
}
