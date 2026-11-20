# 作業申し送り

## 現在地 — 2026-11-21（再起動準備）

NarrativeGenは、他作品への物語供給を前提にしない実験的な物語生成システムである
（2026-09-28のuser明示、[決定履歴](docs/governance/decision-log.md)）。JSONがfull-fidelity
source、TypeScript engineがruntime semanticsの正本で、Web Testerで制作・再生し、
Unity C# SDKはTS版のparityを追う。

製品の実装は2026-07-27（Public Studio Version 1のowner-only deployment）以降止まっている。
その後の変更は2026-10-11のCloud Codex環境整備だけで（[Cloud開発手順](docs/CLOUD_CODEX.md)）、
2026-10-18にlocal `main`をその版`6f2a1d8`へ早送りし、2026-11-21に`origin/main`へ通常pushした。
SR0とS1 deploymentの詳細な証拠はGit履歴と決定履歴にあり、この文書には再掲しない。

次の集中セッションは、下の「焦点の判断待ち」から1つ選ぶところから始める。

## 2026-11-21にこの端末（Windows、Node v24.13.0）で確認したこと

| 対象 | 状態 | 確認方法 |
|---|---|---|
| 依存関係 | 解決済み。`@rollup/rollup-linux-x64-gnu`のUNMET OPTIONALと`@tybys/wasm-util` extraneousは既知の非blocking表示 | `npm ls --depth=0` |
| 文書・encoding・model同期 | 成功（spec-index、docs-authority、encoding 366ファイル、tracked EOL、model 19件同期） | `npm run check:safety` |
| engine | 27ファイル・335件成功 | `npm run test:engine` |
| Playable baseline | vertical-slice（proof route・AI mock採用・CSV import/roundtrip）、originality probe、procedural-choice probeの9件×Chromium/Firefox/WebKit＝27件が再試行なしで成功（4.1分） | `npx playwright test`に`vertical-slice originality-spine-probe procedural-choice-spine-probe`を指定。port 5173衝突のため別port（下の再開手順の注意） |
| 未実行 | Web Tester / Public Studioのunit、Sites adapter試験、Unity SDKの.NET試験、Unity Editor、人による試遊 | 再開後、触る範囲に応じて実行する |

## 使えるもの

- **Playable vertical slice**: `models/examples/vertical-slice.json`。`npm run dev`→
  `http://localhost:5173/`→`vertical-slice.json`→`実行`。制作・再生・保存・再読込の生存確認。
- **独自性の試作**: `originality-spine-probe.json`（Character Knowledge＋Perception Policyでroute差が出るか）、
  `procedural-choice-spine-probe.json`（SP-KNOW-002 Contract A。知識から選択肢の可否が決まる）。
  G2のTS/Web sliceはdone。
- **Public Studio**: `apps/public-studio/`のローカル候補（S0 done）。Sites上のVersion 1は
  owner-only custom accessでdeploy済み。hosted runtimeの挙動は未観測（unknown）。Live URLの値は
  userの非共有条件によりrepositoryへ保存しない。
- **Unity SDK**: SP-UNITY-001 done（今回は未再実行）。
- 仕様の状態は[spec-index](docs/spec-index.json)：partialはSP-009、SP-DTYARN-001、SP-TGEN-001、SP-WP-001。

## 人の確認待ち（どちらも短時間で、互いに止めない）

| 確認 | 何が決まるか | 手順 | 返すもの |
|---|---|---|---|
| **G0 独自性の基準確認** | 試作が「旧来のflag ADVと違うroute差」を物語として伝えているか。G3・G4の土台になる | [originality review](docs/samples/originality-spine-probe-review-ja.md)と[procedural-choice review](docs/samples/procedural-choice-spine-probe-review-ja.md)の手順で、両試作のrouteと`設計ダッシュボード`を見る | 項目ごとにpass、または具体的な欠陥（画面・操作・期待との差） |
| **S1 hosted runtime確認** | owner-only Version 1でroot/assets/story/edit/reload/exportが動くか。`adapter_partial`をacceptか限定修復へ変える | 下の「S1の確認手順」 | 各項目のpass / fail / null。failは表示されたerrorと再現条件 |

### S1の確認手順

1. owner認証済みbrowserで既存Live URLを開き、root redirect/renderとCSS/JS assetを観測する。
   URL値は報告やrepositoryへ再掲しない。
2. canonical sampleのauto start、choice遷移、node edit/live preview、reload後の
   browser-local draft、JSON export/importを順に観測する（操作の詳細は
   [Public Studioレビュー手順](docs/sites/PUBLIC_STUDIO_REVIEW_JA.md)と同じ）。
3. account、form、personal-data input、purchase、visible commercial linkなどの
   forbidden surfaceがないことを観測する。
4. failureならsource修正や再deploymentを始めず、errorと再現条件を記録する。
5. public access、sharing、analytics、domain、auth、storage、form、commerceは
   S3 public-release gateまでlockedのまま。新しいversion、再deployment、access変更は不要。

## 焦点の判断待ち（次の集中セッションの最初に1つ選ぶ）

[Roadmap](docs/plans/DEVELOPMENT_PLAN.md)のNorth Starとgate列はまだ`proposed`である。

