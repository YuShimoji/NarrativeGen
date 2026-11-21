# 作業申し送り

## 現在地 — 2026-11-21（再構築を開始）

- 開発目標: 作者が物と人物の知識を一度定義すれば、エンジンが違和感・出来事・文章・選択肢の開閉を決定論で導き、
  作者がその判断を画面で確かめられる実験的な物語生成システム（原初設計「Entity中心のプロパティ駆動型ナラティブ生成」）。
- 今回の増分: Studioの編集欄で知識ルール・知覚・複合条件・人物と物の定義・場面の改名と削除まで直し、知識の予想値や
  許容幅を変えると右列の違和感と選択肢の開閉がすぐ変わるのを見ながら、元のJSONへ保存できること。
- 現在のボトルネック: userによる編集の受入（実際の物語を直してみて、何が足りないか）。

2026-11-21、userが再起動時に「作り変えるぐらいの再構築」を依頼し、確認画面がJSON中心でエンジンの機能を判断しにくい・
ゲーム部分の同時開発に全体が没頭する・Web画面がボタンまみれ、の3点を挙げた。構想図（構成図と画面3案）を見て、
画面A「判断を横に添える」とゲーム層の凍結を選んだ（[決定履歴](docs/governance/decision-log.md)、
[仕様 SP-STUDIO-001](docs/specs/studio-rebuild.md)）。同日朝に選んだG3 Lens EXPLOREはStudioの右列に吸収した。
同日、画面Aを見て「近い、編集へ進む」と返答。編集は推奨既定の「その場で編集」で実装した（変える場合は決定履歴の該当行を見直す）。
続けて「知識ルールおよび推奨工程への編集へ進められますか」と依頼され、残りの編集を推奨順で一度に実装した。

## 使えるもの

| 対象 | 状態 | 起動・確認 |
|---|---|---|
| Studio（新・主画面） | 実行（本文＋判断の列＋たどった道筋）、点検（全選択肢を実際に選ぶ物語点検）、その場で編集（話者・本文・選択肢・行き先・新しい場面・条件と効果。知識ルール・物の性質・すべて／どれか／満たさない・知覚・場面に入った時の知覚・人物と物の定義・場面の改名と削除まで。右列が即時に追従）。`models/`の物語は「保存」で元のJSONへ書き戻し（`loadModel`の検査に通る時だけ）、ドロップしたファイルは書き出し。1440px・768pxで確認済み | `npm run dev:studio` → `http://127.0.0.1:5185/`、編集関数の試験は`npm test -w @narrativegen/studio`（7件） |
| エンジンの判断の記録 | `packages/engine-ts/src/trace.ts`（`traceStart`・`traceStep`・`traceText`・`traceCondition`・`checkModel`ほか）。読み取り専用で意味論は変えない。`index.ts`と`browser.ts`から公開 | `npm run test:engine`（28ファイル・357件、2026-11-21） |
| 旧Web Tester | 編集・グラフ・export等。置き換えまで残し、新機能は足さない | `npm run dev`（port 5173が他projectと衝突する時は下の注意） |
| サンプル | `originality-spine-probe.json`（知覚→出来事→差し込み→選択肢解放の一連が出る）、`procedural-choice-spine-probe.json`（knowledgeRule条件）、`vertical-slice.json` | Studioの物語選択 |
| ゲーム層（凍結） | Play演出・BGM、Unity SDK、Public Studio、Sites adapter。再構築中は変更しない | 再開は別の作業単位 |

点検の既知の限界: 数値が増え続ける物語（`full_integration`・`inventory_test`・`trading`・`tutorial`など8件）は
状態数2000で打ち切る。画面に打ち切りを明示し、「問題なし」は調べた範囲だけの結果と表示する。

## 人の確認待ち

| 確認 | 何が決まるか | 手順 | 返すもの |
|---|---|---|---|
| **Studio編集の受入** | その場で編集で物語を直せるか。旧Web Testerを退役できるか | `npm run dev:studio`→`procedural-choice-spine-probe`→「Ask Mira…」を選ぶ→「この場面を編集」→条件の知識ルールで`credibility`の予想を50→70にして右列が「気づいた✓」→「気づいていない✗」に変わり選択肢が閉じるのを見る→「人物と物」を開いてMiraの許容幅を変える→「＋効果」で知覚を足す→「保存」→`git diff models/`（戻す時は`git checkout -- models/examples/procedural-choice-spine-probe.json`）。本文・選択肢・行き先は`originality-spine-probe`で同様に試せる | 近い／一部違う／違う。足りない編集と、引っかかった操作 |
| G0 独自性の基準確認 | 試作が旧来のflag ADVと違うroute差を物語として伝えているか | Studioで`originality-spine-probe`の2つの結末を再生して比べる（旧手順は[originality review](docs/samples/originality-spine-probe-review-ja.md)） | pass、または具体的な欠陥 |

S1 hosted runtime確認（Public Studioのowner-only Version 1）はゲーム層の凍結に含め、再開時に扱う。

## Residual work

| 項目 | purpose / effect | requirements | state / owner | next move |
|---|---|---|---|---|
| Studio編集の受入 | 旧Web Testerを開かずに物語を直せるかを確かめる | userが実際の物語で試す | pending / user | 上の手順 |
| 編集の残り | 会話テンプレート（差し込み文）・言い換え辞書・経過数の条件の編集、性質名の改名 | 受入で観測した摩擦から順を決める | proposed / assistant | 受入結果を見て作業単位を切る |
| 旧Web Tester退役 | 二つの画面の維持をやめる | 移す機能の棚卸しと退役条件 | proposed / shared | 編集の作業単位の後 |
| 点検の打ち切り緩和 | 数値が増え続ける物語でも全体を点検できる | 状態の同一視の方法を仕様で決める（意味論は変えない） | proposed / assistant | 受入後 |
| 言い換え・描写追跡の記録 | `[entity~]`と言い換え辞書の判断も右列で見える | traceの拡張 | proposed / assistant | 編集より後 |
| ゲーム層の再開 | 演出・Unity・Public Studio | 接続はmodel JSONとsession APIだけ（[Invariants](docs/INVARIANTS.md)） | frozen / user判断 | 再構築の区切りでuserが再開を決める |
| SP-DTYARN-001、G5〜G8、非blocking debt | 別のpurpose | 各専用packet | hold・proposed | [Roadmap](docs/plans/DEVELOPMENT_PLAN.md) |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。Studioは判断の記録を描くだけで意味論を複製しない。
- NarrativeGenは他作品への物語供給元ではない（2026-09-28）。AIは物語本文を執筆しない。
- owner-only production deploymentは公開ではない。public release系はS3までlocked（ゲーム層の凍結中は触らない）。

## 再開手順

`AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書 → [SP-STUDIO-001](docs/specs/studio-rebuild.md)。

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
