# REPORT: TASK_104 AI UX 改善（採用ボタン）

- Task: `docs/tasks/TASK_104_AI_UX_Improvement.md`
- Report: `docs/inbox/REPORT_TASK104_AI_UX_Adopt_Button_20260212.md`
- Tier: 2

## 目的

- AI 生成/言い換え結果に「採用」ボタンを実装し、結果を選択中ノードへ反映できるようにする
- 直近のAI結果を簡易履歴（直近5件）として保持・表示する
- 文言/設定/パラメータのハードコードを避け、設定ファイルへ外部化する

## 実装概要

- **結果UI**
  - 生成結果/言い換え結果を `#aiOutput` に構造化表示し、各結果に「採用」ボタンを付与
  - 履歴表示領域 `#aiHistory` を追加
- **採用（ノード反映）**
  - 「採用」押下で `model.nodes[session.state.nodeId].text` を更新
  - GUI編集モードが開いている場合は `textarea[data-node-id][data-field="text"]` の値も同期
- **履歴**
  - `localStorage` にAI結果履歴を保存
  - 直近 `AI_UX_CONFIG.historyLimit` 件を表示
- **データ外部化**
  - 文言/保存キー/履歴件数/言い換えオプションなどを `apps/web-tester/utils/ai-ux-config.js` に集約

## 変更ファイル

- `apps/web-tester/index.html`
  - `#aiHistory` 追加
  - 最低限のUIスタイル（結果アクション/履歴カード等）追加
- `apps/web-tester/utils/ai-ux-config.js`
  - AI UX向け設定・文言・保存キー・パラメータを集約
- `apps/web-tester/handlers/ai-config.js`
  - 結果レンダリング（採用ボタン/履歴）
  - 選択中ノードへの適用処理
  - AI操作（生成/言い換え）呼び出し
- `apps/web-tester/handlers/ai-handler.js`
  - AIプロバイダ初期化/生成/言い換えをUI非依存の関数として整理（`ai-config.js` から利用）

## 動作確認

### ビルド

- `npm ci`
- `npm run build -w @narrativegen/engine-ts`
- `npm run build -w @narrativegen/web-tester`

### 手動テスト（主要パス）

1. Web testerを起動（例: `npm run dev -w @narrativegen/web-tester`）
2. モデルを読み込み、任意のノードを選択
3. AIタブで「生成」または「言い換え」を実行
4. 表示された結果の「採用」を押下
5. 選択中ノードの `text` が更新されること
6. GUI編集モードが開いている場合、該当textareaにも反映されること
7. `履歴` に結果が追加され、直近5件でローテーションされること

## 補足

- `@narrativegen/engine-ts` の `dist/browser.js` が存在しない場合、先に `npm run build -w @narrativegen/engine-ts` が必要です。
