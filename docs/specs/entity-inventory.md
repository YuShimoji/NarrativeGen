# SP-008: Entity / Inventory System

**Status**: partial | **Pct**: 85 | **Cat**: core

## 概要

ゲーム内アイテム（エンティティ）の定義とインベントリ管理。エンジンコア (SessionState, 条件/エフェクト) に統合済み。

## Entity

| フィールド | 型 | 説明 |
|-----------|---|------|
| `id` | `string` | 一意識別子 |
| `name` | `string` | 表示名 |
| `description` | `string` | 説明文 |
| `cost` | `number` | リソースコスト |

## エンジン統合 (実装済み)

### Model に entities フィールド

```typescript
interface Model {
  // ... 既存フィールド
  entities?: Record<string, EntityDef>  // エンティティ定義マップ
}
```

### SessionState に inventory

```typescript
interface SessionState {
  // ... 既存フィールド
  inventory: string[]  // 所持アイテムIDの配列 (ユニーク所持)
}
```

`startSession()` で `inventory: []` に初期化される。

### 条件タイプ

| type | フィールド | 評価ロジック |
|------|-----------|-------------|
| `hasItem` | `key: string, value: boolean` | `inventory.includes(key) === value` (case-insensitive) |

### エフェクトタイプ

| type | フィールド | 適用ロジック |
|------|-----------|-------------|
| `addItem` | `key: string` | inventory に追加 (重複無視) |
| `removeItem` | `key: string` | inventory から削除 |

### Inference Registry

hasItem (ConditionEvaluator), addItem / removeItem (EffectApplicator) が registry に登録済み。

## ユーティリティ API

### CSV パーサー (`entities.ts`)

```typescript
parseEntitiesCsv(csv: string): Entity[]        // CSV文字列からパース
loadEntitiesFromFile(filePath: string): Entity[] // ファイルから読み込み (Node.js only)
```

CSV形式: ヘッダ行必須 (`id,name,description,cost`)、引用符付きフィールド対応。

### Inventory クラス (`inventory.ts`)

```typescript
class Inventory {
  constructor(options?: { entities?: Entity[], initialItems?: string[] })
  add(id: string): Entity | null      // 追加 (重複は無視、存在しないIDはnull)
  remove(id: string): Entity | null   // 削除
  has(id: string): boolean             // 所持判定
  list(): Entity[]                     // 全アイテム取得 (挿入順)
  clear(): void                        // 全削除
  toJSON(): string[]                   // ID配列としてシリアライズ
}
```

ID比較は case-insensitive (`normalizeId` で trim + toLowerCase)。

### C# API (Unity SDK)

`Entity.cs` / `Inventory.cs` / `InferenceRegistry.cs` で同等の API を提供。

- `Session.cs`: Variables / Inventory 統合済み
- `NarrativeModel`: Entities フィールド追加済み
- `InferenceRegistry`: hasItem条件、addItem/removeItemエフェクト登録済み
- `brand` → `name` リネーム済み

## テスト

| ファイル | テスト数 | 内容 |
|----------|---------|------|
| `entities.spec.ts` | 1 | CSV パース (マルチバイト文字対応) |
| `inventory.spec.ts` | 5 | add/remove/has/list/toJSON |
| `inference.test.ts` | 2 | hasItem/addItem/removeItem の registry 登録確認 |

## 未実装・検討事項

- [x] ~~`playthrough.schema.json` に entities フィールドのスキーマ追加~~ → entities/inventory/hasItem/addItem/removeItem 追加済み
- [x] ~~condition-effect-editor に hasItem/addItem/removeItem UI 追加~~ → ドロップダウン選択 + パース/ビルド対応
- [ ] web-tester に entity 定義エディタ追加 (モデル内 entities マップの GUI 編集)
- [ ] CSV入力は維持するか、JSON定義のみにするか
- [x] ~~C# SDK の条件/エフェクト統合~~ → InferenceRegistry 導入で完了
