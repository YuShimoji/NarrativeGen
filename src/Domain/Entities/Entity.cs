#nullable enable
using System;
using System.Collections.Generic;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Domain.Entities
{
    /// <summary>
    /// ドメインエンティティ - memo.txtの「Entity：プロパティを持つ」を実現
    /// シンプルな実装から開始
    /// </summary>
    public class Entity
    {
        public string Id { get; }
        public string TypeId { get; }
        private readonly Dictionary<string, PropertyValue> _properties;

        public Entity(string id, string typeId)
        {
            Id = id ?? throw new ArgumentNullException(nameof(id));
            TypeId = typeId ?? throw new ArgumentNullException(nameof(typeId));
            _properties = new Dictionary<string, PropertyValue>();
        }

        /// <summary>
        /// プロパティの設定 - memo.txtの「設定値」概念
        /// </summary>
        public void SetProperty(string name, object value, PropertySource source = PropertySource.Direct)
        {
            _properties[name] = new PropertyValue(value, source);
        }

        /// <summary>
        /// プロパティの取得 - 階層的継承を考慮
        /// </summary>
        public PropertyValue? GetProperty(string name)
        {
            return _properties.TryGetValue(name, out var value) ? value : null;
        }

        /// <summary>
        /// プロパティの存在確認
        /// </summary>
        public bool HasProperty(string name)
        {
            return _properties.ContainsKey(name);
        }

        /// <summary>
        /// 全プロパティの取得
        /// </summary>
        public IReadOnlyDictionary<string, PropertyValue> GetAllProperties()
        {
            return _properties;
        }
    }
}
