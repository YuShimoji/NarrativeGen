# 作業申し送り

## 現在地 — 2026-07-21

`main` / `origin/main` が開発正本。`S1A_MINIMAL_SITES_SOURCE_ADAPTER` は
`e6acbee` で実装・文書化され、2026-07-21のhandoff refresh開始時にGitHub上の
`origin/main` と同一SHA、remote parity `0 0` を確認した。現在のHEADとparityは
再開時にGitから読み直すこと。

現在の優先laneは `IMPLEMENT / SITES_SOURCE_ADAPTER / adapter_candidate`。
`apps/sites-public-studio-adapter/` に、Sites公式starter形状へ合わせた最小
vinext/Cloudflare Worker source adapterがある。これはhosting boundaryだけで、
`apps/public-studio/`、`packages/engine-ts`、canonical model、Web Tester、Unity、
WritingPage、G3 Lensを変更していない。

Public StudioのHTML / JavaScript / CSSはadapter内へbyte-for-byteで埋め込み、
SHA-256 manifestと同期・drift checkを持つ。rootは `/studio/` へ遷移し、
その後は既存Studioだけが表示される。iframe、別editor、別story runtime、
外部API、auth、analytics、form、storage binding、commerceは追加していない。

Sites source import、project作成、project ID、credential、version save、deployment、
URL、共有・domain・analytics設定は一切実行していない。判定は
**`adapter_candidate + Sites source-import unverified`**。

## 現在の受入れ根拠

| 判断対象 | 確認済み状態 | 境界 |
|---|---|---|
| Git artifact | adapter実装 `e6acbee` がGitHub `main` に存在し、handoff refresh開始時 `HEAD...origin/main = 0 0` | この文書のcommit後の最終HEAD/parityはGitから再確認する |
| canonical build | `npm run build:public` 成功。HTML 1 / JS 1 / CSS 1、48,467 bytes | 既知のengine `fs` browser-externalize warningは残る |
| payload identity | canonical、committed embedded、built clientの全3ファイルでSHA-256一致 | source import後のHosted bytesは未確認 |
| adapter build | vinext 0.0.50 / Vite 8.0.13でbuild成功。`dist/server/index.js`、client assets、hosting manifestを生成 | Sites build/saveの証明ではない |
| local runtime | built Worker + asset bindingをWrangler localで起動。root redirect、Studio HTML、JS、CSSをHTTP確認 | production URLではない |
| browser behavior | Chromium 3/3。auto-start、choice、node edit、reload localStorage、JSON export/import成功 | Safari/Firefox/physical device/assistive techは未確認 |
| responsive / visual | desktopと390 x 844をfull-page captureし目視。adapter wrapperやoverflowなし | human product acceptanceではない |
| public boundary | 3 files / 48,467 bytes、禁止パターン9分類、form/remote script/style/visible commercial linkなし | hosted dispatch headers/accessは未確認 |
| hosting manifest | `.openai/hosting.json` は `d1: null`, `r2: null` のみ | `project_id`をfabricateしていない |

2026-07-21のremote-ready再確認では、Node `v24.13.0` / npm `11.6.2` で
payload identity、bounded scan、vinext build、Chromium E2E、repo safety gateを
順番に再実行した。これはローカルadapterの再現性確認であり、Sites上のbuild/save、
deployment、access policy、public releaseの証明ではない。

同じ確認で `npm ci --foreground-scripts` はexit 0（995 packages）、続く
`npm ls --depth=0` もexit 0だった。fresh install後もnpm 11は
`@napi-rs/wasm-runtime` と `@tybys/wasm-util` を `extraneous`、Windowsでは不要な
`@rollup/rollup-linux-x64-gnu` をunmet optionalとして表示する。これは現在の
lock/installから再現する非阻害のtoolchain表示であり、adapter failureではない。

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

## Residual work

- **S1B Sites source import/version save**: purposeはadapter sourceをSitesが無改変で
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

## Exact next gate

最優先は **S1B source import and version save only**。

1. Sitesへ `apps/sites-public-studio-adapter/` をsource projectとして渡す。
2. private/unpublishedを維持し、sharing、analytics、form、domain、auth、storage、
   commerceを無効のままにする。
3. source buildとversion saveだけを試す。
4. deploymentが必要と表示されたら実行せず停止する。
5. exact step、visible message、version save成否、first render前後を返す。

再開時は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書を読む。
adapter laneでは続けて `docs/sites/SITES_SOURCE_ADAPTER.md` と
`docs/sites/PUBLIC_STUDIO_READINESS.md` を読む。

```powershell
git fetch --prune origin
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
