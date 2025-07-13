# NarrativeGen システムアーキテクチャ V4

**バージョン: 4.0**  
**基準ドキュメント: memo.txt + 01_CORE_DESIGN_PHILOSOPHY.md**

---

## 0. アーキテクチャ概要

NarrativeGenは「**Entity中心のプロパティ駆動型ナラティブ生成**」を核心とする統合システムです。従来のイベント駆動やプロポジション駆動ではなく、全ての要素をEntityとして統一的に扱い、プロパティの階層的継承と構文ベース生成により、動的で一貫性のある物語を創造します。

---

## 1. システム全体構成

### 1.1 コア・アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                 Game Manager                        │
│              (中央制御・統合管理)                       │
└─────────────────┬───────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│Entity │    │Syntax │    │Reason │
│Manager│    │Engine │    │Engine │
└───┬───┘    └───┬───┘    └───┬───┘
    │             │             │
┌───▼────────────▼─────────────▼───┐
│         Dictionary System         │
│    (言い換え・構文・プロパティ)      │
└───┬───────────────────────────────┘
    │
┌───▼───┐
│  CSV  │
│Data   │
│Files  │
└───────┘
```

### 1.2 主要コンポーネント

1. **EntityManager**: 全EntityとPropertyの管理
2. **SyntaxEngine**: 構文解析・生成エンジン
3. **ReasoningEngine**: 推論・違和感検出エンジン
4. **DictionarySystem**: 言い換え・構文・プロパティ辞書
5. **GameManager**: 全体統合・制御

---

## 2. EntityManager (Entity-Property 管理システム)

### 2.1 責務

- 全Entityの生成・管理・破棄
- プロパティの階層的継承処理
- Entity間関係の管理
- 描写履歴・使用履歴の記録

### 2.2 データ構造

```csharp
public class Entity
{
    public string Id { get; set; }
    public string Type { get; set; }
    public Dictionary<string, PropertyValue> Properties { get; set; }
    public List<string> ParentEntities { get; set; }  // 継承元
    public HashSet<string> DescribedProperties { get; set; }  // 描写済み
    public Dictionary<string, int> UsageCount { get; set; }  // 使用履歴
    public DateTime LastAccessed { get; set; }
}

public class PropertyValue
{
    public object DefaultValue { get; set; }
    public object CurrentValue { get; set; }
    public object RangeMin { get; set; }
    public object RangeMax { get; set; }
    public string RangeType { get; set; }  // "absolute", "percentage", etc.
    public List<string> Labels { get; set; }
}
```

### 2.3 プロパティ継承ロジック

```csharp
public object GetEffectivePropertyValue(string entityId, string propertyName)
{
    var entity = GetEntity(entityId);
    
    // 1. 具体的インスタンスの値を確認
    if (entity.Properties.ContainsKey(propertyName) && 
        entity.Properties[propertyName].CurrentValue != null)
        return entity.Properties[propertyName].CurrentValue;
    
    // 2. 親Entity（コモン）の値を確認
    foreach (var parentId in entity.ParentEntities)
    {
        var parentValue = GetEffectivePropertyValue(parentId, propertyName);
        if (parentValue != null) return parentValue;
    }
    
    // 3. 既定値を返す
    return entity.Properties[propertyName]?.DefaultValue;
}
```

---

## 3. SyntaxEngine (構文解析・生成エンジン)

### 3.1 責務

- 構文パターンの解析
- Entity/プロパティ参照の展開
- 入れ子構造の処理
- 条件付き生成の実行

### 3.2 構文記述法処理

```csharp
public class SyntaxPattern
{
    public string Pattern { get; set; }
    // 例: "{scene description:[あなたは[LOCATION]に立っている。], {目の前には[OBJECT]がある。}}"
    
    public List<SyntaxSection> Sections { get; set; }
}

public class SyntaxSection
{
    public string Type { get; set; }  // "scene description", "thought", etc.
    public List<SyntaxElement> Elements { get; set; }
}

public class SyntaxElement
{
    public ElementType Type { get; set; }  // Text, EntityRef, PropertyRef, Conditional
    public string Content { get; set; }
    public string EntityId { get; set; }
    public string PropertyName { get; set; }
    public ConditionalRule Condition { get; set; }
}
```

### 3.3 生成処理フロー

```csharp
public string GenerateText(SyntaxPattern pattern, Context context)
{
    var result = new StringBuilder();
    
    foreach (var section in pattern.Sections)
    {
        var sectionText = ProcessSection(section, context);
        result.Append(sectionText);
    }
    
    return result.ToString();
}

private string ProcessSection(SyntaxSection section, Context context)
{
    var candidates = GetCandidateTexts(section, context);
    return SelectBestCandidate(candidates, context);
}
```

---

## 4. ReasoningEngine (推論・違和感検出エンジン)

### 4.1 責務

- Entityプロパティの比較分析
- キャラクター知識との照合
- 違和感・矛盾の検出
- 事象Entityの自動生成

### 4.2 推論ロジック

```csharp
public class PropertyComparison
{
    public bool CompareWithExpectation(Entity entity, string propertyName, 
                                     CharacterKnowledge knowledge)
    {
        var actualValue = entityManager.GetEffectivePropertyValue(entity.Id, propertyName);
        var expectedRange = knowledge.GetExpectedRange(entity.Type, propertyName);
        
        return IsWithinRange(actualValue, expectedRange, knowledge.Accuracy);
    }
}

