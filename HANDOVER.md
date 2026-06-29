# 作業申し送り

## 最終更新

- **日時**: 2026-06-30
- **ブランチ**: `main`（trunk-based）
- **HEAD**: `main` after the story-packet generator specimen slice; run `git log -1 --oneline` after pull for the exact sync commit. Structured-output baseline before this slice: `0efdf4ad78c56da69ff6c2f9df8d93f93d79f16e` (`feat: structure mock generator continuation output`).
- **直近**: generated specimen builder が current node / route / choices / state / story pressure / constraints を含む story packet を `MockAIProvider.generateContinuationProposal` に渡し、mock proposal が packet facts を反映するようにした。
- **repo authority 注意**: `origin/HEAD` は `origin/main`。作業正本は `main` / `origin/main`。
- **ロードマップの正**: `docs/plans/DEVELOPMENT_PLAN.md`

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルを JSON 形式で定義し、TypeScript エンジンで実行、Web UI でプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  packages/backend/      # Express REST API (port 3001)
  packages/sdk-unity/    # Unity C# SDK (UPM パッケージ形式)
  packages/tests/        # C# ユニットテスト (.NET 9)
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル + JSON スキーマ
  docs/                  # 仕様書・プラン・ガバナンス
```

## 現在の状態

### 2026-06-30 Story packet generator specimen

- **Work purpose**: make the generated-specimen path inspectable as input packet -> structured proposal -> model adoption, without adding OpenAI/local LLM work, CSV schema fields, Web Tester UI redesign, or core engine transition changes.
- **Effect**: `StoryContext` now accepts an optional bounded `storyPacket` with current node, route history, visible/gated choices, flags/resources/variables, story pressure, and generation constraints. `MockAIProvider.generateContinuationProposal` deterministically reflects route, current node, evidence, gated choices, story pressure, and preferred target in its proposal text/choice wording while `generateNextNode` stays text-compatible.
- **Builder boundary**: `apps/web-tester/scripts/build-generated-specimen.mjs` builds the packet at `drafting` after `open_notebook -> draft_scene`, passes it into the provider, and writes `story_packet`, `story_packet_summary`, `generator_provided`, `builder_added`, and `validation_adjusted` into the trace/readback/review artifacts.
- **Active artifacts**: start from `docs/samples/generated-specimen-review-ja.md`; use `docs/samples/generated-specimen-readback.md` for detailed trace and `docs/samples/generated-specimen-route-trace.json` for machine readback. `docs/samples/generated-specimen-model.json` remains route-playable to `truth_end`.
- **Validation for this slice**: `npm run build:engine`, `npm run test -w @narrativegen/engine-ts` (22 files / 276 tests), `npm run build:generated-specimen -w @narrativegen/web-tester`, `npm run check:generated-specimen -w @narrativegen/web-tester`, `npm run check:safety`, `npm run build:tester`, and the focused Chromium E2Es for AI adoption, authoring sample CSV roundtrip, and vertical-slice CSV roundtrip passed.
- **Next entry points**: add a non-mock provider adapter for the packet contract, enrich the packet only where evidence needs it, or return to SP-DTYARN continuation. Keep claims bounded: this is story-packet-aware mock evidence, not real AI quality acceptance.

### 2026-06-29 Structured generator output specimen

- **Work purpose**: reduce the previous generated-specimen warning that the script supplied all choice/effect glue, without changing OpenAI, local LLM, CSV schema, Web Tester UI, or core transition semantics.
- **Effect**: `MockAIProvider.generateContinuationProposal` now returns a deterministic structured continuation packet: generated node id hint, generated text, one follow-up choice id/text, target id, and an `addResource evidence +2` effect. `generateNextNode` remains compatible and still returns text only.
- **Builder boundary**: `apps/web-tester/scripts/build-generated-specimen.mjs` now adopts the provider proposal for the generated node's follow-up choice/effect and records `generator_provided`, `builder_added`, and `validation_adjusted` in the route trace, readback, and Japanese review surface. The source adoption choice from `drafting` remains explicit builder scaffolding.
- **Active artifacts**: `docs/samples/generated-specimen-review-ja.md` is still the human review entrypoint; `docs/samples/generated-specimen-readback.md` and `docs/samples/generated-specimen-route-trace.json` now show the structured proposal and ownership boundary. `docs/samples/generated-specimen-model.json` remains route-playable to `truth_end`.
- **Validation for this slice**: `npm run build:engine`, `npm run test -w @narrativegen/engine-ts` (22 files / 275 tests), `npm run build:generated-specimen -w @narrativegen/web-tester`, `npm run check:generated-specimen -w @narrativegen/web-tester`, `npm run check:safety`, `npm run build:tester`, and the focused Chromium E2Es for AI adoption, authoring sample CSV roundtrip, and vertical-slice CSV roundtrip passed.
- **Next entry points**: pass a richer story packet into the structured mock generator, broaden structured output beyond mock-only evidence, or return to SP-DTYARN continuation. Keep future claims honest: this is structured mock evidence, not real AI quality acceptance.

### 2026-06-29 Terminal handover sync after generated specimen

- **Restart authority**: `main` is current and pushed. The generated-specimen feature baseline before this handover sync was `4f14bfb7b12b928a354cc4a60c08b2b554d8277a` (`feat: add generator specimen review pack`); after pull, use `git log -1 --oneline` and `git rev-list --left-right --count "HEAD...origin/main"` to confirm the latest sync commit and parity.
- **Current shipped state**: the authoring sample review surfaces are sufficient for broad overview, and the first generated story specimen now exists. Start human review from `docs/samples/generated-specimen-review-ja.md`; use `docs/samples/generated-specimen-readback.md` for exact route steps and `docs/samples/generated-specimen-route-trace.json` for machine trace.
- **Resume path**: from a fresh terminal run `git fetch origin --prune` then `git pull --ff-only origin main`; inspect `docs/samples/generated-specimen-review-ja.md`; regenerate/check with `npm run check:generated-specimen -w @narrativegen/web-tester`.
- **Last validation package before this handover**: `npm run build:engine`, `npm run check:generated-specimen -w @narrativegen/web-tester`, `npm run test -w @narrativegen/engine-ts`, `npm run check:authoring-readback -w @narrativegen/web-tester`, `npm run check:safety`, `npm run build:tester`, `npm run test -w @narrativegen/web-tester`, `npm run lint:engine`, and the three focused Playwright regressions for AI adoption, authoring CSV roundtrip, and vertical-slice CSV roundtrip passed.
- **Preserved boundary**: no stash entries were applied. Stashes remain historical/local context only; do not apply them unless a future user explicitly promotes that work.
- **Next entry points**: structured generator output for one choice/effect pair, richer story packet input to `generateNextNode`, or SP-DTYARN continuation. Keep generated specimen review centered on concrete story output rather than returning to authoring-sample polish.

### 2026-06-28 Generated specimen review pack

- **Work purpose**: close the review-surface improvement loop and return to the main generator question: whether NarrativeGen can produce one concrete, human-reviewable story specimen.
- **Generator path used**: `MockAIProvider.generateNextNode` from `packages/engine-ts/src/ai-provider.ts`, executed by `npm run build:generated-specimen -w @narrativegen/web-tester` after the `vertical-slice.json` route reaches `drafting` through `open_notebook -> draft_scene`.
- **Active generated artifact**: `docs/samples/generated-specimen-model.json` adds `generated_specimen_continuation` to the vertical-slice graph. The review route is `open_notebook -> draft_scene -> adopt_generated_specimen -> connect_generated_specimen_archive -> decode_ledger -> publish_with_proof`.
- **Review surface**: `docs/samples/generated-specimen-review-ja.md` is the primary human review surface; `docs/samples/generated-specimen-readback.md` is the detailed technical trace; `docs/samples/generated-specimen-route-trace.json` is the machine trace.
- **Readability assessment**: the specimen is concrete and route-playable, but still mock/formulaic. The generated text supplies a reachable archive clue; the script supplies the choice/effect glue that connects it to the existing proof route.
- **Next minimal improvement candidates**: make generator output structured enough to propose one choice/effect pair, pass a richer story packet into `generateNextNode`, or keep this specimen as the baseline while returning to SP-DTYARN continuation. No stash entries were applied.

### 2026-06-28 Authoring sample review entrypoint consolidation

- **Work purpose**: remove the artifact-identity trap where a user naturally opens `docs/samples/authoring-sample-readback.md` and misses the visual review pack in `docs/samples/authoring-sample-review-ja.md`.
- **Primary opening order**: start with `docs/samples/authoring-sample-review-ja.md` for human review, then use `docs/samples/authoring-sample-readback.md` for detailed technical route trace, `docs/samples/authoring-sample-route-trace.json` for machine trace, and `docs/samples/authoring-sample-logic-audit.md` for audit history.
- **Effect**: README, HANDOVER, and the generated readback now distinguish the primary human review surface from the technical readback. `authoring-sample-review-ja.md` also declares itself as the primary human review surface.
- **Pattern note**: future samples should declare four roles explicitly: primary review surface, detailed trace, machine trace, and audit note. This keeps human review from defaulting to route-log archaeology.
- **Next possible axes**: bounded human narrative review, small wording polish if the review pack exposes rough fixture language, SP-DTYARN continuation, or broader CSV/JSON parity. No stash entries were applied.

### 2026-06-28 Authoring sample visual review pack

- **Work purpose**: strengthen the authoring sample review surface beyond prose and bullet lists, so branch structure, appearing elements, state variables, and source-backed place relations are visible at a glance.
- **Artifact strategy**: kept `docs/samples/authoring-sample-review-ja.md` as the core review surface and expanded it in place, rather than adding more sidecar files, because this preserves the existing Japanese entry point and avoids review-pack fragmentation.
- **Effect**: the brief now includes a Mermaid branch map, entity registry, state-variable registry, place/relation diagram, place relation table, and a short review-pack pattern note for future samples.
- **Map decision**: no full geographic map was created. The source supports community room, mailbox, wall/poster, stage, and door as places or spatial anchors, but does not support exact distance, direction, or containment for every relation; the artifact therefore uses a grounded relation diagram/table instead of inventing geography.
- **Pattern judgment**: this is partly an authoring-sample-local fix, but the underlying gap is systemic for future sample review surfaces. Future review packs should include story brief, route overview, entity/item registry, state-variable registry, place/relation registry, and optional visual branch map.
- **Next possible axes**: bounded human narrative review, small wording polish if the review pack exposes rough fixture language, SP-DTYARN continuation, or broader CSV/JSON parity. No stash entries were applied.

### 2026-06-28 Authoring sample Japanese review brief

- **Work purpose**: add a Japanese bounded human-review surface so the authoring sample can be inspected without machine-translation decoding or reverse-engineering model fields first.
- **Artifact**: `docs/samples/authoring-sample-review-ja.md` summarizes premise, actors, state variables, route meanings, CSV authoring semantics, bounded review questions, and non-goals in Japanese.
- **Use**: this is now the recommended surface for the next bounded human narrative observation. It asks for fixture suitability, route clarity, state-change meaning, and wording roughness only; it is not production prose acceptance, a full localization pass, or final narrative canon.
- **Source grounding**: the brief is sourced from `docs/samples/authoring-sample-readback.md`, `docs/samples/authoring-sample-route-trace.json`, `docs/samples/authoring-sample-logic-audit.md`, and `models/spreadsheets/authoring-sample.csv`.
- **Next possible axes**: bounded human narrative review, small wording polish if the brief exposes rough fixture language, SP-DTYARN continuation, or broader CSV/JSON parity. No stash entries were applied.

### 2026-06-28 Authoring sample semantic readback clarity

- **User observation**: the readback was syntactically interpretable but semantically hard to read; the opening Model Capsule made the artifact feel like decoded structure rather than a coherent story specimen.
- **Work purpose**: make `docs/samples/authoring-sample-readback.md` human-readable before model-readable, without changing CSV columns, engine semantics, Web Tester UI, fixture routes, SaveManager, AI, Unity, graph, local LLM, or sample-browser scope.
- **Effect**: the generated readback now opens with a Story Brief, a "What Appears / What Changes" section, route overview, and authoring-semantics explanation before the detailed deterministic route trace.
- **Technical state**: `apps/web-tester/scripts/build-authoring-sample-readback.mjs` owns the new Markdown order; `docs/samples/authoring-sample-route-trace.json` did not change because route execution data stayed stable.
- **Review position**: bounded human narrative review is now more useful because the artifact first explains who appears, what changes, and why each route matters. Broad prose-quality review remains optional and separate.
- **Next possible axes**: bounded human narrative review, small wording polish if the readback still exposes awkward fixture prose, SP-DTYARN continuation, or broader CSV/JSON parity. No stash entries were applied.

### 2026-06-28 Authoring sample bounded fixture fix

- **Work purpose**: close the bounded warnings from `docs/samples/authoring-sample-logic-audit.md` without widening into schema, engine, UI, SaveManager, AI, Unity, graph, local LLM, or sample-browser work.
- **Effect**: `models/spreadsheets/authoring-sample.csv` now makes `energy` consequential by requiring `energy >= 1` for `publish_manifesto`, replaces the shortcut-like `skip_to_stage` route with `start_without_proof`, and keeps the same compact success/failure fixture shape.
- **Readback state**: `docs/samples/authoring-sample-readback.md` and `docs/samples/authoring-sample-route-trace.json` were regenerated with four selected routes, including `partial-proof-return-route` for `check_mailbox -> return_to_stage -> host_quiet_circle`.
- **Audit conclusion**: the previous automated warnings for resource causality, shortcut feel, and untraced partial return are resolved. Human review is now useful only if bounded to fixture suitability, route clarity, and wording polish; broad prose-quality review remains optional and separate.
- **Next possible axes**: bounded human narrative review from the readback plus audit, SP-DTYARN continuation, or broader CSV/JSON parity. No stash entries were applied.

### 2026-06-26 Authoring sample story readback

- **Work purpose**: make the `Sample CSV` authoring fixture inspectable as a small story capsule instead of relying only on green E2E evidence.
- **Readback artifacts**: `docs/samples/authoring-sample-review-ja.md` is the current human review entrypoint; `docs/samples/authoring-sample-readback.md` is the detailed route readback; `docs/samples/authoring-sample-route-trace.json` is the deterministic machine trace behind it.
- **What it proves**: `models/spreadsheets/authoring-sample.csv` loads through the canonical CSV parser, validates through the engine model loader, traverses three selected routes, records visible and gated choices, effects, state changes, node sequences, and endings, and confirms speaker, multiline prose, `settings.presentation`, publish conditions, and key effects survive CSV export/re-import.
- **Regenerate or inspect**: run `npm run build:authoring-readback -w @narrativegen/web-tester` to refresh both generated trace artifacts, or `npm run check:authoring-readback -w @narrativegen/web-tester` to fail on drift. Open `docs/samples/authoring-sample-review-ja.md` for human review first; use the readback and JSON trace when a future change needs exact route/state assertions.
- **Still deferred**: a broader CSV sample browser, broader CSV/JSON parity, SP-DTYARN continuation, and narrative quality review remain separate slices. The current readback is automated evidence, not a human prose-quality acceptance.

### 2026-06-26 Terminal handover sync after CSV sample access

- **Restart authority**: current branch is `main`, active remote authority is `origin/main`, and the latest pushed work before this sync is `b4c77c911f4fd96cb10527e934212c103580ac13` (`feat: surface spreadsheet authoring sample`). `HEAD...origin/main` was `0 0` before adding this docs-only sync entry.
- **Current shipped state**: Web Tester now exposes `authoring-sample.csv` through the toolbar `Sample CSV` button, using the existing CSV parser/validation/session commit path. The authoring sample fixture, CSV export/re-import roundtrip, vertical-slice CSV roundtrip, and AI adoption E2Es were green before this handover sync.
- **Resume path**: from a fresh terminal run `git fetch origin --prune` then `git pull --ff-only origin main`; start Web Tester with `npm run dev`; click `Sample CSV`; play `Check the mailbox -> Pin the poster -> Invite Mara to the stage -> Publish the launch plan -> Open the doors`; use existing CSV export/import for roundtrip review.
- **Preserved boundary**: no stash entries were applied, no branch authority settings were touched, and no schema/engine/AI/Unity/SaveManager/graph semantics changed. This entry only captures the terminal handoff context in project history.
- **Next entry points**: a broader sample browser, focused CSV/JSON parity expansion, non-model CSV helper cleanup, or SP-DTYARN continuation remain separate slices.

### 2026-06-26 Web Tester CSV sample access

- **Work purpose**: make the writer-facing `authoring-sample.csv` discoverable from Web Tester without requiring a repo file search.
- **Access decision**: adding a full CSV sample selector would create a new sample-management pattern, but a toolbar-level `Sample CSV` button is low-risk because it uses the existing `parseCsvModel()` / validation / session commit path and leaves the JSON sample selector unchanged.
- **Writer path**: start Web Tester, click `Sample CSV`, play `Check the mailbox -> Pin the poster -> Invite Mara to the stage -> Publish the launch plan -> Open the doors`, then use the existing CSV export/import flow for roundtrip review.
- **Validation owner**: `apps/web-tester/tests/e2e/authoring-sample-csv-roundtrip.spec.js` now starts from the visible `Sample CSV` access path before export/re-import and route replay.
- **Still deferred**: a broader sample browser, CSV/JSON parity expansion, and non-model CSV helper cleanup remain separate slices.

### 2026-06-26 Spreadsheet authoring sample fixture

- **Work purpose**: add a small writer-facing CSV fixture that exercises the compact spreadsheet schema outside the larger vertical-slice sample.
- **Effect**: `models/spreadsheets/authoring-sample.csv` now demonstrates first-row presentation settings, two speakers, multiline node prose, initial flags/resources/variables, a flag/resource-gated choice, effects that change flags/resources/variables, and three endings. The fixture stays on the existing canonical CSV header and JSON-in-cell choice shape.
- **Play route**: import the CSV in Web Tester, then choose `Check the mailbox -> Pin the poster -> Invite Mara to the stage -> Publish the launch plan -> Open the doors` to reach `launch_end`. The gated publish choice depends on `poster_ready=true` and `proof>=2`.
- **Validation owner**: `apps/web-tester/tests/e2e/authoring-sample-csv-roundtrip.spec.js` imports the fixture, exports CSV, re-imports the exported file, checks speaker/multiline/settings/condition/effect parity, and replays the launch route.
- **Still deferred**: broader CSV/JSON parity, extra Web Tester sample-list UX for spreadsheet files, and legacy non-model CSV helpers remain separate slices.

### 2026-06-25 Terminal handover sync

- **Restart authority**: after this handover-sync slice, the current branch is `main`, the active remote authority is `origin/main`, and a fresh terminal should start with `git fetch origin --prune && git pull --ff-only origin main`.
- **Current shipped state**: playable vertical slice, AI mock adoption persistence, canonical CSV import/export, CSV fixture parity, multiline CSV text preservation, and legacy Web Tester `CsvManager` cleanup are all preserved in project history and documented in this file.
- **Most recent pushed work before this sync**: `550aaac14ad8134be6f3c8186bff164e4388f67e` (`chore: consolidate web tester csv paths`). This sync entry only refreshes handover context so another terminal can resume without reconstructing thread state.
- **Canonical CSV ownership**: model CSV import is `#csvFileInput` -> preview -> `parseCsvModel()`; direct CSV export and generic `CsvFormatter` both use `formatCsvModel()`. Non-model CSV report helpers remain intentionally separate.
- **Known repo debt**: superseded by the 2026-06-26 repo authority cleanup entry below; `origin/HEAD` now points at `origin/main`. Stash entries from earlier work remain intentionally untouched.
- **Next entry points**: focused CSV/JSON parity expansion, spreadsheet authoring fixture exploration, or SP-DTYARN continuation.

