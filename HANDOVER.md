# 作業申し送り

## 最終更新

- **日時**: 2026-03-18
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: `358a8b3` (feat: SP-PLAY-001 play immersion MVP)
- **origin/main**: +1 commit ahead (push前)

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

- **engine-ts**: 250 テスト全合格 (20 ファイル)
- **web-tester**: Vite ビルド成功
- **E2E**: 44 件
- **モデル検証**: 14 モデル通過

### 仕様書

- **spec-index.json**: 32 エントリ
- **done**: 30 件
- **partial**: 2 件 (SP-UNITY-001 Unity SDK 85%, SP-PLAY-001 Play Immersion 75%)

### Session 10 の成果 (2026-03-18)

- SP-PLAY-001 プレイ没入感 MVP 実装
  - TransitionRegistry: Strategy パターンでノード遷移方式を登録・切替
  - CrossfadeTransition / AppendScrollTransition: 2つの組み込み遷移
  - PlayRenderer: 段落フェードイン + インライン選択肢 + エンディング表示
  - play.css: CSS アニメーション (fadeIn/fadeOut, stagger, ending, mode toggle)
  - app-controller.js: PlayRenderer 統合 (全セッション開始点で初期化)
  - playthrough.schema.json: settings.presentation + nodes.*.presentation 追加

## 既知の課題

- GUI Undo/Redo 手動回帰テスト未実施
- Unity SDK パリティ未完 (TS側7機能の移植)
- Dynamic Text構文のYarnネイティブ変換 (`{variable}`→`{$variable}`, `{?cond:text}`→`<<if>>`/`<<endif>>`)
- SP-PLAY-001 E2E テスト未作成

## 次の推奨作業

1. **SP-PLAY-001 E2E テスト**: 段落フェードイン・インライン選択肢・モード切替の自動テスト
2. **SP-PLAY-001 手動確認**: crossfade/append-scroll の操作感、エンディング表示
3. **Unity SDK パリティ**: TS側7機能の C# 移植 (別セッション推奨)
4. **Dynamic Text Yarn変換**: {variable}→{$variable}, {?cond:text}→<<if>>/<<endif>>
5. **CI統合**: spec-index/encoding-safety checks in PR/CI

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
