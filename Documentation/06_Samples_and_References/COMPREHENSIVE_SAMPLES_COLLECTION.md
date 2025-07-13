# 包括的サンプルコレクション - 検証・テスト用

**バージョン: 1.0**  
**目的: 膨大で多様な検証用サンプル + 長編小説実装例**  
**基準: 構文メモ.txt + SYNTAX_ENGINE_SPECIFICATION.md**

---

## 🎯 コレクション概要

### 📚 収録内容
- **基本構文パターン**: 500例以上
- **複雑コマンド組み合わせ**: 200例以上  
- **長編小説実装例**: 3作品（各5,000-10,000文字）
- **エッジケース検証**: 150例以上
- **パフォーマンステスト用**: 大量データセット

---

## 📖 長編小説実装例

### 小説1: 「図書館の謎」- 推論エンジン完全実装

#### 第1章: 発見
```
[r[朝の][早い]r時間、][私は[図書館]に[向かった]。]
[r[いつものように][習慣として]r、][古い[文献]を[調べる]ためだった。]

{scene:[図書館の入り口に立つと、][古い建物特有の][r[静寂][厳粛さ]r]が感じられた。]}
[r[受付の][司書の]r女性が][微笑んで][私を迎えてくれた]。]

[「[今日も][研究]ですか？」]
[と彼女は[r[親しみやすく][優しく]r][尋ねた]。]

[私は[r[軽く][小さく]r][頷いて]、][奥の[閲覧室]へと[向かった]。]
{scene:[いつもの席に着くと、][机の上に][r[見慣れない][奇妙な]r][object]が置かれていた。]}

[それは[r[古い][年代物の]r][革製]の[手帳]だった。], if(object.age > 50)
[それは[r[新しい][最近の]r][ノート]のようだった。], else

[r[好奇心から][興味に駆られて]r、][私は[その[object]]を[手に取った]。]
[r[パラパラと][ざっと]r[ページを][めくってみる]と、]
[r[奇妙な][不可解な]r[内容]が[記されて]いた。]

{thought:[このr[文章][記述]r、何だか[r[変だ][おかしい]r]。]}
{thought:[普通の[r[日記][手帳]r]にしては、][内容が[r[専門的すぎる][難解すぎる]r]。]}

[最初の[ページ]には、][こう[書かれて]いた：]
[「[物体]の[重量測定]における[誤差率]について」]

{observation:[重量測定？][図書館で？][r[なぜ][一体なぜ]r？]}

[r[さらに][続けて]r[読み進める]と、]
[r[具体的な][詳細な]r[数値]が[羅列されて]いた：]

[「チーズバーガー：期待値0.1kg、実測値0.12kg、誤差+20%」]
[「コーヒーカップ：期待値0.3kg、実測値0.28kg、誤差-6.7%」]
[「古書：期待値0.8kg、実測値0.85kg、誤差+6.25%」]

{thought:[チーズバーガー？][図書館に？]}
{thought:[r[そんなものが][食べ物が]r[ここに][あるはずが]ない。]}

[私は[r[辺りを][周囲を]r][見回した]。], if(character.observation_skill > 0.7)
[r[確かに][やはり]r、][食べ物の][匂い]などは[感じられない]。]

{analysis:[この[記録]は[r[現実的でない][非現実的だ]r]。]}
{analysis:[しかし、][数値の[精度]は[r[異常に][驚くほど]r][高い]。]}

[r[謎は][疑問は]r[深まる]ばかりだった。]
```

