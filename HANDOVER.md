# 作業申し送り

## 最終更新

- **日時**: 2026-03-09
- **ブランチ**: `feature/main-js-split-phase2`
- **マージ済み**: `origin/main` (b7eaa19) を merge、push 済み
- **PR**: #80（オープン中）
- **ベースブランチ**: `open-ws/engine-skeleton-2025-09-02`

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルを JSON 形式で定義し、TypeScript エンジンで実行、Web UI でプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル + JSON スキーマ
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

**条件**: `flag`, `resource`, `variable`（数値/文字列比較・演算）, `timeWindow`, `and`, `or`, `not`
**エフェクト**: `setFlag`, `addResource`, `setVariable`, `modifyVariable`（数値演算）, `goto`

詳細は `docs/specs/variable-system.md` を参照。

## 直近の作業（2026-03-09）

### ブランチ統合 (feature/main-js-split-phase2 + origin/main)

- `git merge origin/main` を実施（14コミット差分）
- コンflict解決方針: origin/main の設計方向（condition-effect-ops.ts 統合）を採用

### origin/main の主要変更（取り込み済み）

#### main.js 分割完了

- `main.js`: 2365行 → 69行（ブートストラップ + 配線のみ）
- `src/app-controller.js` (~1633行): アプリ初期化・イベントワイヤリング
- `src/app-editor-events.js` (~425行): エディタ系イベント処理

#### condition-effect-ops.ts 導入

- `session-ops.ts`・`index.ts`・`browser.ts` に分散していた evalCondition/applyEffect の重複を `condition-effect-ops.ts` に統合
- `session-ops.ts` はキャッシュ機構を維持しながら condition-effect-ops.ts に委譲

#### Yarn Spinner エクスポート

- `YarnFormatter.js` 追加（Yarn Spinner 2.x 形式）
- エクスポーター: CSV / Ink / Twine / Yarn の 4 形式

#### 変数システム拡張

- `VariableState`: 数値型（number）対応
- `modifyVariable` エフェクト: 数値演算（add/sub/mul/div）
- 数値比較条件: `>=`, `<=`, `>`, `<`
- 仕様書: `docs/specs/variable-system.md`

#### ドキュメント

- `docs/specs/`: 仕様書 3 件追加（variable-system, yarn-spinner-export, code-refactoring）
- `docs/spec-index.json` + `docs/spec-viewer.html`: 仕様書一元ビューア
- CLAUDE.md: Decision Log 更新、Spec View セクション追加

### 推論システム（現ブランチ独自）

現ブランチには `packages/engine-ts/src/inference/` ディレクトリが存在する（origin/main では削除済み）。
推論ロジックは `condition-effect-ops.ts` に統合されたが、推論レジストリ・前方/後方連鎖は
現ブランチの `inference/` に残存している。統合方針は未決定。

## 現在の状態

### CI・テスト

- **engine-ts**: 73テスト全合格（10ファイル）
- **web-tester**: Vite ビルド成功（チャンクサイズ警告は既知）
- **E2E**: 24 passed, 36 skipped（skip 要否判断は未完了）

### 主要モジュール構成

#### packages/engine-ts/src/

| モジュール | 役割 |
| --------- | ---- |
| index.ts | Node.js 向けエントリ（fs 使用、スキーマ読み込み） |
| browser.ts | ブラウザ向けエントリ（fs 不使用） |
| types.ts | Model, SessionState, Condition, Effect 等の型定義 |
| session-ops.ts | startSession, getAvailableChoices, applyChoice（メモ化キャッシュ付き） |
| condition-effect-ops.ts | evalCondition / applyEffect の共有実装 |
| inference/ | 推論システム（現ブランチ独自。registry, forward/backward chaining） |

#### apps/web-tester/src/

| モジュール | 役割 |
| --------- | ---- |
| main.js | エントリ（69行。ブートストラップ + 配線のみ） |
| app-controller.js | アプリケーション初期化・イベントワイヤリング |
| app-editor-events.js | エディタ系イベント処理 |
| core/state.js | グローバルアプリ状態管理 |
| ui/graph-editor/GraphEditorManager.js | D3.js + Dagre.js グラフ可視化・編集 |
| ui/condition-effect-editor.js | 条件/エフェクト GUI エディタ（variable 型対応済み） |
| features/export/ | CSV, Ink, Twine, Yarn エクスポーター |

### アクティブドキュメント一覧（docs/）

| ドキュメント | 内容 |
| ----------- | ---- |
| WORKFLOW_STATE_SSOT.md | ミッション・Done 条件・選別規則 |
| TECHNICAL_DEBT.md | 技術的負債と改善タスク |
| architecture.md | システムアーキテクチャ概要 |
| reference.md | エンジン仕様リファレンス |
| ai-features.md | AI 機能仕様（言い換え/生成） |
| spreadsheet-format.md | CSV/TSV フォーマット v2.0 仕様 |
| specs/variable-system.md | 変数システム仕様（数値型・演算） |
| specs/yarn-spinner-export.md | Yarn Spinner エクスポート仕様 |
| specs/code-refactoring-condition-effect.md | condition-effect-ops リファクタリング仕様 |
| spec-index.json | 仕様書一元インデックス（Source of Truth） |
| spec-viewer.html | 仕様書ブラウザビューア |
| OpenSpec.md / OpenSpec-WebTester.md | Web Tester UX 仕様 |

## 既知の課題

- E2E 36 件が skip（theme-toggle 11 件は UI 未接続、他 25 件は優先度判断待ち）
- ビルド時チャンクサイズ警告（325 KB + 442 KB、機能に影響なし）
- `inference/` ディレクトリの扱い: origin/main では削除済みだが現ブランチに残存
- WORKFLOW_STATE_SSOT.md の Done 条件 4 項目が未チェック

## 次の推奨作業

1. E2E skip 36 件の要否判断（SSOT Done 条件直結）
2. Yarn Spinner エクスポートの実運用検証
3. variable 型 GUI エディタ対応の完成確認
4. `inference/` の方針決定（condition-effect-ops.ts に統合 or 維持）

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run build:engine
npm run test:engine
npm run build:tester
npm run dev:tester
# → http://localhost:5173/
```

---

SSOT: `docs/WORKFLOW_STATE_SSOT.md`
技術的負債: `docs/TECHNICAL_DEBT.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）
