# ノードIDリネーム機能 テスト手順書

## 目的
`GuiEditorManager.renameNodeId` 関数の動作を手動で確認し、以下の参照が正しく更新されることを検証する：
- `model.startNode`
- `choices[].target`
- `metadata.nodeOrder`

## テスト環境
- **URL**: http://localhost:5173
- **サンプルモデル**: linear.json, shop-quest.json
- **実施日**: 2025年11月19日

---

## テストケース一覧

### ケース1: 通常ノードのID変更
**目的**: 選択肢ターゲットとして参照されているノードIDの変更

**手順**:
1. Web Tester起動
2. サンプルモデル「linear.json」を読み込み
3. 「モデルを編集」ボタンクリック → GUIエディタ起動
4. ノード「scene1」のID入力欄を「scene1_renamed」に変更
5. 「保存」ボタンクリック
6. JSON保存して内容確認

**期待結果**:
- ノードIDが「scene1」から「scene1_renamed」に変更される
- startノードの選択肢 `choices[0].target` が「scene1_renamed」に更新される
- ステータスメッセージに「(1個のターゲットを更新)」と表示される
- エラーが発生しない

**検証ポイント**:
```json
{
  "nodes": {
    "start": {
      "id": "start",
      "choices": [
        {
          "id": "c1",
          "target": "scene1_renamed"  // ← 更新されているか
        }
      ]
    },
    "scene1_renamed": {  // ← 新ID
      "id": "scene1_renamed"
    }
  }
}
```

---

### ケース2: startNodeのID変更
**目的**: モデルのエントリーポイント（startNode）の変更

**手順**:
1. Web Tester起動
2. サンプルモデル「linear.json」を読み込み
3. 「モデルを編集」ボタンクリック
4. ノード「start」のID入力欄を「begin」に変更
5. 「保存」ボタンクリック
6. JSON保存して内容確認

**期待結果**:
- ノードIDが「start」から「begin」に変更される
- `model.startNode` が「begin」に更新される
- ステータスメッセージに成功が表示される
- エラーが発生しない

**検証ポイント**:
```json
{
  "startNode": "begin",  // ← 更新されているか
  "nodes": {
    "begin": {  // ← 新ID
      "id": "begin"
    }
  }
}
```

---

### ケース3: 複数参照を持つノードのID変更
**目的**: 複数の選択肢から参照されているノードIDの変更

**テストモデル**: 以下のJSONを手動作成またはGUIで作成
```json
{
  "startNode": "hub",
  "nodes": {
    "hub": {
      "id": "hub",
      "text": "ハブ",
      "choices": [
        { "id": "c1", "text": "A", "target": "common" },
        { "id": "c2", "text": "B", "target": "other" }
      ]
    },
    "other": {
      "id": "other",
      "text": "別の場所",
      "choices": [
        { "id": "c3", "text": "共通へ", "target": "common" }
      ]
    },
    "common": {
      "id": "common",
      "text": "共通ノード"
    }
  }
}
```

**手順**:
1. 上記JSONをファイルとして保存し、Web Testerで読み込み
2. GUIエディタで「common」を「shared」に変更
3. JSON保存して確認

**期待結果**:
- ノードID「common」が「shared」に変更
- hubの `choices[0].target` が「shared」
- otherの `choices[0].target` が「shared」
- ステータスメッセージに「(2個のターゲットを更新)」と表示
- エラーが発生しない

**検証ポイント**:
```json
{
  "nodes": {
    "hub": {
      "choices": [
        { "id": "c1", "target": "shared" }  // ← 更新
      ]
    },
    "other": {
      "choices": [
        { "id": "c3", "target": "shared" }  // ← 更新
      ]
    },
    "shared": {  // ← 新ID
      "id": "shared"
    }
  }
}
```

---

### ケース4: metadata.nodeOrderの更新
**目的**: ノード順序メタデータの更新確認

**テストモデル**:
```json
{
  "startNode": "first",
  "metadata": {
    "nodeOrder": ["first", "second", "third"]
  },
  "nodes": {
    "first": { "id": "first", "text": "1番目" },
    "second": { "id": "second", "text": "2番目" },
    "third": { "id": "third", "text": "3番目" }
  }
}
```

**手順**:
1. 上記JSONを読み込み
2. GUIエディタで「second」を「middle」に変更
3. JSON保存して確認

**期待結果**:
- ノードID「second」が「middle」に変更
- `metadata.nodeOrder` が `["first", "middle", "third"]` に更新
- エラーが発生しない

**検証ポイント**:
```json
{
  "metadata": {
    "nodeOrder": ["first", "middle", "third"]  // ← 更新
  },
  "nodes": {
    "middle": {  // ← 新ID
      "id": "middle"
    }
  }
}
```

---

### ケース5: エラーハンドリング
**目的**: 不正な入力に対するバリデーション

**テスト項目**:

#### 5-1: 重複ID
**手順**:
1. linear.jsonを読み込み
2. 「scene1」を「start」に変更を試みる

**期待結果**:
- エラーメッセージ「❌ ノードID「start」は既に存在します」
- 変更が適用されない

#### 5-2: 空白を含むID
**手順**:
1. 「scene1」を「scene 1」に変更を試みる

**期待結果**:
- エラーメッセージ「ノードIDに空白を含めることはできません」
- 変更が適用されない

#### 5-3: 空のID
**手順**:
1. 「scene1」を空文字列に変更を試みる

**期待結果**:
- エラーメッセージ「新しいノードIDを入力してください」
- 変更が適用されない

#### 5-4: 同じID
**手順**:
1. 「scene1」を「scene1」に変更を試みる

**期待結果**:
- インフォメッセージ「同じノードIDが指定されています」
- 不要な処理が実行されない

---

## テスト実施記録

### 実施者: _________________
### 実施日時: _________________

| ケース | 結果 | 備考 |
|--------|------|------|
| ケース1: 通常ノード | ☐ Pass ☐ Fail | |
| ケース2: startNode | ☐ Pass ☐ Fail | |
| ケース3: 複数参照 | ☐ Pass ☐ Fail | |
| ケース4: nodeOrder | ☐ Pass ☐ Fail | |
| ケース5-1: 重複ID | ☐ Pass ☐ Fail | |
| ケース5-2: 空白ID | ☐ Pass ☐ Fail | |
| ケース5-3: 空ID | ☐ Pass ☐ Fail | |
| ケース5-4: 同じID | ☐ Pass ☐ Fail | |

### 総合評価
- ☐ すべてのケースPass → 機能OK、本番リリース可能
- ☐ 一部Fail → 修正が必要

### 発見したバグ・問題点
```
（記入欄）




```

### 改善提案
```
（記入欄）




```

---

## 次のステップ

### テスト合格時
1. テスト結果をドキュメント化
2. `OpenSpec-WebTester.md` を「実装済み・テスト完了」に更新
3. 次の機能開発へ

### テスト不合格時
1. バグの詳細を Issue 化
2. 修正実装
3. 再テスト実施

---

**参考資料**:
- 実装コード: `apps/web-tester/src/ui/gui-editor.js` (line 464-542)
- 仕様書: `docs/OpenSpec-WebTester.md`
