# NarrativeGen ライター向け設計ガイド V4

**バージョン: 4.0**  
**基準ドキュメント: memo.txt + 01_CORE_DESIGN_PHILOSOPHY.md**

---

## 0. ライターの役割と新しいワークフロー

NarrativeGenにおけるライターの役割は、「**Entity中心のプロパティ駆動型ナラティブ生成**」システムに対応した新しい執筆手法を身につけることです。従来の線形的なストーリー執筆ではなく、「動的で再利用可能な物語の部品」を設計・構築することが主な作業となります。

---

## 1. Entity-Property システムでの執筆手法

### 1.1 基本的な考え方

全ての要素をEntityとして扱い、それぞれにプロパティを付与することで、動的で一貫性のある物語を生成します。

**例: 窓のEntity設計**

```csv
entity_id: window_01
type: window
parent_entities: object, physical_object
properties:
  material: glass (既定値: glass)
  state: closed (範囲: open/closed/broken)
  cleanliness: 0.3 (範囲: 0.0-1.0)
  age: old (ラベル: 古い, 年季の入った, 長年使われた)
  frame_material: wood (既定値: wood)
  transparency: 0.7 (範囲: 0.0-1.0)
  described_properties: [] (描写済み要素の記録)
```

### 1.2 階層的プロパティ継承の活用

```
物理オブジェクト (既定値設定)
  ↓
窓 (コモン属性)
  ↓  
具体的な窓 (個別設定)
```

**継承設計例**:

```csv
# 物理オブジェクト (最上位)
entity_id,type,properties
physical_object,base,"{""weight"":1.0,""size"":1.0,""durability"":0.8}"

# 窓 (コモン)
entity_id,type,parent_entities,properties
common_window,window,physical_object,"{""material"":""glass"",""transparency"":0.8}"

# 具体的インスタンス
entity_id,type,parent_entities,properties
library_window,window,common_window,"{""cleanliness"":0.3,""age"":""old""}"
```

---

## 2. 構文ベース生成による執筆

### 2.1 構文記述法の基本

メモに示された構文記述法を用いて、動的な文章生成パターンを作成します。

**基本構文例**:
```
{scene description:[あなたは[LOCATION]に立っている。], {目の前には[OBJECT]がある。}, {[sound] が [direction]から聞こえる。}}
```

### 2.2 構文要素の詳細

- **`{type: }`**: セクションタイプの指定
- **`[]`**: Entity/プロパティ参照
- **`,`**: 要素の区切り
- **条件指定**: `[心理描写21～24のうちどれか2つ]`

**実践例**:
```csv
pattern_id,context,pattern_text
room_entry,scene_start,"{scene:[あなたは[LOCATION]に立っている。],[目の前には[OBJECT:window]がある。それは[OBJECT:window.material]でできており、[OBJECT:window.state]。]}"
object_examination,interaction,"{observation:[それは[OBJECT.material]製で、][表面は[OBJECT.cleanliness_description]。][sound_description]が聞こえる。]}"
```

### 2.3 入れ子構造の活用

```
段落12 {
  文章24,
  文章[プロパティ：現代の建物の中の情景描写],
  文章[プロパティ：現代的製品の説明文からどれか一つ],
  文章[語り手の心理描写21～24のうちどれか2つ][心理描写22～23のうち使われていない文]
}
```

**CSV記述例**:
```csv
paragraph_id,elements,selection_rule
para_room_desc,"scene_intro,building_desc,product_desc,psychology_desc","scene_intro=1,building_desc=random(1),product_desc=random(1),psychology_desc=random(2,unused_priority)"
```

---

## 3. 言い換え辞書の構築

### 3.1 基本概念

同一の意味を持つ複数の表現を辞書として管理し、文脈に応じて適切な表現を選択します。

**メモの例**:
```
「窓が開いているな」と気づいた。
↓ 言い換え辞書
- （どうやら窓が開いているようだ）
- 窓が開いているのが見えた。
- ふと見ると、窓が開いていることに気づいた。
```

### 3.2 言い換え辞書のCSV設計

```csv
group_id,variant_text,person,formality,tone,context,max_length,conditions_json
window_notice,"窓が開いているのが見えた。",3,0.7,neutral,observation,20,"{""mood"":""calm""}"
window_notice,"ふと見ると、窓が開いていることに気づいた。",3,0.5,thoughtful,realization,35,"{""mood"":""contemplative""}"
window_notice,"（どうやら窓が開いているようだ）",1,0.3,internal,internal_thought,25,"{""mood"":""uncertain""}"
window_notice,"窓が開いているのに気づいた。",3,0.8,direct,statement,20,"{""mood"":""focused""}"
```

### 3.3 プロパティ条件による選択

- **person**: 人称 (1=一人称、3=三人称)
- **formality**: 文体の硬さ (0.0-1.0)
- **tone**: トーン (neutral, thoughtful, excited, etc.)
- **context**: 文脈 (observation, realization, etc.)
- **max_length**: 最大文字数
- **conditions_json**: 追加条件

---

## 4. Entity描写システムの設計

### 4.1 描写要素の蓄積

