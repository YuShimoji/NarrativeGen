/**
 * Graph Manager Module
 * Handles graph visualization and rendering for narrative models
 */

export class GraphManager {
  constructor(appState) {
    this.appState = appState
    this.container = null
    this.simulation = null
    this.zoom = null
    this.nodeShape = 'circle'
    this.fontSize = 12
    this.showConditions = false
  }

  initialize(containerElement) {
    this.container = containerElement
  }

  render() {
    if (!this.appState.model) {
      d3.select(this.container).selectAll('*').remove()
      return
    }

    const width = this.container.clientWidth || this.container.parentElement.clientWidth || 800
    const height = this.container.clientHeight || this.container.parentElement.clientHeight || 600

    // Performance optimization: Limit nodes for large graphs
    const maxNodes = 100
    const allNodes = Object.keys(this.appState.model.nodes)
    const shouldVirtualize = allNodes.length > maxNodes

    let nodesToShow
    if (shouldVirtualize) {
      // Show current node and its direct connections, plus some random nodes
      const currentSession = getCurrentSession()
      const currentNode = currentSession?.nodeId || this.appState.model.startNode
      const connectedNodes = new Set([currentNode])

      // Add directly connected nodes
      const currentNodeObj = this.appState.model.nodes[currentNode]
      if (currentNodeObj?.choices) {
        currentNodeObj.choices.forEach(choice => {
          if (choice.target) connectedNodes.add(choice.target)
        })
      }

      // Add nodes that connect to current node
      Object.entries(this.appState.model.nodes).forEach(([id, node]) => {
        if (node.choices?.some(c => c.target === currentNode)) {
          connectedNodes.add(id)
        }
      })

      // Fill remaining slots with random nodes
      const remaining = Array.from(allNodes.filter(id => !connectedNodes.has(id)))
      const randomNodes = remaining
        .sort(() => Math.random() - 0.5)
        .slice(0, maxNodes - connectedNodes.size)

      nodesToShow = Array.from(connectedNodes).concat(randomNodes)
    } else {
      nodesToShow = allNodes
    }

    // Clear previous graph
    d3.select(this.container).selectAll('*').remove()

    const svg = d3.select(this.container)
      .attr('width', width)
      .attr('height', height)

    // Add defs for gradients and filters
    const defs = svg.append('defs')

    // Gradient for nodes
    const gradient = defs.append('linearGradient')
      .attr('id', 'nodeGradient')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#60a5fa')
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6')

    // Filter for shadow
    const filter = defs.append('filter')
      .attr('id', 'nodeShadow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    filter.append('feDropShadow')
      .attr('dx', '2').attr('dy', '2').attr('stdDeviation', '3')
      .attr('flood-color', 'rgba(0,0,0,0.3)')

    // Add zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform)
      })

    svg.call(this.zoom)

    // Create container group for zoom
    const container = svg.append('g')

    // Create nodes and links data (only for visible nodes)
    const nodes = []
    const links = []

    nodesToShow.forEach(id => {
      const node = this.appState.model.nodes[id]
      if (!node) return

      nodes.push({
        id: id,
        text: node.text?.substring(0, 50) + (node.text?.length > 50 ? '...' : ''),
        x: Math.random() * (width - 200) + 100,
        y: Math.random() * (height - 200) + 100,
        isVirtualized: shouldVirtualize && !this.isConnectedToCurrent(id)
      })

      node.choices?.forEach(choice => {
        if (choice.target && nodesToShow.includes(choice.target)) {
          links.push({
            source: id,
            target: choice.target,
            condition: this.showConditions ? this.getConditionText(choice.conditions) : null
          })
        }
      })
    })

