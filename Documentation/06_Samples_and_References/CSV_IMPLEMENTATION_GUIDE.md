# CSV実装ガイド - 構文エンジン対応

**バージョン: 1.0**  
**基準ドキュメント: 構文メモ.txt + SYNTAX_ENGINE_SPECIFICATION.md**  
**対象: 実装開始準備**

---

## 概要

構文メモ.txtの要求を完全に実装するために必要な、新規4CSVファイル + 既存2CSVファイル拡張の詳細仕様とサンプルデータを提供します。

---

## 新規CSVファイル詳細仕様

### 1. RecursiveDictionary.csv - 遡行検索辞書

#### 1.1 ファイル目的
「[～]が残っていれば更に遡って検索する」機能の中核辞書

#### 1.2 フィールド定義
```csv
term_id,term_text,variants,selection_weight,conditions,usage_count,last_used,recursive_depth
```

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| term_id | string | 一意識別子 | "term_001" |
| term_text | string | 検索対象語句 | "そこに置いてある" |
| variants | string | パイプ区切りバリエーション | "[そこの]\|そこにある\|[その放置[されている]]\|その" |
| selection_weight | float | 選択確率重み | 1.0 |
| conditions | string | 選択条件 | "mood==calm" |
| usage_count | int | 使用回数 | 0 |
| last_used | string | 最終使用日時 | "2024-01-01T00:00:00" |
| recursive_depth | int | 推奨最大再帰深度 | 3 |

#### 1.3 サンプルデータ
```csv
term_id,term_text,variants,selection_weight,conditions,usage_count,last_used,recursive_depth
term_001,そこに置いてある,"[そこの]|そこにある|[その放置[されている]]|その",1.0,"",0,"",3
term_002,されている,"されている|されてる|してる|してある|されちゃってる",1.0,"",0,"",2
term_003,その放置,"その放置|放置された|そこに放置された",1.0,"",0,"",1
term_004,もし,"もし|もしも|いざ|万が一",1.0,"",0,"",1
term_005,何か,"何か|なにか|何らか|何事か",1.0,"",0,"",1
term_006,あったら,"あったら|あった時は|あった場合|見つかったら",1.0,"",0,"",1
term_007,遠慮せず,"遠慮せず|遠慮なく|気にせず|躊躇なく",1.0,"",0,"",1
term_008,伝えてほしい,"伝えてほしい|教えてほしい|知らせてほしい|報告してほしい",1.0,"",0,"",1
```

---

### 2. SyntaxCommands.csv - コマンド処理定義

#### 2.1 ファイル目的  
テキスト内コマンド（r, ||, &&, if等）の処理定義

#### 2.2 フィールド定義
```csv
command_id,command_name,syntax_pattern,processor_class,parameters_json,priority,examples,enabled
```

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| command_id | string | コマンド一意識別子 | "cmd_random_insert" |
| command_name | string | コマンド名 | "ランダム挿入" |
| syntax_pattern | string | 正規表現パターン | "r\\[.*?\\]r" |
| processor_class | string | 処理クラス名 | "RandomInsertProcessor" |
| parameters_json | string | 処理パラメータ(JSON) | "{\"probability\":0.5}" |
| priority | int | 処理優先順位(小さいほど優先) | 1 |
| examples | string | 使用例 | "r[もし][何か]r" |
| enabled | bool | 有効/無効 | true |

#### 2.3 サンプルデータ
```csv
command_id,command_name,syntax_pattern,processor_class,parameters_json,priority,examples,enabled
cmd_conditional,条件分岐,"if\\s*\\([^)]+\\)",ConditionalProcessor,"{\"supports_else\":true}",1,"if(entity.weight > 0.1)",true
cmd_selection,選択肢,"\\{[^}]*\\|\\|[^}]*\\}",SelectionProcessor,"{\"separator\":\"||\"\"default_random\":true}",2,"{A||B||C}",true
cmd_linked_selection,連動選択,"\\[.*?\\]&&\\[.*?\\]",LinkedSelectionProcessor,"{\"link_probability\":0.8}",3,"[A]&&[B]",true
cmd_random_insert,ランダム挿入,"r\\[.*?\\]r",RandomInsertProcessor,"{\"default_probability\":0.5}",4,"r[もし][何か]r",true
cmd_n_selection,n個選択,"\\d+-\\{[^}]*\\|\\|[^}]*\\}",NSelectionProcessor,"{\"allow_duplicates\":false}",5,"2-{A||B||C}",true
cmd_sequential_left,左から順次,"<\\{[^}]*\\|\\|[^}]*\\}",SequentialProcessor,"{\"direction\":\"left\"}",6,"<{A||B||C}",true
cmd_sequential_right,右から順次,">\\{[^}]*\\|\\|[^}]*\\}",SequentialProcessor,"{\"direction\":\"right\"}",7,">{A||B||C}",true
cmd_bracket_resolution,遡行検索,"\\[([^\\[\\]]+)\\]",BracketResolver,"{\"max_depth\":10}",8,"[そこに置いてある]",true
```

