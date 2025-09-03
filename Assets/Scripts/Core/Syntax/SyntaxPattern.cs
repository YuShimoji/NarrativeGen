using System;
using System.Collections.Generic;
using System.Linq;

namespace NarrativeGen.Core.Syntax
{
    /// <summary>
    /// 構文パターン - テンプレートベースの文生成
    /// </summary>
    public class SyntaxPattern
    {
        public string PatternId { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Template { get; set; } = string.Empty;
        public List<string> RequiredProperties { get; set; } = new();
        public Dictionary<string, string> Conditions { get; set; } = new();
        public int Priority { get; set; } = 0;
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// コンストラクタ
        /// </summary>
        public SyntaxPattern()
        {
        }
        
        /// <summary>
        /// 必要なプロパティが全て満たされているかチェック
        /// </summary>
        public bool CanApply(Dictionary<string, object> properties)
        {
            // 必須プロパティの存在チェック
            foreach (var requiredProp in RequiredProperties)
            {
                if (!properties.ContainsKey(requiredProp) || properties[requiredProp] == null)
                {
                    return false;
                }
            }
            
            // 条件チェック
            foreach (var condition in Conditions)
            {
                if (!CheckCondition(condition.Key, condition.Value, properties))
                {
                    return false;
                }
            }
            
            return true;
        }
        
        /// <summary>
        /// 条件チェック
        /// </summary>
        private bool CheckCondition(string propertyName, string expectedValue, Dictionary<string, object> properties)
        {
            if (!properties.ContainsKey(propertyName))
            {
                return false;
            }
            
            var actualValue = properties[propertyName]?.ToString() ?? string.Empty;
            
            // 複数値の場合（カンマ区切り）
            if (expectedValue.Contains(','))
            {
                var expectedValues = expectedValue.Split(',').Select(v => v.Trim()).ToList();
                return expectedValues.Contains(actualValue);
            }
            
            // 否定条件（!で始まる）
            if (expectedValue.StartsWith("!"))
            {
                return actualValue != expectedValue.Substring(1);
            }
            
            // 通常の等価チェック
            return actualValue == expectedValue;
        }
        
        /// <summary>
        /// テンプレートにプロパティ値を適用してテキスト生成
        /// </summary>
        public string GenerateText(Dictionary<string, object> properties)
        {
            if (!CanApply(properties))
            {
                throw new InvalidOperationException($"Pattern {PatternId} cannot be applied with given properties");
            }
            
            var result = Template;
            
            // プレースホルダー置換 {property_name}
            foreach (var prop in properties)
            {
                var placeholder = $"{{{prop.Key}}}";
                if (result.Contains(placeholder))
                {
                    result = result.Replace(placeholder, prop.Value?.ToString() ?? string.Empty);
                }
            }
            
            return result;
        }
        
        /// <summary>
        /// パターンの適用可能性スコア計算
        /// </summary>
        public float CalculateScore(Dictionary<string, object> properties)
        {
            if (!CanApply(properties))
            {
                return 0f;
            }
            
            float score = Priority; // 基本スコア
            
            // 必須プロパティの充足度
            var satisfiedProps = RequiredProperties.Count(prop => 
                properties.ContainsKey(prop) && properties[prop] != null);
            score += (float)satisfiedProps / RequiredProperties.Count * 10;
            
            // 条件の適合度
            var satisfiedConditions = Conditions.Count(condition => 
                CheckCondition(condition.Key, condition.Value, properties));
            if (Conditions.Count > 0)
            {
                score += (float)satisfiedConditions / Conditions.Count * 5;
            }
            
            return score;
        }
        
        /// <summary>
        /// デバッグ用文字列表現
        /// </summary>
        public override string ToString()
        {
            return $"SyntaxPattern[{PatternId}]: {Template} (Priority: {Priority})";
        }
    }
}
