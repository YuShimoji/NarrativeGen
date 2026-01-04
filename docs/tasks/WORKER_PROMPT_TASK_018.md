# Worker Prompt: TASK_018 GUIエディタのロールバック機能実装

## 参照
- チケット: docs/tasks/TASK_018_GUIEditorRollback.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `apps/web-tester/src/ui/gui-editor.js`のロールバック機能追加、`apps/web-tester/main.js`のキャンセルボタンのイベントハンドラー更新、元モデルの保存・復元ロジック
- Forbidden Area: 既存のドラフト自動保存機能の破壊的変更、既存の保存機能の破壊的変更

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_018_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## 背景

現在の「キャンセル」ボタンはモード終了のみで、編集内容が破棄されません。ユーザーが編集をキャンセルしたい場合、元のモデルに戻す機能が必要です。

## 実装要件

### 1. 元モデルの保存

- GUI編集モード開始時に元モデルを保存する
- 元モデルは`draft_model`とは別に管理する

### 2. ロールバック機能

- キャンセルボタンで元モデルを復元する
- 元モデル復元後、GUI編集モードを終了する
- `draft_model`もクリアする

## 参考資料

- `docs/tasks/TASK_018_GUIEditorRollback.md`: タスクチケット
- `docs/OpenSpec-WebTester.md`: Web Testerの仕様（83行目に記載）
- `apps/web-tester/src/ui/gui-editor.js`: GUIエディタマネージャー
- `apps/web-tester/main.js`: メインエントリーポイント

## 完了条件（DoD）

- [ ] GUI編集モード開始時に元モデルを保存する機能の実装
- [ ] キャンセルボタンで元モデルを復元する機能の実装
- [ ] 元モデル復元後、GUI編集モードを終了する機能の実装
- [ ] ドラフト自動保存機能との整合性を確認
- [ ] サンプルモデルで動作確認
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_018_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 注意事項

- 元モデルの保存は`draft_model`とは別に管理すること
- キャンセル時は`draft_model`もクリアすること
