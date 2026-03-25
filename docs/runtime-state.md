# Runtime State

## 現在位置
- **session**: 14 (nightshift)
- **date**: 2026-03-26
- **branch**: main
- **slice**: 棚卸し + Excise (レガシー根絶)
- **lane**: Excise

## Active Artifact
- **artifact**: Web Tester (インタラクティブストーリーエディタ + プレイモード)
- **surface**: `npm run dev` -> http://localhost:5173/
- **last_change_relation**: cleanup

## カウンター
- **blocks_in_session**: 1
- **blocks_since_user_visible_change**: 3+ (session 12 以降 docs/cleanup のみ)
- **blocks_since_visual_audit**: N/A (一度も実施していない)

## 量的指標
- **engine_unit_tests**: 250 (20 files)
- **e2e_tests**: 57 (6 spec files, 3 skipped in undo-redo)
- **model_validation**: 16 models passed
- **spec_index_entries**: 32 (done 28 / partial 3 / todo 1)
- **export_formats**: 5
- **scripts**: 8

## Visual Evidence
- **visual_evidence_status**: unknown
- **last_visual_audit_path**: (none)

## 膨張兆候
- **test_proliferation**: none
- **mock_avoidance**: none
- **stale_evidence**: warning (visual audit never performed)
- **maintenance_bias**: warning (session 13-14 both docs/cleanup only)
- **legacy_proliferation**: resolved (session 14 cleanup)
