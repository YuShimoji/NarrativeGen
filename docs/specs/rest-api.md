# SP-003: REST API (Backend)

**Status**: done | **Pct**: 90 | **Cat**: infra

## 概要

`@narrativegen/backend` の Express REST API 仕様。ポート 3001 (環境変数 `PORT` で変更可)。

## エンドポイント一覧

全エンドポイントは `/api` プレフィックス付きと無しの2系統が存在 (互換性のため)。以下は `/api` 系統で記述。

### ヘルスチェック

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/health` | `{ status: "healthy", timestamp, version }` |

### モデル管理

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/models` | モデル一覧 (query: `limit`, `offset`) |
| POST | `/api/models` | モデル作成 (body: Model JSON) |
| GET | `/api/models/:id` | モデル取得 |
| PUT | `/api/models/:id` | モデル更新 |
| DELETE | `/api/models/:id` | モデル削除 |
| POST | `/api/models/import` | ファイルインポート (multipart, field: `file`) |
| GET | `/api/models/:id/export` | モデルエクスポート (query: `format=json`) |

### セッション管理

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/sessions` | セッション作成 (body: `{ modelId, initialFlags?, initialResources? }`) |
| GET | `/api/sessions/:id` | セッション取得 |
| DELETE | `/api/sessions/:id` | セッション削除 |
| POST | `/api/sessions/:id/choice` | 選択肢適用 (body: `{ choiceId }`) |
| GET | `/api/sessions/:id/choices` | 利用可能な選択肢取得 |
| GET | `/api/sessions/:id/history` | セッション履歴 (query: `limit`) |

### AI 統合

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/ai/providers` | プロバイダ一覧 (`["mock", "openai"]`) |
| POST | `/api/ai/generate` | テキスト生成 (body: `{ provider, context }`) |
| POST | `/api/ai/paraphrase` | 言い換え (body: `{ text, style?, count?, tone?, emotion? }`) |

### 分析・デバッグ

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/analytics/sessions` | セッション統計 (query: `startDate`, `endDate`) |
| GET | `/api/debug/logs` | ログ取得 (query: `level`, `limit`) |

## ストレージ

- **インメモリ**: `Map<string, Model>`, `Map<string, Session>`
- 永続化なし (サーバー再起動で全データ消失)
- ログは直近500件を保持

## エラーレスポンス

```json
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Optional detailed error info"
}
```

### エラーコード

| Code | HTTP Status | 説明 |
|------|-------------|------|
| `INVALID_MODEL` | 400 | モデルデータが不正 |
| `MODEL_NOT_FOUND` | 404 | モデルが見つからない |
| `SESSION_NOT_FOUND` | 404 | セッションが見つからない |
| `SESSION_CREATION_FAILED` | 400 | セッション作成失敗 |
| `CHOICE_APPLICATION_FAILED` | 400 | 選択肢適用失敗 |
| `CHOICES_RETRIEVAL_FAILED` | 400 | 選択肢取得失敗 |
| `FILE_REQUIRED` | 400 | ファイルが必要 |
| `INVALID_FILE` | 400 | ファイル形式不正 |
| `UNSUPPORTED_FORMAT` | 400 | サポートされていないフォーマット |
| `API_KEY_REQUIRED` | 400 | OpenAI APIキーが必要 |
| `AI_GENERATION_FAILED` | 400 | AI生成失敗 |
| `AI_PARAPHRASE_FAILED` | 400 | AI言い換え失敗 |
| `TEXT_REQUIRED` | 400 | テキストが必要 |
| `INTERNAL_ERROR` | 500 | 内部エラー |

## AI プロバイダ

| Provider | 状態 | 認証 |
|----------|------|------|
| `mock` | 実装済み | 不要 |
| `openai` | 実装済み (fetch ベース) | `X-API-Key` or `Authorization: Bearer` ヘッダー |

## 未実装・検討事項

- [ ] 永続化層 (SQLite / ファイルベース)
- [ ] 認証・認可
- [ ] Rate limiting
- [ ] WebSocket (リアルタイム通知)
- [ ] `/api` と `/` の重複エンドポイント統合
