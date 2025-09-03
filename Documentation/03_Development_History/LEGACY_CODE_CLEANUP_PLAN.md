# 既存コードクリーンアップ計画

## クリーンアップ方針

新しいEntity-Propertyシステム実装に向けて、既存の問題あるコードを整理し、開発環境をクリーンな状態にします。

---

## Phase 1: 問題コードのバックアップ移動

### 1.1 バックアップフォルダ作成
```
Core_Backup/
├── Legacy_Scripts/          # 既存Scriptsのバックアップ
│   ├── Logic/
│   ├── Data/
│   └── Core/
├── Legacy_Scenes/           # 既存Scenesのバックアップ
└── Legacy_Tests/            # 既存Testsのバックアップ
```

### 1.2 移動対象ファイル

**Unity Scripts (Assets/Scripts/)**:
- `Logic/LogicEngine.cs` → `Core_Backup/Legacy_Scripts/Logic/`
- `Data/DatabaseManager.cs` → `Core_Backup/Legacy_Scripts/Data/`
- `Data/SimpleCsvReader.cs` → `Core_Backup/Legacy_Scripts/Data/`
- `Core/GameManager.cs` → `Core_Backup/Legacy_Scripts/Core/`

**Unity Scenes (Assets/Scenes/)**:
- `DemoScene.unity` → `Core_Backup/Legacy_Scenes/`
- `New Scene.unity` → `Core_Backup/Legacy_Scenes/`

**Test Projects**:
- `NarrativeGen.Core.Tests/` → `Core_Backup/Legacy_Tests/`

### 1.3 プロジェクトファイル整理
- `NarrativeGen.Core.csproj` → 削除（新規作成）
- `NarrativeGen.Console.csproj` → 削除（不要）
- `Program.cs` → 削除（不要）

---

## Phase 2: 新フォルダ構造作成

### 2.1 Core システム構造
```
Assets/Scripts/
├── Core/                    # Entity-Property システム
│   ├── Entities/
│   │   ├── Entity.cs
│   │   ├── EntityType.cs
│   │   ├── PropertyValue.cs
│   │   └── EntityManager.cs
│   ├── Properties/
│   │   ├── PropertyTypes/
│   │   └── ValidationRules/
│   └── Interfaces/
│       ├── IEntity.cs
│       ├── IEntityManager.cs
│       └── IPropertyValue.cs
```

### 2.2 Generation システム構造
```
Assets/Scripts/
├── Generation/              # テキスト生成システム
│   ├── Syntax/
│   │   ├── SyntaxEngine.cs
│   │   ├── SyntaxPattern.cs
│   │   └── SyntaxTree.cs
│   ├── Reasoning/
│   │   ├── ReasoningEngine.cs
│   │   ├── ReasoningRule.cs
│   │   └── InconsistencyDetector.cs
│   └── Paraphrases/
│       ├── ParaphraseManager.cs
│       └── UsageTracker.cs
```

### 2.3 Unity統合層構造
```
Assets/Scripts/
├── Unity/                   # Unity統合層
│   ├── Controllers/
│   │   ├── NarrativeController.cs
│   │   └── UIController.cs
│   ├── Components/
│   │   ├── EntityDisplay.cs
│   │   └── DebugPanel.cs
│   └── ScriptableObjects/
│       ├── EntityTypeDefinition.cs
│       └── SyntaxPatternCollection.cs
```

### 2.4 データ・テスト構造
```
Assets/
├── Data/                    # CSVデータ
│   ├── Entities/
│   ├── EntityTypes/
│   ├── SyntaxPatterns/
│   └── ReasoningRules/
└── Tests/                   # 統合テスト用
    ├── Runtime/
    └── Editor/

Tests/                       # 単体テスト（プロジェクト外）
├── NarrativeGen.Core.Tests/
├── NarrativeGen.Generation.Tests/
└── NarrativeGen.Integration.Tests/
```

---

## Phase 3: プロジェクト設定クリーンアップ

### 3.1 Unity プロジェクト設定
- **Assembly Definition Files**: 新しいモジュール構造に対応
- **Scene Settings**: 無効なGameObject参照の削除
- **Prefab References**: 破損した参照の修正

### 3.2 .NET プロジェクト再構築
```
NarrativeGen.Core/           # コアロジック（Unity非依存）
├── Entities/
├── Generation/
└── Reasoning/

NarrativeGen.Unity/          # Unity統合層
├── Controllers/
├── Components/
└── ScriptableObjects/

NarrativeGen.Tests/          # 統合テスト
├── Core.Tests/
├── Generation.Tests/
└── Unity.Tests/
```

