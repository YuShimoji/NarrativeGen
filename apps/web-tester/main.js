// Bootstrap environment immediately on load
import { initializeEnvironment } from './src/bootstrap.js'
initializeEnvironment()

// Manager classes
import { AppState } from './src/core/state.js'
import { ThemeManager } from './src/ui/theme.js'
import { DOMManager } from './src/ui/dom.js'
import { EventManager } from './src/ui/events.js'
import { StoryManager } from './src/ui/story.js'
import { GraphEditorManager } from './src/ui/graph-editor/GraphEditorManager.js'
import { DebugManager } from './src/ui/debug.js'
import { GuiEditorManager } from './src/ui/gui-editor.js'
import { ReferenceManager } from './src/ui/reference.js'
import { CsvManager } from './src/ui/csv.js'
import { AiManager } from './src/ui/ai.js'
import { LexiconManager } from './src/ui/lexicon.js'
import { SearchManager } from './src/ui/SearchManager.js'
import { MermaidPreviewManager } from './src/ui/mermaid-preview.js'
import { KeyBindingManager } from './src/ui/keybinding-manager.js'
import { SaveManager } from './src/features/save-manager.js'
import { ValidationPanel } from './src/ui/validation-panel.js'
import { LexiconUIManager } from './src/ui/lexicon-ui-manager.js'
import { KeyBindingUIManager } from './src/ui/key-binding-ui-manager.js'
import { ExportManager } from './src/features/export/ExportManager.js'
import { TwineFormatter } from './src/features/export/formatters/TwineFormatter.js'
import { InkFormatter } from './src/features/export/formatters/InkFormatter.js'
import { CsvFormatter } from './src/features/export/formatters/CsvFormatter.js'

// App controller
import { initializeApp } from './src/app-controller.js'

// ============================================================================
// Application Setup
// ============================================================================

// Create core state
const appState = new AppState()

// Create export infrastructure
const keyBindingManager = new KeyBindingManager()
const exportManager = new ExportManager()
exportManager.registerFormatter('twine', new TwineFormatter())
exportManager.registerFormatter('ink', new InkFormatter())
exportManager.registerFormatter('csv', new CsvFormatter())

// Create all manager instances
const managers = {
  dom: new DOMManager(),
  eventManager: new EventManager(),
  storyManager: new StoryManager(appState),
  graphManager: new GraphEditorManager(appState),
  debugManager: new DebugManager(appState),
  guiEditorManager: new GuiEditorManager(appState),
  referenceManager: new ReferenceManager(),
  csvManager: new CsvManager(appState),
  aiManager: new AiManager(appState),
  lexiconManager: new LexiconManager(),
  searchManager: new SearchManager(),
  themeManager: new ThemeManager(),
  validationPanel: new ValidationPanel(appState),
  lexiconUIManager: new LexiconUIManager(),
  keyBindingUIManager: new KeyBindingUIManager(),
  mermaidPreviewManager: new MermaidPreviewManager(),
  saveManager: new SaveManager(),
}

// Initialize application (event wiring, UI setup, DevTools)
initializeApp({ appState, managers, keyBindingManager, exportManager })
