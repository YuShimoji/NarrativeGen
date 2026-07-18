# 作業申し送り

## 現在地 — 2026-07-19

`main` / `origin/main` が開発正本。今回の `SITES_PUBLIC_STUDIO` 実装は、clean かつ remote parity `0 0` の `47bfc90` から開始し、`git fetch --prune origin` と `git pull --ff-only origin main` で追加差分がないことを確認した。現在の Git hash と parity は再開時に Git から読み直すこと。

現在の優先 lane は `IMPLEMENT / SITES_PUBLIC_STUDIO / S0 local candidate`。`apps/public-studio/` に、公開向けの日本語優先デモ兼ローカル編集sandboxが独立 workspace として存在する。これは `packages/engine-ts` と canonical `models/examples/procedural-choice-spine-probe.json` を build-time に再利用する静的 projection であり、Web Tester、engine semantics、G2 contract、Unity、provider/API、WritingPage を変更していない。

S0 はローカル受入れ済み。Sites への取り込み、private save、公開、analytics、商用リンクの有効化は実行していない。Sites verdict は **`local_candidate`** であり、次は human-owned の private import/save gate だけを行う。

## 監修AIへの実行可能な現状報告

| 判断対象 | 確認済みの現在状態 | 意味 / 境界 |
|---|---|---|
| リモート正本 | slice 開始時 `47bfc90`、`main...origin/main = 0 0`、pull済み | 未取得差分を抱えず実装した。最終 parity は現在の Git で再確認する |
| 開発再開性 | Node 24.13.0 / npm 11.6.2。固定 lock から `npm ci --ignore-scripts --no-audit --prefer-offline` が 852 packages を再展開し、`npm ls --depth=0` 成功 | workspace link、Vite 8.0.7、Playwright 1.58.2、shared engine dependency が充足している |
| 公開候補 | `apps/public-studio/dist/` は HTML 1 / CSS 1 / JS 1、計 48,467 bytes。JS/CSS参照は `./assets/...` | 静的・relative-path candidate。Sites private save compatibility や public hosting の証明ではない |
| 体験 | サンプルは開始操作なしで表示され、shared browser engine の choice transition を実行する | 独自 runtime や copied evaluator を持たない |
| 編集 | node本文、choice表示文、choice遷移先、selected-node preview、簡易validation | v0 は existing node/choice 編集のみ。node作成・削除・graph authoringは未実装 |
| 下書き / transfer | versioned localStorage、reload復元、reset、JSON export/import。E2E export は full Node `loadModel` を通過 | browser/profile local。account、server save、cross-device sync、personal data はない |
| responsive | Chromium desktop と 390 x 844 を操作し、narrow horizontal overflow 0、両 screenshot を目視確認 | physical device、Safari/Firefox、assistive tech、production acceptance は未確認 |
| 公開面境界 | generated text assets 9分類 scan pass。DOMに form / remote script/styleなし。商用linkは未設定時hidden | AI/API-key/internal debug、auth、personal data、payment/checkout/card/subscription/Stripe、analyticsを追加していない |
| 商用情報 | 情報セクションのみ。optional `VITE_PUBLIC_STUDIO_CONTACT_URL` は HTTPS限定で、既定は空・非表示 | URL承認はhuman gate。取引、契約、決済、問い合わせ送信はStudio内で完結しない |

## Local acceptance evidence

- `npm ls --depth=0`: exit 0。Public Studio workspace、engine、Playwright 1.58.2、Vite 8.0.7 を解決。既存 Web Tester の platform-specific optional Rollup dependency が Windows で未充足と表示されるが exit 0。
- `npm run test:public`: 4/4 pass。canonical sample の full engine validation、draft validation fail-closed、canonical/engine reuse、no account/personal-data form を確認。
- `npm run build:public`: engine TypeScript build と Vite production build が pass。Vite は shared `entities.js` の `fs` を browser externalize した旨を警告するが、生成とruntime smokeは成功。
- `npm run scan:public`: 3 files / 48,467 bytes、relative JS/CSS、9 forbidden pattern classificationsが pass。
- `npm run test:e2e:public`: Chromium 3/3 pass。auto-start/engine transition/edit、reload persistence/export-full-validation/import、desktop+narrow layout/public boundaryを確認。
- `npm run check:safety`: spec-index 37、docs authority tests 4/4、94 Markdown filenames、342 text files encoding、19 synced modelsが pass。
- `git diff --check`: documentation closeout前の executable deltaで pass。最終 staging前に再実行する。

実ビルドの画像は Playwright の ignored `apps/public-studio/test-results/` に同一端末の一時 evidence として生成される。Git正本ではなく、再実行で置き換わる。

## Product and authority boundaries

