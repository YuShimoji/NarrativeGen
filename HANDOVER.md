# 作業申し送り

## 現在地 — 2026-07-26

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

現在のlaneは`CLOSE / SR0 / reproducible_main`。このrevisionの独立integration
worktreeではlockfileから一度だけ依存を復元し、差分検査、tracked EOL検査、safety、
adapter payload/scan/build/Chromium E2E、Public Studio、全体buildを通した。
最終remote acceptanceは、このrevisionを非強制fast-forwardで`origin/main`へ反映し、
そのremoteから作った通常のfresh cloneがinstall前後ともtracked cleanで、
`check:safety`と`test:sites-adapter`を通ることによって確定する。最終SHAとpush、
fresh-clone、primary checkoutの実測は実行タスクの監修報告を正本とし、この文書内の
将来予測で代用しない。

SR0 acceptance後に解放される次工程はhuman-ownedの
**S1B Sites source import and version save only**である。Sites source import、
project作成、project ID、credential、version save、deployment、URL、
sharing、domain、analytics、auth、storage、form、commerceはSR0では実行していない。
判定はSR0 acceptanceまでは
**`adapter_candidate + Sites source-import unverified`**、SR0 acceptance後も
Sites側の判定は**`Sites source-import unverified`**のままである。

## 監修AIへの現状報告

| 判断対象 | 今回の実測 | 証拠の区分と判断境界 |
|---|---|---|
| Git入力 | base `c93a0f4`、repair tip `5057d8a`、implementation `5bd97cf`。repair tipはbaseの直系子孫 | ref取得と祖先・差分監査によるrepository-derived evidence。最終remote SHAはpush後の報告で確定する |
| repair scope | `.gitignore`の狭い例外、tracked plugin、adapter説明、handoff追随だけをrepair branchから消費 | product/runtime semantics、dependency、payloadへの差分はない |
| checkout hygiene | 5 Web Tester JSに加えCSV 1、C# test 1の計7 index blobを真のCRLF違反として検出しLF化 | working-tree表示だけに依存せずindex/blobを検査。EOL無視比較は一致 |
| regression guard | raw CRLF index fixtureは失敗対象、LF fixtureは成功。実repositoryのindexも成功 | focused testと実indexの両方によるcurrent-run evidence |
| local integration | `git diff --check`、`check:safety`、adapter check/scan/build/E2E、`test:public`、`build:all`が成功 | 独立worktreeの技術検証。remote pushやfresh cloneの代替ではない |
| clean-clone acceptance | 更新済み`origin/main`から通常cloneし、install前clean、isolated `npm ci` 1回、safety/adapter、install後cleanを確認する | post-push acceptance evidence。最終監修報告でcommit/push/clone/primaryを別々に記録する |
| report-derived evidence | 修復branch先端の既存GitHub CI success、以前のengine/Unity詳細件数 | 補助証拠。今回のlive test結果やhuman acceptanceとして再利用しない |
| nonblocking debt | npm audit、Web Tester lint未設定、Vite externalize/large chunk、C# nullable/XML doc、optional/extraneous表示 | SR0を停止しない。dependency upgradeや一括修復はG7専用sliceで扱う |
| Sites / release | Sites操作、deployment、publication、公開URL、各種bindingは未実施 | local/remote技術greenはS1B human acceptanceやrelease承認ではない |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。
- Adapterは既存production payloadを配るだけで、engine semanticsをcopyしない。
- localStorageとJSON import/exportは同一browser/profile内の既存挙動。
- SR0完了はSites compatibility、private preview、production、public release、
  analytics、commercial contact、cloud persistence、G0、G3、G5、G7、G8を承認しない。
- Sites source import/version saveはhuman-owned。owner-only production deploymentも
  別の明示決定が必要。public visibilityはさらに別のrelease gate。

## Residual work

- **SR0 remote/fresh-clone closure**: purposeは統合内容が端末cacheやignored fileに
  依存しないと確定すること。effectは再現可能なS1 input。requirementsは
  non-force fast-forward、更新remoteからの通常clone、install前後clean、isolated
  `npm ci` 1回、safety/adapter green。stateはclosure revision assembled and locally
  validated。ownerはassistant under
  `AUTH-NG-REPO-GIT-FOLLOWTHROUGH-20260726`。next moveはpush直前にrefを再取得し、
  remote/fresh-clone/primaryの実測を分離して報告する。
- **S1B Sites source import/version save**: purposeはadapter sourceをSitesが無改変で
  build/saveできるか事実化すること。effectは`adapter_candidate`からaccepted、
  `adapter_partial`、または`blocked`への分類。requirementsはSR0 accepted、
  `apps/sites-public-studio-adapter/`、private/unpublished workspace、deploy/share/
  analytics/form/domain/auth/storage/commerce無効。stateはpending human gate after
  SR0。ownerはuser/operator。next moveはsource importとversion saveだけを試し、
  exact messageと保存結果を返す。
- **Owner-only deployment decision**: purposeはSitesがnon-deployed review URLを
  持たない場合の次gateを決めること。effectはownerだけが閲覧できるproduction URLの
  作成可否。requirementsはS1B成功、verified owner-only access、明示承認。
  stateはblocked by authority。ownerはuser。next moveは自動では進めず、必要性が
  判明した時だけ判断する。
- **S2 evidence-led editing improvement**: purposeは実観測された最大摩擦を1件減らす
  こと。effectはeditor usability向上。requirementsはlocalまたはSites review finding。
  stateはproposed。ownerはshared。next moveはS1B finding後に別slice化する。
- **Cross-browser / physical-device review**: purposeはChromium single-machine境界を
  広げること。effectはresponsive/accessibility confidence向上。requirementsは
  対象matrix。stateはunverified。ownerはshared/human。next moveはrelease gateが
  見えた時に定義する。
- **G0 / G3 / G5 / G7 / G8**: purposeとauthorityがSR0/S1と異なるため分離する。
  effectはoriginality review、Choice Consequence Lens、Unity parity、
  release readiness、外部連携。requirementsは各専用packet。stateは
  pending/proposed/hold。ownerは各human/shared gate。next moveはS1Bへ混ぜない。

## Exact next gate

SR0 final reportで`origin/main`とfresh cloneがacceptedなら、次の入口は
human-ownedの**S1B source import and version save only**である。

1. `git fetch --prune origin`後にlocal `main`と`origin/main`のparityを確認する。
2. `npm run check:safety`と`npm run test:sites-adapter`で正本の基線を再確認する。
3. 人間の明示操作でSitesへ`apps/sites-public-studio-adapter/`をsource projectとして渡す。
4. private/unpublishedを維持し、sharing、analytics、form、domain、auth、storage、
   commerceを無効のままにする。
5. source buildとversion saveだけを試す。
6. deploymentが必要と表示されたら実行せず停止する。
7. exact step、visible message、version save成否、first render前後を返す。

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
