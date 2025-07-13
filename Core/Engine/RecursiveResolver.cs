using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace NarrativeGen.Core.Engine
{
    /// <summary>
    /// 遡行検索エンジン
    /// 構文メモ.txt の核心: 「[～]が残っていれば更に遡って検索する」
    /// </summary>
    public class RecursiveResolver
    {
        #region Constants
        private const int MaxRecursionDepth = 10;
        private const int MaxCircularReferenceCount = 3;
        #endregion

        #region Private Fields
        private readonly Dictionary<string, string> _recursiveDictionary;
        private readonly Dictionary<string, int> _recursionDepthTracker;
        private readonly ILogger? _logger;
        private readonly Random _random;
        #endregion

        #region Constructor
        public RecursiveResolver(Dictionary<string, string> recursiveDictionary, ILogger? logger = null)
        {
            _recursiveDictionary = recursiveDictionary ?? new Dictionary<string, string>();
            _recursionDepthTracker = new Dictionary<string, int>();
            _logger = logger;
            _random = new Random();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// テキストの遡行検索処理
        /// 構文メモ.txt: 「表示したいラインの中に、未指定の[～～～]がまだ残っていれば、更に遡って検索する」
        /// </summary>
        public string ProcessText(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            _recursionDepthTracker.Clear();
            _logger?.LogDebug("Starting recursive processing for: {Input}", input);

            return ProcessRecursive(input);
        }

        /// <summary>
        /// 辞書エントリの追加
        /// </summary>
        public void AddDictionaryEntry(string key, string value)
        {
            _recursiveDictionary[key] = value;
        }

        /// <summary>
        /// 辞書の状態取得（デバッグ用）
        /// </summary>
        public Dictionary<string, string> GetDictionary()
        {
            return new Dictionary<string, string>(_recursiveDictionary);
        }
        #endregion

        #region Core Recursive Logic
        /// <summary>
        /// 遡行検索の実行
        /// 構文メモ.txt の核心アルゴリズム
        /// </summary>
        private string ProcessRecursive(string input)
        {
            var result = input;
            var iterations = 0;
            const int maxIterations = 50; // 無限ループ防止

            while (ContainsBrackets(result) && iterations < maxIterations)
            {
                var originalResult = result;
                result = ProcessSinglePass(result);
                
                // 進捗がない場合は終了
                if (result == originalResult)
                {
                    _logger?.LogWarning("No progress made in recursive processing, stopping");
                    break;
                }
                
                iterations++;
            }

            _logger?.LogDebug("Recursive processing completed in {Iterations} iterations", iterations);
            return result;
        }

        /// <summary>
        /// 1回のパス処理
        /// </summary>
        private string ProcessSinglePass(string input)
        {
            var result = input;
            var bracketPattern = new Regex(@"\[([^\]]+)\]");
            var matches = bracketPattern.Matches(input);

            foreach (Match match in matches)
            {
                var fullMatch = match.Value; // [～]
                var term = match.Groups[1].Value; // ～
                
                var resolved = ResolveTerm(term);
                result = result.Replace(fullMatch, resolved);

                // 循環参照・深度チェック
                if (DetectCircularReference(term) || ExceedsMaxDepth(term))
                {
                    _logger?.LogWarning("Circular reference or max depth exceeded for term: {Term}", term);
                    result = result.Replace(fullMatch, FallbackResolve(term));
                }
            }

            return result;
        }

        /// <summary>
        /// 個別用語の解決
        /// </summary>
        private string ResolveTerm(string term)
        {
            // 辞書検索
            if (_recursiveDictionary.TryGetValue(term, out var directMatch))
            {
                _logger?.LogDebug("Dictionary match found: {Term} -> {Result}", term, directMatch);
                return directMatch;
            }

            // 部分マッチ検索（構文メモ.txt: より具体的な項目を優先）
            var partialMatch = FindPartialMatch(term);
            if (partialMatch != null)
            {
                _logger?.LogDebug("Partial match found: {Term} -> {Result}", term, partialMatch);
                return partialMatch;
            }

            // 見つからない場合は元のテキストを返す
            _logger?.LogDebug("No match found for term: {Term}", term);
            return term;
        }

        /// <summary>
        /// 部分マッチ検索
        /// ライターの手間を減らすための機能
        /// </summary>
        private string? FindPartialMatch(string term)
        {
            // より具体的な一致を優先
            foreach (var kvp in _recursiveDictionary)
            {
                if (kvp.Key.Contains(term) || term.Contains(kvp.Key))
                {
                    return kvp.Value;
                }
            }
            return null;
        }
        #endregion

        #region Safety Checks
        /// <summary>
        /// 括弧が含まれているかチェック
        /// </summary>
        private bool ContainsBrackets(string text)
        {
            return text.Contains('[') && text.Contains(']');
        }

        /// <summary>
        /// 循環参照の検出
        /// </summary>
        private bool DetectCircularReference(string term)
        {
            if (!_recursionDepthTracker.ContainsKey(term))
            {
                _recursionDepthTracker[term] = 0;
            }
            
            _recursionDepthTracker[term]++;
            return _recursionDepthTracker[term] > MaxCircularReferenceCount;
        }

        /// <summary>
        /// 最大深度の確認
        /// </summary>
        private bool ExceedsMaxDepth(string term)
        {
            return _recursionDepthTracker.TryGetValue(term, out var depth) && 
                   depth > MaxRecursionDepth;
        }

        /// <summary>
        /// フォールバック処理
        /// 構文メモ.txt: カッコの中身を使い、デバッグにログを送る
        /// </summary>
        private string FallbackResolve(string term)
        {
            _logger?.LogWarning("Fallback processing for term: {Term}", term);
            return term; // 元のテキストをそのまま返す
        }
        #endregion

        #region Advanced Features
        /// <summary>
        /// ランダム選択機能
        /// 構文メモ.txt: 複数の同一評価の要素からランダム選択
        /// </summary>
        public string SelectRandom(string[] options)
        {
            if (options.Length == 0) return "";
            if (options.Length == 1) return options[0];
            
            var index = _random.Next(options.Length);
            return options[index];
        }

        /// <summary>
        /// 使用頻度の記録（将来的な機能）
        /// memo.txt: 各ラインは「何回記述されたか」プロパティを持つ
        /// </summary>
        public void RecordUsage(string term)
        {
            // TODO: 使用頻度記録システム実装
            _logger?.LogDebug("Usage recorded for term: {Term}", term);
        }
        #endregion
    }
} 