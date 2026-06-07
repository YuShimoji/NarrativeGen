# SP-UNITY-001: Unity SDK

**Status**: done | **Pct**: 100 | **Cat**: system

## 概要

Unity C# SDK (`packages/sdk-unity`)。UPM パッケージとして Unity プロジェクトに導入可能。

## パッケージ情報

- UPM パッケージ名: `com.yushimoji.narrativegen`
- ローカル NuGet PackageId: `NarrativeGen.Unity`
- Unity 要件: 2021.3+
- 依存: `com.unity.nuget.newtonsoft-json` (3.2.1)
- 配布方針: UPM-first。NuGet はローカル `dotnet pack` 検証まで対応し、公開・package ID 確保は人間判断の対象。

## コア API

| メソッド | 説明 |
|----------|------|
| `Engine.LoadModel(json)` | JSON 文字列からモデルを読み込み・検証 |
| `Engine.StartSession(model, initialState?)` | 新規セッション作成 |
| `Engine.GetAvailableChoices(session, model)` | 条件を満たす選択肢の取得 |
| `Engine.ApplyChoice(session, model, choiceId)` | 選択肢適用・状態遷移 |
| `Engine.Serialize(session)` / `Engine.Deserialize(json)` | `Runtime.Session` の JSON 永続化（`SessionSnapshot`） |
| `NarrativeText.ExpandTemplate` / `ExpandTemplateCore` / `ApplyLegacyPlaceholders` / `ExpandTemplateWithTracking` | SP-TGEN: 段階0 + コア + `[entity~]` 追跡 |
| `NarrativeDisplayText.ResolveNarrativeDisplayTextTracked` | 会話テンプレ連結（`ConversationTemplateMatcher`） |
| `Session.Events` / `SessionSnapshot.events` | 動的イベントエンティティと JSON ラウンドトリップ |

## ファイル構成

### Runtime（主要ファイル）

| ファイル | 役割 |
|----------|------|
| `Engine.cs` | 静的APIファサード (InferenceRegistry自動初期化、`Serialize`/`Deserialize`) |
| `NarrativeText.cs` | ノード本文テンプレート展開（レガシー `{flag:…}` / `{?…}` / `[entity]` / `{var}` 等） |
| `InferenceRegistry.cs` | プラグインレジストリ + 組み込みEvaluator/Applicator (条件9種/エフェクト8種) |
| `Model.cs` | モデルデータ構造 (Condition/Effect、`conversationTemplates`) |
| `PropertyDef.cs` | エンティティの `properties` エントリ |
| `ConversationTemplates.cs` | 会話テンプレ + `ConversationTemplateMatcher` |
| `NarrativeDisplayText.cs` | `ResolveNarrativeDisplayTextTracked` |
| `Session.cs` | セッション状態 (Flags, Resources, Variables, Inventory, Time, **Events**) |
| `GameSession.cs` | 高レベルセッション管理 (Entity解決 + Outcome処理) |
| `Entity.cs` | エンティティデータ |
| `Inventory.cs` | インベントリユーティリティ |
| `InventoryListItemView.cs` | UI 表示コンポーネント |
| `MinimalNarrativeController.cs` | サンプルコントローラー |
| `NarrativeModel.cs` | ScriptableObject ラッパー |
| `Serialization/Converters.cs` | JSON 変換 (Condition 9型 / Effect 8型) |
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
| `NarrativeTextTests.cs` | `NarrativeText.ExpandTemplate`（TS `template.spec` 相当の縮約） |
| `HasEventInferenceTests.cs` | `hasEvent` / `createEvent` の Registry・JSON・`Engine` 経路、`createEvent` built-in 登録 |

## SP-TGEN 文章合成 — TS テスト対応（縦スライス1）

| C# API / 挙動 | engine-ts 参照 | C# テスト |
|---------------|----------------|-----------|
| `ApplyLegacyPlaceholders` + `ExpandTemplate`（`{flag:}` / `{nodeId}` / `{time}` / `[id]` / `{resource}` / `{variable}`） | `template.ts` の `applyLegacySessionPlaceholders` + `expandTemplateCore`（entity 基本フィールドのみ） | `NarrativeTextTests.ExpandTemplate_Legacy_NodeId_Time_Entity_And_Curly` |
| `{?condition:text}`（単純フラグ・否定） | `expandTemplateCore` 条件節 | `NarrativeTextTests.ExpandTemplate_Conditional_Flag_ShowsBody` |
| `[entity.name]` / `[entity.description]` / `[entity.cost]` / `[entity.id]` / unknown fallback | `template.spec.ts` の entity field / unknown cases | `NarrativeTextTests.ExpandTemplate_BuiltInEntityFields_And_UnknownsRemain` |
| resource / variable / inventory 条件 | `template.spec.ts` の comparison / truthy / inventory cases | `NarrativeTextTests.ExpandTemplate_Conditional_ResourceVariableAndInventory` |
| event entity property | `template.ts` の session.events fallback | `NarrativeTextTests.ExpandTemplate_EventEntity_Property_ResolvesDirectProperty` |

