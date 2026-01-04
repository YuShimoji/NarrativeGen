# NarrativeGen Web Tester OpenSpec

最終更新: 2025-12-13
更新者: Cascade (AIエージェント)

---

## 1. 目的とスコープ

NarrativeGen Web Tester は、`engine-ts` が提供する物語エンジンをブラウザ上で検証・デバッグするためのライター向けツールです。

- **目的**
  - JSON / CSV ベースのモデルを読み込み、ストーリー進行やフラグ・リソース変化を確認する
  - ノード/選択肢を GUI ベースで編集し、再度テストできるようにする
  - 将来的な Unity / 本番クライアントの挙動を事前に検証する

- **スコープに含まれるもの**
  - Web Tester UI (ストーリー/グラフ/デバッグ/AI/GUIエディタ)
  - CSV インポート/エクスポート
  - AI 補助 (言い換え・次ノード案生成)
  - セーブ/ロード、オートセーブ

- **スコープ外**
  - 本番 API サーバ (これは `openapi-spec.json` に記述された将来の構想)
  - Unity クライアント実装

関連: `openapi-spec.json` は NarrativeGen API の OpenAPI 仕様であり、本 OpenSpec の対象外とする。

---

## 2. 関連ドキュメント

- `docs/WEB_TESTER_REFACTORING.md`
  - Web Tester のモジュール分割方針とリファクタリング計画
- `docs/DESIGN_IMPROVEMENTS_SPEC.md`
  - UI/UX デザイン改善案 (カラー/レイアウト/グラフ/効率化機能など)
- `docs/UI_IMPROVEMENTS_TEST.md`
  - UI 改善に関するテスト観点と手順
- `docs/NEXT_PHASE_PROPOSAL.md`
  - Mermaid 風グラフエディタ等、今後のフェーズ提案
- `docs/architecture.md`
  - プロジェクト全体アーキテクチャとエンジン API の概要
- `docs/HANDOVER_2025-11-12.md`
  - 2025-11-12 時点の申し送りと未完了タスク

本 OpenSpec はこれらのドキュメントの「索引」として機能し、**Web Tester の現状と計画のスナップショット**を提供する。

---

## 3. 現在の主要機能と実装ステータス

### 3.1 ストーリー再生・モデル管理

| 機能 | 状態 | 備考 |
|------|------|------|
| サンプルモデル選択 (`linear.json` など) からのセッション開始 | 実装済 | `startBtn` 押下 → モデルロード → `startSession` → `renderState/Choices/Story` |
| JSON ファイル選択 / DnD でのモデル読み込み | 実装済 | `uploadBtn` / `fileInput` / `dropZone` 経由。バリデーションエラーは `errorPanel` + `setStatus` 表示 |
| JSON ダウンロード (トップバー `JSON保存`) | 実装済 | 現在の `appState.model` をダウンロード |
| ストーリー進行 (選択肢クリック) | 実装済 | `getAvailableChoices` / `applyChoice` を利用 |
| ストーリーログ表示 + 簡易仮想スクロール | 実装済 | 一定件数超過で古いログを折り畳み |
| Debug パネル (フラグ/リソース/変数/セーブスロット) | 実装済 | セーブ/ロード/オートセーブ UI を含む |

### 3.2 UI/レイアウト・テーマ・ステータス

| 機能 | 状態 | 備考 |
|------|------|------|
| タブレイアウト (ストーリー/ノードグラフ/デバッグ/リファレンス/アドバンスド) | 実装済 | クリックイベント実装済 (`UI_IMPROVEMENTS_TEST.md` 参照) |
| ノードグラフ表示 (D3 ベース) | 実装済 | ノード位置・到達可能性可視化。詳細カスタマイズは今後拡張余地あり |
| テーマ/カラーパレット切替 | 実装済 | `ThemeManager` + パレットモーダル。トースト/ステータス連携 |
| ステータスバー (`statusText`) のメッセージ表示 | 実装済 | `setStatus(message, type)` に集約。`type` に応じた背景色 |
| ステータスアイコン表示 | 実装済 | `icon-status-info/success/warn/error` を使用し、メッセージの左に表示 |
| 初期化ステータス | 実装済 | 起動完了時に `setStatus('初期化完了 - モデルを読み込んでください', 'info')` を実行し、永続的な「初期化中...」を解消 |