### 3.3 依存関係整理
- **Core**: Unity非依存、純粋.NET
- **Unity**: Coreに依存、UnityEngine使用可
- **Tests**: 各層に対応したテスト構造

---

## Phase 4: Git履歴とブランチ整理

### 4.1 ブランチ戦略
```
main                         # 安定版
├── feature/entity-system    # 新システム開発
├── legacy/backup           # 既存コード保存
└── docs/architecture       # ドキュメント更新
```

### 4.2 コミット戦略
1. **バックアップコミット**: 既存コード移動
2. **クリーンアップコミット**: 不要ファイル削除
3. **構造作成コミット**: 新フォルダ構造
4. **初期実装コミット**: 基盤クラス実装開始

---

## 実行手順

### Step 1: バックアップ作成
```bash
# バックアップフォルダ作成
mkdir -p "Core_Backup/Legacy_Scripts/Logic"
mkdir -p "Core_Backup/Legacy_Scripts/Data" 
mkdir -p "Core_Backup/Legacy_Scripts/Core"
mkdir -p "Core_Backup/Legacy_Scenes"
mkdir -p "Core_Backup/Legacy_Tests"

# ファイル移動
mv "Assets/Scripts/Logic/LogicEngine.cs" "Core_Backup/Legacy_Scripts/Logic/"
mv "Assets/Scripts/Data/DatabaseManager.cs" "Core_Backup/Legacy_Scripts/Data/"
mv "Assets/Scripts/Data/SimpleCsvReader.cs" "Core_Backup/Legacy_Scripts/Data/"
mv "Assets/Scripts/Core/GameManager.cs" "Core_Backup/Legacy_Scripts/Core/"
```

### Step 2: 新構造作成
```bash
# 新フォルダ構造作成
mkdir -p "Assets/Scripts/Core/Entities"
mkdir -p "Assets/Scripts/Core/Properties"
mkdir -p "Assets/Scripts/Core/Interfaces"
mkdir -p "Assets/Scripts/Generation/Syntax"
mkdir -p "Assets/Scripts/Generation/Reasoning"
mkdir -p "Assets/Scripts/Unity/Controllers"
```

### Step 3: プロジェクトファイル削除
```bash
# 不要なプロジェクトファイル削除
rm "NarrativeGen.Core.csproj"
rm "NarrativeGen.Console.csproj"
rm "Program.cs"
rm -rf "NarrativeGen.Core.Tests"
```

### Step 4: Git コミット
```bash
git add .
git commit -m "🧹 Legacy code cleanup: Move existing code to backup, create new folder structure"
git push origin feature/entity-system
```

---

## 検証チェックリスト

### バックアップ検証
- [ ] 全ての既存コードがバックアップフォルダに移動済み
- [ ] 移動したファイルが正常に読み取り可能
- [ ] Git履歴が保持されている

### 構造検証  
- [ ] 新フォルダ構造が計画通りに作成済み
- [ ] 各フォルダが適切な権限設定
- [ ] Unity プロジェクトが正常に開ける

### 環境検証
- [ ] Unity エディタでエラーが発生しない
- [ ] 不要な参照エラーが解消済み
- [ ] ビルド設定が正常

---

## リスク軽減策

### データ損失防止
- 作業前の完全バックアップ作成
- Git コミット前の動作確認
- 段階的な移行（一度に全て変更しない）

### 復旧手順
1. **緊急時**: `git reset --hard HEAD~1` で前状態に復旧
2. **部分復旧**: バックアップフォルダから個別ファイル復元
3. **完全復旧**: `legacy/backup` ブランチから全体復元

---

## 完了基準

### Phase 1 完了基準
- [ ] 全既存コードのバックアップ完了
- [ ] 元フォルダからの完全削除
- [ ] バックアップの動作確認

### Phase 2 完了基準
- [ ] 新フォルダ構造の完全作成
- [ ] 適切な命名規則の適用
- [ ] ドキュメント更新

### Phase 3 完了基準
- [ ] Unity プロジェクト設定の最適化
- [ ] 不要な参照の完全削除
- [ ] ビルド環境の正常化

### Phase 4 完了基準
- [ ] Git履歴の整理完了
- [ ] ブランチ戦略の確立
- [ ] チーム共有準備完了
