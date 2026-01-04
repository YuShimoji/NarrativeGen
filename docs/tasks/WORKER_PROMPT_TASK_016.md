# Worker Prompt: TASK_016 GUIエディタのバッチテキスト置換機能実装

## 参照
- チケット: docs/tasks/TASK_016_GUIEditorBatchTextReplace.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `apps/web-tester/src/ui/gui-editor.js`のバッチテキスト置換機能追加、`apps/web-tester/src/ui/batch-editor.js`のノードテキスト一括置換機能追加、正規表現サポート、バッチ編集モーダルのUI拡張
- Forbidden Area: 既存の選択肢一括編集機能の破壊的変更、既存のバッチ編集モーダルの破壊的変更（拡張のみ）

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_016_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## 背景

選択肢一括編集は実装済みですが、ノードテキスト一括置換と正規表現サポートが未実装です。大規模モデルでの一括置換により、編集効率が大幅に向上します。

## 実装要件

### 1. ノードテキスト一括置換機能

- **検索文字列→置換文字列**: すべてのノードテキストから検索文字列を検索し、置換文字列に置換
- **正規表現サポート**: チェックボックスで有効/無効を切り替え、正規表現を使用した置換
- **置換前のプレビュー**: 置換対象ノードの一覧表示（IDとテキスト）

### 2. バッチ編集モーダルのUI拡張

- **ノードテキスト置換タブの追加**: 既存のバッチ編集モーダルにノードテキスト置換タブを追加
- **既存機能との統合**: 選択肢一括編集機能と統合し、一貫したUIを提供

## 参考資料

- `docs/tasks/TASK_016_GUIEditorBatchTextReplace.md`: タスクチケット
- `docs/NEXT_PHASE_PROPOSAL.md`: 次フェーズ開発提案（「Phase 3: ストーリー作成効率化（拡張）」）
- `apps/web-tester/src/ui/batch-editor.js`: 既存のバッチエディタ（選択肢一括編集機能）
- `apps/web-tester/src/ui/gui-editor.js`: GUIエディタマネージャー

## 完了条件（DoD）

- [ ] ノードテキスト一括置換機能の実装
- [ ] 正規表現サポートの実装
- [ ] 置換前のプレビュー機能の実装
- [ ] バッチ編集モーダルのUI拡張
- [ ] 既存の選択肢一括編集機能との統合確認
- [ ] サンプルモデルで動作確認
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_016_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 注意事項

- 正規表現のエスケープ処理に注意すること
- 置換前のプレビューで、置換対象ノードのIDとテキストを表示すること
- 大規模モデル（500ノード以上）でもパフォーマンスを維持すること
