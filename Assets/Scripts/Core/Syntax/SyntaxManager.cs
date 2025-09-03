using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace NarrativeGen.Core.Syntax
{
    /// <summary>
    /// 構文システム管理 - SyntaxPatternとParaphraseの統合管理
    /// </summary>
    public class SyntaxManager
    {
        private List<SyntaxPattern> _syntaxPatterns;
        private Dictionary<string, Paraphrase> _paraphrases;
        private TextGenerator _textGenerator;
        
        /// <summary>
        /// コンストラクタ
        /// </summary>
        public SyntaxManager()
        {
            _syntaxPatterns = new List<SyntaxPattern>();
            _paraphrases = new Dictionary<string, Paraphrase>();
            _textGenerator = new TextGenerator();
        }
        
        /// <summary>
        /// CSVファイルからデータを読み込み
        /// </summary>
        public void LoadFromCsv(string csvDataPath)
        {
            LoadSyntaxPatterns(Path.Combine(csvDataPath, "SyntaxPatterns.csv"));
            LoadParaphrases(Path.Combine(csvDataPath, "Paraphrases.csv"));
            
            // TextGeneratorにデータを設定
            foreach (var pattern in _syntaxPatterns)
            {
                _textGenerator.AddSyntaxPattern(pattern);
            }
            
            foreach (var paraphrase in _paraphrases.Values)
            {
                _textGenerator.AddParaphrase(paraphrase);
            }
        }
        
        /// <summary>
        /// SyntaxPatternsの読み込み
        /// </summary>
        private void LoadSyntaxPatterns(string filePath)
        {
            if (!File.Exists(filePath))
            {
                return;
            }
            
            var lines = File.ReadAllLines(filePath);
            if (lines.Length <= 1) return; // ヘッダーのみの場合
            
            var headers = lines[0].Split(',');
            
            for (int i = 1; i < lines.Length; i++)
            {
                var values = ParseCsvLine(lines[i]);
                if (values.Length < headers.Length) continue;
                
                var pattern = new SyntaxPattern
                {
                    PatternId = GetCsvValue(values, headers, "pattern_id"),
                    Category = GetCsvValue(values, headers, "category"),
                    Template = GetCsvValue(values, headers, "template"),
                    Priority = int.TryParse(GetCsvValue(values, headers, "priority"), out int priority) ? priority : 0,
                    Description = GetCsvValue(values, headers, "description")
                };
                
                // 必須プロパティの解析
                var requiredPropsStr = GetCsvValue(values, headers, "required_properties");
                if (!string.IsNullOrEmpty(requiredPropsStr))
                {
                    pattern.RequiredProperties = requiredPropsStr.Split(';').ToList();
                }
                
                // 条件の解析
                var conditionsStr = GetCsvValue(values, headers, "conditions");
                if (!string.IsNullOrEmpty(conditionsStr))
                {
                    var conditionPairs = conditionsStr.Split(';');
                    foreach (var pair in conditionPairs)
                    {
                        var keyValue = pair.Split('=');
                        if (keyValue.Length == 2)
                        {
                            pattern.Conditions[keyValue[0].Trim()] = keyValue[1].Trim();
                        }
                    }
                }
                
                _syntaxPatterns.Add(pattern);
            }
        }
        
        /// <summary>
        /// Paraphrasesの読み込み
        /// </summary>
        private void LoadParaphrases(string filePath)
        {
            if (!File.Exists(filePath))
            {
                return;
            }
            
            var lines = File.ReadAllLines(filePath);
            if (lines.Length <= 1) return;
            
            var headers = lines[0].Split(',');
            
            for (int i = 1; i < lines.Length; i++)
            {
                var values = ParseCsvLine(lines[i]);
                if (values.Length < headers.Length) continue;
                
                var paraphrase = new Paraphrase
                {
                    ParaphraseId = GetCsvValue(values, headers, "paraphrase_id"),
                    OriginalText = GetCsvValue(values, headers, "original_text"),
                    Context = GetCsvValue(values, headers, "context"),
                    Frequency = float.TryParse(GetCsvValue(values, headers, "frequency"), out float freq) ? freq : 1.0f
                };
                
                // バリエーションの解析
                var variationsStr = GetCsvValue(values, headers, "variations");
                if (!string.IsNullOrEmpty(variationsStr))
                {
                    paraphrase.Variations = variationsStr.Split(';').ToList();
                }
                
                _paraphrases[paraphrase.ParaphraseId] = paraphrase;
            }
        }
        
        /// <summary>
        /// CSV行の解析（カンマ区切り、ダブルクォート対応）
        /// </summary>
        private string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            var current = string.Empty;
            var inQuotes = false;
            
            for (int i = 0; i < line.Length; i++)
            {
                var c = line[i];
                
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(current.Trim());
                    current = string.Empty;
                }
                else
                {
                    current += c;
                }
            }
            
            result.Add(current.Trim());
            return result.ToArray();
        }
        
        /// <summary>
        /// CSV値の取得
        /// </summary>
        private string GetCsvValue(string[] values, string[] headers, string columnName)
        {
            var index = Array.IndexOf(headers, columnName);
            if (index >= 0 && index < values.Length)
            {
                return values[index].Trim('"');
            }
            return string.Empty;
        }
        
        /// <summary>
        /// TextGeneratorを取得
        /// </summary>
        public TextGenerator GetTextGenerator()
        {
            return _textGenerator;
        }
        
        /// <summary>
        /// 全データの検証
        /// </summary>
        public List<string> ValidateAllData()
        {
            var errors = new List<string>();
            
            // SyntaxPatternの検証
            foreach (var pattern in _syntaxPatterns)
            {
                if (string.IsNullOrEmpty(pattern.PatternId))
                {
                    errors.Add("SyntaxPattern with empty PatternId found");
                }
                
                if (string.IsNullOrEmpty(pattern.Template))
                {
                    errors.Add($"SyntaxPattern {pattern.PatternId} has empty Template");
                }
                
                // テンプレート内のプレースホルダーと必須プロパティの整合性チェック
                var templatePlaceholders = ExtractPlaceholders(pattern.Template);
                var missingProps = templatePlaceholders.Except(pattern.RequiredProperties).ToList();
                if (missingProps.Any())
                {
                    errors.Add($"SyntaxPattern {pattern.PatternId} missing required properties: {string.Join(", ", missingProps)}");
                }
            }
            
            // Paraphraseの検証
            foreach (var paraphrase in _paraphrases.Values)
            {
                if (string.IsNullOrEmpty(paraphrase.ParaphraseId))
                {
                    errors.Add("Paraphrase with empty ParaphraseId found");
                }
                
                if (string.IsNullOrEmpty(paraphrase.OriginalText))
                {
                    errors.Add($"Paraphrase {paraphrase.ParaphraseId} has empty OriginalText");
                }
            }
            
            return errors;
        }
        
        /// <summary>
        /// テンプレートからプレースホルダーを抽出
        /// </summary>
        private List<string> ExtractPlaceholders(string template)
        {
            var placeholders = new List<string>();
            var start = 0;
            
            while (true)
            {
                var openBrace = template.IndexOf('{', start);
                if (openBrace == -1) break;
                
                var closeBrace = template.IndexOf('}', openBrace);
                if (closeBrace == -1) break;
                
                var placeholder = template.Substring(openBrace + 1, closeBrace - openBrace - 1);
                placeholders.Add(placeholder);
                
                start = closeBrace + 1;
            }
            
            return placeholders;
        }
        
        /// <summary>
        /// 統計情報を取得
        /// </summary>
        public (int patternCount, int paraphraseCount) GetStatistics()
        {
            return (_syntaxPatterns.Count, _paraphrases.Count);
        }
    }
}