**スライス2 済**: `session.events`、`[entity~]` / 描写状態、`parentEntity` 継承プロパティ、`findMatchingTemplates` 相当（`ConversationTemplateMatcher`）。

## TS パリティ状況

| 機能 | TS | C# | 状態 |
|------|----|----|------|
| 条件: flag, resource, variable, hasItem, hasEvent, timeWindow | 6種 | 6種 | 完了 |
| 条件: and, or, not | 3種 | 3種 | 完了 |
| エフェクト: setFlag, addResource, setVariable, modifyVariable | 4種 | 4種 | 完了 |
| エフェクト: addItem, removeItem, goto, createEvent | 4種 | 4種 | 完了 |
| Session.Variables | あり | あり | 完了 |
| Session.Inventory | あり | あり | 完了 |
| Model.entities | あり | あり | 完了 |
| InferenceRegistry パターン | あり | あり | 完了 |
| Serialize / Deserialize (`SessionState` / `Runtime.Session`) | あり (`session-ops` 等) | あり (`Engine.Serialize` / `Deserialize`) | 完了 |
| `expandTemplate` / `expandTemplateWithTracking` | `template.ts` | `NarrativeText.cs` | 対応（主要エッジケース回帰追加済み。将来追加時は四半期監査で追随） |
| `resolveNarrativeDisplayTextTracked` | `narrative-display-text.ts`（`findMatchingTemplates` に **usage を渡さない**） | `NarrativeDisplayText.cs`（同様） | **対応**。`maxUses` / `TemplateUsageState` は `ConversationTemplateMatcher.FindMatchingTemplates(..., usageState)` で評価可能。表示解決 API 単体では TS/C# とも **usage を渡さない**（`NarrativeTextTests.ResolveNarrativeDisplayTextTracked_DoesNotPassTemplateUsage_engineTsParity`） |

## 継続運用

- **パリティ監査**: 四半期ごと、または `packages/engine-ts/test/template.spec.ts` に大きな追加があったタイミングで `NarrativeTextTests` を照合し、表「TS パリティ状況」を更新する。
- **エッジケース**: `template.spec.ts` 側に大きな追加があった場合は Issue か本節のチェックリストにチケット化してから C# 側を追加する。
- **スコープ外**: Dynamic Text の **Yarn エクスポート（SP-DTYARN-001）** は Web Tester のみ。Unity ランタイムは `.yarn` を解釈しない。
- **NuGet**: `dotnet pack .\packages\sdk-unity\NarrativeGen.Unity.csproj -c Release` でローカル `.nupkg` を生成できる。公開操作は本仕様の完了条件に含めない。

## 未実装・検討事項

- [x] ~~`dotnet test`~~ → `packages/tests/NarrativeGen.Tests` は **net9.0**（ルート README 参照）
- [x] ~~TS エンジンとの機能パリティ (条件/エフェクト)~~ → InferenceRegistry 導入で完了
- [x] ~~Serialize / Deserialize (`Runtime.Session`)~~ → `SessionSnapshot` + `Engine` API（2026-04）
- [x] SP-TGEN 文章合成スライス2（`session.events`、`[entity~]`、継承プロパティ、会話テンプレマッチ）
- [x] `hasEvent` / `createEvent`（選択肢・`EvaluationContext`・会話テンプレの sessionConditions）→ `EvaluationContext.Events` + `HasEventInferenceTests`（2026-04-08）
- [x] `createEvent` applicator built-in 登録と `Engine.ApplyChoice` 経路（2026-04-30）
- [x] `expandTemplate` 主要エッジケース回帰追加（built-in entity fields、resource/variable/inventory 条件、event property）（2026-04-30）
- [x] NuGet ローカル pack 準備（`NarrativeGen.Unity.csproj` メタデータ + README 手順、公開はスコープ外）（2026-04-30）
