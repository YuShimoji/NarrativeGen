# Development Protocol: Issue → Branch → PR → Auto-Merge

このドキュメントは、本リポジトリにおける「Issue起票 → 作業ブランチ → Pull Request → CI合格後の自動マージ」までの標準フローを定義します。

---

## 1. Issue 起票
- 目的・背景・受け入れ基準（Acceptance Criteria）を明記します。
- ラベル（例: `documentation`, `ci` など）を付与します。
- 例（GitHub CLI）:
  ```bash
  gh issue create \
    --title "Add CI status badge to README" \
    --body "Add GitHub Actions status badge to README.md to show build status for ci.yml.\n\nAcceptance Criteria:\n- README shows CI badge.\n- PR auto-merges after CI passes." \
    --label documentation
  ```

## 2. ブランチ運用
- 命名規則: `feat/<short-desc>` `docs/<short-desc>` `ci/<short-desc>`
- 例:
  ```bash
  git checkout -b feat/readme-ci-badge
  ```

## 3. 変更実装とコミット規約
- Conventional Commits を推奨: `feat:`, `fix:`, `docs:`, `ci:`, `refactor:` など。
- Issue を閉じるコミット/PR本文に `Closes #<issue-number>` を含めます。
- 例:
  ```bash
  git add README.md .github/workflows/ci.yml
  git commit -m "docs(readme): add CI status badge\n\nCloses #<issue-number>"
  ```

## 4. PR 作成と Auto-Merge
- ベースブランチ: デフォルトブランチ（例: `open-ws/engine-skeleton-2025-09-02`）
- PR 作成（Issue を本文で参照）:
  ```bash
  gh pr create \
    --base open-ws/engine-skeleton-2025-09-02 \
    --head feat/readme-ci-badge \
    --title "docs: add CI status badge to README" \
    --body "Closes #<issue-number>. Adds GitHub Actions status badge for ci.yml."
  ```
- Auto-Merge を有効化（CI 合格後自動マージ）:
  ```bash
  gh pr merge --auto --merge
  ```

## 5. CI / アーティファクト / カバレッジ
- ワークフロー: `.github/workflows/ci.yml`
  - TypeScript エンジンのビルド・テスト・モデル検証を実行
-（別ブランチの .NET CI は `dotnet-ci.yml`）

## 6. マージ後
- Issue は自動クローズ（`Closes #<number>`）
- ブランチ削除（自動 or 手動）
- README のバッジ表示を確認

---

このプロトコルに従うことで、Issue ドリブンで小さな変更を安全に流し込み、CI による回帰防止と品質維持を自動化できます。