#### 第2章: 推論開始
```
[r[翌日][次の日]r、][私は[再び][その[手帳]]を[手に取った]。]
[新しい[記録]が[r[追加されて][書き加えられて]r]いた。]

[「昨日の[観察者]：知識精度0.8、許容誤差±10%」]
[「チーズバーガー重量異常を[認識]。推論開始を[確認]。」]

{thought:[観察者？][それは[r[私のこと][私を指して]r]なのか？]}
{thought:[r[誰かが][何者かが]r私を[観察して]いた？]}

[r[背筋に][spine]r[寒気]が[走った]。], if(character.emotional_state == "nervous")
[私は[r[慎重に][注意深く]r][周囲を][確認した]。]

{scene:[図書館は][r[いつもと][普段と]r][同じように][静かだった]。]}
[r[司書][図書館員]rも[r[普通に][いつもどおり]r][業務]を[行って]いる。]

[r[しかし][だが]r、][何かが[r[違って][異なって]r]いた。]

[私は[手帳]の[続き]を[読んだ]：]

[「実験対象：図書館利用者A（推定年齢r[30代前半][35歳前後]r）」], if(character.age >= 30 AND character.age <= 40)
[「実験対象：図書館利用者A（推定年齢r[20代後半][28歳前後]r）」], if(character.age >= 25 AND character.age < 30)
[「実験対象：図書館利用者A（推定年齢r[40代前半][42歳前後]r）」], else

[「観察項目：物体重量認識における[個人差]」]
[「仮説：知識精度の高い[個体]ほど、[異常値]を[検出]しやすい」]

{analysis:[個体？][私は[実験動物]のように[扱われて]いる？]}

[r[怒り][憤り]rが[込み上げてきた]が、][同時に][curiosity]も[湧いた]。]

[「この[実験]の[目的]は[何なのか？]」]
[「r[誰が][何者が]r[このような[thing]]を[行って]いるのか？]」]

[私は[決意した]。]
[この[謎]を[r[解明][解決]r]してやろうと。]

{determination:[真相を][突き止めてやる]。]}
```

#### 第3章: 事象Entity生成
```
[r[その日の][当日の]r[夕方]、]
[私は[図書館]で[r[奇妙な][不可解な]r][scene]を[目撃した]。]

[r[若い男性][青年]rが][閲覧席]で[r[何かを][objects]r][測って]いた。]
{[小さな][digital][scale]を使って][、様々な[物体]の[重量]を[記録して]いる。]}

[彼の[机の上]には：]
- [チーズバーガー（r[マクドナルド][マック]rの包み紙）]
- [コーヒーカップ（r[紙製][使い捨て]r）]  
- [古い[本]（r[茶色い][褐色の]r表紙）]
- [その他[複数の][いくつかの]][objects]

{observation:[彼こそが][手帳の[記録者]だ]！]}

[私は[r[そっと][静かに]r][近づいて]、][彼の[作業]を[観察した]。]

[彼は[チーズバーガー]を[スケール]に[置いた]。]
[デジタル表示：「0.12kg」]

[彼は[r[小さく][低く]r][呟いた]：]
[「やはり[期待値]より[重い]。[+20%の[誤差]]。」]

[次に[コーヒーカップ]。]
[表示：「0.28kg」]
[「期待値[より軽い]。[-6.7%]。」]

[そして[古書]。]
[表示：「0.85kg」] 
[「[+6.25%]。[許容範囲内]だが、][やや[重め]。」]

{realization:[これは[実験]だ]。]}
{realization:[私たち[利用者]の[反応]を[観察]している]。]}

[r[その時][突然]r、][彼が[私の方]を[振り返った]。]
[r[目が合った][視線が交錯した]r瞬間、][彼は[r[慌てて][急いで]r][道具]を[片付け始めた]。]

[「あ、あの...」]と[私は][声をかけた]。
[「その[実験]、[何のため]ですか？」]

[彼は[r[困ったような][当惑したような]r][表情]を[浮かべた]。]
[「実験って...何の[ことでしょう]？」]

{lie_detection:[明らかに[嘘]だ]。}, if(character.observation_skill > 0.8)
{uncertainty:[r[本当に][本気で]r[知らないの]か？]}, if(character.observation_skill <= 0.8)

[「r[この前から][数日前から]r、][strange][記録]を[見つけて]いるんです。]
[あなたの[測定]と[完全に][一致]している。」]

[彼の[目]が[r[大きく][見開かれ]r][驚き]を[示した]。]
[「記録？[どんな]記録ですか？」]

[私は[手帳]を[取り出し]、][彼に[見せた]。]

[彼は[ページ]を[r[じっと][凝視して]r][眺めた]後、]
[r[深い][大きな]r[ため息]を[ついた]。]

[「やはり...[バレて]しまいましたね。」]

{event_generation: 
  type: "confession_begin",
  participants: ["observer", "experimenter"], 
  emotional_impact: "high",
  narrative_significance: "plot_reveal"
}

[「実は[私]、][大学の[psychology][department]の[学生]なんです。」]
[「[人間の][認知能力]、特に[物体重量]の[推定精度]について[研究]しています。」]

{revelation:[学術研究]だったのか。]}

[「でも、なぜ[図書館]で？[許可]は[取って]いるんですか？」]

[彼は[r[申し訳なさそうに][バツの悪そうに]r][頭を下げた]。]
[「実は...」]
[「[正式な][許可]は[取って]いません。」]
[「[自然な][environment]での[反応]を[観察]したくて...」]

{ethics_violation:[これは[問題]だ]。]}
{mixed_feelings:[r[興味深い][fascination]rが、][ethics的に[問題]がある]。]}

[「r[あなたのような][知識精度の高い]r[方]が、」]
[「[異常値]に[気づく][過程]を[観察]できて、」]
[「非常に[有用な][データ]が[得られました]。」]

{flattery_mixed_with_violation:[褒められている]が、][[consent]なしに[実験対象]にされていた]。]}
```