### 2026-06-26 Repo authority origin/HEAD cleanup

- **Work purpose**: remove the recurring branch authority mismatch where GitHub/default remote HEAD pointed at `open-ws/engine-skeleton-2025-09-02` while active development used `main`.
- **Action taken**: verified `main` was in sync with `origin/main`, confirmed GitHub default branch was still the old `open-ws` branch, changed the repository default branch to `main` with `gh repo edit --default-branch main`, then refreshed the local symbolic ref with `git remote set-head origin -a`.
- **Final authority state**: `gh repo view --json defaultBranchRef` reports `main`, `git remote show origin` reports `HEAD branch: main`, and `git symbolic-ref refs/remotes/origin/HEAD` reports `refs/remotes/origin/main`.
- **Preserved boundary**: no branches were deleted, no force-push/rebase/reset was used, stash entries were untouched, and no story/CSV/Web Tester files changed.
- **Validation**: `npm run check:safety` and focused CSV roundtrip E2E passed after the authority change.

### 2026-06-25 Legacy CSV path cleanup

- **Work purpose**: remove the disconnected Web Tester `CsvManager` path now that model CSV import/export/multiline roundtrip is owned by canonical utilities.
- **Effect**: the old `apps/web-tester/src/ui/csv.js` manager, its `main.js` construction, null modal initialization, stale `csvImportModal`/`csvExportModal` bindings, and the obsolete export-modal comment were removed. The deleted manager depended on DOM IDs that no longer exist and carried a duplicate line-oriented parser/exporter that could flatten multiline prose.
- **Canonical ownership after cleanup**: model CSV import is `#csvFileInput` -> preview -> `parseCsvModel()` in `apps/web-tester/src/utils/model-csv-import.js`; the direct CSV export button and generic `CsvFormatter` both use `formatCsvModel()` in `apps/web-tester/src/utils/model-csv-export.js`. `exportCsv()` in `file-utils.js` remains for non-model CSV reports, and lexicon/hierarchy CSV helpers remain intentionally separate.
- **Still deferred**: `origin/HEAD` cleanup, broader CSV/JSON parity, and spreadsheet authoring fixture exploration remain separate slices.

