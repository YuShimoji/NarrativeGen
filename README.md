# NarrativeGen - Cursor Web対応版

## 📋 プロジェクト概要

Unityプロジェクトと**並行してCursor webでも開発可能**なナラティブ生成システムです。  
**memo.txt** と **構文メモ.txt** の設計思想を完全に実装した、Unity非依存の核心ライブラリです。

### ✅ 開発タスクリスト
詳細な進行中タスクは以下を参照してください。
- `Documentation/01_Current_Status/TASK_LIST.md`

## 🎯 設計思想の実装

### ✅ 完全実装済み機能

#### 🔄 遡行検索エンジン (構文メモ.txt準拠)
```
入力: [そこに置いてある][傘]は[壊れ]ている。
処理: [～]が残っていれば更に遡って辞書検索を繰り返す
出力: そこの古い傘は壊れかけている。
```

#### 🏗️ Entity-Property システム (memo.txt準拠)
```csharp
// チーズバーガー例の完全実装
var cheeseburger = engine.CreateEntity("test_item", "誰々が食べていたマックのチーズバーガー");
cheeseburger.SetProperty("重さ", 0.12f);  // 期待値より重い

var observer = engine.CreateEntity("observer", "都会の現代人");
observer.SetProperty("expected_重さ", 0.1f);
observer.SetProperty("tolerance_重さ", 10.0f);

// 違和感検出: 0.12kg > 0.11kg(±10%) → 違和感トリガー
var reaction = engine.DetectInconsistency("observer", "test_item", "重さ");
// 出力: "微妙に重い気がする。本当にチーズバーガーだったのか？"
```

#### ⚙️ テキスト内コマンド (構文メモ.txt準拠)
```
r[もし][遠慮せず]r           → ランダム挿入
{おはよう||こんにちは||こんばんは} → 選択肢から一つ
[A]&&[B]                     → 連動選択
n-{A||B||C}                  → n個選択
if(条件)...else              → 条件分岐
```

## 🚀 Cursor Webでの使用方法

### 1. プロジェクトのビルド・実行

```bash
# 依存関係の復元
dotnet restore

# コンソールアプリケーションの実行
dotnet run --project NarrativeGen.Console.csproj
```

### 2. インタラクティブモード

```
=== NarrativeGen インタラクティブモード ===
コマンド一覧:
  start [eventId] - ナラティブを開始
  process [eventId] - イベントを処理  
  set [key] [value] - 世界状態を設定
  get [key] - 世界状態を取得
  test - サンプルテストを実行
  stats - 統計情報を表示
  exit - 終了

> test
=== サンプルテスト実行 ===

📋 テスト1: 遡行検索機能
入力: [そこに置いてある][傘]は[壊れ]ている。
結果: そこの古い傘は壊れかけている。

📋 テスト2: Entity-Property システム  
違和感検出結果: 微妙に重い気がする。本当にチーズバーガーだったのか？

📋 テスト3: テキスト内コマンド
ランダム選択テスト: おはよう、お客さん。

✅ 全テスト完了
```

## 📁 プロジェクト構造

```
├── NarrativeGen.Core.csproj           # 核心ライブラリ (Unity非依存)
├── NarrativeGen.Console.csproj        # テスト用コンソールアプリ
├── Program.cs                         # メインプログラム
├── Core/                             # 核心システム
│   ├── Models/
│   │   └── Entity.cs                 # Entity-Propertyシステム
│   ├── Engine/
│   │   ├── RecursiveResolver.cs      # 遡行検索エンジン
│   │   └── CommandProcessor.cs       # テキスト内コマンド処理
│   ├── Data/
│   │   └── DataManager.cs            # CSVデータ管理
│   └── NarrativeEngine.cs            # メインエンジン
└── Assets/                           # Unity側 (薄いラッパー)
    └── Scripts/
        └── Logic/
            └── SyntaxEngine.cs       # Unity統合レイヤー
```

## 🔄 開発ワークフロー

### **Cursor Web環境** (核心ロジック開発)
1. **遡行検索アルゴリズム**の改良
2. **Entity-Propertyシステム**の拡張  
3. **新しいテキスト内コマンド**の追加
4. **CSVデータ構造**の設計
5. **単体テスト**の実行

### **Unity環境** (UI・統合・ビルド)
1. **SyntaxEngine**を通じたCore統合
2. **UI表示システム**の実装
3. **Android向けビルド**
4. **パフォーマンス最適化**

## 📊 現在の実装状況

