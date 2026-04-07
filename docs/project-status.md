# NarrativeGen プロジェクト全体ステータス

**調査日**: 2026-04-07（`HANDOVER.md` / spec-index と整合するよう更新）
**ブランチ**: main (trunk-based)
**テスト**: engine-ts Vitest 264 件前後、E2E Playwright（`apps/web-tester/tests/e2e`）、モデル検証 16 通過

---

## 1. 実装済み機能

| # | 機能 | 検証方法 | 検証状態 | 仕様ID | 備考 |
|---|------|---------|---------|--------|------|
| F01 | ストーリーエンジンコア (モデル読込/セッション/条件8種/エフェクト7種) | Unit 250件 | 確認済 | SP-ENGINE-001 | |
| F02 | JSON Schema バリデーション (Ajv, 構造+整合性) | Unit + 16モデル検証 | 確認済 | SP-SCHEMA-001 | |
| F03 | 推論エンジン (前方/後方連鎖, プラグインレジストリ) | Unit | 確認済 | SP-INF-001 | |
| F04 | Entity-Property System (階層/継承/resolveProperty) | Unit 19+1件 | 確認済 | SP-PROP-001 | |
| F05 | Dynamic Text Engine ([entity.property], {variable}, {?条件:text}) | Unit 31件 | 確認済 | SP-TEXT-001 | |
| F06 | Paraphrase System (同義語辞書+AIプロバイダ) | Unit | 確認済 | SP-PARA-001 | |
| F07 | Paraphrase Property Matching (ConditionalVariant, UsageHistory) | Unit 13件 | 確認済 | SP-PARA-002 | |
| F08 | Property Anomaly Detection (偏差スコアリング) | Unit 13件 | 確認済 | SP-ANOMALY-001 | |
| F09 | Character Knowledge Model (perceiveEntity) | Unit 7件 | 確認済 | SP-KNOW-001 | |
| F10 | Description Tracker (markDescribed/isDescribed) | Unit 14件 | 確認済 | SP-DESC-001 | |
| F11 | Dynamic Story Expansion (ConversationTemplate, trigger) | Unit 14件 + E2E 10件 | 確認済 | SP-DYNAMIC-001 | |
| F12 | Event Entity Generation (createEvent/hasEvent) | Unit + E2E | 確認済 | SP-EVENT-001 | |
| F13 | Entity/Inventory System (hasItem/addItem/removeItem) | Unit + E2E 11件 | 確認済 | SP-ENTITY-001 | |
| F14 | Variable System (数値型/四則演算/比較条件) | Unit | 確認済 | SP-VAR-001 | |
| F15 | Web Tester: GUI Editor (ノードCRUD/グラフエディタ/Dagre) | E2E + 手動 | 確認済 | SP-001 | |
| F16 | Web Tester: 推論UI (パス/影響/状態キー/What-if/グラフ視覚連携) | E2E + 手動 | 確認済 | SP-INF-UI-001 | |
| F17 | Web Tester: Entity定義パネル (CRUD/インライン編集) | E2E 11件 | 確認済 | SP-ENTITY-001 | |
| F18 | Web Tester: ConversationTemplate GUI (CRUD/trigger条件編集) | E2E 10件 | 確認済 | SP-DYNAMIC-001 | |
| F19 | Web Tester: Play Immersion Phase 1 (段落フェードイン/インライン選択肢/遷移) | E2E 8件 | 確認済 | SP-PLAY-001 | |
| F20 | Web Tester: Play Immersion Phase 2 (シーン画像/BGM) | E2E 5件 | **手動確認未了** | SP-PLAY-001 | pct 95% |
| F21 | エクスポート 5形式 (CSV/Ink/Twine/JSON/Yarn) | verify-export-formatters.mjs | 確認済 | SP-005/SP-EXP-YARN-001 | |
| F22 | Node Hierarchy (グループ/ツリー表示/展開状態) | Unit + E2E | 確認済 | SP-HIE-001 | |
| F23 | Search System (キーワード/同義語/セマンティック) | Unit | 確認済 | SP-SEARCH-001 | |
| F24 | XSS Protection (html-utils中央化) | Unit | 確認済 | SP-XSS-001 | |
| F25 | Mermaid Preview (ズーム/パン) | E2E | 確認済 | SP-003 | |
| F26 | AI Provider (Mock + OpenAI stub) | Unit | 確認済 | SP-006 | |
| F27 | REST API (Express, CRUD, セッション管理) | 手動 | 部分確認 | SP-API-001 | pct 90% |
| F28 | Condition/Effect共通モジュール (condition-effect-ops.ts) | Unit | 確認済 | SP-REFACTOR-001 | |
| F29 | Session History (Undo) | Unit | 確認済 | -- | 仕様書なし |
| F30 | Encoding Safety Check (check:safety) | Script | 確認済 | -- | |
| F31 | Model Sync (sync:models / check:models-sync) | Script | 確認済 | -- | |

