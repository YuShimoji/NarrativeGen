# 開発タスクリスト（詳細版）

最終更新: 2025-08-18 08:55 JST

本ドキュメントは、現在進行中および計画中のタスクを詳細に管理するための一次情報源です。各タスクには目的、範囲、作業手順、成果物、テスト手順、参照ファイル/クラス、優先度、ステータスを記載します。

---

## タスクID対応表（TODOリスト連携）
- A-1 → `audit-code`
- B-1 → `spec-rules`
- B-3 → `spec-paraphrase`
- B-2 → `design-engine`
- B-4 → `syntax-engine-impl`
- A-2 → `fix-data-paths`（完了）
- A-3 → `bootstrap-event`
- C-1 → `db-manager-hardening`
- C-2 → `ui-feedback`
- C-3 → `tests`
- Docs全般 → `docs`
- CI → `ci`

## A. データロード/イベント起動の安定化

### A-1. 現状コード・データの監査（ログ/CSV配置/初期化順）
- 目的: ランタイム時のデータ未読込・開始イベント未解決の原因を恒久的に排除
- 範囲: `DatabaseManager`, `GameManager`, `SimpleCsvReader`, `SyntaxEngine`, `UIManager`
- 手順:
  1. ログ出力の網羅化（CSV件数、欠落列、開始イベント解決経路）
  2. 初期化順の固定化（`GameManager.Start()` → `DatabaseManager.LoadAll()` → WorldState初期化 → 起動イベント実行）
  3. ファイル実在チェック（`Assets/StreamingAssets/NarrativeData/` のCSV群）
- 成果物: 監査ログ、必要に応じた初期化順/ログの修正PR
- テスト手順:
  - Unity再生時にCSV読込件数が0でないこと、開始イベントが例外なく実行されることを確認
- 参照: `Assets/Scripts/Core/GameManager.cs`, `Assets/Scripts/Data/DatabaseManager.cs`, `Assets/Scripts/Data/SimpleCsvReader.cs`
- 優先度: 高 / ステータス: 進行中
- 受け入れ基準: 起動時に`Events`/`Choices`読込が>0、`event_start_game`が一度も失敗せず実行されるログが出る
- 担当: Owner未定（デフォルト: Maintainer）
- 見積: 0.5〜1.0日
- 期日: 次回スプリント終了まで

### A-2. StreamingAssetsのCSVパス/命名の是正（完了）
- 目的: 実ファイル配置とコード中の既定パスを一致させ、未読込を解消
- 変更点:
  - `GameManager`: `m_EventsCSVPath = "Events.csv"`, `m_ChoicesCSVPath = "Choices.csv"`
  - `DatabaseManager.LoadChoices()`: 列名フォールバック（`id|choice_id`, `nextEventId|next_event_id`, `choiceId|category|choice_group_id`）
- テスト手順:
  - 再生 → ログにて `Events/Choices` の読込件数>0、UIにテキスト/選択肢が表示される
- 参照: `Documentation/01_Current_Status/CURRENT_PROJECT_STATUS.md`（直近の更新）
- 優先度: 高 / ステータス: 完了
- 受け入れ基準: `GameManager`のデフォルトが`Events.csv`/`Choices.csv`でビルド・実行が成功
- 担当: 完了
- 見積: 実績 0.3日
- 期日: 実績クリア

### A-3. 開始イベント「event_start_game」の定義・解決経路の実装
- 目的: 起動イベント未検出/未解決を防止
- 手順:
  1. `Events.csv` で `id = event_start_game` を確認
  2. `GameManager` の起動IDをインスペクター/デフォルトで一致させる
  3. `LogicEngine` 起動時に `ExecuteEvent(id)` のトレースログを追加（前後イベントID、分岐条件、エラー理由）
  4. 未検出時は UI に再試行・データガイドへの導線を表示
- 成果物: トレースログ、UIエラーハンドリング
- テスト手順:
  - `event_start_game` が存在する場合→起動成功
  - `id` を意図的に不一致にしてUI/ログのエラーメッセージが期待通りか検証
