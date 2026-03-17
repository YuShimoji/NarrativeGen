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
| 推論エンジン | forward/backward chaining、依存グラフ、パス探索(BFS)、拡張可能レジストリ | inference/ (12ファイル) |
| ノードIDリゾルバ | グループスコープID解決、階層ナビゲーション | resolver.ts |
| モデル検証拡張 | ID重複/参照整合性/循環参照検出 | validation.ts |

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
| ハンドラーモジュール | DI パターンによるUI論理分離 (10モジュール) | handlers/ |
| ノード階層UI | ツリービュー/折りたたみ/パンくず/状態永続化 | hierarchy-state.js, utils/hierarchy-utils.js |
| 高度検索 | マルチファクターランキング/グループスコープ/履歴/同義語辞書 | utils/search-utils.js, search-history.js, synonym-dict.js |
| セマンティック検索 | OpenAI Embeddings API/コサイン類似度/ハイブリッド検索 | utils/semantic-search.js, hybrid-search.js, embeddings-cache.js |
| XSS防御 | 集約escapeHtml/安全DOM操作ユーティリティ | src/utils/html-utils.js |
| CSVユーティリティ | 条件/効果付きCSVパース/シリアライズ | utils/csv-parser.js, csv-exporter.js |
| モデルユーティリティ | サンプル/カスタム読込/変数解決 | utils/model-utils.js |

### バックエンド (Packages/backend)

| 機能 | 説明 | ファイル |
|------|------|---------|
| Express API | providers/generate/paraphrase エンドポイント | index.ts |

### Unity SDK (Packages/sdk-unity)

| 機能 | 説明 |
|------|------|
| MinimalNarrativeController | JSON TextAsset読込によるランタイム |
| Inventory | add/remove/has/list/clear/toJSON (engine-tsからの移植) |
| InferenceRegistry | 条件8種 / エフェクト7種 (TS パリティ) |

### テスト

| 種類 | 件数 |
|------|------|
| ユニットテスト (Vitest) | 198テスト (17ファイル) |
| E2Eテスト (Playwright) | 44件 (entity-panel 11 + template-panel 10 含む) |
| モデル検証 (CLI) | 12モデル |

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

**テスト**: tsc + vitest 73件 + verify-export-formatters + vite build全通過

---

### 優先順位2: main.js リファクタリング [完了]

**完了日**: 2026-03-08

**結果**:
- main.js: 2365行→469行 (薄いエントリポイント。マネージャー生成 + initializeApp()呼び出し)
- app-controller.js: ~1630行 (イベント処理、ヘルパー関数、マネージャー初期化)
- app-editor-events.js: ~430行 (スニペット/テンプレート/バッチ/検索/ドラフト管理)
- ui-bindings.js: ~100 DOM要素の一括管理
- デッドコード除去: batchEditManager(未定義_model)、openBatchChoiceModal(同)、未使用変数/import
- feature/main-js-split-phase2ブランチを2026-03-11にmainへ統合完了 (85コミット、ハンドラー10モジュール分離)

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

### 優先順位3.6: 推論UI統合 (Phase 1-3) [完了]

**Phase 1 完了**: 2026-03-11
- Live Preview パネルに推論セクション追加 (UC-1: 到達パス表示)

**Phase 2 完了**: 2026-03-12
- InferenceBridge: findStateKeyUsage/getAllStateKeys 追加
- InferencePanel: 3セクション構成 (UC-3: 影響分析, UC-4: 状態キー使用)
- validate キャッシュ汚染バグ修正 (clearSessionCaches)

**Phase 3 パネル完了**: 2026-03-16
- UC-2: 到達可能ノードパネル
- UC-5: What-if シミュレーション (simulateChoice エラー抑制含む)
- グラフエディタ unsafe render() 全面排除
- minimap ダークテーマ + テキスト overflow clip

