# NarrativeGen API Endpoints

## 概要
NarrativeGenのAPIエンドポイント定義。将来のバックエンド統合や拡張機能を考慮した設計。

## 現在のアーキテクチャ
- **フロントエンド**: Web Tester (Vite + Vanilla JS)
- **エンジン**: TypeScriptライブラリ (ブラウザ互換)
- **ストレージ**: ブラウザlocalStorage + ファイルシステム
- **外部API**: OpenAI API (直接接続)

## APIエンドポイント定義

### 1. モデル管理API
```
GET    /api/models              # 利用可能なモデルの一覧取得
GET    /api/models/:id          # 特定のモデル取得
POST   /api/models              # 新しいモデルの作成
PUT    /api/models/:id          # モデルの更新
DELETE /api/models/:id          # モデルの削除
POST   /api/models/import       # CSV/JSONからのモデルインポート
GET    /api/models/:id/export   # モデルのエクスポート
```

### 2. セッション管理API
```
POST   /api/sessions            # 新しいセッション開始
GET    /api/sessions/:id        # セッション状態取得
PUT    /api/sessions/:id        # セッション状態更新
DELETE /api/sessions/:id        # セッション終了
POST   /api/sessions/:id/choice # 選択肢適用
GET    /api/sessions/:id/history # セッション履歴取得
```

### 3. AI機能API
```
POST   /api/ai/generate         # 次のノード生成
POST   /api/ai/paraphrase       # テキスト言い換え
POST   /api/ai/suggest          # 選択肢提案
GET    /api/ai/providers        # 利用可能なAIプロバイダー一覧
POST   /api/ai/validate         # AI設定検証
```

### 4. 分析・デバッグAPI
```
GET    /api/analytics/sessions  # セッション分析データ
GET    /api/analytics/models    # モデル分析データ
GET    /api/debug/logs          # デバッグログ取得
POST   /api/debug/test           # テスト実行
GET    /api/health              # ヘルスチェック
```

### 5. ファイル管理API
```
POST   /api/files/upload        # ファイルアップロード
GET    /api/files/:id           # ファイル取得
DELETE /api/files/:id           # ファイル削除
GET    /api/files/templates     # テンプレートファイル一覧
```

## データモデル

### Model (モデル)
```typescript
interface Model {
  id: string
  name: string
  description?: string
  version: string
  createdAt: Date
  updatedAt: Date
  startNode: string
  nodes: Record<string, Node>
  flags?: Record<string, boolean>
  resources?: Record<string, number>
  metadata?: Record<string, any>
}
```

### Session (セッション)
```typescript
interface Session {
  id: string
  modelId: string
  userId?: string
  nodeId: string
  flags: Record<string, boolean>
  resources: Record<string, number>
  time: number
  history: SessionStep[]
  createdAt: Date
  updatedAt: Date
}
```

### AI Request/Response
```typescript
interface AIGenerateRequest {
  provider: string
  context: {
    previousNodes: string[]
    currentNodeText: string
    choiceText: string
  }
  options?: {
    maxTokens?: number
    temperature?: number
  }
}

interface AIGenerateResponse {
  text: string
  metadata: {
    provider: string
    model: string
    tokens: number
    duration: number
  }
}
```

## セキュリティ考慮事項

### 認証・認可
- JWTトークンベース認証 (将来実装)
- APIキー管理 (OpenAI等外部サービス)
- CORS設定
- Rate limiting

### データ検証
- JSON Schemaによるリクエスト/レスポンス検証
- 入力サニタイズ
- ファイルアップロードのセキュリティチェック

### エラーハンドリング
- 構造化エラーレスポンス
- 適切なHTTPステータスコード
- 詳細なエラーログ（開発環境のみ）

## 実装優先度

### Phase 1 (現在): ブラウザベース
- [x] ローカルストレージベースの永続化
- [x] ファイルベースのモデル管理
- [x] 直接API呼び出し (OpenAI)

### Phase 2 (将来): バックエンド統合
- [ ] REST API実装
- [ ] データベース統合
- [ ] ユーザー管理
- [ ] 高度な分析機能

### Phase 3 (将来): クラウド統合
- [ ] サーバーレスアーキテクチャ
- [ ] リアルタイムコラボレーション
- [ ] 高度なAI統合

## 互換性

### ブラウザ対応
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### APIバージョン管理
- Semantic Versioning (MAJOR.MINOR.PATCH)
- 後方互換性の維持
- 非推奨機能の適切な移行期間

---

*定義日: 2025-01-26*
*最終更新: 2025-01-26*