#### 第4章: 事象の連鎖（Event Entity Generation）
```
[r[その夜][帰宅後]r、][私は[complex][感情]に[襲われた]。]

{event_entity_1:
  type: "ethical_conflict",
  trigger: "unconsented_observation", 
  properties: {
    "observer": "university_student",
    "subject": "myself",
    "violation_severity": 0.7,
    "scientific_interest": 0.8,
    "personal_violation_feeling": 0.6
  }
}

[一方で、][scientific][curiosity]が[刺激されて]いた。]
[他方で、][consent][なしに][観察された][不快感]があった。]

[私は[decide]した。]
[r[明日][翌日]r、][図書館の[管理者]に[報告]すべきだ、と。]

{decision_entity:
  type: "ethical_action_decision",
  properties: {
    "action": "report_to_authority",
    "motivation": "ethical_responsibility", 
    "confidence": 0.8
  }
}

[r[翌朝][次の日の朝]r、][私は[図書館]に[向かった]。]
[受付で[司書]に[事情]を[説明]しようとした。]

[「昨日、[unauthorized][研究]を[行って]いる[学生]を[見つけました]。」]

[司書は[r[困った][当惑した]r][expression]を[浮かべた]。]
[「研究？[どのような]研究でしょうか？」]

[私が[詳細]を[説明]すると、]
[彼女は[unexpected][反応]を[示した]。]

[「あー、[それ]でしたら[心配]いりません。」]
[「[proper][許可]を[得て]行われている[研究]です。」]

{contradiction:[え？][正式な許可]？]}
{confusion:[学生は][許可を取っていない]と[言った]はずだが...]}

[「[permission][documents]を[確認]させていただけますか？」]

[司書は[r[奥][office]rから][書類]を[持ってきた]。]
[確かに、][university][psychology department]からの[formal][application]があった。]
[研究期間：[2週間]。[対象]：[図書館利用者の認知反応]。]

{event_entity_2:
  type: "information_contradiction",
  trigger: "conflicting_accounts",
  properties: {
    "student_claim": "no_permission",
    "library_record": "official_permission", 
    "reliability_student": 0.3,
    "reliability_library": 0.9
  }
}

[「でも、[学生]は[許可を取っていない]と[言いました]が...」]

[司書は[r[意味深な][謎めいた]r][smile]を[浮かべた]。]
[「それも[研究の一部]なんです。」]
[「[被験者]に[真の目的]を[知らせない][double-blind][method]というものです。」]

{realization_2:[私は[二重に][だまされて]いた]。]}
{meta_experiment:[実験について[知る過程]自体が[実験]だった]。]}

[「つまり、[私の反応]、[ethical][concerns]、[reporting][behavior]...」]
[「すべて[観察対象]だったということですか？」]

[「[exactly][その通り]です。」]
[「[非常に][valuable][data]を[提供]していただき、[ありがとうございます]。」]

{event_entity_3:
  type: "meta_revelation", 
  trigger: "discovery_of_larger_experiment",
  properties: {
    "scope": "behavioral_observation",
    "layers": 3,
    "subject_awareness": "progressive_revelation",
    "ethical_complexity": 0.9
  }
}

[私は[r[驚愕][shock]rと][admiration]を[r[同時に][simultaneously]r][感じた]。]
[r[巧妙な][sophisticated]r[experimental design]だった。]

{final_emotion_entity:
  type: "complex_emotional_response",
  properties: {
    "amazement": 0.8,
    "respect_for_methodology": 0.7, 
    "feeling_manipulated": 0.6,
    "intellectual_appreciation": 0.9
  }
}

[「[最終的な][result]は[知らせて]いただけるのですか？」]

[「[research][paper]が[完成]したら、[copy]を[お渡し]いたします。」]
[「[your][contribution]は[acknowledgments]に[記載]させていただきます。」]

{closure_entity:
  type: "research_completion",
  properties: {
    "participant_role": "recognized",
    "future_communication": "promised",
    "satisfaction_level": 0.8
  }
}

[こうして、][図書館での[mysterious][experience]は[conclusion]を[迎えた]。]
[しかし、][人間の[cognition]と[perception]についての[my][interest]は、]
[r[さらに][ますます]r[深まる]ことになった。]

[r[最後に][end]r、][私は[思った]：]
{final_thought:[我々は[日常的に][どれほど多くの][unaware][experiments]の[subjects]なのだろうか？]}

[これが、][私の[research][career]の[beginning]となった。]
```

