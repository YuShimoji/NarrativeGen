export class ExportModal {
    constructor(exportManager) {
        this.exportManager = exportManager
        this.modal = null
        this.formatSelect = null
        this.filenameInput = null
        this.exportBtn = null
        this.cancelBtn = null
    }

    initialize(modalElement) {
        this.modal = modalElement
        this.formatSelect = this.modal.querySelector('#exportFormatSelect')
        this.filenameInput = this.modal.querySelector('#exportFilenameInput')
        this.exportBtn = this.modal.querySelector('#doExportBtn')
        this.cancelBtn = this.modal.querySelector('#cancelExportBtn')
        this.closeBtn = this.modal.querySelector('.close-modal')

        this._setupEventListeners()
        this._populateFormats()
    }

    _setupEventListeners() {
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this._handleExport())
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hide())
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide())
        }

        // click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide()
            }
        })
    }

    _populateFormats() {
        if (!this.formatSelect) return

        const formats = this.exportManager.getAvailableFormats()
        this.formatSelect.innerHTML = ''

        formats.forEach(format => {
            const option = document.createElement('option')
            option.value = format.id
            option.textContent = `${format.name} (.${format.extension})`
            this.formatSelect.appendChild(option)
        })
    }

    show(defaultFilename = 'story') {
        if (this.filenameInput) {
            this.filenameInput.value = defaultFilename
        }
        this.modal.classList.add('show')
        this.modal.style.display = 'flex'
    }

    hide() {
        this.modal.classList.remove('show')
        this.modal.style.display = 'none'
    }

    async _handleExport() {
        const formatId = this.formatSelect.value
        const filename = this.filenameInput.value.trim() || 'story'

        if (this.onExport) {
            try {
                await this.onExport(formatId, filename)
                this.hide()
                if (window.setStatus) window.setStatus(`エクスポート完了: ${filename}`, 'success')
            } catch (error) {
                console.error(error)
                if (window.setStatus) window.setStatus(`エクスポート失敗: ${error.message}`, 'error')
            }
        }
    }
}
