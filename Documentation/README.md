# NarrativeGen Documentation

## 📋 ドキュメント概要

NarrativeGenプロジェクトの包括的ドキュメントコレクションです。設計思想から実装詳細、開発プロセスまでを網羅しています。

## 🗂️ ドキュメント構成

### 📊 01_Current_Status - プロジェクト現状
- [CURRENT_PROJECT_STATUS.md](01_Current_Status/CURRENT_PROJECT_STATUS.md) - プロジェクト全体の現在の状況
- [PROJECT_STATUS_V5.md](01_Current_Status/PROJECT_STATUS_V5.md) - 最新のステータス詳細

### 🔧 02_Technical_Specs - 技術仕様
- [DEVELOPMENT_STRATEGY.md](02_Technical_Specs/DEVELOPMENT_STRATEGY.md) - **🆕 Web/Unity開発戦略** ⭐
- [NARRATIVE_SYSTEM_ARCHITECTURE.md](02_Technical_Specs/NARRATIVE_SYSTEM_ARCHITECTURE.md) - システムアーキテクチャ
- [NARRATIVE_SYSTEM_OVERVIEW.md](02_Technical_Specs/NARRATIVE_SYSTEM_OVERVIEW.md) - システム全体概要
- [SYNTAX_ENGINE_SPECIFICATION.md](02_Technical_Specs/SYNTAX_ENGINE_SPECIFICATION.md) - 構文エンジン仕様

### 📈 03_Development_History - 開発履歴・プロセス
- [DEVELOPMENT_WORKFLOW_GUIDE.md](03_Development_History/DEVELOPMENT_WORKFLOW_GUIDE.md) - **🆕 実践的ワークフローガイド** ⭐
- [ARCHITECTURE_REFACTOR_PLAN.md](03_Development_History/ARCHITECTURE_REFACTOR_PLAN.md) - アーキテクチャリファクタリング計画
- [REFACTORING_PROGRESS_LOG.md](03_Development_History/REFACTORING_PROGRESS_LOG.md) - リファクタリング進捗

### 📖 04_Design_Guides - 設計・執筆ガイド
- [NARRATIVE_DESIGN_GUIDE.md](04_Design_Guides/NARRATIVE_DESIGN_GUIDE.md) - ナラティブデザインガイド
- [NARRATIVE_WRITING_GUIDE.md](04_Design_Guides/NARRATIVE_WRITING_GUIDE.md) - 執筆ガイド
- [NARRATIVE_DATA_GUIDE.md](04_Design_Guides/NARRATIVE_DATA_GUIDE.md) - データ設計ガイド
- [ADVANCED_NARRATIVE_GUIDE.md](04_Design_Guides/ADVANCED_NARRATIVE_GUIDE.md) - 高度なナラティブ技法

### 🔮 05_Future_Plans - 将来計画
- [FUTURE_FEATURES.md](05_Future_Plans/FUTURE_FEATURES.md) - 将来機能計画
- [Project_NarrativeGen_Specification.md](05_Future_Plans/Project_NarrativeGen_Specification.md) - プロジェクト仕様

### 📚 06_Samples_and_References - サンプル・参考資料
- [CSV_IMPLEMENTATION_GUIDE.md](06_Samples_and_References/CSV_IMPLEMENTATION_GUIDE.md) - CSV実装ガイド
- [CSV_SAMPLE_STRUCTURES.md](06_Samples_and_References/CSV_SAMPLE_STRUCTURES.md) - CSVサンプル構造
- [COMPREHENSIVE_SAMPLES_COLLECTION.md](06_Samples_and_References/COMPREHENSIVE_SAMPLES_COLLECTION.md) - 包括的サンプル集
- [MASSIVE_RECURSIVE_DICTIONARY_SAMPLES.md](06_Samples_and_References/MASSIVE_RECURSIVE_DICTIONARY_SAMPLES.md) - 再帰辞書サンプル

## 🚀 クイックスタート

### 新規開発者向け読書順序

