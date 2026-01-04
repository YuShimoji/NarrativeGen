/**
 * Graph Editor Manager Module
 * Phase 2: グラフビューエディタ（編集機能付き）
 * Dagre.jsを使用した階層型レイアウトでストーリー構造を可視化・編集
 */

import dagre from 'dagre'
import * as d3 from 'd3'
import { NODE_TEMPLATES, NODE_ID_PREFIX } from '../../config/constants.js'

export class GraphEditorManager {
  constructor(appState) {
    this.appState = appState
    this.container = null
    this.svg = null
    this.zoom = null
    this.g = null // ズーム可能なコンテナグループ
    
    // 編集状態管理
    this.selectedNodeId = null
    this.selectedEdge = null // { from: string, to: string, choiceId: string }
    this.dragSourceNodeId = null // エッジ作成用のドラッグ元ノード
    this.editingNodeId = null // インライン編集中のノードID
    this.contextMenu = null // 右クリックメニュー要素
    this._lastNodeClick = { nodeId: null, time: 0 } // ダブルクリック検出用
    
    // レスポンシブ対応
    this.resizeObserver = null // ResizeObserverインスタンス
    this.resizeDebounceTimer = null // デバウンス用タイマー
    this.resizeDebounceDelay = 300 // デバウンス遅延時間（ms）
    
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
    this._setupEventHandlers()
    this._setupResizeObserver()
    this._createContextMenu()
  }

  /**
   * イベントハンドラーをセットアップ
   */
  _setupEventHandlers() {
    // Deleteキーでノード/エッジ削除
    if (this.container) {
      this.container.addEventListener('keydown', (event) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (this.selectedNodeId) {
            this._deleteNode(this.selectedNodeId)
            event.preventDefault()
          } else if (this.selectedEdge) {
            this._deleteEdge(this.selectedEdge)
            event.preventDefault()
          }
        }
        // Escapeキーで選択解除・編集モード終了
        if (event.key === 'Escape') {
          this.selectedNodeId = null
          this.selectedEdge = null
          this.editingNodeId = null
          this.render()
        }
      })
      
