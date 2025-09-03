# 現在のアーキテクチャ問題 - UML図

## 現在の問題あるアーキテクチャ

```mermaid
classDiagram
    class GameManager {
        -UIManager m_UIManager
        -LogicEngine m_LogicEngine
        -DatabaseManager _databaseManager
        -WorldState _worldState
        +InitializeSystem()
        +StartNarrative()
        +HandleChoiceSelection()
        +HandleRetryRequested()
    }
    
    class LogicEngine {
        <<PROBLEM: MonoBehaviour依存除去済み>>
        -DatabaseManager m_DatabaseManager
        -WorldState m_WorldState
        +StartNarrative(eventId)
        +ExecuteEventByIndex(index)
        +ProcessChoices(choiceGroupId)
    }
    
    class DatabaseManager {
        <<PROBLEM: UnityEngine.Object非継承>>
        +Events List~Event~
        +Properties Dictionary
        +ChoiceGroups Dictionary
        +LoadAllData()
        +GetEventById(id)
    }
    
    class UIManager {
        +ShowText(speaker, text)
        +ShowChoices(choices)
        +ShowError(message, hint)
        +OnChoiceSelected Event
        +OnRetryRequested Event
    }
    
    class WorldState {
        -properties Dictionary
        +SetProperty(name, value)
        +GetProperty(name)
    }

    %% 問題のある関係性
    GameManager --> LogicEngine : ❌ new LogicEngine()
    GameManager --> DatabaseManager : ❌ FindObjectOfType()
    GameManager --> UIManager : SerializeField参照
    LogicEngine --> DatabaseManager : コンストラクタ注入
    LogicEngine --> WorldState : コンストラクタ注入
    
    %% Unity依存の問題
    note for LogicEngine "MonoBehaviour継承を除去したため\nシーン内GameObjectが無効化"
    note for DatabaseManager "UnityEngine.Object非継承のため\nFindObjectOfType使用不可"
    note for GameManager "Unity依存とピュアC#の\n不整合な混在"
```

## 主要な問題点

### 1. アーキテクチャ不整合
- **LogicEngine**: MonoBehaviour依存除去済み（テスト可能）
- **DatabaseManager**: Unity依存除去済み（テスト可能）  
- **GameManager**: Unity依存のまま（テスト不可）

### 2. 初期化フローの破綻
```mermaid
sequenceDiagram
    participant GM as GameManager
    participant DB as DatabaseManager
    participant LE as LogicEngine
    participant UI as UIManager
    
    GM->>DB: ❌ FindObjectOfType<DatabaseManager>()
    Note over GM,DB: エラー: UnityEngine.Object非継承
    GM->>DB: ❌ AddComponent<DatabaseManager>()
    Note over GM,DB: エラー: Component非継承
    GM->>LE: new LogicEngine(db, worldState)
    GM->>UI: SerializeField参照
```

### 3. シーン整合性の問題
- 既存シーン内のLogicEngine GameObjectが無効化
- MonoBehaviour → ピュアC#変更による参照切れ
- Inspector設定との不整合

## 技術的負債の蓄積

### A. 設計思想の混在
- **旧**: イベント駆動アプローチ
- **新**: Entity-Property システム（memo.txt）
- **現在**: 中途半端なリファクタリング状態

### B. 依存関係の混乱
- Unity依存コンポーネントとピュアC#クラスの混在
- テスト可能な部分と不可能な部分の分離不完全
- 初期化順序の複雑化

### C. 保守性の悪化
- 複数のアーキテクチャパターンの同居
- 責務分離の不明確化
- デバッグ困難性の増大
