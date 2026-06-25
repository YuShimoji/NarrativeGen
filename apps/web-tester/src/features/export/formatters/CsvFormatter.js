/**
 * CSV Formatter
 * Exports the model to CSV format
 */
import { formatCsvModel } from '../../../utils/model-csv-export.js'

export class CsvFormatter {
    constructor() {
        this.name = 'CSV'
        this.extension = 'csv'
        this.mimeType = 'text/csv;charset=utf-8'
    }

    format(model) {
        return formatCsvModel(model)
    }
}
