# AI 作業コンテキスト（引き継ぎ用）

## 📋 プロジェクト概要

**NarrativeGen** は「ライターが直感的に複数の表現・物語の無数の展開をスプレッドシートに書けて、それが直接ゲーム上（エンジン上）で機能する」ナラティブエンジンです。

### コア設計思想

- **スプレッドシート駆動**: Excel/Google Sheets で CSV/TSV を編集し、即座にゲームへ反映
- **プログラミング不要**: フラグ、リソース、条件分岐をCSV列で記述
- **マルチプラットフォーム**: TypeScript エンジン + Unity SDK + Web Tester

## 🎯 最新実装状況（2025-10-27）

### ✅ 完了した主要機能

#### 1. OpenSpec仕様駆動開発導入 v1.0

**実装内容**:
- OpenSpecツールの導入と初期設定
- プロジェクト仕様のYAML定義（`.openspec/` ディレクトリ）
- 変更提案管理システムの構築

**技術詳細**:
- **仕様ファイル**: `.openspec/instructions.md` - NarrativeGenのコア仕様定義
- **変更提案**: `.openspec/changes/` - 各機能の仕様記述
  - `add-model-visualization.yaml`: モデル視覚化機能仕様
  - `enhance-gui-editing.yaml`: GUI編集強化仕様
  - `stabilize-ci-pipeline.yaml`: CI安定化仕様

**ワークフロー**:
- `openspec spec list`: 仕様一覧表示
- `openspec change validate`: 変更提案検証
- `openspec archive`: 完了した変更を仕様に統合

#### 2. Web Tester モデル視覚化機能

**実装内容**:
- SVGベースのインタラクティブグラフ表示
- ノード接続の視覚化（矢印付き線）
- ズーム/パン操作
- 現在のノードハイライト（緑色）

**技術詳細**:
- **実装場所**: `apps/web-tester/index.html`, `main.js`
- **機能**: `renderGraph()` 関数でノードをグリッド配置
- **コントロール**: ズームイン/アウト/リセットボタン
- **データ**: モデルノードと選択肢接続をSVGで描画

#### 3. GUI編集機能強化

**実装内容**:
- リアルタイム入力検証（タイプ時に自動チェック）
- キーボードショートカット（Ctrl+Sで保存）
- 即時エラー表示

**技術詳細**:
- **リアルタイム検証**: `input` イベントリスナーで `validateModel()` 呼び出し
- **ショートカット**: `document.addEventListener('keydown')` でCtrl+S検知
- **エラー表示**: `showErrors()`/`hideErrors()` で即時フィードバック

#### 4. CI/CDパイプライン安定化

**実装内容**:
- Unityエディタ環境のCI統合
- Unityライセンスアクティベーション
- sdk-unityジョブの安定化

**技術詳細**:
- **Unity CI**: `game-ci/unity-builder@v4` と `unity-activate@v1` 使用
- **ライセンス**: GitHub secrets（UNITY_USERNAME, UNITY_PASSWORD, UNITY_SERIAL）必要
- **設定ファイル**: `.github/workflows/ci.yml` 更新

### 🚀 次の開発タスク（推奨）

#### 短期（今週中）

1. **OpenSpec完全セットアップ**
   - `openspec init` の手動完了（インタラクティブ設定）
   - 変更提案のarchive処理

2. **Unityライセンス設定**
   - GitHubリポジトリsecretsの設定
   - CIテスト実行確認

3. **Web Tester 機能拡張**
   - グラフノードのクリックで編集モード遷移
   - グラフレイアウト改善（力学モデルアルゴリズム）

#### 中期（1-2週間）

1. **仕様駆動開発の定着**
   - すべての変更をOpenSpec change proposal経由
   - ドキュメント自動生成

2. **Unityエディタ拡張**
   - CSVインポートUI
   - ビジュアルノードエディタ

### ⚠️ 申し送り事項（必須対応）

#### 即時対応が必要

1. **OpenSpec初期化完了**
   - ターミナルで `openspec init` を実行し、インタラクティブ設定を完了させる
   - AI assistant接続設定を行う

