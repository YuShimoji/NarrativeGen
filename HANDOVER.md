# 作業申し送り

## 現在地 — 2026-11-22（前提から物語を組む試作）

- 開発目標: 作者が物と人物の知識を一度定義すれば、エンジンが違和感・出来事・文章・選択肢の開閉を決定論で導き、
  作者がその判断を画面で確かめられる実験的な物語生成システム（原初設計「Entity中心のプロパティ駆動型ナラティブ生成」）。
- 今回の増分: 物・人物・思い込み・場を書いた前提ファイルから、出来事の連なりが組み上がり、Studioで再生でき、
  なぜその展開になったかを導出の記録で読めること。あわせて制作ワークフローを7工程に体系化した。
- 現在のボトルネック: userによる方式の採否（前提から組む試作で置いた仮の決め）と、Studio編集の受入。

2026-11-22、userが再開時に3点を依頼した（原文は[要求台帳](docs/USER_REQUEST_LEDGER.md)）: 開発ワークフローの体系化、
ストーリー構築方法の具体化、前提をいくつか与えただけで蓋然的にストーリーが構築できるシステムのプロトタイプ。
初版は[制作ワークフロー SP-PIPE-001](docs/specs/pipeline-workflow.md)と[前提から物語を組む SP-PREMISE-001](docs/specs/premise-driven-story.md)。
2026-11-21の再構築（画面A「判断を横に添える」、ゲーム層の凍結、その場で編集）は[決定履歴](docs/governance/decision-log.md)と
[SP-STUDIO-001](docs/specs/studio-rebuild.md)のとおりで変えていない。

## 使えるもの

| 対象 | 状態 | 起動・確認 |
|---|---|---|
| 前提から物語を組む（試作） | 前提ファイル → 物語のモデル＋導出の記録。違和感はエンジンが決め、行為は前提の数値による重みで選ぶ。結末の割合と、意図を満たす最も蓋然な主線を出す（方法は[SP-PREMISE-001](docs/specs/premise-driven-story.md)） | `npm run generate:story -- models/premises/cheeseburger-weight.json` → Studioの物語選択「cheeseburger-weight（前提から生成）」。[導出の記録の見本](docs/samples/premise-story-cheeseburger-weight-review-ja.md) |
| Studio（主画面） | 実行（本文＋判断の列＋道筋）、点検、その場で編集（範囲は[SP-STUDIO-001](docs/specs/studio-rebuild.md) 4節）。`models/`の物語は「保存」で元のJSONへ書き戻し。`models/generated/`の物語も選べる。小さい数値は有効3桁で表示。1440pxで確認（768pxは2026-11-21） | `npm run dev:studio` → `http://127.0.0.1:5185/`、編集関数の試験は`npm test -w @narrativegen/studio`（7件） |
| エンジンの判断の記録 | `packages/engine-ts/src/trace.ts`（`traceStart`・`traceStep`・`checkModel`ほか）。読み取り専用で意味論は変えない | `npm run test:engine`（29ファイル・367件、2026-11-22） |
| 旧Web Tester | 編集・グラフ・export等。置き換えまで残し、新機能は足さない | `npm run dev`（port 5173が他projectと衝突する時は下の注意） |
| サンプル | `originality-spine-probe.json`、`procedural-choice-spine-probe.json`、`vertical-slice.json` | Studioの物語選択 |
| ゲーム層（凍結） | Play演出・BGM、Unity SDK、Public Studio、Sites adapter。再構築中は変更しない | 再開は別の作業単位 |

点検の既知の限界: 数値が増え続ける物語（`full_integration`・`inventory_test`・`trading`・`tutorial`など8件）は
状態数2000で打ち切る。画面に打ち切りを明示し、「問題なし」は調べた範囲だけの結果と表示する。

## 人の確認待ち

