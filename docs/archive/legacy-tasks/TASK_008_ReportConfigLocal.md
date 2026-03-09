# Task: REPORT_CONFIG.ymlのプロジェクトルート配置

Status: CLOSED
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-03T22:10:00Z
Report: docs/inbox/REPORT_TASK_008_20260103_2338.md

## Objective

REPORT_CONFIG.ymlをプロジェクトルートに配置し、プロジェクト固有のレポート設定を追加しやすくする。

## Context

- 現在、REPORT_CONFIG.ymlは`.shared-workflows/`にのみ存在し、プロジェクト固有の設定を追加しにくい
- プロジェクト固有のレポートスタイルや禁止表現を追加したい場合、submoduleを直接変更する必要がある（推奨されない）
- プロジェクトルートに配置することで、プロジェクト固有の設定を管理しやすくなる

## Focus Area

- プロジェクトルートの`REPORT_CONFIG.yml`（新規作成）
- `.shared-workflows/REPORT_CONFIG.yml`をベースに、プロジェクト固有の設定を追加
- `report-validator.js`や`report-orch-cli.js`がプロジェクトルートの設定を優先的に読み込むように確認

## Forbidden Area

- `.shared-workflows/REPORT_CONFIG.yml`の直接変更（submoduleの変更は禁止）
- 既存のレポート検証ロジックの破壊的変更

## Constraints

- `.shared-workflows/REPORT_CONFIG.yml`との互換性を保つ
- プロジェクト固有の設定のみを追加し、既存の設定は継承する

## DoD

- [x] プロジェクトルートに`REPORT_CONFIG.yml`が作成されている
- [x] `.shared-workflows/REPORT_CONFIG.yml`の設定を継承しつつ、プロジェクト固有の設定を追加できる
- [x] `report-validator.js`がプロジェクトルートの設定を優先的に読み込むことを確認
- [x] プロジェクト固有の禁止表現やスタイル設定が追加されている（例: NarrativeGen固有の用語）
- [x] docs/inbox/ にレポート（REPORT_TASK_008_*.md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 設定の優先順位: プロジェクトルート > .shared-workflows/ > デフォルト
- プロジェクト固有の設定例: NarrativeGen固有の用語、Unity C#関連の表現規則等
