# Worker Prompt: TASK_009_GUIEditorManualTesting

## 参照
- チケット: docs/tasks/TASK_009_GUIEditorManualTesting.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `docs/GUI_EDITOR_TEST_GUIDE.md`のテストケース実行、`docs/TECHNICAL_DEBT.md`の手動テスト状況更新、テスト結果の記録
- Forbidden Area: テスト対象コードの変更（テスト実施のみ）、テストガイドの改変（既存のテストケースを変更しない）

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_009_20260104_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## DoD
- [ ] `docs/GUI_EDITOR_TEST_GUIDE.md`の以下のテストケースを実施:
  - [ ] コピー&ペースト（TC-CP-01〜TC-CP-04）
  - [ ] 検索・フィルタ（TC-SF-01〜TC-SF-05）
  - [ ] スニペット機能（TC-SN-01〜TC-SN-03）
  - [ ] カスタムテンプレート（TC-TM-01〜TC-TM-03）
  - [ ] リアルタイムプレビュー（TC-PV-01〜TC-PV-03）
  - [ ] モデル検証（TC-VL-01〜TC-VL-03）
  - [ ] Mermaidプレビュー（TC-MM-01〜TC-MM-03）
- [ ] 各テストケースの結果（成功/失敗、問題点）を記録
- [ ] `docs/TECHNICAL_DEBT.md`の手動テスト状況を更新
- [ ] 発見された問題があれば、別途Issue化または既存Issueに紐付け
- [ ] docs/inbox/ にレポート（REPORT_TASK_009_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- SSOT が取得できない / `ensure-ssot.js` でも解決不可
- 依存追加 / 外部通信が必要で GitHubAutoApprove=false のため手動確認が必要
- 破壊的・復旧困難操作が必要
- 数分以上の待機が必須、またはタイムアウト超過が見込まれる
- ブラウザ操作が不可能な環境（手動テストのため）

## 納品先
- docs/inbox/REPORT_TASK_009_20260104_*.md

## 実行手順（Worker向け）

### Phase 0: 参照と整備
1. `.cursor/MISSION_LOG.md` を読み込み、現在のフェーズと進捗を確認
2. SSOT: docs/Windsurf_AI_Collab_Rules_latest.md を確認
3. 進捗: docs/HANDOVER.md を確認
4. チケット: docs/tasks/TASK_009_GUIEditorManualTesting.md を確認
5. テストガイド: docs/GUI_EDITOR_TEST_GUIDE.md を確認

### Phase 1: 前提の固定
1. Tier: 2
2. Branch: main（現在のブランチを確認）
3. Report Target: docs/inbox/REPORT_TASK_009_20260104_*.md
4. GitHubAutoApprove: false（pushは手動確認が必要）

### Phase 2: 境界確認
1. Focus Area: テストケース実行、テスト結果記録、TECHNICAL_DEBT.md更新
2. Forbidden Area: テスト対象コードの変更、テストガイドの改変

### Phase 3: 実行
1. `npm run dev:tester`で開発サーバーを起動（必要に応じて）
2. `docs/GUI_EDITOR_TEST_GUIDE.md`のテストケースを順次実行
3. 各テストケースの結果（成功/失敗、問題点）を詳細に記録
4. 発見された問題があれば、別途Issue化または既存Issueに紐付け
5. `docs/TECHNICAL_DEBT.md`の手動テスト状況を更新

### Phase 4: 納品 & 検証
1. DoD各項目の達成確認（実際に実施した内容を記録）
2. チケットを DONE に更新し、DoD各項目に対して根拠を記入
3. docs/inbox/ にレポートを作成し、`report-validator.js` を実行
4. docs/HANDOVER.md を更新
5. `git status -sb` をクリーンにしてから commit（pushは手動確認が必要）

### Phase 5: チャット出力
- 完了時: `Done: docs/tasks/TASK_009_GUIEditorManualTesting.md. Report: docs/inbox/REPORT_TASK_009_*.md. Tests: <cmd>=<result>.`
- ブロッカー継続時: `Blocked: docs/tasks/TASK_009_GUIEditorManualTesting.md. Reason: <要点>. Next: <候補>. Report: docs/inbox/REPORT_TASK_009_*.md.`
