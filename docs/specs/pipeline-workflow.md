# SP-PIPE-001: Designer Pipeline Workflow

**ステータス**: partial (70%)
**作成日**: 2026-03-23
**カテゴリ**: system

---

## 目的

NarrativeGen を使ってストーリーを完成させるまでのエンドツーエンドワークフローを定義する。
「誰が」「何を」「どの順序で」「どのツールで」行うかを明確にし、手動介入と自動化の境界を引く。

---

## 対象ペルソナ

> **運用実態**: 1人で全ステージを担当する。以下の3分類は設計上の関心分離であり、「帽子の切替」として理解する。

### P1: ライター (Writer)
- 物語の構造・テキスト・分岐を設計する主作業者
- プログラミング知識は不要
- Web Tester GUI を主に使用

### P2: テクニカルデザイナー (Technical Designer)
- 条件・効果・推論・エンティティの設計を担当
- JSON 直接編集も可能
- エンジンAPIの知識がある

### P3: インテグレーター (Integrator)
- NarrativeGen モデルを Unity / 他のランタイムに統合する担当
- C# SDK / エクスポートフォーマットを使用

---

## Pipeline 全体像

```
[Stage 1]       [Stage 2]        [Stage 3]       [Stage 4]        [Stage 5]
 構想・設計  →  コンテンツ制作  →  検証・調整  →  エクスポート  →  ランタイム統合
 (Design)      (Author)          (Validate)      (Export)         (Integrate)
```

### Stage 1: 構想・設計 (Design)

**担当**: P1 (ライター) + P2 (テクニカルデザイナー)
**ツール**: テキストエディタ / ホワイトボード / NarrativeGen Web Tester (NodeGraph タブ)
**手動介入**: 100% (創造的作業)

| 作業 | 入力 | 出力 | 自動化可能性 |
|------|------|------|-------------|
| ストーリー構造設計 (ビート表) | アイデア | ノード構成案 | 低 (AI 支援候補) |
| 世界設定定義 | 設定メモ | Entity 定義 | 低 |
| キャラクター設計 | キャラ設定 | CharacterDef + KnowledgeProfile | 低 |
| 分岐ロジック設計 | ストーリー構造 | 条件/効果の設計 | 中 (推論エンジンで検証可) |
| テンプレート設計 | 会話パターン | ConversationTemplate 定義 | 低 |

**この段階の成果物**: ストーリー構造図 + 世界設定 + キャラクター設計

### Stage 2: コンテンツ制作 (Author)

**担当**: P1 (ライター) が主、P2 (テクニカルデザイナー) が補助
**ツール**: NarrativeGen Web Tester
**手動介入**: 80% (テキスト入力) / 20% (ツール支援)

| 作業 | 使用画面/機能 | 手動 vs 自動 |
|------|-------------|-------------|
| ノード作成・テキスト入力 | GUI Editor (ビジュアルエディタ) | 手動 |
| 選択肢作成・接続 | GUI Editor + NodeGraph | 手動 (D&D 対応) |
| 条件/効果設定 | condition-effect-editor | 半自動 (ドロップダウン選択) |
| Entity 定義 | Entity パネル (CRUD GUI) | 半自動 |
| Dynamic Text 記述 | テキストエリア + インラインプレビュー | 手動 (プレビュー自動) |
| 言い換え辞書編集 | Lexicon UI | 手動 |
| ConversationTemplate 設定 | Template パネル (CRUD GUI) | 半自動 |
| CSV/スプレッドシートからのインポート | CSV Import Handler | 自動 (パース) |
| 自動保存 | Save/Load Handler | 完全自動 (500ms debounce) |

**この段階の成果物**: JSON モデルファイル (playthrough.schema.json 準拠)

#### 2a: WritingPage 連携 (将来)

WritingPage で執筆したテキストを NarrativeGen のノードに流し込む、またはその逆。
- NarrativeGen → WritingPage: ノードテキストを長文執筆環境で編集
- WritingPage → NarrativeGen: 執筆済みテキストをノード構造に変換

