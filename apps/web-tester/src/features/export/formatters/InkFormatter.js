/**
 * Ink Formatter
 * Exports the model to Ink format (.ink)
 */
export class InkFormatter {
    constructor() {
        this.name = 'Ink'
        this.extension = 'ink'
        this.mimeType = 'text/plain'
    }

    format(model) {
        if (!model || !model.nodes) {
            throw new Error('Invalid model: missing nodes')
        }

        let output = ''
        const startNode = model.startNode || Object.keys(model.nodes)[0]

        // Divert to start node
        output += `-> ${this._sanitizeId(startNode)}\n\n`

        // Add all nodes as knots
        for (const [nodeId, node] of Object.entries(model.nodes)) {
            output += `=== ${this._sanitizeId(nodeId)} ===\n`

            // Multi-line text handling
            const lines = (node.text || '').split('\\n')
            for (const line of lines) {
                output += `${line}\n`
            }

            if (node.choices && node.choices.length > 0) {
                for (const choice of node.choices) {
                    // Ink choice format: * [Choice Text] -> Target
                    if (choice.target) {
                        output += `* [${choice.text || 'Continue'}] -> ${this._sanitizeId(choice.target)}\n`
                    } else {
                        output += `* [${choice.text || 'End'}] -> END\n`
                    }
                }
            } else {
                // No choices usually implies an end
                output += `-> END\n`
            }
            output += '\n'
        }

        return output
    }

    _sanitizeId(id) {
        // Ink identifiers must be alphanumeric or underscore, cannot start with number
        let sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_')
        if (/^[0-9]/.test(sanitized)) {
            sanitized = 'kn_' + sanitized
        }
        return sanitized
    }
}
