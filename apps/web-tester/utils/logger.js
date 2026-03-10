// Logger and error boundary utilities

export class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console[level === 'error' ? 'error' : 'log'](`[${timestamp}] ${level.toUpperCase()}: ${message}`, data)

    // Store in sessionStorage for debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('narrativeGenLogs') || '[]')
      logs.push(logEntry)
      // Keep only last 100 entries
      if (logs.length > 100) logs.shift()
      sessionStorage.setItem('narrativeGenLogs', JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to store log:', error)
    }
  }

  static info(message, data) { this.log('info', message, data) }
  static warn(message, data) { this.log('warn', message, data) }
  static error(message, data) { this.log('error', message, data) }
}

// Error boundary for UI operations
export class ErrorBoundary {
  static wrap(operation, fallbackMessage = '操作に失敗しました') {
    return async (...args) => {
      try {
        Logger.info('Operation started', { operation: operation.name, args: args.length })
        const result = await operation.apply(this, args)
        Logger.info('Operation completed', { operation: operation.name })
        return result
      } catch (error) {
        Logger.error('Operation failed', {
          operation: operation.name,
          error: error.message,
          stack: error.stack,
          args: args.length
        })
        // setStatus is imported from main context
        if (typeof window.setStatus === 'function') {
          window.setStatus(`${fallbackMessage}: ${error.message}`, 'error')
        }
        throw error
      }
    }
  }
}
