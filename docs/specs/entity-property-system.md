# SP-PROP-001: Entity-Property System

**Status**: partial | **Pct**: 85 | **Cat**: core

## 概要

現行のフラット EntityDef (`id, name, description, cost`) を、プロパティ階層・継承・範囲定義を持つ構造に拡張する。原初ビジョン (ORIGINAL_DESIGN_PHILOSOPHY.md) の「Entity-Property 駆動ナラティブエンジン」の基盤。

## 背景

### 原初ビジョンとの乖離 (2026-03-17 発見)

レガシードキュメント分析により、現行実装と原初ビジョンの間に以下の構造的ギャップが特定された:

| 領域 | 原初ビジョン | 現行 |
|------|------------|------|
| Entity | 3層継承 + プロパティ解決 | フラット (id/name/description/cost) |
| テキスト | `[ENTITY]` 構文 + 動的展開 | 静的テキスト + 変数展開 |
| 推論 | プロパティ比較 + 違和感検出 | 選択肢到達可能性 (forward/backward chaining) |
| 言い換え | プロパティマッチング + 使用履歴 | 同義語辞書 + 文体変換 |

本仕様は最初の基盤層 (Entity-Property) を対象とする。

## データモデル

### PropertyDef

```typescript
interface PropertyDef {
  key: string
  type: 'string' | 'number' | 'boolean'
  defaultValue?: string | number | boolean
  rangeMin?: number        // number型の場合の下限
  rangeMax?: number        // number型の場合の上限
  labels?: string[]        // メタ属性 (例: ['physical', 'visual'])
}
```

### EntityDef 拡張

```typescript
interface EntityDef {
  id: string
  name: string
  description?: string
  cost?: number
  parentEntity?: string                    // 継承元EntityのID
  properties?: Record<string, PropertyDef> // プロパティ定義マップ
}
```

### 後方互換性

- `parentEntity` と `properties` は全てオプション
- 既存のフラット EntityDef はそのまま有効
- hasItem / addItem / removeItem の動作は変更なし
- 既存の 9 サンプルモデルは修正なしで検証合格

## 継承ルール

### 3層構造の例

```
物理オブジェクト (base)
  ├─ 食品 (food)
  │   ├─ チーズバーガー (cheeseburger)
  │   └─ りんご (apple)
  └─ 道具 (tool)
      └─ 懐中電灯 (flashlight)
```

### プロパティ解決

1. 子エンティティのプロパティを最優先
2. 未定義なら parentEntity を辿る
3. 循環参照はガード (visited Set)
4. 全階層を辿っても見つからなければ undefined

```typescript
resolveProperty(entityId, propertyKey, entities): PropertyDef | undefined
getEntityProperties(entityId, entities): Record<string, PropertyDef>
```

## 実装計画

### Phase 1: データモデル + 解決エンジン (engine-ts)
- `entities.ts` に PropertyDef / EntityDef 拡張 + resolveProperty / getEntityProperties
- `types.ts` の EntityDef を統合
- playthrough.schema.json にオプションフィールド追加

### Phase 2: テスト + テストモデル
- PropertyDef 解決のユニットテスト (継承チェーン, 循環参照ガード, 上書き)
- プロパティ付きサンプルモデル

### Phase 3: Web Tester UI
- Entity パネルにプロパティ編集 UI
- 継承元選択ドロップダウン
- 解決済みプロパティ表示 (継承元を色分け)

### Phase 4: 推論エンジン連携
- プロパティ値による条件評価
- 範囲チェック (rangeMin/rangeMax)

## 関連する将来仕様

本仕様の完了後に着手可能になる機能:

| 仕様候補 | 依存 | 概要 |
|----------|------|------|
| SP-TEXT-001 | 本仕様 | 動的テキスト構文エンジン (`[ENTITY.property]` 展開) |
| SP-INFER-002 | 本仕様 | プロパティ比較推論 + 違和感検出 |
| SP-PARA-002 | 本仕様 | プロパティマッチング言い換え辞書 |
| SP-KNOW-001 | SP-INFER-002 | キャラクター知識モデル |

## 受け入れ条件

1. 既存の 9+1 モデルが修正なしで検証合格
2. `resolveProperty` が 3 層継承チェーンで正しく解決する
3. 循環参照でエラーではなく undefined を返す
4. `getEntityProperties` が親→子の順で merge する
5. PropertyDef のスキーマが JSON Schema バリデーションを通過する
