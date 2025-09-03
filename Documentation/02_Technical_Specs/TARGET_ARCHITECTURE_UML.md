# 理想的なEntity-Propertyアーキテクチャ設計

## memo.txtベースの新アーキテクチャ

```mermaid
classDiagram
    class EntityManager {
        <<Core System>>
        -entities Dictionary~string,Entity~
        -entityTypes Dictionary~string,EntityType~
        -usageHistory List~EntityUsage~
        +CreateEntity(typeId, instanceId) Entity
        +GetEntity(id) Entity
        +DestroyEntity(id)
        +InheritProperties(child, parent)
        +RecordUsage(entityId, context)
        +FindEntitiesByProperty(propertyName, value)
    }
    
    class Entity {
        +Id string
        +TypeId string
        +ParentId string
        +Properties Dictionary~string,PropertyValue~
        +CreatedAt DateTime
        +LastUsed DateTime
        +GetProperty(name) PropertyValue
        +SetProperty(name, value)
        +InheritFrom(parent)
        +Clone() Entity
    }
    
    class PropertyValue {
        +Name string
        +Value object
        +Type PropertyType
        +Source PropertySource
        +Confidence float
        +LastModified DateTime
        +IsInherited bool
        +ToString() string
        +CompareTo(other) float
    }
    
    class EntityType {
        +TypeId string
        +DefaultProperties Dictionary~string,PropertyValue~
        +ParentTypeId string
        +DescriptionPatterns List~string~
        +ValidationRules List~ValidationRule~
        +CreateInstance(instanceId) Entity
    }
    
    class SyntaxEngine {
        <<Text Generation>>
        -patterns Dictionary~string,SyntaxPattern~
        -paraphrases Dictionary~string,List~string~~
        +ParseSyntax(template) SyntaxTree
        +GenerateText(syntaxTree, context) string
        +ExpandEntityReferences(text, entities) string
        +SelectParaphrase(key, usageHistory) string
    }
    
    class SyntaxPattern {
        +PatternId string
        +Template string
        +RequiredEntities List~string~
        +Conditions List~string~
        +Priority int
        +Parse(template) SyntaxTree
        +Validate(context) bool
    }
    
    class ReasoningEngine {
        <<Inference System>>
        -rules List~ReasoningRule~
        -knowledgeBase Dictionary~string,Knowledge~
        +DetectInconsistencies(entities) List~Inconsistency~
        +GenerateEventEntity(context) Entity
        +ValidateNarrative(entities, character) ValidationResult
        +InferMissingProperties(entity) List~PropertyValue~
    }
    
    class ReasoningRule {
        +RuleId string
        +Condition string
        +Consequence string
        +Priority float
        +Threshold float
        +Apply(entities) List~Entity~
        +Evaluate(context) bool
    }
    
    class NarrativeController {
        <<Unity Integration>>
        -entityManager EntityManager
        -syntaxEngine SyntaxEngine
        -reasoningEngine ReasoningEngine
        +StartNarrative(sceneId)
        +ProcessUserInput(input)
        +GenerateNextSegment() NarrativeSegment
        +HandleInconsistency(inconsistency)
    }
    
    class NarrativeSegment {
        +Text string
        +Speaker string
        +Choices List~Choice~
        +GeneratedEntities List~Entity~
        +Inconsistencies List~Inconsistency~
        +Metadata Dictionary~string,object~
    }

    %% Core relationships
    EntityManager --> Entity : manages
    EntityManager --> EntityType : uses templates
    Entity --> PropertyValue : contains
    EntityType --> PropertyValue : defines defaults
    
    %% Generation system
    SyntaxEngine --> SyntaxPattern : uses
    SyntaxEngine --> EntityManager : queries entities
    ReasoningEngine --> ReasoningRule : applies
    ReasoningEngine --> EntityManager : analyzes entities
    
    %% Main controller
    NarrativeController --> EntityManager : orchestrates
    NarrativeController --> SyntaxEngine : generates text
    NarrativeController --> ReasoningEngine : validates consistency
    NarrativeController --> NarrativeSegment : produces
```

## データフロー図

```mermaid
flowchart TD
    A[CSV Data Loading] --> B[EntityManager]
    B --> C[Entity Creation & Property Inheritance]
    C --> D[Syntax Engine]
    D --> E[Text Generation with Entity References]
    E --> F[Reasoning Engine]
    F --> G[Consistency Validation]
    G --> H[Dynamic Entity Generation]
    H --> I[Narrative Segment Output]
    
    %% Feedback loops
    I --> J[Usage History Recording]
    J --> B
    G --> K[Inconsistency Detection]
    K --> H
    
    %% User interaction
    L[User Input/Choices] --> M[Context Update]
    M --> C
```

## 階層的プロパティ継承システム

```mermaid
classDiagram
    class BaseFood {
        +weight: 0.1
        +edible: true
        +nutritional_value: "medium"
    }
    
    class MacBurger {
        +size: 0.3
        +brand: "McDonald's"
        +type: "burger"
        +weight: inherited(0.1)
    }
    
    class SpecificBurger {
        +owner: "誰々"
        +condition: "食べかけ"
        +weight: 0.12
        +size: inherited(0.3)
        +brand: inherited("McDonald's")
    }
    
    BaseFood <|-- MacBurger : inherits
    MacBurger <|-- SpecificBurger : inherits
    
    note for SpecificBurger "weight: 0.12 (overridden)\nsize: 0.3 (inherited)\nbrand: McDonald's (inherited)"
```

## 構文パターン処理例

```
入力: {scene description:[あなたは[LOCATION]に立っている。], {目の前には[OBJECT]がある。}}

処理フロー:
1. SyntaxEngine.ParseSyntax() → SyntaxTree生成
2. EntityManager.GetEntity("LOCATION") → Entity取得
3. EntityManager.GetEntity("OBJECT") → Entity取得
4. SyntaxEngine.ExpandEntityReferences() → 実体参照展開
5. SyntaxEngine.SelectParaphrase() → 使用履歴考慮の言い換え選択

出力: "あなたは古い図書館に立っている。目の前には埃をかぶった本がある。"
```

## 推論エンジンの動作例

```mermaid
sequenceDiagram
    participant RE as ReasoningEngine
    participant EM as EntityManager
    participant KB as KnowledgeBase
    
    RE->>EM: GetEntity("character_knowledge")
    EM->>RE: Character knowledge entity
    RE->>EM: GetEntity("current_object")
    EM->>RE: Object entity with properties
    RE->>KB: CompareProperties(char_knowledge, object)
    KB->>RE: Inconsistency detected
    RE->>EM: GenerateEventEntity("surprise_reaction")
    EM->>RE: New event entity created
```

## 主要な設計原則

### 1. 単一責任原則
- **EntityManager**: Entity生命周期管理
- **SyntaxEngine**: テキスト生成
- **ReasoningEngine**: 一貫性推論

### 2. 依存性逆転
- 全コンポーネントがインターフェース経由で通信
- Unity依存を最上位層に限定
- テスト可能な設計

### 3. 拡張性
- プラグイン可能な推論ルール
- 動的な構文パターン追加
- モジュラーなEntity型定義
