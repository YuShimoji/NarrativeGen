# 作業申し送り

## 最終更新

- **日時**: 2026-06-15
- **ブランチ**: `main`（trunk-based）
- **直近**: Agent 指示リセット。`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` を薄い入口に戻し、通常再開の運用正本を `docs/REPO_LOCAL_RULES.md` に分離。`docs/ai/*.md` は v20 相当に更新し、毎回全文読ませる正本ではなく必要 gate の参照先に降格。
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
- **今回のローカル検証**: `git diff --check`、`npm run check:safety`、`npm run build:engine`、`npm run build:tester`、`npm run validate`、`npm run test:engine`、`npm run test -w @narrativegen/engine-ts -- test/vertical-slice.spec.ts`、`npm run test:e2e -- apps/web-tester/tests/e2e/new-model-workflow.spec.js --project=chromium --grep "vertical-slice"`、Browser smoke（`vertical-slice.json` から proof ending 到達）

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

1. **Playable vertical slice 継続**: `vertical-slice.json` を基準に AI mock 採用 UI と save/load 再読込のブラウザ導線を接続
2. **CSV import 正本化**: 現行 CSV manager の `modelType`/schema/initial state 欠落と legacy handler との二重経路を診断し、縦切り CSV の import を正常経路へ寄せる
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