- 参照: `Assets/StreamingAssets/NarrativeData/Events.csv`, `Assets/Scripts/Core/GameManager.cs`, `Assets/Scripts/Logic/LogicEngine.cs`
- 優先度: 高 / ステータス: 進行中
- 進捗ノート: UIのエラー表示/リトライ導線、`GameManager.ProcessNarrativeResult()` の `Error` ハンドリング、`OnRetryRequested` による再初期化/再開を実装。`LogicEngine` 側のエラー結果明確化と詳細トレースログは未了。
- 受け入れ基準: `ExecuteEvent("event_start_game")`の成功ログと、未検出時のUIエラー表示（再試行導線付）が確認できる
- 担当: Owner未定
- 見積: 0.5日
- 期日: 今スプリント内

---

## B. 推論ルール/構文・言い換えエンジン

### B-1. 推論ルール仕様の確定
- 目的: ルールの表現形式・評価順・条件/アクションを確定
- 手順:
  1. 仕様ドキュメントに DSL 例（CSV/JSON/YAML）と優先度決定方式を策定
  2. 条件（プロパティ比較/存在）・アクション（SET/GOTO/タグ付け）網羅
  3. トレース要件（評価順、マッチ結果、採択理由）定義
- 成果物: `Documentation/02_Technical_Specs/REASONING_RULES_SPEC.md`
- テスト手順: サンプルルールCSVでミニ実行器による評価ログ確認
- 参照: `Assets/StreamingAssets/NarrativeData/ReasoningRules.csv`, `Assets/Scripts/Data/Models/ReasoningRule.cs`
- 優先度: 高 / ステータス: 未着手
- 受け入れ基準: 仕様ドキュメントにフォーマット、評価順、条件/アクション、優先度、トレース要件が明文化され、サンプルが実行可能
- 担当: Owner未定
- 見積: 1.0日
- 期日: 次回スプリント

### B-2. 推論ルールエンジンの設計
- 目的: 実行器・コンテキスト・トレースを備えたミニエンジン設計
- 手順:
  - 実行パイプライン（収集→フィルタ→スコア→適用）
  - ルール優先度（int/float）と競合解決
  - WorldStateへの差分適用とロールバック
- 成果物: 設計書、クラス雛形（`ReasoningEngine`, `RuleEvaluator`, `TraceLog`）
- テスト手順: 単体テスト（優先度と条件マッチの期待結果）
- 参照: `Assets/Scripts/Logic/`
- 優先度: 高 / ステータス: 未着手
- 受け入れ基準: クラス図/シーケンス図、APIインタフェース、例外/トレース設計、最小クラス雛形のコミット
- 担当: Owner未定
- 見積: 1.0〜1.5日
- 期日: 仕様確定+1週

### B-3. 日本語言い換えシステム仕様の確定
- 目的: 辞書/規則/形態素解析の採否を決定
- 手順: 置換辞書、言い換え規則、スコアリング、使用履歴回避の方針を定義
- 成果物: `Documentation/02_Technical_Specs/PARAPHRASE_SPEC.md`
- テスト手順: サンプル入力に対する候補と選択結果の検証
- 参照: `Assets/StreamingAssets/NarrativeData/RecursiveDictionary.csv`
- 優先度: 高 / ステータス: 未着手
- 受け入れ基準: 入力→候補生成→選択スコア→出力の最小ワークフローが仕様として成立し、サンプルで再現可能
- 担当: Owner未定
- 見積: 1.0日
- 期日: 次回スプリント

### B-4. `SyntaxEngine` の実装の現実化
- 目的: 仕様に基づき再帰構文処理を動作可能にする
- 手順:
  - 初期化ログの整備、再帰上限、コマンド/辞書連携
  - ブラケット解決の循環検出とフェイルセーフ
