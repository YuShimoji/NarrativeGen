using System;
using System.Collections.Generic;
using System.Linq;

namespace NarrativeGen.Core.Entities
{
    /// <summary>
    /// Entity-Propertyシステムの核となるEntityクラス
    /// 階層的プロパティ継承とmemo.txtの仕様を実装
    /// </summary>
    [Serializable]
    public class Entity
    {
        public string Id { get; set; }
        public string TypeId { get; set; }
        public string ParentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUsed { get; set; }
        
        private Dictionary<string, PropertyValue> _properties;
        public Dictionary<string, PropertyValue> Properties => _properties;

        public Entity()
        {
            _properties = new Dictionary<string, PropertyValue>();
            CreatedAt = DateTime.Now;
            LastUsed = DateTime.Now;
        }

        public Entity(string id, string typeId, string parentId = null) : this()
        {
            Id = id;
            TypeId = typeId;
            ParentId = parentId;
        }

        /// <summary>
        /// プロパティ値を取得（継承チェーン考慮）
        /// </summary>
        public PropertyValue GetProperty(string name)
        {
            if (_properties.TryGetValue(name, out PropertyValue value))
            {
                return value;
            }
            return null;
        }

        /// <summary>
        /// プロパティ値を設定
        /// </summary>
        public void SetProperty(string name, object value, PropertyType type = PropertyType.String, PropertySource source = PropertySource.Override)
        {
            var propertyValue = new PropertyValue(name, value, type, source);
            _properties[name] = propertyValue;
            LastUsed = DateTime.Now;
        }

        /// <summary>
        /// 親Entityからプロパティを継承
        /// memo.txt仕様: 子は親のプロパティを継承し、上書き可能
        /// </summary>
        public void InheritFrom(Entity parent)
        {
            if (parent == null) return;

            foreach (var kvp in parent.Properties)
            {
                string propertyName = kvp.Key;
                PropertyValue parentProperty = kvp.Value;

                // 既に同名プロパティが存在する場合は継承しない（上書き優先）
                if (!_properties.ContainsKey(propertyName))
                {
                    var inheritedProperty = parentProperty.CreateInheritedCopy();
                    _properties[propertyName] = inheritedProperty;
                }
            }
        }

        /// <summary>
        /// Entityの完全なコピーを作成
        /// </summary>
        public Entity Clone()
        {
            var clone = new Entity(Id + "_clone", TypeId, ParentId)
            {
                CreatedAt = CreatedAt,
                LastUsed = DateTime.Now
            };

            foreach (var kvp in _properties)
            {
                clone._properties[kvp.Key] = new PropertyValue
                {
                    Name = kvp.Value.Name,
                    Value = kvp.Value.Value,
                    Type = kvp.Value.Type,
                    Source = kvp.Value.Source,
                    Confidence = kvp.Value.Confidence,
                    LastModified = kvp.Value.LastModified,
                    IsInherited = kvp.Value.IsInherited
                };
            }

            return clone;
        }

        /// <summary>
        /// 指定されたプロパティ名と値でEntityを検索するための比較
        /// </summary>
        public bool HasProperty(string propertyName, object expectedValue)
        {
            var property = GetProperty(propertyName);
            if (property == null) return false;

            if (expectedValue == null)
                return property.Value == null;

            return property.Value?.ToString().Equals(expectedValue.ToString(), StringComparison.OrdinalIgnoreCase) == true;
        }

        /// <summary>
        /// プロパティの類似度を計算（推論エンジン用）
        /// </summary>
        public float CalculatePropertySimilarity(Entity other)
        {
            if (other == null) return 0.0f;

            var allPropertyNames = _properties.Keys.Union(other._properties.Keys).ToList();
            if (allPropertyNames.Count == 0) return 1.0f;

            float totalSimilarity = 0.0f;
            int comparedProperties = 0;

            foreach (string propertyName in allPropertyNames)
            {
                var thisProperty = GetProperty(propertyName);
                var otherProperty = other.GetProperty(propertyName);

                if (thisProperty != null && otherProperty != null)
                {
                    totalSimilarity += thisProperty.CompareTo(otherProperty);
                    comparedProperties++;
                }
                else if (thisProperty == null && otherProperty == null)
                {
                    totalSimilarity += 1.0f;
                    comparedProperties++;
                }
                // 片方にしかないプロパティは類似度0として扱う
            }

            return comparedProperties > 0 ? totalSimilarity / comparedProperties : 0.0f;
        }

        /// <summary>
        /// デバッグ用の文字列表現
        /// </summary>
        public override string ToString()
        {
            var propertyStrings = _properties.Select(kvp => $"{kvp.Key}: {kvp.Value}");
            return $"Entity[{Id}] Type:{TypeId} Parent:{ParentId} Properties:[{string.Join(", ", propertyStrings)}]";
        }

        /// <summary>
        /// プロパティの検証（EntityTypeの検証ルールに基づく）
        /// </summary>
        public List<string> ValidateProperties(Dictionary<string, object> validationRules = null)
        {
            var errors = new List<string>();

            foreach (var property in _properties.Values)
            {
                // 基本的な型チェック
                if (property.Value != null)
                {
                    switch (property.Type)
                    {
                        case PropertyType.Float:
                            if (!(property.Value is float || property.Value is double))
                                errors.Add($"Property '{property.Name}' should be float but is {property.Value.GetType()}");
                            break;
                        case PropertyType.Integer:
                            if (!(property.Value is int || property.Value is long))
                                errors.Add($"Property '{property.Name}' should be integer but is {property.Value.GetType()}");
                            break;
                        case PropertyType.Bool:
                            if (!(property.Value is bool))
                                errors.Add($"Property '{property.Name}' should be boolean but is {property.Value.GetType()}");
                            break;
                    }
                }

                // 信頼度チェック
                if (property.Confidence < 0.0f || property.Confidence > 1.0f)
                {
                    errors.Add($"Property '{property.Name}' has invalid confidence: {property.Confidence}");
                }
            }

            return errors;
        }

        /// <summary>
        /// 使用履歴を更新
        /// </summary>
        public void RecordUsage()
        {
            LastUsed = DateTime.Now;
        }
    }
}
