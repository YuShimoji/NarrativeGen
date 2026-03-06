/**
 * DagreLayoutEngine - Dagre.js wrapper for graph layout calculation
 * Extracted from GraphEditorManager for modularity
 */
import dagre from 'dagre'

const DEFAULT_CONFIG = {
  rankdir: 'TB',
  nodesep: 80,
  ranksep: 120,
  edgesep: 40,
  marginx: 60,
  marginy: 60,
}

export class DagreLayoutEngine {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Calculate layout using Dagre.js
   * @param {Array<{id: string, width: number, height: number, label: string, nodeType: string, color: string, graphPosition?: {x: number, y: number}}>} nodes
   * @param {Array<{from: string, to: string, label: string, choiceId: string}>} edges
   * @returns {import('dagre').graphlib.Graph} Dagre graph with computed positions
   */
  calculate(nodes, edges) {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
      rankdir: this.config.rankdir,
      nodesep: this.config.nodesep,
      ranksep: this.config.ranksep,
      edgesep: this.config.edgesep,
      marginx: this.config.marginx,
      marginy: this.config.marginy,
    })

    nodes.forEach(node => {
      g.setNode(node.id, {
        width: node.width,
        height: node.height,
        label: node.label,
        nodeType: node.nodeType,
        color: node.color,
        graphPosition: node.graphPosition,
      })
    })

    edges.forEach(edge => {
      g.setEdge(edge.from, edge.to, {
        label: edge.label,
        choiceId: edge.choiceId,
      })
    })

    dagre.layout(g)

    // Apply custom positions (override Dagre layout for pinned nodes)
    g.nodes().forEach(v => {
      const node = g.node(v)
      if (node.graphPosition) {
        node.x = node.graphPosition.x
        node.y = node.graphPosition.y
      }
    })

    return g
  }

  /** @returns {object} Current config (copy) */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Update layout configuration
   * @param {Partial<typeof DEFAULT_CONFIG>} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }
}

/** Default config values for reference */
export { DEFAULT_CONFIG }
