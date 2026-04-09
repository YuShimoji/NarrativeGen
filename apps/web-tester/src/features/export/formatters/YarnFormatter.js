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
            parts.push(this._formatNode(nodeId, node, model))
        }

        return parts.join('\n')
    }

    _formatNode(nodeId, node, model) {
        const bodyLines = []

        // Node text (split multi-line)
        const text = this._normalizeDynamicText(node.text || '', model)
        for (const line of text.split('\n')) {
            if (line.trim()) {
                bodyLines.push(line)
            }
        }

        // Choices
        if (node.choices && node.choices.length > 0) {
            for (const choice of node.choices) {
                this._formatChoice(choice, bodyLines, model)
            }
        }

        const body = bodyLines.join('\n')
        return this._buildNodeBlock(this._sanitizeId(nodeId), body)
    }

    _formatChoice(choice, lines, model) {
        const text = this._normalizeDynamicText(choice.text || 'Continue', model)
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
                return `(${(c.conditions || []).map(sub => this._conditionToExpr(sub)).join(' and ')})`
            case 'or':
                return `(${(c.conditions || []).map(sub => this._conditionToExpr(sub)).join(' or ')})`
            case 'not':
                return c.condition ? `!(${this._conditionToExpr(c.condition)})` : 'true'
            case 'hasItem':
                return c.value ? `$inventory_${c.key}` : `$inventory_${c.key} == false`
            case 'hasEvent':
                return c.value ? `$event_${c.key}` : `$event_${c.key} == false`
            case 'property':
                // Property conditions mapped to $entity_key variables (segments aligned with _varSegment)
                return `$${this._varSegment(c.entity)}_${this._varSegment(c.key)} ${c.op} ${typeof c.value === 'string' ? `"${c.value}"` : c.value}`
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
            case 'addItem':
                return `<<set $inventory_${effect.key} to true>>`
            case 'removeItem':
                return `<<set $inventory_${effect.key} to false>>`
            case 'createEvent':
                // Events are runtime-only; emit flag marker + comment
                return `<<set $event_${this._varSegment(effect.id)} to true>> // createEvent: ${effect.name || effect.id}`
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
        if (model.variables) {
            for (const [key, value] of Object.entries(model.variables)) {
                if (typeof value === 'number') {
                    lines.push(`<<declare $${key} = ${value}>>`)
                } else {
                    lines.push(`<<declare $${key} = "${value}">>`)
                }
            }
        }
        // Declare event flags (collected from createEvent effects)
        const eventIds = this._collectEventIds(model)
        for (const eventId of eventIds) {
            lines.push(`<<declare $event_${this._varSegment(eventId)} = false>>`)
        }
        // Entity display names and property defaults (SP-DTYARN-001: [entity] / [entity.prop])
        for (const line of this._buildEntityDeclarations(model)) {
            lines.push(line)
        }
        return lines.length > 0 ? lines.join('\n') : ''
    }

    /**
     * Yarn variable name segment (entity id, property key, event id, etc.)
     */
    _varSegment(part) {
        return String(part).replace(/[^a-zA-Z0-9_]/g, '_')
    }

    _yarnStringLiteral(value) {
        const s = String(value)
        return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    }

    /**
     * <<declare>> lines for model.entities so [id] / [id.prop] can map to {$id_name}, {$id_prop}.
     */
    _buildEntityDeclarations(model) {
        const lines = []
        if (!model || !model.entities) return lines
        for (const [entityId, ent] of Object.entries(model.entities)) {
            const prefix = this._varSegment(entityId)
            const nameLit = this._yarnStringLiteral(ent.name ?? entityId)
            lines.push(`<<declare $${prefix}_name = "${nameLit}">>`)
            const props = ent.properties || {}
            for (const [propKey, propDef] of Object.entries(props)) {
                if (propDef == null || propDef.defaultValue === undefined) continue
                const pk = this._varSegment(propKey)
                const v = propDef.defaultValue
                const varName = `${prefix}_${pk}`
                if (typeof v === 'number' && Number.isFinite(v)) {
                    lines.push(`<<declare $${varName} = ${v}>>`)
                } else if (typeof v === 'boolean') {
                    lines.push(`<<declare $${varName} = ${v}>>`)
                } else {
                    lines.push(`<<declare $${varName} = "${this._yarnStringLiteral(v)}">>`)
                }
            }
        }
        return lines
    }

    /**
     * Convert a subset of Dynamic Text syntax into Yarn-friendly form.
     * SP-DTYARN-001:
     * - {variable}           -> {$variable}
     * - {?flag:text}        -> <<if $flag>>text<<endif>>
     * - {?!flag:text}       -> <<if $flag == false>>text<<endif>>
     * - {?key op val:text}  -> <<if $key op val>>text<<endif>> (resource/variable 数値比較、単一行 body 想定)
     * - {?!key op val:text} -> <<if !($key op val)>>text<<endif>>
     * - [entity.property]   -> {$entity_property}（model.entities の declare と整合）
     * - [entity]            -> {$entity_name}
     * Non-target syntaxes are left as-is for backward compatibility.
     */
    _normalizeDynamicText(text, model) {
        if (!text) return ''

        // Comparison conditionals (before simple flag patterns).
        const cmpOps = '(>=|<=|>|<|==|!=)'
        let out = text.replace(
            new RegExp(`\\{\\?\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*${cmpOps}\\s*(\\S+?)\\s*:(.*?)\\}`, 'gs'),
            (_m, key, op, rawVal, body) => {
                const rhs = /^-?\d+(\.\d+)?$/.test(String(rawVal).trim())
                    ? String(rawVal).trim()
                    : `"${this._yarnStringLiteral(String(rawVal).replace(/^"|"$/g, ''))}"`
                return `<<if $${key} ${op} ${rhs}>>${body}<<endif>>`
            }
        )
        out = out.replace(
            new RegExp(`\\{\\?!\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*${cmpOps}\\s*(\\S+?)\\s*:(.*?)\\}`, 'gs'),
            (_m, key, op, rawVal, body) => {
                const rhs = /^-?\d+(\.\d+)?$/.test(String(rawVal).trim())
                    ? String(rawVal).trim()
                    : `"${this._yarnStringLiteral(String(rawVal).replace(/^"|"$/g, ''))}"`
                return `<<if !($${key} ${op} ${rhs})>>${body}<<endif>>`
            }
        )

        // Simple flag conditionals.
        out = out.replace(/\{\?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:(.*?)\}/g, (_m, flag, body) => {
            return `<<if $${flag}>>${body}<<endif>>`
        })
        out = out.replace(/\{\?!\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:(.*?)\}/g, (_m, flag, body) => {
            return `<<if $${flag} == false>>${body}<<endif>>`
        })

        // [entity] / [entity.propKey]（propKey は先頭の . 以降すべて。model.entities があるときのみ変換）
        if (model && model.entities) {
            out = out.replace(/\[([^\]]+)\]/g, (_m, ref) => {
                const dot = ref.indexOf('.')
                if (dot === -1) {
                    return `{${'$' + this._varSegment(ref) + '_name'}}`
                }
                const entId = ref.slice(0, dot)
                const propKey = ref.slice(dot + 1)
                if (!propKey) return _m
                const vn = `${this._varSegment(entId)}_${this._varSegment(propKey)}`
                return `{${'$' + vn}}`
            })
        }

        // Plain variable placeholders (after conditionals so we do not break generated <<if>>).
        out = out.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_m, key) => `{$${key}}`)
        return out
    }

    _collectEventIds(model) {
        const ids = new Set()
        for (const node of Object.values(model.nodes || {})) {
            for (const choice of node.choices || []) {
                for (const effect of choice.effects || []) {
                    if (effect.type === 'createEvent' && effect.id) {
                        ids.add(effect.id)
                    }
                }
            }
        }
        return [...ids]
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
