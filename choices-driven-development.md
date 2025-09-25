# Choices-Driven Development

このプロジェクトでは、意思決定を小さな分岐（Choice）として明文化し、履歴として残します。各Choiceは、動機（Why）、選択肢（Options）、決定（Decision）、影響（Impact）、次のアクション（Next）で構成します。

## Template
- Title: <短い決定名>
- Context: <背景と前提>
- Options:
  - O1: <選択肢1>
  - O2: <選択肢2>
  - O3: <選択肢3>
- Decision: <採用した選択肢と理由>
- Impact: <設計/運用/コストへの影響>
- Next: <次の具体アクション>
- Date: <YYYY-MM-DD>

## Log

### 2025-09-24 Rebuild From Scratch

- Context: 既存Unityプロジェクトが破損かつ仕様乖離のため、ゼロから再構築。
- Options:
  - O1: 既存資産の部分流用（修復）
  - O2: スキーマとUPMパッケージの最小コアから再実装
  - O3: 別エンジンへ全面移行
- Decision: O2 を採用。まずスキーマ/サンプル/UPM最小コアを整備し、小さく正しく動く基盤を構築。
- Impact: 早期に検証可能な形を得られ、将来の拡張とUnity統合が容易。
- Next:
  - JSONスキーマとサンプル作成
  - UPMパッケージ（Runtime/asmdef/依存）作成
  - README/アーキテクチャ文書整備

### 2025-09-25 Post-Reclone Verification & Baseline Run

- Context: リポジトリを再クローン後、最小コアがビルド・実行できることを確認して基盤の健全性を担保。
- Options:
  - O1: すぐに機能追加（条件分岐・変数・タグ等）に着手
  - O2: まず現状のビルド/実行/ドキュメント/無視設定を正し、グリーン状態を確立
  - O3: TypeScriptエンジンへ主軸移行しC#を後追い
- Decision: O2 を採用。YAGNI/KISSに基づき、現時点ではグリーンを最優先。機能追加は次ステップ。
- Impact: 開発者がクローン直後に JSON 検証 → .NET ビルド → CLI 実行まで一気通貫で確認可能。CI導入時の土台にもなる。
- Actions:
  - `packages/tests/NarrativeGen.Tests/` を追加（NUnit）
  - `EngineSmokeTests` にて `models/examples/linear.json` をロードし `start -> scene1 -> end` を検証
  - README に "Run tests (C#)" 手順を追記

- Next:
  - 条件分岐/フラグ/リソース/時間窓の各ユースケースを少しずつユニットテストで拡充
  - 将来的に GitHub Actions 等で自動実行（.NET/Node の両検証）

- Date: 2025-09-25
