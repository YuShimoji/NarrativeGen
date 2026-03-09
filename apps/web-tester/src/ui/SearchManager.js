/**
 * Search Manager Module
 * Handles search functionality for the GUI Editor
 */

export class SearchManager {
    constructor() {
        this.searchInput = null
        this.searchContainer = null
    }

    /**
     * Initialize the Search Manager
     */
    initialize() {
        // Find the existing search input in the DOM
        // Based on index.html: .search-box input
        this.searchContainer = document.querySelector('.search-box')
        if (this.searchContainer) {
            this.searchInput = this.searchContainer.querySelector('input')
        }

        if (!this.searchInput) {
            console.warn('[SearchManager] Search input not found')
        }
    }

    /**
     * Focus the search input
     * @returns {boolean} True if focused successfully
     */
    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus()
            // Select all text if there is any
            this.searchInput.select()
            return true
        }
        return false
    }

    /**
     * Check if search input is currently focused
     * @returns {boolean}
     */
    isSearchFocused() {
        return document.activeElement === this.searchInput
    }
}
