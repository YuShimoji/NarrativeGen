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

- **engine-ts**: 237 テスト全合格 (19 ファイル)
- **web-tester**: Vite ビルド成功
- **E2E**: 44 件
- **モデル検証**: 14 モデル通過

### 仕様書

- **spec-index.json**: 31 エントリ
- **done**: 30 件
- **partial**: 1 件 (SP-UNITY-001 Unity SDK 85%)

### Session 7 の成果 (2026-03-18)

- AUTHORING_GUIDE.md: 16セクション、全機能ステップバイステップガイド
- writer_tutorial.json: 12ノード/4エンティティ/3テンプレート/2キャラクター/3語辞書
- writer-tutorial.spec.ts (14件) + full-integration.spec.ts (11件): 全ルートセッション検証
- GUI改善: condition-effect-editor datalistサジェスト + Dynamic Textインラインプレビュー
- G4解消: Model.characters (CharacterDef + KnowledgeProfile) スキーマ追加
- G5解消: Model.paraphraseLexicon (PropertyAwareLexicon) スキーマ追加
- [entity~] prop_pool構文: expandTemplateWithTracking + DescriptionState連動 + 7テスト
- Yarn検証: writer_tutorial構造出力OK (Dynamic Text構文のYarn変換は将来課題)

## 既知の課題

- GUI Undo/Redo 手動回帰テスト未実施
- Unity SDK パリティ未完 (TS側7機能の移植)
- Dynamic Text構文のYarnネイティブ変換 (`{variable}`→`{$variable}`, `{?cond:text}`→`<<if>>`/`<<endif>>`)

## 次の推奨作業

1. **Unity SDK パリティ**: TS側7機能の C# 移植 (別セッション推奨)
2. **Dynamic Text Yarn変換**: {variable}→{$variable}, {?cond:text}→<<if>>/<<endif>>
3. **CI統合**: spec-index/encoding-safety checks in PR/CI

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
