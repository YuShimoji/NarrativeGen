# 作業申し送り

## 現在地 — 2026-07-10

`main` / `origin/main` が開発正本。2026-07-10 の workflow reset はリモートを `374aef0` から `0b87c46` へ fast-forward して開始し、material change `083e681` (`chore: streamline ai development workflow`) を push、GitHub CI success、`HEAD...origin/main = 0 0` まで確認した。以後の正確な HEAD と同期状態は `git log -1 --oneline` と `git rev-list --left-right --count HEAD...origin/main` で確認し、最新 HEAD の自己参照値をこの文書へ固定しない。

プロダクトの survival check は `models/examples/vertical-slice.json`、現在の独自性レビュー対象は `models/examples/originality-spine-probe.json`。後者は Character Knowledge を node-triggered Perception Policy に接続し、旧式の choice effect 直書きより少ない authoring wiring でルート差を作る。直近の実装修正で、別サンプルから切り替えた際の session/DOM 漏れを解消し、プレイヤー表示を日本語中心へ戻した。

今回の主作業はコード機能追加ではなく、監修 AI → Prompt → 開発 AI の反復を止めずに回すための workflow 再設計。過去の再始動キットが増やした重複 status/roadmap/runtime 文書はリモート最新で撤去済みであり、今回も新しい状態正本は作らない。

## 直近の配送と再開境界

| 再開時に必要な観点 | 保持した状態 |
|---|---|
| 位相 / 主レーン / スライス | `CLOSE` / AI-assisted development workflow / workflow v21 と status-authority reset は完了 |
| 変更した正本 | 自律実行と停止条件、監修→開発 mission packet、interaction failure、operator loop、継続要求、roadmap、current snapshot |
| 自動防止策 | `check:docs-authority` と 3 fixtures を `check:safety` / GitHub CI に統合。重複 capsule、必須正本欠落、主要リンク切れを検出 |
| 配送状態 | material commit `083e681` は `origin/main` に存在し、[CI run 29084291407](https://github.com/YuShimoji/NarrativeGen/actions/runs/29084291407) は success |
| 次端末が最初に読むもの | `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書。方向を選ぶ場合だけ `docs/plans/DEVELOPMENT_PLAN.md` の Proposed Experience Routes を追加確認 |
| 未確定論点 | probe の human 目視、policy frontier、experience route、外部 Project Cockpit。すべて proposed または human decision 待ち |
| 触らない範囲 | WritingPage gate、Unity/publication、provider/API/auth/payment、依存一括更新。明示した別 slice なしに再開しない |

## 開発可能性

| 面 | 2026-07-10 の確認結果 | 判断 |
|---|---|---|
| Git / 依存 | リモート同期後に `npm ci` 成功 | lockfile どおりに開発再開可能 |
| 環境 | Node 22.19.0 / npm 10.9.3 / .NET SDK 9.0.304 | README の Node 20+ / .NET 9 要件を満たす |
| 構造診断 | doctor 25/25、spec index 36、docs authority 16 owners / 27 links、encoding scan 318 files、model sync 18 | 正本・リンク・文字コード・モデル複製は健全 |
| TypeScript / Web | engine lint、engine 26 files / 299 tests、tester formatter 68、17 models、engine/backend/tester build | ローカル実装と検証を継続可能 |
| Browser | Chromium の originality probe 2 scenarios | 直近の sample-switch / policy route 回帰は機械確認済み |
| Unity SDK core | .NET 32 tests | 定義済み runtime scope は検証済み。Character Knowledge / Perception Policy の直接評価と Unity Editor 統合目視は別工程 |

非ブロッカーの負債として、Web Tester lint は未設定、標準 `build:all` / CI は backend build を含まない、Vite は Mermaid の大きい chunk と browser 向け `fs` externalize を警告する。`npm audit` は全依存 43 件、production 対象 13 件を報告しているため、外部公開前に依存更新を独立した security slice として扱う。今回の workflow slice では依存契約を変更していない。

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

GitHub Wiki 機能は有効だが Wiki repository は未初期化、GitHub Pages も未設定。外部 Project Cockpit を作る場合は、この文書・`docs/spec-index.json`・`docs/plans/DEVELOPMENT_PLAN.md` から CI で生成し、Wiki は入口だけにする。Pages/Wiki の初期化は外部公開なので human decision 待ち。

## 次の異なる入口

| 入口 | 解く摩擦 | 完了すると可能になること | 必要条件 / 現在状態 | 次の動き |
|---|---|---|---|---|
| **Verify — probe 目視** | 機械検証と実際の物語体験の差 | 現在の originality route を基準として固定できる | assistant の自動検証は済み、human の GUI 感性確認は未 | `npm run dev` → `originality-spine-probe.json` の上下ルートと Designer Dashboard を一括確認 |
| **Advance — policy frontier** | Character Knowledge が node 到着後にしか効かない | choice availability または broader event generation に知識を早く反映できる | 方向は proposed。value path と authoring 削減量の比較が必要 | 2案を spec/probe レベルで比較し、1案を `IMPLEMENT` へ昇格 |
| **Explore — consequence / visual direction** | 強い推論機能が技術情報として隠れ、UI 大改修は後戻りしやすい | 選択肢の「なぜ/何が変わる」を見せる Consequence Lens、または layout・日英・visual grammar の方向を低コストで選べる | 人間の方向選択が必要。最初の候補は既存推論を再利用する Choice Consequence Lens | 同一画面・同一内容の 3 モック → macro contract → 固定シナリオ縦切り |
| **Publish — Project Cockpit** | repo を開かないと status が見えず、手動 Wiki が忘れられる | current status / roadmap / spec lifecycle を URL 一つで確認できる | internal source 整理は済み、Pages/Wiki 外部設定は未承認 | 公開範囲を決め、canonical docs から生成する Pages workflow を実装 |

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