Entityの持つ詳細な描写要素を事前に定義し、必要に応じて選択的に使用します。

**例: 窓の描写辞書**

```csv
entity_id,property,description_variants,usage_context
window_01,material,"ガラス製の,透明な,薄汚れたガラスの","material_focus"
window_01,age,"古びた,年季の入った,長年手入れされていない","time_focus"
window_01,frame,"木製の枠の,木枠の,古い木の枠に嵌められた","frame_focus"
window_01,state_closed,"固く閉ざされた,閉じられた,密閉された","state_focus"
window_01,overall,"漆喰塗の白い壁にある、割れた、古びた、木製の","comprehensive"
```

### 4.2 描写履歴の管理

既に使用された描写要素を記録し、重複を避けて表現の豊かさを維持します。

```csv
entity_id,described_properties,usage_count,last_used
window_01,"material,age",2,"2024-01-15T10:30:00"
door_main,"material",1,"2024-01-15T10:25:00"
```

---

## 5. 推論エンジン対応の執筆

### 5.1 キャラクター知識の設定

各キャラクターが持つ知識レベルと認識精度を定義します。

```csv
character_id,knowledge_domain,accuracy,range_tolerance,labels
detective_A,modern_products,0.9,0.05,"専門家,都会の現代人"
witness_B,food_items,0.7,0.15,"一般人,日常的知識"
drunk_person,general,0.3,0.30,"酩酊状態,判断力低下"
```

### 5.2 違和感検出のための設定

Entityのプロパティとキャラクター知識の比較により、自動的に違和感を検出します。

**例: チーズバーガーの重さ**

```csv
entity_id,property,expected_value,actual_value,character_knowledge
someones_cheeseburger,weight,0.1,0.12,modern_person_knowledge
# 結果: ±10%の範囲(0.09-0.11)を超えるため違和感発生
```

### 5.3 事象Entityの自動生成

違和感や重要な出来事は新しいEntityとして記録され、後の物語展開に活用されます。

```csv
entity_id,type,properties_json,timestamp
event_001,anomaly_detection,"{""severity"":0.6,""observer"":""detective_A"",""target"":""cheeseburger"",""type"":""weight_anomaly""}","2024-01-15T10:35:00"
event_002,social_interaction,"{""type"":""criticism"",""severity"":0.75,""validity"":0.99,""participants"":[""A"",""B""]}","2024-01-15T11:00:00"
```

---

## 6. CSVワークフローの実践

### 6.1 基本ワークフロー

1. **Entity設計**: 物語に登場する要素をEntity化
2. **プロパティ定義**: 各Entityの属性と階層関係を設定
3. **構文パターン作成**: 動的生成のためのテンプレート作成
4. **言い換え辞書構築**: 表現バリエーションの登録
5. **描写要素蓄積**: 詳細な描写パターンの事前準備
6. **テスト・調整**: 生成結果の確認と微調整

### 6.2 ファイル構成

```
NarrativeData/
├── Entities.csv          # Entity定義
├── SyntaxPatterns.csv    # 構文パターン
├── Paraphrases.csv       # 言い換え辞書
├── Descriptions.csv      # 描写要素
├── CharacterKnowledge.csv # キャラクター知識
└── ReasoningRules.csv    # 推論ルール
```

### 6.3 品質管理

- **一貫性チェック**: Entity参照の整合性確認
- **バランス調整**: 表現の偏りや重複の回避
- **動的テスト**: 異なる組み合わせでの生成確認

---

## 7. 高度な技法

### 7.1 条件付き生成

```csv
pattern_id,pattern_text,conditions
conditional_desc,"[IF weather=rain][雨音が窓を叩いている。][ELSE][静寂が部屋を包んでいる。]","weather_dependent"
```

### 7.2 文脈依存選択

```csv
group_id,variant_text,context_requirements
atmosphere,"不穏な空気が漂っている。","tension>0.7,time=night"
atmosphere,"平和な雰囲気に包まれている。","tension<0.3,time=day"
```

### 7.3 学習機能対応

使用履歴とプレイヤーの反応を記録し、より適切な表現選択に活用します。

```csv
variant_id,usage_count,player_reaction,effectiveness_score,last_updated
window_notice_01,5,positive,0.8,"2024-01-15T12:00:00"
window_notice_02,2,neutral,0.6,"2024-01-15T11:45:00"
```

---

## 8. デバッグとトラブルシューティング

### 8.1 一般的な問題

- **Entity参照エラー**: 存在しないEntityの参照
- **プロパティ未定義**: 必要なプロパティの設定漏れ
- **構文エラー**: 不正な構文記述
- **循環参照**: Entity継承の無限ループ

### 8.2 検証方法

- **構文チェッカー**: CSVファイルの形式・参照整合性確認
- **生成テスト**: 各パターンの実際の出力確認
- **プロパティトレース**: 継承チェーンの追跡
- **統計分析**: 使用頻度・バランスの確認

---

この新しい執筆手法により、ライターは動的で豊かな表現力を持つ物語システムの構築に貢献できます。Entity中心の設計思想を理解し、データ駆動型のアプローチに慣れることで、従来では不可能だった高度なナラティブ生成が実現可能になります。 