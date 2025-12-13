# スプレッドシート駆動フォーマット仕様

## 設計思想

**「ライターが直感的に複数の表現・物語の無数の展開をスプレッドシートに書けて、それが直接ゲーム上（エンジン上）で機能する」**

- スプレッドシート（CSV/TSV）を直接読み込み、プログラミング不要で分岐ストーリーを作成
- フラグ管理、リソース管理、条件分岐、時間ゲート等の高度な機能をシンプルな列で表現
- Excel/Google Sheets等で編集し、即座にゲームへ反映

## 現在のプロジェクト課題

### 解決済み
- ✅ エンジンのコア実装（セッション管理、選択肢処理、状態管理）
- ✅ Unity SDK と Web Tester の基本機能
- ✅ 基本的なCSV入出力（node_id, node_text, choice_id, choice_text, choice_target）

### 未解決（本仕様で解決）
- ❌ スプレッドシートでフラグ・リソース・条件・効果を表現する方法
- ❌ 複雑な分岐（条件付き選択肢、リソース消費、時間ゲート等）のCSV記述
- ❌ バリデーションとエラー表示（スプレッドシート編集者向け）
- ❌ 複数表現のバリエーション管理（言い換え、代替テキスト）

## CSV/TSV フォーマット v2.0

### 基本列（必須）

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `node_id` | string | ノードの一意識別子 | `start`, `scene1` |
| `node_text` | string | ノードで表示されるテキスト | `扉の前に立っている。` |
| `choice_id` | string | 選択肢の識別子（空白可） | `c1`, `open_door` |
| `choice_text` | string | 選択肢のテキスト（空白可） | `扉を開ける` |
| `choice_target` | string | 遷移先ノードID（空白可） | `scene2` |

### 拡張列（オプション）

| 列名 | 型 | 説明 | 例 |
|------|-----|------|-----|
| `choice_conditions` | string | 選択肢表示の条件（セミコロン区切り） | `flag:has_key=true;resource:gold>=10` |
| `choice_effects` | string | 選択肢選択時の効果（セミコロン区切り） | `setFlag:visited_room=true;addResource:gold=-5` |
| `choice_outcome_type` | string | 選択結果のタイプ | `ADD_ITEM`, `REMOVE_ITEM` |
| `choice_outcome_value` | string | 選択結果の値 | `key`, `sword` |
| `node_variants` | string | ノードテキストの代替表現（パイプ区切り） | `扉の前に立っている。\|木製の扉が見える。` |
| `initial_flags` | string | 初期フラグ（モデル全体、最初の行のみ） | `debug_mode=true;story_started=false` |
| `initial_resources` | string | 初期リソース（モデル全体、最初の行のみ） | `gold=100;hp=50;energy=10.5` |

### 条件式の書式

セミコロン `;` で複数条件を AND 結合。各条件は以下の形式：

```
flag:<key>=<true|false>
resource:<key><op><value>    # op: >=, <=, >, <, ==
timeWindow:<start>-<end>
```

**例**:
```
flag:has_sword=true;resource:gold>=50;timeWindow:5-10
```

### 効果の書式

セミコロン `;` で複数効果を記述。各効果は以下の形式：

```
setFlag:<key>=<true|false>
addResource:<key>=<delta>
goto:<target_node_id>
```

**例**:
```
setFlag:visited_shop=true;addResource:gold=-30;addResource:exp=10
```

## サンプルCSV

### 例1: シンプルな分岐

```csv
node_id,node_text,choice_id,choice_text,choice_target
start,朝目が覚めた。,,,
start,,c1,起きる,day1
start,,c2,二度寝する,sleep_again
day1,新しい一日が始まった。,,,
sleep_again,もう一度眠りについた...,,,
```

### 例2: 条件付き選択肢（フラグとリソース）

```csv
node_id,node_text,choice_id,choice_text,choice_target,choice_conditions,choice_effects,initial_flags,initial_resources
start,商店の前に立っている。,,,,,has_key=false,gold=100
start,,buy_key,鍵を買う（50ゴールド）,shop,resource:gold>=50,setFlag:has_key=true;addResource:gold=-50,,
start,,enter_dungeon,ダンジョンに入る,dungeon_entrance,flag:has_key=true,,,
shop,鍵を手に入れた。,,,,,,,
dungeon_entrance,鍵を使って扉を開けた。,,,,,,,
```

### 例3: 複数効果と時間ゲート

```csv
node_id,node_text,choice_id,choice_text,choice_target,choice_conditions,choice_effects
town,町の中心広場。時刻によってイベントが変わる。,,,,,
town,,market,市場に行く（時間: 5-10）,market,timeWindow:5-10,addResource:time=1
town,,sleep,宿屋で休む,inn,,setFlag:rested=true;addResource:hp=50;addResource:time=8
market,市場は賑わっている。,,,,,
inn,ぐっすり眠った。体力が回復した。,,,,,
```

## 実装ガイドライン

### CSV パーサー（Web Tester）

1. **ヘッダー検証**: 必須列（`node_id`, `node_text`）の存在確認
2. **ノード集約**: 同じ `node_id` の行を1つのノードにマージ
3. **条件・効果パース**: セミコロン区切りをパース → JSON Effect/Condition 配列へ変換
4. **初期値抽出**: 最初の行の `initial_flags`/`initial_resources` をモデルの `flags`/`resources` に設定
5. **バリデーション**:
   - 参照されるノードIDが存在するか
   - 条件・効果の構文が正しいか
   - 数値型リソースが正しいか

### エンジン側（変更不要）

現在のエンジン（`Packages/engine-ts`）は既に以下をサポート：
- `Condition`: flag, resource, timeWindow
- `Effect`: setFlag, addResource, goto
- `Model.flags`, `Model.resources`

CSV パーサーが適切な JSON を生成すれば、エンジン側の変更は不要。

## バリデーションルール

### エラーレベル

- **Error**: 実行不可（例: 存在しないノードへの参照、構文エラー）
- **Warning**: 実行可能だが推奨されない（例: 到達不可能なノード、未使用のフラグ）
- **Info**: 最適化提案（例: 冗長な条件、統合可能な選択肢）

### 検証項目

1. **参照整合性**: すべての `choice_target` が `node_id` として存在
2. **構文検証**: 条件・効果の構文が正しい
3. **型検証**: リソース値が数値、フラグ値がboolean
4. **到達可能性**: `startNode` からすべてのノードに到達可能か
5. **循環参照**: 無限ループの可能性を警告

## 次期拡張（v3.0 予定）

- **複数開始ノード**: チャプター選択、マルチエンディング
- **サブモデル参照**: 別CSVファイルを `@import` 構文で読み込み
- **スクリプト列**: 簡易スクリプト言語でカスタムロジック
- **メタデータ列**: タグ、カテゴリ、作者コメント等
- **多言語対応**: `node_text_en`, `choice_text_ja` 等の列で多言語テキスト

## 関連ドキュメント

- [エンジン仕様](./engine-spec.md)
- [AI機能仕様](./ai-features.md)
- [Unity SDK ガイド](../packages/sdk-unity/README.md)
