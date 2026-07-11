# 作業申し送り

## 現在地 — 2026-07-11

`main` / `origin/main` が開発正本。今回の再開では作業ツリーを先に保全確認し、リモートの 3 commits を `0b87c46` から `be5e874` へ fast-forward した。受信内容は workflow v21、cross-terminal handoff、handoff warning の正本化で、latest incoming head の [CI run 29089068765](https://github.com/YuShimoji/NarrativeGen/actions/runs/29089068765) は success。以後の正確な HEAD と同期状態は `git log -1 --oneline` と `git rev-list --left-right --count HEAD...origin/main` で確認し、最新 HEAD の自己参照値をこの文書へ固定しない。

プロダクトの survival check は `models/examples/vertical-slice.json`、現在の独自性レビュー対象は `models/examples/originality-spine-probe.json`。後者は Character Knowledge を node-triggered Perception Policy に接続し、旧式の choice effect 直書きより少ない authoring wiring でルート差を作る。機械検証では Dynamic Text / Entity-Property / Event / ConversationTemplate / Character Knowledge が同じ route で動くが、human の物語体験・GUI 感性確認は未完了。

今回の slice は新機能を増やすことではなく、最新状態を実機で再検証し、監修 AI が次の開発契約を作れる current snapshot と長期目標を固定する作業。検証中、新しい `check:docs-authority` が Git ignored の `.serena/` ローカルメモを repo authority と誤認して `check:safety` を落とす不具合を発見した。ローカルメモは削除せず、`.serena/` / `.codex/` を tool-local として除外する回帰テスト付き修正を入れた。

## 直近の配送と再開境界

| 再開時に必要な観点 | 保持した状態 |
|---|---|
| 位相 / 主レーン / スライス | `CLOSE` / repo sync + development readiness + supervising-AI handoff |
| 配送した効果 | ignored tool memory が safety gate を壊さない状態、stale な probe/spec/flake 説明の整合、proposed North Star と G0-G8 target ladder |
| 自動防止策 | `check:docs-authority` は repo 本体の正本・主要リンク・Markdown 名を検査しつつ `.serena/` / `.codex/` を除外。fixture は 3 件から 4 件へ増加 |
| remote baseline | incoming `be5e874` の CI は success。この slice の live validation は下表を正とし、最終 remote parity は closeout 時のコマンド出力で確認する |
| 次端末が最初に読むもの | `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書。長期分岐を作るときだけ `docs/plans/DEVELOPMENT_PLAN.md` の target ladder を追加確認 |
| 未確定論点 | probe の human 目視、choice availability と broader event generation の policy contract、Consequence Lens の macro direction。いずれも未承認の `proposed` |
| 触らない範囲 | WritingPage gate、Unity/publication、provider/API/auth/payment、依存一括更新、外部 Project Cockpit。明示した別 slice なしに再開しない |

## 開発可能性

| 面 | 2026-07-11 の実測 | 判断 |
|---|---|---|
| Git / 依存 | remote fast-forward 後に `npm ci` 成功、850 packages installed、`npm ls --depth=0` は exit 0 | lockfile どおりに開発再開可能 |
| 環境 | Node 24.13.0 / npm 11.6.2 / .NET SDK 10.0.204 | Node 20+ 要件を満たし、net9.0 tests も .NET 10 SDK で成功。ただし toolchain は未固定 |
| 構造診断 | doctor 25/25、spec index 36、docs-authority fixture 4/4、`check:safety` pass | 正本・リンク・文字コード・モデル複製の gate を再実行可能 |
| TypeScript / Web | engine lint、engine 26 files / 299 tests、tester export 68 checks / 17 models、engine/backend/tester build | engine と主要 Web/export path は開発可能。Web Tester lint 自体は未設定で明示的 skip |
| Browser | originality probe 2 scenarios x Chromium / Firefox / WebKit = 6 passed | sample-switch isolation、policy route、dashboard signal は3ブラウザで機械確認済み |
| Unity SDK core | net9.0 NUnit 32/32、SDK build | 定義済み runtime scope は検証済み。Character Knowledge / Perception Policy の直接 C# 評価と Unity Editor 目視は別 parity / human 工程 |
| Local Unity harness | Unity 6000.3.6f1 の `Assets/` / `ProjectSettings/` / `.meta` が untracked で存在 | 今回は保持し、tracked repo や remote evidence と混同しない。別 clone には移らない same-machine artifact |

spec lifecycle は 36 件中 `done` 32、`partial` 4。これは仕様台帳の状態であり、プロダクト全体の完成率ではない。残る `partial` は SP-009 (quality debt, 95%)、SP-DTYARN-001 (Yarn 変換, 68%)、SP-TGEN-001 (text pipeline, 94%)、SP-WP-001 (WritingPage contract, 90%)。SP-TGEN 本文に残っていた 85% 表記は index authority の 94% に合わせた。WritingPage は 90% でも外部 format gate が No-Go のため実装可能という意味ではない。

非ブロッカーの負債は、全依存の audit 43 件（critical 4 を含む）と production 13 件（moderate 11 / high 2 / critical 0）、toolchain 未固定、標準 `build:all` / CI の backend build 欠落、Web Tester lint 未設定、Vite chunk / browser `fs` warning、GitHub Actions runtime warning、Unity nullable warning。依存・action upgrade は hard stop を跨ぐため専用の security/toolchain `IMPLEMENT` slice と human approval が必要で、今回自動修正していない。

現在の trust assessment は、tracked source・model・tests・build・canonical docs は trusted、probe の主観的な物語/UI 判定は needs human review、untracked Unity harness は same-machine evidence のみ。危険または rollback 候補の tracked change は確認していない。

残作業の実行契約は次のとおり。

- **Originality baseline 目視**: 目的は機械成功と実体験の差を閉じ、次の policy 比較に使う基準を固定すること。必要物は既存 review surface とローカル Web Tester、状態は未実施、judgment owner は user。`npm run dev` で両 route と Designer Dashboard を一括確認し、pass または具体的 defect を返す。
- **Policy frontier**: 目的は Character Knowledge を node 到着後だけでなく choice availability か broader event generation へ接続し、重複 wiring を減らすこと。状態は `proposed`、assistant が比較 evidence を作り user が高位方向を決める。次は実装ではなく G1 `EXPLORE` packet で model shape、timing、idempotency、player signal、authoring delta を比較する。
- **Security / release readiness**: 目的は「ローカルで動く」から再現可能な versioned consumption へ進むこと。audit 方針、dependency upgrade、toolchain pin は未承認、owner は shared。次は production findings と supported toolchain を一つの専用 slice として再評価し、backend build / real Web lint / negative import-export を標準 gate へ入れる契約を作る。
- **外部 path**: WritingPage、public Unity/package、Pages/Wiki cockpit はそれぞれ外部 format、公開、maintenance ownership を必要とする。状態は `hold (conditional)`、owner は user。gate が開くまでは通常の次候補へ戻さない。

## 今回固定した協働契約

- 監修 AI は `EXPLORE / PROTOTYPE / IMPLEMENT` を明示し、1 Prompt で一つの outcome、今の bottleneck、正本 anchor、境界、受入シグナル、未決の高位判断を渡す。ファイル単位の手順列にはしない。
- `IMPLEMENT` を受けた開発 AI は、同期、分解、実装、直接関係する修正、狭い検証から必要範囲への拡張、正本更新、commit/push まで連続して所有する。
- 停止は破壊的操作、依存追加・重要 upgrade、DB/auth/public API 契約、spec/invariant 衝突、外部公開、結果を大きく変える未決の創造方向だけ。routine な継続許可は求めない。
- 高主観な UI・レイアウト・言語・色・font・motion・content では、先に異質な 2-4 方向を比較する。選択は通常 spec/prototype 詳細化の承認で、`IMPLEMENT` packet が最終 gate と明示した場合だけ実装承認を兼ねる。実装承認後は評価軸を固定し、一つの縦切りと一回の acceptance bundle でレビューする。
- 同種の微修正が 3 巡したら polish を続けず、情報設計または方向選択へ戻る。
- status はこの current snapshot に上書きし、時系列ログを追記しない。履歴は Git に任せる。

詳細は `docs/REPO_LOCAL_RULES.md`、`docs/ai/WORKFLOWS_AND_PHASES.md`、`docs/OPERATOR_WORKFLOW.md`、`docs/INTERACTION_NOTES.md`。継続要求は `docs/USER_REQUEST_LEDGER.md` に固定した。

## 外から見る現在地

ローカル clone なしの入口は GitHub 上の [`HANDOVER.md`](https://github.com/YuShimoji/NarrativeGen/blob/main/HANDOVER.md)。README と `docs/project-status.md` はここへ案内するだけにし、状態を複写しない。

GitHub Wiki 機能は有効だが Wiki repository は未初期化、GitHub Pages も未設定。現在は GitHub 上の HANDOVER だけで remote-first status を読めるため、Project Cockpit は直近 bottleneck ではない。将来作る場合は、この文書・`docs/spec-index.json`・`docs/plans/DEVELOPMENT_PLAN.md` から CI で生成し、Wiki は入口だけにする。Pages/Wiki の初期化は外部公開なので human decision 待ち。

## 次の異なる入口

| 入口 | 解く摩擦 | 完了すると可能になること | 必要条件 / 現在状態 | 次の動き |
|---|---|---|---|---|
| **Verify — probe 目視** | 機械検証と実際の物語体験の差 | 現在の originality route を基準として固定できる | assistant の3ブラウザ検証は済み、human の GUI / story judgment は未 | `npm run dev` → `originality-spine-probe.json` の両 route と Designer Dashboard を一括確認 |
| **Advance — policy contract** | Character Knowledge が node 到着後にしか効かない | knowledge-derived choice を manual event/flag chain より少ない wiring で作れる | 方向は `proposed`。choice availability first を event generation と比較する必要がある | G1 `EXPLORE` packet で2案を比較し、一つの spec/probe recommendation だけを返す |
| **Prototype — Choice Consequence Lens** | 強い推論機能が技術情報として隠れる | 「なぜ選べる / 何が変わる / 何が開く」を deterministic facts から説明できる | policy semantics の安定後。人間の macro direction 選択が必要 | 同一内容の3方向 → one-screen contract → G2 固定シナリオで検証 |
| **Harden — release readiness** | 現行 gate が toolchain/security/backend/Web lint を完全には固定しない | versioned consumption と回帰判定の信頼性を上げられる | dependency upgrade は human approval が必要。playable progress を置換しない | audit/toolchain 専用 packet を作り、承認範囲だけを一括実装・検証する |

推奨順序は、human の G0 目視を G1 policy exploration と並行し、G1 の高位判断後に G2 procedural-choice vertical slice、次に G3 Consequence Lens、G4 one-person workflow proof、G5 Unity parity、G6 authoring experience、G7 release readinessへ進むこと。WritingPage / public distribution / external cockpit は G8 conditional paths のまま。詳細な目的・完了シグナル・owner・risk は `docs/plans/DEVELOPMENT_PLAN.md` の target ladder を正とする。

## 再開

通常は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書だけを読む。仕様変更時だけ `docs/spec-index.json` と該当 spec、方向選定時だけ `docs/plans/DEVELOPMENT_PLAN.md` を追加で読む。

```powershell
git fetch --prune origin
git pull --ff-only origin main
git rev-list --left-right --count HEAD...origin/main
npm ci
npm run doctor
npm run check:safety
```

WritingPage は外部 format gate 未達のまま、Unity 公開、provider/API/auth/payment、依存一括更新も現在の active slice ではない。これらを通常の次候補へ戻さない。