---

### 3. Variables.csv - 変数定義・管理

#### 3.1 ファイル目的
システム変数・Entity変数・キャラクター変数の定義と管理

#### 3.2 フィールド定義
```csv
variable_id,scope,type,default_value,min_value,max_value,description,category,readonly
```

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| variable_id | string | 変数一意識別子 | "sys_max_recursion" |
| scope | string | スコープ(system/global/character/entity) | "system" |
| type | string | データ型(int/float/string/bool/entity_ref) | "int" |
| default_value | string | デフォルト値 | "10" |
| min_value | string | 最小値(数値型のみ) | "1" |
| max_value | string | 最大値(数値型のみ) | "50" |
| description | string | 説明 | "最大再帰深度" |
| category | string | カテゴリ | "performance" |
| readonly | bool | 読み取り専用フラグ | false |

#### 3.3 サンプルデータ
```csv
variable_id,scope,type,default_value,min_value,max_value,description,category,readonly
sys_max_recursion,system,int,10,1,50,最大再帰深度,performance,false
sys_processing_depth,system,int,0,0,50,現在の処理深度,runtime,true
sys_circular_ref_detected,system,bool,false,,,循環参照検出フラグ,runtime,true
global_current_scene,global,string,main_scene,,,現在のシーンID,scene,false
global_narrative_context,global,string,normal,,,ナラティブコンテキスト,scene,false
entity_weight_diff_pct,entity,float,0.0,-1.0,1.0,重量差分パーセンテージ,calculation,true
character_knowledge_accuracy,character,float,0.7,0.0,1.0,知識精度,knowledge,false
character_tolerance_pct,character,float,0.1,0.0,0.5,許容誤差パーセンテージ,knowledge,false
character_alcohol_level,character,float,0.0,0.0,1.0,アルコール濃度,condition,false
character_emotional_state,character,string,calm,,,感情状態,condition,false
```

---

### 4. TranslationUnits.csv - 文単位制約

#### 4.1 ファイル目的
「文のかたまり単位原則」を実装するための翻訳単位管理

#### 4.2 フィールド定義
```csv
unit_id,base_text,semantic_type,independence_level,translation_group,constraints,language_variants_json
```

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| unit_id | string | 翻訳単位一意識別子 | "unit_001" |
| base_text | string | 基本テキスト(日本語) | "その傘は壊れているよ。" |
| semantic_type | string | 意味タイプ | "statement" |
| independence_level | float | 独立性レベル(0.0-1.0) | 1.0 |
| translation_group | string | 翻訳グループ | "object_observation" |
| constraints | string | 制約条件 | "complete_sentence" |
| language_variants_json | string | 言語別バリエーション(JSON) | "{\"en\":[\"It's broken.\"]}" |

#### 4.3 サンプルデータ
```csv
unit_id,base_text,semantic_type,independence_level,translation_group,constraints,language_variants_json
unit_001,"その傘は壊れているよ。",statement,1.0,object_observation,complete_sentence,"{""en"":[""That umbrella is broken."",""It's broken.""],""zh"":[""那把伞坏了。""]}"
unit_002,"と〇〇は言った。",attribution,0.5,dialogue_attribution,requires_preceding_dialogue,"{""en"":[""said ○○."",""○○ said.""],""zh"":[""〇〇说道。""]}"
unit_003,"「その傘は壊れているよ」",dialogue,0.8,dialogue_content,quoted_speech,"{""en"":[""\"That umbrella is broken\"""],""zh"":[""\"那把伞坏了\"""]}"
unit_004,"昨日、風が強かったから、それで壊れたんだ。",explanation,1.0,causal_explanation,complete_sentence,"{""en"":[""It broke because the wind was strong yesterday.""],""zh"":[""因为昨天风很大，所以坏了。""]}"
unit_005,"だからそんなはずはない。",objection,1.0,logical_objection,complete_sentence,"{""en"":[""So that can't be right.""],""zh"":[""所以这不可能是对的。""]}"
unit_006,"微妙に重い気がする。",observation,1.0,sensory_observation,complete_sentence,"{""en"":[""It feels slightly heavy.""],""zh"":[""感觉稍微有点重。""]}"
unit_007,"本当にチーズバーガーだったのか？",doubt,1.0,questioning_doubt,complete_sentence,"{""en"":[""Was it really a cheeseburger?""],""zh"":[""真的是芝士汉堡吗？""]}"
```

---

## 既存CSVファイル拡張仕様

### 5. SyntaxPatterns.csv 拡張