---

## 2. 未確認・手動確認待ち機能 (確認手段別)

### ブラウザ手動操作が必要

| # | 機能 | 確認手段 | 現状 | 対応優先度 |
|---|------|---------|------|-----------|
| U01 | Play Immersion Phase 2 (画像/BGM操作感) | `npm run dev` → Play Mode で画像/BGM付きシーン再生 | E2E通過だが手動操作感は未確認 | 高 |
| U03 | Undo/Redo (GUI操作感) | `npm run dev` → ノード編集 → Ctrl+Z/Y | E2E 3件skip (防御的)。手動回帰テスト未実施 | 中 |
| U04 | Graph Editor 全体操作感 | `npm run dev` → グラフのD&D/ズーム/パン/レイアウト | Visual Audit 未実施。操作感/レイアウト/導線の検証なし | 中 |

### Visual Audit (画面走査) が必要

| # | 機能 | 確認手段 | 現状 | 対応優先度 |
|---|------|---------|------|-----------|
| U05 | Web Tester 全体UI/導線 | visual-scout でスクリーンショット走査 | プロジェクト開始以来一度も画面走査なし | 中 |

### curl / Postman が必要

| # | 機能 | 確認手段 | 現状 | 対応優先度 |
|---|------|---------|------|-----------|
| U02 | REST API 全エンドポイント | `npm run dev:api` → curl でCRUD操作 | 仕様上 pct 90% だが実動作確認記録なし | 低 |

---

## 3. 未実装機能

| # | 機能 | 仕様ID | 状態 | 優先度 | 備考 |
|---|------|--------|------|--------|------|
| N01 | Unity SDK: TS側7機能のC#移植 | SP-UNITY-001 (85%) | 未着手 | 高 | Entity-Property/DynamicText/Anomaly/Knowledge/Event/DescTracker/ConvTemplate |
| N03 | WritingPage連携 (双方向) | -- | 未着手 | 中 | 外部フォーマット安定後。SP-PIPE-001 本文で延期扱い |
| N04 | Dynamic Text Yarn変換 | -- | 未着手 | 中 | |
| N05 | spec 保守運用の具体化（レビュー例・運用ガイド） | SP-009 残項目 | 部分 | 中 | GitHub Actions `governance`（spec-index / models-sync / encoding-safety）は実装済み |
| N06 | アクセシビリティ (ARIA) | SP-009残項目 | 未着手 | 低 | |
| N07 | モバイル/タブレット対応 | SP-009残項目 | 未着手 | 低 | |

### 仕様抜け (実装済みだが spec-index にエントリなし)

| 機能 | 実装場所 | テスト | 対応方針 |
|------|---------|--------|---------|
| Session History (Undo) | packages/engine-ts/src/session-history.ts | session-history.spec.ts | 必要なら SP-* エントリを追加 |
| WritingPage連携仕様 | Decision Log + pipeline-workflow.md（延期節） | なし | 外部安定後に個別 SP または SP-PIPE-001 追記で起票 |

---

## 4. 懸念事項

