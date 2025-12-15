/**
 * Logger Module
 * Centralized logging functionality for the application
 */

// Logger configuration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

const LOG_STORAGE_KEY = 'narrativeGenLogs'
const MAX_LOG_ENTRIES = 100

// Current log level (can be configured)
let currentLogLevel = LOG_LEVELS.INFO

export function setLogLevel(level) {
  if (typeof level === 'string') {
    level = LOG_LEVELS[level.toUpperCase()]
  }
  if (typeof level === 'number' && level >= 0 && level <= 3) {
    currentLogLevel = level
  }
}

export function getLogLevel() {
  return currentLogLevel
}

// Main Logger class
class Logger {
  static log(level, message, data = {}) {
    // Check if we should log this level
    const levelValue = typeof level === 'string' ? LOG_LEVELS[level.toUpperCase()] : level
    if (levelValue < currentLogLevel) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: typeof level === 'string' ? level.toUpperCase() : level,
      message,
      ...data,
      userAgent: typeof navigator !== 'undefined' && navigator?.userAgent ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' && window?.location?.href ? window.location.href : 'unknown'
    }

    // Console output
    const consoleMethod = levelValue === LOG_LEVELS.ERROR ? 'error' :
                         levelValue === LOG_LEVELS.WARN ? 'warn' : 'log'
    console[consoleMethod](`[${timestamp}] ${logEntry.level}: ${message}`, data)

    // Store in sessionStorage for debugging
    this.storeLogEntry(logEntry)
  }

  static storeLogEntry(logEntry) {
    try {
      if (typeof sessionStorage === 'undefined') return
      const logs = JSON.parse(sessionStorage.getItem(LOG_STORAGE_KEY) || '[]')
      logs.push(logEntry)

      // Keep only the most recent entries
      if (logs.length > MAX_LOG_ENTRIES) {
        logs.shift()
      }

      sessionStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to store log entry:', error)
    }
  }

  static getStoredLogs() {
    try {
      if (typeof sessionStorage === 'undefined') return []
      return JSON.parse(sessionStorage.getItem(LOG_STORAGE_KEY) || '[]')
    } catch (error) {
      console.warn('Failed to retrieve stored logs:', error)
      return []
    }
  }

  static clearStoredLogs() {
    try {
      if (typeof sessionStorage === 'undefined') return true
      sessionStorage.removeItem(LOG_STORAGE_KEY)
      return true
    } catch (error) {
      console.warn('Failed to clear stored logs:', error)
      return false
    }
  }

  static info(message, data) {
    this.log('INFO', message, data)
  }

  static warn(message, data) {
    this.log('WARN', message, data)
  }

  static error(message, data) {
    this.log('ERROR', message, data)
  }

  static debug(message, data) {
    this.log('DEBUG', message, data)
  }
}

// Export the Logger class as default
export default Logger

// Export individual methods for convenience
export const { log, info, warn, error, debug } = Logger
