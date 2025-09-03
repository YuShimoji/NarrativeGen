using System;
using System.Collections.Generic;

namespace NarrativeGen.Core.Models
{
    /// <summary>
    /// Entity: プロパティを持つゲーム内の全ての事物
    /// memo.txt の設計思想に基づく実装
    /// </summary>
    public class Entity
    {
        #region Properties
        public string Id { get; }
        public string Name { get; set; }
        public Dictionary<string, object> Properties { get; }
        public DateTime CreatedAt { get; }
        public DateTime LastModified { get; private set; }
        #endregion

        #region Constructor
        public Entity(string id, string? name = null)
        {
            Id = id ?? throw new ArgumentNullException(nameof(id));
            Name = name ?? id;
            Properties = new Dictionary<string, object>();
            CreatedAt = DateTime.UtcNow;
            LastModified = DateTime.UtcNow;
        }
        #endregion

        #region Property Management
        /// <summary>
        /// プロパティの設定
        /// 既定値 → コモン値 → 個別値の優先順位システム
        /// </summary>
        public void SetProperty(string key, object value)
        {
            Properties[key] = value;
            LastModified = DateTime.UtcNow;
        }

        /// <summary>
        /// プロパティの取得
        /// 継承チェーン: 個別値 → コモン値 → 既定値
        /// </summary>
        public T? GetProperty<T>(string key, T? defaultValue = default)
        {
            if (Properties.TryGetValue(key, out var value))
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

            // TODO: コモン値・既定値の参照実装
            return defaultValue;
        }

        /// <summary>
        /// プロパティが存在するかチェック
        /// </summary>
        public bool HasProperty(string key)
        {
            return Properties.ContainsKey(key);
        }

        /// <summary>
        /// プロパティの削除
        /// </summary>
        public bool RemoveProperty(string key)
        {
            if (Properties.Remove(key))
            {
                LastModified = DateTime.UtcNow;
                return true;
            }
            return false;
        }
        #endregion

        #region Comparison & Reasoning
        /// <summary>
        /// 他のEntityとのプロパティ比較
        /// memo.txt のチーズバーガー例による違和感検出
        /// </summary>
        public float CompareProperty(Entity other, string propertyKey, float tolerancePercent = 10.0f)
        {
            var thisValue = GetProperty<float>(propertyKey);
            var otherValue = other.GetProperty<float>(propertyKey);

            if (thisValue == null || otherValue == null)
                return float.NaN;

            var difference = Math.Abs(thisValue.Value - otherValue.Value);
            var averageValue = (thisValue.Value + otherValue.Value) / 2.0f;
            
            if (averageValue == 0) return 0;
            
            var percentageDifference = (difference / averageValue) * 100.0f;
            return percentageDifference;
        }

        /// <summary>
        /// 違和感の検出（許容範囲外かどうか）
        /// </summary>
        public bool DetectInconsistency(Entity expected, string propertyKey, float tolerancePercent = 10.0f)
        {
            var difference = CompareProperty(expected, propertyKey, tolerancePercent);
            return !float.IsNaN(difference) && difference > tolerancePercent;
        }
        #endregion

        #region Utility
        public override string ToString()
        {
            return $"Entity[{Id}]: {Name} ({Properties.Count} properties)";
        }

        public Entity Clone(string? newId = null)
        {
            var clone = new Entity(newId ?? Guid.NewGuid().ToString(), Name);
            foreach (var prop in Properties)
            {
                clone.SetProperty(prop.Key, prop.Value);
            }
            return clone;
        }
        #endregion
    }
} 