| # | 懸念 | 深刻度 | 詳細 | 対応状況 |
|---|------|--------|------|---------|
| C01 | E2Eバッチ間欠失敗 (AC-5 mode toggle) | 低 | CPU競合による。workers=2/timeout=45s/retries=1で緩和済み | mitigated |
| C02 | 表記ゆれ (Packages/ vs packages/) | 情報 | リポジトリ実体・現役ドキュメントは `packages/` に統一。`docs/archive/` に旧表記が残る場合あり | 新規は小文字で記載 |
| C03 | Undo/Redo E2E skip 3件 | 低 | 防御的skip。graph表示依存の不安定さを隠蔽している可能性 | 既知 |
| C04 | （解消）SP-PIPE-001 | 情報 | 2026-04-03 時点で spec-index `done` / 100%。本文は pipeline-workflow.md + AUTHORING_GUIDE | 完了 |
| C06 | resolver.ts が公開APIにexportされていない | 低 | index.ts/browser.ts どちらからも未エクスポート。内部専用なら問題なし | 要確認 |
| C07 | Visual Audit 未実施 | 中 | プロジェクト開始以来一度も画面走査を行っていない | 継続 |
| C09 | Backend API重複ルート | 低 | `/models/*` と `/api/models/*` が全ハンドラを複製 (~200行) | 既知 |
| C10 | IDEA POOL の所在 | 低 | `CLAUDE.md` に「IDEA POOL」節を追加し `USER_REQUEST_LEDGER.md` へ誘導（2026-04-07） | 記載済 |
| C11 | 保守偏重（ドキュメントのみの連続コミット） | 中 | 状況は都度変化。次の user-visible 変更は `HANDOVER.md` の推奨作業を参照 | 継続監視 |

---

## 5. レガシー・デッドコード

### 5a. session 14 で処理済み (L01-L07)

| # | 対象 | 種別 | 対応 |
|---|------|------|------|
| L01 | hands-on-testing.md (ルート) | 孤立ドキュメント | 削除済 |
| L02 | API_ENDPOINTS.md (ルート) | 孤立ドキュメント | 削除済 |
| L03 | API_DEVELOPMENT_WORKFLOW.md (ルート) | 孤立ドキュメント | 削除済 |
| L04 | test-ai-features.md (ルート) | 孤立ドキュメント | 削除済 |
| L05 | hierarchy-state.test.js | 偽テスト | 削除済 |
| L06 | SP-004 (spec-index legacy) | レガシー仕様 | spec-indexから削除済 |
| L07 | docs/troubleshooting.md L214 master参照 | 旧ブランチ参照 | main に修正済 |

### 5b. session 15 で処理済み (L08-L17)

| # | 対象 | 種別 | 対応 |
|---|------|------|------|
| L08 | apps/web-tester/tests/advanced-search-demo.html | 手動確認用デモ | 削除済 |
| L09 | apps/web-tester/tests/hierarchy-tree-view-demo.html | 手動確認用デモ | 削除済 |
| L10 | apps/web-tester/tests/search-demo-standalone.html | 手動確認用デモ | 削除済 |
| L11 | apps/web-tester/tests/verify-phase2b.sh | 手動検証スクリプト | 削除済 |
| L12 | apps/web-tester/docs/PHASE-2B-*.md (3ファイル) | 完了フェーズ文書 | 削除済 |
| L13 | apps/web-tester/docs/PHASE-2C-*.md (2ファイル) | 完了フェーズ文書 | 削除済 |
| L14 | apps/web-tester/docs/TREE-VIEW-QUICK-START.md | 完了フェーズ文書 | 削除済 |
| L15 | packages/engine-ts/postcss.config.js | 空ファイル | 削除済 |
| L16 | packages/tests/NarrativeGen.Tests.csproj (外側) | 二重csproj | 削除済 |
| L17 | SP-001 OpenSpec-WebTester.md | 仕様書陳腐化 | archive移動済、pct 80 |

### 5c. session 16 で発見・修正済み (L18-L22)

| # | 対象 | 種別 | 対応 |
|---|------|------|------|
| L18 | packages/engine-ts/tools/validate-models.ts | デッドファイル | **削除済** (unstaged) |
| L19 | game-session.spec.ts `brand` | 型不整合 | **修正済** (unstaged) → `name` |
| L20 | C# GameSessionChoicesTests.cs `Brand` | 型不整合 | **修正済** (unstaged) → `Name` |
| L21 | C# InventoryTests.cs `Brand` | 型不整合 | **修正済** (unstaged) → `Name` |
| L22 | C# EngineSmokeTests.cs コメントアウト済みテスト | デッドコード | **削除済** (unstaged) |

### 5d. session 17 で発見・削除 (L23-L35)

