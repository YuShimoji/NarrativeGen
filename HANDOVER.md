# 作業申し送り

## 現在地 — 2026-07-27

`main` / `origin/main` が開発正本。SR0 closure revisionは、同期済みの
`origin/main@c93a0f4cb6494bed63bf797234858ceb9f76c39d` を基点に、
`origin/codex/fix-sites-adapter-repro@5057d8a9acb8cba33afb4f8e0c67d3aa9c07b257`
をそのまま祖先として統合した。修復実装は
`5bd97cfc2f9b2ff185267e7155405329f0bd1d4c`、文書追随は`5057d8a`である。

修復はrootのUnity向け`[Bb]uild/` ignoreがSites adapter必須の
`apps/sites-public-studio-adapter/build/sites-vite-plugin.ts`までremote artifactから
除外していた問題を、当該ディレクトリと1ファイルだけのignore例外、tracked pluginで
閉じる。依存、Public Studioの表示・編集挙動、engine semantics、payload、
hosting manifest、公開状態は変更していない。

同じSR0 revisionで、rootの`* text=auto eol=lf`に反してindex blobがCRLFだった
次の7ファイルをLFへ正規化した。

- `apps/web-tester/models/examples/test_hierarchy.csv`
- `apps/web-tester/src/config/keybindings.js`
- `apps/web-tester/src/features/model-validator.js`
- `apps/web-tester/src/ui/model-updater.js`
- `apps/web-tester/src/ui/node-manager.js`
- `apps/web-tester/src/ui/validation-panel.js`
- `packages/tests/NarrativeGen.Tests/EngineSmokeTests.cs`

正規化前後はEOL無視比較で一致する。差分検査に抵触した既存行末空白は、
上記2 JavaScriptファイルの該当行だけ除去した。今後は
`scripts/tracked-eol-check.mjs`がworking treeではなくGit index blobを検査し、
LF管理対象にCR byteがあれば失敗する。`scripts/tracked-eol-check.test.mjs`は
raw CRLF blobをindexへ直接入れたnegative fixtureとLF controlの両方を検証する。
この検査は`check:encoding-safety`経由で`check:safety`に組み込まれている。
またrootの`test:sites-adapter`は最初に`build:public`を実行するため、fresh cloneに
ignoredな`apps/public-studio/dist`が存在しなくてもfull adapter acceptanceを開始できる。

SR0はclosed。受入れruntime revision
`44656de13d018fd0c88f505532b85e4cc59ae04f`を非強制fast-forwardで
`origin/main`へ反映し、そのremoteから作った通常のfresh cloneでinstall前後の
tracked clean、isolated `npm ci --foreground-scripts` 1回、`check:safety`、
自己完結した`test:sites-adapter`を確認した。primary checkoutにも同じaccepted
runtime contentをfast-forwardし、parity `0 0`、status clean、root dependency tree
解決済みである。
この文書だけの追随commitはruntime、dependency、payloadを変更せず、最終SHAと
docs-follow-up cloneの実測は実行タスクの監修報告が正本となる。

現在のlaneは`HANDOFF / S1 / source-save-accepted`。人間が観測したSites evidenceでは、
`apps/sites-public-studio-adapter/`のsource import、build、Version 1保存が成功した。
project accessはowner-only customのままで、Preview URLとLive URLは存在せず、
deploymentは要求されず、実行もされていない。実project binding
`appgprj_6a65fabf5ca48191a9b7f2b063d05cf8`は
`apps/sites-public-studio-adapter/.openai/hosting.json`へ記録済みで、`d1`と`r2`は
`null`のままである。

S1のsource intake/save判定はaccepted。root/assets/story/edit/reload/exportの
hosted-runtime behaviorは未観測であり、失敗ではなく**unknown**である。
したがってprivate hosted-runtime compatibility全体は`adapter_partial`で、
次のhuman gateはVersion 1をowner-only deploymentするか明示的にholdするかの決定である。

## 監修AIへの現状報告

| 判断対象 | 今回の実測 | 証拠の区分と判断境界 |
|---|---|---|
| Git / remote | base `c93a0f4`、repair tip `5057d8a`、implementation `5bd97cf`、accepted runtime `44656de`。すべて直系fast-forward | ref取得、祖先監査、non-force push、`ls-remote`によるrepository-derived evidence。docs-only final SHAは監修報告で確定する |
| repair scope | `.gitignore`の狭い例外、tracked plugin、adapter説明、handoff追随だけをrepair branchから消費 | product/runtime semantics、dependency、payloadへの差分はない |
| checkout hygiene | 5 Web Tester JSに加えCSV 1、C# test 1の計7 index blobを真のCRLF違反として検出しLF化 | working-tree表示だけに依存せずindex/blobを検査。EOL無視比較は一致 |
| regression guard | raw CRLF index fixtureは失敗対象、LF fixtureは成功。実repositoryのindexも成功 | focused testと実indexの両方によるcurrent-run evidence |
| local integration | `git diff --check`、`check:safety`、adapter check/scan/build/E2E、`test:public`、`build:all`が成功 | 独立worktreeの技術検証。remote pushやfresh cloneの代替ではない |
| clean-clone acceptance | `44656de`をremoteから通常cloneし、install前clean、isolated `npm ci` 1回、safety/adapter、install後cleanを確認 | valid post-push acceptance evidence。docs-only追随revisionも最終監修報告で同じ境界を再確認する |
| report-derived evidence | 修復branch先端の既存GitHub CI success、以前のengine/Unity詳細件数 | 補助証拠。今回のlive test結果やhuman acceptanceとして再利用しない |
| nonblocking debt | npm audit、Web Tester lint未設定、Vite externalize/large chunk、C# nullable/XML doc、optional/extraneous表示 | SR0を停止しない。dependency upgradeや一括修復はG7専用sliceで扱う |
| Sites / binding | 人間観測ではsource import/build/Version 1 saveが成功。accessはowner-only custom、Preview/Live URLなし、deployment要求なし・実行なし。実project IDをmanifestへbinding済み | source/saveのvalid passとrepository linkage。hosted runtime、production readiness、public releaseの証拠ではない |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。
- Adapterは既存production payloadを配るだけで、engine semanticsをcopyしない。
- localStorageとJSON import/exportは同一browser/profile内の既存挙動。
- SR0とS1 source/save完了はhosted-runtime compatibility、production readiness、
  public release、analytics、commercial contact、cloud persistence、G0、G3、G5、
  G7、G8を承認しない。
