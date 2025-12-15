/**
 * Debug Manager Module
 * Handles debug information display and state inspection
 */

import { getCurrentSession } from '../core/session.js'
import { getAvailableChoices } from '../../../../packages/engine-ts/dist/browser.js'

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
        this.flagsDisplay.innerHTML = '<p>セッションを開始してください</p>'
      }
      if (this.resourcesDisplay) {
        this.resourcesDisplay.innerHTML = ''
      }
      if (this.reachableNodes) {
        this.reachableNodes.innerHTML = '<p>モデルを読み込んでください</p>'
      }
      return
    }

    this.renderFlags(currentSession)
    this.renderVariables(currentSession)
    this.renderReachability(currentSession)
  }

  renderFlags(currentSession) {
    if (!this.flagsDisplay) return

    this.flagsDisplay.innerHTML = '<h4>フラグ</h4>'
    if (currentSession.flags && Object.keys(currentSession.flags).length > 0) {
      Object.entries(currentSession.flags).forEach(([key, value]) => {
        const div = document.createElement('div')
        div.className = 'flag-item'
        div.innerHTML = `<span>${key}</span><span>${value}</span>`
        this.flagsDisplay.appendChild(div)
      })
    } else {
      this.flagsDisplay.innerHTML += '<p>フラグなし</p>'
    }
  }

  renderVariables(currentSession) {
    if (!this.variablesDisplay) return

    this.variablesDisplay.innerHTML = '<h4>変数</h4>'
    if (currentSession.variables && Object.keys(currentSession.variables).length > 0) {
      Object.entries(currentSession.variables).forEach(([key, value]) => {
        const div = document.createElement('div')
        div.className = 'variable-item'
        div.innerHTML = `<span>${key}</span><span>${value}</span>`
        this.variablesDisplay.appendChild(div)
      })
    } else {
      this.variablesDisplay.innerHTML += '<p>変数なし</p>'
    }
  }

  renderReachability(currentSession) {
    if (!this.reachableNodes) return

    this.reachableNodes.innerHTML = '<h4>到達可能性</h4>'
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