| 候補 | 埋める不足 | 最初の操作 | 終了条件 | 人の関与 |
|---|---|---|---|---|
| **A. G3 Choice Consequence Lens探索**（roadmap推奨の第一候補） | engineの推論・知識・方針の効果が作者に見えず、hidden diagnosticsに留まっている | EXPLORE packetとして、`originality-spine-probe.json`の同じ内容で「なぜ選べるか／何が変わるか／何が開くか」を示すread-only lensを異なる3方向でmockする | 3方向のmockと比較材料が揃い、userが選んだmacro方向をspecへ固定する。実装は別の`IMPLEMENT` packet | macro方向の選択（user）。G0は並行でよい |
| **B. G4 一人制作ワークフロー実証** | 機能が実際の物語の形で作業を減らすか未実証 | 8ノードの証拠ミステリー骨格で author→validate→play→save/reload→export を通す計画を作り、配線数と手作業例外の計測方法を決める | 1本の制作経路を通し、計測記録とuserの有用性判断が揃う | 本文・物語判断はuser（AIは執筆しない）。構造の足場と計測はassistant |
| **C. Public Studio S1→S2** | 公開デモ面のhosted runtime互換性が未確定 | S1確認の結果を受け取り、観測された摩擦1件をS2候補にする | 摩擦1件の修正と回帰試験、またはS1 accept | S1確認はuser |
| **D. コンセプトの再確認** | 4か月の中断後、「実験的な物語生成システム」で次に確かめたい問いが未記録 | 現North Star（作者が世界・知識・意図を一度定義し、runtimeが選択肢・event・文章を導く）を読み、採用・改訂・別の問いを決める | Roadmapの北極星をuser採用版へ書き換え、A〜Cの順序を確定する | userの判断。assistantは比較材料を用意 |

推奨: Aを主作業にし、セッション冒頭にG0を済ませる。理由は、G1・G2が完了してpolicy semanticsが
安定し、A はroadmap上unlockedで、作者がengineの効果を確かめる面が独自性の検証に直結するため。
Dで北極星を変える場合はA〜Cの順序が変わるので、Dを選ぶならA〜Cより先に扱う。

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。
- Adapterは既存production payloadを配るだけで、engine semanticsをcopyしない。
- localStorageとJSON import/exportは同一browser/profile内の既存挙動。
- owner-only production deploymentは公開ではない。public visibility、sharing、
  workspace / selected usersへのaccess拡大は別のrelease gateで、S3までlocked。
- NarrativeGenを他作品（Game StudioやUnityChatNovelGame等）の供給元にする作業は今の範囲外。
- AIは物語本文を執筆しない。制作システムの整備が役割（[Invariants](docs/INVARIANTS.md)）。

## Residual work

| 項目 | purpose / effect | requirements | state / owner | next move |
|---|---|---|---|---|
| G0 baseline review | 機械的な正しさと物語として伝わるかを分ける | 両試作とDashboardを同時に見る | pending / user | 上の表の手順で一度観測 |
| S1 hosted-runtime review | `adapter_partial`をacceptか限定修復へ | owner認証、既存Live URL、変更しない観測 | pending / user | 上の「S1の確認手順」 |
| G3 Choice Consequence Lens | 作者が選択肢の理由と結果を確かめられる | 安定したpolicy semantics、事実へ遡れる文だけ | proposed・unlocked / shared | 焦点にAを選んだらEXPLORE packetから |
| G4 workflow proof | 実際の物語で作業量の削減を確かめる | 1本の制作経路、user所有の本文 | proposed / shared | 焦点にBを選んだら計測計画から |
| S2 editing improvement | 観測された最大の摩擦を1件減らす | S1またはlocal reviewの具体的な所見 | proposed / shared | 所見が出てから別slice |
| SP-DTYARN-001 | Dynamic TextのYarn変換を広げる | 変換表現を先にspecで固定 | partial / assistant | specから。今の焦点候補ではない |
| G5 Unity parity、G7 release、G8 外部連携 | 別のpurpose・authority | 各専用packet | hold・proposed / 各gate | A〜Dと混ぜない |
| 非blocking debt | npm audit、Web Tester lint未設定、Vite chunk警告、C# nullable等 | G7専用slice | proposed / shared | [Technical debt](docs/TECHNICAL_DEBT.md) |

作業ツリーの補足: `.codex-tmp/cloud-codex-20261011/NarrativeGen`は親Game Projectsの
Cloud環境整備用worktree（`6f2a1d8`、branch `codex/cloud-codex-environment-20261011`）で、
この文書の範囲では触らない。

## 再開手順

再開時は`AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書を読み、選んだ焦点に必要な
spec・review文書だけを追加で読む。Public Studio laneでは
`docs/sites/SITES_SOURCE_ADAPTER.md`と`docs/sites/PUBLIC_STUDIO_READINESS.md`も読む。

```powershell
git fetch --prune origin
git switch main
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
npm ls --depth=0
npm run check:safety
npm run test:engine
npm run dev
```

E2E前にport 5173の使用者を確かめる。Web Testerの`playwright.config.js`は
`reuseExistingServer`が有効で、5173を別project（2026-11-21はLOWPASS-SALVAGE-ATLASのdev server）が
使っていると、そのページへ接続して全件`__NARRATIVEGEN_DEVTOOLS__`待ちのtimeoutになる。
NarrativeGenの不具合ではない。他projectのserverは止めず、別portで標準configを上書きして実行する
（2026-11-21はuntrackedの一時configで`npx vite --port 5183 --strictPort`と`baseURL`だけを差し替えた）。

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess }
```

別端末のfresh cloneで依存関係がない場合だけ、`npm ls`の前に
`npm ci --foreground-scripts`を一度完了させる。installを並行実行しない。
Public Studio laneでは`npm run test:sites-adapter`を足す。Local production-like review URLは
`http://127.0.0.1:4184/`（`npm run preview:sites-adapter`）。
