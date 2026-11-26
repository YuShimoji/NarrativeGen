# WritingPage I/O Contract (Preparation Spec)

Status: implemented 0.2（2026-11-26のuserの依頼でゲートを再判定し実装。下のゲート判定ログ）
Date: 2026-04-08（ゲート更新: 2026-04-09、2026-11-26）

## 目的

WritingPage 連携を実装する前に、最小契約と非互換時挙動を固定して手戻りを抑える。

## スコープ

- NarrativeGen <-> WritingPage のテキスト受け渡しを対象とする。画面の見せ方は[SP-SCREEN-001 画面フレーム](screen-frame.md)が決める。
- 実装: NarrativeGen `packages/engine-ts/src/writingpage-contract.ts`（`modelFromWritingPage`・`modelToWritingPage`・`validateWritingPageInput`）。
  WritingPage `js/modules/narrative/NarrativeScreenBridge.js`（`projectToContract`・`contractToProject`・`framesToMarkdown`）。
- 受け渡しサンプル: [docs/samples/writingpage/](../samples/writingpage/README.md)（正常2・異常3）。

## 最小 I/O 契約

### Input (WritingPage -> NarrativeGen)

- `contractVersion` (string, required): 現行 `wp-ng-0.2`（`wp-ng-0.1` も受け付ける）
- `sourceDocumentId` (string, required)
- `nodes` (array, required)
  - `nodeId` (string, required)
  - `text` (string, required)
  - `updatedAt` (string, optional, ISO-8601)
  - `speaker` (string, optional, 0.2): 場面の話者。WritingPageでは`:::zw-dialog{speaker}`
  - `choices` (array, optional, 0.2): `{text, target}`。`target`は行き先のnodeId。WritingPageでは`[text](chapter://章)`

### Output (NarrativeGen -> WritingPage)

- `contractVersion` (string, required)
- `modelId` (string, required)
- `nodes` (array, required)
  - `nodeId` (string, required)
  - `text` (string, required)
  - `speaker` (string, optional)
  - `choices` (array, optional, 0.2): `{text, target}`。条件・効果は渡らない（警告を返す）

## 本文と記法（0.2）

- 先頭のnodeが開始場面。WritingPageでは表示中の章を章の順に並べ、非表示・下書きの章は渡さない（警告）。
- nodeIdは章の`metadata.narrativegen.nodeId`、無ければ章名。選択肢のリンク先はWritingPageの章名照合（slug）で解決する。
- 本文は空行で段落を分ける。WritingPageのルビ`{漢字|かんじ}`は`|漢字《かんじ》`に直して渡す（NarrativeGenの`{…}`記法と衝突させない）。傍点・wikilinkは表示文字だけ、装飾タグは外す（警告）。
- NarrativeGenの記法（`{?flag:…}`、`[entity.prop]`など）が残る本文はWritingPageで記法のまま見えるため、書き出し時に警告を返す。

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

## ゲート判定ログ

| 判定日 | 項目1（2週間安定） | 項目2（双方合意） | 項目3（サンプル3件） | 項目4（SP-PLAY 確定） | 総合 |
|--------|-------------------|-------------------|---------------------|----------------------|------|
| 2026-04-09 | No（WritingPage 側の安定版タグ未確認・リポジトリ外） | No（合意記録なし） | No（サンプル未添付） | Yes（`play-media-bgm-ac.spec.js` + 検証表 Pass） | **No-Go** |
| 2026-11-26 | Yes（形式を持つ`storage.js`・`TextboxDslParser.js`・`chapter-store.js`・`chapter-nav.js`の最終変更は2026-07-13以前、タグ`v0.3.15`） | userの依頼「この画面互換性は、WritingPageの実装とも互換性を持たせるよう包括的に整備してください」（2026-11-26） | Yes（`docs/samples/writingpage/` 正常2・異常3） | Yes（前回から変更なし） | **Go**（0.2を実装） |

両アプリの通常画面から取り込み・書き出しを行う入口は未接続。[接続の申し送り](../../HANDOVER.md#unitychatnovelgamewritingpageとの接続)に担当と確認方法を置く。

## 関連

- `docs/specs/pipeline-workflow.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/plans/DEVELOPMENT_PLAN.md`
