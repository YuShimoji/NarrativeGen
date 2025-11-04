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
- **Model** (`models/schema/playthrough.schema.json`)
  - `modelType`: 固定値 `"adventure-playthrough"`
  - `startNode`: 開始ノード ID（`nodes` 内に必須）
  - `flags`: 初期フラグ。`Record<string, boolean>`
  - `resources`: 初期リソース。`Record<string, number>`
  - `nodes`: ノード定義。キー（ノードID）と `Node` オブジェクトのマップ
- **Node**
  - `id`: ノードID（キーと一致させること）
  - `text`: 表示テキスト（任意）
  - `choices`: `Choice[]`。欠如時は選択肢なしとして扱う
- **Choice**
  - `id`: 選択肢ID（ノード内でユニーク）
  - `text`: 表示文言
  - `target`: 遷移先ノードID（`nodes` 内に必須）
  - `conditions`: フラグ・リソース・時間帯条件の配列
  - `effects`: `setFlag` / `addResource` / `goto` のいずれか
  - `outcome`: `{ type: string; value: string }` 任意メタデータ（UI表示等に利用）

## Validation Pipeline (TypeScript)
- **AJV 検証**: `packages/engine-ts/src/index.ts` の `loadModel()` が JSON Schema で構造を検証。
- **整合性チェック**: 同関数内 `assertModelIntegrity()` が以下を確認。
  - `startNode` が `nodes` に存在すること
  - ノードキーと `node.id` の一致
  - ノード内での選択肢ID重複禁止
  - `choice.target` の存在と必須指定
- **CLI ツール**: `npm run validate:models` が `models/examples/` を一括検証し、最初の選択肢を仮実行してスモークテスト。
- **CI**: `.github/workflows/ci.yml` で `npm run lint -- --max-warnings=0` / `npm run build` / `npm run validate:models` を自動実行。

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
- **[任意モデル読込 (Web テスター拡張)]**: ✅ 実装完了。`apps/web-tester/` に drag & drop / ファイル選択 UI を追加し、カスタム JSON を `GameSession` に反映。`loadModel()` の例外を UI 表示して即フィードバック。
- **[Unity JSON ローダー]**: ✅ 実装完了。`packages/sdk-unity/Runtime/MinimalNarrativeController.cs` に `NarrativeModelJson` TextAsset フィールドを追加。未設定時はビルトインサンプルを使用。
- **[ライター専用ツール]**: ✅ 実装完了。Web Tester にノード/選択肢 GUI エディタを実装。ノード追加・プレビュー・保存機能を追加。AI 補助は次フェーズ。
- **[CI テスト]** `dotnet test` と `npm run build` を CI パイプラインに統合し、サンプル JSON の整合性と Web テスターのビルドを自動検証。

## Unity Integration
- UPM パッケージ `com.NarrativeGen`
- 依存: `com.unity.nuget.newtonsoft-json`
- Runtime のみ（最小）。Editor/Tests は段階的に追加。

## AI Features

AI アシスト機能（次の物語展開生成・言い換え）の設計については、`docs/ai-features.md` を参照してください。

### 設計方針

- **エンジン本体は AI 非依存**: コア実行ロジックは決定論的に動作
- **AI 機能はツール層**: Web Tester や専用エディタツールが AI API を呼び、結果を JSON モデルに反映
- **段階的導入**: モック → ローカルLLM → クラウドAPI の順で展開

### 実装状況

- ✅ **Phase 1**: モック実装（Web Tester の AI提案ボタンでランダムサンプル）
- ✅ **Phase 2**: プロンプト設計 + OpenAI API 統合
  - `packages/engine-ts/src/ai-provider.ts` に OpenAIProvider 実装
  - Web Tester AI タブで API キー設定可能
  - 次のノード生成と言い換え機能が動作
  - エラーハンドリングとフォールバック実装済み
- ⏳ **Phase 3**: ローカル LLM 統合（Ollama など）
- ⏳ **Phase 4**: バッチ処理・履歴管理

## Future Work
- 変数・条件分岐、タグ、メタデータ
- セーブ/ロード、診断ログ
- NUnitベースのランタイムテスト
