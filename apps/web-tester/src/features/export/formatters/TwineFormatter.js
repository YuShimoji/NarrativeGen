/**
 * Twine (Twee) Formatter
 * Exports the model to Twee format compatible with Twine 2 (Harlowe/SugarCube)
 */
export class TwineFormatter {
    constructor() {
        this.name = 'Twine (Twee)'
        this.extension = 'twee'
        this.mimeType = 'text/plain'
    }

    format(model) {
        if (!model || !model.nodes) {
            throw new Error('Invalid model: missing nodes')
        }

        let output = ''

        // Add StoryTitle and StoryData special passages
        const title = model.metadata?.title || 'Narrative Gen Story'
        output += `:: StoryTitle\n${title}\n\n`

        output += `:: StoryData\n`
        output += `{\n`
        output += `  "ifid": "${this._generateUUID()}",\n`
        output += `  "format": "Harlowe",\n`
        output += `  "format-version": "3.3.3",\n` // Defaulting to Harlowe 3
        output += `  "start": "${model.startNode || Object.keys(model.nodes)[0]}"\n`
        output += `}\n\n`

        // Add all nodes
        for (const [nodeId, node] of Object.entries(model.nodes)) {
            output += `:: ${nodeId}\n`
            // Escape special Twee characters if necessary, though mostly raw text is fine
            output += `${node.text || ''}\n\n`

            if (node.choices && node.choices.length > 0) {
                for (const choice of node.choices) {
                    // Twine link format: [[Link Text->Target]] or [[Target]]
                    const target = choice.target
                    const text = choice.text || target

                    if (target) {
                        output += `[[${text}->${target}]]\n`
                    } else {
                        // Choice without target (dead end or special logic not fully supported)
                        output += `(End: ${text})\n`
                    }
                }
            }
            output += '\n'
        }

        return output
    }

    _generateUUID() {
        // Simple UUID generator for IFID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    }
}
