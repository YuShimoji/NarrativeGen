# テスト可能性評価（Test Readiness Assessment）

**評価日**: 2026-01-03  
**評価者**: Orchestrator

## 概要

NarrativeGenプロジェクトのテスト可能性について、現状を評価し、実行可能なテスト項目を整理しました。

## テスト環境の準備可能性

### ✅ 環境セットアップ（即座に実行可能）

1. **依存関係インストール**
   ```bash
   npm install
   ```
   - 要件: Node.js 20+, npm 8+
   - 状態: 即座に実行可能

2. **ビルド**
   ```bash
   npm run build:all
   ```
   - エンジン（Packages/engine-ts）とWeb Tester（apps/web-tester）を同時ビルド
   - 状態: 即座に実行可能

3. **開発サーバー起動**
   ```bash
   npm run dev:tester
   ```
   - ポート5173で起動
   - 状態: 即座に実行可能

### ✅ テストドキュメントの存在

- **TEST_PROCEDURES.md**: 包括的なテスト手順ガイド（環境セットアップ、基本機能、UI/UX、AI機能）
- **docs/GUI_EDITOR_TEST_GUIDE.md**: GUIエディタ機能の詳細な手動テストケース
- **hands-on-testing.md**: ハンズオンテスト手順（15-30分）
- **docs/UI_IMPROVEMENTS_TEST.md**: UI改善のテスト記録
- **test-ai-features.md**: AI機能のテスト手順

### ✅ テストコマンドの可用性

```bash
# 単体テスト
npm run test:engine

# ウォッチモード
npm run test:watch

# 包括的チェック（lint + test + validate + build）
npm run check

# モデル検証
npm run validate:engine
```

## 実行可能なテストカテゴリ

### 1. 環境セットアップテスト（即座に実行可能）

- ✅ プロジェクト初期化（npm install）
- ✅ ビルド（npm run build:all）
- ✅ 開発サーバー起動（npm run dev:tester）

### 2. 基本機能テスト（ブラウザ操作が必要）

- ✅ ページ読み込み
- ✅ サンプルモデル読み込み（linear, branching_flags等）
- ✅ ストーリー進行（選択肢クリック）
- ✅ 状態管理（flags, resources, variables）

**実行方法**: `npm run dev:tester` → ブラウザで `http://localhost:5173` を開く

### 3. GUIエディタ機能テスト（手動テスト）

- ✅ コピー&ペースト（Ctrl+C/V）
- ✅ 検索・フィルタ
- ✅ スニペット機能
- ✅ テンプレート機能
- ✅ プレビュー機能
- ✅ 検証機能
- ✅ Mermaidグラフ表示

**実行方法**: GUI編集モードに入り、`docs/GUI_EDITOR_TEST_GUIDE.md` のテストケースを順次実行

### 4. 自動化テスト（一部実装済み）

- ✅ Puppeteerによるスモークテスト（起動/実行/タブ切替/GUI編集入退場/レキシコン操作）
- ⚠️ 完全自動化は未実装（手動実行が必要）

### 5. コード品質テスト（即座に実行可能）

- ✅ Lint（npm run lint）
- ✅ フォーマット（npm run format）
- ✅ 型チェック（TypeScript）

### 6. API仕様テスト（将来実装）

- ⚠️ APIサーバーは未実装
- ✅ OpenAPI仕様の検証（npm run validate:spec）
- ✅ APIドキュメント生成（npm run docs:api）

## テスト実行の障壁

### 低い障壁（即座に解決可能）

1. **環境依存**: Node.js/npmのバージョン確認が必要
   - 解決: `node --version`, `npm --version` で確認

2. **ポート競合**: 5173ポートが使用中
   - 解決: 別ポート指定または既存プロセス終了

### 中程度の障壁（手動操作が必要）

1. **ブラウザ操作**: GUIテストは手動操作が必要
   - 解決: テストガイドに従って手動実行

2. **AI機能テスト**: OpenAI APIキーが必要
   - 解決: `.env` に `VITE_OPENAI_API_KEY` を設定

### 高い障壁（実装が必要）

1. **完全自動化テスト**: E2Eテストフレームワークの導入が必要
   - 現状: Puppeteerによる部分的な自動化のみ
   - 推奨: PlaywrightまたはCypressの導入

2. **CI/CD統合**: GitHub Actionsでの自動テスト実行
   - 現状: `.github/workflows/ci.yml` は存在するが、テスト実行の詳細は未確認

## 推奨テスト実行順序

### Phase 1: 環境確認（5分）
```bash
npm install
npm run build:all
npm run check
```

### Phase 2: 基本機能テスト（10分）
```bash
npm run dev:tester
# ブラウザで http://localhost:5173 を開き、TEST_PROCEDURES.md の「2. 基本機能テスト」を実行
```

### Phase 3: GUIエディタテスト（20分）
```bash
# 開発サーバー起動中に、docs/GUI_EDITOR_TEST_GUIDE.md のテストケースを実行
```

### Phase 4: 回帰テスト（必要に応じて）
- 過去のバグ修正箇所の再確認
- 主要機能の動作確認

## 結論

**テスト可能性: 高い**

- ✅ 環境セットアップは即座に実行可能
- ✅ 包括的なテストドキュメントが存在
- ✅ テストコマンドが整備されている
- ⚠️ 一部のテストは手動操作が必要（ブラウザ操作）
- ⚠️ 完全自動化は今後の課題

**即座に実行可能なテスト**: 環境セットアップ、ビルド、コード品質チェック、基本機能テスト（ブラウザ操作含む）
