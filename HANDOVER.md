# 作業申し送り

## 現在地 — 2026-11-22（前提から物語を組む方式を採用、規則を整理）

- 開発目標: 作者が物と人物の知識を一度定義すれば、エンジンが違和感・出来事・文章・選択肢の開閉を決定論で導き、
  作者がその判断を画面で確かめられる実験的な物語生成システム（原初設計「Entity中心のプロパティ駆動型ナラティブ生成」）。
- 今回の増分: 前提から組んだ物語をStudioで進めながら、各場面で可能だった行為・蓋然・重みの内訳を右列で読めること。
  直して育てる物語は「写して育てる」で`models/examples/`へ写す。作業規則は1ファイルへ整理した。
- 現在のボトルネック: 行為の種類を直す向き（userの回答待ち）と、Studio編集の受入。

2026-11-22、userが再開時に3点を依頼した（原文は[要求台帳](docs/USER_REQUEST_LEDGER.md)）: 開発ワークフローの体系化、
ストーリー構築方法の具体化、前提をいくつか与えただけで蓋然的にストーリーが構築できるシステムのプロトタイプ。
初版は[制作ワークフロー SP-PIPE-001](docs/specs/pipeline-workflow.md)と[前提から物語を組む SP-PREMISE-001](docs/specs/premise-driven-story.md)。
同日、userは方式を採用し（[SP-PREMISE-001 4節](docs/specs/premise-driven-story.md)）、障害になっていた古い規則の整理を指示した（[作業規則](docs/REPO_LOCAL_RULES.md)）。
2026-11-21の再構築（画面A「判断を横に添える」、ゲーム層の凍結、その場で編集）は[決定履歴](docs/governance/decision-log.md)と
[SP-STUDIO-001](docs/specs/studio-rebuild.md)のとおりで変えていない。

## 使えるもの

| 対象 | 状態 | 起動・確認 |
|---|---|---|
| 前提から物語を組む | 前提ファイル → 物語のモデル＋導出の記録。違和感はエンジンが決め、行為は前提の数値による重みで選ぶ。結末の割合と、意図を満たす最も蓋然な主線を出す。Studioの右列の先頭に、場面ごとの蓋然と理由が出る（方法は[SP-PREMISE-001](docs/specs/premise-driven-story.md)） | `npm run generate:story -- models/premises/cheeseburger-weight.json` → Studioの物語選択「cheeseburger-weight（前提から生成）」。[導出の記録の見本](docs/samples/premise-story-cheeseburger-weight-review-ja.md) |
| Studio（主画面） | 実行（本文＋判断の列＋道筋）、点検、その場で編集（範囲は[SP-STUDIO-001](docs/specs/studio-rebuild.md) 4節）。`models/`の物語は「保存」で元のJSONへ書き戻し。`models/generated/`の物語は保存の代わりに「写して育てる」で`models/examples/`へ写す。小さい数値は有効3桁で表示。幅1440px・768pxで確認（2026-11-22、生成した物語の実行画面と蓋然の欄） | `npm run dev:studio` → `http://127.0.0.1:5185/`、編集関数の試験は`npm test -w @narrativegen/studio`（7件） |
| エンジンの判断の記録 | `packages/engine-ts/src/trace.ts`（`traceStart`・`traceStep`・`checkModel`ほか）。読み取り専用で意味論は変えない | `npm run test:engine`（29ファイル・368件、2026-11-22） |
| 旧Web Tester | 編集・グラフ・export等。置き換えまで残し、新機能は足さない | `npm run dev`（port 5173が他projectと衝突する時は下の注意） |
| サンプル | `originality-spine-probe.json`、`procedural-choice-spine-probe.json`、`vertical-slice.json` | Studioの物語選択 |
| ゲーム層（凍結） | Play演出・BGM、Unity SDK、Public Studio、Sites adapter。再構築中は変更しない | 再開は別の作業単位 |

点検の既知の限界: 数値が増え続ける物語（`full_integration`・`inventory_test`・`trading`・`tutorial`など8件）は
状態数2000で打ち切る。画面に打ち切りを明示し、「問題なし」は調べた範囲だけの結果と表示する。

## 人の確認待ち

| 確認 | 何が決まるか | 手順 | 返すもの |
|---|---|---|---|
| **行為を直す向き** | 前提から組む物語の行為（見る・話す・確かめる・そのままにする）をどう直すか。userは「直す」と回答し、向きは未指定 | Recordinatorの問い`01M81TNDSDKW3DMTH8MN8CXVJ5`（Project `pc96190c8a9`、2設問、2026-11-22送信） | 向きの選択。選択肢に無い直し方はメモか自由レビュー |
| **蓋然の欄と「写して育てる」の受入** | 物語を進めながら蓋然と理由を読めるか。写した後の編集で困らないか | 下の「前提から組んだ物語の確認手順」 | 近い／一部違う／違う。読みにくい所、足りない情報 |
| **Studio編集の受入** | その場で編集で物語を直せるか。旧Web Testerを退役できるか | 下の「Studio編集の確認手順」 | 近い／一部違う／違う。足りない編集と、引っかかった操作 |
| G0 独自性の基準確認 | 試作が旧来のflag ADVと違うroute差を物語として伝えているか | Studioで`originality-spine-probe`の2つの結末を再生して比べる | pass、または具体的な欠陥 |

