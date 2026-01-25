# NarrativeGen プロジェクトステータス

**最終更新**: 2025-12-14

## 概要

NarrativeGen は、インタラクティブストーリー/ビジュアルノベル向けの軽量ナラティブエンジンです。JSON ベースのストーリーモデルを解釈し、条件分岐・リソース管理・言い換え機能などをサポートします。

## アーキテクチャ

```
NarrativeGen/
├── Packages/
│   └── engine-ts/          # TypeScript コアエンジン
├── apps/
│   └── web-tester/         # Web ベースのテスト・編集ツール
│       ├── src/
│       │   ├── core/       # AppState, Session, Logger
│       │   ├── ui/         # UI マネージャー群
│       │   ├── features/   # SaveManager 等
│       │   ├── config/     # 定数・設定
│       │   ├── utils/      # ユーティリティ
│       │   └── styles/     # CSS (外部化済み)
│       ├── main.js         # エントリーポイント
│       └── index.html      # HTML テンプレート
├── models/                 # サンプルモデル
└── docs/                   # ドキュメント
```

## 実装済み機能

### コアエンジン (engine-ts)
- ✅ セッション管理 (startSession, applyChoice)
- ✅ 条件評価 (フラグ、リソース、変数)
- ✅ 効果適用 (setFlag, addResource, setVariable)
- ✅ 言い換え機能 (paraphraseJa, chooseParaphrase)
- ✅ レキシコン管理 (get/setParaphraseLexicon)

### Web Tester
- ✅ モデル読み込み (サンプル選択、ファイルドロップ)
- ✅ セッション実行 (選択肢実行、状態表示)
- ✅ GUI エディタ (ノード編集、追加、削除)
- ✅ 検索・フィルタ (到達不能、孤立、フラグ使用等)
- ✅ スニペット・テンプレート機能
- ✅ リアルタイムプレビューパネル
- ✅ モデル検証 (自己参照、デッドエンド検出)
- ✅ DnD 並べ替え (ノード・選択肢)
- ✅ 条件/効果エディタ
- ✅ Mermaid プレビュー (M キーでトグル)
- ✅ キーバインドシステム (カスタマイズ可能)
- ✅ AI 機能 (モック、OpenAI 統合)
- ✅ レキシコンエディタ
- ✅ モデル埋め込みレキシコン (`meta.paraphraseLexicon`) の取り込み
- ✅ テーマ切替 (6種類プリセット)
- ✅ 保存/読み込み (SaveManager、自動保存)
- ✅ CSV エクスポート/インポート

## 技術スタック

- **コアエンジン**: TypeScript
- **Web Tester**: Vanilla JS + Vite
- **グラフ描画**: D3.js
- **ダイアグラム**: Mermaid
- **スタイル**: CSS Variables + 外部 CSS ファイル

## 既知の問題

| 問題 | 状況 | 対応 |
|------|------|------|
| IDE プレビュー環境でのレイアウト崩れ | 対応中 | JS によるランタイムスタイル強制適用を実装 |
| main.js が大きい (~2200行) | 低優先 | 機能は分離済み、将来的に分割検討 |

## 次のマイルストーン

### Phase 2: グラフエディタ ✅ (2026-01-23 完了)
- ✅ Mermaid 風のビジュアルノード編集
- ✅ Dagre.js による自動レイアウト
- ✅ ミニマップ
- ✅ 複数選択・一括移動
- ✅ グリッドスナップ
- ✅ マルチエンディング可視化

### レキシコン拡張
- ✅ GUI からのクイック追加
- ✅ モデル埋め込み (`meta.paraphraseLexicon`)（Web Tester で取り込み実装済み）
- ✅ JSON スキーマ定義（`Packages/engine-ts/schemas/lexicon.schema.json`）
- ✅ インポート/マージ/置換時のスキーマ検証（ajv）
- ✅ モデルエクスポート時の `meta.paraphraseLexicon` 自動埋め込み

### AI 機能拡張
- Ollama 統合 (ローカル LLM)
- バッチ処理
- 生成履歴

## ドキュメント構成

| ドキュメント | 説明 |
|--------------|------|
| `features-status.md` | 機能実装状況の詳細表 |
| `docs/reference.md` | API リファレンス (SSOT) |
| `docs/GUI_EDITOR_TEST_GUIDE.md` | 手動テストケース |
| `docs/NEXT_PHASE_PROPOSAL.md` | Phase 2 設計提案 |
| `docs/architecture.md` | アーキテクチャ概要 |
| `docs/troubleshooting.md` | トラブルシューティング |

## 開発環境

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
cd apps/web-tester && npm run dev

# ビルド
npm run build

# テスト
npm test
```

## リポジトリ

- GitHub: https://github.com/YuShimoji/NarrativeGen
- Node.js: v18+ 推奨
