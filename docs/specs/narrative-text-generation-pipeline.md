# SP-TGEN-001: Narrative Text Generation Pipeline（文章生成の単一設計）

**Status**: partial | **Pct**: 85 | **Cat**: core

## 1. 目的

「文章生成」という語が指す処理が複数あり、仕様と実装が断片化していた状態を整理する。**プレイヤーが読む最終テキストを、モデルとセッションからどの順序で組み立てるか**を、プロジェクト内の正史（SSoT）として一本化する。

## 2. 推奨対応（項目1）の結論: 主対象の優先順位

| 優先 | 名称 | 説明 | 本ドキュメントでの扱い |
|------|------|------|------------------------|
| **1（主）** | **ランタイム文章合成** | プレイ／プレビュー時に、ノード本文・テンプレート・状態を **決定論的** に合成して表示するパイプライン | **ここを「連続したテキスト生成アルゴリズム」の中心**と定義する |
| 2 | オーサリング支援（AI） | 未記述ノードの下書き、LLM による提案 | パイプラインの**外**。モデル JSON を書き換えるか提案のみ。再現性はモデル／プロンプト／API に依存 |
| 3 | 表現バリアント | 言い換え・文体・同義語（非 AI / AI） | **表示パイプラインに含めない**（編集操作として別レイヤー） |

## 3. 原初着想との対応（チーズバーガー例）

最古の設計思想は `docs/archive/legacy-specs/ORIGINAL_DESIGN_PHILOSOPHY.md` に断片的に記載されている。**Entity 中心・プロパティ駆動**であり、階層継承の例として次が用いられる。

- カテゴリ: 携帯食料 → コモン: マックのチーズバーガー → インスタンス: 誰々が食べていた…
- 各段で **重さ・大きさなどのプロパティ**が上書きされ、**表示時に解決された値**として物語に現れる

### 3.1 現行実装への写像

| 原初の概念 | 現行の実装・仕様 |
|------------|------------------|
| Entity と Property | SP-PROP-001（`resolveProperty` / `getEntityProperties`） |
| 表示時にプロパティ値を文字列へ | SP-TEXT-001 の `[entity_id]` / `[entity_id.property]`（`expandTemplate`） |
| セッション依存の値 | `{variable}` / `{?条件:…}`（同一 `expandTemplate` 内） |
| 動的事象の反映 | `session.events` 経由の Entity 参照、SP-EVENT-001 |
| 描写の重複回避 | SP-DESC-001、`expandTemplateWithTracking` の `[entity~]` |
| 事象に応じた挿入文 | SP-DYNAMIC-001、`findMatchingTemplates` |

**要点**: 原初の「1つの再帰的な構文エンジン（遡行・辞書引き）」は `ORIGINAL_SYNTAX_ENGINE_SPECIFICATION.md` に詳述があるが、**現行コードの中核は `expandTemplate` 族とテンプレートマッチング**である。記号 `[]` / `{}` の意味は原初の入れ子構文と**完全には一致しない**（SP-TEXT-001 を正とする）。

## 4. ノーマティブ: ランタイム連続パイプライン（段階定義）

プレイヤー向けに「このノードで見せる本文」を得るときの **論理順序**を次のとおり定める。実装は複数ファイルに分散していてよいが、**新規実装・リファクタはこの順序に合わせる**。

```
[入力] NodeDef.text（および必要ならメタ）
  ↓
段階 0（移行用・著者向け表記）
  レガシーな {flag:key} / {resource:key} / {variable:key} / {nodeId} / {time} 形式の置換
  ※ 実装は `template.ts` の `applyLegacySessionPlaceholders`。`expandTemplate` / `expandTemplateWithTracking` の先頭で一度だけ適用。
  ※ `resolveNarrativeDisplayText*` は entities/events が無いとき段階0のみ、あるときは段階0のあと `expandTemplateCore` を呼び二重適用はない。
  ↓
段階 1 — コア展開（追跡なし API）
  expandTemplate(text, model, session) = 段階0 + expandTemplateCore
  - {?…} 条件節
  - [entity…]（静的 Entity + session.events）
  - {session 変数・フラグ・リソース}
  ↓
段階 1+2 — コア展開（追跡あり）
  expandTemplateWithTracking: 段階0 → [entity~] → expandTemplateCore
  - `resolveNarrativeDisplayTextTracked` が上記を利用し、DescriptionState を入出力（Web は `AppState.descriptionState`）
  ↓
段階 3 — 会話テンプレート挿入
  findMatchingTemplates → 各 hit の text は **既に** expandTemplate 済み（テンプレート側）
  - 本文への **結合順・区切り**（前後に連結するか、別ブロックか）はプロダクト規約で統一する
  ↓
[出力] 画面上の最終文字列
```

### 4.1 段階 3 の結合（現状の事実）

`resolveNarrativeDisplayText` / `resolveNarrativeDisplayTextTracked` のいずれも、コア展開の後にマッチしたテンプレートの `expandedText` を **空白区切りで末尾連結**する。Web Tester の `resolveVariables` は **第4引数に `AppState` を渡したとき** `resolveNarrativeDisplayTextTracked` を使い、`descriptionState` を更新する（プレイ本線・`StoryManager`）。GUI プレビューは `resolveNarrativeDisplayText` と `appendConversationTemplates: false` で段階 3 を省略。別 UI（段落分け等）にする場合は本節を更新する。