- 成果物: 実装、最小テンプレートの生成デモ
- テスト手順: 深い入れ子・未定義キー・循環の3ケースで期待動作
- 参照: `Assets/Scripts/Logic/SyntaxEngine.cs`
- 優先度: 中 / ステータス: 未着手
- 受け入れ基準: 再帰上限・循環検出・フェイルセーフが有効で、3種テスト（深い入れ子/未定義/循環）を通過
- 担当: Owner未定
- 見積: 1.0日
- 期日: 設計完了後+1週

---

## C. ハードニング/UX/テスト

### C-1. `DatabaseManager` の空データ時フォールバック・バリデーション
- 目的: 列名不一致/空CSVでも落ちない堅牢化
- 手順: 列名検証、必須列不足の警告、デフォルト行生成、詳細ログ
- 成果物: 例外時のわかりやすいUI/ログ
- テスト手順: 列欠落/空CSVでの起動確認とUI表示
- 参照: `Assets/Scripts/Data/DatabaseManager.cs`, `Assets/Scripts/Data/SimpleCsvReader.cs`
- 優先度: 中 / ステータス: 未着手
- 受け入れ基準: 必須列欠落/空CSVのケースでアプリがクラッシュせず、UI/ログに具体的理由と対処指示が出る
- 担当: Owner未定
- 見積: 0.5〜1.0日
- 期日: 今スプリント内

### C-2. UI エラーメッセージの改善
- 目的: 欠落データ/未解決イベント/失敗時の再試行導線
- 手順: `UIManager` にエラー表示API追加、詳細原因/提案アクションの提示
- 成果物: エラー用プレハブ/メッセージ設計
- テスト手順: 意図的に開始イベント不一致時の表示確認
- 参照: `Assets/Scripts/UI/UIManager.cs`
- 優先度: 低 / ステータス: 進行中
- 進捗ノート: `UIManager.ShowError()` と `SetupRetryButton()` を実装/修正し、エラー表示とリトライ導線を追加。文言と詳細原因/提案アクションのテンプレート整備は未了。
- 受け入れ基準: エラーダイアログ/パネルで原因・提案・再試行ボタンが表示される
- 担当: Owner未定
- 見積: 0.5日
- 期日: 次回スプリント

### C-3. 単体/統合テストの整備
- 目的: ルール・言い換え・イベント解決・CSVロードの自動検証
- 手順: PlayModeテスト雛形、最小シナリオの自動通過をCIに
- 成果物: `Assets/Tests/` 以下のPlayMode/Editorテスト
- テスト手順: `event_start_game` からの分岐と選択肢が自動で成功
- 参照: `Assets/StreamingAssets/NarrativeData/*.csv`, `Assets/Scripts/*`
- 優先度: 高 / ステータス: 未着手
- 受け入れ基準: PlayMode最小シナリオがCI/ローカル双方でグリーン
- 担当: Owner未定
- 見積: 1.5日
- 期日: 設計完了後+1週

### C-4. CI（任意）
- 目的: PR時の自動チェック
- 手順: GitHub ActionsでEditor/PlayModeテストを実行
- 成果物: `.github/workflows/unity-ci.yml`
- テスト手順: PR作成でテストが走り結果が可視化
- 参照: 公式Unity CIテンプレート
- 優先度: 低 / ステータス: 未着手
- 受け入れ基準: PR作成時にUnityテストが自動実行され、結果がGitHubで可視化
- 担当: Owner未定
- 見積: 1.0日
- 期日: テスト整備完了後

---

## 付録: 現在の主要ファイル/ディレクトリ
- `Assets/StreamingAssets/NarrativeData/Events.csv`
- `Assets/StreamingAssets/NarrativeData/Choices.csv`
- `Assets/Scripts/Core/GameManager.cs`
- `Assets/Scripts/Data/DatabaseManager.cs`
- `Assets/Scripts/Data/SimpleCsvReader.cs`
- `Assets/Scripts/Logic/SyntaxEngine.cs`
- `Documentation/01_Current_Status/CURRENT_PROJECT_STATUS.md`

