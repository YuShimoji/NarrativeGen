# 構文エンジン完全実装仕様書

**バージョン: 1.0**  
**基準ドキュメント: 構文メモ.txt + memo.txt**  
**作成日: 2024年**

---

## 目次

1. [概要・設計思想](#1-概要設計思想)
2. [具体性の遡行システム](#2-具体性の遡行システム)
3. [テキスト内コマンド処理](#3-テキスト内コマンド処理)
4. [変数・条件システム](#4-変数条件システム)
5. [文単位制約管理](#5-文単位制約管理)
6. [CSVファイル詳細仕様](#6-csvファイル詳細仕様)
7. [アルゴリズム実装詳細](#7-アルゴリズム実装詳細)
8. [実装優先順位・段階](#8-実装優先順位段階)
9. [性能・品質要件](#9-性能品質要件)
10. [技術的課題・解決策](#10-技術的課題解決策)

---

## 1. 概要・設計思想

### 1.1 核心原理

**「表示したいラインの中に、未指定の[～～～]がまだ残っていれば、更に遡って検索する」**

この操作により以下を実現：
- ランダム挿入
- 単語の組み換え
- 文自体の組み換え
- ストーリーの組み換え

### 1.2 設計制約

1. **文のかたまり単位原則**: 翻訳対応のため、文一つを基本形とする
2. **抽象度制御**: `[その傘は壊れているよ。]`レベルでの括り
3. **思いつき回避**: 当て推量でのバリエーション増加を禁止
4. **記号分離**: `「やめよう」`と`「やめよう！」`は完全に別文として扱う

### 1.3 アーキテクチャ概要

```
SyntaxEngine
├── RecursiveResolver (遡行検索エンジン)
├── CommandProcessor (テキスト内コマンド処理)
├── VariableManager (変数・条件管理)
├── TranslationUnitManager (文単位制約管理)
└── DictionarySystem (辞書検索システム)
```

---

## 2. 具体性の遡行システム

### 2.1 遡行検索アルゴリズム

#### 基本フロー
```
1. 入力テキスト解析
2. [～]パターン検出
3. 辞書完全一致検索
4. 見つからない場合 → 部分一致検索
5. 選択されたテキストに[～]が含まれる場合 → 再帰実行
6. 最大深度到達 or 循環参照検出 → エラー/フォールバック
```

#### 検索優先順位
```
1. 完全一致検索 ([そこに置いてある] → 項目名完全一致)
2. 文字数降順部分一致 (最長一致優先)
3. デフォルト値使用 (項目名自体をテキストとして使用)
```

### 2.2 具体例実装

**入力**: `[[そこに置いてある][傘]は[壊れ]ている。][だからそんなはずはない。]`

**処理ステップ**:
```
Step 1: [そこに置いてある] 検索
→ 辞書: "[そこの], そこにある, [その放置[されている]], その"
→ 選択: [その放置[されている]]

Step 2: [その放置[されている]] 処理
→ [その放置] 確定 + [されている] 再検索
→ [されている] 辞書: "されている, されてる, してる, してある, されちゃってる"
→ 選択: "されてる"
→ 結果: "その放置されてる"

Step 3: [傘] 検索 → 選択結果
Step 4: [壊れ] 検索 → 選択結果
最終: "[その放置されてる傘は壊れている。][だからそんなはずはない。]"
```

### 2.3 循環参照・エラー処理

#### 検出方式
- **循環参照**: 検索履歴スタックで同一項目の重複検出
- **最大深度**: 設定可能な再帰深度制限（デフォルト: 10）
- **無限ループ**: タイムアウト機構（設定可能）

#### フォールバック動作
```
1. 循環参照検出 → ログ出力 + 項目名自体を使用
2. 最大深度到達 → ログ出力 + 現在までの解決結果を使用
3. 辞書項目不在 → デバッグログ + 項目名自体を使用
```

---

## 3. テキスト内コマンド処理

### 3.1 サポートコマンド一覧

| コマンド | 構文例 | 機能 | 実装優先度 |
|---------|--------|------|-----------|
| `r{}` | `r[もし][何か]r` | ランダム挿入 | 高 |
| `\|\|` | `{A\|\|B\|\|C}` | 選択肢（1つ選択） | 高 |
| `&&` | `[A]&&[B]` | 連動選択 | 中 |
| `n-{}` | `n-{A\|\|B\|\|C}` | n個選択 | 中 |
| `<{}` | `<{A\|\|B\|\|C}` | 左から順に | 低 |
| `>{}` | `>{A\|\|B\|\|C}` | 右から順に | 低 |
| `if()` | `if(a == 1980 < 値段)` | 条件分岐 | 高 |
| `else` | 条件分岐のデフォルト | 条件不一致時 | 高 |

### 3.2 コマンド処理順序

```
1. 条件分岐処理 (if/else)
2. 選択系コマンド処理 (||, n-, <, >)
3. 連動処理 (&&)
4. ランダム挿入処理 (r)
5. 遡行検索処理 ([～])
```

### 3.3 具体実装例

#### ランダム挿入（r）
```
入力: [何かあったら言ってくれよ]
辞書: [r[もし][何か][あったら]r[遠慮せず][伝えてほしい]]

処理:
1. r[もし][何か][あったら]r を検出
2. [もし], [何か], [あったら] を各々遡行検索
3. ランダム選択（例: [もし] 選択, [何か] 選択, [あったら] 未選択）
4. r[遠慮せず][伝えてほしい] を検出  
5. [遠慮せず], [伝えてほしい] を各々遡行検索
6. ランダム選択（例: [遠慮せず] 未選択, [伝えてほしい] 選択）

結果例: "もし何かあったら伝えてほしい"
```

#### 選択肢（||）
```
入力: [明日までに]{[何かあれば]||[もし何か気になるところがあったら]||[もし何か見つけたら]} [すぐに伝えてほしい。]

処理:
1. {} 内の || 区切り選択肢を抽出
2. 選択肢数: 3個
3. ランダム選択（例: "もし何か気になるところがあったら"）
4. 選択結果に対して遡行検索実行

結果例: "明日までにもし何か気になるところがあったらすぐに伝えてほしい。"
```

#### 連動選択（&&）
```
入力: [r{[見つけたり]&&[もし何か気になるところがあったりしたら]} [すぐに伝えてほしい。]

処理:
1. && で連結された要素を検出
2. どちらか一方が選択された場合、連動してもう一方も選択
3. 両方とも遡行検索実行

結果例: "見つけたりもし何か気になるところがあったりしたらすぐに伝えてほしい。"
```

---

## 4. 変数・条件システム

### 4.1 変数タイプ

| タイプ | 例 | 格納場所 | スコープ |
|--------|-----|----------|----------|
| Entity プロパティ | `entity.weight` | Entities.csv | グローバル |
| キャラクター変数 | `character.knowledge_accuracy` | CharacterKnowledge.csv | キャラクター固有 |
| システム変数 | `current_scene` | Variables.csv | グローバル |
| 計算結果 | `weight_diff_percentage` | 一時メモリ | 処理スコープ |

### 4.2 サポート演算子

```
比較演算子: ==, !=, <, <=, >, >=
論理演算子: AND, OR, NOT
算術演算子: +, -, *, /, %
文字列演算子: contains, starts_with, ends_with
特殊演算子: in_range(min, max), tolerance_check(expected, tolerance)
```

### 4.3 条件分岐例

```
# 価格による選択例
(最初の行) [それは][買えないな], if(entity.price > character.budget) 
(次の行) [それは][買えるな], else

# 重量違和感検出例  
(最初の行) [微妙に重い気がする], if(tolerance_check(entity.weight, character.expected_weight, character.tolerance) == false)
(次の行) [普通だな], else
```

---

## 5. 文単位制約管理

### 5.1 文単位定義

**基本原則**: 「それ一文を訳すだけで成立するレイヤーの文」を基本形とする

#### 正しい例
```
✅ [その傘は壊れているよ。]
✅ [昨日、風が強かったから、それで壊れたんだ。]
✅ [「その傘は壊れているよ」]
✅ [と〇〇は言った。]
```

#### 誤った例  
```
❌ [その[傘]は[壊れ][ているよ。]]  // 文の内部分割
❌ [その傘は壊れているよ][、と〇〇は言った。]  // 文の非独立分割
```

### 5.2 翻訳対応設計

```
TranslationUnit {
    id: string,
    base_text: string,           // 日本語基本文
    language_variants: {         // 言語別バリエーション
        "en": ["It's broken.", "That umbrella is broken."],
        "zh": ["它坏了。", "那把伞坏了。"]  
    },
    semantic_type: string,       // "statement", "question", "exclamation"
    independence_level: number   // 文の独立性レベル (1.0 = 完全独立)
}
```

---

## 6. CSVファイル詳細仕様

### 6.1 新規追加CSVファイル

#### A. RecursiveDictionary.csv - 遡行検索辞書
```csv
term_id,term_text,variants,weight,conditions,usage_count,last_used
そこに置いてある,"[そこの]|そこにある|[その放置[されている]]|その",1.0,"",0,
されている,"されている|されてる|してる|してある|されちゃってる",1.0,"",0,
その放置,"その放置|放置された|そこに放置された",1.0,"",0,
```

#### B. SyntaxCommands.csv - コマンド処理定義
```csv
command_id,command_syntax,processor_type,parameters,priority,examples
random_insert,"r[...]r",RandomInsertProcessor,"{""probability"":0.5}",1,"r[もし][何か]r"
selection,"{}",SelectionProcessor,"{""separator"":""||}",2,"{A||B||C}"
conditional,"if()",ConditionalProcessor,"{""supports"":""variables""}",3,"if(a > b)"
sequential_left,"<{}",SequentialProcessor,"{""direction"":""left""}",4,"<{A||B||C}"
```

#### C. Variables.csv - 変数定義・管理
```csv
variable_id,scope,type,default_value,min_value,max_value,description
current_scene,global,string,"main_scene","","","現在のシーン識別子"
processing_depth,system,integer,0,0,50,"遡行検索の現在深度"
max_recursion_depth,config,integer,10,1,100,"最大再帰深度"
weight_diff_percentage,temp,float,0.0,-1.0,1.0,"重量差分パーセンテージ"
```

#### D. TranslationUnits.csv - 文単位制約
```csv
unit_id,base_text,semantic_type,independence_level,translation_group,constraints
unit_001,"その傘は壊れているよ。",statement,1.0,"object_broken","complete_sentence"
unit_002,"と〇〇は言った。",attribution,0.5,"dialogue_attribution","requires_preceding_dialogue"
unit_003,"「その傘は壊れているよ」",dialogue,0.8,"dialogue_content","quoted_speech"
```

### 6.2 既存CSVファイル拡張

#### SyntaxPatterns.csv 拡張
```csv
# 新規追加フィールド
pattern_id,context,pattern_text,commands,variables,translation_unit_id,priority
basic_observation,scene,"[その[OBJECT]は[STATE]。]","||,r","OBJECT,STATE","unit_basic_obs",1
```

#### Paraphrases.csv 拡張  
```csv
# 新規追加フィールド
group_id,variant_text,person,formality,tone,context,max_length,conditions_json,usage_count,last_used,recursive_terms,translation_group
```

---

## 7. アルゴリズム実装詳細

### 7.1 SyntaxEngine クラス設計

```csharp
public class SyntaxEngine : MonoBehaviour
{
    #region Core Components
    private RecursiveResolver m_RecursiveResolver;
    private CommandProcessor m_CommandProcessor;
    private VariableManager m_VariableManager;
    private TranslationUnitManager m_TranslationManager;
    #endregion

    #region Public API
    public string ProcessText(string _inputText, Dictionary<string, object> _context = null)
    public async Task<string> ProcessTextAsync(string _inputText, Dictionary<string, object> _context = null)  
    public void RegisterCustomCommand(string _commandId, ICommandProcessor _processor)
    public void SetMaxRecursionDepth(int _maxDepth)
    #endregion
}
```

### 7.2 RecursiveResolver 実装

```csharp
public class RecursiveResolver
{
    private Dictionary<string, List<string>> m_DictionaryCache;
    private Stack<string> m_ResolutionStack;  // 循環参照検出用
    private int m_CurrentDepth;
    private int m_MaxDepth;

    public string ResolveRecursive(string _term, Dictionary<string, object> _context)
    {
        // 循環参照チェック
        if (m_ResolutionStack.Contains(_term))
        {
            LogCircularReference(_term);
            return _term; // フォールバック
        }

        // 深度チェック
        if (m_CurrentDepth >= m_MaxDepth)
        {
            LogMaxDepthReached(_term);
            return _term; // フォールバック
        }

        m_ResolutionStack.Push(_term);
        m_CurrentDepth++;

        try
        {
            // 辞書検索・選択・再帰処理
            string result = ProcessTermResolution(_term, _context);
            return result;
        }
        finally
        {
            m_ResolutionStack.Pop();
            m_CurrentDepth--;
        }
    }
}
```

### 7.3 CommandProcessor 実装

```csharp
public interface ICommandProcessor
{
    string ProcessCommand(string _commandText, Dictionary<string, object> _context);
    int GetPriority();
}

public class RandomInsertProcessor : ICommandProcessor
{
    public string ProcessCommand(string _commandText, Dictionary<string, object> _context)
    {
        // r[A][B]r パターンの解析・処理
        var matches = Regex.Matches(_commandText, @"r(\[.*?\])+r");
        foreach (Match match in matches)
        {
            // ランダム選択ロジック
        }
    }
}
```

---

## 8. 実装優先順位・段階

### Phase 1: 基盤システム (4-6週間)
```
✅ Priority 1:
- CSVローダー・基本データ構造
- 基本的な遡行検索エンジン
- 単純な[～]パターン処理
- エラーハンドリング・ログシステム

✅ Priority 2:  
- ランダム挿入（r）コマンド
- 選択肢（||）コマンド
- 基本的な変数システム
```

### Phase 2: コマンド拡張 (3-4週間)
```
✅ Priority 1:
- 条件分岐（if/else）システム
- 連動選択（&&）コマンド
- パフォーマンス最適化

✅ Priority 2:
- n個選択（n-）コマンド
- 順次選択（<, >）コマンド
- デバッグ・可視化ツール
```

### Phase 3: 高度機能 (2-3週間)
```
✅ Priority 1:
- 翻訳対応システム
- 逆引き検索機能
- 使用履歴・統計システム

✅ Priority 2:
- 作成支援エディタ拡張
- パフォーマンス監視
- 最適化アルゴリズム
```

---

## 9. 性能・品質要件

### 9.1 性能要件

| 項目 | 目標値 | 測定方法 |
|------|--------|----------|
| 基本遡行検索 | < 10ms | 単一[～]パターン処理時間 |
| 複雑コマンド処理 | < 50ms | 複数コマンド組み合わせ |
| 辞書キャッシュヒット率 | > 95% | 繰り返し検索での効率 |
| メモリ使用量 | < 100MB | ランタイム最大使用量 |

### 9.2 品質要件

#### エラー処理
```
- 循環参照検出率: 100%
- 無限ループ防止: 100%  
- グレースフルデグラデーション: フォールバック動作100%
- エラーログ記録: 詳細情報100%
```

#### データ整合性
```
- CSV解析エラー検出: 100%
- 参照整合性チェック: 100%
- 型安全性: 強い型付け
- デッドリンク検出: 自動チェック
```

---

## 10. 技術的課題・解決策

### 10.1 パフォーマンス課題

#### 課題A: 大量の遡行検索による処理時間増大
**解決策**:
- 辞書のインメモリキャッシング
- 検索結果のメモ化
- 並列処理対応（可能な部分）
- 使用頻度による優先度付けキャッシング

#### 課題B: 複雑なコマンド組み合わせの処理複雑度
**解決策**:
- コマンド処理順序の最適化
- 中間結果キャッシュ
- 不要な再計算の回避

### 10.2 実装課題

#### 課題C: CSV管理の複雑性
**解決策**:
- データバリデーションシステム
- 自動整合性チェック
- エディタ拡張での編集支援
- バージョン管理・マイグレーション機能

#### 課題D: デバッグの困難性
**解決策**:
- 遡行検索パスの可視化
- 中間状態のログ出力
- インタラクティブデバッガー
- ユニットテスト充実

### 10.3 運用課題

#### 課題E: ライター向けのツール不足
**解決策**:
- 逆引き検索システム
- 未使用項目検出ツール
- パフォーマンス影響可視化
- リアルタイムプレビュー

#### 課題F: 多言語対応の複雑性
**解決策**:
- 言語別処理パイプライン分離
- 文単位制約の厳格な実装
- 翻訳品質チェック機能

---

## 実装開始準備

この仕様書に基づいて実装を開始する準備が整いました。以下の順序での実装開始を推奨します：

1. **CSVファイル構造の確定** (新規4ファイル + 既存2ファイル拡張)
2. **SyntaxEngine基盤クラスの実装**
3. **RecursiveResolver の基本機能実装**
4. **単体テスト環境構築**

具体的な実装作業に入る準備はできております。どの部分から着手いたしましょうか？ 