### 3.3 GUI エディタ (ノード/選択肢編集)

現行実装は `src/ui/gui-editor.js` の `GuiEditorManager` を中心とする。旧 `handlers/gui-editor.js` の一部機能は未移植。

| 機能 | 状態 | 備考 |
|------|------|------|
| ノード一覧の GUI 編集 (テキスト編集・選択肢編集) | 実装済 | ノードごとのエディタカード + 選択肢編集 UI |
| ノード追加 (GUIモード) | 実装済 | クイックノード作成モーダル + ボタンから実行 |
| 選択肢追加/削除 | 実装済 | 各ノードの「選択肢を追加」「削除」ボタン |
| GUI 編集結果の保存/キャンセル | 実装済 | `保存` でモデル反映＋再バリデーション、`キャンセル` はモード終了のみ (元モデルへのロールバックは未実装) |
| クイックノード作成 (テンプレート) | 実装済(要テスト) | テンプレート + 自動ID生成 |
| 選択肢一括編集 (条件/効果テキストの一括付与) | 実装済(簡易版) | 条件/効果は文字列/構造化objectの両方に対応。複合条件(and/or/not)等は raw(JSON) として保持 |
| ノードIDリネーム + 参照更新 | 実装済 | `GuiEditorManager.renameNodeId` で `startNode` / `choices.target` / `metadata.nodeOrder` を一括更新 |
| ノード/選択肢 DnD 並べ替え | 実装済(要テスト) | GUI 上の並べ替えは実装済。ノード並べ替え時は `metadata.nodeOrder` も更新される |
| 条件/効果/アウトカムの専用GUI編集 | 部分実装 | 基本的な条件/効果は構造化フォーム対応。未対応形式は raw(JSON) として保持。アウトカムは今後の改善対象 |
| GUI 編集中ドラフトの自動保存 | 実装済 | `draft_model` に保存。復元導線は簡易ダイアログのみで、専用UIは未整備 |

### 3.4 CSV / AI / キーバインド

| 機能 | 状態 | 備考 |
|------|------|------|
| CSV インポート (プレビュー付き) | 実装済 | プレビュー後にインポート実行 (`showCsvPreview` + `safeImportCsv`) |
| CSV エクスポート | 実装済 | モデル → CSV 変換・ダウンロード |
| AI プロバイダ設定 (Mock/OpenAI/Ollama) | 実装済(要実環境テスト) | APIキーやURL設定 UI あり |
| AI による次ノード案生成・言い換え | 実装済(要実環境テスト) | 失敗時はエラーメッセージ + ログ |
| キーバインド (s/g/d/a など) | 実装済 | 設定 UI + localStorage 保存。重複キー検証あり |
| 高度なショートカット (Ctrl+Z 等) | 未実装 | `NEXT_PHASE_PROPOSAL.md` の将来計画 |

---

## 4. 条件システム

Web Tester は、エンジン (`engine-ts`) が提供する条件システムを完全にサポートしています。選択肢の表示可否を制御するために、以下の条件タイプを使用できます。

### 4.1 条件の種類

#### フラグ条件 (`flag`)

フラグの真偽値をチェックします。

- **形式**: `{ type: 'flag', key: string, value: boolean }`
- **評価ロジック**: `flags[key] === value` (未定義の場合は `false` として扱う)
- **使用例**:
  ```json
  { "type": "flag", "key": "hasKey", "value": true }
  ```
  - フラグ `hasKey` が `true` の場合に条件を満たします

#### リソース条件 (`resource`)

リソースの数値を比較演算子でチェックします。

