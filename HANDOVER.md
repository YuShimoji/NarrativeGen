# 作業申し送り

## 最終更新

- **日時**: 2026-06-22
- **ブランチ**: `main`（trunk-based）
- **HEAD**: `4d2919bed87ec053749c23bb825d76f8e5c7cd88` (`feat: persist ai adoption in save slots`)
- **直近**: Web Tester の AI mock adoption は JSON export/import と SaveManager slot save/load の両方で永続化確認済み。`vertical-slice.json` の `drafting -> adopt_ai_drafting_1 -> ai_adopted_drafting_1` が page reload 後の slot load でも到達可能。
- **repo authority 注意**: `origin/HEAD` はまだ `origin/open-ws/engine-skeleton-2025-09-02` を指す可能性がある。作業正本は `main` / `origin/main`。
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