      // フォーカス可能にする
      this.container.setAttribute('tabindex', '0')
    }
  }

  /**
   * 右クリックメニューを作成
   */
  _createContextMenu() {
    // 既存のメニューを削除
    const existingMenu = document.getElementById('graph-context-menu')
    if (existingMenu) {
      existingMenu.remove()
    }

    // メニュー要素を作成
    this.contextMenu = document.createElement('div')
    this.contextMenu.id = 'graph-context-menu'
    this.contextMenu.className = 'context-menu'
    this.contextMenu.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      padding: 4px 0;
      display: none;
      z-index: 1000;
      min-width: 150px;
    `
    document.body.appendChild(this.contextMenu)

    // メニュー外クリックで閉じる
    document.addEventListener('click', (event) => {
      if (this.contextMenu && !this.contextMenu.contains(event.target)) {
        this.contextMenu.style.display = 'none'
      }
    })
  }

  /**
   * 右クリックメニューを表示
   * @param {Event} event - マウスイベント
   * @param {string|null} nodeId - ノードID（nullの場合はキャンバス上）
   * @param {Object|null} edge - エッジ情報（nullの場合はエッジ上ではない）
   */
  _showContextMenu(event, nodeId = null, edge = null) {
    if (!this.contextMenu) return

    event.preventDefault()
    event.stopPropagation()

    // メニュー位置を設定
    this.contextMenu.style.left = `${event.clientX}px`
    this.contextMenu.style.top = `${event.clientY}px`
    this.contextMenu.style.display = 'block'

    // メニュー内容を生成
    let menuHTML = ''

    if (nodeId) {
      // ノード上での右クリック
      menuHTML = `
        <div class="context-menu-item" data-action="edit-node">編集</div>
        <div class="context-menu-item" data-action="delete-node">削除</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="add-node-from">ここから接続を作成</div>
      `
    } else if (edge) {
      // エッジ上での右クリック
      menuHTML = `
        <div class="context-menu-item" data-action="edit-edge">編集</div>
        <div class="context-menu-item" data-action="delete-edge">削除</div>
      `
    } else {
      // キャンバス上での右クリック
      menuHTML = `
        <div class="context-menu-item" data-action="add-node-conversation">会話ノードを追加</div>
        <div class="context-menu-item" data-action="add-node-choice">選択ノードを追加</div>
        <div class="context-menu-item" data-action="add-node-branch">分岐ノードを追加</div>
        <div class="context-menu-item" data-action="add-node-ending">終了ノードを追加</div>
      `
    }

    this.contextMenu.innerHTML = menuHTML

    // メニュー項目のイベントハンドラー
    this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      `
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f0f0'
      })
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent'
      })
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        this._handleContextMenuAction(item.dataset.action, nodeId, edge, event)
        this.contextMenu.style.display = 'none'
      })
    })
  }

  /**
   * コンテキストメニューのアクションを処理
   * @param {string} action - アクション名
   * @param {string|null} nodeId - ノードID
   * @param {Object|null} edge - エッジ情報
   * @param {Event} event - マウスイベント
   */
  _handleContextMenuAction(action, nodeId, edge, event) {
    switch (action) {
      case 'edit-node':
        if (nodeId) {
          this._startInlineEdit(nodeId)
        }
        break
      case 'delete-node':
        if (nodeId) {
          this._deleteNode(nodeId)
        }
        break
      case 'add-node-from':
        if (nodeId) {
          this.dragSourceNodeId = nodeId
          if (typeof window.setStatus === 'function') {
        window.setStatus('接続先のノードをクリックしてください', 'info')
      }
        }
        break
      case 'edit-edge':
        if (edge) {
          this._editEdge(edge)
        }
        break
      case 'delete-edge':
        if (edge) {
          this._deleteEdge(edge)
        }
        break
      case 'add-node-conversation':
        this._addNodeAtPosition('conversation', event)
        break
      case 'add-node-choice':
        this._addNodeAtPosition('choice', event)
        break
      case 'add-node-branch':
        this._addNodeAtPosition('branch', event)
        break
      case 'add-node-ending':
        this._addNodeAtPosition('ending', event)
        break
    }
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
      .style('cursor', 'pointer')
      .on('click', (event, e) => {
        event.stopPropagation()
        const edge = graph.edge(e)
        this.selectedEdge = {
          from: e.v,
          to: e.w,
          choiceId: edge.choiceId
        }
        this.selectedNodeId = null
        this.render()
      })
      .on('contextmenu', (event, e) => {
        event.stopPropagation()
        const edge = graph.edge(e)
        this._showContextMenu(event, null, {
          from: e.v,
          to: e.w,
          choiceId: edge.choiceId
        })
      })

    // エッジのパス（矢印線）- 選択状態に応じて色を変更
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
      .attr('stroke', (e) => {
        const edge = graph.edge(e)
        if (this.selectedEdge && this.selectedEdge.choiceId === edge.choiceId) {
          return '#3b82f6' // 選択時は青
        }
        return '#999'
      })
      .attr('stroke-width', (e) => {
        const edge = graph.edge(e)
        if (this.selectedEdge && this.selectedEdge.choiceId === edge.choiceId) {
          return 3 // 選択時は太く
        }
        return 2
      })
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
      .attr('data-node-id', (d) => d)
      .attr('transform', (d) => {
        const nodeData = graph.node(d)
        return `translate(${nodeData.x},${nodeData.y})`
      })
      .style('cursor', this.dragSourceNodeId ? 'crosshair' : 'pointer')
      .on('click', (event, d) => {
        // ダブルクリックの検出のため、クリックイベントで処理
        const now = Date.now()
        const lastClick = this._lastNodeClick || { nodeId: null, time: 0 }
        
        if (lastClick.nodeId === d && now - lastClick.time < 300) {
          // ダブルクリック
          event.stopPropagation()
          this._startInlineEdit(d)
          this._lastNodeClick = { nodeId: null, time: 0 }
        } else {
          // シングルクリック
          this._onNodeClick(d, event)
          this._lastNodeClick = { nodeId: d, time: now }
        }
      })
      .on('contextmenu', (event, d) => {
        event.stopPropagation()
        this._showContextMenu(event, d, null)
      })

    // ノードの背景（矩形）- 選択状態に応じてスタイルを変更
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
      .attr('stroke', (d) => {
        if (this.selectedNodeId === d) {
          return '#3b82f6' // 選択時は青
        }
        return '#fff'
      })
      .attr('stroke-width', (d) => {
        if (this.selectedNodeId === d) {
          return 4 // 選択時は太く
        }
        return 2
      })
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

    // ホバー効果（選択時は変更しない）
    node.on('mouseenter', function(event, d) {
      if (this.selectedNodeId !== d) {
        d3.select(this).select('rect')
          .attr('stroke-width', 3)
          .attr('opacity', 0.9)
      }
    })
    .on('mouseleave', function(event, d) {
      if (this.selectedNodeId !== d) {
        d3.select(this).select('rect')
          .attr('stroke-width', 2)
          .attr('opacity', 1)
      }
    })

    // キャンバス上での右クリック（ノード追加メニュー）
    this.svg.on('contextmenu', (event) => {
      // ノードやエッジ上でない場合のみ
      if (event.target.tagName !== 'rect' && event.target.tagName !== 'path' && event.target.tagName !== 'text') {
        this._showContextMenu(event, null, null)
      }
    })

    // キャンバス上でのクリック（選択解除）
    this.svg.on('click', (event) => {
      if (event.target === this.svg.node() || event.target.tagName === 'svg') {
        this.selectedNodeId = null
        this.selectedEdge = null
        this.dragSourceNodeId = null
        this.render()
      }
    })

    // 全体を表示範囲にフィット
    this.fitToView()
  }

  /**
   * ノードクリック時の処理
   * @param {string} nodeId - クリックされたノードID
   */
  _onNodeClick(nodeId, event = null) {
    // エッジ作成モードの場合
    if (this.dragSourceNodeId && this.dragSourceNodeId !== nodeId) {
      this._createEdge(this.dragSourceNodeId, nodeId)
      this.dragSourceNodeId = null
      if (typeof window.setStatus === 'function') {
        window.setStatus('接続を作成しました', 'success')
      }
      return
    }

    // 通常の選択
    this.selectedNodeId = nodeId
    this.selectedEdge = null
    this.render()

    // GUIエディタとの状態同期：ノードを選択
    if (window.guiEditorManager && typeof window.guiEditorManager.selectNode === 'function') {
      window.guiEditorManager.selectNode(nodeId)
    }

    // ダブルクリックでインライン編集
    if (event && event.detail === 2) {
      this._startInlineEdit(nodeId)
    }
  }

  /**
   * 指定位置にノードを追加
   * @param {string} nodeType - ノードタイプ（conversation, choice, branch, ending）
   * @param {Event} event - マウスイベント（位置取得用）
   */
  _addNodeAtPosition(nodeType, event) {
    if (!this.appState.model) {
      if (typeof window.setStatus === 'function') {
        window.setStatus('モデルが読み込まれていません', 'warn')
      }
      return
    }

    // ノードIDを生成
    const nodeId = this._generateNodeId()

    // テンプレートを取得
    const template = NODE_TEMPLATES[nodeType] || NODE_TEMPLATES.blank
    const newNode = {
      id: nodeId,
      text: template.text || '',
      choices: template.choices ? JSON.parse(JSON.stringify(template.choices)) : [],
      type: nodeType === 'ending' ? 'ending' : undefined
    }

    // モデルに追加
    this.appState.model.nodes[nodeId] = newNode

    // 開始ノードが未設定の場合は設定
    if (!this.appState.model.startNode) {
      this.appState.model.startNode = nodeId
    }

    // GUIエディタを更新
    this._syncWithGuiEditor()

    // グラフを再描画
    this.render()

    if (typeof window.setStatus === 'function') {
      window.setStatus(`✅ ノード「${nodeId}」を追加しました`, 'success')
    }
  }

  /**
   * ノードIDを生成
   * @returns {string} 新しいノードID
   */
  _generateNodeId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `${NODE_ID_PREFIX}${timestamp}_${random}`
  }

  /**
   * ノードを削除
   * @param {string} nodeId - 削除するノードID
   */
  _deleteNode(nodeId) {
    if (!this.appState.model || !this.appState.model.nodes[nodeId]) {
      return
    }

    // 最後のノードは削除できない
    if (Object.keys(this.appState.model.nodes).length <= 1) {
      if (typeof window.setStatus === 'function') {
        window.setStatus('少なくとも1つのノードが必要です', 'warn')
      }
      return
    }

    // 開始ノードの場合は別のノードを開始ノードに設定
    if (this.appState.model.startNode === nodeId) {
      const otherNodeId = Object.keys(this.appState.model.nodes).find(id => id !== nodeId)
      if (otherNodeId) {
        this.appState.model.startNode = otherNodeId
      }
    }

    // ノードを削除
    delete this.appState.model.nodes[nodeId]

    // 他のノードからこのノードへの参照を削除
    Object.values(this.appState.model.nodes).forEach(node => {
      if (node.choices) {
        node.choices = node.choices.filter(choice => choice.target !== nodeId)
      }
    })

    // 選択状態をクリア
    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null
    }

    // GUIエディタを更新
    this._syncWithGuiEditor()

    // グラフを再描画
    this.render()

    if (typeof window.setStatus === 'function') {
      window.setStatus(`✅ ノード「${nodeId}」を削除しました`, 'success')
    }
  }

  /**
   * エッジ（選択肢）を作成
   * @param {string} fromNodeId - 元ノードID
   * @param {string} toNodeId - 先ノードID
   */
  _createEdge(fromNodeId, toNodeId) {
    if (!this.appState.model || !this.appState.model.nodes[fromNodeId] || !this.appState.model.nodes[toNodeId]) {
      if (typeof window.setStatus === 'function') {
        window.setStatus('ノードが見つかりません', 'error')
      }
      return
    }

    const fromNode = this.appState.model.nodes[fromNodeId]
    if (!fromNode.choices) {
      fromNode.choices = []
    }

    // 新しい選択肢を作成
    const choiceId = `c${fromNode.choices.length + 1}`
    const newChoice = {
      id: choiceId,
      text: '新しい選択肢',
      target: toNodeId
    }

    fromNode.choices.push(newChoice)

    // GUIエディタを更新
    this._syncWithGuiEditor()

    // グラフを再描画
    this.render()

    if (typeof window.setStatus === 'function') {
      window.setStatus(`✅ 接続を作成しました`, 'success')
    }
  }

  /**
   * エッジ（選択肢）を削除
   * @param {Object} edge - エッジ情報 { from: string, to: string, choiceId: string }
   */
  _deleteEdge(edge) {
    if (!this.appState.model || !this.appState.model.nodes[edge.from]) {
      return
    }

    const fromNode = this.appState.model.nodes[edge.from]
    if (fromNode.choices) {
      const index = fromNode.choices.findIndex(c => c.id === edge.choiceId)
      if (index !== -1) {
        fromNode.choices.splice(index, 1)
      }
    }

    // 選択状態をクリア
    if (this.selectedEdge && this.selectedEdge.choiceId === edge.choiceId) {
      this.selectedEdge = null
    }

    // GUIエディタを更新
    this._syncWithGuiEditor()

    // グラフを再描画
    this.render()

    if (typeof window.setStatus === 'function') {
      window.setStatus(`✅ 接続を削除しました`, 'success')
    }
  }

  /**
   * エッジ（選択肢）を編集
   * @param {Object} edge - エッジ情報
   */
  _editEdge(edge) {
    if (!this.appState.model || !this.appState.model.nodes[edge.from]) {
      return
    }

    const fromNode = this.appState.model.nodes[edge.from]
    const choice = fromNode.choices?.find(c => c.id === edge.choiceId)
    if (!choice) {
      return
    }

    // インライン編集モーダルを表示（簡易実装）
    const newText = prompt('選択肢テキストを編集:', choice.text || '')
    if (newText !== null) {
      choice.text = newText
      this._syncWithGuiEditor()
      this.render()
      if (typeof window.setStatus === 'function') {
        window.setStatus('選択肢を更新しました', 'success')
      }
    }
  }

  /**
   * インライン編集を開始
   * @param {string} nodeId - 編集するノードID
   */
  _startInlineEdit(nodeId) {
    if (!this.appState.model || !this.appState.model.nodes[nodeId]) {
      return
    }

    this.editingNodeId = nodeId
    const node = this.appState.model.nodes[nodeId]

    // 既存の編集UIを削除
    this.g.selectAll('.inline-edit').remove()

    // ノード要素を取得
    const nodeElement = this.g.select(`g.node[data-node-id="${nodeId}"]`)
    if (nodeElement.empty()) {
      // ノードが見つからない場合は再描画してから再試行
      setTimeout(() => this._startInlineEdit(nodeId), 100)
      return
    }

    // ノードの現在の位置を取得（transformから）
    const transform = nodeElement.attr('transform')
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
    if (!match) return

    const nodeX = parseFloat(match[1])
    const nodeY = parseFloat(match[2])

    // 編集UIを作成
    const editGroup = this.g.append('g').attr('class', 'inline-edit')
    const editRect = editGroup.append('rect')
      .attr('x', nodeX - 150)
      .attr('y', nodeY - 100)
      .attr('width', 300)
      .attr('height', 200)
      .attr('rx', 8)
      .attr('fill', 'white')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#nodeShadow)')

    // テキスト入力
    const textInput = editGroup.append('foreignObject')
      .attr('x', nodeX - 140)
      .attr('y', nodeY - 90)
      .attr('width', 280)
      .attr('height', 60)

    const textDiv = document.createElement('div')
    textDiv.innerHTML = `
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">テキスト:</label>
      <textarea id="edit-node-text" style="width: 100%; height: 50px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">${(node.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
    `
    textInput.node().appendChild(textDiv)

    // 選択肢編集
    const choicesInput = editGroup.append('foreignObject')
      .attr('x', nodeX - 140)
      .attr('y', nodeY - 20)
      .attr('width', 280)
      .attr('height', 80)

    const choicesDiv = document.createElement('div')
    choicesDiv.innerHTML = `
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">選択肢:</label>
      <div id="edit-choices-list" style="max-height: 60px; overflow-y: auto;">
        ${(node.choices || []).map((choice, idx) => `
          <div style="margin-bottom: 4px;">
            <input type="text" data-choice-index="${idx}" value="${(choice.text || '').replace(/"/g, '&quot;')}" 
                   style="width: calc(100% - 60px); padding: 2px; border: 1px solid #ccc; border-radius: 2px; font-size: 11px;">
            <button class="delete-choice-btn" data-choice-index="${idx}" style="width: 50px; padding: 2px; font-size: 11px;">削除</button>
          </div>
        `).join('')}
        <button id="add-choice-btn" style="width: 100%; padding: 4px; margin-top: 4px; font-size: 11px;">選択肢を追加</button>
      </div>
    `
    choicesInput.node().appendChild(choicesDiv)

    // ボタン
    const buttonsInput = editGroup.append('foreignObject')
      .attr('x', nodeX - 140)
      .attr('y', nodeY + 70)
      .attr('width', 280)
      .attr('height', 30)

    const buttonsDiv = document.createElement('div')
    buttonsDiv.style.cssText = 'display: flex; gap: 8px;'
    buttonsDiv.innerHTML = `
      <button id="save-edit-btn" style="flex: 1; padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">保存</button>
      <button id="cancel-edit-btn" style="flex: 1; padding: 6px; background: #ccc; color: black; border: none; border-radius: 4px; cursor: pointer;">キャンセル</button>
    `
    buttonsInput.node().appendChild(buttonsDiv)

    // イベントハンドラー
    document.getElementById('save-edit-btn').addEventListener('click', () => {
      this._saveInlineEdit(nodeId)
    })
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
      this._cancelInlineEdit()
    })
    document.getElementById('add-choice-btn').addEventListener('click', () => {
      this._addChoiceInEdit(nodeId)
    })
    choicesDiv.querySelectorAll('.delete-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.choiceIndex)
        this._deleteChoiceInEdit(nodeId, idx)
      })
    })
  }

  /**
   * インライン編集を保存
   * @param {string} nodeId - ノードID
   */
  _saveInlineEdit(nodeId) {
    if (!this.appState.model || !this.appState.model.nodes[nodeId]) {
      return
    }

    const node = this.appState.model.nodes[nodeId]
    const textArea = document.getElementById('edit-node-text')
    if (textArea) {
      node.text = textArea.value
    }

    // 選択肢を更新
    const choicesList = document.getElementById('edit-choices-list')
    if (choicesList) {
      const choiceInputs = choicesList.querySelectorAll('input[data-choice-index]')
      if (!node.choices) {
        node.choices = []
      }
      choiceInputs.forEach(input => {
        const idx = parseInt(input.dataset.choiceIndex)
        if (node.choices[idx]) {
          node.choices[idx].text = input.value
        }
      })
    }

    this._cancelInlineEdit()
    this._syncWithGuiEditor()
    this.render()
    if (typeof window.setStatus === 'function') {
      window.setStatus('ノードを更新しました', 'success')
    }
  }

  /**
   * インライン編集をキャンセル
   */
  _cancelInlineEdit() {
    this.editingNodeId = null
    this.g.selectAll('.inline-edit').remove()
  }

  /**
   * 編集中に選択肢を追加
   * @param {string} nodeId - ノードID
   */
  _addChoiceInEdit(nodeId) {
    if (!this.appState.model || !this.appState.model.nodes[nodeId]) {
      return
    }

    const node = this.appState.model.nodes[nodeId]
    if (!node.choices) {
      node.choices = []
    }

    const choiceId = `c${node.choices.length + 1}`
    node.choices.push({
      id: choiceId,
      text: '新しい選択肢',
      target: nodeId
    })

    // 編集UIを再描画
    this._startInlineEdit(nodeId)
  }

  /**
   * 編集中に選択肢を削除
   * @param {string} nodeId - ノードID
   * @param {number} choiceIndex - 選択肢インデックス
   */
  _deleteChoiceInEdit(nodeId, choiceIndex) {
    if (!this.appState.model || !this.appState.model.nodes[nodeId]) {
      return
    }

    const node = this.appState.model.nodes[nodeId]
    if (node.choices && node.choices[choiceIndex]) {
      node.choices.splice(choiceIndex, 1)
    }

    // 編集UIを再描画
    this._startInlineEdit(nodeId)
  }


  /**
   * GUIエディタと状態を同期
   */
  _syncWithGuiEditor() {
    if (window.guiEditorManager) {
      // ノードリストを再描画
      if (window.guiEditorManager.nodeRenderer && typeof window.guiEditorManager.nodeRenderer.renderNodeList === 'function') {
        window.guiEditorManager.nodeRenderer.renderNodeList()
      }
      
      // ドラフトを保存
      if (window.guiEditorManager.modelUpdater && typeof window.guiEditorManager.modelUpdater.saveDraftModel === 'function') {
        window.guiEditorManager.modelUpdater.saveDraftModel()
      }
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

  /**
   * リソースをクリーンアップ
   */
  dispose() {
    this._cleanupResizeObserver()
    
    // コンテキストメニューを削除
    if (this.contextMenu) {
      this.contextMenu.remove()
      this.contextMenu = null
    }

    // SVGをクリア
    if (this.svg) {
      d3.select(this.container).selectAll('*').remove()
      this.svg = null
    }

    // 状態をリセット
    this.container = null
    this.g = null
    this.zoom = null
    this.selectedNodeId = null
    this.selectedEdge = null
    this.dragSourceNodeId = null
    this.editingNodeId = null
  }
}
