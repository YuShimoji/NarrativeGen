# Architecture

## Goals
- 単純で安全に拡張可能なナラティブ再生エンジン
- Unityとの疎結合統合（UPMパッケージ）
- モデルはJSONスキーマで規定し、例を提供

## Design Principles
- SoC（関心の分離）: モデル（データ）/ セッション（状態）/ エンジン（ロジック）
- SRP: 各クラスは単一責任
- DRY/KISS/YAGNI を徹底
- 名前空間: `NarrativeGen`

## Data Model (Schema)
- Model
  - id: string
  - title: string
  - start: node id
  - nodes: Node[]
- Node
  - id: string
  - text: string
  - choices?: Choice[]
- Choice
  - id: string
  - text: string
  - next: node id

## Engine API (C#)
- `LoadModel(string json): NarrativeModel`
- `StartSession(NarrativeModel model): Session`
- `GetAvailableChoices(Session session, NarrativeModel model): IReadOnlyList<Choice>`
- `ApplyChoice(Session session, NarrativeModel model, string choiceId): Session`

## Sample Verification Flow
- `models/examples/` 配下の JSON を対象に、`packages/tests/NarrativeGen.Tests/EngineSmokeTests.cs` で統合テストを実行する。
  - `dotnet test packages/tests/NarrativeGen.Tests/NarrativeGen.Tests.csproj`
- ブラウザでの確認には `apps/web-tester/` を利用し、サンプルをドロップダウンで選択して実行する。
  - `npm install`（初回のみ）
  - `npm run build` または `npm run dev`

## Current Workflow Overview
- **[コンテンツ編集]** ライター/デザイナーは `models/examples/` を複製し、JSON でノード・選択肢・アウトカムを記述。
- **[エンジン検証]** C# では `Engine.LoadModel()` → `Engine.StartSession()` → `Engine.ApplyChoice()` を NUnit テスト（`packages/tests/NarrativeGen.Tests/`）で実行し、分岐や条件を自動確認。
- **[ブラウザ試験]** `apps/web-tester/` を静的にホストし、ドロップダウンでサンプルモデルを選択して手動プレイを確認。
- **[Unity プレビュー]** `packages/sdk-unity/Runtime/MinimalNarrativeController.cs` を Unity シーンに追加し、`EntitiesCsv` / `InventoryListRoot` 等を設定して実行。

## Known Gaps / Next Steps
- **[任意モデル読込]** Web テスターはまだ drag & drop / ファイル選択に未対応。`FileReader` を用いてカスタム JSON を読み込み、`GameSession` に反映する UI が必要。
- **[Unity JSON ローダー]** `MinimalNarrativeController` は固定サンプル `CreateSampleModel()` を利用している。`TextAsset` or ファイル選択で JSON をロードする仕組みを追加し、エディタで差し替え可能にする。
- **[ライター専用ツール]** choices-driven-development.md で整理した GUI エディタ（選択肢追加・アウトカム設定・AI 補助保存）を Web テスター拡張として段階的に実装する。
- **[CI テスト]** `dotnet test` と `npm run build` を CI パイプラインに統合し、サンプル JSON の整合性と Web テスターのビルドを自動検証。

## Unity Integration
- UPM パッケージ `com.NarrativeGen`
- 依存: `com.unity.nuget.newtonsoft-json`
- Runtime のみ（最小）。Editor/Tests は段階的に追加。

## Future Work
- 変数・条件分岐、タグ、メタデータ
- セーブ/ロード、診断ログ
- NUnitベースのランタイムテスト
