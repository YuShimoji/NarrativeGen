/**
 * Graph Editor Manager Module
 * Phase 2: 読み取り専用のグラフビュー（スパイク実装）
 * Dagre.jsを使用した階層型レイアウトでストーリー構造を可視化
 */

import dagre from 'dagre'
import * as d3 from 'd3'

export class GraphEditorManager {
  constructor(appState) {
    this.appState = appState
    this.container = null
    this.svg = null
    this.zoom = null
    this.g = null // ズーム可能なコンテナグループ
    
    // ノードタイプ別の色定義
    this.nodeColors = {
      start: '#22c55e',      // 緑
      conversation: '#3b82f6', // 青
      choice: '#eab308',     // 黄
      branch: '#f97316',     // オレンジ
      ending: '#ef4444'      // 赤
    }
  }

  /**
   * グラフエディタを初期化
   * @param {HTMLElement} containerElement - SVGコンテナ要素
   */
  initialize(containerElement) {
    this.container = containerElement
    this._setupSVG()
  }

  /**
   * SVGとズーム機能をセットアップ
   */
  _setupSVG() {
    if (!this.container) return

    const width = this.container.clientWidth || 800
    const height = this.container.clientHeight || 600

    // 既存のSVGをクリア
    d3.select(this.container).selectAll('*').remove()

    // SVG要素を作成
    this.svg = d3.select(this.container)
      .attr('width', width)
      .attr('height', height)

    // ズーム機能を設定
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (this.g) {
          this.g.attr('transform', event.transform)
        }
      })

    this.svg.call(this.zoom)

    // ズーム可能なコンテナグループを作成
    this.g = this.svg.append('g')

    // グラデーションとフィルターを定義
    this._setupDefs()
  }

  /**
   * SVGのdefs（グラデーション、フィルター等）を設定
   */
  _setupDefs() {
    const defs = this.svg.append('defs')

    // ノード用のドロップシャドウフィルター
    const filter = defs.append('filter')
      .attr('id', 'nodeShadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    
    filter.append('feDropShadow')
      .attr('dx', '2')
      .attr('dy', '2')
      .attr('stdDeviation', '3')
      .attr('flood-color', 'rgba(0,0,0,0.3)')
  }

  /**
   * ノードタイプを判定
   * @param {string} nodeId - ノードID
   * @param {Object} node - ノードオブジェクト
   * @returns {string} ノードタイプ（start, conversation, choice, branch, ending）
   */
  getNodeType(nodeId, node) {
    if (!this.appState.model) return 'conversation'

    // 開始ノード
    if (nodeId === this.appState.model.startNode) {
      return 'start'
    }

    // 終了ノード（typeがendingの場合）
    if (node.type === 'ending') {
      return 'ending'
    }

    // 選択肢がない場合
    if (!node.choices || node.choices.length === 0) {
      // 他のノードから参照されていない場合は終了ノードとして扱う
      const isReferenced = Object.values(this.appState.model.nodes).some(n => 
        n.choices && n.choices.some(c => c.target === nodeId)
      )
      return isReferenced ? 'conversation' : 'ending'
    }

    // 選択肢がある場合
    if (node.choices && node.choices.length > 0) {
      // 条件がある選択肢があるかチェック
      const hasConditions = node.choices.some(choice => 
        choice.conditions && choice.conditions.length > 0
      )
      
      // 条件がある場合は分岐、ない場合は選択
      return hasConditions ? 'branch' : 'choice'
    }

    // デフォルトは会話ノード
    return 'conversation'
  }

  /**
   * モデルからグラフデータ（ノードとエッジ）を生成
   * @returns {Object} { nodes: Array, edges: Array }
   */
  _buildGraphData() {
    if (!this.appState.model || !this.appState.model.nodes) {
      return { nodes: [], edges: [] }
    }

    const nodes = []
    const edges = []
    const nodeMap = this.appState.model.nodes

    // ノードデータを生成
    Object.entries(nodeMap).forEach(([nodeId, node]) => {
      const nodeType = this.getNodeType(nodeId, node)
      const color = this.nodeColors[nodeType] || this.nodeColors.conversation

      nodes.push({
        id: nodeId,
        label: nodeId,
        nodeType: nodeType,
        color: color,
        width: 120,
        height: 60
      })

      // エッジ（選択肢）を生成
      if (node.choices && node.choices.length > 0) {
        node.choices.forEach(choice => {
          if (choice.target && nodeMap[choice.target]) {
            edges.push({
              from: nodeId,
              to: choice.target,
              label: choice.text || '',
              choiceId: choice.id
            })
          }
        })
      }
    })

    return { nodes, edges }
  }

  /**
   * Dagre.jsを使用してレイアウトを計算
   * @param {Array} nodes - ノード配列
   * @param {Array} edges - エッジ配列
   * @returns {Object} Dagreグラフオブジェクト
   */
  _calculateLayout(nodes, edges) {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({
      rankdir: 'TB', // トップダウン
      nodesep: 50,
      ranksep: 80,
      marginx: 50,
      marginy: 50
    })

    // ノードを追加
    nodes.forEach(node => {
      g.setNode(node.id, {
        width: node.width,
        height: node.height,
        label: node.label,
        nodeType: node.nodeType,
        color: node.color
      })
    })

    // エッジを追加
    edges.forEach(edge => {
      g.setEdge(edge.from, edge.to, {
        label: edge.label,
        choiceId: edge.choiceId
      })
    })

    // レイアウトを計算
    dagre.layout(g)

    return g
  }

  /**
   * グラフを描画
   */
  render() {
    if (!this.appState.model) {
      if (this.g) {
        this.g.selectAll('*').remove()
      }
      return
    }

    // SVGを再セットアップ（サイズ変更に対応）
    this._setupSVG()

    // グラフデータを生成
    const { nodes, edges } = this._buildGraphData()

    if (nodes.length === 0) {
      return
    }

    // レイアウトを計算
    const graph = this._calculateLayout(nodes, edges)

    // 既存の要素をクリア
    this.g.selectAll('*').remove()

    // エッジ（矢印）を描画
    const linkGroup = this.g.append('g').attr('class', 'links')
    const link = linkGroup
      .selectAll('g.edge')
      .data(graph.edges())
      .enter()
      .append('g')
      .attr('class', 'edge')

    // エッジのパス（矢印線）
    link.append('path')
      .attr('d', (e) => {
        const edge = graph.edge(e)
        const points = edge.points
        if (!points || points.length === 0) {
          // フォールバック: ノード間を直接結ぶ
          const sourceNode = graph.node(e.v)
          const targetNode = graph.node(e.w)
          if (sourceNode && targetNode) {
            return `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`
          }
          return ''
        }

        // ポイントを連結してパスを作成
        let path = `M ${points[0].x} ${points[0].y}`
        for (let i = 1; i < points.length; i++) {
          path += ` L ${points[i].x} ${points[i].y}`
        }
        return path
      })
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')

    // エッジラベル（選択肢テキスト）
    link.append('text')
      .attr('x', (e) => {
        const edge = graph.edge(e)
        return edge.x || 0
      })
      .attr('y', (e) => {
        const edge = graph.edge(e)
        return (edge.y || 0) - 5
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .attr('pointer-events', 'none')
      .text((e) => {
        const edge = graph.edge(e)
        const label = edge.label || ''
        return label.length > 15 ? label.substring(0, 15) + '...' : label
      })

    // 矢印マーカーを定義
    const defs = this.svg.select('defs')
    if (defs.select('#arrowhead').empty()) {
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#999')
    }

    // ノードを描画
    const nodeGroup = this.g.append('g').attr('class', 'nodes')
    const node = nodeGroup
      .selectAll('g.node')
      .data(graph.nodes())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => {
        const nodeData = graph.node(d)
        return `translate(${nodeData.x},${nodeData.y})`
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        this._onNodeClick(d)
      })

    // ノードの背景（矩形）
    node.append('rect')
      .attr('width', (d) => {
        const nodeData = graph.node(d)
        return nodeData.width
      })
      .attr('height', (d) => {
        const nodeData = graph.node(d)
        return nodeData.height
      })
      .attr('x', (d) => {
        const nodeData = graph.node(d)
        return -nodeData.width / 2
      })
      .attr('y', (d) => {
        const nodeData = graph.node(d)
        return -nodeData.height / 2
      })
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => {
        const nodeData = graph.node(d)
        return nodeData.color
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#nodeShadow)')

    // ノードラベル（テキスト）
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text((d) => {
        const nodeData = graph.node(d)
        const label = nodeData.label || d
        return label.length > 12 ? label.substring(0, 12) + '...' : label
      })

    // ホバー効果
    node.on('mouseenter', function(event) {
      d3.select(this).select('rect')
        .attr('stroke-width', 3)
        .attr('opacity', 0.9)
    })
    .on('mouseleave', function(event) {
      d3.select(this).select('rect')
        .attr('stroke-width', 2)
        .attr('opacity', 1)
    })

    // 全体を表示範囲にフィット
    this.fitToView()
  }

  /**
   * ノードクリック時の処理
   * @param {string} nodeId - クリックされたノードID
   */
  _onNodeClick(nodeId) {
    // GUIエディタとの状態同期：ノードを選択
    if (window.guiEditorManager && typeof window.guiEditorManager.selectNode === 'function') {
      window.guiEditorManager.selectNode(nodeId)
    }

    // ストーリータブに切り替え（オプション）
    if (window.switchTab && typeof window.switchTab === 'function') {
      window.switchTab('story')
    }
  }

  /**
   * ビューを全体表示にフィット
   */
  fitToView() {
    if (!this.svg || !this.g || !this.zoom) return

    const bounds = this.g.node().getBBox()
    const fullWidth = bounds.width
    const fullHeight = bounds.height
    const midX = bounds.x + fullWidth / 2
    const midY = bounds.y + fullHeight / 2

    const containerWidth = this.container.clientWidth
    const containerHeight = this.container.clientHeight

    if (fullWidth === 0 || fullHeight === 0) return

    const scale = Math.min(
      containerWidth / fullWidth,
      containerHeight / fullHeight,
      1
    ) * 0.9

    const translate = [
      containerWidth / 2 - scale * midX,
      containerHeight / 2 - scale * midY
    ]

    this.svg.transition()
      .duration(750)
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      )
  }

  /**
   * レイアウトをリセット（再計算）
   */
  reset() {
    this.render()
  }
}
