#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;

namespace NarrativeGen.Core.Syntax
{
    /// <summary>
    /// 言い換え管理 - 表現のバリエーション提供
    /// </summary>
    public class Paraphrase
    {
        public string ParaphraseId { get; set; } = string.Empty;
        public string OriginalText { get; set; } = string.Empty;
        public List<string> Variations { get; set; } = new();
        public string Context { get; set; } = string.Empty;
        public float Frequency { get; set; } = 1.0f;
        public Dictionary<string, string> ContextConditions { get; set; } = new();
        
        private Random _random = new Random();
        
        /// <summary>
        /// コンストラクタ
        /// </summary>
        public Paraphrase()
        {
        }
        
        /// <summary>
        /// 指定されたコンテキストで使用可能かチェック
        /// </summary>
        public bool CanUseInContext(string context, Dictionary<string, object>? properties = null)
        {
            // コンテキストチェック
            if (!string.IsNullOrEmpty(Context) && Context != context)
            {
                return false;
            }
            
            // コンテキスト条件チェック
            if (properties != null)
            {
                foreach (var condition in ContextConditions)
                {
                    if (!CheckContextCondition(condition.Key, condition.Value, properties))
                    {
                        return false;
                    }
                }
            }
            
            return true;
        }
        
        /// <summary>
        /// コンテキスト条件のチェック
        /// </summary>
        private bool CheckContextCondition(string propertyName, string expectedValue, Dictionary<string, object> properties)
        {
            if (!properties.ContainsKey(propertyName))
            {
                return false;
            }
            
            var actualValue = properties[propertyName]?.ToString() ?? string.Empty;
            return actualValue == expectedValue;
        }
        
        /// <summary>
        /// ランダムなバリエーションを選択
        /// </summary>
        public string GetRandomVariation()
        {
            if (Variations.Count == 0)
            {
                return OriginalText;
            }
            
            // 頻度に基づく選択
            if (_random.NextDouble() > Frequency)
            {
                return OriginalText;
            }
            
            var index = _random.Next(Variations.Count);
            return Variations[index];
        }
        
        /// <summary>
        /// 指定されたインデックスのバリエーションを取得
        /// </summary>
        public string GetVariation(int index)
        {
            if (index < 0 || index >= Variations.Count)
            {
                return OriginalText;
            }
            
            return Variations[index];
        }
        
        /// <summary>
        /// 全てのバリエーション（オリジナルを含む）を取得
        /// </summary>
        public List<string> GetAllVariations()
        {
            var result = new List<string> { OriginalText };
            result.AddRange(Variations);
            return result;
        }
        
        /// <summary>
        /// 最適なバリエーションを選択（コンテキストと使用頻度を考慮）
        /// </summary>
        public string SelectBestVariation(string context, Dictionary<string, object>? properties = null, Dictionary<string, int>? usageHistory = null)
        {
            if (!CanUseInContext(context, properties))
            {
                return OriginalText;
            }
            
            var availableVariations = GetAllVariations();
            
            // 使用履歴がある場合、使用頻度の低いものを優先
            if (usageHistory != null)
            {
                var leastUsed = availableVariations
                    .OrderBy(v => usageHistory.GetValueOrDefault(v, 0))
                    .First();
                return leastUsed;
            }
            
            // 通常のランダム選択
            return GetRandomVariation();
        }
        
        /// <summary>
        /// バリエーションを追加
        /// </summary>
        public void AddVariation(string variation)
        {
            if (!string.IsNullOrEmpty(variation) && !Variations.Contains(variation))
            {
                Variations.Add(variation);
            }
        }
        
        /// <summary>
        /// バリエーションを削除
        /// </summary>
        public bool RemoveVariation(string variation)
        {
            return Variations.Remove(variation);
        }
        
        /// <summary>
        /// デバッグ用文字列表現
        /// </summary>
        public override string ToString()
        {
            return $"Paraphrase[{ParaphraseId}]: '{OriginalText}' -> {Variations.Count} variations (Freq: {Frequency})";
        }
    }
}
