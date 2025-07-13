# CSV サンプル構造 - memo.txt実装指針

**バージョン: 4.0**  
**基準ドキュメント: memo.txt + 01_CORE_DESIGN_PHILOSOPHY.md**

---

## 0. CSVファイル全体構成

memo.txtの方針を実装するために必要なCSVファイル構成と具体的なサンプルデータを示します。

```
Assets/StreamingAssets/NarrativeData/
├── Entities.csv              # Entity定義・プロパティ継承
├── SyntaxPatterns.csv        # 構文パターン・テンプレート  
├── Paraphrases.csv           # 言い換え辞書・表現バリエーション
├── EntityDescriptions.csv     # Entity描写要素・詳細辞書
├── CharacterKnowledge.csv     # キャラクター知識・認識精度
├── ReasoningRules.csv        # 推論ルール・違和感検出
└── EventTemplates.csv        # 事象Entity生成テンプレート
```

---

## 1. Entities.csv - Entity定義・プロパティ継承

### 1.1 基本構造

```csv
entity_id,type,parent_entities,properties_json,labels
```

### 1.2 サンプルデータ

```csv
entity_id,type,parent_entities,properties_json,labels
# 基底Entity群
physical_object,base,,"{""weight"":1.0,""size"":1.0,""durability"":0.8}","物理オブジェクト"
character,base,,"{""knowledge_accuracy"":0.7,""observation_skill"":0.5}","キャラクター"
food_item,base,physical_object,"{""weight"":0.1,""edible"":true,""freshness"":1.0}","食品"
modern_product,base,physical_object,"{""manufactured_date"":""recent"",""brand_recognition"":0.8}","現代製品"

# コモンEntity群
common_window,window,physical_object,"{""material"":""glass"",""transparency"":0.8,""frame_material"":""wood""}","一般的な窓"
common_cheeseburger,food,food_item|modern_product,"{""weight"":0.1,""size"":0.3,""brand"":""McDonald's""}","マックのチーズバーガー"
modern_person,character,character,"{""knowledge_modern_food"":0.8,""alcohol_tolerance"":0.6,""city_knowledge"":0.9}","都会の現代人"

# 具体的インスタンス
library_window,window,common_window,"{""cleanliness"":0.3,""age"":""old"",""location"":""library""}","図書館の窓"
someones_cheeseburger,food,common_cheeseburger,"{""weight"":0.12,""bite_taken"":true,""owner"":""suspect_A""}","誰々が食べていたチーズバーガー"
detective_A,character,modern_person,"{""knowledge_modern_food"":0.9,""range_tolerance"":0.05,""profession"":""detective""}","探偵A"
witness_B,character,modern_person,"{""knowledge_modern_food"":0.7,""range_tolerance"":0.15,""emotional_state"":""nervous""}","証人B"
drunk_person,character,modern_person,"{""alcohol_tolerance"":0.3,""range_tolerance"":0.30,""judgment_impaired"":true}","酩酊状態の人"
```

---

## 2. SyntaxPatterns.csv - 構文パターン・テンプレート

### 2.1 基本構造

```csv
pattern_id,context,pattern_text,conditions,priority
```

### 2.2 サンプルデータ

```csv
pattern_id,context,pattern_text,conditions,priority
# 基本的な場面描写
scene_entry,scene_start,"{scene:[あなたは[LOCATION]に立っている。],[目の前には[OBJECT]がある。],[sound]が[direction]から聞こえる。}","",1
room_description,room_enter,"{scene:[部屋の中は[ROOM.atmosphere]。],[OBJECT:window]が[OBJECT:window.state]ており、[OBJECT:window.light_description]。]}","",1

# 物体調査パターン
object_examination,interact,"{observation:[それは[OBJECT.material]製で、][表面は[OBJECT.surface_description]。][OBJECT.additional_details]が確認できる。]}","",1
detailed_inspection,interact_detailed,"{analysis:[詳しく調べると、[OBJECT.detailed_properties]。][OBJECT.anomaly_description]]}","has_anomaly==true",2

# 心理描写パターン  
psychology_21,thought,"{internal:([OBJECT]について何か違和感を覚える。)}","anomaly_detected==true",1
psychology_22,thought,"{internal:(本当に[EXPECTED_TYPE]だったのか？)}","expectation_mismatch==true",1
psychology_23,thought,"{internal:(微妙に[SIZE_DIFF]ような気がする。)}","size_anomaly==true",1
psychology_24,thought,"{internal:(いや、考えすぎかもしれない。)}","uncertainty_high==true",1

# 違和感表現パターン
anomaly_detection,reasoning,"{thought:[微妙に[DIFF_DESCRIPTION]。],[本当に[EXPECTED_OBJECT]だったのか？]}","reasoning_triggered==true",3
food_weight_anomaly,reasoning_food,"{thought:[このチーズバーガー、何だか[WEIGHT_IMPRESSION]気がする。],[普通の[FOOD_TYPE]より[WEIGHT_COMPARISON]のではないか？]}","food_weight_anomaly==true",3
```

---

## 3. Paraphrases.csv - 言い換え辞書

### 3.1 基本構造

