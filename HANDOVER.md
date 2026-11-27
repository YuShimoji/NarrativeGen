# 作業申し送り

## 現在地 — 2026-11-27

- 作者が物と人物の知識を一度定義すれば、エンジンが違和感・出来事・文章・選択肢の開閉を決定論で導き、作者がその判断を画面で確かめられる実験的な物語生成システム（原初設計「Entity中心のプロパティ駆動型ナラティブ生成」）。
- Studioの現行サンプルは[藍布の耳](http://127.0.0.1:5185/?story=blue-selvedge)（証言と布の照合）、[潮待ちの石段](http://127.0.0.1:5185/?story=ebb-stair)（引き潮と運び道）、[六目の分銅](http://127.0.0.1:5185/?story=brass-weight)（人物の見込みから生成）。以前の25作は物語選択の「レガシーを開く…」にまとまり、[七人目の渡し賃](http://127.0.0.1:5185/?story=ash-ferry)などの直リンクも使える。
- 制作画面の開発順: ①同じ試算を再生・編集 → ②物語を保存・再読込 → ③作者の意図と前提を保存・再読込。Codexが自作前提1本で確認済み。次は作者が実作品で操作と物語のつながりを確認する。

11月22日の再開依頼3点と規則整理の指示は[要求台帳](docs/USER_REQUEST_LEDGER.md)にある。成果は[制作ワークフロー SP-PIPE-001](docs/specs/pipeline-workflow.md)と[前提から物語を組む SP-PREMISE-001](docs/specs/premise-driven-story.md)。方式の採用はSP-PREMISE-001 4節、整理後の規則は[作業規則](docs/REPO_LOCAL_RULES.md)。
11月21日の再構築（画面A「判断を横に添える」、ゲーム層の凍結、その場で編集）は[決定履歴](docs/governance/decision-log.md)と[SP-STUDIO-001](docs/specs/studio-rebuild.md)。

## 使えるもの

| 対象 | 状態 | 起動・確認 |
|---|---|---|
| 前提から物語を組む | 前提ファイル → 物語のモデル＋導出の記録。違和感はエンジンが決め、行為（見る・見直す・話す・尋ねる・確かめる・そのままにする）は前提の数値による重みで選ぶ。聞いた話で人物の見込みと許容幅が変わる。結末の割合と、意図を満たす最も蓋然な主線を出す。Studioの右列の先頭に、場面ごとの蓋然と理由が出る（方法は[SP-PREMISE-001](docs/specs/premise-driven-story.md)） | `npm run generate:story -- models/premises/brass-weight.json` → Studioの物語選択「六目の分銅（前提から生成）」。[導出の記録の見本](docs/samples/premise-story-cheeseburger-weight-review-ja.md) |
| Studio（主画面） | 実行（本文＋判断の列＋道筋）、点検、その場で編集（範囲は[SP-STUDIO-001](docs/specs/studio-rebuild.md) 4節）。`models/`の物語は「保存」で元のJSONへ書き戻し。`models/generated/`の物語は保存の代わりに「写して育てる」で`models/examples/`へ写す。小さい数値は有効3桁で表示。幅1440px・768pxで確認（2026-11-22、生成した物語の実行画面と蓋然の欄） | `npm run dev:studio` → `http://127.0.0.1:5185/`、編集関数の試験は`npm test -w @narrativegen/studio`（7件） |
| エンジンの判断の記録 | 物の性質で選択肢が開閉し、証言などの出来事で条件付きの本文が変わる。Studioの判断欄には条件が変わった手数と操作、更新された出来事の値が出る。点検は待つ操作や証言の更新を含む道筋をたどる | [レシートの矛盾](http://127.0.0.1:5185/?story=originality-spine-probe)でミラに照合を頼み、台帳へ進む条件の出所を見る。[判断の仕様](docs/specs/studio-rebuild.md) |
| 画面フレーム（SP-SCREEN-001） | TSとC# SDKが同じ経路から同じ画面情報を出す。UnityのEditor試遊とWritingPageのReaderで「藍布の耳」の固定経路を確認済み | `npm run check:screen-frames`、Studio試験、.NET試験（`ScreenFrameConformanceTests`）。[仕様](docs/specs/screen-frame.md) |
| 旧Web Tester | 編集・グラフ・export等。置き換えまで残し、新機能は足さない | `npm run dev`（port 5173が他projectと衝突する時は下の注意） |
| レガシー | 「閉館前の返却箱」は鍵の本数から生まれる選択を比べられる。「舞台の暗転」と「搬入口の荷箱」は三人が同じ証言を聞く前後を比べられる | 「レガシーを開く…」で物語か「見本場面｜証言への反応を比べる」を選ぶ。[見本の仕様](docs/specs/premise-driven-story.md#3-試作の契約) |
| ゲーム層 | Unity SDKはStudioの話者ラベルと、継承した物の属性を読む選択肢条件に対応。Play演出・BGM、Public Studio、Sites adapterは作業場再構築中の凍結を継続 | .NET試験38件。現行3作「藍布の耳」「潮待ちの石段」「六目の分銅」の各1経路を結末まで確認（2026-11-26）。既存のチーズバーガー2モデルでも知覚イベント・条件付き選択肢・動的本文を確認 |

数値が増え続ける物語（`full_integration`・`inventory_test`・`trading`・`tutorial`など8件）の点検は状態数2000で打ち切る。画面に打ち切りを明示し、「問題なし」は調べた範囲だけの結果と表示する。

## UnityChatNovelGame・WritingPageとの接続

本人依頼（2026-11-27）「NarrativeGen と UnityChatNovelGameおよびWritingPageを接続するタスクについて明確化してリモートに反映して、開発再開可能なようにしてください。」画面の互換性を求めた11月26日の原文と着手時の差は[SP-SCREEN-001](docs/specs/screen-frame.md)にある。

WritingPageで書いた本文・話者・分岐をStudioで試遊し、原稿に戻せるようにする。同じ物語をStudioとUnityで進め、選んだ経路をWritingPageのReaderで読めるようにする。

| 工程と担当 | 現在地 | 操作・確認 |
|---|---|---|
| 画面と原稿受け渡しの契約 / NarrativeGen | [SP-SCREEN-001](docs/specs/screen-frame.md) v1のTS・C#基準と[SP-WP-001](docs/specs/writingpage-io-contract.md) 0.2。Studioから取り込み・書き出しができる | 物語の一覧にあるWritingPageの操作を使う。取り込みは新規モデル。条件・効果などが渡らない場合は書き出し前に確認が出る。互換エラーでも開いていたモデルと再生位置を保持する |
| Editorでの再生 / UnityChatNovelGame | [Editor試遊](https://github.com/YuShimoji/UnityChatNovelGame/blob/main/docs/HANDOFF.md#narrativegenの試遊)のSDK `43dc307`で「藍布の耳」を6選択で結末まで確認 | StudioとGameビューで場所・話者・段落・選択肢・手帳3件・結末を照合。配布Playerへの組み込みは別工程 |
| 原稿入出力とReader / WritingPage | 「構造 → ドキュメント → 入出力」で原稿を読み込み・書き出しできる。コマンドパレットから再生記録をReaderに開ける | StudioとWritingPageで受付の3場面を往復し、保存・再読込後も本文・話者・分岐・ルビが一致。Studioで2経路を結末まで再生。Readerで「藍布の耳」の場所・左右の吹き出し・手帳3件・結末と、執筆画面への復帰を確認 |

画面比較には [藍布の耳のモデル](models/examples/blue-selvedge.json) と [固定の選択経路・期待フレーム](packages/tests/NarrativeGen.Tests/ScreenFrames/blue-selvedge.json) を使う。原稿の往復には [受付の分岐サンプル](docs/samples/writingpage/README.md) を使う。ゲームの進行・条件の正本はNarrativeGenのモデルJSONとランタイム。WritingPageは選んだ経路をReaderで表示し、ゲームの選択実行はStudio・Unityが受け持つ。

## 人の確認待ち

| 確認 | 何が決まるか | 手順 | 返すもの |
|---|---|---|---|
| **蓋然の欄と「写して育てる」の受入** | 物語を進めながら蓋然と理由を読めるか。写した後の編集で困らないか | 下の「前提から組んだ物語の確認手順」 | 近い／一部違う／違う。読みにくい所、足りない情報 |
| **Studio編集の受入** | その場で編集で物語を直せるか。旧Web Testerを退役できるか | 下の「Studio編集の確認手順」 | 近い／一部違う／違う。足りない編集と、引っかかった操作 |
| G0 独自性の基準確認 | 試作が旧来のflag ADVと違うroute差を物語として伝えているか | Studioで「レシートの矛盾（独自性の検証）」の2つの結末を再生して比べる | pass、または具体的な欠陥 |

前提から組んだ物語の確認手順:

1. `npm run dev:studio`で「チーズバーガーの重さ（聞いた話で見方が変わる）（前提から生成）」を選ぶ。右列の先頭の「蓋然」に、この場面で可能な行為・割合・重みの内訳が出る。
2. 「主線」の印が付いた行為の選択肢を進める。目撃者Bは酔った人と話して見直すと違和感が消え、酔った人は探偵Aに尋ねて見直すと違和感を覚える。「ここへ来た行為」の下に、見込みと許容幅がどう変わったかが出る。同じ内容の文章版は[導出の記録](docs/samples/premise-story-cheeseburger-weight-hearsay-review-ja.md)。
3. 「チーズバーガーの重さ（前提から生成）」は、採用済みの意図（共通の話題・食い違い）のまま組み直した物語。尋ねる・見直すは主線の脇の行為として出る。
4. 「この場面を編集」で本文を直すと、蓋然の欄が「前提から組んだ物語と違っています」に変わる。「写して育てる」を押すと`models/examples/<名前>.json`へ写り、以後は写しを「保存」で直す（試した写しを消す時は`models/examples/`と`apps/web-tester/models/examples/`の同名ファイルを削除する）。
5. `models/premises/cheeseburger-weight-hearsay.json`の許容幅や重さを変え、`npm run generate:story -- models/premises/cheeseburger-weight-hearsay.json --no-write`で物語と結末の割合の変化を見る（`--no-write`は見本を書き換えない。前提を戻す時は`git checkout -- models/premises/`）。

Studio編集の確認手順:

1. `npm run dev:studio`→「レシートの矛盾（選択肢の開閉）」→「ミラに書庫の記憶と照合してもらう」を選ぶ→「この場面を編集」。
2. 条件の知識ルールで`credibility`の予想を50→70にし、右列が「気づいた✓」→「気づいていない✗」に変わって選択肢が閉じるのを見る。
3. 「人物と物」を開いてMiraの許容幅を変える→「＋効果」で知覚を足す→「保存」→`git diff models/`（戻す時は`git checkout -- models/examples/procedural-choice-spine-probe.json`）。

## Residual work

| 項目 | purpose / effect | requirements | state / owner | next move |
|---|---|---|---|---|
| 前提から一本を作る | 前提と意図を入力し、同じ試算の物語を再生・編集・保存する | [Studio](http://127.0.0.1:5185/) の物語の一覧 →「前提入力を開く」→「自分の前提を作る」 | 制作経路あり / 作者受入前 | 「この物語を開く」→結末→本文編集→「物語を保存」→一覧から「物語のファイルを開く」。前提は「前提を保存／開く」で再試算 |
| 前提生成の拡張 | 複数の物と場、時間の経過、又聞き・嘘・聞き違い | userがどれを先にするか | proposed / shared | userが選んだものから着手 |
| Studio編集の受入 | 旧Web Testerを開かずに物語を直せるかを確かめる | userが実際の物語で試す | pending / user | 上の手順 |
| 編集の残り | 会話テンプレート・言い換え辞書・経過数の条件の編集、性質名の改名 | 受入で観測した摩擦から順を決める | proposed / assistant | 受入結果を見て作業単位を切る |
| 旧Web Tester退役 | 二つの画面の維持をやめる | 移す機能の棚卸しと退役条件 | proposed / shared | 編集の作業単位の後 |
| 点検の打ち切り緩和 | 数値が増え続ける物語でも全体を点検できる | 状態の同一視の方法を仕様で決める | proposed / assistant | 受入後 |
| `docs/AUTHORING_GUIDE.md`の更新 | 旧Web Tester中心の手順を7工程へ合わせる | なし（行為と式は採用済み） | proposed / assistant | 約32KBの文書の全面更新になるため、別の作業単位で書く |
| ゲーム層の再開 | 演出・Public Studio（S1のowner-only Version 1のhosted runtime確認を含む）・Sites adapter | 接続はmodel JSONとsession APIだけ（[Invariants](docs/INVARIANTS.md)） | frozen / user判断。Unity互換修正は再開済み | 再構築の区切りでuserが再開を決める |
| SP-DTYARN-001、G5〜G8、非blocking debt | 別のpurpose | 各専用packet | hold・proposed | [Roadmap](docs/plans/DEVELOPMENT_PLAN.md) |

## Product / authority boundary

- JSONがfull-fidelity sourceで、TypeScript engineがruntime semanticsの正本。Studioは判断の記録を描くだけで意味論を複製しない。
- 前提から組む生成器は実行時の意味論を変えない。違和感の判定はエンジンの`perceiveEntity`を読むだけで、出力は通常のモデル。
- NarrativeGenは他作品への物語供給元ではない（2026-09-28）。AIは見本・試験用の物語と骨子文を書いてよく、作品として採る文章と表現はuserが決める（[作業規則](docs/REPO_LOCAL_RULES.md)）。
- owner-only production deploymentは公開ではない。public release系はS3までlocked（ゲーム層の凍結中は触らない）。

## 再開手順

`AGENTS.md` → `docs/REPO_LOCAL_RULES.md`（2026-11-22に1ファイルへ整理。`docs/ai/`は廃止）→ この文書 → [SP-PIPE-001](docs/specs/pipeline-workflow.md)（工程の全体）→ 作業する工程の仕様。

`main`はStudioの前提入力と聞き込みクエスト（旧`studio-premise-input-draft`）、Unity SDK互換修正（旧`unity-playback-compatibility`）、画面フレームと0.2を含む。別端末の作業差分を保全して`main`から再開する。fresh cloneで依存関係が無い時は先に`npm ci --foreground-scripts`を実行する。

```powershell
git switch main
git pull --ff-only origin main
npm ls --depth=0
npm run check:safety
npm run test:engine
npm run dev:studio
```

旧Web TesterのE2E前はport 5173の使用者を確かめる。他projectのserverが使っていれば別portで実行する（`reuseExistingServer`で他projectに接続すると全件timeoutになる）。

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess }
```
