#nullable enable
using System;
using System.Collections.Generic;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Domain.Entities
{
    /// <summary>
    /// エンティティタイプ - memo.txtの階層的継承「携帯食料 → マックのチーズバーガー」を実現
    /// </summary>
    public class EntityType
    {
        public string Id { get; }
        public string Name { get; }
        public string? ParentTypeId { get; }
        private readonly Dictionary<string, PropertyValue> _defaultProperties;

        public EntityType(string id, string name, string? parentTypeId = null)
        {
            Id = id ?? throw new ArgumentNullException(nameof(id));
            Name = name ?? throw new ArgumentNullException(nameof(name));
            ParentTypeId = parentTypeId;
            _defaultProperties = new Dictionary<string, PropertyValue>();
        }

        /// <summary>
        /// デフォルトプロパティの設定 - memo.txtの「既定値」概念
        /// </summary>
        public void SetDefaultProperty(string name, object value)
        {
            _defaultProperties[name] = new PropertyValue(value, PropertySource.Default);
        }

        /// <summary>
        /// デフォルトプロパティの取得
        /// </summary>
        public PropertyValue? GetDefaultProperty(string name)
        {
            return _defaultProperties.TryGetValue(name, out var value) ? value : null;
        }

        /// <summary>
        /// 全デフォルトプロパティの取得
        /// </summary>
        public IReadOnlyDictionary<string, PropertyValue> GetAllDefaultProperties()
        {
            return _defaultProperties;
        }

        /// <summary>
        /// 親タイプを持つかどうか
        /// </summary>
        public bool HasParent => !string.IsNullOrEmpty(ParentTypeId);
    }
}
