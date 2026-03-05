/**
 * Debug Manager Module
 * Handles debug information display and state inspection
 */

import { getCurrentSession } from '../core/session.js'
import { getAvailableChoices } from '../../../../packages/engine-ts/dist/browser.js'
import { escapeHtml, clearContent } from '../utils/html-utils.js'

export class DebugManager {
  constructor(appState) {
    this.appState = appState
    this.flagsDisplay = null
    this.resourcesDisplay = null
    this.variablesDisplay = null
    this.reachableNodes = null
  }

  initialize(flagsElement, resourcesElement, variablesElement, reachableElement) {
    this.flagsDisplay = flagsElement
    this.resourcesDisplay = resourcesElement
    this.variablesDisplay = variablesElement
    this.reachableNodes = reachableElement
  }

  render() {
    const currentSession = getCurrentSession()
    if (!currentSession || !this.appState.model) {
      if (this.flagsDisplay) {
        clearContent(this.flagsDisplay)
        const p1 = document.createElement('p')
        p1.textContent = 'セッションを開始してください'
        this.flagsDisplay.appendChild(p1)
      }
      if (this.resourcesDisplay) {
        clearContent(this.resourcesDisplay)
      }
      if (this.reachableNodes) {
        clearContent(this.reachableNodes)
        const p2 = document.createElement('p')
        p2.textContent = 'モデルを読み込んでください'
        this.reachableNodes.appendChild(p2)
      }
      return
    }

    this.renderFlags(currentSession)
    this.renderVariables(currentSession)
    this.renderReachability(currentSession)
  }

  renderFlags(currentSession) {
    if (!this.flagsDisplay) return

    clearContent(this.flagsDisplay)
    const h4 = document.createElement('h4')
    h4.textContent = 'フラグ'
    this.flagsDisplay.appendChild(h4)

    if (currentSession.flags && Object.keys(currentSession.flags).length > 0) {
      Object.entries(currentSession.flags).forEach(([key, value]) => {
        const div = document.createElement('div')
        div.className = 'flag-item'
        const keySpan = document.createElement('span')
        keySpan.textContent = escapeHtml(key)
        const valueSpan = document.createElement('span')
        valueSpan.textContent = escapeHtml(String(value))
        div.appendChild(keySpan)
        div.appendChild(valueSpan)
        this.flagsDisplay.appendChild(div)
      })
    } else {
      const p = document.createElement('p')
      p.textContent = 'フラグなし'
      this.flagsDisplay.appendChild(p)
    }
  }

  renderVariables(currentSession) {
    if (!this.variablesDisplay) return

    clearContent(this.variablesDisplay)
    const h4 = document.createElement('h4')
    h4.textContent = '変数'
    this.variablesDisplay.appendChild(h4)

    if (currentSession.variables && Object.keys(currentSession.variables).length > 0) {
      Object.entries(currentSession.variables).forEach(([key, value]) => {
        const div = document.createElement('div')
        div.className = 'variable-item'
        const keySpan = document.createElement('span')
        keySpan.textContent = escapeHtml(key)
        const valueSpan = document.createElement('span')
        valueSpan.textContent = escapeHtml(String(value))
        div.appendChild(keySpan)
        div.appendChild(valueSpan)
        this.variablesDisplay.appendChild(div)
      })
    } else {
      const p = document.createElement('p')
      p.textContent = '変数なし'
      this.variablesDisplay.appendChild(p)
    }
  }

  renderReachability(currentSession) {
    if (!this.reachableNodes) return

    clearContent(this.reachableNodes)
    const h4 = document.createElement('h4')
    h4.textContent = '到達可能性'
    this.reachableNodes.appendChild(h4)
    const visited = new Set([currentSession.nodeId])
    const queue = [currentSession.nodeId]
    const reachable = new Set([currentSession.nodeId])

    // BFS to find all reachable nodes
    while (queue.length > 0) {
      const currentNodeId = queue.shift()
      const node = this.appState.model.nodes[currentNodeId]
      if (!node) continue

      node.choices?.forEach(choice => {
        if (!visited.has(choice.target)) {
          visited.add(choice.target)
          // Check if choice is available in current state
          try {
            const availableChoices = getAvailableChoices(currentSession, this.appState.model)
            const isAvailable = availableChoices.some(c => c.id === choice.id)
            if (isAvailable) {
              queue.push(choice.target)
              reachable.add(choice.target)
            }
          } catch (e) {
            // If error, assume reachable for now
            reachable.add(choice.target)
          }
        }
      })
    }

    // Display all nodes with reachability status
    Object.keys(this.appState.model.nodes).forEach(nodeId => {
      const div = document.createElement('div')
      div.className = reachable.has(nodeId) ? 'reachable-node' : 'unreachable-node'
      div.textContent = `${nodeId}: ${reachable.has(nodeId) ? '到達可能' : '未到達'}`
      this.reachableNodes.appendChild(div)
    })
  }

  // Utility methods for inspecting state
  getSessionSummary() {
    const currentSession = getCurrentSession()
    if (!currentSession) return null

    return {
      nodeId: currentSession.nodeId,
      flagsCount: Object.keys(currentSession.flags || {}).length,
      variablesCount: Object.keys(currentSession.variables || {}).length,
      resourcesCount: Object.keys(currentSession.resources || {}).length,
      time: currentSession.time
    }
  }

  getModelSummary() {
    if (!this.appState.model) return null

    const nodes = Object.keys(this.appState.model.nodes)
    let totalChoices = 0
    nodes.forEach(nodeId => {
      const node = this.appState.model.nodes[nodeId]
      totalChoices += node.choices?.length || 0
    })

    return {
      nodeCount: nodes.length,
      choiceCount: totalChoices,
      startNode: this.appState.model.startNode,
      hasFlags: !!(this.appState.model.flags && Object.keys(this.appState.model.flags).length > 0),
      hasResources: !!(this.appState.model.resources && Object.keys(this.appState.model.resources).length > 0)
    }
  }
}
