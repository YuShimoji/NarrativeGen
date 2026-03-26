# Runtime State

## 現在位置
- **session**: 16
- **date**: 2026-03-27
- **branch**: main
- **slice**: WritingPage 連携仕様策定 + 実装
- **lane**: Advance

## Active Artifact
- **artifact**: Web Tester (インタラクティブストーリーエディタ + プレイモード)
- **surface**: `npm run dev` -> http://localhost:5173/
- **last_change_relation**: evidence-only (SP-PIPE-001 レビュー完了)

## カウンター
- **blocks_in_session**: 1
- **blocks_since_user_visible_change**: 1 (レビューのみ、visible change なし)
- **blocks_since_visual_audit**: 2 (session 境界 +1, block 1 +1)

## 量的指標
- **engine_unit_tests**: 250 (20 files)
- **e2e_tests**: 57 (6 spec files, 3 skipped in undo-redo)
- **model_validation**: 15 models passed
- **spec_index_entries**: 33 (done 29 / partial 3 / todo 0)
- **export_formats**: 5
- **scripts**: 8
- **impl_files**: 112 (engine-ts/src 42 + web-tester/src 60 + handlers 10)
- **test_files**: 25 (engine-ts unit 19 + e2e 6)
- **mock_files**: 0
- **todo_fixme_hack**: 0

## Visual Evidence
- **visual_evidence_status**: stale (2ブロック前)
- **last_visual_audit_path**: visual-scout (session 15, 4回実施)
- **blocks_since_visual_audit**: 2

## 膨張兆候
- **test_proliferation**: none
- **mock_avoidance**: none
- **stale_evidence**: none
- **maintenance_bias**: none
- **legacy_proliferation**: none

## 未コミット変更
- packages/engine-ts/schemas/lexicon.schema.json (modified)
- packages/sdk-unity/README.md (modified)
- apps/web-tester/docs/verification/ (untracked)

## 堆積物候補
- apps/web-tester/docs/ Phase-2B/2C系 7ファイル (archive に同名ファイル既存、二重管理の可能性)
- apps/web-tester/build.log, build_debug.log (ビルドログ残存)
