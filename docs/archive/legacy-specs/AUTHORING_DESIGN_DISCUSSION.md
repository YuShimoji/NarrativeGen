# ライターオーサリング設計 - 課題整理と検討方向

**作成日**: 2026-03-04
**状態**: 検討中 (Draft)
**関連**: Export機能 / WritingPage連携 / UnityChatNovelGame連携

---

## 背景

NarrativeGenはPhase 2完了後のStabilizationフェーズにあり、30以上の機能が実装済み。エクスポーターとしてTwine (Twee)、Ink、CSVが実装されているが、**ライターがどのように執筆するか**という根本的な設計が未確定である。

この問題は、単なる「エクスポート先の選定」ではなく、**オーサリングパイプライン全体のデザイン**に関わる。

---

## NarrativeGenモデルの表現力

### 他フォーマットで完全に表現できない独自概念

| 概念 | 内容 | Yarn | Twine | Ink |
|------|------|------|-------|-----|
| Condition (複合) | flag/resource/variable/timeWindow + and/or/not の再帰的組み合わせ | 部分的 | 部分的 | 部分的 |
| Effect (構造化) | setFlag / addResource / setVariable / goto | 近似可 | 近似可 | 近似可 |
| timeWindow条件 | start/end の時間窓での条件評価 | 不可 | 不可 | 不可 |
| ParaphraseLexicon | テキスト言い換え辞書 (`Record<string, string[]>`) | 不可 | 不可 | 不可 |
| ParaphraseStyle | desu-masu / da-dearu / plain | 不可 | 不可 | 不可 |
| ChoiceOutcome | 選択結果の型付きメタデータ | 不可 | 不可 | 不可 |

### 結論

Yarn Spinner / Twine / Ink はいずれも**NarrativeGenのフルセマンティクスを表現できない**。エクスポートは常に情報の劣化を伴う「互換出力」であり、「オーサリングフォーマット」にはなり得ない。

---

## 現在のエクスポーターの位置づけ

| フォーマット | 実装 | 役割 | 情報欠落 |
|---|---|---|---|
| JSON | 済 | **正規フォーマット** (完全保存) | なし |
| CSV | 済 | データ分析/外部ツール連携 | conditions/effects/meta全欠落 |
| Twee (Twine) | 済 | Twine 2互換出力 | conditions/effects/paraphrase全欠落 |
| Ink | 済 | Ink互換出力 | 同上 |
| Yarn Spinner | 未 | Unity連携用出力 (将来) | timeWindow/paraphrase欠落見込み |

**方針**: Twine/Inkは汎用互換出力として維持。Yarn Spinnerは将来追加候補。

---

## 連携プロジェクトの状況

### UnityChatNovelGame

- **Yarn Spinner 3.1.3** を本格採用
- カスタムコマンド: `<<Message>>`, `<<Image>>`, `<<UnlockTopic>>`, `<<Glitch>>` 等
- 5本の .yarn スクリプトが稼働中
- NarrativeGenからの直接データフローは未構築

### WritingPage (Zen Writer)

- バニラJS製の小説執筆エディタ (サーバー不要)
- **Embed SDK v1**: iframe埋め込み + postMessage通信
  - `setContent()` / `getContent()` / `focus()` / `takeSnapshot()`
- **Plugin API**: ガジェットとして外部機能を追加可能
- **ZenWriterAPI**: グローバルAPIとして直接呼び出し可能
- NarrativeGenへの言及/連携は未実装

---

## 設計方向の選択肢

### A. GUI中心アプローチ

Web Tester GUIを主オーサリング手段として磨く。

- 長所: 既存資産を最大活用。追加開発コスト低
- 短所: ライターが慣れたテキストエディタから離れる。大量テキスト入力に不向き
- 技術負荷: 低

### B. WritingPage埋め込みアプローチ

Zen WriterをNarrativeGen内に埋め込み、テキスト執筆はそこで行う。構造(条件/効果)はGUIで。

- 長所: テキスト執筆体験が良い。Embed SDKが既存
- 短所: 執筆と構造設定が分離する。二つのUIを行き来する
- 技術負荷: 中 (Embed SDK統合)
- 実装段階:
  1. Phase 1: setContent/getContentで単方向流し込み
  2. Phase 2: contentChangedイベントで双方向同期
  3. Phase 3: Plugin APIでガジェット統合

### C. 独自DSLアプローチ

`.narrgen` テキスト形式を設計。GUI と DSL の双方向変換を実現する。

- 長所: テキストエディタで全て書ける。VCS差分が読みやすい。NarrativeGen固有概念を完全表現
- 短所: パーサー設計・実装が必要。DSLの学習コスト
- 技術負荷: 高
- 構文イメージ:
  ```
  === start
  あなたは異世界に召喚されました。

  * 勇者として戦う力を選ぶ -> warrior_path
    [effect: setFlag class=warrior]
  * 賢者として魔法の力を選ぶ -> mage_path
    [effect: setFlag class=mage]

  === warrior_path
  [condition: flag class == warrior]
  [timeWindow: 0-100]
  戦士の力を得ました。{剣|ブレード|ソード}と鎧が装備されます。
  ^^^ {言い換え: ParaphraseLexicon}
  ```

### D. ハイブリッド流し込みアプローチ

外部ツール (Google Keep, Obsidian, Scrivener等) で書いたプレーンテキストをNarrativeGenにインポートし、GUIで構造を付与する。

- 長所: 書く場所は自由。既存ワークフローを崩さない
- 短所: 構造付けが二段階。効率は低い
- 技術負荷: 低~中
- 必要機能: テキストインポート機能 (Markdown/プレーン → ノード自動分割)

---

## 確定事項

| 日付 | 判断 | 内容 |
|------|------|------|
| 2026-03-08 | WritingPage連携方向 | **双方向** (NarrativeGen -> WritingPage, WritingPage -> NarrativeGen の両方) |
| 2026-03-08 | 条件/効果の設定者 | **ライター自身**が設定する。分業モデルではない |
| 2026-03-08 | Twine/Inkエクスポーター | **維持**。汎用互換出力として存続 |

### 確定事項の設計含意

- ライター自身が条件/効果を設定する → **条件/効果のUXが最重要**。現GUIのcondition-effect-editor.jsの使いやすさが成否を分ける
- WritingPage双方向連携 → NarrativeGenモデル <-> WritingPageテキストの変換ロジックが必要。Embed SDKの`setContent()`/`getContent()`が基盤
- 双方向ということは、WritingPageで書いた構造化テキストからNarrativeGenモデルを生成する「インポート」経路も必要

---

## 未解決の問い

1. **ライターのペルソナ**: 技術者か非技術者か? DSLに抵抗はあるか? → **未定**
2. **執筆量**: 一つのモデルに何ノード程度を想定するか?
3. **UnityChatNovelGame連携の優先度**: Yarn出力が今すぐ必要か、将来の話か? → **方針未定**
4. **パイプラインの最終形**: 「書く → 構造化 → テスト → 出力 → ゲームに組み込み」の各段階でどのツールが担うか?

---

## 推奨される次のステップ

1. 条件/効果エディタ (condition-effect-editor.js) のUX評価と改善案
2. WritingPage双方向連携の最小PoC設計
3. 残りの未解決の問いに対するオーナー判断

---

## 更新履歴

- 2026-03-08: 確定事項3件追加 (WritingPage双方向、条件設定はライター、Twine/Ink維持)
- 2026-03-04: 初版作成 (調査結果に基づく課題整理)
