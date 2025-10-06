# Issues (managed via shared-workflows)

## 1) Clean Architecture 移行の完遂
- Domain/Application/Infrastructure の API 整合と依存方向の固定
- CSV Repository の I/F 合致（SaveAsync・GetChildTypesAsync など）
- テストランナーの再配置と .csproj 参照整理

## 2) Unity アダプタ層の新規設計
- Core(.NET) と Unity の完全分離
- 最小アダプタ: `UnityAdapter`(イベント購読/UIブリッジ)
- PlayMode/Editor テスト雛形の導入

## 3) 中央ワークフローの活用
- `ci-smoke.yml` でのスモーク確認（scripts/dev-server.js, scripts/dev-check.js）
- `sync-issues.yml` による本ファイルからの Issue 同期
- 運用手順の README/AI_CONTEXT への反映

## 4) Console/Legacy ランナーの整理
- `TestRunner.cs` の旧 Core 依存除去
- `NarrativeGen.Console` の最小デモ化（UseCase駆動）
- 不要資産の退避/削除計画（Core_Backup 等）
