# 作業申し送り

## 最終更新

- **日時**: 2026-03-17
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: `484fd6a` (docs: CLAUDE.md DECISION LOG — Authoring axis switch + session 4 handoff)
- **origin/main**: 同期済み

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルを JSON 形式で定義し、TypeScript エンジンで実行、Web UI でプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  packages/backend/      # Express REST API (port 3001)
  packages/sdk-unity/    # Unity C# SDK (UPM パッケージ形式)
  packages/tests/        # C# ユニットテスト
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル + JSON スキーマ
  docs/                  # 仕様書・プラン・ガバナンス
```

### エンジンの公開 API (`@narrativegen/engine-ts`)

| エクスポート | 用途 |
| ----------- | ---- |
| `loadModel(data)` | JSON モデル読み込み + スキーマ/整合性検証 |
| `startSession(model)` | セッション開始 → SessionState |
| `getAvailableChoices(session, model)` | 現在ノードの選択可能な選択肢（条件評価済み） |
| `applyChoice(session, model, choiceId)` | 選択肢適用 → 新 SessionState |
| `serialize(session)` / `deserialize(payload)` | セッション永続化 |

### 組み込み条件/エフェクト型

**条件 (8種)**: `flag`, `resource`, `variable`（数値/文字列比較・演算）, `timeWindow`, `hasItem`, `and`, `or`, `not`
**エフェクト (7種)**: `setFlag`, `addResource`, `setVariable`, `modifyVariable`（数値演算）, `addItem`, `removeItem`, `goto`

### 原初ビジョン拡張 API

| モジュール | 用途 |
| ---------- | ---- |
| `entities.ts` | EntityDef + PropertyDef 階層、resolveProperty / getEntityProperties / getInheritanceChain |
| `template.ts` | Dynamic Text: `[entity.property]` / `{variable}` / `{?condition:text}` 展開 |
| `paraphrase.ts` | ConditionalVariant + match条件 + UsageHistory + buildParaphraseContext |
| `anomaly-detector.ts` | detectAnomaly / detectAllAnomalies (KnowledgeProfile ベース) |
| `character-knowledge.ts` | CharacterDef + findKnowledgeProfile + perceiveEntity |
| `description-tracker.ts` | DescriptionState: markDescribed / isDescribed / getUndescribedKeys |
| `event-entity.ts` | createEventEntity / hasEvent / createEventFromAnomaly |
| `conversation-templates.ts` | ConversationTemplate: trigger matching + priority + maxUses |

詳細は `docs/specs/` 配下の各仕様書を参照。

## 現在の状態

### CI・テスト

- **engine-ts**: 198 テスト全合格 (17 ファイル)
- **web-tester**: Vite ビルド成功
- **E2E**: 44 件 (entity-panel 11件 + template-panel 10件 含む)
- **モデル検証**: 12 モデル通過

### 仕様書

- **spec-index.json**: 31 エントリ
- **done**: 30 件
- **partial**: 1 件 (SP-UNITY-001 Unity SDK 85%)
- 原初ビジョン全8スペック完了 (SP-PROP-001 ~ SP-DYNAMIC-001 + SP-EVENT-001)

### 直近完了 (session 4, 2026-03-17)

- 原初ビジョン コア実装 全8件完了
- Authoring体験逆算スライス完了:
  - Entity定義パネル (CRUD + inline edit + 11 E2E)
  - ConversationTemplate GUI (Phase 4完了 + 10 E2E)
  - Dynamic Text プレビュー (Live Preview expand Template)
  - createEvent properties GUI
  - テストモデル4件配置 (property/event/integration/inventory)

## 既知の課題

- GUI Undo/Redo 手動回帰テスト未実施
- Yarn Spinner 実運用検証未実施
- Technical Debt (SP-009) 80% — CI統合・a11y・手動回帰が残
- Unity SDK パリティ未完 (TS側7機能の移植)

## 次の推奨作業

1. **Unity SDK パリティ**: TS側7機能 (Entity-Property, Template, Anomaly, Knowledge, Event, Description, ConversationTemplate) の C# 移植
2. **ライター向けオーサリングガイド / サンプルストーリー**: 原初ビジョン機能を使った実用例
3. **Tech Debt 残消化**: CI spec-index/encoding check 統合、手動回帰テスト
4. **[entity~prop_pool] 構文**: DescriptionState統合による重複回避テキスト生成

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run build:engine
npm run test:engine
npm run build:tester
npm run dev
# → http://localhost:5173/
```

---

技術的負債: `docs/TECHNICAL_DEBT.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）