- **形式**: `{ type: 'resource', key: string, op: '>=' | '<=' | '>' | '<' | '==', value: number }`
- **評価ロジック**: `resources[key] ?? 0` と `value` を `op` で比較 (未定義の場合は `0` として扱う)
- **使用例**:
  ```json
  { "type": "resource", "key": "gold", "op": ">=", "value": 50 }
  ```
  - リソース `gold` が 50 以上の場合に条件を満たします

#### 変数条件 (`variable`)

変数の文字列値を比較演算子でチェックします。

- **形式**: `{ type: 'variable', key: string, op: '==' | '!=' | 'contains' | '!contains', value: string }`
- **評価ロジック**: 
  - `==`: `variables[key] ?? '' === value`
  - `!=`: `variables[key] ?? '' !== value`
  - `contains`: `(variables[key] ?? '').includes(value)`
  - `!contains`: `!(variables[key] ?? '').includes(value)`
- **使用例**:
  ```json
  { "type": "variable", "key": "playerClass", "op": "contains", "value": "warrior" }
  ```
  - 変数 `playerClass` に "warrior" が含まれる場合に条件を満たします

#### 時間ウィンドウ条件 (`timeWindow`)

現在の時間が指定された範囲内にあるかをチェックします。

- **形式**: `{ type: 'timeWindow', start: number, end: number }`
- **評価ロジック**: `time >= start && time <= end` (両端を含む、inclusive)
- **使用例**:
  ```json
  { "type": "timeWindow", "start": 5, "end": 10 }
  ```
  - 現在の時間が 5 以上 10 以下（両端を含む）の場合に条件を満たします
  - 例: 時間が 5, 6, 7, 8, 9, 10 のいずれかの場合に条件を満たします

### 4.2 複合条件

複数の条件を組み合わせることができます。

#### AND条件 (`and`)

すべての条件が満たされる必要があります。

- **形式**: `{ type: 'and', conditions: Condition[] }`
- **評価ロジック**: すべての `conditions` が `true` を返す場合に `true`
- **使用例**:
  ```json
  {
    "type": "and",
    "conditions": [
      { "type": "flag", "key": "hasKey", "value": true },
      { "type": "resource", "key": "hp", "op": ">", "value": 0 }
    ]
  }
  ```

#### OR条件 (`or`)

いずれかの条件が満たされれば十分です。

- **形式**: `{ type: 'or', conditions: Condition[] }`
- **評価ロジック**: いずれかの `conditions` が `true` を返す場合に `true`
- **使用例**:
  ```json
  {
    "type": "or",
    "conditions": [
      { "type": "flag", "key": "hasSword", "value": true },
      { "type": "flag", "key": "hasBow", "value": true }
    ]
  }
  ```

#### NOT条件 (`not`)

条件の結果を反転します。

- **形式**: `{ type: 'not', condition: Condition }`
- **評価ロジック**: `condition` の結果を反転
- **使用例**:
  ```json
  {
    "type": "not",
    "condition": { "type": "flag", "key": "isDead", "value": true }
  }
  ```

### 4.3 条件の使用例

#### 例1: 時間ゲート付き選択肢

```json
{
  "id": "visitMarket",
  "text": "市場に行く（時間: 5-10）",
  "target": "market",
  "conditions": [
    { "type": "timeWindow", "start": 5, "end": 10 }
  ]
}
```

#### 例2: 複合条件（フラグ + リソース + 時間ウィンドウ）

```json
{
  "id": "specialEvent",
  "text": "特別イベントに参加",
  "target": "event",
  "conditions": [
    {
      "type": "and",
      "conditions": [
        { "type": "flag", "key": "hasTicket", "value": true },
        { "type": "resource", "key": "gold", "op": ">=", "value": 100 },
        { "type": "timeWindow", "start": 8, "end": 12 }
      ]
    }
  ]
}
```

この例では、以下のすべての条件を満たす必要があります：
- フラグ `hasTicket` が `true`
- リソース `gold` が 100 以上
- 現在の時間が 8 以上 12 以下（両端を含む）

### 4.4 GUI エディタでの条件編集

