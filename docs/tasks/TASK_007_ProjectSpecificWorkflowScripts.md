# Task: プロジェクト固有ワークフロー調整スクリプト作成

Status: OPEN
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-03T22:10:00Z
Report: （未作成）

## Objective

NarrativeGenプロジェクト（Unity C#、TypeScript、Web Tester）に特化した初期化・検証スクリプトを作成し、セットアップ時間の短縮とエラー防止を実現する。

## Context

- 現在、shared-workflowsの汎用スクリプト（sw-doctor.js、ensure-ssot.js等）は使用可能だが、プロジェクト固有の検証（Unity C#プロジェクト構造、TypeScriptビルド、Web Tester起動確認等）は手動で行う必要がある
- セットアップ直後の環境確認に時間がかかり、エラー発見が遅れる可能性がある
- プロジェクト固有のワークフロー（例: Unityパッケージの検証、エンジンとWeb Testerのビルド順序確認）を自動化することで、開発効率が向上する

## Focus Area

- `scripts/` ディレクトリ（新規作成または既存を拡張）
- プロジェクトルートの検証スクリプト（例: `scripts/narrgen-doctor.js`）
- Unity C#プロジェクト構造の検証
- TypeScript/JavaScriptビルド環境の検証
- Web Tester起動可能性の検証

## Forbidden Area

- shared-workflowsのスクリプトを直接変更（プロジェクト側で拡張する）
- 破壊的な変更（既存のビルドプロセスを変更しない）
- 外部依存の追加（既存のnpm/node環境のみを使用）

## Constraints

- Node.js環境での実行を前提とする
- PowerShell/Windows環境を優先するが、クロスプラットフォーム対応を考慮する
- 既存の`package.json`のスクリプトと整合性を保つ

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

## Notes

- shared-workflowsの`sw-doctor.js`を参考にしつつ、プロジェクト固有の検証を追加する
- 将来的にCI/CDパイプラインに組み込むことを想定した設計とする
