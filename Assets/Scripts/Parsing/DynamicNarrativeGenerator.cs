using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using NarrativeGen.Data;
using NarrativeGen.Data.Models;

namespace NarrativeGen.Parsing
{
    /// <summary>
    /// 動的にナラティブテキストを生成するシステム
    /// Entity情報とコンテキストに基づいてリッチな記述を作成
    /// </summary>
    public class DynamicNarrativeGenerator
    {
        #region Private Fields
        private readonly WorldState m_WorldState;
        private readonly EntityDescriptionSystem m_EntitySystem;
        private readonly Dictionary<string, List<string>> m_VariationDatabase;
        private readonly System.Random m_Random;
        #endregion

        #region Constructor
        public DynamicNarrativeGenerator(WorldState worldState)
        {
            m_WorldState = worldState;
            m_EntitySystem = new EntityDescriptionSystem();
            m_VariationDatabase = new Dictionary<string, List<string>>();
            m_Random = new System.Random();
            InitializeVariationDatabase();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// テキストを生成・拡張
        /// </summary>
        public string GenerateText(string baseText)
        {
            if (string.IsNullOrEmpty(baseText))
                return baseText;

            string result = baseText;
            
            // Entity参照の解決
            result = ResolveEntityReferences(result);
            
            // バリエーション適用
            result = ApplyTextVariations(result);
            
            // コンテキスト拡張
            result = EnhanceWithContext(result);

            return result;
        }

        /// <summary>
        /// 特定のEntityの説明文を生成
        /// </summary>
        public string GenerateEntityDescription(string entityId)
        {
            return m_EntitySystem.GenerateEntityDescription(entityId);
        }

        /// <summary>
        /// テキストバリエーションを取得
        /// </summary>
        public List<string> GetTextVariations(string originalText)
        {
            var variations = new List<string> { originalText };
            
            // 基本的な置換パターン
            foreach (var pattern in GetReplacementPatterns())
            {
                if (originalText.Contains(pattern.Key))
                {
                    foreach (var replacement in pattern.Value)
                    {
                        string variant = originalText.Replace(pattern.Key, replacement);
                        if (!variations.Contains(variant))
                        {
                            variations.Add(variant);
                        }
                    }
                }
            }

            return variations;
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// Entity参照（[entityName]）を解決
        /// </summary>
        private string ResolveEntityReferences(string text)
        {
            while (text.Contains('[') && text.Contains(']'))
            {
                int start = text.IndexOf('[');
                int end = text.IndexOf(']', start);
                
                if (start >= 0 && end > start)
                {
                    string entityRef = text.Substring(start + 1, end - start - 1);
                    string description = GenerateEntityDescription(entityRef);
                    text = text.Replace($"[{entityRef}]", description);
                }
                else
                {
                    break;
                }
            }

            return text;
        }

        /// <summary>
        /// テキストバリエーションを適用
        /// </summary>
        private string ApplyTextVariations(string text)
        {
            foreach (var variation in m_VariationDatabase)
            {
                if (text.Contains(variation.Key) && variation.Value.Count > 0)
                {
                    // ランダムにバリエーションを選択
                    string replacement = variation.Value[m_Random.Next(variation.Value.Count)];
                    text = text.Replace(variation.Key, replacement);
                }
            }

            return text;
        }

        /// <summary>
        /// コンテキストによる拡張
        /// </summary>
        private string EnhanceWithContext(string text)
        {
            // 現在の状況に応じてテキストを拡張
            if (m_WorldState != null)
            {
                // 時間帯による修飾
                string timeOfDay = m_WorldState.GetProperty("time_of_day")?.ToString() ?? "unknown";
                if (timeOfDay == "night" && !text.Contains("暗"))
                {
                    text = AddAtmosphericDetail(text, "darkness");
                }
                
                // 天気による修飾
                string weather = m_WorldState.GetProperty("weather")?.ToString() ?? "clear";
                if (weather == "rain" && !text.Contains("雨"))
                {
                    text = AddAtmosphericDetail(text, "rain");
                }
            }

            return text;
        }

        /// <summary>
        /// 雰囲気の詳細を追加
        /// </summary>
        private string AddAtmosphericDetail(string text, string atmosphere)
        {
            switch (atmosphere)
            {
                case "darkness":
                    return text + "。薄暗い影が辺りを包んでいる";
                case "rain":
                    return text + "。外では雨音が静かに響いている";
                default:
                    return text;
            }
        }

        /// <summary>
        /// バリエーションデータベースの初期化
        /// </summary>
        private void InitializeVariationDatabase()
        {
            m_VariationDatabase["あなた"] = new List<string> { "プレイヤー", "主人公", "君" };
            m_VariationDatabase["部屋"] = new List<string> { "空間", "室内", "場所" };
            m_VariationDatabase["見る"] = new List<string> { "観察する", "眺める", "注視する" };
            m_VariationDatabase["立つ"] = new List<string> { "佇む", "位置する", "立ち止まる" };
            m_VariationDatabase["古い"] = new List<string> { "年代物の", "歴史ある", "使い込まれた" };
            m_VariationDatabase["大きな"] = new List<string> { "巨大な", "立派な", "堂々とした" };
            m_VariationDatabase["小さな"] = new List<string> { "こぢんまりとした", "可愛らしい", "控えめな" };
        }

        /// <summary>
        /// 置換パターンを取得
        /// </summary>
        private Dictionary<string, List<string>> GetReplacementPatterns()
        {
            return m_VariationDatabase;
        }
        #endregion
    }
} 