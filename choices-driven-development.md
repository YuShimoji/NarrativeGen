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
  - JSON整合性検証（schema/examples 全て ConvertFrom-Json で OK）
  - .NET SDK ランタイム（Unity SDK）を Release ビルド（警告のみ、エラーなし）
  - CLI サンプル実行（linear.json 経路で start → scene1 → end を確認）
  - .gitignore を整備（[Bb]uild/ を追加、余計なインデントを除去、packages/sdk-unity/src/ を ignore）
  - packages/sdk-unity/src/ 配下は未使用のスタブ/空ファイルのため、一旦 ignore 方針（将来必要になれば正式導入）

- Next:
  - TS エンジン（packages/engine-ts/）の雛形整備とモデル検証ツールの有効化（必要最小限）
  - C# ランタイムの NUnit テスト雛形追加（Engine/Model/Session の単体テスト）
  - CLI に引数指定（モデルパス）と簡易検証モードフラグを追加（将来のCI前提）

- Date: 2025-09-25

### 2025-10-14 Unity SDK Documentation Pass

- Context: Unity SDK Runtime に公開 API ドキュメントが不足しており、ビルド時に多数の CS1591 警告が発生していた。
- Options:
  - O1: 警告を黙認し、機能拡張を優先する
  - O2: Runtime 各クラスに XML ドキュメントコメントを付与し、API の意図を明確にする
  - O3: 警告抑制ディレクティブでビルドを静かにする
- Decision: O2 を採用。将来の拡張時に参照しやすいよう API 仕様を明文化。
- Impact: `Model`/`Session`/`Entity`/`GameSession`/`Serialization.Converters` へのコメント追加で CS1591 警告を大幅に削減。残課題として `Engine` 系や Null 許容警告 (CS8765/CS8604) を別タスクで解消予定。
- Next:
  - `packages/sdk-unity/Runtime/Engine.cs` にドキュメントコメントを追加
  - Null 許容警告に対する引数バリデーションや注釈の整備
  - CI で警告ゼロを維持する検証を追加
- Date: 2025-10-14
