# SP-005: Unity SDK

**Status**: done | **Pct**: 70 | **Cat**: system

## 概要

Unity C# SDK (`packages/sdk-unity`)。UPM パッケージとして Unity プロジェクトに導入可能。

## パッケージ情報

- パッケージ名: `com.yushimoji.narrativegen`
- Unity 要件: 2021.3+
- 依存: `com.unity.nuget.newtonsoft-json` (3.2.1)

## コア API

| メソッド | 説明 |
|----------|------|
| `Engine.LoadModel(json)` | JSON 文字列からモデルを読み込み・検証 |
| `Engine.StartSession(model, initialState?)` | 新規セッション作成 |
| `Engine.GetAvailableChoices(session, model)` | 条件を満たす選択肢の取得 |
| `Engine.ApplyChoice(session, model, choiceId)` | 選択肢適用・状態遷移 |
| `Engine.Serialize(session)` / `Engine.Deserialize(payload)` | セッション永続化 |

## ファイル構成

### Runtime (14ファイル)

| ファイル | 役割 |
|----------|------|
| `Engine.cs` | 静的APIファサード |
| `Model.cs` | モデルデータ構造 |
| `Session.cs` | セッション状態 |
| `GameSession.cs` | 高レベルセッション管理 |
| `Entity.cs` | エンティティデータ |
| `Inventory.cs` | インベントリ管理 |
| `InventoryListItemView.cs` | UI 表示コンポーネント |
| `MinimalNarrativeController.cs` | サンプルコントローラー |
| `NarrativeModel.cs` | ScriptableObject ラッパー |
| `Serialization/Converters.cs` | JSON 変換 |

### Editor (3ファイル)

| ファイル | 役割 |
|----------|------|
| `NarrativeModelEditor.cs` | カスタムインスペクタ |
| `NarrativeModelImporter.cs` | アセットインポーター |
| `SamplesMenu.cs` | サンプルメニュー |

## サンプル

- `Samples~/Minimal/`: 最小構成サンプル

## C# テスト

| ファイル | テスト内容 |
|----------|-----------|
| `EngineSmokeTests.cs` | 基本的な Engine API テスト |
| `GameSessionChoicesTests.cs` | 選択肢評価テスト |
| `InventoryTests.cs` | インベントリ操作テスト |

## 未実装・検討事項

- [ ] Unity 上でのテスト実行確認
- [ ] TS エンジンとの機能パリティ検証 (条件/エフェクトの対応状況)
- [ ] NuGet パッケージ配布
