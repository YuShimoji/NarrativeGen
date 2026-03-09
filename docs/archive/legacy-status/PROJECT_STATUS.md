# NarrativeGen プロジェクトステータス

**最終更新**: 2026-03-01

## 概要

NarrativeGen は、インタラクティブストーリー向けの軽量ナラティブエンジンと、その確認・編集を行う Web Tester で構成されています。2026-03-01 時点で `main` は `origin/main` と一致し、`npm run doctor` と `npm run check` が通るため、再開発可能な状態です。

## 現在地

- 現在のフェーズ: Phase 2 完了後の Stabilization
- 実装の主軸: Graph Editor / Export / AI Provider / Lexicon / GUI 編集
- 直近の重点: 手動回帰、Export 実運用確認、Undo/Redo 網羅確認、build 警告の整理

## アーキテクチャ

```
NarrativeGen/
├── Packages/
│   └── engine-ts/              # TypeScript コアエンジン
├── apps/
│   └── web-tester/             # Web ベースの試験・編集ツール
│       ├── src/
│       │   ├── core/           # AppState, Session, Logger
│       │   ├── features/       # export, validator, save, AI など
│       │   ├── ui/             # GUI/Graph/Modal 系 UI
│       │   ├── utils/          # 共通ユーティリティ
│       │   └── styles/         # CSS
│       ├── bootstrap.js        # 初期化補助
│       ├── session-controller.js
│       ├── ui-bindings.js
│       └── main.js             # 統合エントリーポイント
├── models/                     # サンプルモデル
├── docs/                       # 運用・仕様・レポート
└── .shared-workflows/          # Orchestrator/Worker 共通運用
```

## 実装済みの主要機能

### コアエンジン

- ✅ セッション開始 / 選択適用 / 状態遷移
- ✅ 条件評価 (フラグ、リソース、変数、timeWindow 系ドキュメント整備済み)
- ✅ 効果適用
- ✅ 言い換えとレキシコン管理
- ✅ サンプルモデル検証 CLI

### Web Tester

- ✅ JSON モデル読み込み、サンプル切り替え、保存
- ✅ GUI エディタ、Graph Editor、ミニマップ、マルチエンディング可視化
- ✅ 検索 / フィルタ / スニペット / テンプレート
- ✅ 条件 / 効果エディタ
- ✅ リアルタイムプレビュー
- ✅ Export (Twine / Ink / CSV)
- ✅ AI Provider 設定 (Mock / OpenAI)
- ✅ レキシコン import / merge / replace とスキーマ検証

## 検証済みの再開発基盤

| 項目 | 状態 | 備考 |
|---|---|---|
| Git 同期 | ✅ | `git pull --ff-only` で最新確認 |
| Submodule | ✅ | `.shared-workflows` 同期済み |
| Doctor | ✅ | 26/26 checks passed |
| Lint/Test/Validate/Build | ✅ | `npm run check` 通過 |
| Web Tester build | ✅ | `copy:models` まで成功 |
| Export 自動検証 | ✅ | `npm run test -w @narrativegen/web-tester` で formatter sanity check |
| Browser 自動 smoke | ✅ | Playwright で session start / export modal / graph render を確認 |
| Dev automation hook | ✅ | 開発時限定の `window.__NARRATIVEGEN_DEVTOOLS__` を追加 |

## 既知の課題

| 課題 | 優先度 | 状況 |
|---|---|---|
| Undo/Redo のブラウザ自動 smoke 不足 | 高 | Export/graph 以外の UI 自動検証を追加したい |
| Twine / Ink Export の実運用検証不足 | 高 | 実装済みだが外部ツール確認が未了 |
| Undo/Redo の網羅確認不足 | 高 | 実装済みだが自動回帰観点の整理が必要 |
| Mermaid 系の大きい async chunk 警告 | 中 | 初期 chunk は約 316 kB まで削減、Mermaid 側に約 716 kB が残存 |
| `Packages` / `packages` 混在 | 中 | Windows では動作、非Windowsでは要確認 |
| `main.js` が依然大きい | 中 | 補助ファイルへの分割は進んだが統合点が重い |

## 次のマイルストーン

### 短期

- 手動回帰と Export 検証を完了し、再開発の品質基準を固定する
- `docs/HANDOVER.md` / `docs/reports/` / `docs/plans/` を現在実装に同期する

### 中期

- Mermaid 追加分割を含む build chunk の最適化、レスポンシブ改善、アクセシビリティ改善
- `main.js` の責務分割を追加で進める

### 長期

- 共有リンク、バージョン管理、Unity Editor 拡張
- 大規模モデル向けパフォーマンス最適化

## 参照ドキュメント

| ドキュメント | 用途 |
|---|---|
| `docs/plans/DEVELOPMENT_PLAN.md` | 開発プラン・機能一覧 |
| `docs/HANDOVER.md` | 運用上の最新状態 |
| `docs/GUI_EDITOR_TEST_GUIDE.md` | 手動回帰テスト |
| `docs/reports/REPORT_TASK_028.md` | Export 実装の詳細 |

## 開発コマンド

```bash
npm install
npm run doctor
npm run check
cd apps/web-tester && npm run dev
```

## リポジトリ

- GitHub: https://github.com/YuShimoji/NarrativeGen
- Node.js: 20+ 推奨
