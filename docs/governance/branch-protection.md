# ブランチ保護ルール: デフォルトブランチ CI 必須化

- 最終更新日時: 2025-10-07T14:40:29+09:00
- 更新者: AI: Cascade
- 対象リポジトリ: YuShimoji/NarrativeGen
- 対象ブランチ: `open-ws/engine-skeleton-2025-09-02`
- リスク/Tier: Tier 2（中）

## 目的

デフォルトブランチへマージされる全ての Pull Request に対して、GitHub Actions による CI 成功を必須化し、品質担保と安全性を向上させる。

## 適用ルール

- 必須ステータスチェック: `engine-ts`, `web-tester`, `sdk-unity`（GitHub Actions）
- 厳格モード: 有効（`strict: true` → ベースブランチに対して最新化を要求）
- 管理者への適用: 有効（`enforce_admins: true`）
- レビュー必須: 今回は未設定（必要に応じて今後拡張）

## 設定方式（自動化）

GitHub REST API を用いて設定。

- Endpoint: `PUT /repos/{owner}/{repo}/branches/{branch}/protection`
- 主要パラメータ:
  - `required_status_checks.strict = true`
  - `required_status_checks.contexts = ["engine-ts", "web-tester", "sdk-unity"]`
  - `enforce_admins = true`

## 検証方法

1. API で保護状態を取得:
   - `GET /repos/{owner}/{repo}/branches/{branch}/protection`
   - `required_status_checks.contexts` に `engine-ts` が含まれること。
2. PR 検証:
   - 対象ブランチ向け PR で、`engine-ts` のチェックが成功するまで「Merge」できないこと。
   - 厳格モードにより、ベースブランチ更新時は PR ブランチの最新化が求められること。

## 変更履歴
- 2025-10-07: 初版作成（CI 成功必須化を導入）。
