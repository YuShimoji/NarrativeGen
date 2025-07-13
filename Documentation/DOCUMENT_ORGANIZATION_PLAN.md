# ドキュメント整理計画

## 📂 現在のドキュメント分類状況

### 現在プロジェクトルートに散在しているドキュメント
```
[現在の状況] - プロジェクトルート直下に13個のドキュメントが散在
├── NARRATIVE_SYSTEM_OVERVIEW.md        # 技術仕様書
├── REFACTORING_PROGRESS_LOG.md         # 開発履歴
├── NARRATIVE_DESIGN_GUIDE.md           # 設計ガイド
├── ARCHITECTURE_REFACTOR_PLAN.md       # アーキテクチャ計画
├── NARRATIVE_SYSTEM_ARCHITECTURE.md    # システム設計
├── NARRATIVE_WRITING_GUIDE.md          # ライティングガイド
├── NARRATIVE_DATA_GUIDE.md             # データガイド
├── ADVANCED_NARRATIVE_GUIDE.md         # 高度な機能ガイド
├── FUTURE_FEATURES.md                  # 将来機能
├── Project_NarrativeGen_Specification.md # 仕様書
├── NarrativeGen_ 論理エンジンと...md    # 初期仕様案
├── Novel Samples.txt                   # サンプルデータ
└── Novel Samples_new.txt              # 新サンプルデータ
```

---

## 🗂️ 整理後のドキュメント構造

### 提案する新しいディレクトリ構造
```
Documentation/
├── 01_Current_Status/                  # 現在の状況
│   ├── CURRENT_PROJECT_STATUS.md      # 現在のプロジェクト状況
│   └── IMPLEMENTATION_STATUS.md       # 実装状況詳細
├── 02_Technical_Specs/                 # 技術仕様
│   ├── NARRATIVE_SYSTEM_OVERVIEW.md   # システム概要
│   ├── NARRATIVE_SYSTEM_ARCHITECTURE.md # アーキテクチャ
│   └── COMMAND_REFERENCE.md           # コマンドリファレンス
├── 03_Development_History/             # 開発履歴
│   ├── REFACTORING_PROGRESS_LOG.md    # リファクタリング履歴
│   ├── DEVELOPMENT_CHANGELOG.md       # 開発変更履歴
│   └── ARCHITECTURE_REFACTOR_PLAN.md  # アーキテクチャ計画
├── 04_Design_Guides/                   # 設計ガイド
│   ├── NARRATIVE_DESIGN_GUIDE.md      # ナラティブ設計
│   ├── NARRATIVE_WRITING_GUIDE.md     # ライティングガイド
│   ├── NARRATIVE_DATA_GUIDE.md        # データ設計ガイド
│   └── ADVANCED_NARRATIVE_GUIDE.md    # 高度な機能ガイド
├── 05_Future_Plans/                    # 将来計画
│   ├── FUTURE_FEATURES.md             # 将来機能
│   ├── Project_NarrativeGen_Specification.md # 理想的仕様
│   └── ROADMAP.md                     # 開発ロードマップ
├── 06_Samples_and_References/          # サンプルと参考資料
│   ├── Novel_Samples.txt              # サンプルデータ
│   ├── Novel_Samples_new.txt          # 新サンプルデータ
│   └── REFERENCE_MATERIALS.md         # 参考資料
└── README.md                          # ドキュメント索引
```

---

## 🔄 ドキュメント移行作業

### Phase 1: 分類とディレクトリ作成
1. **ディレクトリ構造の作成**
   - Documentation/配下に6つのカテゴリディレクトリを作成

2. **既存ドキュメントの分類**
   - 現在の13個のドキュメントを適切なカテゴリに分類

### Phase 2: 内容の更新と整理
1. **現在状況の反映**
   - 実装状況に合わせて各ドキュメントを更新

2. **重複内容の整理**
   - 似たような内容のドキュメントを統合

### Phase 3: 新しいドキュメントの作成
1. **不足しているドキュメントの作成**
   - IMPLEMENTATION_STATUS.md
   - COMMAND_REFERENCE.md
   - DEVELOPMENT_CHANGELOG.md
   - ROADMAP.md

