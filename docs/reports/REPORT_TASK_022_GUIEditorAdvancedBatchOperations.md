# REPORT: TASK_022 GUI Editor Advanced Batch Operations

**Date**: 2026-01-16  
**Status**: COMPLETED  
**Tier**: 2

## 概要

GUIエディタのバッチ操作機能を大幅に強化し、正規表現のキャプチャグループ対応、大文字小文字区別オプション、マッチハイライト付きプレビュー、高度なフィルタリング、操作履歴管理（Undo/Redo、エクスポート/インポート）を実装した。

## 現状

### 実装完了項目

1. **正規表現の拡張**
   - キャプチャグループ対応（`$1`, `$2` などで置換テキスト内で参照可能）
   - 大文字小文字区別オプション（デフォルトは区別なし）
   - 正規表現エラーの適切なハンドリングとユーザーフィードバック

2. **プレビューUI強化**
   - マッチ箇所のハイライト表示（黄色背景）
   - Diff形式の変更前/変更後表示
   - ノードタイプバッジ表示
   - フィルタ適用状況の表示
   - キャプチャグループ使用時のヒント表示

3. **高度なフィルタリング**
   - ノードタイプ別フィルタ（開始/通常/選択肢/終了）
   - 条件有無フィルタ
   - AND/OR論理モード切替
   - フィルタリセット機能
   - 折りたたみ可能なフィルタパネル

4. **操作履歴管理**
   - Undo/Redo機能（最大50件の履歴保持）
   - LocalStorageへの履歴永続化
   - JSON形式での履歴エクスポート/インポート
   - 履歴クリア機能
   - 履歴カウント表示

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `apps/web-tester/src/ui/batch-editor.js` | 全機能の実装（約1000行→約1000行、リファクタリング含む） |
| `apps/web-tester/src/ui/gui-editor.js` | getBatchEditManager拡張 |
| `apps/web-tester/index.html` | バッチ編集モーダルUI拡張 |
| `apps/web-tester/src/styles/gui-editor.css` | Diff表示、ハイライト、履歴ボタンのスタイル追加 |

### 技術詳細

#### 正規表現処理
```javascript
// Case sensitivity toggle
_buildRegexFlags(isCaseSensitive) {
  return isCaseSensitive ? 'g' : 'gi'
}

// Capture groups are naturally supported by JavaScript's String.replace()
const replacedText = text.replace(regex, replaceValue)
// replaceValue can contain $1, $2, etc.
```

#### フィルタリング
```javascript
// Node type detection
_getNodeType(nodeId, node) {
  if (nodeId === this.appState.model.startNode) return 'start'
  if (node.type === 'ending' || !node.choices?.length) return 'end'
  if (node.choices?.length > 1) return 'choice'
  return 'passage'
}

// Filter matching with AND/OR logic
_matchesFilter(nodeId, node) {
  const checks = []
  // ... collect filter checks
  return this.filterSettings.logicMode === 'AND'
    ? checks.every(c => c)
    : checks.some(c => c)
}
```

#### 履歴管理
```javascript
// History structure
{
  type: 'textReplace',
  searchValue,
  replaceValue,
  isRegex,
  isCaseSensitive,
  changes: [{ nodeId, originalText, newText }],
  filterSettings,
  timestamp
}
```

## パフォーマンス

- ビルド成功確認済み
- 開発サーバー起動確認済み
- 大規模モデル（500+ノード）でのプレビュー表示は最大20件に制限して応答性を確保

## 次のアクション

1. ユーザーによる実際の使用テストとフィードバック収集
2. 選択肢テキスト置換、ターゲット変更タブへの同様の拡張（必要に応じて）
3. TASK_022のステータスをCOMPLETEDに更新

## リスク/懸念

- 履歴がLocalStorageに保存されるため、ストレージ容量制限に注意（MAX_HISTORY_SIZE=50で制御）
- 非常に大きなテキスト置換の場合、履歴データが肥大化する可能性

## Backlog（将来提案）

- バッチ操作のプリセット保存機能
- 正規表現パターンのライブラリ/テンプレート
- 選択肢テキスト・ターゲット変更への同様の拡張
