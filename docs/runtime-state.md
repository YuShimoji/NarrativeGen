# Runtime State

## 現在位置
- **session**: 18
- **date**: 2026-04-03
- **branch**: main
- **slice**: SP-PIPE-001 完了 + Canonical docs 補完
- **lane**: Docs / Spec Completion

## Active Artifact
- **artifact**: SP-PIPE-001 (Designer Pipeline Workflow) + Canonical docs
- **surface**: `docs/specs/pipeline-workflow.md`, `docs/AUTHORING_GUIDE.md`, `docs/INVARIANTS.md`, `docs/OPERATOR_WORKFLOW.md`, `docs/USER_REQUEST_LEDGER.md`
- **last_change_relation**: direct (SP-PIPE-001 done 化 + AUTHORING_GUIDE 全ステージ拡張 + canonical docs 初期化)

## カウンター
- **blocks_in_session**: 1
- **blocks_since_user_visible_change**: 0
- **blocks_since_visual_audit**: 2 (session 16 block 3 が最終。スクリーンショットパス消失)

## 量的指標
- **engine_unit_tests**: 250 (20 files)
- **e2e_tests**: 47 passed / 1 flaky / 1 skipped (chromium, 6 spec files)
- **model_validation**: 15 models passed
- **spec_index_entries**: 33 (done 30 / partial 3 (SP-009 90%, SP-UNITY-001 85%, SP-PLAY-001 98%) / todo 0)
- **export_formats**: 5
- **scripts**: 8
- **impl_files**: 121
- **test_files**: 27
- **mock_files**: 0
- **todo_fixme_hack**: 0

## Visual Evidence
- **visual_evidence_status**: stale (最終 2026-03-27 session 16。スクリーンショットパス消失)
- **last_visual_audit_path**: 不在 (session 16→17 間に削除された模様)
- **blocks_since_visual_audit**: 2

## 膨張兆候
- **test_proliferation**: none
- **mock_avoidance**: none
- **stale_evidence**: visual audit ディレクトリが消失
- **maintenance_bias**: none
- **legacy_proliferation**: none

## E2E 既知問題
- `npx playwright test` (ルート直接) で `Cannot redefine property: Symbol($$jest-matchers-object)` エラー。`npm run test:e2e` を使用すること
- new-model-workflow の「モデルをダウンロード保存できる」テストが flaky (timeout、既知)

## 未コミット変更
- docs 7ファイル (pipeline-workflow.md, AUTHORING_GUIDE.md, INVARIANTS.md, OPERATOR_WORKFLOW.md, USER_REQUEST_LEDGER.md, project-context.md, runtime-state.md)
- spec-index.json (SP-PIPE-001 status update)

## 堆積物候補
- apps/web-tester/docs/ Phase-2B/2C系ファイル
- apps/web-tester/build.log, build_debug.log

## Canonical docs 補完状況
- docs/INVARIANTS.md: 実コンテンツ化済み (session 18)
- docs/USER_REQUEST_LEDGER.md: 実コンテンツ化済み (session 18)
- docs/OPERATOR_WORKFLOW.md: 実コンテンツ化済み (session 18)
- docs/INTERACTION_NOTES.md: 実際の指針あり (薄いが機能中)

## Session 18 実施内容

### SP-PIPE-001 完了 (70% → 100%)
- pipeline-workflow.md: HUMAN_AUTHORITY 5件決定を本文に反映 (Stage 2a 延期明記、Gap 優先度更新、自動化マトリクス更新)
- AUTHORING_GUIDE.md: Pipeline 全体像 + Stage 1 (構想・設計) + Stage 3 (検証・調整) + Stage 4 拡張 + Stage 5 (ランタイム統合) を追加
- spec-index.json: SP-PIPE-001 status partial→done, pct 70→100

### Canonical docs 初期化
- INVARIANTS.md: テンプレート→実コンテンツ (UX不変量、責務境界、禁止解釈)
- OPERATOR_WORKFLOW.md: テンプレート→実コンテンツ (5ステージフロー、痛点、品質目標、Actor 境界)
- USER_REQUEST_LEDGER.md: テンプレート→実コンテンツ (有効要求、Backlog Delta 6件)

### WritingPage 連携整理
- 早期実装コード (ZwpFormatter.js + zwp-import-handler.js + UI接続4ファイル) を git stash に退避
- 延期理由: WritingPage v0.3.32 のフォーマット不安定
