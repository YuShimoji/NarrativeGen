# 中期タスク詳細 (1-2ヶ月)

**作成日**: 2026-02-07  
**期間**: 2026-02-21 〜 2026-04-07

---

## 📋 タスク一覧

| タスクID | タイトル | カテゴリ | 優先度 | 工数 |
|----------|----------|----------|--------|------|
| TASK_034 | AI バッチ処理 | AI 拡張 | 中 | 3-5日 |
| TASK_035 | main.js リファクタリング | 品質向上 | 中 | 3-5日 |
| TASK_036 | チャンクサイズ最適化 | 品質向上 | 低 | 2-3日 |
| TASK_037 | 追加エクスポート形式 | 機能拡張 | 中 | 5-7日 |

---

## Phase 3: AI 機能拡張

### ~~TASK_033: Ollama 統合 (ローカル LLM)~~

**Status**: DELETED
**削除日**: 2026-03-07
**理由**: 精度・リソース負荷の問題により削除決定

---

### TASK_034: AI バッチ処理

**Status**: OPEN
**Tier**: 2
**Branch**: feature/ai-batch
**Owner**: Worker
**Created**: 2026-02-07

#### 目的

複数ノードの一括言い換え・生成処理。

#### 実装内容

##### バッチ処理 UI

```
┌─────────────────────────────────────────┐
│ バッチ言い換え                          │
├─────────────────────────────────────────┤
│ 対象: [◯ 全ノード] [◯ 選択ノード]       │
│ スタイル: [標準 ▼]                      │
│                                         │
│ プログレス: ████████░░ 80% (40/50)      │
│                                         │
│ [開始] [キャンセル]                     │
└─────────────────────────────────────────┘
```

##### エラーハンドリング

```javascript
// リトライロジック
{
  maxRetries: 3,
  retryDelay: 1000, // ms
  exponentialBackoff: true
}

// 部分成功の処理
// 成功分は適用、失敗分はスキップしてログ出力
```

#### DoD

- [ ] 全ノード一括言い換え
- [ ] 選択ノード一括言い換え
- [ ] プログレス表示
- [ ] キャンセル機能
- [ ] リトライ機能
- [ ] エラーレポート表示

---

## コード品質向上

### TASK_035: main.js リファクタリング

**Status**: OPEN  
**Tier**: 3  
**Branch**: refactor/main-js-split  
**Owner**: Worker  
**Created**: 2026-02-07  
**Ref**: TASK_027

#### 目的

約 2200 行の main.js を責務ごとに分割し、保守性を向上。

#### 分割計画

```
現在の構造:
main.js (~2200行)

分割後:
src/
├── bootstrap.js          # 初期化・環境検出 (~200行)
│   - DOMContentLoaded ハンドラ
│   - 環境変数読み込み
│   - 依存関係初期化
│
├── ui-bindings.js        # DOM 要素取得・イベントバインド (~400行)
│   - querySelectorAll
│   - addEventListener
│   - UI コンポーネント接続
│
├── session-controller.js # セッション管理 (~300行)
│   - startSession
│   - applyChoice
│   - 状態更新
│
├── utils/
│   └── dom-helpers.js    # DOM ユーティリティ (~100行)
│
└── app.js               # エントリーポイント (~50行)
    - 各モジュールのインポート
    - アプリケーション起動
```

#### 移行戦略

1. 機能単位でモジュール抽出
2. 既存テストが通ることを確認
3. 段階的にリファクタリング
4. 回帰テスト実施

#### DoD

- [ ] モジュール分割完了
- [ ] 既存機能の動作確認
- [ ] ビルド成功
- [ ] テスト全パス

---

### TASK_036: チャンクサイズ最適化

**Status**: OPEN  
**Tier**: 3  
**Branch**: optimize/chunk-size  
**Owner**: Worker  
**Created**: 2026-02-07

#### 目的

ビルドサイズ削減と初期ロード高速化。

#### 現状分析

```
警告:
(!) Some chunks are larger than 500 kB after minification.
- index-*.js: 641 kB
- cytoscape.esm.js: 442 kB
```

#### 対策

##### 1. manualChunks 設定

```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['cytoscape', 'd3', 'mermaid'],
        ai: ['./src/features/ai/index.js']
      }
    }
  }
}
```

##### 2. 動的 import

```javascript
// Cytoscape 遅延読み込み
const loadCytoscape = async () => {
  const { default: cytoscape } = await import('cytoscape');
  return cytoscape;
};
```

##### 3. Tree Shaking 確認

```javascript
// 未使用エクスポートの削除確認
// package.json に sideEffects: false 追加
```

#### DoD

- [ ] チャンク分割実装
- [ ] 警告解消 or 許容範囲内
- [ ] 初期ロード時間計測
- [ ] パフォーマンス改善確認

---

## 機能拡張

### TASK_037: 追加エクスポート形式

**Status**: OPEN  
**Tier**: 2  
**Branch**: feature/export-formats  
**Owner**: Worker  
**Created**: 2026-02-07

#### 目的

多様なツール・ワークフローとの互換性確保。

#### 追加フォーマット

##### 1. Yarn Spinner

```yarn
title: Start
---
Hello, traveler!
-> Go to the shop
    <<jump Shop>>
-> Enter the dungeon
    <<jump Dungeon>>
===
```

##### 2. Excel (XLSX)

```
依存ライブラリ: xlsx (SheetJS)

出力シート:
- Nodes: node_id, text, choices
- Metadata: title, author, version
```

##### 3. PDF フローチャート

```
方法:
1. Mermaid CLI でグラフ生成
2. mermaid-cli パッケージ使用
3. SVG → PDF 変換

または:
- puppeteer で Mermaid レンダリング → PDF 出力
```

#### DoD

- [ ] Yarn Spinner フォーマッター
- [ ] XLSX フォーマッター
- [ ] PDF フローチャート (オプション)
- [ ] UI に追加
- [ ] 動作確認

---

## 📊 スケジュール

```
Month 1 (2/21-3/21):
├── Week 1-2: TASK_034 AI バッチ (3-5日)
├── Week 2-3: TASK_035 main.js リファクタリング (3-5日)
└── Week 3-4: バッファ / バグ修正

Month 2 (3/21-4/7):
├── Week 1: TASK_036 チャンク最適化 (2-3日)
├── Week 2-3: TASK_037 エクスポート拡張 (5-7日)
└── Week 3: バッファ / バグ修正
```

---

*最終更新: 2026-02-07*
