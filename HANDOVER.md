# 作業申し送り

## 最終更新

- **日時**: 2026-03-16
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: `8e75991` (CLAUDE.md Phase 3 handoff)
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

## 直近の作業 (2026-03-11 〜 2026-03-16)

### ブランチ統合 (2026-03-11)

- `feature/main-js-split-phase2` を `main` にマージ (85コミット)
- コンフリクト 8 件解決
- テスト 15 → 73 件に増加
- 推論エンジン・階層UI・セマンティック検索・XSS修正・Save-Load・ハンドラー分離を一括統合

### 推論UI統合 (2026-03-11 〜 2026-03-16)

- **Phase 1**: Live Preview パネルに推論セクション追加 (UC-1: 到達パス表示)
- **Phase 2**: InferenceBridge 拡張 (findStateKeyUsage/getAllStateKeys)、パネル3セクション構成 (UC-3: 影響分析, UC-4: 状態キー使用)
- **Phase 3 一部**: UC-2 到達可能ノードパネル、UC-5 What-if (パネルUI)
- **Phase 3 残**: グラフ視覚統合 (T1-T4) — 実装プラン承認済み

### Entity/Inventory + C# SDK 統合 (2026-03-13)

- origin/master から手動 cherry-pick
- hasItem 条件 + addItem/removeItem エフェクト + modifyVariable 推論登録
- EntityDef 型 + brand→name リネーム
- C# SDK InferenceRegistry (条件 8 種 / エフェクト 7 種)
- 73 テスト全緑維持

### origin/master 統合方針決定 (2026-03-16)

- ローカル master → main に切替 (origin/main が正)
- master の Entity/Inventory 変更は既に cherry-pick 済み
- master の web-tester 構造巻き戻し (main.js 2371行復活) は採用せず

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
- **done**: 17 件 (engine-core, variable-system, yarn-export, inference-engine, hierarchy, search, xss, paraphrase 等)
- **partial**: 5 件 (inference-ui 85%, entity-inventory 85%, unity-sdk 85%, model-schema 80%, ai-features 80%)
- **legacy**: 1 件 (Design Improvements)

## 既知の課題

- 推論UI Phase 3 グラフ視覚統合 (T1-T4) が未実装 (プラン承認済み)
- チャンクサイズ警告 (vendor-mermaid 1.79MB)
- Entity/Inventory の Web Tester UI 未実装
- GUI Undo/Redo 手動回帰テスト未実施
- Yarn Spinner 実運用検証未実施
- Technical Debt (SP-009) 40% — 残債あり

## 次の推奨作業

1. **推論UI Phase 3 グラフ視覚統合** (T1-T4): パスハイライト(ゴールド)、到達不能半透明化(0.4)、影響範囲色分け(コーラル)、デバッグクエリUI
2. **Yarn Spinner 実運用検証**: サンプルモデル → Yarn 出力 → Unity/Web Previewer 読込確認
3. **Entity/Inventory Web Tester UI**: エンティティ定義・インベントリ操作の GUI
4. **チャンク最適化**: vendor-mermaid 分離、dynamic import 活用

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
