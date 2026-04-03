/**
 * ZWP Formatter
 * Exports the model to WritingPage (.zwp.json) format for long-form text editing.
 * Each node becomes a chapter/page in WritingPage. Round-trip metadata is preserved
 * in page.metadata.narrativegen for re-import.
 */
import { getGroupDepth } from '../../../../utils/hierarchy-utils.js'

export class ZwpFormatter {
    constructor() {
        this.name = 'WritingPage (.zwp.json)'
        this.extension = 'zwp.json'
        this.mimeType = 'application/json'
    }

    format(model) {
        if (!model || !model.nodes) {
            throw new Error('Invalid model: missing nodes')
        }

        const orderedIds = this._bfsOrder(model)
        const pages = []
        let order = 0
        let currentGroup = null

        for (const nodeId of orderedIds) {
            const node = model.nodes[nodeId]
            if (!node) continue

            const group = this._extractGroup(nodeId)

            // Insert group heading when group changes
            if (group && group !== currentGroup) {
                pages.push({
                    title: group,
                    content: '',
                    order: order++,
                    level: getGroupDepth(group) + 1,
                    visibility: 'visible',
                    metadata: {
                        narrativegen: {
                            type: 'group-heading',
                            group: group
                        }
                    }
                })
                currentGroup = group
            }

            // Build node page
            const localId = this._extractLocalId(nodeId)
            const title = node.speaker
                ? `${node.speaker}: ${localId}`
                : localId

            pages.push({
                title: title,
                content: node.text || '',
                order: order++,
                level: group ? getGroupDepth(group) + 2 : 2,
                visibility: 'visible',
                metadata: {
                    narrativegen: {
                        nodeId: nodeId,
                        speaker: node.speaker || null,
                        group: group || null,
                        type: 'node',
                        choiceCount: (node.choices || []).length,
                        hasConditions: this._hasConditions(node),
                        presentation: node.presentation || null
                    }
                }
            })
        }

        const modelName = (model.metadata && model.metadata.title)
            || 'NarrativeGen Export'

        const document = {
            format: 'zenwriter-v1',
            version: '0.3.32',
            document: {
                name: modelName,
                chapterMode: true
            },
            pages: pages,
            exportedAt: new Date().toISOString()
        }

        return JSON.stringify(document, null, 2)
    }

    /**
     * BFS order from startNode, then append unreachable nodes alphabetically.
     */
    _bfsOrder(model) {
        const ordered = []
        const visited = new Set()
        const queue = []

        if (model.startNode && model.nodes[model.startNode]) {
            queue.push(model.startNode)
        }

        while (queue.length > 0) {
            const nodeId = queue.shift()
            if (visited.has(nodeId)) continue
            visited.add(nodeId)
            ordered.push(nodeId)

            const node = model.nodes[nodeId]
            if (node && node.choices) {
                for (const choice of node.choices) {
                    if (choice.target && !visited.has(choice.target) && model.nodes[choice.target]) {
                        queue.push(choice.target)
                    }
                }
            }
        }

        // Append unreachable nodes
        const allIds = Object.keys(model.nodes).sort()
        for (const nodeId of allIds) {
            if (!visited.has(nodeId)) {
                ordered.push(nodeId)
            }
        }

        return ordered
    }

    /**
     * Extract group from node ID path.
     * "chapter1/intro/start" -> "chapter1/intro"
     * "start" -> null
     */
    _extractGroup(nodeId) {
        const lastSlash = nodeId.lastIndexOf('/')
        if (lastSlash === -1) return null
        return nodeId.substring(0, lastSlash)
    }

    /**
     * Extract local ID (last segment) from node ID.
     * "chapter1/intro/start" -> "start"
     * "start" -> "start"
     */
    _extractLocalId(nodeId) {
        const lastSlash = nodeId.lastIndexOf('/')
        if (lastSlash === -1) return nodeId
        return nodeId.substring(lastSlash + 1)
    }

    /**
     * Check if any choice in the node has conditions.
     */
    _hasConditions(node) {
        if (!node.choices) return false
        return node.choices.some(c => c.conditions && c.conditions.length > 0)
    }
}
