# 作業申し送り

## 現在地 — 2026-07-27

`main` / `origin/main` が開発正本。今回の同期開始時は
`97d22cd372914bccdc16daa36ac94fd01089a231`で一致し、`git fetch --prune
origin`後もparity `0 0`、status clean、進行中Git operationなしだったためpullは
不要だった。Sites manifest contract修復は
`ea415ea70395c9c2d63ea851187e1eb73923009d`である。この文書追随の最終SHA、
normal push、remote readbackは今回の監修報告が正本となる。

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
現在のlaneは`HANDOFF / S1 / owner-only-deployed-runtime-review-pending`。
`apps/sites-public-studio-adapter/`のsource import、build、Version 1保存に続き、
保存済みVersion 1だけのowner-only production deploymentが`succeeded`である。
project accessは`custom`のまま、許可account userは1、group / workspace group /
tenant groupはすべて0である。Live URLは存在するが、値はユーザーの非共有条件に従い
repositoryへ保存しない。Preview URLは存在しない。実project binding
`appgprj_6a65fabf5ca48191a9b7f2b063d05cf8`は
`apps/sites-public-studio-adapter/.openai/hosting.json`へ記録済みで、`d1`と`r2`は
`null`のまま、version数は1のままである。

S1のsource intake/saveとowner-only deployment control-plane判定はaccepted。
root/assets/story/edit/reload/exportの
hosted-runtime behaviorは未観測であり、失敗ではなく**unknown**である。
したがってprivate hosted-runtime compatibility全体は`adapter_partial`で、
次のhuman gateはowner本人の認証状態で既存deploymentを閲覧し、runtime behaviorを
pass/failへ更新することである。新しいversion、再deployment、access変更は不要である。

## 監修AIへの現状報告

| 判断対象 | 今回の実測 | 証拠の区分と判断境界 |
|---|---|---|
| Git / remote | 同期開始時`main == origin/main == 97d22cd`、parity `0 0`。manifest contract修復は`ea415ea` | fetch/prune、status、operation marker、ref、diffのcurrent-run evidence。docs follow-upとpush後parityは監修報告で確定する |
| repair scope | `.gitignore`の狭い例外、tracked plugin、adapter説明、handoff追随だけをrepair branchから消費 | product/runtime semantics、dependency、payloadへの差分はない |
| checkout hygiene | 5 Web Tester JSに加えCSV 1、C# test 1の計7 index blobを真のCRLF違反として検出しLF化 | working-tree表示だけに依存せずindex/blobを検査。EOL無視比較は一致 |
| regression guard | raw CRLF index fixtureは失敗対象、LF fixtureは成功。実repositoryのindexも成功 | focused testと実indexの両方によるcurrent-run evidence |
| local integration | provisioned manifestで旧scanが失敗することを再現後、manifest contract test 4/4、scan、full adapter build/E2E 3/3、`check:safety`、`git diff --check`が成功 | current checkoutの技術検証。hosted runtime、人間受入、public releaseの代替ではない |
| clean-clone acceptance | `44656de`をremoteから通常cloneし、install前clean、isolated `npm ci` 1回、safety/adapter、install後cleanを確認済み | 過去のvalid post-push acceptance evidence。今回はcurrent checkoutの最小gateを実行し、fresh cloneは再実行していない |
| report-derived evidence | 修復branch先端の既存GitHub CI success、以前のengine/Unity詳細件数 | 補助証拠。今回のlive test結果やhuman acceptanceとして再利用しない |
| nonblocking debt | npm audit、Web Tester lint未設定、Vite externalize/large chunk、C# nullable/XML doc、optional/extraneous表示 | SR0を停止しない。dependency upgradeや一括修復はG7専用sliceで扱う |
| Sites / binding | Version 1だけのdeploymentが`succeeded`。accessはcustom、許可account user 1、全group 0、Preview URLなし、Live URL値は非記録。version数1、D1/R2なし | read-only Sites control-plane evidence。hosted runtime操作、production readiness、public releaseの証拠ではない |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。
- Adapterは既存production payloadを配るだけで、engine semanticsをcopyしない。
- localStorageとJSON import/exportは同一browser/profile内の既存挙動。
- SR0、S1 source/save、owner-only deployment完了はhosted-runtime compatibility、
  production readiness、
  public release、analytics、commercial contact、cloud persistence、G0、G3、G5、
  G7、G8を承認しない。
- owner-only production deploymentは公開ではない。public visibility、sharing、
  workspace / selected usersへのaccess拡大は別のrelease gateで、S3までlockedである。

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
  `apps/sites-public-studio-adapter/`、private owner-only project、share/
  analytics/form/domain/auth/storage/commerce無効。stateはdone for source import/build/
  Version 1 save based on human-observed evidence。ownerはuser/operator、repository
  binding follow-throughはassistant。next moveはsource/saveを再実行しない。
- **Owner-only Version 1 deployment**: purposeはownerだけが閲覧できるhosted-runtime
  review入口を作ること。effectはLive URLの存在とruntime観測可能性。requirementsは
  保存済みVersion 1、owner-only custom access維持、新versionなし。stateはdone、
  deployment `succeeded`、access custom / account user 1 / groups 0。ownerはuser。
  next moveは再deploymentせず、既存deploymentをowner認証でreviewする。
- **Hosted-runtime owner review**: purposeはroot/assets/story/edit/reload/exportの
  unknownをpass/failへ変えること。effectは`adapter_partial`からacceptまたはbounded
  repairへの判断。requirementsはowner認証、既存Live URL、同一browser/profileの
  localStorage境界、source/access/deploymentを変更しない観測。stateはpending human
  review。ownerはuser/operator。next moveは自動sample、choice、edit、reload、
  JSON export/import、forbidden surfaceを1回観測して結果を返す。
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
  pending/proposed/hold。ownerは各human/shared gate。next moveはhosted runtime reviewへ
  混ぜない。

## Exact next gate

SR0、S1 source import/build/Version 1 save、owner-only deploymentはaccepted。
次の入口はhuman-ownedの**既存Version 1 hosted-runtime review**である。

1. owner認証済みbrowserで既存Live URLを開き、root redirect/renderとCSS/JS assetを
   観測する。URL値は報告やrepositoryへ再掲しない。
2. canonical sampleのauto start、choice遷移、node edit/live preview、reload後の
   browser-local draft、JSON export/importを順に観測する。
3. account、form、personal-data input、purchase、visible commercial linkなどの
   forbidden surfaceがないことを観測する。
4. 各項目をpass/fail/nullで返し、failureならsource修正や再deploymentを始めず、
   表示されたerrorと再現条件を記録する。
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