    // Performance optimization: Use efficient force simulation settings
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(shouldVirtualize ? 100 : 150).strength(0.5))
      .force('charge', d3.forceManyBody().strength(shouldVirtualize ? -200 : -300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(shouldVirtualize ? 40 : 60))
      .alphaDecay(0.05)
      .velocityDecay(0.4)

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', shouldVirtualize ? 1 : 2)

    // Add condition labels to links (only if enabled and not virtualized)
    let linkLabels
    if (this.showConditions && !shouldVirtualize) {
      linkLabels = container.append('g')
        .selectAll('text')
        .data(links.filter(l => l.condition))
        .enter().append('text')
        .attr('font-size', `${this.fontSize}px`)
        .attr('fill', '#666')
        .attr('text-anchor', 'middle')
        .text(d => d.condition)
    }

    // Create nodes
    const node = container.append('g')
      .selectAll(this.nodeShape === 'rect' ? 'rect' : 'circle')
      .data(nodes)
      .enter().append(this.nodeShape === 'rect' ? 'rect' : 'circle')

    if (this.nodeShape === 'circle') {
      node.attr('r', d => d.isVirtualized ? 20 : 30)
    } else {
      node.attr('width', d => d.isVirtualized ? 40 : 60)
        .attr('height', d => d.isVirtualized ? 40 : 60)
        .attr('x', d => d.isVirtualized ? -20 : -30)
        .attr('y', d => d.isVirtualized ? -20 : -30)
    }

    node.attr('fill', 'url(#nodeGradient)')
      .attr('filter', 'url(#nodeShadow)')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0.1).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    // Add node labels
    let labels
    if (!shouldVirtualize) {
      labels = container.append('g')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', `${this.fontSize}px`)
        .attr('fill', '#333')
        .text(d => d.id)

      // Position labels based on shape
      if (this.nodeShape === 'circle') {
        labels.attr('x', d => d.x).attr('y', d => d.y)
      } else {
        labels.attr('x', d => d.x + (d.isVirtualized ? 20 : 30))
          .attr('y', d => d.y + (d.isVirtualized ? 20 : 30))
      }
    }

    // Update positions on simulation tick
    let tickCount = 0
    this.simulation.on('tick', () => {
      tickCount++
      if (tickCount % 3 !== 0) return // Update every 3 ticks for performance

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      if (!shouldVirtualize) {
        if (this.nodeShape === 'circle') {
          labels.attr('x', d => d.x).attr('y', d => d.y)
        } else {
          labels.attr('x', d => d.x + (d.isVirtualized ? 20 : 30))
            .attr('y', d => d.y + (d.isVirtualized ? 20 : 30))
        }
      }

      node
        .attr(this.nodeShape === 'circle' ? 'cx' : 'x', d => d.x)
        .attr(this.nodeShape === 'circle' ? 'cy' : 'y', d => d.y)

      if (this.showConditions && !shouldVirtualize && linkLabels) {
        linkLabels
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2)
      }
    })

    // Add virtualization notice
    if (shouldVirtualize) {
      svg.append('text')
        .attr('x', width - 10)
        .attr('y', 20)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .text(`表示中: ${nodesToShow.length}/${allNodes.length} ノード`)
    }
  }

  fitToView() {
    if (!this.container || !this.zoom) return
    const svg = d3.select(this.container)
    const g = svg.select('g')
    if (!g.node()) return

    const bounds = g.node().getBBox()
    const fullWidth = bounds.width
    const fullHeight = bounds.height
    const midX = bounds.x + fullWidth / 2
    const midY = bounds.y + fullHeight / 2

    const width = this.container.clientWidth
    const height = this.container.clientHeight
    const scale = Math.min(width / fullWidth, height / fullHeight) * 0.8
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY]

    svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    )
  }

  reset() {
    const nodes = this.simulation?.nodes()
    if (nodes) {
      const width = this.container.clientWidth
      const height = this.container.clientHeight
      nodes.forEach(n => {
        n.x = Math.random() * (width - 200) + 100
        n.y = Math.random() * (height - 200) + 100
        n.fx = null
        n.fy = null
      })
      this.simulation.restart()
    }
  }

  setNodeShape(shape) {
    this.nodeShape = shape
    this.render()
  }

  setFontSize(size) {
    this.fontSize = size
    this.render()
  }

  setShowConditions(show) {
    this.showConditions = show
    this.render()
  }

  isConnectedToCurrent(nodeId) {
    const currentSession = getCurrentSession()
    const currentNode = currentSession?.nodeId || this.appState.model.startNode
    return nodeId === currentNode ||
           this.appState.model.nodes[currentNode]?.choices?.some(c => c.target === nodeId) ||
           Object.values(this.appState.model.nodes).some(node =>
             node.choices?.some(c => c.target === currentNode && node.id === nodeId))
  }

  getConditionText(conditions) {
    if (!conditions || conditions.length === 0) return ''
    return conditions.map(cond => {
      if (cond.type === 'flag') return `flag:${cond.key}=${cond.value}`
      if (cond.type === 'resource') return `res:${cond.key}${cond.op}${cond.value}`
      if (cond.type === 'variable') return `var:${cond.key}${cond.op}${cond.value}`
      if (cond.type === 'timeWindow') return `time:${cond.start}-${cond.end}`
      if (cond.type === 'and') return `AND(${cond.conditions.map(c => this.getConditionText([c])).join(',')})`
      if (cond.type === 'or') return `OR(${cond.conditions.map(c => this.getConditionText([c])).join(',')})`
      if (cond.type === 'not') return `NOT(${this.getConditionText([cond.condition])})`
      return cond.type
    }).join(', ')
  }

  savePreset() {
    const preset = {
      nodeShape: this.nodeShape,
      fontSize: this.fontSize
    }
    localStorage.setItem('graphPreset', JSON.stringify(preset))
    return true
  }

  loadPreset() {
    const stored = localStorage.getItem('graphPreset')
    if (stored) {
      const preset = JSON.parse(stored)
      this.nodeShape = preset.nodeShape
      this.fontSize = preset.fontSize
      this.render()
      return true
    }
    return false
  }
}