```csv
group_id,variant_text,person,formality,tone,context,max_length,conditions_json,usage_count,last_used
```

### 3.2 サンプルデータ

```csv
group_id,variant_text,person,formality,tone,context,max_length,conditions_json,usage_count,last_used
# 窓の気づきパターン（memo.txt例）
window_notice,"窓が開いているのが見えた。",3,0.7,neutral,observation,20,"{""mood"":""calm""}",0,
window_notice,"ふと見ると、窓が開いていることに気づいた。",3,0.5,thoughtful,realization,35,"{""mood"":""contemplative""}",0,
window_notice,"（どうやら窓が開いているようだ）",1,0.3,internal,internal_thought,25,"{""mood"":""uncertain""}",0,
window_notice,"窓が開いているのに気づいた。",3,0.8,direct,statement,20,"{""mood"":""focused""}",0,

# 重さの違和感表現
weight_feeling,"微妙に重い気がする",3,0.4,uncertain,size_anomaly,15,"{""intensity"":""low""}",0,
weight_feeling,"明らかに重量がおかしい",3,0.8,certain,size_anomaly,20,"{""intensity"":""high""}",0,
weight_feeling,"何となく重い感じがする",3,0.3,vague,size_anomaly,18,"{""intensity"":""low""}",0,

# 推論・疑問表現
doubt_expression,"本当にチーズバーガーだったのか？",3,0.6,questioning,doubt,25,"{""certainty"":""low""}",0,
doubt_expression,"これは本当にチーズバーガーなのだろうか？",3,0.7,formal,doubt,30,"{""certainty"":""medium""}",0,
doubt_expression,"（チーズバーガーじゃないかもしれない）",1,0.4,internal,doubt,25,"{""certainty"":""low""}",0,

# 酩酊状態の反応
drunk_response,"いや、何も？",3,0.2,dismissive,drunk_response,10,"{""alcohol_level"":""high""}",0,
drunk_response,"別に...おかしくないよ？",3,0.3,uncertain,drunk_response,15,"{""alcohol_level"":""medium""}",0,
drunk_response,"え？何か変だった？",3,0.4,confused,drunk_response,15,"{""alcohol_level"":""high""}",0,

# 後日の言及
later_reference,"あのときにあんなことを言われたからな…",3,0.5,resentful,past_reference,25,"{""time_passed"":""days""}",0,
later_reference,"でもあの時に辛辣なことを言われたし",3,0.6,bitter,past_reference,25,"{""severity"":""high""}",0,
```

---

## 4. EntityDescriptions.csv - Entity描写要素辞書

### 4.1 基本構造

```csv
entity_id,property_focus,description_variants,usage_context,selection_conditions
```

### 4.2 サンプルデータ（memo.txt窓の例）

```csv
entity_id,property_focus,description_variants,usage_context,selection_conditions
# 窓の詳細描写（memo.txtから）
library_window,material,"ガラス製の|透明な|薄汚れたガラスの",material_focus,"cleanliness<0.5"
library_window,age,"古びた|年季の入った|長年手入れされていない",time_focus,"age==old"
library_window,frame,"木製の枠の|木枠の|古い木の枠に嵌められた",frame_focus,"frame_material==wood"
library_window,cleanliness,"薄汚れた|手入れされていない|汚れの目立つ",state_focus,"cleanliness<0.5"
library_window,overall,"漆喰塗の白い壁にある、割れた、古びた、木製の、木枠の、透明な、薄汚れた、暫くの間誰も手を付けていない",comprehensive,"full_description==true"

# チーズバーガーの描写
someones_cheeseburger,appearance,"半分食べかけの|誰かが手を付けた|少し欠けた",visual_focus,"bite_taken==true"
someones_cheeseburger,size,"普通サイズの|標準的な|一般的な大きさの",size_focus,"size_normal==true"
someones_cheeseburger,weight_impression,"微妙に重い|やや重量感のある|通常より重めの",weight_focus,"weight>0.11"
someones_cheeseburger,brand,"マクドナルドの|マックの|ファストフード店の",brand_focus,"brand==McDonald's"

# キャラクターの表情・態度
detective_A,expression,"鋭い眼差しの|注意深い|観察力のある",professional,"profession==detective"
witness_B,expression,"緊張した|不安そうな|落ち着かない",nervous,"emotional_state==nervous"
drunk_person,expression,"ふらつく|焦点の定まらない|酔っぱらった",impaired,"judgment_impaired==true"
```

---

## 5. CharacterKnowledge.csv - キャラクター知識定義

### 5.1 基本構造

```csv
character_id,knowledge_domain,object_type,expected_range_min,expected_range_max,accuracy_level,tolerance_percentage
```

### 5.2 サンプルデータ（memo.txt例）