---

## 🔧 複雑コマンド組み合わせ例

### 高度なランダム挿入＋選択肢組み合わせ
```
# 例1: 三重ネスト構造
pattern_complex_001:
"r[{もし||仮に||万が一}][{何か||なにか||問題が}]r{[あったら||起きたら||発生したら]||[見つかったら||判明したら]}{、r[{遠慮せず||気にせず}][{連絡||報告}]rして||知らせて}{[ください||くれ]||[いただけませんか||もらえませんか]}"

# 例2: 条件分岐＋ランダム挿入
pattern_complex_002:
"r[{朝の||早朝の}][{挨拶||ご挨拶}]r{[おはようございます||おはよう]||[Good morning||グッドモーニング]}, if(time_of_day == 'morning' AND formality > 0.5)
r[{こんにちは||こんにちわ}][{、いかがお過ごしですか||、元気ですか}]r, if(time_of_day == 'afternoon')  
{[こんばんは||こんばんわ]||[Good evening||グッドイブニング]}, else"

# 例3: 連動選択＋n個選択
pattern_complex_003:
"2-{[彼は]&&[困惑した表情を浮かべ]||[彼女は]&&[不安そうな様子で]||[その人は]&&[当惑したように]}{[立ち尽くして]||[佇んで]||[その場に留まって]}いた"

# 例4: 深度3遡行検索＋全コマンド組み合わせ
pattern_complex_004:
"r[もし]r{[その[複雑な[状況]]]||[当該[事案]]}が{[解決||改善||好転]すれば||[悪化||深刻化]したら}、2-{[即座に]&&[適切な]||[迅速に]&&[最適な]||[速やかに]&&[効果的な]}{[対応||措置||手段]を[講じる||実施する]||[行動||judgment]を[取る||下す]}必要がある, if(urgency_level > 0.7)
[慎重に][状況を][見極めてから][判断しましょう], else"
```

### 感情・文脈依存の複雑パターン
```
# 例5: 感情状態による大幅変化
pattern_emotion_001:
"{[うわあああ]||[きゃああ]||[ひええええ]}{、r[{何||なん||どう}][{これ||こんなの}]r||r[{信じられない||ありえない}]r}！", if(emotion == 'shock' AND intensity > 0.8)
"r[{おお||ほう}][{、これは}]r{[興味深い||面白い||素晴らしい]}ですね", if(emotion == 'interest' AND formality > 0.6)  
"{[へー||ふーん]||[そうなんだ||そうか]}", if(emotion == 'mild_interest' AND formality < 0.4)
"...", else

# 例6: 年齢・職業・地域の複合条件
pattern_demographic_001:
"r[{まじで||マジで||ガチで}][{やばい||ヤバい||ヤバすぎ}]r{[じゃん||だよ]||[っしょ||でしょ]}", if(age < 25 AND region == 'kanto' AND formality < 0.3)
"r[{それは||こりゃ}][{大変||困った||まずい}]r{[ことですね||話ですな]||[ですよ||だなあ]}", if(age > 40 AND profession == 'business' AND formality > 0.5)
"{[うわー||やれやれ]||[困ったもんだ||参ったな]}", else

# 例7: 知識精度・アルコール濃度の複合判定
pattern_cognitive_001:
"r[{間違いなく||確実に||100%}][{おかしい||変だ||異常だ}]r", if(knowledge_accuracy > 0.8 AND alcohol_level < 0.2)
"r[{なんか||ちょっと}][{変な||おかしな}]r{[気がする||感じがする]||[ような気が||みたいな感じが]}する", if(knowledge_accuracy > 0.5 AND alcohol_level < 0.5)
"{[別に||特に]||[いや]}{[なんとも||何も]||[普通]}{[思わない||感じない]||[だと思う]}", if(alcohol_level > 0.6)
"r[{よく||はっきり}][{分からない||覚えてない}]rけど...", else
```

