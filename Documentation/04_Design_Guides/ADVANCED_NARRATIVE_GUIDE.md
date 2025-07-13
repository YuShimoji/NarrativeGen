# Advanced Narrative Guide (Phase 3 Proposal)

## はじめに

このドキュメントは、NarrativeGenプロジェクトの次の段階（フェーズ3）で導入する、より高度で表現力豊かな物語生成システムについて概説します。

現在の命題ベースのシステムは、物語の論理的な「骨格」を構築することに成功しました。しかし、添付資料『Novel Samples.txt』に見られるような、文学的で多様な「異文」――すなわち、同じ出来事を異なる文体、視点、心理的ニュアンスで描写する「肉付け」の機能がありません。

この問題を解決するため、本提案では**「中核イベント（Core Event）」**と、それを装飾する**「描写テンプレート（Descriptor）」**という2つの中心的な概念を導入します。この新システムにより、単なる事実の連鎖ではなく、深みと情感のあるナラティブ体験の自動生成を目指します。

---

## 第1章: 新しいデータモデル

### 1.1. 中核イベント (Core Event)

中核イベントは、物語の中で発生する純粋な「出来事」そのものを表します。これは、装飾的な表現を一切含まない、SVO（主語-動詞-目的語）に近いシンプルなデータです。

**データ構造案 (`Events.csv`):**

| id | event_type | subject_id | object_id | parameter_1 | parameter_2 | timestamp |
|---|---|---|---|---|---|---|
| E001 | MOVE | char_A | loc_B | fast | | 101 |
| E002 | WAIT | char_B | | | | 102 |
| E003 | OBSERVE | char_A | loc_C | | | 103 |

- **event_type:** `MOVE`, `WAIT`, `OBSERVE`, `STATE_CHANGE`など、イベントの種類。
- **subject_id:** 主語となるエンティティのID。
- **object_id:** 目的語となるエンティティのID。
- **parameters:** イベントの追加情報（例：移動の速度）。

### 1.2. 描写テンプレート (Descriptor)

描写テンプレートは、中核イベントを「どのように語るか」を定義する、このシステムの心臓部です。一つのイベントに対して複数の描写テンプレートを適用することで、多様な異文を生成します。

**データ構造案 (`Descriptors.csv`):**

| id | template_text | style_tags | target_event_type | required_params |
|---|---|---|---|---|
| D001 | [subject]は、[object]がうんざりさせるほど繰り返されていることに、[psych_state]を感じた。 | Borges, Repetitive, Labyrinthine | OBSERVE | subject, object, psych_state |
| D002 | [object]の静寂は、[source]から響く[synesthesia]によってのみ破られていた。 | Marquez, Synesthesia, Auditory | WAIT | object, source, synesthesia |
| D003 | [subject]は走りつづけた、その[adj]な走路を。それはまるで[metaphor]かのようだった。 | Faulkner, Kinesthetic, Loneliness | MOVE | subject, adj, metaphor |
| D004 | [object]の地平線は、見はるかす[source]のかなたに、[adj]な輪郭を描いて横たわっていた。 | Gracq, Visual, Vast, Anticipation | OBSERVE | object, source, adj |
| D005 | [subject]の足音さえ聞こえなかった。まるで、自分の立てる物音の及ばぬところまで走っているかのようだった。 | Faulkner, Kinesthetic, Dissociation | MOVE | subject |

- **template_text:** `[placeholder]` を含むテンプレート文章。
- **style_tags:** 作家名、感覚（Visual, Auditory, Kinesthetic）、心理状態（Loneliness, Dizziness）、空間特性（Labyrinthine, Vast）など、描写の特性を示すタグのカンマ区切りリスト。
- **target_event_type:** この描写が適用可能なイベントの種類。
- **required_params:** テンプレートが要求するプレースホルダーのリスト。

---

## 第2章: 異文生成のプロセス

異文の生成は、以下のステップで行われます。

1.  **イベント決定:** `LogicEngine`が、現在の物語の文脈に基づいて次に発生させるべき「中核イベント」を`Events.csv`から選択します。
    - 例: `E001: MOVE, char_A, loc_B, fast`

2.  **描写候補の検索:** `NarrativeGenerator`（新設）が、決定されたイベントタイプ（`MOVE`）に一致する描写テンプレートを`Descriptors.csv`から全て検索します。

3.  **描写の選択:**
    - ゲームの現在の「文芸スタイル設定」（例：`Faulkner`モード）に基づき、候補の中から最も適切な描写テンプレートを選択します。
    - `style_tags`に`Faulkner`と`Kinesthetic`が含まれるものが優先的に選ばれます。
    - 例: `D003`と`D005`が選択される。

4.  **パラメータの解決:**
    - 選択された描写テンプレート（`D003`）が必要とするパラメータ (`subject`, `adj`, `metaphor`) を解決します。
    - `subject` → `char_A`（イベントから取得） → "ロンロット"（`Entities.csv`から取得）
    - `adj` → "黒く滑らかな"（文体や文脈に応じた単語データベースから取得）
    - `metaphor` → "彼がその中を走りぬけているあいだだけ存在するトンネル"（比喩データベースから取得）

5.  **最終的な文章の合成:**
    - パラメータをテンプレートに埋め込み、最終的な文章を生成します。
    - **結果1:** 「ロンロットは走りつづけた、その黒く滑らかな走路を。それはまるで彼がその中を走りぬけているあいだだけ存在するトンネルかのようだった。」
    - **結果2:** 「ロンロットの足音さえ聞こえなかった。まるで、自分の立てる物音の及ばぬところまで走っているかのようだった。」

---

## 第3章: 実装に向けた次のステップ

1.  **データファイルの作成:** `Events.csv` と `Descriptors.csv`、およびパラメータ解決のための単語・比喩データベースのサンプルを作成する。
2.  **`NarrativeGenerator`モジュールの設計・実装:** 上記の生成プロセスを実行する新しいC#スクリプトを作成する。
3.  **`GameManager`の改修:** `LogicEngine`と`NarrativeGenerator`を協調させ、生成された異文をUIに表示するように修正する。

このアプローチにより、組み合わせによって爆発的に多様な表現を生み出し、より文学的で深みのある物語体験を提供することが可能になります。 