# SP-008: Entity / Inventory System

**Status**: done | **Pct**: 100 | **Cat**: core

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

## Web Tester Entity 定義管理 UI (実装済み)

GUI モデル編集画面にエンティティ定義パネルを搭載。

### 配置
- `.gui-edit-content` 内の左カラム先頭 (ノードリストの上)
- 折りたたみ可能 (デフォルト閉じ)

### 操作
- テーブル形式: ID / 名前 / 説明 / コスト
- インライン編集: フィールドを直接クリックして編集 (change イベントで反映)
- 追加: 「+ エンティティ追加」ボタン (一意 ID 自動生成)
- 削除: 行末の x ボタン
- ID 変更: 重複チェック付き rename (旧キー削除 → 新キー追加)

### データフロー
- `model.entities` を直接編集 (`setModel()` 経由)
- 保存: SaveManager (auto-save) / JSON ダウンロード (`buildExportModel` スプレッド) で自動包含
- draft: `ng_model_draft` (localStorage) で永続化

## 完了・検討済み事項

- [x] `playthrough.schema.json` に entities フィールドのスキーマ追加
- [x] condition-effect-editor に hasItem/addItem/removeItem UI 追加
- [x] web-tester に entity 定義エディタ追加
- [x] C# SDK の条件/エフェクト統合 → InferenceRegistry 導入で完了
- CSV 入力 (`Entities.csv`) は別経路として残存。model.entities (JSON) が正典