- JSON が full-fidelity source。Public Studio はcanonical sampleをcompile時にcloneし、公開向けchoice copyだけを上書きする。
- TypeScript engineがruntime semanticsのsource of truth。Public Studio固有のchoice evaluatorはない。
- G2 SP-KNOW-002 は `done` のまま。pure knowledge-derived choice availability と zero persistent-event mutation の契約を変更していない。
- G3 Choice Consequence Lens は `proposed / unlocked` のまま。この後選ばれる説明パターンは public surfaceへ投影可能だが、internal diagnosticsや推測文を露出させない別sliceが必要。
- G4〜G8 の依存ladderは維持。Public StudioのS0完了は、G3実装、G5 Unity parity、G8 public distributionを承認しない。
- publication、Sites save、analytics、domain/brand/legal、contact URL、auth/personal data、commerce、production/physical-device acceptanceはhuman-owned gate。

## Residual work

- **S1 private Sites compatibility**: purposeはstatic candidateがSites内でsemanticsを変えずprivate save/previewできるかを知ること。effectは`local_candidate`維持または`needs_adapter`/`blocked`への根拠付き分類。requirementsはprivate unpublished project、`apps/public-studio/dist/`、publication/analytics/form/domain/commerceを無効のままにすること。stateはpending human gate。ownerはuser/operator。next moveは `docs/sites/PUBLIC_STUDIO_READINESS.md` のexact gateを実行し、指定JSONを返す。
- **S2 evidence-led editing improvement**: purposeは最も大きい実観測摩擦を1つ減らすこと。effectはpublic editorを推測で広げず使いやすくすること。requirementsはS1または日本語local reviewから具体的な1件を選ぶこと。stateはproposed、未承認。ownerはshared。next moveはfinding受領後に1 bounded sliceを定義する。
- **Engine browser packaging debt**: purposeはViteの`fs` externalization warningを消しbrowser boundaryを明確にすること。effectはhosting adapterの不確実性とbundle shimを減らすこと。requirementsは`entities.ts`のNode CSV I/Oとpure entity resolutionの分離、engine/browser regression。stateはnon-blocking quality debt。ownerはassistant after dedicated engine packet。next moveはS1でruntime failureが出た場合だけadapterより先に再評価する。
- **Cross-browser / physical-device review**: purposeはChromium single-machine evidenceの境界を広げること。effectはresponsive/accessibility confidence向上。requirementsは対象browser/deviceとacceptance scopeの選定。stateはunverified review debt。ownerはshared/human for physical devices。next moveはpublic release gateが見えた時に専用matrixを決める。
- **G0 human originality review**: purposeはmachine correctnessとstory/Japanese/GUI usefulnessを分けること。effectはG2 probeへのhuman passまたは具体的defect。requirementsはexisting Web Tester両routeとDashboardのreview。stateはpending user-owned。next moveはPublic Studio gateと混ぜず既存review flowを使う。
- **G3 Choice Consequence Lens**: purposeはwhy available / what changes / what opensをdeterministic factsから説明すること。effectはauthor explanation surfaceと将来のpublic explanation projectionの方向選定。requirementsはseparate EXPLORE packetと3つのmaterially different same-content directions。stateはproposed/unlocked。ownerはshared direction。next moveはSites laneとは別missionでEXPLOREする。
- **Release/security/toolchain debt**: purposeはsupported reproducible consumption。effectはlint/audit/toolchain/negative path gates。requirementsはhuman-approved dependency/toolchain scope。stateはnon-blocking、未承認。ownerはshared。next moveはdedicated sliceとし、Public Studioへ自動upgradeを混ぜない。

## Exact next gate

最優先は **S1 private Sites import/save**。公開しない。手順・success signal・返却JSONは `docs/sites/PUBLIC_STUDIO_READINESS.md` が正本。Sitesがbuilt outputを受けずsource-onlyの場合は、その場で `needs_adapter` として止める。別runtime、external service、publicationで迂回しない。

S1成功後に進められる最遠の安全な主線は次の通り。

1. private Sites compatibilityを事実化する。
2. local/Sites reviewで最大のediting frictionを1件だけ選び、S2 bounded improvementで解消する。
3. 別laneのG3でChoice Consequence Lensのmacro directionを選び、deterministic explanationをauthor用に固定する。
4. G4の8-node evidence-mysteryでauthor -> validate -> play -> save/reload -> exportを一度end-to-endに実証する。
5. G4で観測した摩擦だけをG6 authoring experienceへ渡す。
6. G5 Unity parityとG7 release readinessは独立trackで閉じる。
7. S3/G8のpublic distribution、analytics、commercial contactは明示的human release gate後だけ開く。

この順序はroadmap提案であり、S1以外の実装承認を意味しない。

## 再開

通常は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書だけを読む。Public Studioのreview/gateでは次に `docs/sites/PUBLIC_STUDIO_READINESS.md` を読む。

```powershell
git fetch --prune origin
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
npm ls --depth=0
npm run test:public
npm run build:public
npm run scan:public
```

Local review URLは `http://127.0.0.1:4174/` (`npm run preview:public`)。Safe next commandは `git status --short --branch`。S1 private gate、G0 human review、G3 EXPLORE、G5 IMPLEMENT、release/toolchainは目的とauthorityが異なるため同一sliceへ混ぜない。