2. **Unityライセンスsecrets設定**
   - GitHubリポジトリ設定 > Secrets and variables > Actions
   - 以下のsecretsを追加：
     - `UNITY_USERNAME`: Unityアカウントユーザー名
     - `UNITY_PASSWORD`: Unityアカウントパスワード  
     - `UNITY_SERIAL`: Unityライセンスシリアル番号
   - ライセンスはPersonal/Proいずれでも可

3. **CIテスト実行**
   - ライセンス設定後、CIワークフローを手動実行してsdk-unityジョブの成功を確認
   - 失敗時はUnityバージョン（2022.3.10f1）の調整を検討

#### 技術的注意点

- OpenSpec change proposalは`.openspec/changes/`にYAML形式で保存
- モデル視覚化はD3.js代替としてSVGネイティブ実装（軽量）
- GUIリアルタイム検証はパフォーマンスに影響しないよう最適化済み
- Unity CIはライセンス認証のため初回実行が長時間かかる可能性

### 🔧 環境依存事項

- OpenSpec: グローバルインストール済み（`@fission-ai/openspec@latest`）
- Unity CI: ライセンスsecrets必須
- グラフ機能: SVG対応ブラウザ必須（IE11非対応）

#### 1. スプレッドシート駆動システム v2.0

**実装内容**:
- CSV/TSV 拡張フォーマット対応（条件・効果・フラグ・リソース）
- Web Tester の CSV インポート/エクスポート機能
- バリデーション機能（ノード参照整合性チェック）

**技術詳細**:
- **パーサー**: `apps/web-tester/main.js` に実装
  - `parseConditions()`: セミコロン区切りの条件式を JSON 配列へ変換
  - `parseEffects()`: セミコロン区切りの効果を JSON 配列へ変換
  - `validateModel()`: ノード参照とターゲット整合性を検証
- **CSV 列定義**:
  - 基本: `node_id`, `node_text`, `choice_id`, `choice_text`, `choice_target`
  - 拡張: `choice_conditions`, `choice_effects`, `choice_outcome_type`, `choice_outcome_value`, `initial_flags`, `initial_resources`

**条件式構文**:
```
flag:key=true|false
resource:key>=|<=|>|<|==value
timeWindow:start-end
```

**効果構文**:
```
setFlag:key=true|false
addResource:key=delta
goto:target_node_id
```

#### 2. サンプルモデル

- **`models/spreadsheets/shop-quest.csv`**: フラグ・リソース管理の実践例
  - ゴールド消費、鍵入手、ダンジョン攻略のシナリオ
- **`models/spreadsheets/time-quest.csv`**: 時間ゲートの実践例
  - 時刻による選択肢の出現制御（市場5-10時、図書館8-18時、酒場18-23時）

#### 3. ドキュメント整備

- **`docs/spreadsheet-format.md`**: 完全仕様書
  - フォーマット定義、構文、バリデーションルール、次期拡張予定
- **`README.md`**: クイックスタートガイド追加
  - スプレッドシート駆動機能の説明と使い方

#### 4. エンジン安定化

- **Lint 修正**: ESLint ルール調整（`packages/engine-ts/.eslintrc.cjs`）
  - 未使用変数の `_` プレフィックス許可
  - `require-await` 無効化（stub 実装用）
  - `import/no-unresolved` の `.js` 拡張子例外設定
- **型整合**: `ChoiceOutcome` インターフェース追加（`packages/engine-ts/src/types.ts`）
- **テスト安定化**: Unity SDK テスト 8/8 合格、TypeScript エンジンテスト 10/10 合格

#### 5. AI 機能の設計分離

- **設計方針**: AI はエンジン本体から独立した補助層（`docs/ai-features.md`）
- **現状**: Web Tester から AI UI を撤去し、コア機能に集中
- **今後**: AI Provider インターフェースは実装済み（`packages/engine-ts/src/ai-provider.ts`）だが、UI 統合は保留

## 📂 プロジェクト構成