### 2026-06-25 CSV multiline text preservation

- **Work purpose**: make CSV a safer writer-facing authoring surface for paragraph prose by preserving standard quoted multiline text through import, export, and re-import.
- **Effect**: `parseCsv` now reads records rather than physical lines, quoted CRLF/CR text is normalized to `\n`, and CSV export keeps node text newlines inside quoted cells instead of flattening prose to spaces. The file preview uses the same record parser, so multiline rows no longer fragment before import.
- **Fixture and proof**: `models/spreadsheets/vertical-slice.csv` now carries a paragraph break in the `desk` node text while the proof route and existing speaker/settings parity remain intact. Focused E2E asserts the imported model text, the exported quoted multiline cell, the re-imported model text, and the route to `truth_end`.
- **Still deferred**: legacy `CsvManager` audit, `origin/HEAD` cleanup, broader CSV/JSON parity, and any non-model CSV utilities remain separate repo debt.

### 2026-06-25 CSV fixture parity

- **Work purpose**: make `models/spreadsheets/vertical-slice.csv` itself carry the small parity fields that the CSV importer/exporter already understood: node `speaker` and first-row `settings_presentation`.
- **Effect**: the canonical CSV fixture now imports with `mira.speaker = "Mira"` and `settings.presentation = { defaultTransition: "append-scroll", paragraphDelay: 60, transitionDuration: 180 }`. Exporting that imported model writes the same canonical columns, and re-importing the exported CSV preserves those meanings.
- **Preserved contract**: CSV fixture -> Web Tester import -> CSV export -> exported CSV re-import keeps `modelType`, `startNode`, initial flags/resources/variables, choice conditions/effects, `speaker`, and first-row presentation settings while the proof route still reaches `truth_end`.
- **Still deferred**: legacy `CsvManager` audit and `origin/HEAD` cleanup remain separate repo debt; broader JSON/CSV parity should stay opt-in and small.

