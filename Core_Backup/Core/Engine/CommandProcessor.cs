using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using NarrativeGen.Core.Models;

namespace NarrativeGen.Core.Engine
{
    /// <summary>
    /// テキスト内コマンド処理システム
    /// 構文メモ.txt の各種コマンド実装
    /// </summary>
    public class CommandProcessor
    {
        #region Private Fields
        private readonly Random _random;
        private readonly ILogger? _logger;
        private readonly Dictionary<string, object> _variables;
        #endregion

        #region Constructor
        public CommandProcessor(ILogger? logger = null)
        {
            _random = new Random();
            _logger = logger;
            _variables = new Dictionary<string, object>();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// テキスト内コマンドの処理
        /// 構文メモ.txt の処理順序: if/else → {A||B||C} → [A]&&[B] → r[A][B]r → [～]
        /// </summary>
        public string ProcessCommands(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            var result = input;
            
            // 1. if/else 条件分岐処理
            result = ProcessConditionals(result);
            
            // 2. {A||B||C} 選択肢処理
            result = ProcessChoiceCommands(result);
            
            // 3. [A]&&[B] 連動選択処理
            result = ProcessLinkedSelections(result);
            
            // 4. r[A][B]r ランダム挿入処理
            result = ProcessRandomInsertions(result);
            
            // 5. n-{} どれかをn個使う
            result = ProcessMultipleSelection(result);

            _logger?.LogDebug("Command processing completed: {Input} -> {Result}", input, result);
            return result;
        }

        /// <summary>
        /// 変数の設定
        /// </summary>
        public void SetVariable(string name, object value)
        {
            _variables[name] = value;
        }

        /// <summary>
        /// 変数の取得
        /// </summary>
        public T? GetVariable<T>(string name, T? defaultValue = default)
        {
            if (_variables.TryGetValue(name, out var value))
            {
                try
                {
                    return (T)Convert.ChangeType(value, typeof(T));
                }
                catch
                {
                    return defaultValue;
                }
            }
            return defaultValue;
        }
        #endregion

        #region Command Processing Methods

        /// <summary>
        /// if/else 条件分岐処理
        /// 例: [それは][買えないな], if(a == 1980 < 値段)
        /// </summary>
        private string ProcessConditionals(string input)
        {
            // 簡単な条件式の実装（拡張可能）
            var pattern = @"(.+?),\s*if\((.+?)\)\s*\n(.+?),\s*else";
            var matches = Regex.Matches(input, pattern, RegexOptions.Multiline);

            foreach (Match match in matches)
            {
                var ifContent = match.Groups[1].Value;
                var condition = match.Groups[2].Value;
                var elseContent = match.Groups[3].Value;

                var conditionResult = EvaluateCondition(condition);
                var replacement = conditionResult ? ifContent : elseContent;
                
                input = input.Replace(match.Value, replacement);
            }

            return input;
        }

        /// <summary>
        /// {A||B||C} 選択肢処理
        /// 構文メモ.txt: どれか一つを使用する
        /// </summary>
        private string ProcessChoiceCommands(string input)
        {
            var pattern = @"\{([^}]+)\}";
            var matches = Regex.Matches(input, pattern);

            foreach (Match match in matches)
            {
                var content = match.Groups[1].Value;
                var choices = content.Split(new[] { "||" }, StringSplitOptions.RemoveEmptyEntries)
                                   .Select(c => c.Trim())
                                   .ToArray();

                if (choices.Length > 0)
                {
                    var selectedChoice = SelectRandom(choices);
                    input = input.Replace(match.Value, selectedChoice);
                }
            }

            return input;
        }

        /// <summary>
        /// [A]&&[B] 連動選択処理
        /// 構文メモ.txt: どちらかが使われる場合、&&で隣接している[]をランダムで使用
        /// </summary>
        private string ProcessLinkedSelections(string input)
        {
            var pattern = @"\[([^\]]+)\]&&\[([^\]]+)\]";
            var matches = Regex.Matches(input, pattern);

            foreach (Match match in matches)
            {
                var optionA = match.Groups[1].Value;
                var optionB = match.Groups[2].Value;
                
                // ランダムで一方を選択
                var selected = _random.Next(2) == 0 ? optionA : optionB;
                input = input.Replace(match.Value, $"[{selected}]");
            }

            return input;
        }

        /// <summary>
        /// r[A][B]r ランダム挿入処理
        /// 構文メモ.txt: [もし]と[遠慮せず]をランダム挿入
        /// </summary>
        private string ProcessRandomInsertions(string input)
        {
            var pattern = @"r\[(.*?)\]([^r]*?)r";
            var matches = Regex.Matches(input, pattern);

            foreach (Match match in matches)
            {
                var insertionText = match.Groups[1].Value;
                var baseText = match.Groups[2].Value;
                
                // 50%の確率で挿入
                var shouldInsert = _random.Next(2) == 0;
                var replacement = shouldInsert ? $"[{insertionText}]{baseText}" : baseText;
                
                input = input.Replace(match.Value, replacement);
            }

            return input;
        }

        /// <summary>
        /// n-{A||B||C} n個選択処理
        /// 構文メモ.txt: どれかをn個使う
        /// </summary>
        private string ProcessMultipleSelection(string input)
        {
            var pattern = @"(\d+)-\{([^}]+)\}";
            var matches = Regex.Matches(input, pattern);

            foreach (Match match in matches)
            {
                if (int.TryParse(match.Groups[1].Value, out var count))
                {
                    var content = match.Groups[2].Value;
                    var choices = content.Split(new[] { "||" }, StringSplitOptions.RemoveEmptyEntries)
                                       .Select(c => c.Trim())
                                       .ToArray();

                    var selectedChoices = SelectMultiple(choices, count);
                    var replacement = string.Join("", selectedChoices);
                    
                    input = input.Replace(match.Value, replacement);
                }
            }

            return input;
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// 条件式の評価（基本的な実装）
        /// </summary>
        private bool EvaluateCondition(string condition)
        {
            try
            {
                // 簡単な比較演算の実装
                // 例: "a == 1980 < 値段" → 変数'a'が1980で、'値段'が1980より大きいか
                
                if (condition.Contains("==") && condition.Contains("<"))
                {
                    var parts = condition.Split(new[] { "==", "<" }, StringSplitOptions.RemoveEmptyEntries)
                                        .Select(p => p.Trim())
                                        .ToArray();
                    
                    if (parts.Length >= 3)
                    {
                        var varName = parts[0];
                        var expectedValue = parts[1];
                        var comparedVarName = parts[2];
                        
                        var varValue = GetVariable<float>(varName);
                        var comparedValue = GetVariable<float>(comparedVarName);
                        
                        if (float.TryParse(expectedValue, out var expected))
                        {
                            return varValue == expected && comparedValue > expected;
                        }
                    }
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error evaluating condition: {Condition}", condition);
                return false;
            }
        }

        /// <summary>
        /// ランダム選択
        /// </summary>
        private string SelectRandom(string[] options)
        {
            if (options.Length == 0) return "";
            return options[_random.Next(options.Length)];
        }

        /// <summary>
        /// 複数選択（重複なし）
        /// </summary>
        private string[] SelectMultiple(string[] options, int count)
        {
            if (options.Length == 0 || count <= 0) return Array.Empty<string>();
            
            var shuffled = options.OrderBy(_ => _random.Next()).ToArray();
            var actualCount = Math.Min(count, shuffled.Length);
            
            return shuffled.Take(actualCount).ToArray();
        }

        #endregion

        #region Advanced Command Features

        /// <summary>
        /// <{} 左から順に処理
        /// </summary>
        public string ProcessSequentialLeft(string input)
        {
            var pattern = @"<\{([^}]+)\}";
            var matches = Regex.Matches(input, pattern);

            foreach (Match match in matches)
            {
                var content = match.Groups[1].Value;
                var choices = content.Split(new[] { "||" }, StringSplitOptions.RemoveEmptyEntries)
                                   .Select(c => c.Trim())
                                   .ToArray();

                // 左から順に選択（状態管理が必要）
                if (choices.Length > 0)
                {
                    input = input.Replace(match.Value, choices[0]);
                }
            }

            return input;
        }

        /// <summary>
        /// >{} 右から順に処理
        /// </summary>
        public string ProcessSequentialRight(string input)
        {
            var pattern = @">\{([^}]+)\}";
            var matches = Regex.Matches(input, pattern);

            foreach (Match match in matches)
            {
                var content = match.Groups[1].Value;
                var choices = content.Split(new[] { "||" }, StringSplitOptions.RemoveEmptyEntries)
                                   .Select(c => c.Trim())
                                   .ToArray();

                // 右から順に選択（状態管理が必要）
                if (choices.Length > 0)
                {
                    input = input.Replace(match.Value, choices[choices.Length - 1]);
                }
            }

            return input;
        }

        #endregion
    }
} 