前提から組んだ物語の確認手順:

1. `npm run dev:studio`で「cheeseburger-weight（前提から生成）」を選ぶ。右列の先頭の「蓋然」に、この場面で可能な行為・割合・重みの内訳が出る。
2. 選択肢を進め、「ここへ来た行為」と主線の印を見る。結末の場面では、この前提から起こりうる結末の割合が出る。
3. 「この場面を編集」で本文を直すと、蓋然の欄が「前提から組んだ物語と違っています」に変わる。「写して育てる」を押すと
   `models/examples/cheeseburger-weight.json`へ写り、以後は写しを「保存」で直す
   （試した写しを消す時は`models/examples/`と`apps/web-tester/models/examples/`の同名ファイルを削除する）。
4. `models/premises/cheeseburger-weight.json`の許容幅や重さを変え、`npm run generate:story -- models/premises/cheeseburger-weight.json --no-write`で
   物語と結末の割合の変化を見る（`--no-write`は見本を書き換えない。前提を戻す時は`git checkout -- models/premises/cheeseburger-weight.json`）。

Studio編集の確認手順:

1. `npm run dev:studio`→`procedural-choice-spine-probe`→「Ask Mira…」を選ぶ→「この場面を編集」。
2. 条件の知識ルールで`credibility`の予想を50→70にし、右列が「気づいた✓」→「気づいていない✗」に変わって選択肢が閉じるのを見る。
3. 「人物と物」を開いてMiraの許容幅を変える→「＋効果」で知覚を足す→「保存」→`git diff models/`
   （戻す時は`git checkout -- models/examples/procedural-choice-spine-probe.json`）。

S1 hosted runtime確認（Public Studioのowner-only Version 1）はゲーム層の凍結に含め、再開時に扱う。

## Residual work

| 項目 | purpose / effect | requirements | state / owner | next move |
|---|---|---|---|---|
| 行為の直し | 出てくる出来事の種類を増やす、人物ごとの差を書ける、など。userが選んだ向きで生成器を直す | 問い`01M81TNDSDKW3DMTH8MN8CXVJ5`の回答 | pending / user → assistant | 回答を読んで着手。見本と導出の記録を出し直す |
| 前提を置く画面 | JSONを書かずに前提を置き、数値を変えて結末の割合を比べる | 画面のラフ | proposed / assistant | 行為の直しの後にラフを出す |
| 前提生成の拡張 | 複数の物と場、時間の経過 | 行為の直しの結果 | proposed / shared | 行為の直しの後に不足から選ぶ |
| Studio編集の受入 | 旧Web Testerを開かずに物語を直せるかを確かめる | userが実際の物語で試す | pending / user | 上の手順 |
| 編集の残り | 会話テンプレート・言い換え辞書・経過数の条件の編集、性質名の改名 | 受入で観測した摩擦から順を決める | proposed / assistant | 受入結果を見て作業単位を切る |
| 旧Web Tester退役 | 二つの画面の維持をやめる | 移す機能の棚卸しと退役条件 | proposed / shared | 編集の作業単位の後 |
| 点検の打ち切り緩和 | 数値が増え続ける物語でも全体を点検できる | 状態の同一視の方法を仕様で決める | proposed / assistant | 受入後 |
| `docs/AUTHORING_GUIDE.md`の更新 | 旧Web Tester中心の手順を7工程へ合わせる | 行為の種類が決まること | proposed / assistant | 行為の直しと同じ作業単位で書く |
| ゲーム層の再開 | 演出・Unity・Public Studio | 接続はmodel JSONとsession APIだけ（[Invariants](docs/INVARIANTS.md)） | frozen / user判断 | 再構築の区切りでuserが再開を決める |
| SP-DTYARN-001、G5〜G8、非blocking debt | 別のpurpose | 各専用packet | hold・proposed | [Roadmap](docs/plans/DEVELOPMENT_PLAN.md) |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。Studioは判断の記録を描くだけで意味論を複製しない。
- 前提から組む生成器は実行時の意味論を変えない。違和感の判定はエンジンの`perceiveEntity`を読むだけで、出力は通常のモデル。
- NarrativeGenは他作品への物語供給元ではない（2026-09-28）。AIは見本・試験用の物語と骨子文を書いてよく、作品として採る文章と表現はuserが決める（[作業規則](docs/REPO_LOCAL_RULES.md)）。
- owner-only production deploymentは公開ではない。public release系はS3までlocked（ゲーム層の凍結中は触らない）。

## 再開手順

`AGENTS.md` → `docs/REPO_LOCAL_RULES.md`（2026-11-22に1ファイルへ整理。`docs/ai/`は廃止）→ この文書 → [SP-PIPE-001](docs/specs/pipeline-workflow.md)（工程の全体）→ 作業する工程の仕様。

```powershell
git switch main
git pull --ff-only origin main
npm ls --depth=0
npm run check:safety
npm run test:engine
npm run dev:studio
```

別端末のfresh cloneで依存関係が無い場合だけ、先に`npm ci --foreground-scripts`を一度完了させる。
旧Web TesterのE2E前はport 5173の使用者を確かめ、他projectのserverが使っていれば止めずに別portで実行する
（`reuseExistingServer`が他projectのページへ接続し、全件timeoutになるため）。

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess }
```
