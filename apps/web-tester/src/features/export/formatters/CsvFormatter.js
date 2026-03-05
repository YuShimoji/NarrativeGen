/**
 * CSV Formatter
 * Exports the model to CSV format
 */
export class CsvFormatter {
    constructor() {
        this.name = 'CSV'
        this.extension = 'csv'
        this.mimeType = 'text/csv'
    }

    format(model) {
        if (!model || !model.nodes) {
            return 'id,text,choices\n'
        }

        const headers = ['id', 'text', 'choices']
        let csv = headers.join(',') + '\n'

        // Sort nodes: startNode first
        const sortedNodeIds = Object.keys(model.nodes).sort((a, b) => {
            if (a === model.startNode) return -1
            if (b === model.startNode) return 1
            return a.localeCompare(b)
        })

        sortedNodeIds.forEach(nodeId => {
            const node = model.nodes[nodeId]

            // Escape special chars
            const escapedText = (node.text || '').replace(/"/g, '""').replace(/\n/g, ' ')

            // Choices as JSON string
            const choicesJson = JSON.stringify(node.choices || []).replace(/"/g, '""')

            const row = [
                `"${nodeId}"`,
                `"${escapedText}"`,
                `"${choicesJson}"`
            ]

            csv += row.join(',') + '\n'
        })

        return csv
    }
}