```csv
character_id,knowledge_domain,object_type,expected_range_min,expected_range_max,accuracy_level,tolerance_percentage
# 都会の現代人の知識（memo.txtから）
detective_A,modern_food,cheeseburger,0.09,0.11,0.9,0.10
detective_A,modern_products,general,0.8,1.2,0.9,0.05
detective_A,food_items,weight,0.05,0.15,0.95,0.05

witness_B,modern_food,cheeseburger,0.08,0.12,0.7,0.15
witness_B,daily_objects,general,0.5,1.5,0.7,0.15

# 酩酊状態の認識能力（memo.txtから）
drunk_person,modern_food,cheeseburger,0.07,0.13,0.3,0.30
drunk_person,general,all,0.0,2.0,0.3,0.30

# 知識プリセット
modern_person_preset,modern_products,electronics,0.9,1.1,0.8,0.10
modern_person_preset,food_items,processed_food,0.8,1.2,0.7,0.15
modern_person_preset,daily_objects,household,0.7,1.3,0.6,0.20
```

---

## 6. ReasoningRules.csv - 推論ルール・違和感検出

### 6.1 基本構造

```csv
rule_id,trigger_condition,comparison_type,threshold,action_type,consequence_text,event_properties
```

### 6.2 サンプルデータ（memo.txtロジック）

```csv
rule_id,trigger_condition,comparison_type,threshold,action_type,consequence_text,event_properties
# 重量違和感検出（memo.txtから）
weight_anomaly,weight_outside_range,percentage,character.tolerance,generate_anomaly,"微妙に[SIZE_DIFF]。本当に[EXPECTED_TYPE]だったのか？","{""type"":""weight_anomaly"",""severity"":""medium""}"
size_anomaly,size_outside_range,percentage,character.tolerance,generate_anomaly,"何だか[SIZE_IMPRESSION]気がする","{""type"":""size_anomaly"",""severity"":""low""}"

# 酩酊状態での気づき失敗（memo.txtから）
drunk_missed_anomaly,anomaly_detected AND character.judgment_impaired,boolean,true,generate_event,"いや、何も？","{""type"":""missed_observation"",""cause"":""alcohol_impairment""}"

# 辛辣な指摘の記録（memo.txtから）
criticism_event,anomaly_missed AND questioned_by_other,boolean,true,generate_event,"だから言ったんだ。あんなに飲んで捜査するバカがいるか。","{""type"":""criticism"",""severity"":0.75,""validity"":0.99}"

# 過去の経験の想起
past_experience_recall,common_topic_detected,similarity,0.7,generate_event,"でもあのときにあんな事言われたからな…","{""type"":""past_reference"",""emotional_impact"":""negative""}"
```

---

## 7. EventTemplates.csv - 事象Entity生成テンプレート

### 7.1 基本構造

```csv
template_id,event_type,trigger_condition,entity_properties,narrative_impact,follow_up_rules
```

### 7.2 サンプルデータ（memo.txt事象Entity）

```csv
template_id,event_type,trigger_condition,entity_properties,narrative_impact,follow_up_rules
# 違和感検出事象
anomaly_detection,observation,property_comparison_failed,"{""observer"":""character_id"",""target"":""entity_id"",""severity"":""calculated"",""timestamp"":""now""}",medium,"enable_doubt_responses"

# 批判・指摘事象（memo.txtから）
criticism_harsh,social_interaction,missed_observation_questioned,"{""critic"":""character_id"",""target"":""character_id"",""harshness"":0.75,""validity"":0.99,""topic"":""missed_anomaly""}",high,"enable_resentment_responses"

# 過去の想起事象
past_memory_trigger,psychological,similar_context_detected,"{""original_event"":""event_id"",""trigger_context"":""current_situation"",""emotional_charge"":""negative""}",medium,"enable_comparison_responses"

# 捜査状況での飲酒批判（memo.txt具体例）
drunk_investigation_criticism,professional_criticism,drunk_during_investigation,"{""type"":""professional_misconduct"",""severity"":0.8,""context"":""investigation"",""criticism"":""あんなに飲んで捜査するバカがいるか""}",high,"generate_defensive_responses"
```

---

## 8. 実装時の注意事項

### 8.1 CSV解析優先順位

1. **Entities.csv**: 最初に読み込み、継承関係を構築
2. **CharacterKnowledge.csv**: キャラクター知識ベース構築
3. **ReasoningRules.csv**: 推論エンジン設定
4. **SyntaxPatterns.csv**: 構文解析辞書構築
5. **Paraphrases.csv**: 言い換え辞書構築
6. **EntityDescriptions.csv**: 描写要素辞書構築
7. **EventTemplates.csv**: 事象生成ルール設定

### 8.2 データ整合性チェック

- **Entity参照整合性**: 存在しないEntityのIDを参照していないか
- **プロパティ定義**: 必要なプロパティが適切に継承されているか
- **循環参照**: parent_entitiesで無限ループが発生しないか
- **数値範囲**: 確率値、重み値が適切な範囲内にあるか

### 8.3 パフォーマンス考慮

- **インデックス化**: 頻繁に検索されるプロパティのインデックス作成
- **キャッシング**: 計算結果の適切なキャッシング
- **遅延読み込み**: 必要時のみ詳細データを読み込み

---

このCSV構造により、memo.txtに記載された「Entity中心のプロパティ駆動型ナラティブ生成」の完全実装が可能になります。各CSVファイルが相互に連携し、動的で豊かな物語生成を実現します。 