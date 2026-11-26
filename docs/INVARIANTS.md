# Invariants

製品の境界と、破ってはいけない条件の正本。作業の進め方とAIの役割は [REPO_LOCAL_RULES.md](REPO_LOCAL_RULES.md)。

## 製品の境界

- JSONが主要な出力経路。独自機能（Dynamic Text / Entity-Property / ConversationTemplate / Event / Character Knowledge）は、
  JSON＋独自ランタイム（engine-ts / sdk-unity）でだけ完全に保存される（Decision #3）。
  Yarn / Ink / Twine出力でDynamic Textが失われるのは設計上の制約で、不具合ではない
- TypeScript版（`packages/engine-ts`）が意味論の正本。Unity SDK（`packages/sdk-unity`）はTS版との一致を目標にし、独自に進化させない
- スキーマ検証はAjv＋`assertModelIntegrity`の二層
- エンジンとゲーム層（Play演出・BGM・`packages/sdk-unity`・`apps/public-studio`・Sites adapter）の接続は、
  model JSONとsession API（`startSession` / `getAvailableChoices` / `applyChoice`）だけにする。
  エンジン・作業場の再構築ではゲーム層を凍結する。2026-11-25の本人依頼で、UnityChatNovelGameとの接続に必要なUnity SDK互換修正を別作業として再開する
- 作業場（`apps/studio`）はエンジンの判断の記録を描くだけで、意味論を複製しない。画面に生のJSONを出さない
- 前提から物語を組む生成器は、違和感の判定をエンジンから読むだけで、実行時の意味論を変えない。同じ前提と同じ`seed`からは同じ物語が出る
- `models/generated/`の物語は前提から再生成できる状態に保つ。手で直して育てる物語は`models/examples/`へ写す（2026-11-22 user）
- NarrativeGenは独立した物語生成システムとして維持する。2026-11-25の本人依頼により、生成したゲームプレイのUnityChatNovelGameでの再生を認める

## 操作と体験

- UIはマウス操作が主。キーボードショートカットは補助
- Playモードの表示は、段落フェードイン＋選択肢を本文中に置く形（SP-PLAY-001。ゲーム層で、凍結中）

## 役割

- 1人運用。ライター／テクニカルデザイナー／インテグレーターは帽子の切替で、別の担当者ではない。
  条件と効果は書き手自身が設定する（2026-03-08）
- WritingPageとの原稿受け渡しは[SP-WP-001](specs/writingpage-io-contract.md) 0.2を使う。条件・効果を含むモデルの完全な保存はNarrativeGenのJSONが担う

## 運用

- userが一度説明した非交渉の条件は、同じ作業の中でここへ書く。理由は`docs/governance/decision-log.md`に短く残す
