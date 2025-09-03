# Phase 2: 構文解析エンジン設計仕様

## 概要

Phase 1で完成したEntity-Propertyシステムを基盤として、構文解析エンジンとテキスト生成システムを実装します。

## 設計目標

### 1. 構文パターン管理
- **SyntaxPattern**: テンプレートベースの文生成
- **Paraphrase**: 表現のバリエーション管理
- **Context-aware**: エンティティプロパティに基づく動的生成

### 2. テキスト生成エンジン
- **Template Engine**: プレースホルダー置換システム
- **Natural Language**: 自然な日本語文生成
- **Conditional Logic**: 条件分岐による表現選択

## データ構造設計

### SyntaxPattern
```csharp
public class SyntaxPattern
{
    public string PatternId { get; set; }
    public string Category { get; set; }
    public string Template { get; set; }
    public List<string> RequiredProperties { get; set; }
    public Dictionary<string, string> Conditions { get; set; }
    public int Priority { get; set; }
}
```

### Paraphrase
```csharp
public class Paraphrase
{
    public string ParaphraseId { get; set; }
    public string OriginalText { get; set; }
    public List<string> Variations { get; set; }
    public string Context { get; set; }
    public float Frequency { get; set; }
}
```

### TextGenerator
```csharp
public class TextGenerator
{
    public string GenerateDescription(Entity entity);
    public string GenerateNarrative(List<Entity> entities, string context);
    public List<string> GenerateChoices(Entity entity, string situation);
}
```

## CSV データ構造

### SyntaxPatterns.csv
```csv
pattern_id,category,template,required_properties,conditions,priority
food_desc_basic,food_description,"{name}は{taste}い{food_type}です。",name;taste;food_type,,1
location_desc_basic,location_description,"{name}は{atmosphere}な{location_type}です。",name;atmosphere;location_type,,1
```

### Paraphrases.csv
```csv
paraphrase_id,original_text,variations,context,frequency
taste_delicious,美味しい,おいしい;うまい;絶品の,food_description,0.8
atmosphere_quiet,静かな,落ち着いた;穏やかな;平和な,location_description,0.6
```

## 実装計画

### Phase 2.1: 基本構文エンジン
1. **SyntaxPattern クラス実装**
2. **Paraphrase クラス実装**
3. **CSV読み込み機能**
4. **基本テンプレート置換**

### Phase 2.2: テキスト生成エンジン
1. **TextGenerator クラス実装**
2. **条件分岐ロジック**
3. **プロパティ値の動的挿入**
4. **表現バリエーション選択**

### Phase 2.3: 高度な機能
1. **文脈考慮型生成**
2. **複数エンティティの関係性表現**
3. **選択肢生成システム**
4. **自然言語最適化**

## テスト戦略

### 単体テスト
- SyntaxPattern の解析テスト
- Paraphrase のバリエーション選択テスト
- TextGenerator の基本生成テスト

### 統合テスト
- Entity-Property システムとの連携テスト
- CSV データの完全読み込みテスト
- 複雑なシナリオでの生成テスト

### 品質保証
- 生成テキストの自然性評価
- パフォーマンステスト
- エラーハンドリングテスト

## 期待される成果

1. **動的テキスト生成**: エンティティプロパティに基づく自然な文章生成
2. **表現の多様性**: Paraphraseシステムによる豊富なバリエーション
3. **拡張性**: 新しいパターンやバリエーションの簡単な追加
4. **保守性**: テンプレートとロジックの分離による管理の容易さ

## 次のマイルストーン

Phase 2完了により、以下が実現されます：
- memo.txtの「Mac Burger」シナリオの完全な文章生成
- 動的な選択肢生成
- 文脈に応じた表現選択
- Phase 3（推論エンジン）への基盤構築