#### 5.1 追加フィールド
```csv
# 既存フィールド: pattern_id,context,pattern_text,conditions,priority
# 追加フィールド: commands,variables,translation_unit_id,recursive_terms
```

#### 5.2 追加フィールド詳細

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| commands | string | 使用するコマンドリスト | "r,||,&&" |
| variables | string | 使用する変数リスト | "OBJECT,STATE,WEIGHT" |
| translation_unit_id | string | 対応する翻訳単位ID | "unit_001" |
| recursive_terms | string | 遡行検索対象用語 | "[そこに置いてある],[されている]" |

#### 5.3 拡張サンプルデータ
```csv
pattern_id,context,pattern_text,conditions,priority,commands,variables,translation_unit_id,recursive_terms
pattern_001,scene_start,"{scene:[あなたは[LOCATION]に立っている。],[目の前には[OBJECT]がある。]}","",1,"||","LOCATION,OBJECT","unit_scene_start","[LOCATION],[OBJECT]"
pattern_002,object_examination,"[その[OBJECT]は[STATE]。]","",1,"||","OBJECT,STATE","unit_basic_obs","[OBJECT],[STATE]"
pattern_003,weight_anomaly,"{thought:[この[OBJECT]、何だか[WEIGHT_FEELING]。]}","weight_anomaly==true",3,"||,if","OBJECT,WEIGHT_FEELING","unit_weight_obs","[OBJECT],[WEIGHT_FEELING]"
pattern_004,random_greeting,"[r[こんにちは][おはよう]r、[NAME]さん。]","",2,"r","NAME","unit_greeting","[NAME]"
```

---

### 6. Paraphrases.csv 拡張

#### 6.1 追加フィールド
```csv
# 既存フィールド: group_id,variant_text,person,formality,tone,context,max_length,conditions_json,usage_count,last_used
# 追加フィールド: recursive_terms,translation_group,semantic_weight
```

#### 6.2 追加フィールド詳細

| フィールド | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| recursive_terms | string | この表現に含まれる遡行検索用語 | "[微妙に],[重い]" |
| translation_group | string | 翻訳グループID | "weight_sensation" |
| semantic_weight | float | 意味的重要度重み | 1.0 |

#### 6.3 拡張サンプルデータ
```csv
group_id,variant_text,person,formality,tone,context,max_length,conditions_json,usage_count,last_used,recursive_terms,translation_group,semantic_weight
weight_feeling,"微妙に重い気がする",3,0.4,uncertain,size_anomaly,15,"{""intensity"":""low""}",0,"","[微妙に],[重い]",weight_sensation,1.0
weight_feeling,"明らかに重量がおかしい",3,0.8,certain,size_anomaly,20,"{""intensity"":""high""}",0,"","[明らかに],[重量],[おかしい]",weight_sensation,1.5
greeting_casual,"[r[おはよう][こんにちは]r[NAME]さん",3,0.3,casual,greeting,25,"{}",0,"","[NAME]",greeting_group,1.0
location_description,"[あなたは[LOCATION]に立っている]",3,0.7,descriptive,scene_setting,30,"{}",0,"","[LOCATION]",location_group,1.0
```

---

## 実装チェックリスト

### Phase 1: CSVファイル作成
- [ ] RecursiveDictionary.csv 作成・サンプルデータ投入
- [ ] SyntaxCommands.csv 作成・サンプルデータ投入  
- [ ] Variables.csv 作成・サンプルデータ投入
- [ ] TranslationUnits.csv 作成・サンプルデータ投入
- [ ] SyntaxPatterns.csv 拡張フィールド追加
- [ ] Paraphrases.csv 拡張フィールド追加

### Phase 2: データ整合性チェック
- [ ] Entity参照の整合性確認
- [ ] 翻訳グループの一貫性確認  
- [ ] 遡行検索用語の重複・欠損チェック
- [ ] 変数スコープの適切性確認

### Phase 3: テストデータ拡充
- [ ] 構文メモ.txt 例文の完全データ化
- [ ] エラーケースのテストデータ追加
- [ ] パフォーマンステスト用大量データ生成

---

## ファイル配置・命名規則

### ディレクトリ構造
```
Assets/StreamingAssets/NarrativeData/
├── Core/
│   ├── RecursiveDictionary.csv
│   ├── SyntaxCommands.csv  
│   ├── Variables.csv
│   └── TranslationUnits.csv
├── Extended/
│   ├── SyntaxPatterns.csv (拡張版)
│   └── Paraphrases.csv (拡張版)
└── Samples/
    ├── TestRecursiveDict.csv
    └── DebugSamples.csv
```

### バージョン管理
- 本番用: ファイル名そのまま
- テスト用: ファイル名末尾に"_test" 
- 開発用: ファイル名末尾に"_dev"

---

このガイドに従って実装を進めることで、構文メモ.txtの要求を完全に満たすCSVベースのナラティブ生成システムが構築できます。 