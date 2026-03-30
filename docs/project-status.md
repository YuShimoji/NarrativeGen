# NarrativeGen プロジェクト全体ステータス

**調査日**: 2026-03-26 (session 17)
**ブランチ**: main (origin/main と同期済み)
**テスト**: engine-ts 250/250 (20 files), E2E 57件 (6 spec files, 3 skip), モデル検証 16通過

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
| N02 | Pipeline Workflow (ライターワークフロー全体定義) | SP-PIPE-001 (10%) | ドラフト | 高 | HUMAN_AUTHORITY確認待ち |
| N03 | WritingPage連携 (双方向) | -- | 未着手 | 中 | 仕様策定前。Decision Log 2026-03-08 で方向決定済み |
| N04 | Dynamic Text Yarn変換 | -- | 未着手 | 中 | |
| N05 | CI統合 (spec-index/encoding-safety) | SP-009残項目 | 未着手 | 中 | |
| N06 | アクセシビリティ (ARIA) | SP-009残項目 | 未着手 | 低 | |
| N07 | モバイル/タブレット対応 | SP-009残項目 | 未着手 | 低 | |

### 仕様抜け (実装済みだが spec-index にエントリなし)

| 機能 | 実装場所 | テスト | 対応方針 |
|------|---------|--------|---------|
| Session History (Undo) | packages/engine-ts/src/session-history.ts | session-history.spec.ts | 必要なら SP-* エントリを追加 |
| WritingPage連携仕様 | Decision Log のみ | なし | SP-PIPE-001 内で扱うか個別 SP を起票 |

---

## 4. 懸念事項

| # | 懸念 | 深刻度 | 詳細 | 対応状況 |
|---|------|--------|------|---------|
| C01 | E2Eバッチ間欠失敗 (AC-5 mode toggle) | 低 | CPU競合による。workers=2/timeout=45s/retries=1で緩和済み | mitigated |
| C02 | Packages/ (大文字P) ディレクトリ残存 | 情報 | Windows case-insensitive でパス同一。Linux CIでは問題なし | 問題なし |
| C03 | Undo/Redo E2E skip 3件 | 低 | 防御的skip。graph表示依存の不安定さを隠蔽している可能性 | 既知 |
| C04 | SP-PIPE-001 方向性未確定 | 高 | ペルソナ定義/WritingPage優先度/エクスポート戦略が未決定 | HUMAN_AUTHORITY待ち |
| C06 | resolver.ts が公開APIにexportされていない | 低 | index.ts/browser.ts どちらからも未エクスポート。内部専用なら問題なし | 要確認 |
| C07 | Visual Audit 未実施 | 中 | プロジェクト開始以来一度も画面走査を行っていない | 継続 |
| C09 | Backend API重複ルート | 低 | `/models/*` と `/api/models/*` が全ハンドラを複製 (~200行) | 既知 |
| C10 | IDEA POOL が空 | 低 | project-context.md は「CLAUDE.md を参照」だが CLAUDE.md に IDEA POOL なし | 要整備 |
| C11 | blocks_since_user_visible_change: 5+ | 中 | session 12 以降 docs/cleanup のみ。保守偏重警告 | 次セッションで Advance 必須 |

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

### non-done エントリ (session 17 時点)

| ID | title | status | pct | 実態評価 | 次アクション |
|----|-------|--------|-----|---------|-------------|
| SP-001 | Web Tester Spec (Legacy) | done | 80 | archive 移動済み。参照用 | なし |
| SP-009 | Technical Debt | partial | 90 | 残項目: CI統合/a11y/モバイル | 低優先度で段階対応 |
| SP-UNITY-001 | Unity SDK | partial | 85 | 7機能未移植 | 別セッション推奨 |
| SP-PLAY-001 | Play Immersion MVP | partial | 95 | Phase 2 手動確認のみ残 | Visual Audit で閉じられる |
| SP-API-001 | REST API | done | 90 | 実動作確認記録なし | curl テストで閉じられる |
| SP-PIPE-001 | Designer Pipeline Workflow | todo | 10 | ドラフト段階 | HUMAN_AUTHORITY レビュー待ち |

### 全32エントリの参照先ファイル存在確認: **全件存在**

---

## 7. 定量指標

| 指標 | 値 (session 17) | session 16 比 |
|------|-----------------|---------------|
| engine-ts Unit テスト | 250 (20ファイル) | 変化なし |
| E2E テスト | 57件 (6 spec files) | 変化なし |
| E2E skip | 3件 (undo-redo 防御的skip) | 変化なし |
| モデル検証 | 16モデル / 15 example files | 変化なし |
| 仕様書 (spec-index) | 32エントリ (done 28 / partial 3 / todo 1) | 変化なし |
| エクスポート形式 | 5 (CSV/Ink/Twine/JSON/Yarn) | 変化なし |
| ルート .md ファイル | 5 (CLAUDE/README/HANDOVER/TASKS/BLIND_SPOTS) | -5 (レガシー削除) |
| docs/ .md ファイル | 約189 (archive含む) | -6 (stale tasks + stale docs 削除) |
| web-tester scripts | 3 (copy-models/verify-export/verify-hierarchy) | -1 (verify-phase-2a 削除) |
| TODO/FIXME/HACK | 0 | 変化なし |
| モックファイル | 0 | 変化なし |
| レガシー処理累計 | L01-L35 (35件処理済み) | +13件 (session 17) |

---

## 8. テスト健全性

- **Unit**: 250/250 全緑
- **E2E**: 6 spec files, 57件 (3件 skip in undo-redo)
- **skip 理由**: undo-redo.spec.js L48/L97/L123 -- graph表示依存の不安定さに対する防御的skip
- **C# テスト**: 3ファイル。L18-L22 の型不整合/デッドコードは全て修正済み (unstaged)
- **モック**: 0ファイル (健全)
- **テスト/実装比**: 健全 (テスト増殖なし)
- **仕様抜け**: Session History (F29) に SP-* エントリなし
