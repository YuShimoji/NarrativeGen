# Decision Log（全件）

ルート [`CLAUDE.md`](../../CLAUDE.md) には直近の抜粋のみ掲載。ここに**日付順の全記録**を置く（主に 2026-03-16 〜 2026-03-27 のブロック）。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-11-23 | 前提から組む物語の行為を6種（見る・見直す・話す・尋ねる・確かめる・そのままにする）にし、聞いた話で人物の見込みと許容幅が変わるようにした。聞いた後の値は生成したモデルの人物に派生の知識として書き、実行時の意味論とスキーマは変えていない | 見込みの更新: エンジンの効果に許容幅の上書きを足す / 派生の知識をモデルに書く。聞いた値の持ち方: 聞いた順に数値を更新する / 聞いた相手の集合で決める | userが問い`01M81TNDSDKW3DMTH8MN8CXVJ5`で「行為の種類を増やす」「行為の結果で見込みが変わるようにする」、足す行為に「尋ねる」「見直す」を選び、「人物ごとの設定というより状況と前提などの組み合わせで、この人物だからこの経路が塞がれる、という作りではなくしたい。」と書いた。派生の知識にしたのは、意味論とUnity側の一致に触れずに済むため。集合にしたのは、順番に依らず状態の数を抑えられるため。尋ねるの重み・見込みの混ぜ方・話した側も相手の見方を聞くことはassistantが置き、同日userが「採る」と答えた（SP-PREMISE-001 4.3節） |
| 2026-11-22 | 作業規則を`docs/REPO_LOCAL_RULES.md`の1ファイルへ整理し、`docs/ai/`の4文書を廃止した。「AIは執筆しない」を「AIは見本・試験用の物語と骨子文を書いてよく、作品として採る文章と表現はuserが決める」へ、「選択は実装の承認ではない（別途IMPLEMENT packet）」を「効果の書かれた選択肢をuserが選んだら、その範囲を実装まで進める」へ改めた | 現状維持 / 禁止ごとに個別に聞く / 推奨で一括して改める | userが「ここまでの障害になっている規則などは強めに整理して良い」「AIへの禁止がブロッカーになっている場合全て推奨で再検討したい。かなり古いルールばかり」と指示。旧版はcommit `4da0f9c`。製品の境界は変えていない |
| 2026-11-22 | 前提から物語を組む方式を採用: 重みの式、意図の語彙、骨子文と蓋然の数値表示、`models/generated/`の置き場は採る。行為4種は直す（向きは問い`01M81TNDSDKW3DMTH8MN8CXVJ5`）。規則と数値による組み立ては認める（Decision #4を改めた。LLMによる構想支援は入れていない）。次は実行画面の右列に蓋然と理由。育てる物語は`models/examples/`へ写す | 各項目 採る / 直す / 捨てる。組み立て: 認める / 比較材料に限る / やめる | userがRecordinatorの問い`01M81SKWBNW29HPMMM91R44J0A`に回答。「開発ワークフロー」が物語を作る工程を指すことも同じ回答で確認 |
| 2026-11-22 | 前提（物・人物・思い込み・場）から物語を組む試作をエンジンの追加モジュール`premise-story.ts`として作り、制作ワークフローを7工程に体系化した。実行時の意味論は変えていない | 方式: 最尤の行為を毎回選ぶ / 全展開を数えて作者の意図に合う最も蓋然な展開を選ぶ。置き場: 新しいworkspace / エンジン内の追加モジュール | userが「開発ワークフローを体系化したい」「ストーリー構築方法をより具体化したい」「前提をいくつか与えただけで蓋然的にストーリーが構築できるシステムのプロトタイプを構築したい」と依頼。最尤の行為だけでは2手で終わり他の人物が関わらなかったため、意図による選別を足した（調査はSP-PREMISE-001 5節）。行為4種・重みの式・`accuracy`の用途・意図の語彙・骨子文・`models/generated/`はassistantが試作のために置いた仮の決めで、userの採否待ち。Decision #4（構想へのAI支援はスコープ外）と「AIは執筆しない」は変えていない。試作はLLMを使わず文章も書かないが、物語の構造を機械が組む点の扱いはuserが決める。仕様は`docs/specs/`の`premise-driven-story.md`と`pipeline-workflow.md` |
| 2026-11-21 | 編集の残りの順を、知識ルール→知覚（効果と場面に入った時の方針）→複合条件と物の性質→人物と物の定義→場面の改名・削除とし、一度に実装した | 受入の摩擦を待って順を決める / 推奨順で進める | userが「知識ルールおよび推奨工程への編集へ進められますか」と依頼。順はassistantの推奨（エンジンの芯である知識と性質の比較を先にし、比べる相手の定義、片付けの操作を後にした）。定義は編集欄の下の「人物と物」に置き、上部の常設操作は増やしていない |
| 2026-11-21 | Studioの編集は「その場で編集」（実行画面の本文欄を編集欄にし、右列を即時に再トレース）。保存は`models/`配下を開発サーバー経由で元のJSONへ書き戻し、ドロップしたファイルは書き出し | 1 その場で編集 / 2 編集ビューを分ける。保存: 元ファイルへ書き戻す / ブラウザ内保存＋書き出し | userは画面Aの受入で「近い、編集へ進む」と返答。ラフ2案のうち、編集した判断をその場で確かめられる1をassistantが推奨既定で採用（userが変えれば見直す）。書き戻しは`loadModel`の検査を通った時だけ |
| 2026-11-21 | 再構築: エンジンの判断の記録（trace）と新作業場`apps/studio`を芯にし、ゲーム層を凍結する。作業場の画面はA案「判断を横に添える」 | 画面A 判断を横に添える / B 因果の流れ / C 本文に注釈。ゲーム層: 凍結して切り離す / 別レーンで並行 | userが再起動時に「作り変えるぐらいの再構築」を依頼し、確認画面がJSON中心でエンジンの機能を判断しにくい・ゲーム部分の同時開発に全体が没頭する・Web画面がボタンまみれ、の3点を指摘。構想図を見てA案と凍結を選択。同日のG3 Lens EXPLOREの焦点はこの作業場の右列に吸収した。旧Web Testerは置き換えまで残し新機能を足さない。仕様は`docs/specs/studio-rebuild.md` |
| 2026-11-21 | 再起動後の集中セッションの焦点をG3 Choice Consequence Lens EXPLOREにする | A. G3 Lens探索 / B. G4 workflow proof / C. Public Studio S1→S2 / D. North Star再確認 | userがAを選択。G1・G2完了でpolicy semanticsが安定し、G3はunlocked。選択はEXPLOREの開始で、Lens実装・North Star採用・API追加の承認ではない。packetは`HANDOVER.md` |
| 2026-09-28 | NarrativeGenは他作品への物語供給元ではなく、独立した実験的な物語生成システムとして扱う | 独立した実験を保持 / Studio・UnityChatNovelGame等への供給元化 | userが親Game Projectsで、他projectとの接続は以前から想定しておらず実験的な物語生成システムの構築がコンセプトだったと明示した。親の非3D試作がsampleとengineを借りたことは供給元化・Studio参加の採択ではない。作品間供給は制作目的・利用範囲・互換性が必要になった時点で別途判断する。原記録は親repoの`docs/decision-log.md`「2026-09-28：NarrativeGenの実験目的を保持し…」節 |
| 2026-07-27 | 保存済みPublic Studio Version 1をowner-only custom accessのままproduction deploymentし、public releaseとは分離 | 既存Version 1をowner-only deploy / hold / access拡大 | userが既存Version 1だけのdeploymentを明示承認。deploymentは`succeeded`、accessはcustom・許可account user 1・全group 0、version数1を維持した。Live URL値は非共有条件によりrepositoryへ保存しない。hosted runtime受入、access拡大、analytics/domain/auth/storage/commerce、public releaseは別gate |
| 2026-07-12 | G1 Contract A を採用し SP-KNOW-002 契約を確定 | Contract A / Contract B / 再探索 | user が optional `knowledgeRules`、exact `knowledgeRule / noticed` condition、public pure `evaluateKnowledgeRule` diagnostic、unchanged `getAvailableChoices`、shared inference semantics、separate `procedural-choice-spine-probe.json` / `SP-KNOW-002`、availability 時の perception-event 非生成を一括承認。SP-KNOW-001 persistent node-trigger v0 は維持し、Contract B、Unity、G3 は別決定とした |
| 2026-06-15 | 開発優先順を Playable first, then green に切替 | Playable first / Green first 継続 / CI先行 | `vertical-slice.json` を作家が短編を作りブラウザで遊ぶ正本成果物にし、テスト・lint・schema・CI・doctor・リファクタリングを体験保護の衛兵に戻すため |
| 2026-06-15 | Agent 指示リセット: 薄い入口 + repo-local rules + HANDOVER 現在状態に整理 | NLMYTGen 型に更新 / AGENTS肥大化 / v18 docs維持 | Agent入口に手順・状態・履歴を溜めず、通常再開の読了予算を `AGENTS.md` -> `docs/REPO_LOCAL_RULES.md` -> `HANDOVER.md` に固定するため |
| 2026-03-16 | ブランチ統合: ローカルをmaster→mainに切替 | main切替 / masterにマージ / 保留 | origin/mainが正。masterのEntity/Inventory変更は既にcherry-pick済み。337ファイル差分 |
| 2026-03-07 | Ollama (ローカルLLM) プロバイダを完全削除 | A) OpenRouter統合 / B) Ollama改善 / C) 処理 / D) 完全削除 | 精度・リソース費用に難あり。非AIパラフレーズがオフライン対応済み。AIProviderインターフェースは拡張可能なため将来再実装可能 |
| 2026-03-07 | レガシーDoc 7件を当時の archive に移動 | 移動 / 保留 | Windsurf AI Collab Rules x3 + ヒント集.md x3 + REPORT_CONFIG.yml。CLAUDE.md更新で不使用。移動スクリプト不在 |
| 2026-03-07 | 旧計画Doc 4件削除。DEVELOPMENT_PLAN.mdで置換 | archive移動 / 部分統合 / 完全削除 | MID_TERM_TASKS, NEXT_PHASE_PROPOSAL, features-status, RESTART_ROADMAPはShared Workflows削除に伴いレガシー化。コード探索ベースの新プランで置換 |
| 2026-03-07 | AIバッチ校閲・全ノード一括AI言い換えを削除 | 含める / 削除 / 保留 | コスト対効果疑問。BatchEditorの検索置換バッチは子続 |
| 2026-03-07 | コラボ機能(バージョン管理/マルチユーザー/共有リンク)を削除 | 部分利用 / 全保留 / 全削除 | スコープ過大。シングルユーザーツールとして運用 |
| 2026-03-07 | 開発優先順: 変数拡張→main.js分離→Yarn Spinner→レスポンシブ/a11y→チャンク最適化 | 複数案 | 機能の基盤(変数)を先行、安定化(main.js)は次点 |
| 2026-03-08 | WritingPage連携は双方向 | GUI中心 / WritingPage埋込 / 独自DSL / ハイブリッド | NarrativeGen→WritingPage、WritingPage→NarrativeGenの双方を想定 |
| 2026-03-08 | 条件/効果設定はライター自身が担当 | ライター自身 / 別者(デザイナー) | 別設計モデルではない。条件/効果エディタのUXが重要 |
| 2026-03-08 | Twine/Inkエクスポーターは継続 | 継続 / Yarn優先 / 削除 | 実用互換出力として子続。Yarn追加は別途 |
| 2026-03-09 | SPEC VIEW実装 (軽量HTMLビューア) | 軽量HTML / Quartz4 / 不要 / 別の方法 | 依存なし・ビルド不要。spec-index.json+spec-viewer.htmlで一覧・進捗確認 |
| 2026-03-08 | main.jsリファクタリング完了 | 継続分割 / 現状維持 | Phase 1-4完了。main.js 2365行→469行。app-controller.js ~1630行、app-editor-events.js ~430行に分離 |
| 2026-03-09 | Yarn Spinner エクスポート実装完了 | 優先順位3タスク | YarnFormatter.js追加。verify-export-formatters.mjsでテスト済み。5形式目のエクスポーターとして登録 |
| 2026-03-09 | 変数システム仕様策定 | 仕様先行 / 実装先行 | docs/specs/variable-system.md作成。数値変数・演算・テキスト展開を定義。実装は次フェーズ |
| 2026-03-09 | spec-viewer.html実装 | ドキュメント形式 | Markdown管理 + WebビューアでF仕様一覧・進捗確認。spec-index.jsonがSource of Truth |
| 2026-03-09 | 変数システム拡張実装 (Priority 1) | 数値変数追加 + 基本四則演算 | VariableState型拡張、modifyVariable効果、数値比較条件(>=, <=, >, <)、UI対応完了。condition-effect-editor.jsで自動判定 |
| 2026-03-09 | evalCondition/applyEffect重複解消 | 共通モジュール化 / 現状維持 / 部分統合 | 3ファイル(session-ops.ts/index.ts/browser.ts)で90行超の重複を`condition-effect-ops.ts`に集約。session-ops.tsのキャッシュ機能は維持 |
| 2026-03-10 | 文字コード安全運用を導入 | アドホック運用 / 安全チェック導入 | `spec-index`破損と文字化け再発を受け、`check:safety` / `check:safety:changed`、運用手順、インシデント記録を追加 |
| 2026-03-10 | Mermaidチャンク分割を更新 | 現状維持 / 遅延読込のみ / 依存分離 | `vendor-mermaid` 1.79MB 警告を分離し、依存と共有レイアウト処理を別チャンク化して状況を可視化 |
| 2026-03-11 | feature/main-js-split-phase2をmainに統合 | マージ / cherry-pick / 保留 | 85コミット分の機能(推論エンジン/階層UI/セマンティック検索/XSS修正/Save-Load/ハンドラー分離)を一括統合。コンフリクト8件解決。テスト15→73件に増加 |
| 2026-03-11 | 推論エンジンUI統合 Phase 1実装 | Live Preview拡張 / 新タブ / グラフ内表示 | Live Previewパネルに折りたたみセクションとして追加。既存UIへの構造変更を最小化。Phase 2-3は別途 |
| 2026-03-12 | 推論UI Phase 2実装 (UC-3/UC-4) | Phase 2先行 / Phase 3先行 / 別タスク | InferenceBridge: findStateKeyUsage/getAllStateKeys追加。InferencePanel: 3セクション構成(到達パス/影響分析/状態キー使用)に全面書き換え。SP-INF-UI-001 75% |
| 2026-03-12 | validateキャッシュ汚染バグ修正 | clearSessionCaches追加 / キーにmodelId含める | session-ops.tsのモジュールレベルMap(choicesCache/conditionCache)がモデル間で汚染。clearSessionCaches()をexportし、validate-models.tsで毎モデル前に呼出 |
| 2026-03-12 | E2E skip 36件整理完了 | 全削除 / 個別判断 / 保留 | theme-toggle 33件(UI未実装)を削除。undo-redo 5件(防御的skip)は正当として残存。22 passed / 5 skipped |
| 2026-03-13 | origin/master統合方針: main正+手動cherry-pick | 直接マージ / cherry-pick / 並行運用 | masterは別セッションでweb-tester構造を巻き戻し(main.js 2371行復活)+推論UI/E2E削除。358ファイル差分で直接マージ不可。mainのweb-tester分離/推論UI/E2Eを維持しつつ、masterのEntity/Inventory統合+C# SDK推論パリティのみ手動取り込み |
| 2026-03-13 | Entity/Inventory + C# SDK InferenceRegistryをmainに手動統合 | 手動 / 延期 | hasItem条件+addItem/removeItemエフェクト+modifyVariable推論登録+EntityDef型+brand→nameリネーム+C# SDK InferenceRegistry(条件8種/エフェクト7種)。73テスト全緑維持 |
| 2026-03-16 | SP-INF-UI-001 Phase 3: グラフ視覚連携プラン承認 (T1-T4全件) | T1-T4全件 / T1-T3のみ / 色変更 / 再検討 | GraphEditorManager.applyInferenceHighlight()方式。パス=ゴールド、影響=コーラル、到達不能=opacity 0.4。デバッグクエリUIも含む |
| 2026-03-17 | Entity-Property基盤着手を決定 | Entity-Property / 動的テキスト構文 / 現行深化 / 中断計画 | 原初ビジョン(ORIGINAL_DESIGN_PHILOSOPHY)との構造的ギャップを特定。現行フラットEntityDefからプロパティ階層・継承・範囲定義へ段階拡張。SP-PROP-001として仕様策定 |
| 2026-03-17 | 原初ビジョンと現行実装の乖離を認識・記録 | N/A | レガシードキュメント分析で5つの高深刻度ギャップを特定 (Entity-Property, 動的テキスト構文, プロパティ比較推論, 事象Entity動的生成, 動的ストーリー展開)。段階的に基盤から積み上げる方針 |
| 2026-03-17 | SP-PARA-002: 言い換え辞書プロパティマッチング拡張 | flat辞書維持 / ConditionalVariant拡張 / AI依存 | ConditionalVariant + match条件 + UsageHistory + buildParaphraseContextで原初ビジョン§4.2を実現。後方互換維持 |
| 2026-03-17 | Runtime Core→Authoring体験逆算へ軸切替 | Authoring逆算 / 手動検証 / Unity SDK / 基盤続行 | 原初ビジョン8スペック完了でエンジンAPIは充実。しかしライターが使えるGUIが追いついていないためAuthoring軸へ。Entity定義パネルbug修正・ConversationTemplate GUI・Dynamic Textプレビュー完了 |
| 2026-03-18 | G4: Model.characters (CharacterDef) をスキーマに追加 | 追加 / 保留 | モデルJSON内でキャラクター知識プロファイルを完結させる。perceiveEntity APIとの接続を可能に。任意フィールドでリスク低 |
| 2026-03-18 | G5: Model.paraphraseLexicon (PropertyAwareLexicon) をスキーマに追加 | 追加 / 保留 | モデルJSON内で言い換え辞書を完結させる。ConditionalVariant+match対応。任意フィールドでリスク低 |
| 2026-03-18 | SP-PLAY-001: テキスト表示は段落フェードイン方式 | タイプライター / 段落フェードイン / 即座表示維持 | 段落単位のstagger表示で読みやすさと没入感を両立。タイプライターより軽量 |
| 2026-03-18 | SP-PLAY-001: 選択肢はストーリー内インライン配置 | インライン / サイドバー維持 / モード切替 | 小説/ゲームブック的な一体感。サイドバーは状態表示のみに |
| 2026-03-18 | SP-PLAY-001: ノード遷移はcrossfade+append-scroll両対応 | crossfadeのみ / append-scrollのみ / 両方切替 | 用途に応じて切替可能にする。拡張可能なTransitionRegistry設計で将来のAnimation追加も受容 |
| 2026-03-18 | SP-PLAY-001: Phase 1はテキスト演出のみ | テキストのみ / 画像含む / 画像+BGM | スコープを絞りプレイ基盤を先に確立。画像/BGMはPhase 2 |
| 2026-03-18 | UI設計はマウス操作主体 (NarrativeGenにも適用) | マウス主体 / キーボード主体 | WritingPageでの決定をNarrativeGenにも適用 |
| 2026-03-23 | SP-PIPE-001 Pipeline Workflow ドラフト策定 | Pipeline先行 / SP-PLAY-001閉じ優先 / WritingPage先行 / 体験ウォークスルー | 基盤は揃っている。次は「誰が何をどう使うか」の言語化。Pipelineなしで機能だけ増やすと未使用機能が増える |
| 2026-03-26 | 孤立ドキュメント・偽テスト・陳腐化仕様の整理削除 | 個別対応 / バッチ削除 | task-scoutで L01-L07 を特定。対象をまとめて処理した方が速い |
| 2026-03-26 | デッドコード除去・UI改善・CSS重複解消 | Excise先行 / Advance先行 / 並行 | 保守に偏らないよう Excise→Advance→Refactor。empty stateとサイドバーなどユーザーに見える変更を含めた |
| 2026-03-27 | SP-PIPE-001 方向性確定: 1人運用/WritingPage次スライス/JSON主軸/AI支援スコープ外/AUTHORING_GUIDE拡張 | 各項目に複数択 | Pipeline仕様の5件HUMAN_AUTHORITY全件レビュー完了。次スライスはWritingPage連携 |
| 2026-04-03 | WritingPage連携の早期実装を stash 退避 | stash / ブランチ分離 / 仕様先行 | 相手 v0.3.32 のフォーマットが不安定。行数は小さく再実装しやすい |
| 2026-04-03 | SP-PIPE-001 完了と canonical docs 実記述化 | 仕様本文反映 / テンプレ維持 | 5件を本文に反映し、AUTHORING_GUIDEとプロジェクト記憶文書をテンプレ状態から脱却させた |
| 2026-04-08 | BL-TGEN-META: `model.metadata` のランタイム `{…}` 展開は当面エンジン本線に載せない | 載せる / 載せない / 要件後にIssue | `resolveNarrativeDisplayText*` 本線で未使用。パイプライン API への組み込みはニーズ確定後に GitHub Issue 化し SP-TGEN / `narrative-text-generation-pipeline.md` §7 を更新してから実装。起票用文案は `docs/plans/issue-stubs/BL-TGEN-META.md` |
| 2026-04-27 | Docs Authority Reset: HANDOVER.md を通常再開入口に一本化 | 強削除 / 降格中心 / 最小同期 | 古い状態・タスク・補助線文書が正本風に残り、再開時の判断を汚していた。Git履歴をアーカイブとし、残す正本の役割を分離する |
