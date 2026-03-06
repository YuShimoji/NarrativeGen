# 作業申し送り

## 最終更新

- **日時**: 2026-03-06
- **ブランチ**: `feature/main-js-split-phase2`
- **PR**: #80（オープン中）
- **ベースブランチ**: `open-ws/engine-skeleton-2025-09-02`

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルをJSON形式で定義し、TypeScriptエンジンで実行、Web UIでプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル + JSONスキーマ
```

### エンジンの公開API (`@narrativegen/engine-ts`)

| エクスポート | 用途 |
| ----------- | ---- |
| `loadModel(data)` | JSONモデル読み込み+スキーマ/整合性検証 |
| `startSession(model)` | セッション開始 → SessionState |
| `getAvailableChoices(session, model)` | 現在ノードの選択可能な選択肢（条件評価済み） |
| `applyChoice(session, model, choiceId)` | 選択肢適用 → 新SessionState |
| `serialize(session)` / `deserialize(payload)` | セッション永続化 |
| `registry` | 推論レジストリ（カスタム条件/エフェクト登録） |
| `buildDependencyGraph(model)` | 前方連鎖用の依存グラフ構築 |
| `applyChoiceWithForwardChaining(...)` | 選択肢適用+影響分析 |
| `findPathToGoal(model, start, goal)` | 静的パス探索（BFS） |
| `findReachableNodes(model, session)` | 条件評価付き到達可能ノード探索 |
| `getSupportedConditions()` / `getSupportedEffects()` | 登録済み型の列挙 |

### 組み込み条件/エフェクト型

**条件**: `flag`, `resource`, `variable`, `timeWindow`, `and`, `or`, `not`
**エフェクト**: `setFlag`, `addResource`, `setVariable`, `goto`

詳細は `packages/engine-ts/src/inference/README.md` を参照。

## 直近の作業（2026-03-06）

### アーキテクチャリデザイン（3フェーズ完了）

#### Phase 1: 推論レジストリ基盤

- プラグインレジストリパターンで条件評価・エフェクト適用を拡張可能に
- `packages/engine-ts/src/inference/` に registry, conditions, effects を構築

#### Phase 2: グラフエディタ実用化

- `GraphEditorManager.js` からDagreLayoutEngine, ContextMenuManagerを分離
- レイアウト設定改善（nodesep: 80, ranksep: 120, edgesep: 40）

#### Phase 3: 推論機能実装

- 前方連鎖: `buildDependencyGraph`, `applyChoiceWithForwardChaining`
- 後方連鎖: `findPathToGoal`, `findReachableNodes`
- Capability Discovery: `getSupportedConditions`, `getSupportedEffects`

### UI改善

- ミニマップDOM配置バグ修正（SVG内のdiv → graph-container配下に移動）
- カラーパレットを「モダンクラシカル」に変更（落ち着いたトーン）
- E2Eテスト: theme-toggle 11件をskipマーク（UIと未接続のため）

### ドキュメント整理（108件 → 23件アクティブ）

- レガシードキュメント85件を `docs/archive/` 配下に分類移動
- `.shared-workflows` submodule 参照解除（190ファイル）
- `.cursor/` ディレクトリ削除
- 推論システムの仕様書を新規作成 (`inference/README.md`)
- TECHNICAL_DEBT.md, WORKFLOW_STATE_SSOT.md を現状に更新

## 現在の状態

### CI・テスト

- **engine-ts**: 73テスト全合格（10ファイル）
- **web-tester**: Viteビルド成功
- **E2E**: 24 passed, 36 skipped

### 主要モジュール構成

#### packages/engine-ts/src/

| モジュール | 役割 |
| --------- | ---- |
| index.ts | Node.js向けエントリ（fs使用、スキーマ読み込み） |
| browser.ts | ブラウザ向けエントリ（fs不使用） |
| types.ts | Model, SessionState, Condition, Effect 等の型定義 |
| session-ops.ts | startSession, getAvailableChoices, applyChoice |
| resolver.ts | ノードID解決（相対/絶対パス、グループ走査） |
| inference/ | 推論システム（詳細は `inference/README.md`） |

#### apps/web-tester/src/

| モジュール | 役割 |
| --------- | ---- |
| main.js | アプリケーションエントリ（約2200行、分割進行中） |
| core/state.js | グローバルアプリ状態管理 |
| core/session.js | エンジンSessionStateラッパー |
| ui/graph-editor/GraphEditorManager.js | D3.js + Dagre.jsグラフ可視化・編集 |
| ui/graph-editor/layout/DagreLayoutEngine.js | Dagreレイアウト計算 |
| ui/graph-editor/interaction/ContextMenuManager.js | 右クリックメニュー |
| ui/SearchManager.js | キーワード+セマンティック検索 |
| ui/theme.js | パレット選択・テーマ適用 |
| config/palettes.js | カラーパレット定義（モダンクラシカル等） |
| features/export/ | CSV, Ink, Twine エクスポーター |
| features/model-validator.js | モデル検証（重複ID, 参照欠落, 循環検出） |

### アクティブドキュメント一覧（docs/）

| ドキュメント | 内容 |
| ----------- | ---- |
| WORKFLOW_STATE_SSOT.md | ミッション・Done条件・選別規則 |
| TECHNICAL_DEBT.md | 技術的負債と改善タスク |
| architecture.md | システムアーキテクチャ概要 |
| reference.md | エンジン仕様リファレンス（v1.1提案含む） |
| ai-features.md | AI機能仕様（言い換え/生成） |
| hierarchy-api-reference.md | ノード階層APIリファレンス |
| node-hierarchy-design.md | ノード階層設計メモ |
| spreadsheet-format.md | CSV/TSVフォーマット v2.0仕様 |
| OpenSpec.md / OpenSpec-WebTester.md | Web Tester UX仕様 |
| Mermaid_Preview_Spec.md | Mermaidプレビュー仕様 |
| NarrativeGen_Reference_Wiki.md | Web Testerリファレンスwiki |
| GUI_EDITOR_TEST_GUIDE.md | GUIエディタ手動テストガイド |
| QUICK_START_PHASE2.md | Phase2クイックスタート |
| MIGRATION_NOTES.md | Phase 2A-C移行ガイド |
| troubleshooting.md | トラブルシューティング |
| troubleshooting-narrgen-doctor.md | doctorエラー復旧手順 |
| WEB_TESTER_BROWSER_VERIFICATION.md | ブラウザ検証手順 |
| governance/branch-protection.md | ブランチ保護ルール |

### オープンタスク（docs/tasks/）

| タスク | 概要 |
| ------ | ---- |
| TASK_103 | CI Doctor統合 |
| TASK_106 | パフォーマンス最適化（100+ノード対応） |
| TASK_107 | セーブ/ロード機能（localStorage） |
| TASK_108 | バッチAI処理 |

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run build --workspace=packages/engine-ts
npm test --workspace=packages/engine-ts
npm run build --workspace=apps/web-tester
npm run dev --workspace=apps/web-tester
# → http://localhost:5173/
```

## 既知の課題

- main.js が約2200行（分割進行中、機能上は問題なし）
- E2E 36件がskip（theme-toggle 11件はUI未接続、他は優先度判断待ち）
- ビルド時チャンクサイズ警告（641KB + 442KB、機能に影響なし）
- index.htmlにインラインCSS約1600行が残存（外部CSSが優先、機能に影響なし）

---

SSOT: `docs/WORKFLOW_STATE_SSOT.md`
技術的負債: `docs/TECHNICAL_DEBT.md`
推論システム仕様: `packages/engine-ts/src/inference/README.md`
