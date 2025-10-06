# AI Context

本プロジェクトは中央リポジトリの開発ルールとワークフローを参照して運用します。

- 中央ルール: https://github.com/YuShimoji/shared-workflows (docs/Windsurf_AI_Collab_Rules_v1.1.md)
- 参照ブランチ: `chore/central-init`
- プロジェクトの一次情報源:
  - 設計/進捗: `Documentation/01_Current_Status/TASK_LIST.md`
  - 技術仕様: `Documentation/02_Technical_Specs/`
  - 実装: `src/`（Domain/Application/Infrastructure）
  - Unity 統合: `Assets/`（アダプタ層に限定）

## 運用方針
- Clean Architecture + SOLID 準拠。Unity 依存はアダプタ層に限定。
- すべての自動化は GitHub Actions の共有ワークフローを再利用。
- Issue は `docs/ISSUES.md` をソースに同期（`sync-issues.yml`）。
- PR 作成時は小さく頻繁に。コミットメッセージは Conventional Commits 推奨。
