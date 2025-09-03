# 既存実装分析レポート

## memo.txtから読み取る核心要件

### 1. Entity-Propertyシステムの本質
```
Entity: プロパティを持つ基本単位
├── 既定値（デフォルト値）
├── 設定値（オーバーライド値）
├── 範囲制約（2~4、±3%など）
└── メタデータ（ラベルなど）
```

**重要な設計思想**:
- 「既定値」設定による設定漏れ防止
- 階層的継承（携帯食料 → マックのチーズバーガー → 具体的インスタンス）
- プロパティの上書き機能

### 2. 構文生成エンジンの要件
```
構造: 章 > 節 > 段落 > 文章 > 文 > 単語
置換システム: [LOCATION], [OBJECT], [sound], [direction]
言い換えシステム: 同一意味の複数表現
```

**実装すべき機能**:
- テンプレートベースの文生成
- コンテキスト考慮の表現選択
- 使用頻度追跡による重複回避

### 3. 推論エンジンの要件
```
認識システム: キャラクターの知識と誤差範囲
事象記録: 全ての出来事をEntityとして記録
文脈生成: 過去の事象を参照した会話生成
```

## 既存実装の評価

### 保持すべき要素
1. **CSVデータ構造**: EntityTypes.csv, Entities.csv, Properties.csv
2. **階層的継承概念**: EntityTypeの親子関係
3. **プロパティシステム**: PropertyValueクラスの基本設計
4. **テストデータ**: "mac_burger_001"などのサンプル

### 問題のある要素
1. **アーキテクチャ**: Unity依存とCore分離が不完全
2. **複雑性**: 過度に複雑な実装（memo.txtの要件に対して）
3. **テスト性**: 統合テストが困難
4. **拡張性**: 新機能追加時の影響範囲が大きい

## 新アーキテクチャ設計方針

### Clean Architecture適用
```
Domain Layer (Core Business Logic)
├── Entity: 基本的なデータ構造
├── ValueObject: プロパティ値
├── DomainService: ビジネスルール
└── Repository Interface: データアクセス抽象化

Application Layer (Use Cases)
├── NarrativeUseCase: ストーリー生成
├── EntityUseCase: Entity管理
└── TextGenerationUseCase: テキスト生成

Infrastructure Layer (External Concerns)
├── CsvRepository: CSV読み込み
├── UnityAdapter: Unity統合
└── Configuration: 設定管理
```

### シンプル実装の優先順位
1. **最小Domain Model**: Entity, Property, EntityType
2. **基本Repository**: CSV読み込み機能
3. **シンプルUseCase**: Entity取得・検索
4. **基本テスト**: 単体テスト環境

## 次のステップ

### TASK-002: Clean Architecture基盤設計
- Domain層のインターフェース定義
- Repository パターンの適用
- Dependency Injection設計

### TASK-003: 最小Domain実装
- Entityクラス（シンプル版）
- PropertyValueクラス（シンプル版）
- EntityTypeクラス（シンプル版）

memo.txtの要件を満たす最小実装から開始し、段階的に機能を追加していく方針で進めます。
