# Worker Prompt: TASK_007_ProjectSpecificWorkflowScripts

## 参照
- チケット: docs/tasks/TASK_007_ProjectSpecificWorkflowScripts.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `scripts/` ディレクトリ（新規作成または既存を拡張）、プロジェクトルートの検証スクリプト、Unity C#プロジェクト構造の検証、TypeScript/JavaScriptビルド環境の検証、Web Tester起動可能性の検証
- Forbidden Area: shared-workflowsのスクリプトを直接変更、破壊的な変更（既存のビルドプロセスを変更しない）、外部依存の追加（既存のnpm/node環境のみを使用）

## 前提条件
- Tier: 1
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_007_20260103_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## DoD
- [ ] `scripts/narrgen-doctor.js` が作成され、以下の検証を実行できる:
  - [ ] Unity C#プロジェクト構造の存在確認（Packages/sdk-unity/）
  - [ ] TypeScriptエンジンのビルド可能性確認（Packages/engine-ts/）
  - [ ] Web Testerのビルド可能性確認（apps/web-tester/）
  - [ ] 依存関係の整合性確認（package.json、workspace設定）
  - [ ] テスト環境の準備可能性確認（TEST_PROCEDURES.mdの前提条件）
- [ ] スクリプトが`npm run check`と整合性を保っている
- [ ] エラー時の復旧手順がドキュメント化されている
- [ ] docs/inbox/ にレポート（REPORT_TASK_007_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- SSOT が取得できない / `ensure-ssot.js` でも解決不可
- 依存追加 / 外部通信が必要で GitHubAutoApprove=false のため手動確認が必要
- 破壊的・復旧困難操作が必要
- 数分以上の待機が必須、またはタイムアウト超過が見込まれる

## 納品先
- docs/inbox/REPORT_TASK_007_20260103_*.md

## 実行手順（Worker向け）

### Phase 0: 参照と整備
1. `.cursor/MISSION_LOG.md` を読み込み、現在のフェーズと進捗を確認
2. SSOT: docs/Windsurf_AI_Collab_Rules_latest.md を確認
3. 進捗: docs/HANDOVER.md を確認
4. チケット: docs/tasks/TASK_007_ProjectSpecificWorkflowScripts.md を確認

### Phase 1: 前提の固定
1. Tier: 1
2. Branch: main（現在のブランチを確認）
3. Report Target: docs/inbox/REPORT_TASK_007_20260103_*.md
4. GitHubAutoApprove: false（pushは手動確認が必要）

### Phase 2: 境界確認
1. Focus Area: `scripts/` ディレクトリ、プロジェクトルートの検証スクリプト、Unity C#/TypeScript/Web Testerの検証
2. Forbidden Area: shared-workflowsの直接変更、破壊的変更、外部依存追加

### Phase 3: 実行
1. `scripts/` ディレクトリの存在確認（無ければ作成）
2. `scripts/narrgen-doctor.js` を作成し、以下の検証を実装:
   - Unity C#プロジェクト構造の存在確認（Packages/sdk-unity/）
   - TypeScriptエンジンのビルド可能性確認（Packages/engine-ts/）
   - Web Testerのビルド可能性確認（apps/web-tester/）
   - 依存関係の整合性確認（package.json、workspace設定）
   - テスト環境の準備可能性確認（TEST_PROCEDURES.mdの前提条件）
3. `npm run check` との整合性を確認
4. エラー時の復旧手順をドキュメント化

### Phase 4: 納品 & 検証
1. DoD各項目の達成確認（実際に実施した内容を記録）
2. チケットを DONE に更新し、DoD各項目に対して根拠を記入
3. docs/inbox/ にレポートを作成し、`report-validator.js` を実行
4. docs/HANDOVER.md を更新
5. `git status -sb` をクリーンにしてから commit（pushは手動確認が必要）

### Phase 5: チャット出力
- 完了時: `Done: docs/tasks/TASK_007_ProjectSpecificWorkflowScripts.md. Report: docs/inbox/REPORT_TASK_007_*.md. Tests: <cmd>=<result>.`
- ブロッカー継続時: `Blocked: docs/tasks/TASK_007_ProjectSpecificWorkflowScripts.md. Reason: <要点>. Next: <候補>. Report: docs/inbox/REPORT_TASK_007_*.md.`