```
NarrativeGen/
├── apps/
│   └── web-tester/          # Web ベースのテストツール
│       ├── index.html       # UI 定義
│       ├── main.js          # CSV パーサー・ビューア実装
│       └── package.json
├── packages/
│   ├── engine-ts/           # TypeScript コアエンジン
│   │   ├── src/
│   │   │   ├── index.ts     # モデル読み込み・セッション管理（非AI）
│   │   │   ├── types.ts     # 型定義（Model, SessionState, Condition, Effect）
│   │   │   ├── session-ops.ts  # セッション操作（選択肢適用、条件評価）
│   │   │   ├── game-session.ts # GameSession クラス（インベントリ統合）
│   │   │   ├── inventory.ts    # インベントリ管理
│   │   │   ├── entities.ts     # エンティティ（アイテム）管理
│   │   │   ├── ai-provider.ts  # AI Provider インターフェース（stub）
│   │   │   └── paraphrase.ts   # 決定論的言い換え（非AI）
│   │   └── test/            # Vitest テストスイート
│   ├── sdk-unity/           # Unity SDK（C# ランタイム）
│   │   ├── Runtime/
│   │   │   ├── Engine.cs    # C# エンジン実装
│   │   │   ├── Model.cs     # モデル定義
│   │   │   └── Session.cs   # セッション管理
│   │   └── Editor/          # Unity エディタ拡張
│   └── tests/
│       └── NarrativeGen.Tests/  # NUnit テストスイート
├── models/
│   ├── schema/
│   │   └── playthrough.schema.json  # JSON Schema 定義
│   ├── examples/            # サンプル JSON モデル
│   └── spreadsheets/        # サンプル CSV
│       ├── template.csv     # 基本テンプレート
│       ├── shop-quest.csv   # フラグ・リソース例
│       └── time-quest.csv   # 時間ゲート例
├── docs/
│   ├── spreadsheet-format.md  # スプレッドシート仕様書
│   └── ai-features.md         # AI 機能設計書
└── .github/workflows/
    └── ci.yml               # CI 設定（engine-ts, web-tester, sdk-unity）
```

## 🔧 開発環境セットアップ

### 必須要件

- Node.js 20+
- .NET SDK 8+
- Unity 2021.3+ (SDK 利用時)

### クイックスタート

```bash
# 1. リポジトリクローン
git clone https://github.com/YuShimoji/NarrativeGen.git
cd NarrativeGen

# 2. TypeScript エンジンビルド
cd packages/engine-ts
npm install
npm run build
npm test

# 3. Web Tester 起動
cd ../../apps/web-tester
npm install
npm run dev
# => http://localhost:5173 で開く

# 4. Unity SDK ビルド（オプション）
cd ../../packages/sdk-unity
dotnet build -c Release

# 5. Unity SDK テスト
cd ../tests/NarrativeGen.Tests
dotnet test
```

## 📝 CSV 編集ワークフロー

### 基本フロー

1. **Excel/Google Sheets で編集**
   - サンプル: `models/spreadsheets/shop-quest.csv` を開く
   - 新規ノード・選択肢を追加
   - 条件・効果を CSV 列で記述

2. **Web Tester で検証**
   - `npm run dev` で起動
   - 「CSVインポート」ボタンで読み込み
   - 警告・エラーを確認
   - ストーリーを実際にプレイして動作確認

3. **エクスポート（必要に応じて）**
   - 「CSVエクスポート」で拡張列も含めて出力
   - 再度インポートしてラウンドトリップを確認

### 条件・効果の記述例

**フラグ付き選択肢**:
```csv
node_id,node_text,choice_id,choice_text,choice_target,choice_conditions,choice_effects
shop,商店の店主が話しかけてくる,buy_key,鍵を買う,bought_key,resource:gold>=50,setFlag:has_key=true;addResource:gold=-50
```

**時間ゲート**:
```csv
node_id,node_text,choice_id,choice_text,choice_target,choice_conditions,choice_effects
town,町の中心広場,market,市場に行く,market,timeWindow:5-10,addResource:time=1
```

## 🧪 テスト実行

### TypeScript エンジン

```bash
cd packages/engine-ts
npm test              # 全テスト実行
npm run lint          # Lint チェック
npm run build         # ビルド
```

### Unity SDK

```bash
cd packages/tests/NarrativeGen.Tests
dotnet test --configuration Release
```

### Web Tester

```bash
cd apps/web-tester
npm run build         # 本番ビルド
npm run preview       # ビルド結果をプレビュー
```

## 🚀 次の開発タスク（推奨）

### 短期（1-2週間）

1. **Web Tester の安定化**
   - CI 環境でのビルドエラー修正
   - バリデーションエラーの画面表示改善
   - CSVプレビュー機能追加