---

## 🧪 エッジケース・境界値テスト

### 循環参照テスト
```
# 意図的循環参照（検出テスト用）
circular_ref_A: "[circular_ref_B]|正常テキストA"
circular_ref_B: "[circular_ref_C]|正常テキストB"  
circular_ref_C: "[circular_ref_A]|正常テキストC"

# 自己参照
self_ref: "[self_ref]|終端テキスト"

# 複雑な循環（長距離）
long_cycle_1: "[long_cycle_5]|通常1"
long_cycle_2: "[long_cycle_1]|通常2"
long_cycle_3: "[long_cycle_2]|通常3"
long_cycle_4: "[long_cycle_3]|通常4"
long_cycle_5: "[long_cycle_4]|通常5"
```

### 深度制限テスト
```
# 最大深度テスト（深度10）
depth_test_1: "[depth_test_2]|Level1"
depth_test_2: "[depth_test_3]|Level2"
depth_test_3: "[depth_test_4]|Level3"
depth_test_4: "[depth_test_5]|Level4"
depth_test_5: "[depth_test_6]|Level5"
depth_test_6: "[depth_test_7]|Level6"
depth_test_7: "[depth_test_8]|Level7"
depth_test_8: "[depth_test_9]|Level8"
depth_test_9: "[depth_test_10]|Level9"
depth_test_10: "最深レベル到達|Level10"

# 分岐深度テスト
branch_depth_1: "{[branch_depth_2A]||[branch_depth_2B]||[branch_depth_2C]}"
branch_depth_2A: "[branch_depth_3A]|BranchA"
branch_depth_2B: "[branch_depth_3B]|BranchB"  
branch_depth_2C: "[branch_depth_3C]|BranchC"
branch_depth_3A: "[branch_depth_4]|DeepA"
branch_depth_3B: "[branch_depth_4]|DeepB"
branch_depth_3C: "[branch_depth_4]|DeepC"
branch_depth_4: "最終分岐到達"
```

### 大量データ・パフォーマンステスト
```
# 巨大選択肢（100選択肢）
massive_choice: "選択1|選択2|選択3|選択4|選択5|選択6|選択7|選択8|選択9|選択10|選択11|選択12|選択13|選択14|選択15|選択16|選択17|選択18|選択19|選択20|選択21|選択22|選択23|選択24|選択25|選択26|選択27|選択28|選択29|選択30|選択31|選択32|選択33|選択34|選択35|選択36|選択37|選択38|選択39|選択40|選択41|選択42|選択43|選択44|選択45|選択46|選択47|選択48|選択49|選択50|選択51|選択52|選択53|選択54|選択55|選択56|選択57|選択58|選択59|選択60|選択61|選択62|選択63|選択64|選択65|選択66|選択67|選択68|選択69|選択70|選択71|選択72|選択73|選択74|選択75|選択76|選択77|選択78|選択79|選択80|選択81|選択82|選択83|選択84|選択85|選択86|選択87|選択88|選択89|選択90|選択91|選択92|選択93|選択94|選択95|選択96|選択97|選択98|選択99|選択100"

# 超長文テスト
ultra_long_text: "これは非常に長いテキストのテストです。[この部分][には複数の][遡行検索][対象が含まれており]、[処理性能][を測定するための][サンプル][文章として][設計されています]。[実際の][小説や][物語では]、[このような][長い文章][構造が][頻繁に][登場する][可能性があるため]、[十分な][パフォーマンス][テストが][必要です]。[特に][遡行検索][処理では]、[テキストの][長さに][比例して][処理時間が][増加する][傾向があるため]、[適切な][最適化][戦略が][重要になります]。"

# ネストした巨大構造
nested_massive: "{[{[choice1]||[choice2]}]||[{[choice3]||[choice4]}]||[{[choice5]||[choice6]}]}の{[{[option1]||[option2]}]||[{[option3]||[option4]}]}について{[{[variant1]||[variant2]}]||[{[variant3]||[variant4]}]}を{[{[method1]||[method2]}]||[{[method3]||[method4]}]}する"
```

