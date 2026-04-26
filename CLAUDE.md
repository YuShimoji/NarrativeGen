# NarrativeGen

インタラクティブ物語エンジン。TypeScript コアエンジン + Express API + Web Tester + Unity C# SDK のモノレポ構成。

## Key Paths

- Engine (TS): `packages/engine-ts/` (src/, test/, dist/)
- Backend (Express): `packages/backend/` (src/index.ts)
- Web Tester: `apps/web-tester/` (main.js, src/, handlers/, utils/)
- Unity SDK (C#): `packages/sdk-unity/` (Runtime/, Editor/)
- C# Tests: `packages/tests/`
- Model Schema: `models/schema/playthrough.schema.json`
- Example Models: `models/examples/`
- Specs: `docs/specs/`, `docs/spec-index.json`
- Dev Plan: `docs/plans/DEVELOPMENT_PLAN.md`
- Scripts: `scripts/`

## Rules

- Respond in Japanese
- No emoji
- Keep responses concise
- `docs/archive/` は廃止（過去文書は Git 履歴）。`docs/reports/` と `docs/inbox/` は現構成に存在しない

## IDEA POOL

バックログ・アイデアのたたき台は [`docs/USER_REQUEST_LEDGER.md`](docs/USER_REQUEST_LEDGER.md)。長期の決定の**全件**は [`docs/governance/decision-log.md`](docs/governance/decision-log.md)。通常再開時の入口は [`HANDOVER.md`](HANDOVER.md)。

## Commands

- Test (engine): `npm run test:engine`
- Test (all): `npm run test`
- Build (engine): `npm run build:engine`
- Build (all): `npm run build:all`
- Dev server: `npm run dev` (Vite, web-tester)
- Validate models: `npm run validate`
- Encoding safety: `npm run check:safety`
- Doctor: `npm run doctor`

## Spec View

仕様ドキュメントの一覧・ステータス・実装率をブラウザで確認できる。

- データ: `docs/spec-index.json` (Source of Truth)
- 閲覧: `docs/spec-viewer.html` (`npx serve docs` → `http://localhost:3000/spec-viewer.html`)
- 仕様を追加・更新したら spec-index.json も併せて更新すること

## Architecture

### engine-ts

- `index.ts`: Node.js エントリ (fs使用, Ajv schema validation)
- `browser.ts`: ブラウザエントリ (fs不使用, インライン条件評価)
- `session-ops.ts`: メモ化キャッシュ付きセッション操作
- `condition-effect-ops.ts`: 条件評価・エフェクト適用の共通モジュール
- `inference/`: 前方連鎖・後方連鎖推論、条件/エフェクトレジストリ
- `resolver.ts`: ノードIDリゾルバ (グループスコープ対応)
- `ai-provider.ts`: AI テキスト生成 (Mock + OpenAI stub)
- `inventory.ts` / `entities.ts` / `game-session.ts`

### web-tester (apps/web-tester)

- `main.js`: 薄いエントリポイント (~469行)
- `src/app-controller.js`: イベント処理・マネージャー初期化 (~1630行)
- `handlers/`: DI パターンによるUI論理分離 (10モジュール)
- `src/ui/graph-editor/`: SVGビジュアルエディタ (Dagre, minimap)
- `src/features/inference/`: 推論UI (bridge + panel)
- `src/features/export/`: 5形式エクスポート (CSV/Ink/Twine/JSON/Yarn)

### backend

- Express REST API (port 3001), インメモリストレージ

### sdk-unity

- UPM パッケージ形式
- InferenceRegistry: 条件9種 / エフェクト8種 (hasEvent / createEvent 含む、TS パリティ)
- Session: Flags, Resources, Variables, Inventory, Time

## Decision Log

**全件**は [`docs/governance/decision-log.md`](docs/governance/decision-log.md)。ここには直近のみ抜粋。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-27 | SP-PIPE-001 方向性確定: 1人運用/WritingPage次スライス/JSON主軸/AI支援スコープ外/AUTHORING_GUIDE拡張 | 各項目に複数択 | Pipeline仕様の5件HUMAN_AUTHORITY全件レビュー完了。次スライスはWritingPage連携 |
| 2026-03-18 | UI設計はマウス操作主体 (NarrativeGenにも適用) | マウス主体 / キーボード主体 | WritingPageでの決定をNarrativeGenにも適用 |
| 2026-03-18 | SP-PLAY-001: Phase 1はテキスト演出のみ | テキストのみ / 画像含む / 画像+BGM | スコープを絞りプレイ基盤を先に確立。画像/BGMはPhase 2 |

## Project Context

最新の状態・CI・次の作業は **[HANDOVER.md](HANDOVER.md)**。
