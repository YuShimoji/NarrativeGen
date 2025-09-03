#nullable enable
using System;

namespace NarrativeGen.Domain.ValueObjects
{
    /// <summary>
    /// プロパティ値 - memo.txtの「既定値・設定値・範囲」を実現
    /// </summary>
    public class PropertyValue
    {
        public object Value { get; }
        public PropertySource Source { get; }
        public DateTime CreatedAt { get; }

        public PropertyValue(object value, PropertySource source = PropertySource.Direct)
        {
            Value = value ?? throw new ArgumentNullException(nameof(value));
            Source = source;
            CreatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// 型安全な値取得
        /// </summary>
        public T GetValue<T>()
        {
            if (Value is T typedValue)
                return typedValue;
            
            throw new InvalidCastException($"Cannot cast {Value.GetType()} to {typeof(T)}");
        }

        /// <summary>
        /// 値の比較
        /// </summary>
        public bool Equals(PropertyValue? other)
        {
            return other != null && Value.Equals(other.Value);
        }

        public override string ToString()
        {
            return $"{Value} (Source: {Source})";
        }
    }

    /// <summary>
    /// プロパティの取得元 - memo.txtの階層的継承を表現
    /// </summary>
    public enum PropertySource
    {
        Direct,      // 直接設定
        Inherited,   // 親タイプから継承
        Default      // デフォルト値
    }
}
