/**
 * Yarn Spinner 2.x format exporter (.yarn)
 *
 * Converts NarrativeGen model to Yarn Spinner script.
 * Maps conditions to <<if>> guards and effects to <<set>> commands.
 */
export class YarnFormatter {
    constructor() {
        this.name = 'Yarn Spinner'
        this.extension = 'yarn'
        this.mimeType = 'text/plain'
    }

    format(model) {
        if (!model || !model.nodes) {
            throw new Error('Invalid model: missing nodes')
        }

        const parts = []
        const startNode = model.startNode || Object.keys(model.nodes)[0]

        // Emit variable declarations from model flags/resources
        const declarations = this._buildDeclarations(model)
        if (declarations) {
            parts.push(this._buildNodeBlock('_Declarations', declarations, ['declarations']))
        }

        // Emit Start node that jumps to the actual start
        if (startNode !== 'Start') {
            parts.push(this._buildNodeBlock('Start', `<<jump ${this._sanitizeId(startNode)}>>`, ['auto']))
        }

        for (const [nodeId, node] of Object.entries(model.nodes)) {
            parts.push(this._formatNode(nodeId, node))
        }

        return parts.join('\n')
    }

    _formatNode(nodeId, node) {
        const bodyLines = []

        // Node text (split multi-line)
        const text = node.text || ''
        for (const line of text.split('\n')) {
            if (line.trim()) {
                bodyLines.push(line)
            }
        }

        // Choices
        if (node.choices && node.choices.length > 0) {
            for (const choice of node.choices) {
                this._formatChoice(choice, bodyLines)
            }
        }

        const body = bodyLines.join('\n')
        return this._buildNodeBlock(this._sanitizeId(nodeId), body)
    }

    _formatChoice(choice, lines) {
        const text = choice.text || 'Continue'
        const condition = this._buildCondition(choice.conditions)
        const conditionSuffix = condition ? ` <<if ${condition}>>` : ''

        lines.push(`-> ${text}${conditionSuffix}`)

        // Effects as <<set>> commands inside the choice block
        if (choice.effects && choice.effects.length > 0) {
            for (const effect of choice.effects) {
                const cmd = this._buildEffect(effect)
                if (cmd) {
                    lines.push(`    ${cmd}`)
                }
            }
        }

        // Jump to target
        if (choice.target) {
            lines.push(`    <<jump ${this._sanitizeId(choice.target)}>>`)
        }
    }

    // --- Condition/Effect mapping ---

    _buildCondition(conditions) {
        if (!conditions || conditions.length === 0) return ''
        return conditions.map(c => this._conditionToExpr(c)).join(' and ')
    }

    _conditionToExpr(c) {
        switch (c.type) {
            case 'flag':
                return c.value ? `$${c.key}` : `$${c.key} == false`
            case 'resource':
                return `$${c.key} ${c.op} ${c.value}`
            case 'variable':
                if (typeof c.value === 'number') {
                    return `$${c.key} ${c.op} ${c.value}`
                }
                if (c.op === 'contains' || c.op === '!contains') {
                    return `$${c.key} ${c.op} "${c.value}"` // best-effort
                }
                return `$${c.key} ${c.op} "${c.value}"`
            case 'and':
                return `(${c.conditions.map(sub => this._conditionToExpr(sub)).join(' and ')})`
            case 'or':
                return `(${c.conditions.map(sub => this._conditionToExpr(sub)).join(' or ')})`
            case 'not':
                return `!(${this._conditionToExpr(c.condition)})`
            case 'timeWindow':
                return `$time >= ${c.start} and $time <= ${c.end}`
            default:
                return 'true'
        }
    }

    _buildEffect(effect) {
        switch (effect.type) {
            case 'setFlag':
                return `<<set $${effect.key} to ${effect.value}>>`
            case 'addResource':
                return `<<set $${effect.key} to $${effect.key} + ${effect.delta}>>`
            case 'setVariable':
                return typeof effect.value === 'number'
                    ? `<<set $${effect.key} to ${effect.value}>>`
                    : `<<set $${effect.key} to "${effect.value}">>`
            case 'modifyVariable':
                return `<<set $${effect.key} to $${effect.key} ${effect.op} ${effect.value}>>`
            case 'goto':
                return `<<jump ${this._sanitizeId(effect.target)}>>`
            default:
                return null
        }
    }

    _buildDeclarations(model) {
        const lines = []
        if (model.flags) {
            for (const [key, value] of Object.entries(model.flags)) {
                lines.push(`<<declare $${key} = ${value}>>`)
            }
        }
        if (model.resources) {
            for (const [key, value] of Object.entries(model.resources)) {
                lines.push(`<<declare $${key} = ${typeof value === 'number' ? value : 0}>>`)
            }
        }
        return lines.length > 0 ? lines.join('\n') : ''
    }

    // --- Utilities ---

    _buildNodeBlock(title, body, tags) {
        let header = `title: ${title}\n`
        if (tags && tags.length > 0) {
            header += `tags: ${tags.join(' ')}\n`
        }
        return `${header}---\n${body}\n===\n`
    }

    _sanitizeId(id) {
        // Yarn node titles: no periods allowed; alphanumeric, underscore, hyphen
        let sanitized = id.replace(/[^a-zA-Z0-9_\-]/g, '_')
        if (/^[0-9]/.test(sanitized)) {
            sanitized = 'n_' + sanitized
        }
        return sanitized
    }
}
