/**
 * Export Manager
 * Handles registration of export formats and execution of exports
 */
import { downloadFile } from '../../utils/file-utils.js'

export class ExportManager {
    constructor() {
        this.formatters = new Map()
    }

    /**
     * Register a new export formatter
     * @param {string} id - Unique identifier for the format (e.g., 'twine', 'ink')
     * @param {Object} formatter - Formatter instance with export(model) method
     */
    registerFormatter(id, formatter) {
        if (this.formatters.has(id)) {
            console.warn(`Export format '${id}' is already registered. Overwriting.`)
        }
        this.formatters.set(id, formatter)
    }

    /**
     * Get list of registered formats
     * @returns {Array<{id: string, name: string, extension: string}>}
     */
    getAvailableFormats() {
        const formats = []
        for (const [id, formatter] of this.formatters.entries()) {
            formats.push({
                id,
                name: formatter.name || id,
                extension: formatter.extension || 'txt'
            })
        }
        return formats
    }

    /**
     * Execute export for a specific format
     * @param {string} formatId - ID of the format to export
     * @param {Object} model - The narrative model to export
     * @param {string} [filename] - Optional filename (without extension)
     * @returns {Promise<boolean>} - Success status
     */
    async export(formatId, model, filename = 'story') {
        const formatter = this.formatters.get(formatId)
        if (!formatter) {
            throw new Error(`Unknown export format: ${formatId}`)
        }

        try {
            const content = formatter.format(model)
            const extension = formatter.extension || 'txt'
            const mimeType = formatter.mimeType || 'text/plain'
            const fullFilename = `${filename}.${extension}`

            downloadFile(content, fullFilename, mimeType)
            return true
        } catch (error) {
            console.error(`Export failed for format ${formatId}:`, error)
            throw error
        }
    }
}
