// storage-utils.js - localStorage management for NarrativeGen Web Tester
// Handles session/model state persistence with schema validation and error handling

import Logger from '../src/core/logger.js'

// Storage keys namespace
const STORAGE_KEYS = {
  SESSION: 'narrativeGen_savedSession',
  MODEL: 'narrativeGen_savedModel',
  METADATA: 'narrativeGen_savedMetadata',
  AUTO_SAVE: 'narrativeGen_autoSaveEnabled'
}

const SCHEMA_VERSION = '1.0.0'
const QUOTA_WARNING_THRESHOLD = 0.8 // Warn at 80% usage

/**
 * Calculate current localStorage usage
 * @returns {number} Total bytes used
 */
function getStorageUsage() {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return total
}

/**
 * Check if localStorage is available and functional
 * @returns {boolean}
 */
function isStorageAvailable() {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Check storage quota before save
 * @returns {boolean} True if safe to save
 */
function checkStorageQuota() {
  try {
    const usage = getStorageUsage()
    const estimatedQuota = 5 * 1024 * 1024 // 5MB typical limit
    const usageRatio = usage / estimatedQuota

    if (usageRatio > QUOTA_WARNING_THRESHOLD) {
      Logger.warn('Storage quota warning', {
        usage: `${(usage / 1024).toFixed(2)} KB`,
        threshold: `${(QUOTA_WARNING_THRESHOLD * 100).toFixed(0)}%`
      })
      return false
    }
    return true
  } catch (e) {
    Logger.error('Quota check failed', { error: e.message })
    return true // Assume safe if check fails
  }
}

/**
 * Serialize GameSession to JSON
 * @param {GameSession} session - Current game session
 * @param {Model} model - Current narrative model
 * @param {string[]} storyLog - Story progression log
 * @param {Entity[]} entities - Entity catalog
 * @param {string} modelName - Model identifier
 * @returns {Object} Serialized session data
 */
function serializeSession(session, model, storyLog, entities, modelName) {
  return {
    version: SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    modelName: modelName || 'unknown',
    sessionState: {
      nodeId: session.state.nodeId,
      flags: { ...session.state.flags },
      resources: { ...session.state.resources },
      variables: { ...session.state.variables },
      time: session.state.time
    },
    inventory: session.listInventory().map(e => e.id),
    storyLog: [...storyLog],
    entities: entities ? [...entities] : []
  }
}

/**
 * Deserialize and validate session data
 * @param {Object} data - Raw data from localStorage
 * @returns {Object} Validated session data
 * @throws {Error} If data is invalid or incompatible
 */
function deserializeSession(data) {
  if (!data) {
    throw new Error('No save data provided')
  }

  // Version check
  if (data.version !== SCHEMA_VERSION) {
    Logger.warn('Schema version mismatch', {
      saved: data.version,
      current: SCHEMA_VERSION
    })
    // Could implement migration here
    // For now, reject incompatible versions
    throw new Error(`Incompatible save version: ${data.version}`)
  }

  // Validate required fields
  const required = ['sessionState', 'modelName', 'timestamp']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate sessionState structure
  if (!data.sessionState.nodeId) {
    throw new Error('Invalid session state: missing nodeId')
  }

  return data
}

/**
 * Validate session data against current model
 * @param {Object} savedData - Deserialized session data
 * @param {Model} currentModel - Current narrative model
 * @returns {Object} Validation result
 */
function validateSessionModel(savedData, currentModel) {
  const issues = []

  // Check if node exists
  if (!currentModel.nodes[savedData.sessionState.nodeId]) {
    issues.push({
      type: 'missing_node',
      message: `Node "${savedData.sessionState.nodeId}" not found in model`,
      fix: 'Reset to startNode'
    })
  }

  // Check inventory entities
  const savedInventory = savedData.inventory || []
  const entityIds = (savedData.entities || []).map(e => e.id)
  const missingEntities = savedInventory.filter(id => !entityIds.includes(id))

  if (missingEntities.length > 0) {
    issues.push({
      type: 'missing_entities',
      message: `${missingEntities.length} inventory item(s) not in entity catalog`,
      fix: 'Remove missing items'
    })
  }

  return {
    valid: issues.length === 0,
    issues,
    autoFixable: issues.every(i => i.fix)
  }
}

/**
 * Auto-fix validation issues
 * @param {Object} savedData - Session data with issues
 * @param {Model} currentModel - Current model
 * @param {Object} validation - Validation result
 * @returns {Object} Fixed session data
 */
function autoFixSession(savedData, currentModel, validation) {
  const fixed = { ...savedData }

  for (const issue of validation.issues) {
    if (issue.type === 'missing_node') {
      // Reset to startNode
      fixed.sessionState.nodeId = currentModel.startNode
      Logger.info('Auto-fixed missing node', {
        original: savedData.sessionState.nodeId,
        fixed: currentModel.startNode
      })
    }

    if (issue.type === 'missing_entities') {
      // Remove missing entities from inventory
      const entityIds = (savedData.entities || []).map(e => e.id)
      fixed.inventory = fixed.inventory.filter(id => entityIds.includes(id))
      Logger.info('Auto-fixed inventory', {
        original: savedData.inventory.length,
        fixed: fixed.inventory.length
      })
    }
  }

  return fixed
}

/**
 * Storage Manager - Main API
 */
export const StorageManager = {
  /**
   * Save session state to localStorage
   * @param {GameSession} session - Current session
   * @param {Model} model - Current model
   * @param {string[]} storyLog - Story log
   * @param {Entity[]} entities - Entity catalog
   * @param {string} modelName - Model name
   * @returns {boolean} Success status
   */
  saveSession(session, model, storyLog, entities, modelName) {
    try {
      if (!isStorageAvailable()) {
        throw new Error('localStorage is not available')
      }

      if (!checkStorageQuota()) {
        throw new Error('Storage quota exceeded')
      }

      const data = serializeSession(session, model, storyLog, entities, modelName)
      const json = JSON.stringify(data)

      localStorage.setItem(STORAGE_KEYS.SESSION, json)
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify({
        version: SCHEMA_VERSION,
        timestamp: data.timestamp,
        modelName: data.modelName
      }))

      Logger.info('Session saved', {
        nodeId: session.state.nodeId,
        size: `${(json.length / 1024).toFixed(2)} KB`
      })

      return true
    } catch (error) {
      Logger.error('Failed to save session', { error: error.message })

      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        this.handleQuotaExceeded()
      }

      return false
    }
  },

  /**
   * Load session state from localStorage
   * @param {Model} currentModel - Current model for validation
   * @returns {Object|null} Session data or null if not found
   */
  loadSession(currentModel = null) {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.SESSION)
      if (!json) {
        return null
      }

      const data = JSON.parse(json)
      const validated = deserializeSession(data)

      // Validate against current model if provided
      if (currentModel) {
        const validation = validateSessionModel(validated, currentModel)

        if (!validation.valid) {
          Logger.warn('Session validation issues', { issues: validation.issues })

          if (validation.autoFixable) {
            const fixed = autoFixSession(validated, currentModel, validation)
            Logger.info('Session auto-fixed')
            return fixed
          } else {
            throw new Error('Session cannot be auto-fixed')
          }
        }
      }

      Logger.info('Session loaded', {
        nodeId: validated.sessionState.nodeId,
        timestamp: validated.timestamp
      })

      return validated
    } catch (error) {
      Logger.error('Failed to load session', { error: error.message })
      this.handleCorruptedData(error)
      return null
    }
  },

  /**
   * Check if saved session exists
   * @returns {boolean}
   */
  hasSavedSession() {
    return !!localStorage.getItem(STORAGE_KEYS.SESSION)
  },

  /**
   * Get saved session metadata without full load
   * @returns {Object|null} Metadata or null
   */
  getSavedMetadata() {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.METADATA)
      return json ? JSON.parse(json) : null
    } catch (e) {
      return null
    }
  },

  /**
   * Clear all saved state
   */
  clearSavedState() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION)
      localStorage.removeItem(STORAGE_KEYS.METADATA)
      Logger.info('Saved state cleared')
      return true
    } catch (error) {
      Logger.error('Failed to clear saved state', { error: error.message })
      return false
    }
  },

  /**
   * Get total storage usage statistics
   * @returns {Object} Usage stats
   */
  getStorageStats() {
    const total = getStorageUsage()
    const estimatedQuota = 5 * 1024 * 1024

    return {
      totalBytes: total,
      totalKB: (total / 1024).toFixed(2),
      totalMB: (total / 1024 / 1024).toFixed(2),
      estimatedQuotaMB: (estimatedQuota / 1024 / 1024).toFixed(2),
      usagePercent: ((total / estimatedQuota) * 100).toFixed(1)
    }
  },

  /**
   * Check if auto-save is enabled
   * @returns {boolean}
   */
  isAutoSaveEnabled() {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE)
      return value === 'true' // Default false if not set
    } catch (e) {
      return false
    }
  },

  /**
   * Set auto-save preference
   * @param {boolean} enabled
   */
  setAutoSaveEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, enabled ? 'true' : 'false')
      Logger.info('Auto-save preference updated', { enabled })
    } catch (error) {
      Logger.error('Failed to set auto-save preference', { error: error.message })
    }
  },

  /**
   * Handle storage quota exceeded error
   */
  handleQuotaExceeded() {
    const stats = this.getStorageStats()
    const message = `ストレージ容量不足（${stats.totalMB} MB使用中）。古いセーブを削除してください。`

    Logger.error('Storage quota exceeded', stats)

    // Could trigger UI warning here via event
    window.dispatchEvent(new CustomEvent('storage:quota-exceeded', {
      detail: { stats, message }
    }))
  },

  /**
   * Handle corrupted data error
   * @param {Error} error
   */
  handleCorruptedData(error) {
    Logger.error('Corrupted save data detected', { error: error.message })

    // Trigger UI warning
    window.dispatchEvent(new CustomEvent('storage:corrupted', {
      detail: { error: error.message }
    }))
  }
}

export { STORAGE_KEYS, SCHEMA_VERSION }
