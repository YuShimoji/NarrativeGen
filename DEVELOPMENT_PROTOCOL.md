# Development Protocol: Issue → Branch → PR → Auto-Merge

このドキュメントは、本リポジトリにおける「Issue起票 → 作業ブランチ → Pull Request → CI合格後の自動マージ」までの標準フローを定義します。

## 0. 作業再開チェックリスト（fetch/pull/差分/ブランチ確認）

- **申し送り確認**
  - `HANDOVER.md`
  - `docs/HANDOVER_YYYY-MM-DD.md`（最新日付を優先）
  - `TASKS.md`
  - `.openspec/*`
- **ブランチ/作業ツリー確認**
  - `git status`
  - `git branch --show-current`
- **リモート差分確認（取り込み前）**
  - `git fetch --all --prune`
  - デフォルトブランチ確認: `git rev-parse --abbrev-ref origin/HEAD`
  - 差分確認（例: デフォルトブランチを `origin/<default>` として）
    - ログ: `git log --oneline --decorate --graph <default>..origin/<default>`
    - ファイル差分: `git diff <default>..origin/<default>`
- **取り込み（デフォルトブランチのみ）**
  - `git checkout <default>`
  - `git pull --ff-only`
  - ブランチ保護により直接push不可のため、変更は必ず作業ブランチ→PR経由で反映します。

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
- 推奨: Issue運用時は番号を含める（例: `feature/#<issue>-<short-desc>`）
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
  - **engine-ts**
    - `npm ci`（リポジトリルート）
    - `packages/engine-ts` で `build` / `lint` / `test` / `validate-models`
  - **web-tester**（`needs: engine-ts`）
    - `npm ci`（リポジトリルート）
    - `npm run build:engine`（エンジンを先にビルド）
    - `apps/web-tester` で `npm run build`
  - **sdk-unity**
    - 現状はジョブがコメントアウト（Unityライセンス/環境要件のため）。CI対象に戻す場合は別途手順を整備します。

## 6. CI 失敗要因の切り分けテンプレ

- **どのジョブ/どのステップで落ちたか**
  - `engine-ts` / `web-tester` /（将来）`sdk-unity` を明記
  - 失敗したステップ名とログURLを記録
- **lockfile / 依存関係**
  - `package-lock.json` の差分有無
  - workspace パスの大小文字が混入していないか（`packages/` に統一。`Packages/` が `package-lock.json` に残ると環境差で崩れる）
  - `npm ci` 前提で再現するか（`npm install` ではなく）
- **ローカル再現（CIと同じ順番）**
  - `npm ci`
  - `npm run build -w @narrativegen/engine-ts`
  - `npm run lint -w @narrativegen/engine-ts -- --max-warnings=0`
  - `npm test -w @narrativegen/engine-ts -- --reporter=dot`
  - `npm run validate:models -w @narrativegen/engine-ts`
  - `npm run build:engine`
  - `npm run build -w @narrativegen/web-tester`
- **環境差（Windows/PowerShell）**
  - PowerShell では `&&` が期待通り動かない場合があるため、複数コマンドは分割して実行してください。

## 7. マージ後

- Issue は自動クローズ（`Closes #<number>`）
- ブランチ削除（自動 or 手動）
- README のバッジ表示を確認

---

このプロトコルに従うことで、Issue ドリブンで小さな変更を安全に流し込み、CI による回帰防止と品質維持を自動化できます。
