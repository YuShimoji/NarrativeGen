# Technical Debt and Improvement Tasks

Last updated: 2026-04-09

## Overview
This document tracks technical debt and improvement work items.

---

## High Priority

### 1. Stabilize Spec SoT operation
Status: in progress

- Added syntax and reference validation for `docs/spec-index.json`.
- Script: `scripts/spec-index-check.mjs`
- Command: `npm run check:spec-index`
- Workflow note added to `docs/plans/DEVELOPMENT_PLAN.md`.

Remaining tasks:
- [x] Require root `npm ci` + `check:spec-index` / `check:models-sync` / `check:encoding-safety` in CI (`governance` job).
- [x] Add change-review examples for spec maintenance（[docs/operations/SPEC_INDEX_REVIEW_EXAMPLES.md](operations/SPEC_INDEX_REVIEW_EXAMPLES.md)）。

### 2. Dependency health recheck
Status: in progress

- Workspace build is restored.
- Build scripts in `packages/engine-ts` and `packages/backend` now use hoisted TypeScript.

Remaining tasks:
- [ ] Monitor `npm ls --depth=0` for `extraneous/invalid` recurrence.
- [ ] Add environment troubleshooting notes for permission/sandbox differences.

### 3. Encoding safety operation
Status: in progress

- Added `npm run check:encoding-safety` and `npm run check:safety`.
- Added `npm run check:safety:changed` for changed-file-oriented validation.
- Added incident record: `docs/governance/encoding-safety-incident-2026-03-10.md`.

Remaining tasks:
- [ ] Make changed-file mode use Git diff directly in restricted/sandboxed environments.
- [ ] Add CI/pre-commit guidance for encoding safety checks.

---

## Medium Priority

### 4. Chunk optimization
Status: done (2026-03-17)

- Dynamic import for Mermaid preview (`import('mermaid/dist/mermaid.core.mjs')`) — 初期ロード不要
- Manual chunking: `vendor-mermaid-core` (1.27MB), `vendor-mermaid-deps`, `vendor-diagram-layout`, `vendor-cytoscape`
- KaTeX / cytoscape は mermaid の間接依存。アプリコードから直接参照なし
- `chunkSizeWarningLimit: 1300` でビルド警告を抑制 (遅延読み込みのため初期ロードに影響なし)
- 初回ロード計測は任意。現状で問題なし

### 5. Responsive and accessibility improvements
Status: done (baseline; 2026-04-09)

Remaining tasks:
- [x] Mobile/tablet layout definitions.
- [x] ARIA labels and keyboard navigation.
- [x] Manual usability checks on key screens (手順/記録ルールを整備済み)
- [x] 画面別チェックリスト作成 (`docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`)

### 6. Node graph visual issues
Status: done (2026-03-17)

- ~~Minimap dark theme~~ → Fixed (CSS variables)
- ~~Node text overflow~~ → Fixed (clipPath)
- ~~Unsafe render() calls~~ → Fixed (2026-03-16, 全面排除)
- foreignObject SVG clone rendering: 既知の制約。実用上問題なし

### 7. Manual test expansion
Status: partially done

Remaining tasks:
- [x] Re-verify core graph editor scenarios.
- [ ] Regression checks for variable system and Yarn export.
- [ ] Negative-path checks for model import/export.
- [x] E2E 間欠失敗の記録運用テンプレート追加 (`docs/operations/E2E_FLAKE_RUNBOOK.md`)
- [x] 自動化/手動責務境界と flaky 運用基準を runbook に反映
- [x] flaky 候補のトラッカー追加 (`docs/tasks/FLAKY_ISSUES_TRACKER.md`)

### 9. E2E root execution Vitest conflict
Status: done (2026-03-17)

`npx playwright test` をプロジェクトルートから実行すると、Playwright が `engine-ts` 配下の `@vitest/expect` を読み込みエラーになっていた。
→ ルート `package.json` に `test:e2e` スクリプトを追加し `--config apps/web-tester/playwright.config.js` で解決。

### 10. Model files dual management
Status: done (2026-03-22)

`models/examples/` (ルート、スキーマ検証対象) と `apps/web-tester/models/examples/` (Vite配信用) が独立して存在し、内容が乖離していた。

- `scripts/sync-models.mjs` 作成: root→web-tester へコピー同期
- `npm run sync:models` / `npm run check:models-sync` 登録済み
- CI/precommit での乖離検出は `npm run check:models-sync` で可能

### 11. E2E state pollution in batch runs
Status: mitigated (2026-03-22)

全E2Eテストを一括実行すると、CPU競合で間欠的にタイムアウトが発生していた。

対策:
- workers を 2 に制限 (無制限からの変更)
- デフォルトタイムアウトを 45s に延長
- ローカルリトライ 1回追加
- saveGuiBtnのPlayRenderer未初期化バグを修正 (根本原因の1つ)

9→0-2件の間欠失敗に改善。完全排除にはさらにisolation強化が必要。

---

## Low Priority

### 8. Documentation cleanup
Status: ongoing

Remaining tasks:
- [x] HANDOVER.md / TASKS.md / DEVELOPMENT_PLAN.md を最新状態に同期 (2026-03-17)
- [x] 旧テスト手順参照を doctor / README / troubleshooting で現行ドキュメントに修正 (2026-03-17)
- [ ] Periodic legacy document review.
- [ ] Normalize mojibake-affected legacy planning documents.

---

## Roadmap-aligned debt closure (2026 Q2-Q4)

