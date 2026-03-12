# NarrativeGen

インタラクティブ物語エンジン。TypeScript コアエンジン + Express API バックエンド + Unity C# SDK のモノレポ構成。

## PROJECT CONTEXT

プロジェクト名: NarrativeGen
環境: Node.js v22 / TypeScript 5.5 / vitest / Unity 2021.3+
ブランチ戦略: trunk-based (main のみ)
現フェーズ: プロトタイプ (v0.1.0) → エンジン完成フェーズへ移行
方針: 汎用インタラクティブ物語エンジン (100+ノード対応が設計基準)
直近の状態:

  - インフラ復旧完了: git init, workspaces, 依存解決, schema/例モデル, 73テスト全通過
  - 仕様書基盤完了: SP-001〜SP-007 (7仕様) + spec-index.json
  - dead script整理完了: .cjs化, パス修正, stale参照除去
  - web-tester構築完了: apps/web-tester/index.html (スタンドアロンHTML)
  - 次: エンジン機能完成 (modifyVariable inference登録, Inventory/Entity統合, 性能テスト, Schema厳密化)

## DECISION LOG

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-12 | インフラ復旧一括を最優先 | インフラ / 仕様書 / 方針再検討 / dead script整理 | テスト実行不可・git未管理の状態ではあらゆる作業が不安定 |
| 2026-03-12 | NarrativeGen を汎用エンジンとして育てる | 汎用 / UnityChatNovelGame統合 / 新規プロダクト | 特定プロダクトに縛らず、エンジンとしての完成度と再利用性を重視 |
| 2026-03-12 | Phase 1 はエンジン完成を先行 | エンジン先行 / Twineコンバータ / 軽量エディタ / AIオーサリング | 基盤が未完成のままオーサリングツールを作ると手戻りが大きい |
| 2026-03-12 | AI統合は将来フェーズ | 即着手 / 将来 / 対象外 | コアエンジンの安定が先。差別化の核となりうるが基盤完成後に本格化 |
| 2026-03-12 | 100+ノード大規模モデル対応を設計基準 | 小規模 / 中規模 / 大規模 | 汎用エンジンとして実用的な規模感の基準 |

## Key Paths

- Engine (TS): `packages/engine-ts/` (src/, test/, dist/)
- Backend (Express): `packages/backend/` (src/index.ts)
- Unity SDK (C#): `packages/sdk-unity/` (Runtime/, Editor/)
- C# Tests: `packages/tests/`
- C# Sample: `packages/samples/PlaythroughCli/`
- Model Schema: `models/schema/playthrough.schema.json`
- Example Models: `models/examples/`
- Scripts: `scripts/`

## Rules

- Respond in Japanese
- No emoji
- Keep responses concise
- Test: `npx vitest run` (packages/engine-ts/)
- Build: `npm run build:engine` (root)

## Architecture

### engine-ts
- `index.ts`: Node.js エントリ (fs使用, Ajv schema validation)
- `browser.ts`: ブラウザエントリ (fs不使用, インライン条件評価)
- `session-ops.ts`: メモ化キャッシュ付きセッション操作
- `inference/`: 前方連鎖・後方連鎖推論、条件/エフェクトレジストリ
- `ai-provider.ts`: AI テキスト生成 (Mock + OpenAI stub)

### backend
- Express REST API (port 3001)
- エンドポイント: /api/models, /api/sessions, /api/ai
- インメモリストレージ (永続化なし)

### sdk-unity
- UPM パッケージ形式
- Engine.LoadModel / StartSession / GetAvailableChoices / ApplyChoice