**ステータス**: DECISION LOG (2026-03-08) で双方向連携を決定。仕様未策定。

### Stage 3: 検証・調整 (Validate)

**担当**: P1 + P2
**ツール**: NarrativeGen Web Tester (複数機能)
**手動介入**: 30% / 70% (ツール支援)

| 作業 | 使用機能 | 手動 vs 自動 |
|------|---------|-------------|
| スキーマ検証 | Model Validator (Ajv) | 完全自動 |
| 構造検証 (循環参照・孤立ノード・未定義参照) | Validation Panel | 完全自動 |
| 到達可能性分析 | Inference Engine (UC-2) | 完全自動 |
| パス分析 (全ルート確認) | Inference Engine (UC-1) + Ending Analyzer | 完全自動 |
| 影響分析 (条件/効果の波及) | Inference Panel (UC-3) | 完全自動 |
| What-if シミュレーション | Inference Panel (UC-5) | 半自動 (条件設定は手動) |
| グラフ視覚確認 | NodeGraph + 推論ハイライト | 手動 (目視) |
| プレイテスト | Story タブ / Play モード | 手動 (操作) |
| 統計確認 | Stats Panel | 自動 (表示) |
| テキスト品質確認 | Play モード (段落フェードイン) | 手動 (目視) |
| 画像/BGM 確認 | Play モード (Phase 2) | 手動 (操作) |

**この段階の成果物**: 検証済みモデルファイル

### Stage 4: エクスポート (Export)

**担当**: P2 (テクニカルデザイナー) / P3 (インテグレーター)
**ツール**: NarrativeGen Web Tester (Export メニュー)
**手動介入**: 10% (形式選択のみ)

| 出力形式 | 用途 | 対応状況 |
|---------|------|---------|
| JSON (NarrativeGen native) | engine-ts / sdk-unity ランタイム | 実装済み |
| CSV | スプレッドシート編集 / 外部ツール連携 | 実装済み |
| Yarn Spinner (.yarn) | Unity Yarn Spinner ランタイム | 実装済み (Dynamic Text 未変換) |
| Ink (.ink) | Inkle ランタイム | 実装済み |
| Twine (.html) | Twine ランタイム | 実装済み |

**制限事項**:
- Dynamic Text 構文 (`[entity.property]`, `{?condition:text}`) は Yarn/Ink/Twine で非互換。変換ルールが未定義
- Entity-Property / ConversationTemplate / Event はJSON以外のフォーマットでは部分的にしかエクスポートされない

**この段階の成果物**: ターゲットランタイム用ファイル

### Stage 5: ランタイム統合 (Integrate)

**担当**: P3 (インテグレーター)
**ツール**: Unity Editor + NarrativeGen SDK / 各ランタイムツール
**手動介入**: 60% (設定・UI接続)

| 作業 | ツール | 手動 vs 自動 |
|------|-------|-------------|
| モデルファイル配置 | ファイルコピー | 手動 |
| SDK セットアップ | Unity Package Manager | 半自動 |
| UI 接続 (テキスト表示・選択肢ボタン) | Unity C# | 手動 |
| 条件/効果のランタイム実行 | engine-ts / sdk-unity | 自動 |
| セーブ/ロード統合 | SDK serialize/deserialize | 半自動 |

**制限事項**:
- Unity SDK は TS 側の原初ビジョン7機能が未移植 (SP-UNITY-001 85%)
- Entity-Property / Dynamic Text / Anomaly Detection / Character Knowledge / Event / Description Tracker / ConversationTemplate の C# 実装が必要

---

## 手動介入 vs 自動化 マトリクス

