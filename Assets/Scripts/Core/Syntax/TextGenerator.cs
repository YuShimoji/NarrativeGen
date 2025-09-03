using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Core.Entities;

namespace NarrativeGen.Core.Syntax
{
    /// <summary>
    /// テキスト生成エンジン - Entity-Propertyシステムと構文パターンを統合
    /// </summary>
    public class TextGenerator
    {
        private List<SyntaxPattern> _syntaxPatterns;
        private Dictionary<string, Paraphrase> _paraphrases;
        private Dictionary<string, int> _usageHistory;
        private Random _random;
        
        /// <summary>
        /// コンストラクタ
        /// </summary>
        public TextGenerator()
        {
            _syntaxPatterns = new List<SyntaxPattern>();
            _paraphrases = new Dictionary<string, Paraphrase>();
            _usageHistory = new Dictionary<string, int>();
            _random = new Random();
        }
        
        /// <summary>
        /// 構文パターンを追加
        /// </summary>
        public void AddSyntaxPattern(SyntaxPattern pattern)
        {
            _syntaxPatterns.Add(pattern);
        }
        
        /// <summary>
        /// 言い換えを追加
        /// </summary>
        public void AddParaphrase(Paraphrase paraphrase)
        {
            _paraphrases[paraphrase.ParaphraseId] = paraphrase;
        }
        
        /// <summary>
        /// エンティティの説明文を生成
        /// </summary>
        public string GenerateDescription(Entity entity, string category = "description")
        {
            var properties = ConvertEntityToProperties(entity);
            
            // 適用可能なパターンを取得
            var applicablePatterns = _syntaxPatterns
                .Where(p => p.Category == category && p.CanApply(properties))
                .OrderByDescending(p => p.CalculateScore(properties))
                .ToList();
            
            if (!applicablePatterns.Any())
            {
                return GenerateFallbackDescription(entity);
            }
            
            // 最適なパターンを選択
            var selectedPattern = applicablePatterns.First();
            
            // テキスト生成
            var generatedText = selectedPattern.GenerateText(properties);
            
            // 言い換え適用
            generatedText = ApplyParaphrases(generatedText, category, properties);
            
            // 使用履歴更新
            UpdateUsageHistory(selectedPattern.PatternId);
            
            return generatedText;
        }
        
        /// <summary>
        /// 複数エンティティを含むナラティブテキストを生成
        /// </summary>
        public string GenerateNarrative(List<Entity> entities, string context)
        {
            var narrativeParts = new List<string>();
            
            foreach (var entity in entities)
            {
                var description = GenerateDescription(entity, context);
                narrativeParts.Add(description);
            }
            
            // エンティティ間の関係性を考慮した結合
            return CombineNarrativeParts(narrativeParts, entities, context);
        }
        
        /// <summary>
        /// 選択肢を生成
        /// </summary>
        public List<string> GenerateChoices(Entity entity, string situation)
        {
            var choices = new List<string>();
            var properties = ConvertEntityToProperties(entity);
            
            // 選択肢パターンを取得
            var choicePatterns = _syntaxPatterns
                .Where(p => p.Category == "choice" && p.CanApply(properties))
                .OrderByDescending(p => p.CalculateScore(properties))
                .Take(3) // 最大3つの選択肢
                .ToList();
            
            foreach (var pattern in choicePatterns)
            {
                var choiceText = pattern.GenerateText(properties);
                choiceText = ApplyParaphrases(choiceText, "choice", properties);
                choices.Add(choiceText);
            }
            
            // 最低限の選択肢を保証
            if (choices.Count == 0)
            {
                choices.Add($"{entity.Id}について調べる");
                choices.Add("他の場所に移動する");
            }
            
            return choices;
        }
        
        /// <summary>
        /// エンティティをプロパティ辞書に変換
        /// </summary>
        private Dictionary<string, object> ConvertEntityToProperties(Entity entity)
        {
            var properties = new Dictionary<string, object>
            {
                ["id"] = entity.Id,
                ["type"] = entity.TypeId
            };
            
            // エンティティのプロパティを追加
            var entityProperties = entity.Properties;
            foreach (var prop in entityProperties)
            {
                properties[prop.Key] = prop.Value.Value;
            }
            
            return properties;
        }
        
        /// <summary>
        /// 言い換えを適用
        /// </summary>
        private string ApplyParaphrases(string text, string context, Dictionary<string, object> properties)
        {
            var result = text;
            
            foreach (var paraphrase in _paraphrases.Values)
            {
                if (paraphrase.CanUseInContext(context, properties) && 
                    result.Contains(paraphrase.OriginalText))
                {
                    var replacement = paraphrase.SelectBestVariation(context, properties, _usageHistory);
                    result = result.Replace(paraphrase.OriginalText, replacement);
                    
                    // 使用履歴更新
                    UpdateUsageHistory(replacement);
                }
            }
            
            return result;
        }
        
        /// <summary>
        /// フォールバック説明文生成
        /// </summary>
        private string GenerateFallbackDescription(Entity entity)
        {
            var properties = entity.Properties;
            
            if (properties.ContainsKey("name"))
            {
                return $"{properties["name"].Value}です。";
            }
            
            return $"{entity.Id}は{entity.TypeId}の一種です。";
        }
        
        /// <summary>
        /// ナラティブパーツを結合
        /// </summary>
        private string CombineNarrativeParts(List<string> parts, List<Entity> entities, string context)
        {
            if (parts.Count == 0) return string.Empty;
            if (parts.Count == 1) return parts[0];
            
            // シンプルな結合（将来的により高度なロジックを実装）
            return string.Join(" ", parts);
        }
        
        /// <summary>
        /// 使用履歴を更新
        /// </summary>
        private void UpdateUsageHistory(string item)
        {
            if (_usageHistory.ContainsKey(item))
            {
                _usageHistory[item]++;
            }
            else
            {
                _usageHistory[item] = 1;
            }
        }
        
        /// <summary>
        /// 統計情報を取得
        /// </summary>
        public (int patternCount, int paraphraseCount, int usageCount) GetStatistics()
        {
            return (_syntaxPatterns.Count, _paraphrases.Count, _usageHistory.Count);
        }
        
        /// <summary>
        /// 使用履歴をクリア
        /// </summary>
        public void ClearUsageHistory()
        {
            _usageHistory.Clear();
        }
    }
}