### 2026-06-25 CSV export/roundtrip

- **Work purpose**: close the smallest writer-facing CSV loop: import `models/spreadsheets/vertical-slice.csv`, export the active Web Tester model as CSV, re-import that exported CSV, and still reach the proof ending.
- **Effect**: the dedicated CSV export button now downloads a canonical compact CSV instead of delegating to the disconnected legacy export modal. The generic export formatter and the CSV button share `apps/web-tester/src/utils/model-csv-export.js`, so one serializer owns column order and quoting.
- **Roundtrip contract**: exported CSV preserves node id/text, choices JSON, targets, choice conditions/effects, `modelType`, `startNode`, and first-row initial flags/resources/variables. The CSV importer also accepts optional `speaker` and first-row `settings_presentation` columns, so JSON-origin models that carry those fields can keep them through CSV export/import.
- **Known semantic boundary**: `models/spreadsheets/vertical-slice.csv` carries `speaker`, first-row `settings_presentation`, and quoted multiline model text; legacy `CsvManager` and non-model CSV utilities remain outside this compact roundtrip contract.
- **Validation**: `npm run check:safety`, `npm run build:tester`, `npm run test -w @narrativegen/web-tester`, `npm run test:e2e -- apps/web-tester/tests/e2e/vertical-slice-csv-import.spec.js --project=chromium`, `npm run test:e2e -- apps/web-tester/tests/e2e/vertical-slice-ai-adoption.spec.js --project=chromium`, and `npm run test:e2e -- apps/web-tester/tests/e2e/vertical-slice-csv-roundtrip.spec.js --project=chromium` passed.

