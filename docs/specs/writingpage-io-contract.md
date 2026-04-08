# WritingPage I/O Contract (Preparation Spec)

Status: draft-ready (implementation gated)  
Date: 2026-04-08

## 目的

WritingPage 連携を実装する前に、最小契約と非互換時挙動を固定して手戻りを抑える。

## スコープ

- 本書は「契約定義」のみ。実装は含まない。
- NarrativeGen <-> WritingPage のテキスト受け渡しを対象とする。

## 最小 I/O 契約

### Input (WritingPage -> NarrativeGen)

- `contractVersion` (string, required): 例 `wp-ng-0.1`
- `sourceDocumentId` (string, required)
- `nodes` (array, required)
  - `nodeId` (string, required)
  - `text` (string, required)
  - `updatedAt` (string, optional, ISO-8601)

### Output (NarrativeGen -> WritingPage)

- `contractVersion` (string, required)
- `modelId` (string, required)
- `nodes` (array, required)
  - `nodeId` (string, required)
  - `text` (string, required)
  - `speaker` (string, optional)

## versioning ルール

- `major.minor` 形式を採用する（例: `0.1`）。
- `major` が異なる場合は互換なしとして取り込みを拒否する。
- `minor` が異なる場合は互換ありとみなし、未知フィールドは無視する。

## 非互換時の挙動

- 互換なし入力（major 不一致）:
  - 取り込みを中止
  - エラーメッセージに期待バージョンと受信バージョンを表示
- 必須フィールド欠落:
  - 取り込みを中止
  - 欠落フィールド名を明示
- ノード重複:
  - 後勝ちではなくエラー扱いにする

## 実装着手ゲート

次の条件を満たすまで本実装を開始しない。

1. WritingPage 側フォーマットが 2 週間以上安定している
2. 本契約に対して双方で合意済み
3. 受け渡しサンプル（正常系/異常系）を最低 3 ケース用意済み
4. SP-PLAY-001 人的確認が `Ready` から `Pass/Fail` へ更新済み

## 関連

- `docs/specs/pipeline-workflow.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/plans/ROADMAP_EXECUTION_2026.md`