#### **Step 1: プロジェクト理解**
1. [01_CORE_DESIGN_PHILOSOPHY.md](01_CORE_DESIGN_PHILOSOPHY.md) - 設計思想の理解 ⭐
2. [memo.txt](memo.txt) - 基本コンセプト ⭐
3. [構文メモ.txt](構文メモ.txt) - 構文仕様 ⭐

#### **Step 2: 開発環境セットアップ**
1. [DEVELOPMENT_STRATEGY.md](02_Technical_Specs/DEVELOPMENT_STRATEGY.md) - 開発戦略理解 ⭐
2. [DEVELOPMENT_WORKFLOW_GUIDE.md](03_Development_History/DEVELOPMENT_WORKFLOW_GUIDE.md) - 具体的手順 ⭐

#### **Step 3: 技術詳細習得**
1. [NARRATIVE_SYSTEM_ARCHITECTURE.md](02_Technical_Specs/NARRATIVE_SYSTEM_ARCHITECTURE.md) - アーキテクチャ
2. [SYNTAX_ENGINE_SPECIFICATION.md](02_Technical_Specs/SYNTAX_ENGINE_SPECIFICATION.md) - エンジン仕様

#### **Step 4: 実践開発**
1. [CSV_IMPLEMENTATION_GUIDE.md](06_Samples_and_References/CSV_IMPLEMENTATION_GUIDE.md) - データ設計
2. [COMPREHENSIVE_SAMPLES_COLLECTION.md](06_Samples_and_References/COMPREHENSIVE_SAMPLES_COLLECTION.md) - サンプル参照

## 💡 開発者向けチートシート

### 🌐 Web環境（Cursor Web）での作業
```bash
# 基本フロー
git checkout -b feature/[機能名]
dotnet run
> start
> process "[テスト文章]"
> stats
git add . && git commit -m "feat: [説明]"
```

### 🎮 Unity環境での作業  
```bash
# 統合フロー
git pull origin master
# Unity でコンパイル確認
# Android テスト実行
git add Assets/Scripts/ && git commit -m "unity: [説明]"
```

### 🔍 よく使うテストコマンド
```bash
# Web環境テスト
dotnet run
> start
> process "[そこに置いてある][傘]は[壊れ]ている。"
> test entity cheeseburger
> set weight_kg 0.12
> stats
```

## 📋 開発チェックリスト

### ✅ Web環境チェックリスト
- [ ] `dotnet build` が成功する
- [ ] Console テストが全てパスする
- [ ] 新機能の動作確認完了
- [ ] CSV データの整合性確認
- [ ] パフォーマンス測定完了
- [ ] Git コミット・プッシュ完了

### ✅ Unity環境チェックリスト
- [ ] コンパイルエラーなし
- [ ] シーン再生が正常動作
- [ ] Android ビルドが成功
- [ ] メモリ・FPS測定完了
- [ ] UI/UX動作確認完了
- [ ] Git コミット・プッシュ完了

## 🎯 ドキュメント活用Tips

### 📖 効率的な読み方
1. **目的別読書**: 開発タスクに応じて必要な章のみ読む
2. **実践優先**: ワークフローガイドを見ながら実際に作業
3. **サンプル活用**: 不明点はサンプルコードで確認
4. **定期見直し**: 月1回はドキュメント全体を見直し

### 🔄 ドキュメント更新
1. **変更時更新**: コード変更時は関連ドキュメントも更新
2. **発見時追記**: 新しい知見は即座にドキュメントに追記
3. **定期整理**: 週1回はドキュメントの整理・統合を実施

## 🤝 コントリビューション

### ドキュメント改善への参加
1. **誤字・脱字**: 発見次第修正
2. **内容追加**: 新しい知見や手順の追記
3. **構成改善**: より分かりやすい構成への提案
4. **サンプル追加**: 実践的なサンプルコードの追加

---

**最終更新**: 2024/07/13
**バージョン**: v2.0 - Web/Unity開発戦略統合版 