### 2026-06-25 CSV import/schema canonicalization

- **作業目的**: `models/spreadsheets/vertical-slice.csv` を writer-facing companion のまま Web Tester の通常 CSV import 経路で schema-valid な playable model に変換し、proof route まで到達できるようにした。
- **効果**: `id,text,choices` の JSON-in-cell CSV と従来の `node_id,node_text,choice_*` CSV の両方を `apps/web-tester/src/utils/model-csv-import.js` で canonical model に正規化。CSV ボタンは実ファイル選択 -> preview -> import に接続され、validation error がある model は適用前に停止する。`vertical-slice.csv` には初期 `flags/resources/variables` を追加し、CSV 単体で `focus=2` / `evidence=0` / `lead_name` / `draft_status` を復元できる。
- **検証**: parser 直実行で 12 node / `startNode=desk` / `decode_ledger` conditions/effects を確認し、engine 直実行で `open_notebook -> interview_mira -> ask_key -> decode_ledger -> publish_with_proof` が `truth_end` 到達。`npm run test -w @narrativegen/engine-ts -- test/vertical-slice.spec.ts`、`npm run check:safety`、`npm run build:tester`、`npm run test:e2e -- apps/web-tester/tests/e2e/vertical-slice-csv-import.spec.js --project=chromium`、`npm run test:e2e -- apps/web-tester/tests/e2e/vertical-slice-ai-adoption.spec.js --project=chromium`、`git diff --check` は pass。
- **残り**: CSV import は閉じた。CSV export/roundtrip と checked-in companion CSV の `speaker` / `settings.presentation` parity も閉じた。必要なら次スライスで multiline CSV parser 方針か legacy CsvManager audit を決める。

