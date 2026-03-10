# 開発プラン

**作成日**: 2026-03-07
**作成方法**: 実コード探索 + 対話的構築

---

## 現在の実装済み機能 (コードソースから確認)

### エンジン層 (Packages/engine-ts)

| 機能 | 説明 | ファイル |
|------|------|---------|
| モデル読込・AJV検証 | JSON Schemaによる構造検証 + 重複IDチェック | index.ts |
| セッション管理 | start/applyChoice/serialize/deserialize | session-ops.ts |
| 条件システム | flag/resource/variable/timeWindow + AND/OR/NOT複合条件 | session-ops.ts, types.ts |
| 効果システム | setFlag/addResource/setVariable/goto | session-ops.ts, types.ts |
| GameSession | 高レベルAPI (outcome/inventory統合) | game-session.ts |
| インベントリ | add/remove/has/list | inventory.ts |
| エンティティ | CSV読込・パース | entities.ts |
| 言い換え(非AI) | 同義語置換・文体変換・決定的バリアント生成 | paraphrase.ts |
| AIプロバイダー | Mock + OpenAI (generateNextNode/paraphrase) | ai-provider.ts |

### Web Tester (apps/web-tester)

| 機能 | 説明 | ファイル |
|------|------|---------|
| GUIエディタ | ノード編集・追加/削除/コピー/スニペット/テンプレート/DnD | gui-editor.js |
| グラフエディタ | SVGビジュアル/ドラッグ/ズーム/ミニマップ/グリッド/インライン編集/Undo-Redo/コンテキストメニュー/複数選択/エッジ操作/ノード並替 | graph-editor/GraphEditorManager.js |
| バッチエディタ | 検索置換・正規表現/フィルタ/diff表示/元戻/Undo-Redo | batch-editor.js |
| Mermaidプレビュー | フローチャート表示/リアルタイム更新/特殊文字エスケープ | mermaid-preview.js |
| エンディング解析 | 全パス抽出/複雑度/条件カバレッジ/到達可能性 | ending-analyzer.js |
| 統計パネル | 分岐統計・ノードタイプ分布・到達率 | stats-panel.js |
| 検証パネル | 到達不能/自己参照/デッドエンド/未定義フラグ検出 | validation-panel.js |
| パストラッカー | 経路ハイライト/アニメーション | path-tracker.js |
| 検索 | ノードID/テキスト検索 | SearchManager.js |
| テーマ | 6パレット切替 | theme.js |
| キーバインド | 管理 + カスタマイズUI | keybinding-manager.js, key-binding-ui-manager.js |
| レキシコンUI | 編集・表示/モデル埋め込み対応 | lexicon-ui-manager.js, lexicon.js |
| AI管理 | Mock/OpenAI切替/生成/言い換え | ai.js |
| 条件/効果エディタ | 構造化された条件・効果設定UI | condition-effect-editor.js |
| エクスポート | CSV + Ink + Twine + JSON + Yarn Spinner (5形式) | ExportManager.js, formatters/ |
| モデル検証 | CLI + UI双方 | model-validator.js |
| 保存/読込 | SaveManager/自動保存 | save-manager.js |
| デバッグパネル | 開発時情報表示 | debug.js |
| Toast通知 | フィードバック表示 | toast.js |

### バックエンド (Packages/backend)

| 機能 | 説明 | ファイル |
|------|------|---------|
| Express API | providers/generate/paraphrase エンドポイント | index.ts |

### Unity SDK (Packages/sdk-unity)

| 機能 | 説明 |
|------|------|
| MinimalNarrativeController | JSON TextAsset読込によるランタイム |

### テスト

| 種類 | 件数 |
|------|------|
| ユニットテスト (Vitest) | 15テスト |
| E2Eテスト (Playwright) | 2ファイル (theme-toggle, undo-redo) |
| モデル検証 (CLI) | 6モデル |

---

## 開発タスク

### 優先順位1: 変数/条件システム拡張 [完了]

**完了日**: 2026-03-09

**実装内容**:
- 数値変数サポート (`VariableState = Record<string, string | number>`)
- 数値比較条件演算子追加 (`>=`, `<=`, `>`, `<`)
- 四則演算効果 (`modifyVariable: { op: '+' | '-' | '*' | '/', value: number }`)
- UI対応 (condition-effect-editor.js: 数値自動判定、演算子ドロップダウン)
- エクスポート対応 (YarnFormatter.js: modifyVariable → `<<set>>`)
- 仕様ドキュメント作成 (docs/specs/variable-system.md, SP-VAR-001)

**テキスト変数展開**: 既に実装済み (story.js: `{variable_name}` → 値置換)

**テスト**: tsc + vitest 15件 + verify-export-formatters + vite build全通過

---

### 優先順位2: main.js リファクタリング [完了]

