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


---

## 2025-10-07 追記: モダンアーキテクチャ移行の実施内容と検証結果

### 実施した主な変更
- Clean Architecture への移行: `src/` 配下に Domain / Application / Infrastructure を集約。
  - Domain: `Entity`, `EntityType`, `PropertyValue`, `PropertySource`
  - Domain Services: `EntityInheritanceService`
  - Application: `EntityUseCase`
  - Infrastructure: `CsvEntityRepository`, `CsvEntityTypeRepository`
- CSV互換性の強化:
  - `Entities.csv` のヘッダ互換: `Id|entity_id`, `TypeId|entity_type_id`
  - `EntityTypes.csv` のヘッダ互換: `Id|type_id`, `Name|type_name`, `ParentTypeId|parent_type_id`
  - 実装箇所: `src/Infrastructure/Repositories/CsvEntityRepository.cs`, `CsvEntityTypeRepository.cs`
- 統合テストの整備:
  - `TestRunner.csproj` を Clean Architecture 構成に合わせて更新
  - CSV ロードとサンプルEntity確認（`mac_burger_001`）の実行
- ユニットテスト（xUnit）:
  - プロジェクト: `tests/NarrativeGen.Domain.Tests`
  - テスト: `EntityInheritanceService` の継承・上書き動作の検証
- CI の追加:
  - `.github/workflows/dotnet-ci.yml` を追加（ビルド/テスト実行）

### 実行したテストと結果
- .NET 実行
  - `dotnet run --project TestRunner.csproj -nologo`
  - 期待どおり CSV 読込が成功し、`mac_burger_001` が検出されることを確認
- ドメイン単体テスト
  - `dotnet test tests/NarrativeGen.Domain.Tests -nologo`
  - 継承値（Inherited）と直接設定（Direct）の優先関係が仕様通りであることを確認

### 既知の注意点 / リスク
- 既存ドキュメント（README等）に旧構成の断片が残存していたため、順次整合を実施
- Unity 側の参照は Adapter 経由（`Assets/Scripts/Unity/NarrativeController.cs`）に更新済み。パス/インポートの再確認が必要

### 今後の計画（抜粋）
- Application 層のユースケース拡充（検索/フィルタ/集約）
- 推論ルール/言い換え仕様の確定・最小実装
- CI にコード品質チェック（lint/format）とカバレッジ計測の追加