### 2026-06-22 Web Tester AI mock adoption slot persistence

- **作業目的**: AI mock adoption 後の mutable model が Web Tester の SaveManager slot save/load 経路でも保持されるかを、playable vertical slice 上で確認する。
- **効果**: slot save data に model snapshot を含め、page reload 後の slot load でも `drafting -> adopt_ai_drafting_1 -> ai_adopted_drafting_1` が到達可能になった。JSON export/import だけでなく、Web Tester 内の通常保存ループでも採用済み node/choice が残る。
- **要件**: 既存 `truth_end` proof route と JSON export/import adoption route を壊さない。保存データに invalid model snapshot がある場合は正常経路扱いしない。CSV import/schema、AI provider 追加、graph UI、Unity、大規模 refactor には広げない。
- **状態**: `apps/web-tester/src/features/save-manager.js` が save data に model snapshot を保存し、slot load 時に model/session/story UI を復元する。`apps/web-tester/tests/e2e/vertical-slice-ai-adoption.spec.js` に slot save/load 後の adoption 到達確認を追加し、Chromium focused E2E で proof route、JSON reload route、slot reload route の 3 件が Pass。
- **owner**: Web Tester slot persistence は assistant-owned。CSV import/schema canonicalization と origin/HEAD 不一致 cleanup は別スライス候補。
- **next move**: 次回は CSV import/schema canonicalization を縦切り CSV に寄せるか、SaveManager の旧 slot 互換/auto-save 経路を必要に応じて追加検証する。

### 2026-06-15 Web Tester AI mock adoption 導線

- **作業目的**: Web Tester の AI mock 生成を一時表示から、実際の model node/choice として採用できる導線へ寄せる。
- **効果**: `vertical-slice.json` の `drafting` など現在ノードから `ai_adopted_<node>_<n>` を `model.nodes` に追加し、`adopt_ai_<node>_<n>` choice で到達可能にする。既存 choice は上書きしないため proof route は保持される。
- **要件**: API キー不要の mock provider を対象にし、採用後の model validation error は正常経路にしない。JSON export/import 後も追加 node と choice が残ることを Playwright で確認する。
- **状態**: `apps/web-tester/src/app-controller.js` で AI 生成ボタンを model adoption に結線。focused E2E `vertical-slice-ai-adoption.spec.js` で proof route、mock adoption、JSON 保存、ページ reload 後の JSON 再読込、追加 choice 到達を確認。
- **owner**: Web Tester AI mock adoption は assistant-owned。CSV import/schema 正本化、slot save/load の model 永続化確認、origin/HEAD 不一致の repo authority cleanup は次スライス候補。
- **next move**: 次回は CSV import/schema canonicalization を縦切り CSV に寄せるか、slot save/load が mutable model を保持するかをブラウザ導線で確認する。

### 2026-06-15 Playable first 縦切り正本化