**Phase 3 グラフ視覚統合 完了**: 2026-03-17
- T1: GraphEditorManager.applyInferenceHighlight/clearInferenceHighlight API
- T2: パスハイライト (ゴールド #d4a017) + 到達不能ノード半透明化 (opacity 0.4)
- T3: 影響範囲色分け (コーラル #e07050)
- T4: デバッグクエリUI (ノードID入力 + analyze/clear)
- 仕様: SP-INF-UI-001 → done (100%)

---

### 優先順位3.7: Entity/Inventory + C# SDK 統合 [エンジン層+エディタUI完了、定義管理UI進行中]

**エンジン層完了**: 2026-03-13
- hasItem 条件 + addItem/removeItem エフェクト (engine-ts)
- modifyVariable 推論レジストリ登録
- EntityDef 型 + brand→name リネーム
- C# SDK InferenceRegistry (条件 8 種 / エフェクト 7 種)
- 198 テスト全緑維持

**condition-effect-editor UI 完了**: 2026-03-17
- hasItem 条件タイプ + addItem/removeItem エフェクトタイプをドロップダウンに追加
- 構造化オブジェクトのパース/ビルド対応
- playthrough.schema.json にスキーマ追加

**残作業**: Entity 定義管理 UI (モデル内 entities マップの GUI 編集) → SP-ENTITY-001: 95%

---

### 優先順位3.8: ブランチ統合 [完了]

**feature/main-js-split-phase2 → main 統合**: 2026-03-11
- 85 コミット、コンフリクト 8 件解決
- テスト 15 → 73 件

**master → main 方針決定**: 2026-03-16
- ローカルを master → main に切替 (origin/main が正)
- master の Entity/Inventory 変更は cherry-pick 済み
- master の web-tester 構造巻き戻しは不採用

---

### 優先順位3.9: 原初ビジョン統合 [進行中]

**完了日**: 進行中 (2026-03-17)

原初ビジョン (ORIGINAL_DESIGN_PHILOSOPHY.md) の5つの構造的ギャップを段階的に解消する。

**Phase 1 — Entity-Property System [完了]**: SP-PROP-001 done
- PropertyDef 型 + 3層継承チェーン (resolveProperty / getEntityProperties / getInheritanceChain)
- JSON Schema + GUI (parentEntity dropdown, property CRUD)

**Phase 2 — Dynamic Text Engine [完了]**: SP-TEXT-001 done
- `[entity.property]` 参照 + `{variable}` 展開 + `{?condition:text}` 条件セクション

**Phase 3 — Property Anomaly Detection [完了]**: SP-ANOMALY-001 done
- detectAnomaly / detectAllAnomalies + KnowledgeProfile (domain/accuracy/tolerance)

**Phase 4.1 — Paraphrase Property Matching [完了]**: SP-PARA-002 done
- ConditionalVariant + match条件 + UsageHistory + buildParaphraseContext

**Phase 4.2 — Character Knowledge Model [完了]**: SP-KNOW-001 done
- CharacterDef + findKnowledgeProfile + perceiveEntity (anomaly bridge)

**Phase 5.2 — Dynamic Event Entity Generation [完了]**: SP-EVENT-001 done
- createEventEntity / hasEvent / createEventFromAnomaly
- hasEvent 条件 + createEvent エフェクト + 推論レジストリ統合
- テンプレート展開: session.events からの `[event_id.property]` 解決
- Web Tester GUI: condition-effect-editor (hasEvent/createEvent + properties GUI)
- テスト: 18件 (コア + integration + template)

**Phase 5.3 — Dynamic Story Expansion [完了]**: SP-DYNAMIC-001 done
- ConversationTemplate: trigger matching + priority + maxUses
- 3-layer responsibility separation
- Schema + Web Tester integrated (auto-insertion in resolveVariables)
- テスト: 9件

**原初ビジョン コア実装: 全8件完了**

**テスト**: 198件全緑、12モデル検証通過

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
