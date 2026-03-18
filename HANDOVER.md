# 作業申し送り

## 最終更新

- **日時**: 2026-03-18
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: `2dd02f2` (feat: align index.ts exports with browser.ts)
- **origin/main**: +3 commits ahead (push前)

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルを JSON 形式で定義し、TypeScript エンジンで実行、Web UI でプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  packages/backend/      # Express REST API (port 3001)
  packages/sdk-unity/    # Unity C# SDK (UPM パッケージ形式)
  packages/tests/        # C# ユニットテスト
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル + JSON スキーマ
  docs/                  # 仕様書・プラン・ガバナンス
```

## 現在の状態

### CI・テスト

- **engine-ts**: 205 テスト全合格 (17 ファイル)
- **web-tester**: Vite ビルド成功
- **E2E**: 44 件
- **モデル検証**: 13 モデル通過

### 仕様書

- **spec-index.json**: 31 エントリ
- **done**: 30 件
- **partial**: 1 件 (SP-UNITY-001 Unity SDK 85%)

### Session 5-6 の成果 (2026-03-17 ~ 2026-03-18)

- Doc sync: HANDOVER/TASKS/DEVELOPMENT_PLAN/TECHNICAL_DEBT 全最新化
- Doctor: 25/25 pass (TEST_PROCEDURES→TEST_GUIDE fallback修正)
- full_integration.json: 全機能横断統合モデル (14ノード, 5エンティティ, 3テンプレート)
- G1解消: playthrough.schema.json に and/or/not 条件 ($ref 再帰定義)
- G2解消: ConversationTemplate trigger sessionConditions + eventMatch optional
- G3解消: Model.variables 初期値サポート
- and/or/not 複合条件 GUI (condition-effect-editor, 1階層ネスト)
- YarnFormatter: hasEvent/createEvent/property 条件・エフェクト対応
- index.ts export パリティ (paraphrase, AI, inference 追加)
- gui-editor.js: const session 重複宣言バグ修正

## 既知の課題

- GUI Undo/Redo 手動回帰テスト未実施
- Yarn Spinner 実運用検証未実施
- Unity SDK パリティ未完 (TS側7機能の移植)

## 次の推奨作業

1. **Web Tester 手動プレビュー**: full_integration.json を実際に動かして検証
2. **sessionConditions GUI**: ConversationTemplate trigger の GUI 対応
3. **Unity SDK パリティ**: TS側7機能の C# 移植
4. **ライター向けガイド**: 原初ビジョン機能を使った実用サンプル

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run build:engine
npm run test:engine
npm run build:tester
npm run dev
# → http://localhost:5173/
```

---

技術的負債: `docs/TECHNICAL_DEBT.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）
