# Worker Prompt: TASK_010_TimeWindowConditionSpec

## 参照
- チケット: docs/tasks/TASK_010_TimeWindowConditionSpec.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `docs/OpenSpec-WebTester.md`の`timeWindow`条件仕様確認、`Packages/engine-ts/src/`の実装確認、`apps/web-tester/src/ui/condition-effect-editor.js`のUI確認、仕様と実装の不整合記録
- Forbidden Area: エンジン側の実装変更（調査・確認のみ）、仕様書の大幅な改変（整合性確認の結果を記録するのみ）

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_010_20260104_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## DoD
- [ ] `docs/OpenSpec-WebTester.md`の`timeWindow`条件仕様を確認
- [ ] `Packages/engine-ts/src/`の`timeWindow`条件実装を確認
- [ ] `apps/web-tester/src/ui/condition-effect-editor.js`の`timeWindow`条件UI実装を確認
- [ ] 仕様と実装の整合性を確認し、不整合があれば記録
- [ ] 不整合が見つかった場合、修正タスクを起票するか、既存Issueに紐付ける
- [ ] docs/inbox/ にレポート（REPORT_TASK_010_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- SSOT が取得できない / `ensure-ssot.js` でも解決不可
- 依存追加 / 外部通信が必要で GitHubAutoApprove=false のため手動確認が必要
- 破壊的・復旧困難操作が必要
- 数分以上の待機が必須、またはタイムアウト超過が見込まれる

## 納品先
- docs/inbox/REPORT_TASK_010_20260104_*.md

## 実行手順（Worker向け）

### Phase 0: 参照と整備
1. `.cursor/MISSION_LOG.md` を読み込み、現在のフェーズと進捗を確認
2. SSOT: docs/Windsurf_AI_Collab_Rules_latest.md を確認
3. 進捗: docs/HANDOVER.md を確認
4. チケット: docs/tasks/TASK_010_TimeWindowConditionSpec.md を確認

### Phase 1: 前提の固定
1. Tier: 2
2. Branch: main（現在のブランチを確認）
3. Report Target: docs/inbox/REPORT_TASK_010_20260104_*.md
4. GitHubAutoApprove: false（pushは手動確認が必要）

### Phase 2: 境界確認
1. Focus Area: 仕様確認、実装確認、整合性確認、不整合記録
2. Forbidden Area: エンジン側の実装変更、仕様書の大幅な改変

### Phase 3: 実行
1. `docs/OpenSpec-WebTester.md`の`timeWindow`条件仕様を確認
2. `Packages/engine-ts/src/`の`timeWindow`条件実装を確認（コード検索、実装箇所の特定）
3. `apps/web-tester/src/ui/condition-effect-editor.js`の`timeWindow`条件UI実装を確認
4. 仕様と実装の整合性を確認し、不整合があれば詳細に記録
5. 不整合が見つかった場合、修正タスクを起票するか、既存Issueに紐付ける

### Phase 4: 納品 & 検証
1. DoD各項目の達成確認（実際に実施した内容を記録）
2. チケットを DONE に更新し、DoD各項目に対して根拠を記入
3. docs/inbox/ にレポートを作成し、`report-validator.js` を実行
4. docs/HANDOVER.md を更新
5. `git status -sb` をクリーンにしてから commit（pushは手動確認が必要）

### Phase 5: チャット出力
- 完了時: `Done: docs/tasks/TASK_010_TimeWindowConditionSpec.md. Report: docs/inbox/REPORT_TASK_010_*.md. Tests: <cmd>=<result>.`
- ブロッカー継続時: `Blocked: docs/tasks/TASK_010_TimeWindowConditionSpec.md. Reason: <要点>. Next: <候補>. Report: docs/inbox/REPORT_TASK_010_*.md.`