| # | 対象 | 種別 | 対応 |
|---|------|------|------|
| L23 | docs/tasks/TASK_108_BatchAI.md | stale タスク (Decision Log で削除決定済み) | 削除済 |
| L24 | docs/tasks/TASK_107_SaveLoad.md | stale タスク (session 11 で実装完了済み) | 削除済 |
| L25 | docs/tasks/TASK_103_CI_Doctor_Integration.md | stale タスク (shared-workflows 依存、レガシー化) | 削除済 |
| L26 | docs/tasks/TASK_106_Performance.md | stale タスク (旧 architecture 参照) | 削除済 |
| L27 | PHASE-2A-COMPLETE.md (ルート) | 完了フェーズ報告 (2026-03-05) | 削除済 |
| L28 | XSS_PHASE1_SUMMARY.md (ルート) | 完了フェーズ報告 | 削除済 |
| L29 | TEST_GUIDE.md (ルート) | main.js 分割テストガイド (完了済み) | 削除済 |
| L30 | choices-driven-development.md (ルート) | Decision Log に統合済み | 削除済 |
| L31 | DEVELOPMENT_PROTOCOL.md (ルート) | 旧開発プロトコル (trunk-based に移行済み) | 削除済 |
| L32 | apps/web-tester/scripts/verify-phase-2a.mjs | Phase 2A 検証スクリプト (完了済み) | 削除済 |
| L33 | apps/web-tester/utils/hierarchy-integration-example.js | デッドコード (verify-phase-2a からのみ参照) | 削除済 |
| L34 | docs/hierarchy-api-reference.md | Phase 2A API リファレンス (hierarchy-system.md に統合) | 削除済 |
| L35 | docs/tasks/ ディレクトリ全体 | 空ディレクトリ化 (全タスク削除後) | 削除済 |

---

## 6. spec-index 監査結果

### non-done および参照用エントリ (2026-04-07 時点)

| ID | title | status | pct | 実態評価 | 次アクション |
|----|-------|--------|-----|---------|-------------|
| SP-001 | Web Tester Spec (Legacy) | done | 80 | archive 移動済み。参照用 | なし |
| SP-009 | Technical Debt | partial | 90 | 残項目: a11y/モバイル、spec 運用の具体化など | 低優先度で段階対応 |
| SP-UNITY-001 | Unity SDK | partial | 85 | 7機能未移植 | 別セッション推奨 |
| SP-TGEN-001 | Narrative Text Generation Pipeline (SSoT) | partial | 92 | Unity 側スライス実装済み。Gaps は spec summary 参照 | `narrative-text-generation-pipeline.md` |
| SP-PLAY-001 | Play Immersion MVP | partial | 95 前後 | AC-9〜12 は `play-immersion.md` 検証表への記入が残る | 手動確認 |
| SP-API-001 | REST API | done | 90 | 実動作確認記録なし | curl テストで閉じられる |
| SP-PIPE-001 | Designer Pipeline Workflow | done | 100 | 仕様確定済み | WritingPage は延期 |

### 全34エントリの参照先ファイル存在確認: **都度** `npm run check:spec-index` で検証

---

## 7. 定量指標

| 指標 | 値 (2026-04-07) | 備考 |
|------|-----------------|------|
| engine-ts Unit テスト | 264 件前後 | `npm run test:engine` |
| E2E テスト | Playwright（件数はスイート実行で確認） | `npm run test:e2e` |
| E2E skip | undo-redo 等で防御的 skip が残る場合あり | |
| モデル検証 | 16 モデル / 15 example files | |
| 仕様書 (spec-index) | 34 エントリ | partial 例: SP-009, SP-UNITY-001, SP-TGEN-001, SP-PLAY-001 |
| エクスポート形式 | 5 (CSV/Ink/Twine/JSON/Yarn) | 変化なし |
| ルート .md ファイル | 5 (CLAUDE/README/HANDOVER/TASKS/BLIND_SPOTS) | 再開は HANDOVER 優先 |
| docs/ .md ファイル | archive 含め多数 | `docs/spec-index.json` が仕様 SoT |
| web-tester scripts | copy-models / verify-export / verify-hierarchy 等 | `apps/web-tester` を参照 |
| TODO/FIXME/HACK | 0 | |
| モックファイル | 0 | |
| レガシー処理累計 | L01-L35（履歴は本セクション §5 参照） | |

---

## 8. テスト健全性

- **Unit**: engine-ts Vitest 全緑（264 件前後）
- **E2E**: Playwright（`apps/web-tester/tests/e2e`）
- **skip 理由**: undo-redo.spec.js L48/L97/L123 -- graph表示依存の不安定さに対する防御的skip
- **C# テスト**: `packages/tests/NarrativeGen.Tests`（`dotnet test`）
- **モック**: 0ファイル (健全)
- **テスト/実装比**: 健全 (テスト増殖なし)
- **仕様抜け**: Session History (F29) に SP-* エントリなし
