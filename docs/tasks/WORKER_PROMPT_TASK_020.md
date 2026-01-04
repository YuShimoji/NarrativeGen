# Worker Prompt: TASK_020 Phase 2グラフビューのレスポンシブ対応

## 参照
- チケット: docs/tasks/TASK_020_GraphViewResponsive.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`のウィンドウサイズ変更時の自動再レイアウト機能追加、`ResizeObserver`または`window.resize`イベントの実装、レイアウト再計算の最適化
- Forbidden Area: 既存の読み取り専用機能の破壊的変更、既存のタブ切り替え時の再描画機能の破壊的変更

## 前提条件
- Tier: 3
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_020_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## 背景

TASK_013で読み取り専用のグラフビューが実装完了しましたが、ウィンドウサイズ変更時の自動再レイアウトは未実装です。現状はタブ切り替え時に再描画されます。

## 実装要件

### 1. ウィンドウサイズ変更時の自動再レイアウト

- `ResizeObserver`または`window.resize`イベントを使用
- ウィンドウサイズ変更時に自動的にレイアウトを再計算

### 2. パフォーマンス最適化

- デバウンス処理を実装（300ms程度を目安）
- 大規模グラフ（500ノード以上）でもパフォーマンスを維持

## 参考資料

- `docs/tasks/TASK_020_GraphViewResponsive.md`: タスクチケット
- `docs/reports/REPORT_TASK_013_Phase2ReadOnlyGraphView.md`: Phase 2グラフビューの実装レポート（161-163行目に記載）
- `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`: グラフエディタマネージャー

## 完了条件（DoD）

- [ ] ウィンドウサイズ変更時の自動再レイアウト機能の実装
- [ ] デバウンス処理の実装
- [ ] パフォーマンステストの実施（大規模グラフでの動作確認）
- [ ] サンプルモデルで動作確認
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_020_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 注意事項

- `ResizeObserver`を使用するか、`window.resize`イベントを使用するか検討すること
- デバウンス処理は300ms程度を目安にすること
- パフォーマンステストは500ノード以上のモデルで実施すること
