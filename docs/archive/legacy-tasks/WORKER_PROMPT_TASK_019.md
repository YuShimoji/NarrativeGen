# Worker Prompt: TASK_019 ドラフト復元UIの改善

## 参照
- チケット: docs/tasks/TASK_019_DraftRestoreUI.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `apps/web-tester/src/ui/gui-editor.js`のドラフト復元UI追加、`apps/web-tester/index.html`のドラフト復元モーダル追加、ドラフト情報の表示
- Forbidden Area: 既存のドラフト自動保存機能の破壊的変更、既存の簡易ダイアログの破壊的変更（段階的置換を想定）

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_019_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## 背景

ドラフト自動保存機能（`draft_model`）は実装済みですが、復元導線は簡易ダイアログのみで、専用UIが未整備です。ユーザーがドラフトを復元しやすくするため、専用UIが必要です。

## 実装要件

### 1. ドラフト復元モーダル

- 保存日時、ノード数等のドラフト情報を表示
- ドラフト復元時の確認ダイアログを表示

### 2. ドラフト情報の表示

- ドラフト情報は`draft_model`から取得
- 保存日時は`localStorage`のタイムスタンプから取得

## 参考資料

- `docs/tasks/TASK_019_DraftRestoreUI.md`: タスクチケット
- `docs/OpenSpec-WebTester.md`: Web Testerの仕様（89行目に記載）
- `apps/web-tester/src/ui/gui-editor.js`: GUIエディタマネージャー
- `apps/web-tester/src/features/save-manager.js`: セーブマネージャー（ドラフト保存の参考）

## 完了条件（DoD）

- [ ] ドラフト復元モーダルの実装
- [ ] ドラフト復元時の確認ダイアログの実装
- [ ] ドラフト情報の表示機能の実装
- [ ] 既存の簡易ダイアログとの整合性を確認
- [ ] サンプルモデルで動作確認
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_019_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 注意事項

- ドラフト情報は`draft_model`から取得すること
- 保存日時は`localStorage`のタイムスタンプから取得すること