新規プレイ開始時は `startNewSession` から登録されたフックで `AppState.resetDescriptionTracking()` が呼ばれ、`DescriptionState` がクリアされる。

### 4.2 明示的にパイプライン外とするもの

- **paraphraseJa / chooseParaphrase**（SP-PARA-001）: エディタ操作・オフライン生成。表示ループに組み込まない。
- **AIProvider.generateNextNode**（SP-006）: グラフ編集支援。セッション表示の入力とは別。
- **推論エンジン**（SP-INF-001）: 条件の真偽・到達可能性。本文の字句生成とは別責務。

## 5. 将来フェーズ（非ノーマティブ）: 原初の再帰構文エンジン

`ORIGINAL_SYNTAX_ENGINE_SPECIFICATION.md` の「具体性の遡行」「辞書完全一致→部分一致」などは **現行ランタイムには未実装**である。採用する場合は次を満たす別仕様として再起票する。

- `expandTemplate` の `[]` 意味との **後方互換またはマイグレーション**
- 最大深度・循環・翻訳単位（文単位原則）の **テスト可能な定義**

それまでは本 SP のノーマティブは **4 章の段階モデル**に限る。

## 6. 実装参照（索引）

| 段階・要素 | 主なコード |
|------------|------------|
| **ランタイム合成（段階 0〜3、追跡なし）** | `resolveNarrativeDisplayText` — `narrative-display-text.ts`（段階0 + `expandTemplateCore`） |
| **ランタイム合成（段階 0〜3 + 段階2）** | `resolveNarrativeDisplayTextTracked` — 同上 + `expandTemplateWithTracking` |
| 段階 0 | `applyLegacySessionPlaceholders` — `template.ts`（`expandTemplate` に内包） |
| 段階 1 / 2 コア | `expandTemplateCore` / `expandTemplate` / `expandTemplateWithTracking` — `template.ts` |
| 段階 3 マッチング | `findMatchingTemplates` — `conversation-templates.ts` |
| Web Tester 本線 | `session-controller.js` の `resolveVariables(…, appState)`、`core/session.js` の `registerNewPlaySessionHook` |
| `DescriptionState` 保持 | `core/state.js` の `AppState` |
| GUI プレビュー（段階 3 オフ・追跡なし） | `node-renderer.js`、`gui-editor.js` |
| AI 下書き | `packages/engine-ts/src/ai-provider.ts`、`apps/web-tester/src/ui/ai.js` |

### 6.1 API メモ

- `resolveNarrativeDisplayText(rawText, model, session, options?)`
  - `appendConversationTemplates`: 既定 `true`。`false` のとき段階 3 をスキップ（エディタプレビュー用）。
- `resolveNarrativeDisplayTextTracked(rawText, model, session, options?)` → `{ text, descriptionState }`
  - `descriptionState` / `descriptionSeed`: 段階2（`[entity~]`）。
  - `appendConversationTemplates`: 上に同じ。

### 6.2 開発体験

- `@narrativegen/engine-ts` の `prepare` で `npm install` 時に `dist` を生成（ルート README 参照）。

## 7. 既知ギャップ（Pct が partial の理由）

1. **著者向け表記の併存**: レガシー `{flag:…}` 等と `{name}` 形式はモデル上併存しうる。ランタイムは `template.ts` で段階0→段階1の単一順序。**コードパス上の二重適用は解消済み**（`expandTemplate` 直前とコア内での重複なし）。
2. **`Undo` / セーブと `DescriptionState`（Web Tester）**: **解消済み**。`pushHistory` と同タイミングで `AppState` に `descriptionState` スナップショットを積み、プレイ Undo（PlayRenderer 本線・レガシー選択肢）で `pop` して復元する。localStorage セッションはスキーマ **1.1.0**（`descriptionState` 付き）で保存し、**1.0.0** 読込時は `descriptionState` 欠落を `{}` とみなす。スロット／オートセーブ（`SaveManager`）も `descriptionState` を含む（バージョン 1.1）。
3. **`model.metadata` の `{…}` 置換**: 本 API に未搭載（本線で未使用のため）。
4. **Unity C#**: **部分移植** — `NarrativeText.ExpandTemplate` で段階0+コア（`[entity]` 基本形・`{?}`・`{}`）まで。`session.events`、`[entity~]`、会話テンプレートは未着手（[unity-sdk.md](unity-sdk.md) 参照）。

## 8. 関連仕様

- SP-TEXT-001: `dynamic-text-engine.md`
- SP-DYNAMIC-001: `dynamic-story-expansion.md`
- SP-DESC-001: `description-tracker.md`
- SP-006: `docs/ai-features.md`
- 原初資料（参照用）: `docs/archive/legacy-specs/ORIGINAL_DESIGN_PHILOSOPHY.md`、`ORIGINAL_SYNTAX_ENGINE_SPECIFICATION.md`