- **作業目的**: 旧方針の Green first をいったん止め、実際に遊べる story generation/playback の縦切りを開発判断の正本にする。
- **効果**: `models/examples/vertical-slice.json` を Web Tester から選べる 12 node の canonical playable sample とし、`models/spreadsheets/vertical-slice.csv` を writer-facing companion artifact として追加。proof route は `Open the old notebook` -> `Interview Mira` -> `Ask Mira for the archive key` -> `Spend focus to decode the ledger` -> `Publish with proof`。
- **要件**: この縦切りは開始ノード、2系統以上の分岐、flag/resource/variable、条件付き選択肢、3 endings、mock AI adoption 相当の接続余白を含む。実装判断では playable route の成立を先に見る。
- **状態**: engine acceptance で JSON load、静的到達性、proof/under-evidenced/mock-adoption routes、dynamic text、JSON save/reload、mock provider generated node adoption、CSV readability を固定。Web Tester sample と Playwright smoke を追加。GUI 編集開始時の元モデル保存 import 漏れも修正し、Browser smoke で `vertical-slice.json` -> proof ending 到達と console warn/error なしを確認。
- **owner**: canonical vertical slice と acceptance は assistant-owned。AI UI の生成ボタン結線、CSV import の schema 準拠、slot save/load のブラウザ手動確認は次スライスで assistant-owned にできる。
- **next move**: 次回は UI 側の構造破断を縦切りに従属させて直す。優先は `generateNextNodeUI()` の未結線/表示-only 経路を、mock provider の「生成 -> 採用 -> ノード追加 -> 選択肢接続 -> 保存 -> 再読込」導線に寄せること。

### 2026-06-15 Agent 指示リセット

- **作業目的**: project-local Agent 指示を新しい状態で始められるようにし、NLMYTGen 型の「薄い入口 + 短い repo-local rules + 現在状態は HANDOVER」構成へ寄せる。
- **効果**: `AGENTS.md` は入口ポインタ、`docs/REPO_LOCAL_RULES.md` は通常再開・ask hygiene・reporting・git/test follow-through、`HANDOVER.md` は現在状態、`docs/spec-index.json` は spec lifecycle という分担に整理。
- **要件**: 通常の AI 再開入口は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → `HANDOVER.md`。`README.md`、`docs/spec-index.json`、`docs/ai/*.md` はタスクで必要な範囲だけ読む。参照先が欠けている場合は stale とみなし、ブロッカーにしない。
- **状態**: レガシーな session-state / restart-roadmap / output-style / runtime-state の再作成は禁止。`.serena/` は ignored のツールキャッシュとして未追跡のまま扱う。
- **owner**: repo-local Agent 指示の整理は assistant-owned。次スライス選定、WritingPage 着手判断、NuGet 公開判断、UI/創作判断は human-owned または shared。
- **next move**: 次回実装に入る場合は `HANDOVER.md` の推奨候補から SP-DTYARN-001 または SP-009 を選び、該当 spec / checklist だけを読んで着手する。

### 2026-06-08 引き継ぎ

- **作業目的**: Codex thread 開始時の project-local モデル指定エラーをなくし、別端末が `main` から同じ状態で再開できるようにする。
- **効果**: `.codex/config.toml` の `model` / `approval_policy` / `sandbox_mode` 固定を削除。存在しない Claude hook を呼ぶ `.claude/settings.local.json` と重複した `.cursorrules` も削除。`.gitignore` で tool-local override を再追跡しない。
- **要件**: 現在の再開入口は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → `HANDOVER.md`。現在状態は `HANDOVER.md`、仕様状態は `docs/spec-index.json`、ロードマップは `docs/plans/DEVELOPMENT_PLAN.md`。
- **状態**: SP-UNITY-001 は `docs/spec-index.json` 上で done / 100%。`docs/specs/unity-sdk.md`、Unity SDK 実装、C# 回帰、NuGet pack メタデータは同じ変更セットに含まれる。
- **owner**: assistant-owned の repo-local 設定整理と Unity SDK 残差反映は完了。NuGet 公開判断、WritingPage 着手判断、手動ブラウザ聴取は human-owned。
- **next move**: 別端末では `git pull --ff-only origin main` 後、必要に応じて `npm run check:safety` と `dotnet test .\packages\tests\NarrativeGen.Tests` を実行し、次の実装候補は SP-DTYARN-001 または SP-009 UI 品質展開から選ぶ。

### CI・テスト

- **GitHub Actions**: `governance`（ルート `npm ci` + `check:spec-index` / `check:models-sync` / `check:encoding-safety`）、`engine-ts`、`web-tester`、`sdk-unity`（.NET 9）
- **engine-ts**: Vitest 264 件前後（`npm run test:engine`）
- **web-tester**: Vite 8 ビルド、`verify-export-formatters`
- **E2E**: Playwright（`apps/web-tester/tests/e2e`）
- **C#**: `packages/tests/NarrativeGen.Tests` で `dotnet test`
- **今回のローカル検証**: `git diff --check`、`npm run check:safety`、`npm run build:tester`、`npm run test -w @narrativegen/engine-ts -- test/vertical-slice.spec.ts`、`npm run test:e2e -- apps/web-tester/tests/e2e/vertical-slice-ai-adoption.spec.js --project=chromium`（proof route、JSON reload adoption、slot reload adoption の 3 件 Pass）

