/**
 * UI Bindings module - DOM element queries
 * @module ui-bindings
 */

/**
 * Get all UI element references
 * @returns {Object} Object containing all DOM element references
 */
export function getUIElements() {
    return {
        // Main controls
        startBtn: document.getElementById('startBtn'),
        choicesContainer: document.getElementById('choices'),
        stateView: document.getElementById('stateView'),
        statusText: document.getElementById('statusText'),
        modelSelect: document.getElementById('modelSelect'),
        fileInput: document.getElementById('fileInput'),
        uploadBtn: document.getElementById('uploadBtn'),
        dropZone: document.getElementById('dropZone'),
        previewTopBtn: document.getElementById('previewTopBtn'),
        downloadTopBtn: document.getElementById('downloadTopBtn'),
        importCsvBtn: document.getElementById('importCsvBtn'),
        csvFileInput: document.getElementById('csvFileInput'),
        exportCsvBtn: document.getElementById('exportCsvBtn'),
        guiEditMode: document.getElementById('guiEditMode'),
        guiEditBtn: document.getElementById('editBtn'),
        nodeList: document.getElementById('nodeList'),
        addNodeBtn: document.getElementById('addNodeBtn'),
        previewBtn: document.getElementById('previewBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        saveGuiBtn: document.getElementById('saveGuiBtn'),
        cancelGuiBtn: document.getElementById('cancelGuiBtn'),

        // Search and Filter elements
        nodeSearchInput: document.getElementById('nodeSearchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        nodeFilterSelect: document.getElementById('nodeFilterSelect'),
        searchResultCount: document.getElementById('searchResultCount'),
        storyView: document.getElementById('storyView'),
        errorPanel: document.getElementById('errorPanel'),
        errorList: document.getElementById('errorList'),
        csvPreviewModal: document.getElementById('csvPreviewModal'),
        csvFileName: document.getElementById('csvFileName'),
        csvPreviewContent: document.getElementById('csvPreviewContent'),
        confirmImportBtn: document.getElementById('confirmImportBtn'),
        cancelPreviewBtn: document.getElementById('cancelPreviewBtn'),

        // Story preview modal elements
        storyPreviewModal: document.getElementById('storyPreviewModal'),
        storyPreviewContent: document.getElementById('storyPreviewContent'),
        closePreviewBtn: document.getElementById('closePreviewBtn'),
        storyContent: document.getElementById('storyContent'),
        toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),

        // Tab elements
        storyTab: document.getElementById('storyTab'),
        graphTab: document.getElementById('graphTab'),
        debugTab: document.getElementById('debugTab'),
        referenceTab: document.getElementById('referenceTab'),
        storyPanel: document.getElementById('storyPanel'),
        graphPanel: document.getElementById('graphPanel'),
        debugPanel: document.getElementById('debugPanel'),
        referencePanel: document.getElementById('referencePanel'),

        // Graph elements
        graphSvg: document.getElementById('graphSvg'),
        fitGraphBtn: document.getElementById('fitGraphBtn'),
        resetGraphBtn: document.getElementById('resetGraphBtn'),
        showConditions: document.getElementById('showConditions'),
        graphSettingsBtn: document.getElementById('graphSettingsBtn'),
        graphSettings: document.getElementById('graphSettings'),
        nodeShape: document.getElementById('nodeShape'),
        fontSize: document.getElementById('fontSize'),
        saveGraphPreset: document.getElementById('saveGraphPreset'),
        loadGraphPreset: document.getElementById('loadGraphPreset'),

        // Debug elements
        flagsDisplay: document.getElementById('flagsDisplay'),
        resourcesDisplay: document.getElementById('resourcesDisplay'),
        variablesDisplay: document.getElementById('variablesDisplay'),
        editVariablesBtn: document.getElementById('editVariablesBtn'),
        reachableNodes: document.getElementById('reachableNodes'),
        saveLoadSection: document.getElementById('saveLoadSection'),
        saveSlots: document.getElementById('saveSlots'),
        refreshSavesBtn: document.getElementById('refreshSavesBtn'),

        // AI elements
        advancedTab: document.getElementById('advancedTab'),
        advancedPanel: document.getElementById('advancedPanel'),
        enableAdvancedFeatures: document.getElementById('enableAdvancedFeatures'),
        aiProvider: document.getElementById('aiProvider'),
        openaiSettings: document.getElementById('openaiSettings'),
        openaiApiKey: document.getElementById('openaiApiKey'),
        openaiModel: document.getElementById('openaiModel'),
        ollamaSettings: document.getElementById('ollamaSettings'),
        ollamaUrl: document.getElementById('ollamaUrl'),
        ollamaModel: document.getElementById('ollamaModel'),
        saveAiSettings: document.getElementById('saveAiSettings'),
        generateNextNodeBtn: document.getElementById('generateNextNodeBtn'),
        paraphraseCurrentBtn: document.getElementById('paraphraseCurrentBtn'),
        aiOutput: document.getElementById('aiOutput'),

        // Designer lexicon UI elements
        lexiconLoadBtn: document.getElementById('lexiconLoadBtn'),
        lexiconMergeBtn: document.getElementById('lexiconMergeBtn'),
        lexiconReplaceBtn: document.getElementById('lexiconReplaceBtn'),
        lexiconExportBtn: document.getElementById('lexiconExportBtn'),
        lexiconImportBtn: document.getElementById('lexiconImportBtn'),
        lexiconFileInput: document.getElementById('lexiconFileInput'),
        lexiconTextarea: document.getElementById('lexiconTextarea'),

        // Key binding elements
        keyBindingDisplay: document.getElementById('keyBindingDisplay'),
        inventoryKey: document.getElementById('inventoryKey'),
        debugKey: document.getElementById('debugKey'),
        graphKey: document.getElementById('graphKey'),
        storyKey: document.getElementById('storyKey'),
        aiKey: document.getElementById('aiKey'),
        mermaidKey: document.getElementById('mermaidKey'),
        saveKeyBindings: document.getElementById('saveKeyBindings'),
        resetKeyBindings: document.getElementById('resetKeyBindings'),

        // Batch edit elements
        batchEditBtn: document.getElementById('batchEditBtn'),
        batchEditModal: document.getElementById('batchEditModal'),
        searchText: document.getElementById('searchText'),
        replaceText: document.getElementById('replaceText'),
        applyTextReplaceBtn: document.getElementById('applyTextReplaceBtn'),
        choiceSearchText: document.getElementById('choiceSearchText'),
        choiceReplaceText: document.getElementById('choiceReplaceText'),
        applyChoiceReplaceBtn: document.getElementById('applyChoiceReplaceBtn'),
        oldTargetText: document.getElementById('oldTargetText'),
        newTargetText: document.getElementById('newTargetText'),
        applyTargetReplaceBtn: document.getElementById('applyTargetReplaceBtn'),
        closeBatchEditBtn: document.getElementById('closeBatchEditBtn'),

        // Theme button
        themeBtn: document.getElementById('themeBtn'),

        // Quick node elements
        createQuickNodeBtn: document.getElementById('createQuickNodeBtn'),
        cancelQuickNodeBtn: document.getElementById('cancelQuickNodeBtn'),
        quickNodeBtn: document.getElementById('quickNodeBtn'),
        exportBtn: document.getElementById('exportBtn'),
        batchChoiceBtn: document.getElementById('batchChoiceBtn'),

        // Batch choice elements
        batchNodeSelect: document.getElementById('batchNodeSelect'),
        batchCondition: document.getElementById('batchCondition'),
        batchEffect: document.getElementById('batchEffect'),
        batchConditionText: document.getElementById('batchConditionText'),
        batchEffectText: document.getElementById('batchEffectText'),
        cancelBatchChoiceBtn: document.getElementById('cancelBatchChoiceBtn'),
        applyBatchChoiceBtn: document.getElementById('applyBatchChoiceBtn'),

        // Snippet elements
        snippetBtn: document.getElementById('snippetBtn'),
        snippetModal: document.getElementById('snippetModal'),
        snippetNameInput: document.getElementById('snippetNameInput'),
        saveSnippetBtn: document.getElementById('saveSnippetBtn'),
        snippetList: document.getElementById('snippetList'),
        closeSnippetModalBtn: document.getElementById('closeSnippetModalBtn'),

        // Draft restore elements
        cancelDraftRestoreBtn: document.getElementById('cancelDraftRestoreBtn'),
        confirmDraftRestoreBtn: document.getElementById('confirmDraftRestoreBtn'),
        draftRestoreModal: document.getElementById('draftRestoreModal'),

        // Custom template elements
        manageTemplatesBtn: document.getElementById('manageTemplatesBtn'),
        templateModal: document.getElementById('templateModal'),
        customTemplateNameInput: document.getElementById('customTemplateNameInput'),
        saveCustomTemplateBtn: document.getElementById('saveCustomTemplateBtn'),
        customTemplateList: document.getElementById('customTemplateList'),
        closeTemplateModalBtn: document.getElementById('closeTemplateModalBtn'),
        customTemplateGroup: document.getElementById('customTemplateGroup'),

        // Validation elements
        runValidationBtn: document.getElementById('runValidationBtn'),
        validationContainer: document.getElementById('validationContainer'),

        // Modal elements
        paraphraseModal: document.getElementById('paraphraseModal'),
        cancelParaphraseBtn: document.getElementById('cancelParaphraseBtn')
    }
}

/**
 * Get default AI configuration
 * @returns {Object} Default AI config object
 */
export function getDefaultAIConfig() {
    return {
        provider: 'mock',
        openai: {
            apiKey: '',
            model: 'gpt-3.5-turbo'
        },
        ollama: {
            url: 'http://localhost:11434',
            model: 'llama2'
        }
    }
}