Source: `docs/plans/ROADMAP_EXECUTION_2026.md`

### Short term (0-4 weeks)
- [x] Close SP-PLAY-001 human verification gap (AC-9 to AC-12 logging readiness + evidence format).
- [x] Close SP-UNITY-001 TS/C# parity edge around `hasEvent` template conditions.
- [x] Add a repeatable E2E flake incident note format and keep records per failure.

### Mid term (1-3 months)
- [x] Finish a11y improvements on Story/Graph/Play/Modal primary views (baseline).
- [x] Finish mobile/tablet responsive baseline for primary authoring flow.
- [x] Reclassify regression responsibility (automated vs manual) and document it.

### Long term (3-6 months)
- [ ] Start WritingPage integration only after external format stabilization.
- [ ] Improve Unity distribution path (UPM-first, additional channel evaluation).
- [ ] Promote quality gates from "check set" to release readiness criteria.
- [x] Define WritingPage pre-implementation I/O contract and start gates.

---

## Completed

| Task | Date | Note |
|------|------|------|
| main.js split refactor | 2026-03-08 | `apps/web-tester/main.js` is now a thin entry |
| Yarn Spinner export | 2026-03-09 | Formatter added |
| Variable system extension | 2026-03-09 | Numeric compare/ops/UI integrated |
| Condition/effect dedup | 2026-03-09 | Shared module introduced |
| spec-index JSON recovery | 2026-03-09 | Valid JSON + file references checked |
| spec-index checker | 2026-03-09 | `npm run check:spec-index` |
| encoding safety checker | 2026-03-09 | `npm run check:encoding-safety` |
| encoding safety workflow + incident record | 2026-03-10 | workflow doc and incident record added |
| Mermaid chunk split v2 | 2026-03-10 | `vendor-mermaid-core/deps` and `vendor-diagram-layout` introduced |
| validate-models cache pollution fix | 2026-03-12 | `clearSessionCaches()` added to session-ops.ts |
| E2E skip triage (36→5) | 2026-03-12 | theme-toggle deleted (UI未実装), 5 defensive skips retained |
| Export all-model smoke test | 2026-03-12 | 6 models x 4 formatters = 24 structural checks |
| Inference UI Phase 2 (UC-3/UC-4) | 2026-03-12 | Impact analysis + state key usage in InferencePanel |
| Inference UI Phase 3 (UC-2/UC-5 + graph visual) | 2026-03-17 | Path highlight (gold), unreachable dim (0.4), impact coloring (coral), debug query UI |
| Graph editor unsafe render() elimination | 2026-03-16 | All unsafe render() calls replaced |
| Entity/Inventory condition-effect-editor UI | 2026-03-17 | hasItem/addItem/removeItem in dropdown + schema update |
| Entity definition management UI | 2026-03-17 | Collapsible panel in GUI editor, CRUD, inline edit |
| Branch consolidation (master→main) | 2026-03-16 | Local master switched to main, origin/main is canonical |
| Chunk optimization (lazy-load confirmed) | 2026-03-17 | Dynamic import + manual chunking. Load performance acceptable |
| Node graph visual issues | 2026-03-17 | Minimap dark theme, text overflow, unsafe render() all resolved |
| Doctor warning fix (TEST_PROCEDURES→TEST_GUIDE) | 2026-03-17 | doctor 25/25 pass, troubleshooting/README参照修正 |
| Doc sync (HANDOVER/TASKS/DEVELOPMENT_PLAN) | 2026-03-17 | テスト数198, spec 31, 原初ビジョン完了反映 |
| Model files sync script (TD-10) | 2026-03-22 | `npm run sync:models` / `check:models-sync` |
| saveGuiBtn PlayRenderer bug | 2026-03-22 | GUI編集保存後にインライン選択肢が表示されなかった |
| E2E batch stability (TD-11) | 2026-03-22 | workers=2, timeout=45s, retries=1, 9→0-2件に改善 |
| Dead code cleanup (session 14-15) | 2026-03-26 | 8ファイル削除, utils/logger.js統合, 旧文書はワークツリーから除去済み（必要時はGit履歴参照） |
| Empty state UI | 2026-03-26 | ストーリー/グラフタブに未ロード時プレースホルダー追加 |
| Sidebar toggle CSS fix | 2026-03-26 | .sidebar-hidden CSSルール欠落を修正 |
| spec-index gap | 2026-03-26 | SP-HIST-001 (Session History) エントリ追加、33エントリに |

---

## Backlog（要件確定後にチケット化）

昇格手順: [docs/plans/BACKLOG_PROMOTION.md](plans/BACKLOG_PROMOTION.md)。

次の項目はプロダクト要件が固まるまで **実装スコープ外** とし、ここにのみ記録する。

| ID | 項目 | 備考 |
|----|------|------|
| BL-TGEN-META | `model.metadata` の `{…}` 展開をランタイム文章 API に載せるか | SP-TGEN セクション7・本線未使用 |

（`BL-PLAY-BGM` は `docs/specs/play-immersion.md` の「検証記録」表へ移設。記入完了後は Issue 昇格または表のみで完結可。）

---

## History
- 2026-03-09: rewritten to current state
- 2026-03-10: updated for encoding safety workflow and Mermaid chunk split
- 2026-03-12: added graph visual issues, completed Phase 2 items
- 2026-03-17: completed items update, E2E root Vitest conflict added
- 2026-03-26: session 15 — dead code/UI/sidebar/spec-index completed items