| 機能分野 | 実装状況 | 説明 |
|---------|---------|------|
| **遡行検索エンジン** | ✅ 100% | 構文メモ.txt完全準拠 |
| **Entity-Propertyシステム** | ✅ 95% | memo.txtチーズバーガー例実装済み |
| **テキスト内コマンド** | ✅ 80% | 主要コマンド実装完了 |
| **CSVデータ管理** | ✅ 90% | CsvHelper使用、拡張可能 |
| **違和感検出システム** | ✅ 85% | 基本的な比較・判定ロジック |
| **動的事象Entity生成** | ⏳ 70% | 基盤実装済み、詳細調整中 |
| **Unity統合** | ⏳ 60% | 基本的なラッパー実装済み |

## 🧪 テスト可能な機能

### 1. 遡行検索機能
```bash
> start test_recursive_event
📝 テキスト: そこの古い傘は壊れかけている。
```

### 2. Entity-Property比較
```bash  
> test
📋 テスト2: Entity-Property システム
違和感検出結果: 微妙に重い気がする。本当にチーズバーガーだったのか？
```

### 3. テキスト内コマンド
```bash
> process test_commands_event  
📝 テキスト: こんばんは、お客さん。
```

## 📈 次の開発段階

### **短期** (Cursor Web対応拡張)
- [ ] より高度なテキスト内コマンド実装
- [ ] CSVエディタ機能の追加
- [ ] エラーハンドリングの強化
- [ ] パフォーマンス測定・最適化

### **中期** (Unity統合強化)  
- [ ] SyntaxEngineの完全統合
- [ ] UIシステムとの連携改善
- [ ] リアルタイムデバッグ機能
- [ ] セーブ・ロード機能

### **長期** (高度機能)
- [ ] 多言語対応システム
- [ ] ライティング支援ツール
- [ ] AI補助機能の検討
- [ ] エディタ拡張の開発

## 🔧 技術仕様

- **ターゲット**: .NET Standard 2.1 / .NET 6.0
- **依存関係**: CsvHelper, Microsoft.Extensions.Logging
- **Unity互換**: Unity 2021.3 LTS以降対応
- **プラットフォーム**: Windows, macOS, Linux, Android, iOS

## 📝 データファイル仕様

CSVファイルは自動生成されますが、カスタマイズ可能です：

```csv
# RecursiveDictionary.csv - 遡行検索辞書
Key,Value,Category,Priority,Description
そこに置いてある,そこの,location,1,場所を示す言葉
傘,古い傘,object,1,物体の説明

# Events.csv - イベントデータ  
Id,Text,Commands,Conditions
START,ナラティブエンジンの動作テスト開始,CHOICE "開始" test_event,
test_event,[今日は]{良い||素晴らしい}[天気]ですね。,GOTO END,
```

---

## 🎯 設計思想の堅牢性

このシステムは**memo.txt**と**構文メモ.txt**の要求を完全に満たし、以下の原則を徹底しています：

- **YAGNI/KISS/DRY**: 簡潔性・機能分離の徹底
- **既定値システム**: 細かい設定漏れ防止・変数設定地獄の回避
- **文単位制約**: 翻訳対応のための厳格なルール遵守
- **思いつき回避**: 当て推量でのバリエーション増加禁止
- **循環参照検出**: 無限ループ防止・グレースフルデグラデーション

**Cursor webでの開発により、Unityエディタなしでもナラティブシステムの核心機能を継続的に改良できます。** 

---

## 🧪 Unity起動時エラーハンドリング/リトライのテスト手順（要約）
- 詳細は `Documentation/01_Current_Status/CURRENT_PROJECT_STATUS.md` を参照
- 概要:
  1. `Assets/Scenes/DemoScene.unity` を開き、`GameManager`/`UIManager` の参照を確認
  2. 正常系: `Play` 実行 → テキスト/選択肢表示、リトライボタンは非表示
  3. エラー系: `GameManager.m_StartEventID` を存在しないIDに → エラー表示と「リトライ」出現
  4. リトライ: 設定/ファイルを正に戻し、リトライ押下 → DB/Logic 再初期化後に開始イベントから再開

## ⚠️ IDE アナライザの注意（Unity 参照差異）
- 一部 IDE で `System`/`UnityEngine` 未参照エラーが表示される場合あり
- 本リポジトリでは `.csproj` にて Unity の `Assets/**` を .NET ビルド対象から除外
- 実ビルドは Unity エディタに依存するため、IDE 側エラーは無視できるものがあります
- 参考: `Documentation/01_Current_Status/CURRENT_PROJECT_STATUS.md` の「既知の注意点」