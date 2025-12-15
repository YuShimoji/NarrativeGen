/**
 * Session Management Module
 * Handles application session state and operations
 */

import { startSession as engineStartSession } from '../../../../packages/engine-ts/dist/browser.js'

// Session state
let currentSession = null
let currentModelName = null

// Session utilities
export function getCurrentSession() {
  return currentSession
}

export function getCurrentModelName() {
  return currentModelName
}

export function setCurrentSession(session) {
  currentSession = session
}

export function setCurrentModelName(name) {
  currentModelName = name
}

export function clearSession() {
  currentSession = null
  currentModelName = null
}

export function startNewSession(model) {
  currentSession = engineStartSession(model)
  return currentSession
}

export function isSessionActive() {
  return currentSession !== null
}

// Session validation
export function validateSession() {
  return currentSession && typeof currentSession === 'object' && currentSession.nodeId
}

// Session persistence
export function saveSessionToStorage(key = 'narrativeGen_session') {
  if (!currentSession) return false

  try {
    const sessionData = {
      session: currentSession,
      modelName: currentModelName,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(sessionData))
    return true
  } catch (error) {
    console.error('Failed to save session to storage:', error)
    return false
  }
}

export function loadSessionFromStorage(key = 'narrativeGen_session') {
  try {
    const savedData = localStorage.getItem(key)
    if (!savedData) return null

    const sessionData = JSON.parse(savedData)

    // Basic validation
    if (!sessionData.session || !sessionData.session.nodeId) {
      console.warn('Invalid session data in storage')
      return null
    }

    currentSession = sessionData.session
    currentModelName = sessionData.modelName || null

    return currentSession
  } catch (error) {
    console.error('Failed to load session from storage:', error)
    return null
  }
}

export function clearSessionFromStorage(key = 'narrativeGen_session') {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Failed to clear session from storage:', error)
    return false
  }
}