### 仕様書（spec-index.json）

- **エントリ**: 36 件（`SP-WP-001` 含む。`npm run check:spec-index` で検証）
- **partial**: SP-009、SP-TGEN-001、SP-DTYARN-001、SP-WP-001 ほか
- **SP-PLAY-001**: done（100%）
- **SP-PIPE-001**: done（デザイナパイプライン。WritingPage 連携は延期）

## 既知の課題

- E2E バッチで稀に失敗しうる（`play-immersion` AC-5 は `waitForFunction` で緩和。恒久対策は [#81](https://github.com/YuShimoji/NarrativeGen/issues/81)〜[#83](https://github.com/YuShimoji/NarrativeGen/issues/83) / `docs/tasks/FLAKY_ISSUES_TRACKER.md`）
- SP-PLAY-001: **done**（AC-9〜12 は `play-media-bgm-ac.spec.js` + 検証表で Pass）
- Dynamic Text の Yarn（SP-DTYARN-001）: `[entity]` / `[entity.prop]`・数値比較 `{?key op val:…}` まで。ネスト and/or・`[entity~]` 等は `docs/specs/dynamic-text-yarn-export.md` 参照
- リポジトリ内のソース配置は `**packages/`（小文字）** を正とする。Unity 側の埋め込み先は `**Packages/`**（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業

1. **CSV import 正本化**: 現行 CSV manager の `modelType`/schema/initial state 欠落と legacy handler との二重経路を診断し、縦切り CSV の import を正常経路へ寄せる
2. **SaveManager 補強確認**: 旧 slot 互換と auto-save 経路が必要なら、model snapshot 復元の focused E2E を追加する
3. **SP-DTYARN-001 継続**: 縦切りを壊さない範囲でネスト条件・`[entity~]` 等の仕様固定と実装
4. **SP-009 / Phase 8**: graph・debug・モーダルの a11y・レスポンシブ水平展開（`docs/plans/ui-a11y-responsive-issues.md`）

**スコープ外（ゲート通過まで）**: WritingPage 実装は `writingpage-io-contract.md` が No-Go の間は行わない。

## 実行ロードマップ（2026 Q2-Q4）

- 正本: `docs/plans/DEVELOPMENT_PLAN.md`
- **短期**: SP-DTYARN 継続、E2E/回帰の恒久運用、SP-009 Phase 8
- **中期**: a11y・レスポンシブ、回帰戦略、Dynamic Text / Yarn 境界の残タスク
- **長期**: WritingPage（ゲート Pass 後）、品質ゲート高度化、必要時の NuGet 公開判断（human-owned）

## 中期実装の更新点（2026-04）

- Web Tester a11y baseline（bootstrap + tabpanel/dialog スライス + `index.html` 追記）
- モバイル/タブレット baseline responsive（`main.css` / `play.css`）
- E2E runbook・flaky トラッカー
- SP-DTYARN-001 次段（YarnFormatter + verify-export-formatters）
- SP-UNITY-001 残差完了（C# createEvent runtime、expandTemplate 回帰、ローカル NuGet pack 準備）
- WritingPage I/O 契約と着手ゲート（No-Go 記録）

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run check:safety
npm run check:spec-index
npm run test:engine
npm run test:e2e
npm run build:all
npm run dev
# → http://localhost:5173/
```

C#:

```powershell
dotnet test .\packages\tests\NarrativeGen.Tests
```

---

技術的負債: `docs/TECHNICAL_DEBT.md`
E2E フレーク運用: `docs/operations/E2E_FLAKE_RUNBOOK.md`
依存・encoding 運用メモ: `docs/operations/DEPENDENCY_ENCODING_OPS.md`
変数/Yarn 手動回帰: `docs/checklists/MANUAL_REGRESSION_VARIABLE_YARN.md`
flaky 候補トラッカー: `docs/tasks/FLAKY_ISSUES_TRACKER.md`
画面別 a11y/レスポンシブチェック: `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`
WritingPage 準備仕様: `docs/specs/writingpage-io-contract.md`
spec-index レビュー例: `docs/operations/SPEC_INDEX_REVIEW_EXAMPLES.md` / `docs/governance/spec-change-review-examples.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）

## 次プラン策定前の整理（推奨）

1. `git fetch origin` し、`main` が `origin/main` と一致していること
2. `npm run check:safety`
3. オプション: `npm run test:engine` と代表 E2E（例: `npm run test:e2e -- tests/e2e/play-media-bgm-ac.spec.js --project=chromium`）
4. 未クローズの追跡: [Issues（flaky 系 #81〜#83）](https://github.com/YuShimoji/NarrativeGen/issues?q=is%3Aissue+is%3Aopen) と `docs/tasks/FLAKY_ISSUES_TRACKER.md`

Edge で BGM AC を追加検証するときは `apps/web-tester` で `set PW_EDGE=1` のうえ `npx playwright test tests/e2e/play-media-bgm-ac.spec.js --project=msedge`（Windows）。
