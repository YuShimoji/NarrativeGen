/**
 * Lexicon Manager Module
 * Handles designer lexicon management for text paraphrasing
 */

export class LexiconManager {
  constructor() {
    this.lexicon = {}
    this.lexiconKey = 'designerParaphraseLexicon'
  }

  // Initialize the lexicon manager
  initialize() {
    this.loadFromStorage()
  }

  // Get the current lexicon
  getLexicon() {
    return { ...this.lexicon }
  }

  // Set/replace the lexicon
  setLexicon(newLexicon, options = {}) {
    if (!this.validateLexicon(newLexicon)) {
      throw new Error('無効な辞書形式です')
    }

    if (options.merge) {
      this.lexicon = this.mergeLexicons(this.lexicon, newLexicon)
    } else {
      this.lexicon = { ...newLexicon }
    }

    this.saveToStorage()
    return this.lexicon
  }

  // Validate lexicon structure
  validateLexicon(lexicon) {
    if (!lexicon || typeof lexicon !== 'object' || Array.isArray(lexicon)) {
      return false
    }

    // Check if all values are arrays of strings
    for (const [key, value] of Object.entries(lexicon)) {
      if (!Array.isArray(value)) {
        return false
      }
      if (!value.every(item => typeof item === 'string')) {
        return false
      }
    }

    return true
  }

  // Merge two lexicons
  mergeLexicons(baseLexicon, newLexicon) {
    const merged = { ...baseLexicon }

    for (const [key, variants] of Object.entries(newLexicon)) {
      if (merged[key]) {
        // Combine and deduplicate
        const combined = [...merged[key], ...variants]
        merged[key] = [...new Set(combined)]
      } else {
        merged[key] = [...variants]
      }
    }

    return merged
  }

  // Save lexicon to localStorage
  saveToStorage() {
    try {
      localStorage.setItem(this.lexiconKey, JSON.stringify(this.lexicon))
    } catch (error) {
      console.error('Failed to save lexicon to storage:', error)
      throw new Error('辞書の保存に失敗しました')
    }
  }

  // Load lexicon from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.lexiconKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (this.validateLexicon(parsed)) {
          this.lexicon = parsed
        } else {
          console.warn('Invalid lexicon data in storage, using empty lexicon')
          this.lexicon = {}
        }
      }
    } catch (error) {
      console.warn('Failed to load lexicon from storage:', error)
      this.lexicon = {}
    }
  }

  // Generate paraphrases for a given text
  paraphrase(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return []
    }

    const variantCount = options.variantCount || 3
    const variants = []

    // Try exact match first
    if (this.lexicon[text] && this.lexicon[text].length > 0) {
      const availableVariants = this.lexicon[text]
      // Return up to variantCount variants
      for (let i = 0; i < Math.min(variantCount, availableVariants.length); i++) {
        variants.push(availableVariants[i])
      }
      return variants
    }

    // Try partial matches (simple word-based matching)
    const words = text.split(/\s+/)
    if (words.length > 1) {
      for (const word of words) {
        if (this.lexicon[word] && this.lexicon[word].length > 0) {
          const wordVariants = this.lexicon[word]
          for (const variant of wordVariants) {
            if (variants.length >= variantCount) break
            // Replace the word in the original text
            const newVariant = text.replace(new RegExp(`\\b${word}\\b`, 'g'), variant)
            if (newVariant !== text && !variants.includes(newVariant)) {
              variants.push(newVariant)
            }
          }
          if (variants.length >= variantCount) break
        }
      }
    }

    // If we still don't have enough variants, generate simple variations
    if (variants.length < variantCount) {
      variants.push(...this.generateSimpleVariants(text, variantCount - variants.length))
    }

    return variants.slice(0, variantCount)
  }

  // Generate simple variants when no lexicon matches exist
  generateSimpleVariants(text, count) {
    const variants = []
    const variations = [
      (t) => `${t}。`,
      (t) => `${t}！`,
      (t) => `「${t}」`,
      (t) => `（${t}）`,
      (t) => `${t}です。`,
      (t) => `${t}ですね。`,
      (t) => `${t}と思います。`
    ]

    for (let i = 0; i < Math.min(count, variations.length); i++) {
      const variant = variations[i](text)
      if (!variants.includes(variant)) {
        variants.push(variant)
      }
    }

    return variants
  }

  // Add a new entry to the lexicon
  addEntry(original, variants) {
    if (!original || typeof original !== 'string') {
      throw new Error('原文は文字列である必要があります')
    }

    if (!Array.isArray(variants)) {
      throw new Error('バリアントは配列である必要があります')
    }

    if (!variants.every(v => typeof v === 'string')) {
      throw new Error('すべてのバリアントは文字列である必要があります')
    }

    if (!this.lexicon[original]) {
      this.lexicon[original] = []
    }

    // Add new variants, avoiding duplicates
    const existingVariants = new Set(this.lexicon[original])
    variants.forEach(variant => {
      if (!existingVariants.has(variant)) {
        this.lexicon[original].push(variant)
        existingVariants.add(variant)
      }
    })

    this.saveToStorage()
  }

  // Remove an entry from the lexicon
  removeEntry(original) {
    if (this.lexicon[original]) {
      delete this.lexicon[original]
      this.saveToStorage()
      return true
    }
    return false
  }

  // Get statistics about the lexicon
  getStats() {
    const entries = Object.keys(this.lexicon)
    const totalVariants = entries.reduce((sum, key) => sum + this.lexicon[key].length, 0)

    return {
      totalEntries: entries.length,
      totalVariants: totalVariants,
      averageVariantsPerEntry: entries.length > 0 ? (totalVariants / entries.length).toFixed(2) : 0
    }
  }

  // Export lexicon as JSON string
  exportAsJson() {
    return JSON.stringify(this.lexicon, null, 2)
  }

  // Import lexicon from JSON string
  importFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      if (this.validateLexicon(parsed)) {
        this.lexicon = parsed
        this.saveToStorage()
        return true
      } else {
        throw new Error('無効なJSON形式です')
      }
    } catch (error) {
      throw new Error(`JSONの解析に失敗しました: ${error.message}`)
    }
  }

  // Clear all entries
  clear() {
    this.lexicon = {}
    this.saveToStorage()
  }

  // Check if lexicon has any entries
  isEmpty() {
    return Object.keys(this.lexicon).length === 0
  }

  // Search for entries containing a query
  search(query, limit = 10) {
    if (!query || typeof query !== 'string') {
      return []
    }

    const lowerQuery = query.toLowerCase()
    const results = []

    for (const [original, variants] of Object.entries(this.lexicon)) {
      if (original.toLowerCase().includes(lowerQuery) ||
          variants.some(v => v.toLowerCase().includes(lowerQuery))) {
        results.push({
          original,
          variants: [...variants],
          matchType: original.toLowerCase().includes(lowerQuery) ? 'original' : 'variant'
        })

        if (results.length >= limit) break
      }
    }

    return results
  }
}