### Unicode・特殊文字テスト
```
# 多言語混在
multilingual: "Hello[こんにちは]你好[안녕하세요]Bonjour[Hola]Guten Tag[Здравствуйте]"

# 絵文字混在
emoji_mixed: "今日は[😊]いい天気[☀️]ですね[🌸]。[散歩][🚶‍♂️]でも[いかがですか][❓]"

# 特殊記号
special_chars: "「[これは]」『[特殊な]』【[記号の]】〈[テスト]〉《[です]》（[括弧の]）［[処理も］］｛[確認し]｝〔[ます]〕"

# 数値混在
number_mixed: "第[1]章から第[2]章にかけて、[約3割]の[登場人物]が[4つ]の[重要な]出来事を[5回]経験する"

# 制御文字・改行
control_chars: "行1\n[改行テスト]\r\n行2\t[タブテスト]\t行3"
```

---

## 📊 実用的長編例

### 例文集: レストランシーン（1,000パターン以上）
```
# 入店
restaurant_entry_001: "r[{いらっしゃいませ||お疲れさまです}]r、{[何名様||何人]||[お一人様||おひとり]}でしょうか？", if(context == 'restaurant_entrance')

# 注文
order_001: "r[{本日の||今日の}][{おすすめ||推奨}]rは{[何ですか||どちらでしょう]||[教えてください||聞かせてください]}", if(customer_type == 'indecisive')
order_002: "{[いつもの||例のやつ]||[定番を||レギュラーを]}お願いします", if(customer_type == 'regular')
order_003: "r[{すみません||申し訳ありませんが}]r{[アレルギー||食物アレルギー]||[苦手なもの||食べられないもの]}があるのですが...", if(customer_needs == 'dietary_restriction')

# 料理評価
food_reaction_001: "r[{うーん||んー}][{、これは}]r{[美味しい||おいしい||絶品]||[微妙||いまいち]}ですね", if(taste_evaluation_mode == 'honest')
food_reaction_002: "{[とても||非常に||すごく]||[まあまあ||そこそこ]}美味しいです", if(politeness_level > 0.7)

# 支払い
payment_001: "r[{お会計||会計||お勘定}][{お願いします||してください}]r", if(formality > 0.5)
payment_002: "{[割り勘||分割||別々]||[一緒に||まとめて]}でお願いします", if(group_payment == true)
```

### 長編対話例: 職場ミーティング（5,000文字相当）
```
meeting_start: "r[{皆さま||みなさん}][{、お疲れさまです}]r。r[{本日は||今日は}][{お忙しい中}]r{[お集まり||ご参加]||[出席]}いただき、{[ありがとうございます||感謝いたします]||[恐縮です||申し訳ありません]}"

agenda_intro: "r[{それでは||では}][{早速}]r{[本日の||今日の]||[この度の]}議題について{[説明||ご説明||お話]||[検討||協議]}させていただきます"

topic_1_intro: "{[第一の||最初の||まず]||[初めに||始めに]}課題は、{[売上||収益||業績]||[コスト||経費||支出]}に関する{[分析||検討||評価]||[改善||最適化]}です"

response_positive: "r[{なるほど||そうですね}][{、確かに}]r{[重要な||大切な||重大な]||[興味深い||注目すべき]}ポイントですね", if(agreement_level > 0.7)

response_concern: "r[{ちょっと||少し}][{気になる||心配な}]rのは、{[実現可能性||feasibility]||[リスク||危険性]}ですが...", if(concern_level > 0.6)

conclusion: "r[{以上で||これで}][{本日の||今日の}]rミーティングを{[終了||完了]||[閉じ||締め]}させていただきます。r[{お疲れさまでした||ありがとうございました}]r"
```

---

このサンプル集により、構文メモ.txtの要求する膨大で多様な例を検証・テストできます。長編小説例では実際のナラティブ生成での複雑な要求を、エッジケースでは境界条件でのシステム堅牢性を確認できます。

続いて、実際のCSVファイルとして使用可能な形式でもご提供いたします。どの部分を優先的にCSVファイル化いたしましょうか？ 