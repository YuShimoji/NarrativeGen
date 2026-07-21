# 作業申し送り

## 現在地 — 2026-07-21

`main` / `origin/main` が開発正本。2026-07-21 に `git fetch --prune origin` と
`git pull --ff-only origin main` を行い、local `main` を `217a556` から
`c93a0f4` へ4 commit fast-forwardした。取り込み直後の
`HEAD...origin/main = 0 0` とclean worktreeを確認した。取得内容はPublic Studio、
Sites source adapter、その受入れ文書である。

fresh `npm ci --foreground-scripts` 後の検証で、`origin/main` のadapter設定が
Sites公式starterの `build/sites-vite-plugin.ts` を参照する一方、rootのUnity用
`[Bb]uild/` ignoreによりその必須ファイルがremoteへ入っていないことを検出した。
clean clone相当では `vinext build` が unresolved import で停止するため、現在の
`codex/fix-sites-adapter-repro` branchのimplementation commit `5bd97cf` で
公式starterと同一のpluginを復元し、
この1ファイルだけを追跡できるignore例外を追加した。依存、runtime semantics、
payload、hosting manifest、公開状態は変更していない。

現在のlaneは `CLOSE / SITES_SOURCE_ADAPTER / reproducibility_repair`。
このbranchでは依存復元、全体回帰、adapter build/runtime/browser acceptanceまで
通過しておりローカル開発を再開できる。修復が `main` へ入るまでは、別 cloneで
`origin/main` のみを使うと同じbuild failureが再発する。

Public StudioのHTML / JavaScript / CSSはadapter内へbyte-for-byteで埋め込み、
SHA-256 manifestと同期・drift checkを持つ。rootは `/studio/` へ遷移し、
その後は既存Studioだけが表示される。iframe、別editor、別story runtime、
外部API、auth、analytics、form、storage binding、commerceは追加していない。

Sites source import、project作成、project ID、credential、version save、deployment、
URL、共有・domain・analytics設定は一切実行していない。修復後も判定は
**`adapter_candidate + Sites source-import unverified`** のままである。

## 監修AIへの現状報告

| 判断対象 | 現在の事実 | workflow / decisionへの効き方 |
|---|---|---|
| remote同期 | `origin/main` の最新 `c93a0f4` をfast-forward取得。修復branchをpushし、push直後のtracking parity `0 0` | 古い製品前提を持ち込まず、修復差分だけをレビュー・統合できる |
| 開発環境 | Node 22.19.0 / npm 10.9.3 / .NET SDK 9.0.304。lockfileから995 packagesを復元しdoctor 27/27 | README要件を満たし、編集・build・testを継続できる |
| repo回帰 | safety gate成功。engine 335 tests、formatter 72 checks / 18 models、Public Studio contract 4、全build成功 | Public Studio追加後も既存engine/Web契約を後続sliceの基準点にできる |
| adapter再現性 | missing Sites pluginを追跡可能に修復。payload/embedded SHA一致、3 files / 48,467 bytes、禁止9分類、vinext build、Chromium 3/3成功 | 別 cloneでもadapter sourceをbuildできる状態へ戻した。Sites import成功までは意味しない |
| browser / runtime | Public Studio Chromium 3/3、adapter Worker Chromium 3/3。auto-start、choice、edit、reload localStorage、JSON export/import成功 | local production-like flowは操作可能。Safari/Firefox/実機/支援技術は未確認 |
| Unity SDK | .NET 32/32成功 | 今回のWeb/hosting修復が既存C# baselineを壊していない |
| 未解消債務 | npm audit 49件、Web Tester lint未設定、Vite `fs` externalization/large chunk、C# nullable/XML doc警告、npmのextraneous/optional表示 | いずれも現行開発の停止要因ではない。依存更新や警告一掃をこの修復へ混ぜない |

fresh install後の `npm ls --depth=0` は `@napi-rs/wasm-runtime` と
`@tybys/wasm-util` を `extraneous`、Windowsでは不要な
`@rollup/rollup-linux-x64-gnu` をunmet optionalとして表示する。現在のlock/install
から再現する非阻害表示であり、adapter failureとは分離する。`npm audit fix` と
dependency upgradeは承認されたtoolchain sliceではないため実行していない。

`vinext start` のNode production serverはbuilt `public/studio` を404にしたため、
production-like local commandはSites buildのWorkerとasset bindingを直接動かす
`wrangler dev`へ修正した。これはlocal repairであり、deploy commandではない。

詳細なarchitecture、hash、コマンド、next gateは
`docs/sites/SITES_SOURCE_ADAPTER.md` が正本。source intake全体の判定は
`docs/sites/PUBLIC_STUDIO_READINESS.md` が正本。

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。
- Adapterは既存production payloadを配るだけで、engine semanticsをcopyしない。
- localStorageとJSON import/exportは同一browser/profile内の既存挙動。
- S1A完了はSites compatibility、private preview、production、public release、
  analytics、commercial contact、cloud persistence、G3〜G8を承認しない。
