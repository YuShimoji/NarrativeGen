# NarrativeGen

[![CI](https://github.com/YuShimoji/NarrativeGen/actions/workflows/ci.yml/badge.svg)](https://github.com/YuShimoji/NarrativeGen/actions/workflows/ci.yml)

**「ライターが直感的に複数の表現・物語の無数の展開をスプレッドシートに書けて、それが直接ゲーム上（エンジン上）で機能する」** ナラティブエンジン

## 特徴

- 📊 **スプレッドシート駆動**: Excel/Google Sheets で CSV/TSV を編集し、即座にゲームへ反映
- 🎮 **条件分岐・リソース管理**: フラグ、リソース、時間ゲート等をCSV列で直接記述
- 🔧 **プログラミング不要**: ライター・デザイナーが直接ストーリーを構築
- 🚀 **マルチプラットフォーム**: Unity SDK + Web Tester + TypeScript エンジン
- ⚡ **高性能**: 大規模モデルの仮想化・メモ化・遅延読み込み対応
- 🛡️ **堅牢**: 構造化ログ・エラーバウンダリ・包括的検証
- 🎨 **モダンUI**: ガラスモーフィズム・レスポンシブデザイン・インタラクティブアニメーション

## プロジェクト構成

- `models/` — JSON schema とサンプルモデル
- `models/spreadsheets/` — CSV/TSV サンプル（拡張フォーマット対応）
- `packages/engine-ts/` — TypeScript コアエンジン
- `packages/sdk-unity/` — Unity SDK（C# ランタイム）
- `apps/web-tester/` — Web ベースのテストツール（CSV インポート/エクスポート対応）
- `docs/` — 仕様ドキュメント

## Purpose (Rebuild from scratch)

- Break away from the existing project's technical debt and design flaws
- Build a minimal, correct, and maintainable core
- Follow SoC/SOLID principles (Model / Session / Engine)
- Integrate with Unity using a UPM package (`com.NarrativeGen`)

## クイックスタート: スプレッドシートで物語を作る

### 1. サンプルCSVを開く

`models/spreadsheets/shop-quest.csv` を Excel または Google Sheets で開きます。

### 2. 列の説明

| 列名 | 説明 |
|------|------|
| `node_id` | シーンの識別子（例: `start`, `shop`, `dungeon`） |
| `node_text` | シーンで表示されるテキスト |
| `choice_id` | 選択肢の識別子 |
| `choice_text` | 選択肢のテキスト |
| `choice_target` | 選択後の遷移先ノードID |
| `choice_conditions` | 選択肢の表示条件（例: `flag:has_key=true;resource:gold>=50`） |
| `choice_effects` | 選択時の効果（例: `setFlag:visited=true;addResource:gold=-30`） |
| `initial_flags` | 初期フラグ（最初の行のみ） |
| `initial_resources` | 初期リソース（最初の行のみ） |

### 3. Web Tester で動作確認

```bash
cd apps/web-tester
npm install
npm run dev
```

ブラウザで開き、「CSVインポート」ボタンから作成したCSVを読み込みます。

### 4. 詳細仕様

詳しくは [`docs/spreadsheet-format.md`](docs/spreadsheet-format.md) を参照してください。

## Setup

### Requirements

- Node.js 20+ (for TypeScript engine & Web Tester)
- .NET SDK 8+ (for Unity SDK)
- Unity 2021.3+ (for UPM integration)

### Build (C# runtime)

```powershell
dotnet build .\packages\sdk-unity -c Release
```

### Run sample (CLI)

```powershell
dotnet run --project .\packages\samples\PlaythroughCli
```

## Key State (C#)

`NarrativeGen.Engine` is used to load models, start sessions, get available choices, and apply choices.

- Sample model: `models/examples/linear.json`
- API: `LoadModel(json)`, `StartSession(model)`, `GetAvailableChoices(session, model)`, `ApplyChoice(session, model, choiceId)`

## Test Procedure

1. Verify JSON schema integrity

```powershell
Get-Content .\models\schema\playthrough.schema.json | ConvertFrom-Json | Out-Null
Get-Content .\models\examples\linear.json | ConvertFrom-Json | Out-Null
```

1. Build the runtime

```powershell
dotnet build .\packages\sdk-unity -c Release
```

1. Run the sample

```powershell
dotnet run --project .\packages\samples\PlaythroughCli
```

Expected result:

- The console will display the starting node's text and choices, and then terminate after selecting `c1` or `c2` and reaching the ending node.

## Validate models (Node/Ajv)

Requirements:

- Node.js 18+

```powershell
cd .\packages\engine-ts
cmd /c npm install
cmd /c npm run build
cmd /c npm run validate:models
```

`packages/engine-ts/src/index.ts` の `loadModel()` は JSON Schema による構造検証に加え、`startNode` の存在・ノードID整合・選択肢ターゲット整合などを確認します。エラーは CLI 出力に集約されます。

## Web Tester

### Recommended Workflow (From Project Root)

**First-time setup**:
```powershell
npm install
npm run build:all
```

**Development** (recommended for active development):
```powershell
# Terminal 1: Watch and rebuild engine on changes
npm run dev:engine

# Terminal 2: Run web tester dev server
npm run dev:tester
```

**Production build**:
```powershell
npm run build:all
```

### Alternative: Manual Commands

**Option 1: Development Server**

```powershell
# Build engine first
cd .\packages\engine-ts
npm run build

# Then start web tester
cd ..\..\apps\web-tester
npm install
npm run dev
```

Then open **http://localhost:5173** (or the port shown in terminal) in your browser.

**Option 2: Static Build & Serve**

```powershell
# Build both packages
cd .\packages\engine-ts
npm run build

cd ..\..\apps\web-tester
npm install
npm run build
# Now serve the dist/ directory with any static server
```

**Important**:
- Always build `engine-ts` before `web-tester`
- When using Live Server, open the `dist/` directory to avoid module resolution errors
- See `docs/troubleshooting.md` for common issues and solutions

### Features

- Load sample models from dropdown or upload custom JSON files via button/drag & drop
- Start sessions and play through choices interactively
- View current state (nodeId, flags, resources, time) in real-time
- GUI editor ("モデルを編集" button) for visual node/choice editing
  - Add/delete nodes and choices
  - Preview story flow (連続ノードを小説風に表示)
  - Download edited JSON
  - AI suggestion for choice text (Phase 1: mock implementation)
- **Performance Optimizations**:
  - Graph virtualization for large models (>100 nodes) with smart node selection
  - Virtual scrolling for long story logs with lazy loading
  - Chunked CSV import with progress indicators for large files
  - Memoized condition evaluation and choice availability checking
- **Error Handling & Logging**:
  - Structured logging system with sessionStorage persistence for debugging
  - Error boundary wrappers for critical operations with user-friendly messages
  - Comprehensive input validation with detailed error contexts
  - Model validation with specific error location reporting
- **Modern UI/UX**:
  - Glassmorphism design with backdrop blur effects
  - Responsive layout (desktop/tablet/mobile)
  - Smooth animations and transitions
  - Inline story preview modal (replacing popup alerts)
  - Enhanced tab navigation with visual feedback

### AI Features (支援機能)

**重要**: AI機能は物語作成の**支援ツール**であり、本来の機能ではありません。本プロジェクトのコアは**スプレッドシート駆動の手動物語作成**です。

AIは以下の場面で支援します:
- 執筆中の表現の改善案提示
- 選択肢テキストの言い換え支援
- 創造的ブロック時のアイデア出し

See `docs/ai-features.md` for detailed design and `test-ai-features.md` for testing procedures. Current status:

- ✅ **Phase 1**: Mock AI suggestion (random samples)
- ✅ **Phase 2**: Next story generation & paraphrase via OpenAI API
- ⏳ **Phase 3**: Local LLM integration (Ollama, llama.cpp)
- ⏳ **Phase 4**: Batch processing & history management

#### Using AI Features (任意利用)

1. **Open AI Tab**: Click the "AI" tab in Web Tester
2. **Select Provider**:
   - **mock**: Random sample text (no API key required, instant)
   - **openai**: OpenAI GPT models (API key required, see [OpenAI Platform](https://platform.openai.com/api-keys))
3. **Configure Settings**:
   - Enter API key for OpenAI
   - Select model (default: gpt-3.5-turbo)
   - Click "設定を保存" to save
4. **Generate Content**:
   - Load a model first
   - Click "次のノードを生成" to generate next story node
   - Click "現在のテキストを言い換え" to paraphrase current text
5. **Review Output**: Generated text appears in the AI output area

**Note**: API keys are stored in browser localStorage and never sent to our servers. They connect directly to the LLM API.

## Unity SDK

Install as a UPM package:

1. Open Unity Package Manager (Window > Package Manager)
2. Click "+" > "Add package from git URL"
3. Enter: `https://github.com/YuShimoji/NarrativeGen.git?path=packages/sdk-unity`

See `packages/sdk-unity/README.md` for API usage and examples.

### Dependencies

- Unity 2021.3+
- `com.unity.nuget.newtonsoft-json` (auto-installed)

Run Prettier and ESLint for the TypeScript engine:

```powershell
cd .\packages\engine-ts
cmd /c npm install
cmd /c npm run format
cmd /c npm run lint -- --max-warnings=0
cmd /c npm run lint:fix
```

CI (`.github/workflows/ci.yml`) では `npm run lint -- --max-warnings=0` / `npm run build` / `npm run validate:models` を自動実行し、リポジトリの整合性を常時チェックします。

## Directory Structure

- `models/schema/playthrough.schema.json` — canonical schema
- `models/examples/linear.json` — minimal sample model
- `packages/sdk-unity/Runtime/*.cs` — engine code (Model/Session/Engine/Converters)
- `packages/sdk-unity/package.json` — UPM metadata
- `packages/sdk-unity/Runtime/NarrativeGen.asmdef` — assembly definition
- `packages/samples/PlaythroughCli` — CLI sample project for verification
- `packages/engine-ts/` — TypeScript engine and tools (Ajv validation)

## Run tests (C#)

```powershell
dotnet test .\packages\tests\NarrativeGen.Tests -c Release
```

The NUnit smoke test `EngineSmokeTests` loads `models/examples/linear.json`, plays through `start -> scene1 -> end`, and asserts that the engine returns expected nodes and zero choices at the end.

## Current Status (2025-01-26)

### ✅ **Fully Functional Components**

- **TypeScript Engine**: Complete with browser/browser.js exports
- **Web Tester**: Modern UI with all features working
- **Build System**: All packages build successfully
- **Development Server**: Vite dev server runs without errors
- **Model Loading**: Sample models load correctly
- **CSV Import/Export**: Full spreadsheet integration
- **AI Features**: Mock and OpenAI integration working
- **Graph Visualization**: D3.js rendering with virtualization
- **Error Handling**: Comprehensive error boundaries and logging

### 🔧 **Recent Improvements**

- **UI/UX Overhaul**: Glassmorphism design, responsive layout, smooth animations
- **Import Path Fixes**: Corrected browser.js import paths for Vite compatibility
- **Code Quality**: Removed duplicate functions, fixed variable scope issues
- **Performance**: Optimized graph rendering and CSV processing
- **Documentation**: Updated README with current features
- **Configuration**: Added .env, config.json, and comprehensive package.json scripts
- **Testing**: Created detailed test procedures and expected results

### 🚀 **Ready for Use**

The Web Tester is now fully operational with:
- Modern, responsive interface
- **GUI editor**: Visual node/choice editing with preview functionality
- **CSV import/export**: Full spreadsheet integration for story authoring
- **Graph visualization**: Interactive node relationship display
- **Error handling**: Comprehensive validation and user feedback

**Start developing narratives immediately at `http://localhost:5173`!** 🎉

## Testing

See [`TEST_PROCEDURES.md`](TEST_PROCEDURES.md) for comprehensive testing procedures and expected results.

### Quick Test
```bash
# Install dependencies
npm install

# Build all packages
npm run build:all

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Quality Assurance
```bash
# Run all quality checks
npm run check

# This includes:
# - Linting (ESLint)
# - Type checking (TypeScript)
# - Testing (Vitest)
# - Model validation (JSON Schema)
# - Building
```

## API Specification

NarrativeGen provides a comprehensive REST API for backend integration. See the complete OpenAPI 3.0 specification:

### API Documentation
- **Interactive API Docs**: `http://localhost:5173/api-docs.html` (when dev server is running)
- **Static API Docs**: [`docs/api/index.html`](docs/api/index.html) (generated)
- **OpenAPI Specification**: [`openapi-spec.json`](openapi-spec.json)

### API Testing
- **Postman Collection**: [`narrativegen-api.postman_collection.json`](narrativegen-api.postman_collection.json)
- **Development Workflow**: [`API_DEVELOPMENT_WORKFLOW.md`](API_DEVELOPMENT_WORKFLOW.md)

### Generate API Documentation
```bash
# Validate OpenAPI specification
npm run validate:spec

# Generate static API documentation
npm run docs:api

# Serve interactive documentation
npm run docs:api:serve
```

## Development Workflow

## Configuration

### Environment Variables (.env)
```bash
# Copy .env to .env.local for local overrides
VITE_DEV_PORT=5173
VITE_DEV_HOST=0.0.0.0
VITE_API_BASE_URL=http://localhost:3001
VITE_OPENAI_API_KEY=
VITE_ENABLE_AI_FEATURES=true
```

### Project Configuration (config.json)
Project-wide settings including feature flags, performance settings, and AI configurations.

## Development Workflow

### Recommended Setup
```bash
# Terminal 1: Watch engine changes
npm run dev:engine

# Terminal 2: Run web tester
npm run dev:tester

# Terminal 3: Run tests (optional)
npm run test:watch
```

### Code Quality
```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Troubleshooting

### Common Issues

#### Import Errors
```bash
# Rebuild engine
npm run build:engine

# Restart dev server
npm run dev:tester
```

#### Model Loading Issues
- Verify model JSON syntax
- Check `models/examples/` directory exists
- Ensure model follows schema in `models/schema/`

#### AI Feature Issues
- Check internet connection
- Verify OpenAI API key in settings
- Ensure correct provider selection

See [`docs/troubleshooting.md`](docs/troubleshooting.md) for detailed solutions.
