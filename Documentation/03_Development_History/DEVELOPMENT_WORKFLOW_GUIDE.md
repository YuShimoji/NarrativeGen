# NarrativeGen 開発ワークフローガイド

## 🚀 はじめに

このガイドでは、NarrativeGenプロジェクトでの日常的な開発作業の具体的な手順を説明します。Web環境（Cursor Web）とUnity環境の両方での効率的な開発方法を習得できます。

## 📋 環境セットアップ

### Web環境（Cursor Web）のセットアップ

```bash
# 1. プロジェクトルートディレクトリに移動
cd "C:\Users\thank\Storage\Game Projects\NarrativeGen"

# 2. 最新の状態に同期
git pull origin master

# 3. 依存関係の確認
dotnet restore

# 4. ビルド確認
dotnet build

# 5. 動作テスト
dotnet run
```

### Unity環境のセットアップ

```bash
# 1. 最新の状態に同期
git pull origin master

# 2. Unity プロジェクトを開く
# Unity Hub から NarrativeGen プロジェクトを選択

# 3. コンパイルエラーの確認
# Unity Console でエラーがないことを確認

# 4. 基本動作テスト
# Play ボタンを押してシーンが正常に動作することを確認
```

## 🔄 日常開発フロー

### 1. Web環境での新機能開発

#### Step 1: 開発準備
```bash
# ブランチ作成
git checkout master
git pull origin master
git checkout -b feature/improve-recursion

# 開発環境確認
dotnet build
dotnet run
> start
> stats
```

#### Step 2: コア開発作業
```csharp
// Core/Engine/RecursiveResolver.cs の例
public class RecursiveResolver
{
    // 新機能: 循環参照検出
    private HashSet<string> m_ProcessingKeys = new HashSet<string>();
    
    public string ResolveRecursively(string _text, int _maxDepth = 10)
    {
        // 循環参照チェック
        if (m_ProcessingKeys.Contains(_text))
        {
            return "[循環参照エラー]";
        }
        
        // 実装続行...
    }
}
```

#### Step 3: 即座にテスト
```bash
# ビルド・実行
dotnet run

# Console でのテスト
> start
> process "[そこに置いてある][傘]は[壊れ]ている。"
> test entity cheeseburger
> set weight_kg 0.12
> get weight_kg
> stats
```

#### Step 4: CSV データ調整
```csv
# RecursiveDictionary.csv に追加
"[傘]","古い傘,新しい傘,壊れた傘"
"[壊れ]","壊れかけ,完全に壊れた,少し損傷した"
```

#### Step 5: コミット・プッシュ
```bash
# 変更確認
git status
git diff

# ステージング
git add .

# コミット
git commit -m "feat: 循環参照検出機能とエラーハンドリング強化

- RecursiveResolver に循環参照検出ロジック追加
- 最大再帰深度の制限実装
- CSV データの充実化
- Console テストで全機能確認済み"

# プッシュ
git push origin feature/improve-recursion
```

### 2. Unity環境での統合作業

#### Step 1: Web開発の取り込み
```bash
# 最新の変更を取得
git pull origin master
git merge feature/improve-recursion

# Unity プロジェクトを開く
# コンパイルエラーがないか確認
```

#### Step 2: Unity統合テスト
```csharp
// Assets/Scripts/Logic/SyntaxEngine.cs での確認
public class SyntaxEngine : MonoBehaviour
{
    private NarrativeEngine m_NarrativeEngine;
    
    private void Start()
    {
        // 新機能のテスト
        string result = m_NarrativeEngine.ProcessText("[そこに置いてある][傘]は[壊れ]ている。");
        Debug.Log($"処理結果: {result}");
    }
}
```

#### Step 3: Android実機テスト
```csharp
// パフォーマンス計測コード
public class PerformanceMonitor : MonoBehaviour
{
    private void Update()
    {
        // メモリ使用量
        long memory = System.GC.GetTotalMemory(false);
        
        // FPS
        float fps = 1.0f / Time.unscaledDeltaTime;
        
        // 必要に応じてログ出力
        if (Time.frameCount % 60 == 0)
        {
            Debug.Log($"Memory: {memory / 1024 / 1024}MB, FPS: {fps:F1}");
        }
    }
}
```

#### Step 4: Unity固有の最適化
```csharp
// Assets/Scripts/Core/GameManager.cs
public class GameManager : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI m_OutputText;
    
    private void ProcessNarrative(string _input)
    {
        // Android向け最適化: バックグラウンド処理
        StartCoroutine(ProcessNarrativeCoroutine(_input));
    }
    
    private IEnumerator ProcessNarrativeCoroutine(string _input)
    {
        // フレーム分散処理
        yield return null;
        
        string result = m_SyntaxEngine.ProcessText(_input);
        m_OutputText.text = result;
    }
}
```

#### Step 5: 統合コミット
```bash
# Unity統合の確認・コミット
git add Assets/Scripts/
git commit -m "unity: 循環参照検出機能の統合とAndroid最適化

- SyntaxEngine での新機能動作確認
- GameManager にフレーム分散処理追加
- Android実機でのメモリ・FPS測定
- TextMeshPro表示の最適化"

git push origin master
```

## 🛠️ 開発ツール活用

### Console アプリケーションの効率的使用

