# SP-007: Web Tester

**Status**: done | **Pct**: 100 | **Cat**: ui

## 概要

ブラウザベースのモデルプレイスルーテスター。モデルJSONを読み込み、選択肢を選んで物語を進行できるデバッグ・検証ツール。

## 構成

```
apps/web-tester/
  index.html    # スタンドアロンHTML (外部依存なし)
```

## 起動方法

プロジェクトルートで HTTP サーバーを起動:

```bash
npx http-server . -p 8090 -c-1
# → http://localhost:8090/apps/web-tester/index.html
```

## 機能

| 機能 | 説明 |
|------|------|
| モデル読み込み | ドラッグ&ドロップ / ファイル選択 / 例モデルボタン |
| ノード表示 | 現在ノードID + テキスト表示 |
| 選択肢表示 | 条件を満たす選択肢のみボタン表示 (ID + target 付き) |
| 状態パネル | flags / resources / variables のリアルタイム表示 |
| 履歴 | 通過ノードの逆順リスト (ステップ番号 + 選択肢ID) |
| リスタート | 同じモデルで最初から再開 |

## 技術仕様

- `browser.js` (engine-ts dist) を ES module import で使用
- Schema validation なし (browser.ts に準拠)
- 最低限のバリデーション: `startNode` と `nodes` の存在チェック
- 例モデルは `models/examples/` から fetch

## エンジン API 使用

```javascript
import { startSession, getAvailableChoices, applyChoice } from '../../packages/engine-ts/dist/browser.js';
```

| API | 用途 |
|-----|------|
| `startSession(model)` | セッション初期化 |
| `getAvailableChoices(session, model)` | 条件付き選択肢フィルタ |
| `applyChoice(session, model, choiceId)` | 選択適用 + 状態遷移 |