| ステージ | 手動率 | 自動化候補 | 実装状況 |
|---------|--------|-----------|---------|
| Stage 1: 構想 | 100% | AI によるストーリー構造提案 | 未着手 (スコープ外候補) |
| Stage 2: 制作 | 80% | CSV インポート、テンプレートGUI、自動保存 | 実装済み |
| Stage 3: 検証 | 30% | スキーマ/構造/到達/パス/影響 全自動 | 実装済み |
| Stage 4: エクスポート | 10% | 形式選択のみ手動 | 実装済み (DT 変換除く) |
| Stage 5: 統合 | 60% | SDK 基盤は提供、UI 接続は手動 | 部分実装 |

---

## 現在の Gap と優先課題

### Gap 1: WritingPage 連携 (Stage 2a)
- **状態**: 仕様未策定 (DECISION LOG 2026-03-08 で双方向連携を決定)
- **影響**: ライターの長文執筆体験が Web Tester の小さなテキストエリアに制約される
- **優先度**: 中

### Gap 2: Dynamic Text エクスポート変換 (Stage 4)
- **状態**: NarrativeGen 独自構文がターゲットフォーマットに変換されない
- **影響**: JSON 以外のエクスポート時に動的テキスト機能が失われる
- **優先度**: 中 (JSON エクスポート + engine-ts ランタイムで回避可能)

### Gap 3: Unity SDK パリティ (Stage 5)
- **状態**: TS 側 7 機能が C# 未移植
- **影響**: Unity ランタイムで原初ビジョン機能が使えない
- **優先度**: 高 (Unity 統合が主要ユースケース)

### Gap 4: Pipeline 自体の可視化
- **状態**: 各ステージのツール・手順は個別に存在するが、統合的なガイドがない
- **影響**: 新規ユーザーの学習コストが高い
- **優先度**: 中 (AUTHORING_GUIDE.md が Stage 2 をカバーしているが、全体フローは未カバー)

### Gap 5: ステージ間データ同期
- **状態**: Stage 2→3→4 はWeb Tester内で完結するが、Stage 1→2 (設計→制作) と Stage 4→5 (エクスポート→統合) の接続が手作業
- **影響**: ステージ遷移で情報が失われるリスク
- **優先度**: 低 (現時点ではシングルユーザー運用)

---

## 関連仕様

- SP-SCHEMA-001: Model Schema (Stage 2-4 のデータフォーマット)
- SP-ENGINE-001: Engine Core API (Stage 3, 5 のランタイム基盤)
- SP-ENTITY-001: Entity/Inventory (Stage 2 のエンティティ制作)
- SP-PROP-001: Entity-Property System (Stage 2 のプロパティ制作)
- SP-TEXT-001: Dynamic Text Engine (Stage 2 のテキスト制作)
- SP-DYNAMIC-001: Dynamic Story Expansion (Stage 2 のテンプレート制作)
- SP-INF-UI-001: Inference UI Integration (Stage 3 の検証ツール)
- SP-PLAY-001: Play Immersion (Stage 3 のプレイテスト)
- SP-EXP-YARN-001: Yarn Spinner Export (Stage 4)
- SP-UNITY-001: Unity SDK (Stage 5)

---

## HUMAN_AUTHORITY 確認結果 (2026-03-27)

| # | 項目 | 決定 | 備考 |
|---|------|------|------|
| 1 | ペルソナの妥当性 | **1人運用** | P1/P2/P3 は「帽子の切替」として理解。3分類は設計上の関心分離として維持 |
| 2 | WritingPage 連携の優先度 | **次スライス** | Pipeline 確定後、最優先で着手 |
| 3 | エクスポート戦略 | **JSON 主軸** | NarrativeGen 独自機能 (DT/Entity/Template) が活きるのは JSON + 独自ランタイムのみ。他形式は互換用 |
| 4 | Stage 1 AI 支援 | **スコープ外** | 構想は人間の仕事。AI 支援は当面不要 |
| 5 | Pipeline ガイドの形態 | **AUTHORING_GUIDE 拡張** | 既存 AUTHORING_GUIDE.md に Stage 1/3/4/5 を追加し、全体像を一箇所で把握可能にする |