- Sites source import/version saveはhuman-owned。owner-only production deploymentも
  別の明示決定が必要。public visibilityはさらに別のrelease gate。

## 残る作業と権限

- **Repair integration**: purposeはclean cloneでのadapter build failureをremote正本から
  除くこと。effectはreproducibleなS1B input。requirementsはこのbranchの2 implementation
  filesとhandoffをreviewし、`main`へ統合すること。stateはlocal acceptance、commit、remote
  branch push完了。ownerはmaintainer merge。next moveはbranchをreviewし、merge後の
  `origin/main`でparityとadapter testを再確認する。
- **S1B Sites source import/version save**: purposeは修復済みadapter sourceをSitesが無改変で
  build/saveできるか事実化すること。effectは`adapter_candidate`からaccepted、
  `adapter_partial`、または`blocked`への分類。requirementsは
  `apps/sites-public-studio-adapter/`、private/unpublished workspace、deploy/share/
  analytics/form/domain/auth/storage/commerce無効。stateはpending human gate。
  ownerはuser/operator。next moveはsource importとversion saveだけを試し、
  exact messageと保存結果を返す。
- **Owner-only deployment decision**: purposeはSitesがnon-deployed review URLを持たない
  場合の次gateを決めること。effectはownerだけが閲覧できるproduction URLの作成可否。
  requirementsはS1B成功、verified owner-only access、明示承認。stateはblocked by
  authority。ownerはuser。next moveは自動では進めず、必要性が判明した時だけ判断する。
- **S2 evidence-led editing improvement**: purposeは実観測された最大摩擦を1件減らす
  こと。effectはeditor usability向上。requirementsはlocalまたはSites review finding。
  stateはproposed、未承認。ownerはshared。next moveはS1B finding後に別slice化する。
- **Cross-browser / physical-device review**: purposeはChromium single-machine境界を広げる
  こと。effectはresponsive/accessibility confidence向上。requirementsは対象matrix。
  stateはunverified。ownerはshared/human。next moveはrelease gateが見えた時に定義する。
- **G0 / G3 / G5 / release debt**: purposeとauthorityがSites adapterと異なるため分離。
  effectはoriginality review、Choice Consequence Lens、Unity parity、release readiness。
  requirementsは各専用packet。stateはpending/proposed。ownerは各human/shared gate。
  next moveはS1Bへ混ぜない。

## 次の異なる入口

| 入口 | 減らす摩擦 | 選ぶと次に可能になること |
|---|---|---|
| **Advance — repair integration** | remote `main`だけではclean buildできない再現性欠損 | 修復branchをmergeし、S1Bへ渡せる正本を作る |
| **Verify — fresh-clone adapter** | ignore規則や端末cacheに依存していないかの不確実性 | merge後のcloneでadapter testを再実行し、remote-readyを確定する |
| **Explore — S1B source import** | Sites intake compatibilityの未観測 | private/unpublishedのままbuild/version save可否をaccepted/partial/blockedへ分類する |
| **Audit — release/toolchain debt** | audit、lint、nullable、chunk警告の蓄積 | 別承認sliceで依存変更の影響を評価できる。S1Bとは混ぜない |

最優先は **repair integration → fresh-clone verification**。その完了後だけ、
human-ownedの **S1B source import and version save only** へ進む。

1. 修復branchを `main` へ統合し、clean cloneで `npm ci` と
   `npm run test:sites-adapter` を通す。
2. Sitesへ `apps/sites-public-studio-adapter/` をsource projectとして渡す。
3. private/unpublishedを維持し、sharing、analytics、form、domain、auth、storage、
   commerceを無効のままにする。
4. source buildとversion saveだけを試す。
5. deploymentが必要と表示されたら実行せず停止する。
6. exact step、visible message、version save成否、first render前後を返す。

再開時は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書を読む。
adapter laneでは続けて `docs/sites/SITES_SOURCE_ADAPTER.md` と
`docs/sites/PUBLIC_STUDIO_READINESS.md` を読む。

```powershell
git fetch --prune origin
git switch main
git pull --ff-only origin main
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
npm ls --depth=0
npm run check:sites-adapter
npm run scan:sites-adapter
npm run build:sites-adapter
npm run test:e2e:sites-adapter
npm run check:safety
```

別端末のfresh cloneで依存関係がまだない場合だけ、上記 `npm ls` の前に
`npm ci` を一度完了させる。installを並行実行しない。

Local production-like review URLは `http://127.0.0.1:4184/`
（`npm run preview:sites-adapter`）。
