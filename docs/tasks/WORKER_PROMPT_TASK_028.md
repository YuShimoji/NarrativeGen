# Worker Prompt: TASK_028_ExportFeatureExtension

## 参照
- チケット: docs/tasks/TASK_028_ExportFeatureExtension.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md

## 境界
- **Focus Area**: `apps/web-tester/src/features/export/` (新規推奨), `apps/web-tester/src/ui/ExportModal.js` (UI追加)
- **Forbidden Area**: `apps/web-tester/main.js` (既存ロジック変更禁止), `apps/web-tester/core/`

## コンテキスト
ユーザーからの要望により、Twine (HTML) および Ink 形式へのエクスポート機能を追加します。既存のJSON/CSVエクスポートには影響を与えないように実装してください。

## DoD
- [ ] エクスポートUIに "Export as Twine", "Export as Ink" のオプションが追加されていること
- [ ] Twine形式への変換ロジックが実装されていること
- [ ] Ink形式への変換ロジックが実装されていること
- [ ] エクスポートされたファイルがそれぞれのツールで読み込めること
- [ ] 単体テストコードが追加されていること

## 停止条件
- 既存のデータ構造がTwine/Inkのモデルと大きく乖離しており、単純な変換では情報損失が激しい場合

## 納品先
- docs/inbox/REPORT_TASK_028_ExportFeatureExtension.md