```bash
# よく使用するコマンドシーケンス
dotnet run
> start
> process "テストしたいテキスト"
> stats
> exit

# 自動化例
echo -e "start\nprocess \"[そこに置いてある][傘]は[壊れ]ている。\"\nstats\nexit" | dotnet run
```

### Git エイリアス設定
```bash
# ~/.gitconfig に追加
[alias]
    co = checkout
    br = branch
    st = status
    cm = commit
    ps = push
    pl = pull
    
    # プロジェクト固有
    web = !f() { git checkout -b feature/$1; }; f
    unity = !f() { git checkout master && git pull && git merge feature/$1; }; f
    deploy = !f() { git add . && git commit -m "$1" && git push; }; f
```

### 開発効率化スクリプト

#### Web環境用クイックテスト
```bash
# scripts/quick-test.sh
#!/bin/bash
echo "=== NarrativeGen Quick Test ==="
dotnet build
if [ $? -eq 0 ]; then
    echo "ビルド成功 - テスト実行中..."
    echo -e "start\nprocess \"[そこに置いてある][傘]は[壊れ]ている。\"\ntest entity cheeseburger\nstats\nexit" | dotnet run
else
    echo "ビルド失敗 - エラーを確認してください"
fi
```

#### Unity統合確認スクリプト
```bash
# scripts/unity-check.sh
#!/bin/bash
echo "=== Unity統合確認 ==="
git status
echo "Unity プロジェクトを開いてコンパイル確認してください"
echo "Android ビルドテストも忘れずに実行してください"
```

## 📊 品質管理・テスト

### Web環境でのテスト項目

#### 機能テスト
```bash
# 基本機能テスト
dotnet run
> start
> process "[基本][テスト]文章"     # 基本再帰処理
> process "[循環][循環]参照"       # 循環参照エラー処理
> process "非常に長い文章..."     # パフォーマンステスト
```

#### エンティティシステムテスト
```bash
> test entity cheeseburger
> set weight_kg 0.12              # 期待値との差異テスト
> get weight_kg                   # 値確認
> compare cheeseburger standard   # 比較機能テスト
```

### Unity環境でのテスト項目

#### パフォーマンステスト
1. **メモリ使用量**: Unity Profiler でメモリリーク確認
2. **FPS**: ターゲット 30fps以上を維持
3. **バッテリー**: 長時間使用テスト
4. **発熱**: Android実機での温度測定

#### ユーザビリティテスト
1. **タッチ応答**: 50ms以内の応答確認
2. **UI表示**: 各解像度での表示確認
3. **文字表示**: TextMeshPro の日本語表示確認
4. **データロード**: CSV読み込み速度確認

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### Web環境の問題

**問題**: `dotnet run` でコンパイルエラー
```bash
# 解決手順
dotnet clean
dotnet restore
dotnet build
# エラーメッセージを確認して対応
```

**問題**: CSV ファイルが読み込めない
```bash
# ファイルパス確認
ls -la *.csv
# 文字エンコーディング確認
file *.csv
# 権限確認
chmod 644 *.csv
```

#### Unity環境の問題

**問題**: SyntaxEngine でNullReferenceException
```csharp
// Assets/Scripts/Logic/SyntaxEngine.cs
private void Awake()
{
    // 初期化の確認
    if (m_NarrativeEngine == null)
    {
        m_NarrativeEngine = new NarrativeEngine();
        Debug.Log("NarrativeEngine initialized");
    }
}
```

**問題**: Android ビルドエラー
1. **Build Settings**: Android に切り替え確認
2. **Player Settings**: Package Name, API Level 確認
3. **TextMeshPro**: フォントアセット確認
4. **Permissions**: 必要な権限設定確認

### デバッグテクニック

#### Web環境でのデバッグ
```csharp
// Debug出力の活用
public class RecursiveResolver
{
    private void DebugLog(string _message)
    {
        #if DEBUG
        Console.WriteLine($"[RecursiveResolver] {_message}");
        #endif
    }
}
```

#### Unity環境でのデバッグ
```csharp
// Unity Console での詳細ログ
public class SyntaxEngine : MonoBehaviour
{
    [SerializeField] private bool m_EnableDebugLog = true;
    
    private void DebugLog(string _message)
    {
        if (m_EnableDebugLog)
        {
            Debug.Log($"[SyntaxEngine] {_message}");
        }
    }
}
```

## 📈 継続的改善

### 定期レビューポイント

#### 週次レビュー
- [ ] パフォーマンス指標の確認
- [ ] Git コミット履歴の整理
- [ ] テストカバレッジの確認
- [ ] ドキュメント更新状況

#### 月次レビュー
- [ ] 開発速度の分析
- [ ] 品質指標の評価
- [ ] ユーザビリティフィードバック
- [ ] 技術的負債の評価

### 改善アクション例

#### パフォーマンス改善
```csharp
// 例: RecursiveResolver の最適化
public class RecursiveResolver
{
    // キャッシュシステムの導入
    private Dictionary<string, string> m_ResolveCache = new Dictionary<string, string>();
    
    public string ResolveRecursively(string _text, int _maxDepth = 10)
    {
        if (m_ResolveCache.ContainsKey(_text))
        {
            return m_ResolveCache[_text];
        }
        
        // 処理実行
        string result = ProcessText(_text, _maxDepth);
        m_ResolveCache[_text] = result;
        return result;
    }
}
```

---

**更新履歴**:
- 2024/07/13: 初版作成 - 基本的な開発ワークフロー確立 