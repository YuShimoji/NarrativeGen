using System;

namespace NarrativeGen.Core.Entities
{
    /// <summary>
    /// Entityのプロパティ値を表現するクラス
    /// 値、型、由来、信頼度などの情報を保持
    /// </summary>
    [Serializable]
    public class PropertyValue
    {
        public string Name { get; set; }
        public object Value { get; set; }
        public PropertyType Type { get; set; }
        public PropertySource Source { get; set; }
        public float Confidence { get; set; }
        public DateTime LastModified { get; set; }
        public bool IsInherited { get; set; }

        public PropertyValue()
        {
            Confidence = 1.0f;
            LastModified = DateTime.Now;
            IsInherited = false;
        }

        public PropertyValue(string name, object value, PropertyType type = PropertyType.String, PropertySource source = PropertySource.Default)
        {
            Name = name;
            Value = value;
            Type = type;
            Source = source;
            Confidence = 1.0f;
            LastModified = DateTime.Now;
            IsInherited = false;
        }

        /// <summary>
        /// プロパティ値を文字列として取得
        /// </summary>
        public override string ToString()
        {
            if (Value == null) return "";
            return Value.ToString();
        }

        /// <summary>
        /// 他のPropertyValueとの比較（類似度計算）
        /// </summary>
        public float CompareTo(PropertyValue other)
        {
            if (other == null || other.Value == null || Value == null)
                return 0.0f;

            if (Type != other.Type)
                return 0.0f;

            switch (Type)
            {
                case PropertyType.String:
                    return CompareStrings(Value.ToString(), other.Value.ToString());
                case PropertyType.Float:
                    return CompareFloats((float)Value, (float)other.Value);
                case PropertyType.Bool:
                    return Value.Equals(other.Value) ? 1.0f : 0.0f;
                case PropertyType.Integer:
                    return Value.Equals(other.Value) ? 1.0f : 0.0f;
                default:
                    return Value.Equals(other.Value) ? 1.0f : 0.0f;
            }
        }

        private float CompareStrings(string str1, string str2)
        {
            if (str1.Equals(str2, StringComparison.OrdinalIgnoreCase))
                return 1.0f;
            
            // 簡単な類似度計算（レーベンシュタイン距離ベース）
            int maxLength = Math.Max(str1.Length, str2.Length);
            if (maxLength == 0) return 1.0f;
            
            int distance = LevenshteinDistance(str1, str2);
            return 1.0f - (float)distance / maxLength;
        }

        private float CompareFloats(float val1, float val2)
        {
            float diff = Math.Abs(val1 - val2);
            float max = Math.Max(Math.Abs(val1), Math.Abs(val2));
            if (max == 0) return 1.0f;
            return Math.Max(0.0f, 1.0f - diff / max);
        }

        private int LevenshteinDistance(string str1, string str2)
        {
            int[,] matrix = new int[str1.Length + 1, str2.Length + 1];

            for (int i = 0; i <= str1.Length; i++)
                matrix[i, 0] = i;
            for (int j = 0; j <= str2.Length; j++)
                matrix[0, j] = j;

            for (int i = 1; i <= str1.Length; i++)
            {
                for (int j = 1; j <= str2.Length; j++)
                {
                    int cost = str1[i - 1] == str2[j - 1] ? 0 : 1;
                    matrix[i, j] = Math.Min(
                        Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                        matrix[i - 1, j - 1] + cost);
                }
            }

            return matrix[str1.Length, str2.Length];
        }

        /// <summary>
        /// 継承用のコピーを作成
        /// </summary>
        public PropertyValue CreateInheritedCopy()
        {
            return new PropertyValue
            {
                Name = Name,
                Value = Value,
                Type = Type,
                Source = PropertySource.Inherited,
                Confidence = Confidence * 0.9f, // 継承時は信頼度を若干下げる
                LastModified = DateTime.Now,
                IsInherited = true
            };
        }
    }

    /// <summary>
    /// プロパティのデータ型
    /// </summary>
    public enum PropertyType
    {
        String,
        Integer,
        Float,
        Bool,
        DateTime,
        Json
    }

    /// <summary>
    /// プロパティ値の由来
    /// </summary>
    public enum PropertySource
    {
        Default,        // デフォルト値
        Inherited,      // 継承された値
        Override,       // 上書きされた値
        Generated,      // 推論エンジンによる生成値
        UserInput       // ユーザー入力値
    }
}