| 確認 | 何が決まるか | 手順 | 返すもの |
|---|---|---|---|
| **前提から組む方式の採否** | 試作の仮の決め（[SP-PREMISE-001 4節](docs/specs/premise-driven-story.md)）を採るか直すか。Studioに前提の画面を作るか。Decision #4との関係 | 下の「前提から組む方式の確認手順」 | 項目ごとに採る／直す／捨てる。物語として読めたか、足りない出来事の種類 |
| **Studio編集の受入** | その場で編集で物語を直せるか。旧Web Testerを退役できるか | 下の「Studio編集の確認手順」 | 近い／一部違う／違う。足りない編集と、引っかかった操作 |
| G0 独自性の基準確認 | 試作が旧来のflag ADVと違うroute差を物語として伝えているか | Studioで`originality-spine-probe`の2つの結末を再生して比べる | pass、または具体的な欠陥 |

前提から組む方式の確認手順:

1. [導出の記録](docs/samples/premise-story-cheeseburger-weight-review-ja.md)を読む（人物ごとの判定、主線の各手の蓋然と理由、結末の割合）。
2. `npm run dev:studio`で「cheeseburger-weight（前提から生成）」を選び、主線（各場面の一番上の選択肢）を結末まで進める。
3. `models/premises/cheeseburger-weight.json`の許容幅や重さを変え、`npm run generate:story -- models/premises/cheeseburger-weight.json --no-write`で
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
| 前提から組む方式の採否 | 試作を仕様にするか、どこを直すかを決める | userが導出の記録と生成した物語を見る | pending / user | 上の手順 |
| 前提の画面と蓋然の表示 | JSONを書かずに前提を置き、数値を変えて結末の割合を比べる。蓋然と理由をStudioで読む | 方式の採否、画面のラフ | proposed / assistant | 採否の後にラフを出す |
| 前提生成の拡張 | 聞いた話で見込みを改める、複数の物と場、時間 | 方式の採否 | proposed / shared | 採否で挙がった不足から選ぶ |
| 生成物を直した後の扱い | 生成と手直しの行き来で食い違わない | 運用の決定（`models/examples/`へ写す案） | pending / user | 方式の採否と一緒に決める |
| Studio編集の受入 | 旧Web Testerを開かずに物語を直せるかを確かめる | userが実際の物語で試す | pending / user | 上の手順 |
| 編集の残り | 会話テンプレート・言い換え辞書・経過数の条件の編集、性質名の改名 | 受入で観測した摩擦から順を決める | proposed / assistant | 受入結果を見て作業単位を切る |
| 旧Web Tester退役 | 二つの画面の維持をやめる | 移す機能の棚卸しと退役条件 | proposed / shared | 編集の作業単位の後 |
| 点検の打ち切り緩和 | 数値が増え続ける物語でも全体を点検できる | 状態の同一視の方法を仕様で決める | proposed / assistant | 受入後 |
| `docs/AUTHORING_GUIDE.md`の更新 | 旧Web Tester中心の手順を7工程へ合わせる | 方式の採否 | proposed / assistant | 採否の後 |
| ゲーム層の再開 | 演出・Unity・Public Studio | 接続はmodel JSONとsession APIだけ（[Invariants](docs/INVARIANTS.md)） | frozen / user判断 | 再構築の区切りでuserが再開を決める |
| SP-DTYARN-001、G5〜G8、非blocking debt | 別のpurpose | 各専用packet | hold・proposed | [Roadmap](docs/plans/DEVELOPMENT_PLAN.md) |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。Studioは判断の記録を描くだけで意味論を複製しない。
- 前提から組む生成器は実行時の意味論を変えない。違和感の判定はエンジンの`perceiveEntity`を読むだけで、出力は通常のモデル。
- NarrativeGenは他作品への物語供給元ではない（2026-09-28）。AIは物語本文を執筆しない。生成器の骨子文は仮の文面で、作品の文章ではない。
- owner-only production deploymentは公開ではない。public release系はS3までlocked（ゲーム層の凍結中は触らない）。

## 再開手順

`AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書 → [SP-PIPE-001](docs/specs/pipeline-workflow.md)（工程の全体）→ 作業する工程の仕様。

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
