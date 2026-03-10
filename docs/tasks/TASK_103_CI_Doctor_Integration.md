# Task: CI Doctor 統合
Status: OPEN
Tier: 2
Branch: feature/ci-doctor-integration
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report: 

## Objective
- CI パイプラインに shared-workflows の sw-doctor.js を統合し、PR ごとに環境健全性を自動検証する

## Context
- shared-workflows に doctor-health-check.yml テンプレートあり
- 現在の CI: .github/workflows/ci.yml (engine-ts + web-tester)
- sw-doctor bootstrap チェックは手動で通過済み
- Branch Protection: engine-ts ジョブが required status check

## Focus Area
- .github/workflows/ci.yml（doctor ジョブ追加）
- .gitignore（必要に応じて更新）

## Forbidden Area
- packages/（コード変更禁止）
- apps/（コード変更禁止）

## Constraints
- テスト: CI が通ること
- 既存の engine-ts required status check を壊さない
- doctor チェックは warning のみで fail させない（bootstrap プロファイル）

## DoD
- [ ] CI に doctor-bootstrap ジョブが追加されている
- [ ] PR 作成時に doctor チェックが自動実行される
- [ ] 既存の engine-ts / web-tester ジョブに影響がない
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- doctor ジョブは required status check に含めない（まずは情報提供のみ）
- 将来的に ci-strict プロファイルへの昇格を検討