GUI エディタ (`src/ui/condition-effect-editor.js`) では、以下の形式で条件を編集できます：

- **構造化フォーム**: 各条件タイプに対応した入力フィールド
- **文字列形式**: CSV インポート時などに使用される文字列形式
  - `flag:key=true`
  - `resource:key>=100`
  - `variable:key==value`
  - `timeWindow:5-10` または `time:5-10`

GUI エディタは、文字列形式とオブジェクト形式の両方をサポートし、エンジンが期待する形式（オブジェクト形式）に自動変換します。

---

## 5. 既知のギャップ・今後の優先課題

### 4.1 GUI エディタ周りのギャップ

1. **ノードIDリネーム + 参照更新**
   - 影響範囲: `choices.target`, `startNode`, `metadata.nodeOrder` など
   - 現状: 対応済み (`GuiEditorManager.renameNodeId`)
   - 対応方針: 回帰観点の手動テストを継続

2. **ノード/選択肢 DnD 並べ替えの検証**
   - 影響範囲: ノード一覧 (`metadata.nodeOrder`)、同一ノード内の選択肢順
   - 現状: GUI 上の並べ替え（DnD）自体は実装済み。ノード並べ替え時は `metadata.nodeOrder` も更新される
   - 対応方針:
     - モデルエクスポート時に順序が意図通り保たれることを手動テストで確認

3. **条件/効果/アウトカムの構造化 GUI 編集**
   - 現状: 基本的な条件/効果は構造化フォーム対応。未対応形式は raw(JSON) として保持
   - 対応方針: 複合条件(and/or/not)のフォーム対応やアウトカム拡張を段階的に導入

4. **ドラフト復元 UX**
   - 現状: 起動時にダイアログで復元確認するのみ
   - 対応方針: ステータスバーや専用ボタンから「ドラフトを再読込」できる導線を追加

### 4.2 グラフ/検証ツール

- Mermaid 風グラフエディタ (自動レイアウト + DnD)
- 到達不能ノード検出、参照切れ検出などの検証レポート
- ノード検索/フィルタ (タグ・テキスト・条件等)

これらは `NEXT_PHASE_PROPOSAL.md` に詳細案があり、Phase 2 以降での実装を想定。

---

## 6. バックログ (抜粋)

以下は、主に Web Tester / GUI エディタに関する今後のバックログです。優先度は状況に応じて調整してください。

- **高優先度**
  - ノードIDリネーム + 参照更新 (対応済み)
  - ノード/選択肢 DnD 並べ替え
  - GUI 条件/効果エディタ (最小限の構造化フォーム)
  - ドラフト復元 UI

- **中優先度**
  - グラフエディタの拡張 (条件表示、プリセット保存の強化)
  - モデル検証レポート (参照切れ・到達不能ノード一覧)
  - JSON エディタ周りの UX 改善 (整形・差分・検証)

- **低優先度**
  - 高度なショートカット (Undo/Redo 等)
  - バージョン管理・履歴表示との連携
  - 大規模モデル向けパフォーマンス最適化 (さらなる仮想スクロール/遅延ロード)

---

## 7. テストと受け入れ基準 (抜粋)

詳細なテスト手順は `UI_IMPROVEMENTS_TEST.md` および `PHASE1_TEST_GUIDE.md` を参照。ここでは Web Tester 全体としての受け入れ基準を簡潔にまとめる。

- サンプルモデル各種がエラーなく読み込み・実行できること
- ストーリー/グラフ/デバッグ/AI タブ間の遷移が安定していること
- GUI エディタで編集したモデルを JSON として保存し、再読み込みしても挙動が一貫していること
- CSV インポート/エクスポートが往復で情報を失わないこと (条件/効果などの形式は現行仕様の範囲内)
- 致命的エラー発生時、ステータスバーまたはエラーパネルにメッセージが表示されること

今後の変更時には、本 OpenSpec と関連ドキュメントを更新し、「何がどこまで実装されたか」を常に同期させることを推奨する。