- Version 1のowner-only production deploymentは別の明示決定が必要。
  public visibilityはさらに別のrelease gateであり、S3までlockedである。

## Residual work

- **SR0 closure evidence**: purposeは統合内容が端末cacheやignored fileに依存しないと
  確定すること。effectは再現可能なS1 input。requirementsはnon-force fast-forward、
  更新remoteからの通常clone、install前後clean、isolated `npm ci` 1回、
  safety/adapter green。stateはdone。ownerはassistant under
  `AUTH-NG-REPO-GIT-FOLLOWTHROUGH-20260726`。next moveは実装を再開せず、
  commit/push/fresh-clone/primary evidenceを監修報告へ分離記録する。
- **S1B Sites source import/version save**: purposeはadapter sourceをSitesが無改変で
  build/saveできるか事実化すること。effectはsource intake/save acceptedと
  hosted-runtime evidence gapの分離。requirementsはSR0 accepted、
  `apps/sites-public-studio-adapter/`、private/unpublished workspace、deploy/share/
  analytics/form/domain/auth/storage/commerce無効。stateはdone for source import/build/
  Version 1 save based on human-observed evidence。ownerはuser/operator、repository
  binding follow-throughはassistant。next moveはsource/saveを再実行せず、
  hosted runtimeをunknownのまま次のowner decisionへ渡す。
- **Owner-only deployment decision**: purposeはSitesがnon-deployed review URLを
  持たない場合の次gateを決めること。effectはownerだけが閲覧できるproduction URLの
  作成可否とhosted-runtime reviewの入口。requirementsは保存済みVersion 1、
  verified owner-only custom access、deployまたはholdの明示決定。
  stateはpending human decision。ownerはuser。next moveは自動では進めず、
  Version 1のowner-only deploymentかholdを選ぶ。
- **S2 evidence-led editing improvement**: purposeは実観測された最大摩擦を1件減らす
  こと。effectはeditor usability向上。requirementsはlocalまたはhosted runtimeの
  concrete review finding。stateはproposed。ownerはshared。next moveは実摩擦を
  1件観測した後に別slice化し、現在のunknownから仮説を捏造しない。
- **Cross-browser / physical-device review**: purposeはChromium single-machine境界を
  広げること。effectはresponsive/accessibility confidence向上。requirementsは
  対象matrix。stateはunverified。ownerはshared/human。next moveはrelease gateが
  見えた時に定義する。
- **G0 / G3 / G5 / G7 / G8**: purposeとauthorityがSR0/S1と異なるため分離する。
  effectはoriginality review、Choice Consequence Lens、Unity parity、
  release readiness、外部連携。requirementsは各専用packet。stateは
  pending/proposed/hold。ownerは各human/shared gate。next moveはdeployment decisionへ
  混ぜない。

## Exact next gate

SR0とS1 source import/build/Version 1 saveはaccepted。次の入口はhuman-ownedの
**Version 1 owner-only deployment decision**である。

1. ownerがVersion 1をowner-only deploymentしてhosted-runtime reviewへ進むか、
   deploymentをholdするかを明示する。
2. holdの場合はSites外部状態を変えず、hosted-runtime behaviorをunknownのまま保つ。
3. deployを別missionで明示承認した場合だけ、owner-only custom accessを維持して
   Version 1を対象にする。
4. deployment後のreviewではroot/assets/story/edit/reload/exportを実測し、
   unknownをpass/failへ更新する。
5. public access、sharing、analytics、domain、auth、storage、form、commerceは
   S3 public-release gateまでlockedのままにする。

再開時は`AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書を読む。
adapter laneでは続けて`docs/sites/SITES_SOURCE_ADAPTER.md`と
`docs/sites/PUBLIC_STUDIO_READINESS.md`を読む。

```powershell
git fetch --prune origin
git switch main
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
npm ls --depth=0
npm run check:safety
npm run test:sites-adapter
```

別端末のfresh cloneで依存関係がない場合だけ、上記`npm ls`の前に
`npm ci --foreground-scripts`を一度完了させる。installを並行実行しない。

Local production-like review URLは`http://127.0.0.1:4184/`
（`npm run preview:sites-adapter`）。