public class AnomalyDetection
{
    public List<Anomaly> DetectAnomalies(Entity entity, Character observer)
    {
        var anomalies = new List<Anomaly>();
        
        foreach (var property in entity.Properties.Keys)
        {
            if (!CompareWithExpectation(entity, property, observer.Knowledge))
            {
                anomalies.Add(CreateAnomaly(entity, property, observer));
            }
        }
        
        return anomalies;
    }
}
```

### 4.3 事象Entity自動生成

```csharp
public Entity CreateEventEntity(Anomaly anomaly)
{
    var eventEntity = new Entity
    {
        Id = $"event_{Guid.NewGuid()}",
        Type = "event",
        Properties = new Dictionary<string, PropertyValue>
        {
            ["type"] = new PropertyValue { CurrentValue = "anomaly_detection" },
            ["severity"] = new PropertyValue { CurrentValue = anomaly.Severity },
            ["observer"] = new PropertyValue { CurrentValue = anomaly.Observer.Id },
            ["target"] = new PropertyValue { CurrentValue = anomaly.Target.Id },
            ["timestamp"] = new PropertyValue { CurrentValue = DateTime.Now }
        }
    };
    
    return eventEntity;
}
```

---

## 5. DictionarySystem (辞書システム)

### 5.1 責務

- 言い換えパターンの管理
- プロパティ条件による選択
- 使用履歴による重複回避
- 表現バリエーションの提供

### 5.2 言い換え辞書構造

```csharp
public class ParaphraseGroup
{
    public string GroupId { get; set; }
    public List<ParaphraseVariant> Variants { get; set; }
}

public class ParaphraseVariant
{
    public string Text { get; set; }
    public Dictionary<string, object> Conditions { get; set; }  // 人称、文体、etc.
    public int UsageCount { get; set; }
    public DateTime LastUsed { get; set; }
}
```

### 5.3 選択アルゴリズム

```csharp
public string SelectBestVariant(ParaphraseGroup group, Context context)
{
    var suitableCandidates = group.Variants
        .Where(v => MatchesConditions(v, context))
        .OrderBy(v => v.UsageCount)  // 使用回数の少ない順
        .ToList();
    
    if (suitableCandidates.Count == 0)
        return group.Variants.First().Text;  // fallback
    
    // 複数候補がある場合、重み付きランダム選択
    return WeightedRandomSelection(suitableCandidates);
}
```

---

## 6. CSV データ構造設計

### 6.1 Entity定義 (Entities.csv)

```csv
entity_id,type,parent_entities,properties_json
window_01,window,"object,physical_object","{""material"":""glass"",""state"":""closed"",""cleanliness"":0.3}"
player_01,character,"character,modern_person","{""knowledge_modern_food"":0.8,""alcohol_tolerance"":0.6}"
common_cheeseburger,food,"food,modern_product","{""weight"":0.1,""size"":0.3,""brand"":""McDonald's""}"
```

### 6.2 構文パターン (SyntaxPatterns.csv)

```csv
pattern_id,context,pattern_text
room_description,scene_start,"{scene:[あなたは[LOCATION]に立っている。],[目の前には[OBJECT]がある。],[sound]が[direction]から聞こえる。}"
anomaly_reaction,reasoning,"{thought:[微妙に[SIZE_DIFF]。],[本当に[EXPECTED_TYPE]だったのか？]}"
```

### 6.3 言い換え辞書 (Paraphrases.csv)

```csv
group_id,variant_text,person,formality,tone,max_length,conditions_json
window_notice,"窓が開いているのが見えた。",3,0.7,neutral,20,"{""context"":""observation""}"
window_notice,"ふと見ると、窓が開いていることに気づいた。",3,0.5,thoughtful,30,"{""context"":""realization""}"
window_notice,"（どうやら窓が開いているようだ）",1,0.3,internal,25,"{""context"":""internal_thought""}"
```

---

## 7. システム統合フロー

### 7.1 典型的な処理シーケンス

```
1. GameManager: アクション受信
    ↓
2. EntityManager: 関連Entity特定・状態更新
    ↓
3. ReasoningEngine: 異常・違和感検出
    ↓
4. SyntaxEngine: 構文パターン選択
    ↓
5. DictionarySystem: 言い換え選択
    ↓
6. 最終テキスト生成・UI出力
```

### 7.2 拡張性設計

- **新しいEntityタイプ**: CSV追加のみで対応
- **新しい推論ルール**: ルールエンジン設定で対応
- **新しい言い換えパターン**: 辞書CSV追加で対応
- **新しい構文**: パターンCSV追加で対応

---

## 8. パフォーマンス考慮事項

### 8.1 最適化戦略

- **Entity キャッシング**: 頻繁にアクセスされるEntityのメモリ保持
- **プロパティ継承の最適化**: 計算結果キャッシュ
- **辞書インデックス**: プロパティ条件による高速検索
- **遅延評価**: 必要時のみ詳細な推論実行

### 8.2 メモリ管理

- **ガベージコレクション対応**: Poolingパターンの活用
- **大量Entity処理**: ページング・ストリーミング対応
- **履歴データ圧縮**: 古い使用履歴の統計的圧縮

---

本アーキテクチャにより、Entity中心の一貫した設計思想の下で、拡張性・保守性・パフォーマンスを両立した動的ナラティブ生成システムを実現します。 