# 作業申し送り

## 最終更新

- **日時**: 2026-03-16
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: `353a0f9` (inference UI Phase 3 graph visual + Entity/Inventory editor UI)
- **origin/main**: 同期済み

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

### エンジンの公開 API (`@narrativegen/engine-ts`)

| エクスポート | 用途 |
| ----------- | ---- |
| `loadModel(data)` | JSON モデル読み込み + スキーマ/整合性検証 |
| `startSession(model)` | セッション開始 → SessionState |
| `getAvailableChoices(session, model)` | 現在ノードの選択可能な選択肢（条件評価済み） |
| `applyChoice(session, model, choiceId)` | 選択肢適用 → 新 SessionState |
| `serialize(session)` / `deserialize(payload)` | セッション永続化 |

### 組み込み条件/エフェクト型

**条件 (8種)**: `flag`, `resource`, `variable`（数値/文字列比較・演算）, `timeWindow`, `hasItem`, `and`, `or`, `not`
**エフェクト (7種)**: `setFlag`, `addResource`, `setVariable`, `modifyVariable`（数値演算）, `addItem`, `removeItem`, `goto`

詳細は `docs/specs/variable-system.md`, `docs/specs/entity-inventory.md` を参照。

## 直近の作業 (2026-03-16 〜 2026-03-17)

### 推論UI Phase 3 グラフ視覚統合 完了 (2026-03-17)

- GraphEditorManager: applyInferenceHighlight/clearInferenceHighlight API
- パスハイライト (ゴールド #d4a017)、影響ノード (コーラル #e07050)、到達不能ノード半透明化 (opacity 0.4)
- InferencePanel._syncGraphHighlight でパネル→グラフ同期
- デバッグクエリUI (ノードID入力 + analyze/clear ボタン)
- SP-INF-UI-001 → done (100%)

### Entity/Inventory condition-effect-editor UI (2026-03-17)

- hasItem 条件タイプをエディタドロップダウンに追加
- addItem/removeItem エフェクトタイプをエディタドロップダウンに追加
- 構造化オブジェクトのパース/ビルド対応
- playthrough.schema.json: entities/inventory/hasItem/addItem/removeItem スキーマ追加

### グラフエディタ修正 (2026-03-16)

- unsafe render() 呼出を全面排除
- minimap ダークテーマ + テキスト overflow clip 対応

## 現在の状態

### CI・テスト

- **engine-ts**: 73 テスト全合格 (10 ファイル)
- **web-tester**: Vite ビルド成功 (チャンクサイズ警告は既知)
- **E2E**: 22 passed / 5 skipped (undo-redo 防御的ガード)

### 仕様書

- **spec-index.json**: 23 エントリ
- **done**: 18 件 (engine-core, variable-system, yarn-export, inference-engine, inference-ui, hierarchy, search, xss, paraphrase 等)
- **partial**: 4 件 (entity-inventory 95%, model-schema 95%, unity-sdk 85%, ai-features 80%)
- **legacy**: 1 件 (Design Improvements)

## 既知の課題

- Entity 定義管理 UI 未実装 (モデル内 entities マップの GUI 編集)
- チャンクサイズ警告 (vendor-mermaid 1.79MB)
- GUI Undo/Redo 手動回帰テスト未実施
- Yarn Spinner 実運用検証未実施
- Technical Debt (SP-009) 40% — 残債あり
- E2E ルート実行時の Vitest 衝突 (web-tester ディレクトリからは正常)

## 次の推奨作業

1. **Entity 定義管理 UI** (SP-ENTITY-001 95%→100%): エンティティの一覧表示・追加・編集・削除
2. **Yarn Spinner 実運用検証**: サンプルモデル → Yarn 出力 → Unity/Web Previewer 読込確認
3. **Technical Debt** (SP-009): チャンクサイズ最適化、inference/ ディレクトリ方針
4. **GUI Undo/Redo 回帰テスト**: 手動検証

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

SSOT: `docs/WORKFLOW_STATE_SSOT.md`
技術的負債: `docs/TECHNICAL_DEBT.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）