---

## 📋 各ドキュメントの役割定義

### 01_Current_Status/ - 現在の状況
| ファイル | 役割 | 更新頻度 |
|----------|------|----------|
| CURRENT_PROJECT_STATUS.md | プロジェクトの現在の状況 | 実装変更時 |
| IMPLEMENTATION_STATUS.md | 実装の詳細状況 | 機能追加時 |

### 02_Technical_Specs/ - 技術仕様
| ファイル | 役割 | 更新頻度 |
|----------|------|----------|
| NARRATIVE_SYSTEM_OVERVIEW.md | システム全体の技術概要 | アーキテクチャ変更時 |
| NARRATIVE_SYSTEM_ARCHITECTURE.md | 詳細な技術仕様 | 設計変更時 |
| COMMAND_REFERENCE.md | コマンドの詳細リファレンス | コマンド追加時 |

### 03_Development_History/ - 開発履歴
| ファイル | 役割 | 更新頻度 |
|----------|------|----------|
| REFACTORING_PROGRESS_LOG.md | リファクタリングの履歴 | アーカイブ |
| DEVELOPMENT_CHANGELOG.md | 開発変更の記録 | 変更時 |
| ARCHITECTURE_REFACTOR_PLAN.md | アーキテクチャ計画 | 計画変更時 |

### 04_Design_Guides/ - 設計ガイド
| ファイル | 役割 | 更新頻度 |
|----------|------|----------|
| NARRATIVE_DESIGN_GUIDE.md | ナラティブ設計の指針 | 設計方針変更時 |
| NARRATIVE_WRITING_GUIDE.md | ライティングのガイド | ライティング規則変更時 |
| NARRATIVE_DATA_GUIDE.md | データ設計のガイド | データ仕様変更時 |
| ADVANCED_NARRATIVE_GUIDE.md | 高度な機能のガイド | 高度機能追加時 |

### 05_Future_Plans/ - 将来計画
| ファイル | 役割 | 更新頻度 |
|----------|------|----------|
| FUTURE_FEATURES.md | 将来実装予定の機能 | 計画変更時 |
| Project_NarrativeGen_Specification.md | 理想的な仕様 | 長期目標変更時 |
| ROADMAP.md | 開発ロードマップ | 計画見直し時 |

### 06_Samples_and_References/ - サンプルと参考資料
| ファイル | 役割 | 更新頻度 |
|----------|------|----------|
| Novel_Samples.txt | サンプルデータ | サンプル追加時 |
| Novel_Samples_new.txt | 新サンプルデータ | サンプル追加時 |
| REFERENCE_MATERIALS.md | 参考資料リンク集 | 参考資料追加時 |

---

## 🎯 整理の原則

### 1. 内容の分離
- **現在** vs **将来**: 現在の実装状況と将来の計画を明確に分離
- **技術** vs **設計**: 技術仕様と設計ガイドを分離
- **開発履歴** vs **現在状況**: 過去の記録と現在の状況を分離

### 2. 更新頻度の明確化
- **高頻度更新**: 現在の状況、実装状況
- **中頻度更新**: 技術仕様、設計ガイド
- **低頻度更新**: 開発履歴、将来計画

### 3. 対象読者の明確化
- **開発者**: 技術仕様、実装状況
- **設計者**: 設計ガイド、ナラティブガイド
- **ステークホルダー**: 現在状況、将来計画

---

## 🚀 実行計画

### 即座に実行
1. **Documentation/ディレクトリ作成**
2. **既存ドキュメントの移動**
3. **README.mdの作成**

### 今後1週間以内
1. **重複内容の整理**
2. **実装状況の反映**
3. **新しいドキュメントの作成**

### 今後継続的に
1. **定期的な内容更新**
2. **実装変更との同期**
3. **ドキュメント品質の向上**

---

*作成日: 2025年1月5日*  
*ステータス: 整理計画策定完了 / 実行準備中* 