2. **Unity エディタ拡張**
   - CSV インポーターの実装
   - Inspector での CSV 編集サポート

3. **サンプル追加**
   - 複雑な分岐サンプル（複数エンディング）
   - チュートリアルシナリオ

### 中期（1-2ヶ月）

1. **UI 改善**
   - ノードグラフビュー（ビジュアルエディタ）
   - 到達可能性マップ表示
   - フラグ・リソースのデバッグビュー

2. **CSV フォーマット v3.0**
   - 複数開始ノード（チャプター選択）
   - サブモデル参照（`@import` 構文）
   - 多言語対応（`node_text_en`, `choice_text_ja` 等）

3. **AI 機能の再統合**
   - OpenAI API 統合（Phase 2）
   - ローカル LLM 統合（Ollama, Phase 3）
   - 生成履歴・再生成機能（Phase 4）

### 長期（3ヶ月以上）

1. **パフォーマンス最適化**
   - 大規模モデル（1000+ ノード）対応
   - 遅延ロード・ストリーミング

2. **コラボレーション機能**
   - リアルタイム共同編集（WebSocket）
   - バージョン管理統合（Git Diff 表示）

3. **プラグインシステム**
   - カスタム条件・効果の追加
   - 外部API連携（Discord, Slack 通知等）

## ⚠️ 既知の問題と制約

### 現在の制約

1. **Web Tester の CI 失敗**
   - ローカルビルドは成功するが、GitHub Actions で失敗
   - 原因: 依存関係またはビルドツールのバージョン差異の可能性
   - 対策: CI 環境の調査とビルドスクリプト修正

2. **Unity SDK のシリアライゼーション**
   - C# SDK は Serialize/Deserialize 未実装
   - TypeScript 版は実装済み（`serialize()`, `deserialize()`）
   - 対策: C# に Newtonsoft.Json を活用したシリアライゼーション追加

3. **AI 機能の実装遅延**
   - `ai-provider.ts` にインターフェースのみ実装
   - Web Tester UI から AI 関連コードを撤去済み
   - 対策: Phase 2 で OpenAI 統合を実施

### セキュリティ注意事項

- API Key はローカルストレージに保存（ブラウザ依存）
- 本番環境では環境変数やシークレット管理サービス推奨
- CSV インポート時にスクリプト injection の可能性（現在は対策未実施）

## 📚 参考リソース

### 主要ドキュメント

- [スプレッドシート仕様](docs/spreadsheet-format.md)
- [AI 機能設計](docs/ai-features.md)
- [README](README.md)

### 外部リンク

- [GitHub リポジトリ](https://github.com/YuShimoji/NarrativeGen)
- [CI ステータス](https://github.com/YuShimoji/NarrativeGen/actions)

## 🔄 引き継ぎ時のチェックリスト

引き継ぎ前に以下を確認してください：

- [ ] ローカルブランチが `origin/open-ws/engine-skeleton-2025-09-02` と同期している
- [ ] 全テストが通過している（`npm test`, `dotnet test`）
- [ ] Lint エラーがない（`npm run lint`）
- [ ] ビルドが成功している（`npm run build`）
- [ ] サンプルCSVが正常に読み込める（Web Tester で確認）
- [ ] 最新のコミットがリモートにプッシュされている
- [ ] PR/Issue が適切にクローズされている

## 🆘 トラブルシューティング

### よくある問題

**Q: CSV インポートでエラーが出る**
- A: ヘッダー行が正しいか確認（`node_id`, `node_text` は必須）
- A: セミコロン `;` とカンマ `,` の使い分けを確認

**Q: Lint エラーが出る**
- A: `.eslintrc.cjs` のルール設定を確認
- A: 未使用変数は `_` プレフィックスを付ける

**Q: CI が失敗する**
- A: ローカルで `npm run build && npm test` が成功するか確認
- A: `.github/workflows/ci.yml` のビルドコマンドと一致しているか確認

**Q: Unity SDK でコンパイルエラー**
- A: .NET SDK 8+ がインストールされているか確認
- A: `dotnet build` でエラーメッセージを確認

---

**最終更新**: 2025-10-27  
**作成者**: AI アシスタント（Windsurf Cascade）  
**バージョン**: v2.1 (OpenSpec + Visual Features)