**完了日**: 2026-03-08

**結果**:
- main.js: 2365行→469行 (薄いエントリポイント。マネージャー生成 + initializeApp()呼び出し)
- app-controller.js: ~1630行 (イベント処理、ヘルパー関数、マネージャー初期化)
- app-editor-events.js: ~430行 (スニペット/テンプレート/バッチ/検索/ドラフト管理)
- ui-bindings.js: ~100 DOM要素の一括管理
- デッドコード除去: batchEditManager(未定義_model)、openBatchChoiceModal(同)、未使用変数/import
- 旧ブランチ(feature/main-js-split-phase2)は使用せず、mainから漸進的に再分割

---

### 優先順位3: Yarn Spinner エクスポート [完了]

**完了日**: 2026-03-09

**実装内容**:
- YarnFormatter.js作成 (Yarn Spinner 2.x形式: title/tags/---/===構造)
- 条件/効果のマッピング (flag/resource/variable→Yarn命令: setFlag/addResource/setVariable/modifyVariable/goto→`<<set>>`/`<<jump>>`)
- Start node特殊処理 (model.startNodeへの自動ジャンプ)
- ID sanitization (ピリオド→アンダースコア)
- 変数宣言生成 (`<<declare>>`)
- main.jsへの登録 (5形式目のエクスポーター)
- verify-export-formatters.mjsでのテスト追加
- 仕様ドキュメント作成 (docs/specs/yarn-spinner-export.md, SP-EXP-YARN-001)

**非対応機能**: ParaphraseLexicon/ParaphraseStyle/ChoiceOutcome/timeWindow/contains演算子 (Yarn Spinnerに該当実装なし)

---

### 優先順位3.5: コード品質改善 (リファクタリング) [完了]

**完了日**: 2026-03-09

**タスク**: evalCondition/applyEffect重複解消

**実装内容**:
- `condition-effect-ops.ts` 共通モジュール作成 (cmp/evalCondition/applyEffect)
- session-ops.ts: 共通モジュールからインポート、キャッシュラッパー維持
- index.ts: ローカル重複定義削除 (~90行削減)
- browser.ts: ローカル重複定義削除 (~100行削減)
- 仕様ドキュメント作成 (docs/specs/code-refactoring-condition-effect.md, SP-REFACTOR-001)

**効果**: 保守性向上、コード削減計~90行、判定一貫性向上

---

### 優先順位4: レスポンシブデザイン + アクセシビリティ

**現状**: デスクトップ向けのみ。モバイル非対応。アクセシビリティ未対応。

**タスク内容**:
- レスポンシブ: メディアクエリ/レイアウト調整
- アクセシビリティ: ARIA属性/キーボードナビゲーション/コントラスト確保

---

### 優先順位5: チャンクサイズ最適化

**現状**: Viteビルドで「Some chunks are larger than 500 kB」警告。主にMermaid関連。

**タスク内容**:
- manualChunks設定の最適化
- 動的importの活用
- main.jsリファクタリング完了後に実施が効果的

---

## 保留事項

以下は将来的に検討するが、現プランのスコープ外。

| 事項 | 理由 |
|------|------|
| AI生成改善 | 現状のAI機能で十分 |
| プロンプトテンプレート | 同上 |
| 生成難易度調整/比較 | 同上 |
| Unity NUnit テスト | Web Tester優先 |
| Unity Editor拡張 | 同上 |

## 削除事項

以下は不要と判断し、プランから除外。

| 事項 | 理由 |
|------|------|
| AIバッチ校閲 (全ノード一括AI言い換え) | コスト対効果疑問 |
| バージョン管理統合 | スコープ過大 |
| マルチユーザー編集 | スコープ過大 |
| 共有リンク | スコープ過大 |
| 大規模モデル対応 | 現時点で不要 |
| ツールチップヘルプ | 不要 |
| 詳細ログ拡張 | core/logger.jsで十分 |
| XLSX/PDFエクスポート | 5形式で十分 |

---

*このプランは実コードのシンボル探索結果に基づき作成。ドキュメント間の参照ではなく、コードをSource of Truthとしている。*

---

## Encoding Safety Workflow (2026-03-10)

- Run `npm run check:safety:changed` during iteration when touching docs, config, or build scripts.
- Run `npm run check:safety` before merge when `docs/`, `scripts/`, `package.json`, `.gitattributes`, or Vite config changed.
- Keep text files in UTF-8 and avoid ad-hoc PowerShell replacement that can leave literal backtick escapes in JSON or YAML.
- Treat `docs/spec-index.json` as a paired update with spec docs. Validate it in the same change when spec files move or status changes.
- If `encoding-safety` reports warnings, clear them before commit instead of carrying them forward as known noise.
- See `docs/governance/encoding-safety-incident-2026-03-10.md` for the incident record and recovery rules.
