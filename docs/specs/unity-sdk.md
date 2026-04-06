# SP-005: Unity SDK

**Status**: partial | **Pct**: 90 | **Cat**: system

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
| `Engine.Serialize(session)` / `Engine.Deserialize(json)` | `Runtime.Session` の JSON 永続化（`SessionSnapshot`） |

## ファイル構成

### Runtime (16ファイル)

| ファイル | 役割 |
|----------|------|
| `Engine.cs` | 静的APIファサード (InferenceRegistry自動初期化、`Serialize`/`Deserialize`) |
| `InferenceRegistry.cs` | プラグインレジストリ + 組み込みEvaluator/Applicator (条件8種/エフェクト7種) |
| `Model.cs` | モデルデータ構造 (Condition/Effect サブクラス定義含む) |
| `Session.cs` | セッション状態 (Flags, Resources, Variables, Inventory, Time) |
| `GameSession.cs` | 高レベルセッション管理 (Entity解決 + Outcome処理) |
| `Entity.cs` | エンティティデータ |
| `Inventory.cs` | インベントリユーティリティ |
| `InventoryListItemView.cs` | UI 表示コンポーネント |
| `MinimalNarrativeController.cs` | サンプルコントローラー |
| `NarrativeModel.cs` | ScriptableObject ラッパー |
| `Serialization/Converters.cs` | JSON 変換 (Condition 8型 / Effect 7型) |
| `Serialization/SessionSnapshot.cs` | `Runtime.Session` の JSON スナップショット（`Engine.Serialize` / `Deserialize`） |

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

## TS パリティ状況

| 機能 | TS | C# | 状態 |
|------|----|----|------|
| 条件: flag, resource, variable, hasItem, timeWindow | 5種 | 5種 | 完了 |
| 条件: and, or, not | 3種 | 3種 | 完了 |
| エフェクト: setFlag, addResource, setVariable, modifyVariable | 4種 | 4種 | 完了 |
| エフェクト: addItem, removeItem, goto | 3種 | 3種 | 完了 |
| Session.Variables | あり | あり | 完了 |
| Session.Inventory | あり | あり | 完了 |
| Model.entities | あり | あり | 完了 |
| InferenceRegistry パターン | あり | あり | 完了 |
| Serialize / Deserialize (`SessionState` / `Runtime.Session`) | あり (`session-ops` 等) | あり (`Engine.Serialize` / `Deserialize`) | 完了 |

## 未実装・検討事項

- [ ] Unity 上でのテスト実行確認 (.NET 8 testhost; 環境に応じ `dotnet test`)
- [x] ~~TS エンジンとの機能パリティ (条件/エフェクト)~~ → InferenceRegistry 導入で完了
- [x] ~~Serialize / Deserialize (`Runtime.Session`)~~ → `SessionSnapshot` + `Engine` API（2026-04）
- [ ] SP-TGEN 相当のランタイム文章合成（`expandTemplate` / `[entity~]` / 会話テンプレート等）の C# 移植
- [ ] NuGet パッケージ配布
