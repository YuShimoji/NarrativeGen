# NarrativeGen リファレンス（Draft v1.1）

このページは、今後の仕様／GUIマッピングを一元管理する「SSOT（Single Source of Truth）」です。実装と同時に更新します。

## 1. モデル仕様 v1.1（提案）
- 目的: 「選択肢ノード」と「テキスト送りノード（パッセージ）」を明確に分離し、JSONを直感的に。
- 互換性: `nodeType` が無い既存データは自動推定（`choices` があれば `choice`、`next` があれば `passage`）。

```json
{
  "modelType": "adventure-playthrough",
  "startNode": "start",
  "nodes": {
    "start": {
      "id": "start",
      "nodeType": "choice",
      "text": "You wake up.",
      "choices": [
        { "id": "c1", "text": "Get up", "target": "scene1" },
        { "id": "c2", "text": "Wake up", "target": "scene1" }
      ]
    },
    "scene1": {
      "id": "scene1",
      "nodeType": "passage",
      "text": "You see the door.",
      "next": "end",
      "onEnter": [ { "type": "setVariable", "key": "mood", "value": "calm" } ]
    },
    "end": { "id": "end", "nodeType": "passage", "text": "The end." }
  }
}
```

- 追加フィールド（提案）
  - `nodeType`: `"passage" | "choice"`（省略可／後方互換）
  - `next`: `string`（`passage` 用・省略可）
  - `onEnter`: `Effect[]`（ノード入場時の自動効果）
  - `tags`: `string[]`、`meta`: `Record<string, any>`（将来拡張）

## 2. GUI ↔ JSON マッピング（コマンド設計）
- コマンドはすべて JSON 差分に直結。将来機能追加に耐える拡張方式。
- 代表コマンド（例）
  - ノード追加（Passage/Choice 選択）→ `nodes[id]` 追加 + `nodeType` 設定
  - ノードタイプ変換（Choice⇄Passage）→ `choices` ⇄ `next` の安全変換
  - 次ノード設定（Passage）→ `next` 変更
  - 選択肢追加/削除（Choice）→ `choices[]` の編集
  - 条件/効果の追加・編集 → `conditions[]`/`effects[]` 差分
  - onEnter の追加 → `onEnter[]` 追加
  - タグ/メタ編集 → `tags`/`meta` 変更
- UI 実装（案）
  - コマンドパレット（Ctrl+K）で全コマンド検索実行
  - 右側 Inspector でプロパティ編集（型安全に）

## 3. 言い換え（非AI）
- 目的: デザイナーが文脈に応じたバリアントを即時取得し選択。
- 実装: `paraphraseJa(text, { variantCount, style, seed })`（決定的）
- 既知仕様
  - 同義語辞書のキーと完全一致で置換。英語/日本語の小規模辞書を同梱。
  - `style: 'desu-masu'|'da-dearu'|'plain'`（英語は通常 `plain`）
- UI: 「言い換え」→ モーダルに複数候補 → クリックで適用。
- TODO（提案）
  - 英語のケース/末尾句読点をゆるくマッチ、辞書拡充オプション読込。

## 4. ストーリー画面のサイドバー切替
- 機能: 左側の「選択肢と状態」を一時的に隠し、本文を広く表示。
- 実装: `#toggleSidebarBtn` → `#storyContent.sidebar-hidden` を切替。
- 改善案: ラベルを「サイドバー表示/非表示」、`title` に説明、状態同期。

## 5. 編集 UI v2 レイアウト（提案）
- 左: ツリーペイン（ノード一覧、検索/フィルタ、タグ）
- 右: エディタ（タブ: Text / Choices / Conditions & Effects / Meta）
- 下: プレビュー（小説ビュー）。
- タブ内に全て収め、スクロールは本文エリアに限定。

## 6. 受け入れ基準（抜粋）
- 既存 JSON は読み込める（後方互換）。
- GUI 操作はすべて JSON 差分として説明可能（本書に記述）。
- 言い換えは少なくとも 2 以上の候補が出ること（対応辞書内で）。
- サイドバー切替の意味が UI 上で自己説明的になること。
