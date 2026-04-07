# NarrativeGen プロジェクト全体ステータス

**再開・次アクションの正**: ルート [`HANDOVER.md`](../HANDOVER.md)。**仕様の正**: [`spec-index.json`](spec-index.json) と [`spec-viewer.html`](spec-viewer.html)。テスト件数などの数値は都度 `npm run test:engine` / `npm run test:e2e` / `dotnet test` で確認すること。

**調査日**: 2026-04-07  
**ブランチ**: `main`（trunk-based）  
**ざっくり**: engine-ts Vitest 全緑（260件台）、E2E Playwright、モデル検証 16 通過、`npm run check:spec-index` OK。

---

## 1. 実装スコープ（詳細は各 SP-*）

- **エンジン（TypeScript）**: モデル読込・セッション・条件/効果・推論・Entity-Property・Dynamic Text・イベント・在庫・変数・エンコード安全・モデル同期など。入口は `packages/engine-ts`。
- **Web Tester**: 編集 GUI・グラフ・プレイ没入・推論 UI・5形式エクスポート・検証パネルなど。入口は `apps/web-tester`。
- **Unity SDK**: `packages/sdk-unity`。TS との差分は **SP-UNITY-001**（[`specs/unity-sdk.md`](specs/unity-sdk.md)）。
- **レガシー参照用仕様**（参照専用・現行の正ではない）: [`specs/legacy/OpenSpec-WebTester.md`](specs/legacy/OpenSpec-WebTester.md)、[`specs/legacy/PHASE2_GRAPH_EDITOR_DESIGN.md`](specs/legacy/PHASE2_GRAPH_EDITOR_DESIGN.md)。

---

## 2. 手動確認・未確認が残るもの

| ID | 内容 | 確認のしかた | 優先度 |
|----|------|-------------|--------|
| U01 | Play Immersion（画像/BGM の操作感） | `npm run dev` → Play Mode | 高 |
| U02 | REST API 全経路 | `npm run dev:api` → curl 等 | 低 |
| U03 | Undo/Redo（GUI 体感） | エディタで Ctrl+Z/Y（E2E は一部 skip） | 中 |
| U04 | グラフエディタ全体の操作感 | 手動で D&D・ズーム等 | 中 |
| U05 | Web Tester 全体の導線・見た目 | 画面走査ツール等で任意 | 中 |

---

## 3. 未実装・ギャップ

| ID | 内容 | 仕様・備考 |
|----|------|------------|
| N01 | Unity SDK パリティ（最終差分） | SP-UNITY-001。events/追跡/会話テンプレは実装済、`hasEvent` 条件等の最終突合が残る |
| N03 | WritingPage 連携 | 外部フォーマット安定後。`pipeline-workflow.md` で延期 |
| N04 | Dynamic Text の Yarn ネイティブ変換 | 未着手 |
| N05 | spec 保守の運用具体化（レビュー例など） | SP-009 系。CI `governance` は済 |
| N06 | a11y（ARIA 等） | SP-009 残 |
| N07 | モバイル/タブレット最適化 | SP-009 残 |

**仕様エントリなし項目**: なし（Session History は `docs/specs/session-history.md` と `spec-index.json` に反映済み）。

---

## 4. 懸念（オープンなもの）

| # | 内容 | 備考 |
|---|------|------|
| C01 | E2E の間欠失敗 | `play-immersion` 等。待機・workers 設定で緩和済み |
| C02 | パス表記 | リポジトリ内の正は `packages/`（小文字） |
| C03 | Undo/Redo E2E の防御的 skip | グラフ表示依存 |
| C06 | `resolver.ts` が公開 export されていない | 内部専用なら問題なし |
| C07 | 体系的な Visual Audit が未実施 | 任意だが有益 |
| C09 | Backend の `/models/*` と `/api/models/*` の重複 | 既知 |
| C11 | 長期間ドキュメントのみの変更が続く場合 | `HANDOVER.md` の推奨作業で user-visible 変更を挟む |

---

## 5. テスト（一行ずつ）

- **engine-ts**: `npm run test:engine`（Vitest）
- **web-tester E2E**: `npm run test:e2e`
- **C#**: `dotnet test packages/tests/NarrativeGen.Tests`
- **仕様パス**: `npm run check:spec-index`
