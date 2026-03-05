# NarrativeGen API 開発ワークフロー

## 概要
このドキュメントは、NarrativeGen APIの開発・テスト・ドキュメント化のための標準ワークフローを定義します。

## 開発環境セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. API仕様の検証
```bash
# OpenAPI仕様の構文チェック
npm run validate:spec

# 仕様が正しい場合、成功メッセージが表示されます
```

### 3. APIドキュメントの生成
```bash
# ReDoc形式のドキュメント生成
npm run docs:api

# ブラウザで確認
npm run docs:api:serve  # http://localhost:8080 で確認
```

### 4. 開発サーバーの起動
```bash
# APIサーバーの開発モード起動（将来の実装）
npm run dev:api

# Webテスターと並行して実行
npm run dev:all
```

## API開発ワークフロー

### Phase 1: 仕様定義フェーズ
```
1. OpenAPI仕様書の更新 (openapi-spec.json)
2. 仕様の検証: npm run validate:spec
3. ドキュメントの自動生成: npm run docs:api
4. チームレビューと承認
```

### Phase 2: 実装フェーズ
```
1. 仕様に基づいたバックエンド実装
2. ユニットテストの作成
3. 統合テストの実行
4. APIドキュメントの更新
```

### Phase 3: テストフェーズ
```
1. Postmanコレクションでの手動テスト
2. 自動テストの実行
3. パフォーマンステスト
4. セキュリティテスト
```

### Phase 4: デプロイフェーズ
```
1. 最終的な仕様検証
2. ドキュメントの公開
3. APIのデプロイ
4. クライアントSDKの更新（必要に応じて）
```

## テスト戦略

### 1. 単体テスト (Unit Tests)
```bash
# 個別のAPIエンドポイントテスト
npm run test:unit

# テストカバレッジレポート生成
npm run test:coverage
```

### 2. 統合テスト (Integration Tests)
```bash
# API全体の統合テスト
npm run test:integration

# データベースとの連携テスト
npm run test:database
```

### 3. E2Eテスト (End-to-End Tests)
```bash
# 完全なユーザーシナリオテスト
npm run test:e2e

# 実際のフロントエンドとの統合テスト
npm run test:frontend
```

### 4. パフォーマンステスト
```bash
# 負荷テスト
npm run test:load

# ストレステスト
npm run test:stress
```

## API仕様管理

### OpenAPI仕様の更新フロー
```
1. openapi-spec.json を編集
2. 構文検証: npm run validate:spec
3. 変更点をレビュー
4. ドキュメント生成: npm run docs:api
5. コミットとプッシュ
```

### バージョン管理
- **MAJOR.MINOR.PATCH** のSemantic Versioningを使用
- APIの破壊的変更時はMAJORバージョンアップ
- 新機能追加時はMINORバージョンアップ
- バグ修正時はPATCHバージョンアップ

### 後方互換性
- APIの破壊的変更は避ける
- 非推奨機能には `deprecated: true` をマーク
- 移行期間を設けて段階的に廃止

## ドキュメント管理

### APIドキュメントの公開
```bash
# 静的HTML生成
npm run docs:api

# 生成されたファイル: docs/api/index.html
# このファイルをWebサーバーにデプロイ
```

### インタラクティブドキュメント
- Swagger UI: `public/api-docs.html` (Vite開発サーバーで利用可能)
- ReDoc: `docs/api/index.html` (静的生成)

## 品質保証

### コード品質チェック
```bash
# 全品質チェックの実行
npm run check

# 含まれるチェック:
# - ESLint (コーディング標準)
# - TypeScriptコンパイルチェック
# - OpenAPI仕様検証
# - ユニットテスト
# - 統合テスト
```

### 継続的インテグレーション (CI)
```yaml
# .github/workflows/api-ci.yml の例
name: API CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run validate:spec
      - run: npm run check
      - run: npm run docs:api
```

## セキュリティテスト

### 認証・認可テスト
- JWTトークンの有効性検証
- 権限ベースのアクセス制御テスト
- APIキーの管理テスト

### 入力検証テスト
- SQLインジェクション対策
- XSS対策
- 入力データのサニタイズ

### レート制限テスト
- リクエスト制限のテスト
- DoS攻撃対策の検証

## モニタリングと運用

### ログ管理
```bash
# ログレベルの設定
LOG_LEVEL=info npm run dev:api

# ログ収集と分析
npm run logs:analyze
```

### パフォーマンス監視
- レスポンスタイムの測定
- エラーレートの監視
- リソース使用量の監視

### ヘルスチェック
```bash
# ヘルスチェックエンドポイント
GET /api/health

# 詳細なステータス情報
GET /api/health/detailed
```

## トラブルシューティング

### よくある問題と解決法

#### OpenAPI仕様の検証エラー
```bash
npm run validate:spec
# エラーメッセージを確認して修正
```

#### ドキュメント生成の失敗
```bash
# 依存関係の再インストール
npm install

# キャッシュのクリア
npm run clean
npm install
```

#### テストの失敗
```bash
# 詳細なテスト実行
npm run test:verbose

# 特定のテストのみ実行
npm run test -- --grep "test name"
```

## チーム開発ガイドライン

### ブランチ戦略
```
main          # 本番リリースブランチ
develop       # 開発統合ブランチ
feature/*     # 新機能開発ブランチ
hotfix/*      # 緊急修正ブランチ
release/*     # リリース準備ブランチ
```

### コミットメッセージ規則
```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

### レビュー基準
- [ ] OpenAPI仕様が更新されている
- [ ] テストが追加されている
- [ ] ドキュメントが更新されている
- [ ] 後方互換性が維持されている
- [ ] セキュリティ要件を満たしている

---

*最終更新: 2025-01-26*
*バージョン: 1.0.0*
