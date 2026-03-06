# TASK_105: モデル検証強化 - 実装レポート

**作成日**: 2026-02-06T13:45:00+09:00  
**作成者**: Cascade  
**ブランチ**: feature/model-validation  
**ステータス**: 完了

## 概要

モデル検証機能を強化し、ID重複検出、参照整合性チェック、循環参照検出を実装しました。詳細なエラーメッセージにより、問題箇所を迅速に特定できるようになりました。

## 実装内容

### 1. ID重複検出

#### 実装箇所
- `packages/engine-ts/src/index.ts` の `assertModelIntegrity()` 関数

#### 機能
- **ノードID重複検出**: 異なるノードキーで同じ `node.id` を使用している場合を検出
- **選択肢ID重複検出**: 同一ノード内で重複する `choice.id` を検出
- **許容範囲**: 異なるノード間での同一選択肢IDは許可（意図的な設計）

#### エラーメッセージ例
```
[DUPLICATE_ID] Duplicate node ID 'start' found (node: start)
[DUPLICATE_ID] Duplicate choice ID 'c1' in node 'start' (node: start) (choice: c1)
```

### 2. 参照整合性チェック強化

#### 実装箇所
- `packages/engine-ts/src/index.ts` の `assertModelIntegrity()` 関数

#### 機能
- **startNode検証**: モデルの開始ノードが存在するか確認
- **choice.target検証**: 各選択肢のターゲットノードが存在するか確認
- **goto effect検証**: goto エフェクトのターゲットノードが存在するか確認
- **空ターゲット検出**: ターゲットが空文字列の場合を検出

#### エラーメッセージ例
```
[MISSING_REFERENCE] startNode 'nonexistent' does not exist in nodes (node: nonexistent)
[MISSING_REFERENCE] Choice 'c1' in node 'start' targets non-existent node 'missing' (node: start) (choice: c1)
[MISSING_REFERENCE] Choice 'c1' in node 'start' has goto effect targeting non-existent node 'nonexistent' (node: start) (choice: c1)
```

### 3. 循環参照検出

#### 実装箇所
- `packages/engine-ts/src/index.ts` の `detectCircularReferences()` 関数

#### アルゴリズム
- **深さ優先探索 (DFS)** を使用
- **訪問中ノード追跡**: `visiting` セットで現在探索中のパスを管理
- **訪問済みノード追跡**: `visited` セットで探索済みノードを記録
- **パス記録**: 循環が検出された場合、完全な循環パスを報告

#### 検出パターン
- 単純な循環 (A → B → A)
- 複雑な循環 (A → B → C → B)
- 自己参照 (A → A)
- goto エフェクト経由の循環

#### エラーメッセージ例
```
[CIRCULAR_REFERENCE] Circular reference detected: a → b → a (node: a)
[CIRCULAR_REFERENCE] Circular reference detected: start → start (node: start)
```

### 4. エラーメッセージの改善

#### 構造化エラー情報
```typescript
interface ValidationIssue {
  type: 'error' | 'warning'
  category: 'duplicate_id' | 'missing_reference' | 'circular_reference' | 'integrity'
  message: string
  nodeId?: string
  choiceId?: string
  path?: string[]
}
```

#### 出力形式
- カテゴリ別分類 (`[DUPLICATE_ID]`, `[MISSING_REFERENCE]`, etc.)
- ノードID・選択肢IDの明示
- 循環参照の場合は完全なパスを表示
- 複数エラーの一括報告

## テスト結果

### テストファイル
- `packages/engine-ts/test/validation.test.ts` (新規作成)

### テストカバレッジ

| カテゴリ | テスト数 | 説明 |
|---------|---------|------|
| ID重複検出 | 3 | ノードID重複、選択肢ID重複、異なるノード間での同一ID許可 |
| 参照整合性 | 4 | startNode、choice.target、goto effect、空ターゲット |
| 循環参照検出 | 6 | 単純循環、複雑循環、自己参照、goto経由、分岐許可、収束パターン |
| エラーメッセージ | 2 | 詳細情報含有、複数エラー報告 |
| 後方互換性 | 3 | 基本モデル、選択肢なし、エフェクトのみ |

### 実行結果
```
Test Files  6 passed (6)
Tests       36 passed (36)
Duration    1.26s
```

**全テスト合格** ✅

## 後方互換性

### 既存APIの維持
- `loadModel()` 関数のシグネチャは変更なし
- 既存の検証ロジックは全て保持
- 新しい検証は追加のみで、既存の動作を変更しない

### 検証済みシナリオ
- 基本的なモデル構造
- 選択肢のないノード
- エフェクトのみの選択肢
- 分岐・収束パターン（ダイヤモンド構造）

## 影響範囲

### 変更ファイル
- ✏️ `packages/engine-ts/src/index.ts` (検証ロジック強化)
- ➕ `packages/engine-ts/test/validation.test.ts` (新規テスト)

### 影響を受けないファイル
- `apps/web-tester/` (UI変更なし)
- `packages/sdk-unity/` (変更なし)
- 既存のモデルファイル (後方互換性あり)

## パフォーマンス考察

### 計算量
- **ID重複検出**: O(n) - ノード数に比例
- **参照整合性**: O(n × m) - ノード数 × 平均選択肢数
- **循環参照検出**: O(n + e) - ノード数 + エッジ数（DFS）

### 実用性
- 小規模モデル (< 100ノード): 影響なし
- 中規模モデル (100-1000ノード): 許容範囲
- 大規模モデル (> 1000ノード): 検証時間が数秒程度増加する可能性

## 今後の改善案

### 短期
- [ ] 警告レベルの検証追加（未使用ノード検出など）
- [ ] 検証結果のJSON出力オプション
- [ ] CI/CDでの検証レポート自動生成

### 中期
- [ ] 検証ルールのカスタマイズ機能
- [ ] 段階的検証（スキーマ → 整合性 → 循環参照）
- [ ] パフォーマンス最適化（大規模モデル対応）

### 長期
- [ ] ビジュアルエラー表示（Web UIでの循環パス可視化）
- [ ] 自動修正提案機能
- [ ] プラグイン可能な検証システム

## まとめ

### 達成項目
- ✅ ID重複検出の実装
- ✅ 参照整合性チェックの強化
- ✅ 循環参照検出の実装
- ✅ 詳細なエラーメッセージ
- ✅ 18個の新規テスト追加
- ✅ 全テスト合格（36/36）
- ✅ 後方互換性の維持

### DoD確認
- ✅ ID重複検出が実装されている
- ✅ 参照整合性チェック（存在しないターゲット検出）が強化されている
- ✅ 循環参照検出が実装されている
- ✅ エラーメッセージにノードID・選択肢ID等の詳細が含まれる
- ✅ 既存テスト + 新規テストが全て通過する
- ✅ docs/inbox/ にレポートが作成されている
- ⏳ 本チケットの Report 欄にレポートパスが追記されている（次ステップ）

---

**次のアクション**: PR作成 → マージ → TASK_105更新
