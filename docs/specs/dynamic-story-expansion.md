# SP-DYNAMIC-001: Dynamic Story Expansion

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

蓄積された事象 Entity を参照して、後続のノードテキストや選択肢を動的に変化させる仕組み。原初ビジョン (ORIGINAL_DESIGN_PHILOSOPHY.md 5.3) の段階的実装。

## 設計方針: 案D (A+B ハイブリッド)

- **案A (テンプレート駆動)**: ライターが `{?event:text}` + `[event.property]` で手書き。既に動作する
- **案B (テンプレートプール + マッチング)**: 高頻度パターンを conversationTemplates として定義し、実行時に自動挿入
- AI 連携は将来の差し替え箇所整備まで保留

## 責務分離 (3層)

### 層1: コア状態 (SessionState)

| 担当 | 責務 | 出力 |
|------|------|------|
| flags / resources / variables | ゲームの進行状態 | boolean / number / string |
| inventory | アイテム所持 | string[] |
| events | 事象 Entity の蓄積 | Record<string, EntityDef> |

DescriptionState は **ここに含めない**。独立管理。

### 層2: 表示状態 (独立管理)

| 担当 | 責務 | 出力 |
|------|------|------|
| DescriptionState | Entity の描写履歴 | 「未使用属性の選択」まで |
| expandTemplate | テキスト内の参照展開 | 文字列置換 |

文体・表現の選択はテンプレート側の責務。DescriptionState は「何を使ったか」のみ追跡。

### 層3: 物語挿入機構 (案B, 専用レイヤー)

| 担当 | 責務 | 出力 |
|------|------|------|
| ConversationTemplate | パターン定義 | trigger + text テンプレート |
| TemplateMatchingEngine | 事象Entity × テンプレートのマッチング | 挿入すべきテキスト群 |

コア状態 (層1) と表示状態 (層2) に **依存するが混入しない**。

## データモデル (案B)

### ConversationTemplate

```typescript
interface ConversationTemplate {
  id: string
  /** マッチング条件: 事象Entity のプロパティを参照 */
  trigger: TemplateTrigger
  /** 挿入テキスト ([event.property] 展開可能) */
  text: string
  /** 挿入位置: このノードIDの後に挿入 (省略時は任意) */
  insertContext?: string
  /** 優先度 (高い方が先にマッチ) */
  priority?: number
  /** 同一テンプレートの再利用回数上限 (省略=無制限) */
  maxUses?: number
}

interface TemplateTrigger {
  /** 必須: 事象Entity のタイプまたはプロパティ条件 */
  eventMatch: EventMatchCondition
  /** オプション: 追加のセッション状態条件 */
  sessionConditions?: Condition[]
}

interface EventMatchCondition {
  /** 事象Entity にこのプロパティが存在し、値が条件を満たす */
  propertyChecks: Array<{
    key: string
    op: '>=' | '<=' | '>' | '<' | '==' | '!='
    value: string | number | boolean
  }>
}
```

### Model 拡張

```typescript
interface Model {
  // 既存フィールド...
  conversationTemplates?: ConversationTemplate[]
}
```

## API

### 案A (既存機能で動作)

```
ノードテキスト: "{?blamed_event:You recall [blamed_event]. Severity was [blamed_event.severity].}"
```

追加実装なし。expandTemplate + hasEvent 条件で既に使用可能。

### 案B (新規実装)

```typescript
/**
 * 現在のセッション状態に基づいて、マッチするテンプレートを検索。
 * マッチした結果を expandTemplate で展開して返す。
 */
function findMatchingTemplates(
  templates: ConversationTemplate[],
  session: SessionState,
  model: Model,
  usageState?: TemplateUsageState
): ExpandedTemplate[]

interface ExpandedTemplate {
  templateId: string
  expandedText: string
  insertContext?: string
}

/** テンプレート使用回数の追跡 (DescriptionState と同様、独立管理) */
type TemplateUsageState = Record<string, number>
```

## Phase 分割

### Phase 1: 案A 検証 + ドキュメント (実装済み)

- `{?event_id:text}` + `[event.property]` で事象参照 → 既に動作
- 責務分離ドキュメント (本仕様書)

### Phase 2: ConversationTemplate データモデル + マッチングエンジン

- ConversationTemplate 型定義
- findMatchingTemplates 関数
- TemplateUsageState (独立管理)
- ユニットテスト

### Phase 3: Model スキーマ + Web Tester 統合

- playthrough.schema.json に conversationTemplates 追加
- Web Tester のストーリー表示で自動挿入呼び出し

### Phase 4: GUI エディタ (将来)

- ConversationTemplate の編集UI

## 受け入れ条件

### Phase 2

1. ConversationTemplate のプロパティ条件マッチングが正しく動作する
2. priority による優先度制御が機能する
3. maxUses による再利用制限が機能する
4. TemplateUsageState が独立管理されている
5. 既存の 10+ モデルが修正なしで検証合格 (conversationTemplates はオプション)

## 将来の AI 差し替え箇所

案B の `findMatchingTemplates` の結果に対して:
- AI が `expandedText` をさらに自然な文に書き換える
- AI が trigger 条件に基づいて新しいテンプレートを提案する

差し替え箇所は `findMatchingTemplates` の出力パイプライン末端に位置する。
