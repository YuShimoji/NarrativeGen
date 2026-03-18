# NarrativeGen Authoring Guide

**対象**: NarrativeGen で物語を作りたい人
**前提**: プログラミング経験不要。Web ブラウザが使えれば OK
**所要時間**: 30-45 分
**対応モデル**: `models/examples/writer_tutorial.json`

---

## 目次

1. [Web Tester を起動する](#1-web-tester-を起動する)
2. [最初のノードと選択肢](#2-最初のノードと選択肢)
3. [フラグで記憶する](#3-フラグで記憶する)
4. [リソースで数値を管理する](#4-リソースで数値を管理する)
5. [変数でテキストを記録する](#5-変数でテキストを記録する)
6. [エンティティで世界を定義する](#6-エンティティで世界を定義する)
7. [アイテムを拾って使う](#7-アイテムを拾って使う)
8. [Dynamic Text で動的な文章を作る](#8-dynamic-text-で動的な文章を作る)
9. [複合条件で複雑な分岐を作る](#9-複合条件で複雑な分岐を作る)
10. [イベントで物語中に事実を生成する](#10-イベントで物語中に事実を生成する)
11. [テンプレートで動的な会話を追加する](#11-テンプレートで動的な会話を追加する)
12. [完成モデルの確認](#12-完成モデルの確認)
13. [エクスポート](#13-エクスポート)
14. [次のステップ](#14-次のステップ)

---

## 1. Web Tester を起動する

```bash
cd NarrativeGen
npm run dev
# → http://localhost:5173/ をブラウザで開く
```

起動すると Web Tester のメイン画面が表示される。

**画面構成:**
- **上部ツールバー**: モデル選択、実行、編集、保存、エクスポート
- **Story タブ**: 物語をプレイする画面
- **NodeGraph タブ**: ノードの繋がりをグラフで確認
- **Reference タブ**: リファレンス情報

**最初にやること:**
1. ツールバーのモデル選択ドロップダウンから `writer_tutorial` を選択
2. 「実行」ボタンをクリック
3. Story タブで物語が始まる

---

## 2. 最初のノードと選択肢

NarrativeGen の物語は **ノード** と **選択肢** で構成される。

### ノード (Node)

ノードは物語の1場面。以下の要素を持つ。

| 要素 | 説明 | 例 |
|------|------|-----|
| `id` | 一意の識別子 | `"apartment"` |
| `text` | 場面の説明文 | `"You wake up to find a letter..."` |
| `choices` | 選択肢の配列 | 下記参照 |

### 選択肢 (Choice)

| 要素 | 説明 | 例 |
|------|------|-----|
| `id` | 選択肢ID | `"pick_up_letter"` |
| `text` | 表示テキスト | `"Pick up the letter"` |
| `target` | 遷移先ノードID | `"examine_letter"` |
| `conditions` | 表示条件 (任意) | 後述 |
| `effects` | 選択時の効果 (任意) | 後述 |

### writer_tutorial.json での例

最初のノード `apartment`:

```json
{
  "id": "apartment",
  "text": "You wake up to find a letter slipped under your apartment door.",
  "choices": [
    {
      "id": "pick_up_letter",
      "text": "Pick up the letter",
      "target": "examine_letter"
    },
    {
      "id": "ignore_letter",
      "text": "Ignore it and go to work",
      "target": "work_regret"
    }
  ]
}
```

**ポイント**: `target` には遷移先のノード `id` を指定する。存在しないIDを指定するとバリデーションエラーになる。

### GUI での操作

1. 「編集」ボタンをクリックして編集モードに入る
2. ノードリストからノードを選択
3. テキスト欄を編集
4. 選択肢の「+」ボタンで新しい選択肢を追加
5. `target` ドロップダウンで遷移先を選択

---

## 3. フラグで記憶する

**フラグ** は true/false の記憶。「この出来事は起きたか?」を記録する。

### 定義

モデルの `flags` で初期値を宣言する:

```json
"flags": {
  "found_letter": false,
  "talked_to_manager": false,
  "examined_envelope": false
}
```

### 設定 (Effect)

選択肢の `effects` でフラグを変更する:

```json
"effects": [
  { "type": "setFlag", "key": "found_letter", "value": true }
]
```

### 条件 (Condition)

フラグの値に応じて選択肢の表示/非表示を制御する:

```json
"conditions": [
  { "type": "flag", "key": "found_letter", "value": true }
]
```

### writer_tutorial.json での例

手紙を拾うと `found_letter` が true になる。以降のノードで「手紙を持っている」前提の選択肢が出現する。

---

## 4. リソースで数値を管理する

**リソース** は数値の記録。手がかりの数、信頼度など。

### 定義

```json
"resources": {
  "clues": 0,
  "trust": 50
}
```

### 増減 (Effect)

```json
{ "type": "addResource", "key": "clues", "delta": 1 }
{ "type": "addResource", "key": "trust", "delta": -20 }
```

`delta` が正なら増加、負なら減少。

### 条件

```json
{ "type": "resource", "key": "clues", "op": ">=", "value": 4 }
```

比較演算子: `>=`, `<=`, `>`, `<`, `==`

### writer_tutorial.json での例

- 丁寧に聞くと `trust +10`、強引に追及すると `trust -20`
- 手がかりが4つ以上たまると Room 404 の書類を読める (`clues >= 4`)

---

## 5. 変数でテキストを記録する

**変数** は文字列や数値を自由に保存する。

### 定義

```json
"variables": {
  "suspect_name": "unknown",
  "letter_content": ""
}
```

### 設定 (Effect)

```json
{ "type": "setVariable", "key": "suspect_name", "value": "Dr. Hayashi" }
```

### 数値演算 (Effect)

```json
{ "type": "modifyVariable", "key": "score", "op": "+", "value": 10 }
```

演算子: `+`, `-`, `*`, `/`

### 条件

```json
{ "type": "variable", "key": "suspect_name", "op": "==", "value": "Dr. Hayashi" }
```

比較演算子: `==`, `!=`, `contains`, `!contains`, `>=`, `<=`, `>`, `<`

### writer_tutorial.json での例

管理人から情報を得ると `suspect_name` が `"Dr. Hayashi"` に変わり、以降のテキストに名前が反映される。

---

## 6. エンティティで世界を定義する

**エンティティ** は物語の中の「もの」や「人」を構造的に定義する。名前、説明、プロパティを持つ。

### 基本定義

```json
"entities": {
  "pen": {
    "id": "pen",
    "name": "Fountain Pen",
    "description": "An antique fountain pen with dark blue ink",
    "cost": 150,
    "properties": {
      "ink_color": { "key": "ink_color", "type": "string", "defaultValue": "dark blue" },
      "brand": { "key": "brand", "type": "string", "defaultValue": "Montblanc" }
    }
  }
}
```

### プロパティの型

| type | 説明 | 例 |
|------|------|-----|
| `"string"` | 文字列 | `"dark blue"` |
| `"number"` | 数値 | `60` (rangeMin/rangeMax で範囲指定可) |
| `"boolean"` | 真偽値 | `true` |

### 継承 (parentEntity)

共通の性質を親エンティティにまとめ、子が継承できる:

```json
"evidence_base": {
  "id": "evidence_base",
  "name": "Evidence",
  "properties": {
    "reliability": { "key": "reliability", "type": "number", "defaultValue": 0 },
    "category": { "key": "category", "type": "string", "defaultValue": "unknown" }
  }
},
"letter": {
  "id": "letter",
  "name": "Mysterious Letter",
  "parentEntity": "evidence_base",
  "properties": {
    "reliability": { "key": "reliability", "type": "number", "defaultValue": 60 },
    "category": { "key": "category", "type": "string", "defaultValue": "document" },
    "ink_color": { "key": "ink_color", "type": "string", "defaultValue": "dark blue" }
  }
}
```

`letter` は `evidence_base` の `reliability` と `category` を継承し、独自の `ink_color` を追加している。
子で同じキーを定義するとオーバーライドされる (reliability: 0 → 60)。

### プロパティ条件

エンティティのプロパティ値を選択肢の条件に使える:

```json
{ "type": "property", "entity": "letter", "key": "reliability", "op": ">=", "value": 50 }
```

### GUI での操作

1. 編集モードで左のエンティティパネルを展開
2. 「Add Entity」でエンティティを追加
3. プロパティを追加・編集
4. `parentEntity` ドロップダウンで継承元を指定

---

## 7. アイテムを拾って使う

**インベントリ** はプレイヤーが所持しているアイテムのリスト。

### 追加/削除 (Effect)

```json
{ "type": "addItem", "key": "letter" }
{ "type": "removeItem", "key": "letter" }
```

`key` はエンティティIDと対応させるのが推奨 (名前やプロパティをテキスト中で参照できる)。

### 所持確認 (Condition)

```json
{ "type": "hasItem", "key": "letter", "value": true }
```

`value: false` で「持っていない」条件にできる。

### writer_tutorial.json での例

- 手紙を拾うと `addItem: letter` → 以降「手紙を見せる」選択肢が出る
- 管理人に手紙を取られると `removeItem: letter`
- Room 404 の鍵は `addItem: room_key` → `hasItem: room_key` で入室可能に

---

## 8. Dynamic Text で動的な文章を作る

ノードの `text` 内で動的な値を参照できる。

### 変数参照 `{name}`

```
"Clues: {clues} | Trust: {trust}"
"Suspect: {suspect_name}"
```

flags, resources, variables のどれでも `{key}` で参照可能。

### エンティティ参照 `[entity_id]` / `[entity_id.property]`

```
"[manager] is behind the front desk"     → "Mr. Tanaka is behind the front desk"
"The ink is [letter.ink_color]"           → "The ink is dark blue"
"A [pen] sits on the desk"               → "A Fountain Pen sits on the desk"
```

- `[entity_id]` → エンティティの `name` を表示
- `[entity_id.property]` → プロパティの値を表示

### 条件付きテキスト `{?condition:text}`

```
"{?found_letter:The letter's words echo in your mind.}"
"{?!found_letter:Something draws you to Room 404.}"
"{?clues>=4:The pieces are falling into place.}"
```

- `{?flag:text}` → フラグが true なら表示
- `{?!flag:text}` → フラグが false なら表示
- `{?resource>=N:text}` → リソース比較
- `{?hasEvent:id:text}` → イベント存在確認

### writer_tutorial.json での例

`manager_office` ノード:
```
"[manager] is behind the front desk, shuffling papers nervously.

{?talked_to_manager:He looks even more nervous seeing you again.}
{?!talked_to_manager:\"Oh, good morning,\" he says, avoiding eye contact.}"
```

初回訪問と再訪問でテキストが変わる。

---

## 9. 複合条件で複雑な分岐を作る

単一の条件だけでなく、複数条件を組み合わせられる。

### AND (全て満たす)

```json
{
  "type": "and",
  "conditions": [
    { "type": "resource", "key": "trust", "op": ">=", "value": 50 },
    { "type": "resource", "key": "clues", "op": ">=", "value": 2 }
  ]
}
```

### OR (いずれか満たす)

```json
{
  "type": "or",
  "conditions": [
    { "type": "flag", "key": "found_letter", "value": true },
    { "type": "hasItem", "key": "room_key", "value": true }
  ]
}
```

### NOT (否定)

```json
{
  "type": "not",
  "condition": { "type": "hasItem", "key": "room_key", "value": true }
}
```

### writer_tutorial.json での例

管理人から詳細を引き出すには、trust >= 50 **かつ** clues >= 2 が必要:

```json
"conditions": [
  { "type": "and", "conditions": [
    { "type": "resource", "key": "trust", "op": ">=", "value": 50 },
    { "type": "resource", "key": "clues", "op": ">=", "value": 2 }
  ]}
]
```

---

## 10. イベントで物語中に事実を生成する

**イベント** は物語の進行中に動的に生成されるエンティティ。「何が起きたか」を構造化して記録する。

### 生成 (Effect)

```json
{
  "type": "createEvent",
  "id": "manager_panicked",
  "name": "Manager's Panic",
  "properties": {
    "location": { "defaultValue": "manager_office" },
    "reaction": { "defaultValue": "grabbed letter" },
    "fear_level": { "defaultValue": 80 }
  }
}
```

### 確認 (Condition)

```json
{ "type": "hasEvent", "key": "manager_panicked", "value": true }
```

### Dynamic Text で参照

```
"{?hasEvent:manager_panicked:His hands are still shaking.}"
```

### writer_tutorial.json での例

管理人が手紙を掴んだとき `manager_panicked` イベントが生成される。
以降のノードで「管理人が動揺した」という事実をテキストに反映できる。

エンティティとの違い:
- **エンティティ**: モデル定義時に存在する静的なもの
- **イベント**: プレイ中の選択によって生成される動的な事実

---

## 11. テンプレートで動的な会話を追加する

**ConversationTemplate** は、条件が揃ったときに自動的に挿入されるテキスト。

### 定義

```json
"conversationTemplates": [
  {
    "id": "tmpl_evidence_mounting",
    "trigger": {
      "sessionConditions": [
        { "type": "resource", "key": "clues", "op": ">=", "value": 3 }
      ]
    },
    "text": "The pieces of the puzzle are coming together. You have {clues} clues.",
    "insertContext": "progress",
    "priority": 2,
    "maxUses": 1
  }
]
```

| 要素 | 説明 |
|------|------|
| `trigger.sessionConditions` | セッション状態に基づく発火条件 |
| `trigger.eventMatch` | イベントのプロパティに基づく発火条件 |
| `text` | 挿入テキスト (Dynamic Text 構文使用可) |
| `insertContext` | テキストの種類 (自由文字列) |
| `priority` | 優先度 (数値が大きいほど優先) |
| `maxUses` | 最大発火回数 |

### eventMatch によるトリガー

イベントのプロパティ値を条件にできる:

```json
"trigger": {
  "eventMatch": {
    "propertyChecks": [
      { "key": "fear_level", "op": ">=", "value": 70 }
    ]
  }
}
```

`fear_level >= 70` のイベントが存在する場合に発火する。

### writer_tutorial.json での例

3つのテンプレートが定義されている:
1. **管理人の不安**: 話しかけた後 + trust < 40 のとき
2. **証拠の蓄積**: clues >= 3 のとき
3. **恐怖への反応**: fear_level >= 70 のイベントが存在するとき

---

## 12. 完成モデルの確認

`writer_tutorial.json` は以下の全機能を使っている:

| 機能 | 使用箇所 |
|------|----------|
| フラグ (flag) | `found_letter`, `talked_to_manager`, `examined_envelope`, `discovered_truth` |
| リソース (resource) | `clues`, `trust` |
| 変数 (variable) | `suspect_name`, `letter_content` |
| エンティティ (entity) | `evidence_base`, `letter`, `pen`, `manager` |
| 継承 (parentEntity) | `letter` → `evidence_base` |
| アイテム (inventory) | `letter`, `room_key`, `pen` |
| Dynamic Text | `{clues}`, `[manager]`, `[pen.ink_color]`, `{?found_letter:...}` |
| 複合条件 (and) | trust >= 50 AND clues >= 2 |
| 否定条件 (not) | NOT hasItem room_key |
| イベント生成 (createEvent) | `manager_panicked`, `showed_mercy`, `truth_discovered` |
| イベント確認 (hasEvent) | `{?hasEvent:manager_panicked:...}` |
| テンプレート | 3件 (sessionConditions + eventMatch) |

### バリデーション

```bash
npm run validate
# → "Validated: writer_tutorial.json" が表示されればOK
```

### プレイ確認

1. Web Tester でモデルを選択して実行
2. 以下のルートを試す:
   - **最短ルート**: 手紙を拾う → 管理人に見せる → 鍵を得る → Room 404
   - **信頼ルート**: 手紙を拾う → 封筒調査 → 丁寧に聞く → 追及 → Room 404
   - **回り道ルート**: 無視 → 翌日拾う → 直接 Room 404 → 鍵なし → 管理人

---

## 13. エクスポート

完成したモデルは複数の形式にエクスポートできる。

| 形式 | 用途 |
|------|------|
| JSON | NarrativeGen / バックアップ |
| CSV | スプレッドシートでの編集 |
| Ink | Inkle のストーリー形式 |
| Twine | Twine のストーリー形式 |
| Yarn | Yarn Spinner (Unity) |

ツールバーの「エクスポート...」から形式を選択してダウンロード。

---

## 14. 次のステップ

このガイドでカバーした機能を使いこなせたら:

### もっと複雑な物語を作る
- ノードグループで階層化する (`node_group` フィールド)
- 推論エンジンで到達可能性を分析する (NodeGraph タブ)
- エンディング分析で全分岐を確認する

### 高度な機能
- **プロパティ異常検出**: エンティティのプロパティ値が期待範囲を超えたときの検出
- **キャラクター知識モデル**: 登場人物ごとの知識プロファイル
- **説明トラッカー**: 同じエンティティを繰り返し説明しないための制御
- **言い換えシステム**: テキストの動的バリエーション

### リファレンス
- `docs/NarrativeGen_Reference_Wiki.md` — 全機能のリファレンス
- `docs/spreadsheet-format.md` — CSV フォーマット仕様
- `docs/specs/` — 各機能の詳細仕様書

---

## 条件・効果 一覧 (クイックリファレンス)

### 条件 (Condition)

| type | 用途 | 例 |
|------|------|-----|
| `flag` | フラグ確認 | `{ "type": "flag", "key": "met_npc", "value": true }` |
| `resource` | リソース比較 | `{ "type": "resource", "key": "gold", "op": ">=", "value": 100 }` |
| `variable` | 変数比較 | `{ "type": "variable", "key": "name", "op": "==", "value": "Alice" }` |
| `hasItem` | アイテム所持 | `{ "type": "hasItem", "key": "sword", "value": true }` |
| `property` | エンティティプロパティ | `{ "type": "property", "entity": "potion", "key": "potency", "op": ">=", "value": 50 }` |
| `hasEvent` | イベント存在 | `{ "type": "hasEvent", "key": "battle_won", "value": true }` |
| `timeWindow` | 時間範囲 | `{ "type": "timeWindow", "start": 5, "end": 10 }` |
| `and` | 全条件を満たす | `{ "type": "and", "conditions": [...] }` |
| `or` | いずれかを満たす | `{ "type": "or", "conditions": [...] }` |
| `not` | 条件の否定 | `{ "type": "not", "condition": {...} }` |

### 効果 (Effect)

| type | 用途 | 例 |
|------|------|-----|
| `setFlag` | フラグ設定 | `{ "type": "setFlag", "key": "met_npc", "value": true }` |
| `addResource` | リソース増減 | `{ "type": "addResource", "key": "gold", "delta": -50 }` |
| `setVariable` | 変数設定 | `{ "type": "setVariable", "key": "location", "value": "forest" }` |
| `modifyVariable` | 変数演算 | `{ "type": "modifyVariable", "key": "score", "op": "+", "value": 10 }` |
| `addItem` | アイテム追加 | `{ "type": "addItem", "key": "sword" }` |
| `removeItem` | アイテム削除 | `{ "type": "removeItem", "key": "sword" }` |
| `goto` | 強制遷移 | `{ "type": "goto", "target": "game_over" }` |
| `createEvent` | イベント生成 | `{ "type": "createEvent", "id": "discovery", "name": "Found Clue", "properties": {...} }` |

### Dynamic Text 構文

| 構文 | 用途 | 例 |
|------|------|-----|
| `{key}` | 変数/フラグ/リソース値 | `{gold}`, `{player_name}` |
| `[entity]` | エンティティ名 | `[sword]` → "Iron Sword" |
| `[entity.prop]` | プロパティ値 | `[sword.damage]` → "25" |
| `{?flag:text}` | フラグが true なら表示 | `{?has_key:You have the key.}` |
| `{?!flag:text}` | フラグが false なら表示 | `{?!has_key:The door is locked.}` |
| `{?res>=N:text}` | リソース比較で表示 | `{?gold>=100:You can afford it.}` |
