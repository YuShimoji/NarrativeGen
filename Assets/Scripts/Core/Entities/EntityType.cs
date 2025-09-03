using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace NarrativeGen.Core.Entities
{
    /// <summary>
    /// EntityTypeはEntityのテンプレートを定義
    /// デフォルトプロパティ、検証ルール、描写パターンを管理
    /// </summary>
    [Serializable]
    public class EntityType
    {
        public string TypeId { get; set; }
        public string ParentTypeId { get; set; }
        public string TypeName { get; set; }
        public string Description { get; set; }
        
        private Dictionary<string, PropertyValue> _defaultProperties;
        private Dictionary<string, ValidationRule> _validationRules;
        private List<string> _descriptionPatterns;

        public Dictionary<string, PropertyValue> DefaultProperties => _defaultProperties;
        public Dictionary<string, ValidationRule> ValidationRules => _validationRules;
        public List<string> DescriptionPatterns => _descriptionPatterns;

        public EntityType()
        {
            _defaultProperties = new Dictionary<string, PropertyValue>();
            _validationRules = new Dictionary<string, ValidationRule>();
            _descriptionPatterns = new List<string>();
        }

        public EntityType(string typeId, string typeName, string parentTypeId = null) : this()
        {
            TypeId = typeId;
            TypeName = typeName;
            ParentTypeId = parentTypeId;
        }

        /// <summary>
        /// このEntityTypeのインスタンスを作成
        /// </summary>
        public Entity CreateInstance(string instanceId)
        {
            var entity = new Entity(instanceId, TypeId);
            
            // デフォルトプロパティを設定
            foreach (var kvp in _defaultProperties)
            {
                var defaultProperty = new PropertyValue
                {
                    Name = kvp.Value.Name,
                    Value = kvp.Value.Value,
                    Type = kvp.Value.Type,
                    Source = PropertySource.Default,
                    Confidence = kvp.Value.Confidence,
                    LastModified = DateTime.Now,
                    IsInherited = false
                };
                entity.Properties[kvp.Key] = defaultProperty;
            }

            return entity;
        }

        /// <summary>
        /// デフォルトプロパティを追加
        /// </summary>
        public void AddDefaultProperty(string name, object value, PropertyType type = PropertyType.String)
        {
            var property = new PropertyValue(name, value, type, PropertySource.Default);
            _defaultProperties[name] = property;
        }

        /// <summary>
        /// 検証ルールを追加
        /// </summary>
        public void AddValidationRule(string propertyName, ValidationRule rule)
        {
            _validationRules[propertyName] = rule;
        }

        /// <summary>
        /// 描写パターンを追加
        /// </summary>
        public void AddDescriptionPattern(string pattern)
        {
            if (!_descriptionPatterns.Contains(pattern))
            {
                _descriptionPatterns.Add(pattern);
            }
        }

        /// <summary>
        /// 親EntityTypeからプロパティとルールを継承
        /// </summary>
        public void InheritFrom(EntityType parentType)
        {
            if (parentType == null) return;

            // デフォルトプロパティの継承
            foreach (var kvp in parentType._defaultProperties)
            {
                if (!_defaultProperties.ContainsKey(kvp.Key))
                {
                    var inheritedProperty = kvp.Value.CreateInheritedCopy();
                    _defaultProperties[kvp.Key] = inheritedProperty;
                }
            }

            // 検証ルールの継承
            foreach (var kvp in parentType._validationRules)
            {
                if (!_validationRules.ContainsKey(kvp.Key))
                {
                    _validationRules[kvp.Key] = kvp.Value;
                }
            }

            // 描写パターンの継承
            foreach (var pattern in parentType._descriptionPatterns)
            {
                if (!_descriptionPatterns.Contains(pattern))
                {
                    _descriptionPatterns.Add(pattern);
                }
            }
        }

        /// <summary>
        /// Entityが型の制約を満たしているかを検証
        /// </summary>
        public ValidationResult ValidateEntity(Entity entity)
        {
            var result = new ValidationResult { IsValid = true };

            foreach (var kvp in _validationRules)
            {
                string propertyName = kvp.Key;
                ValidationRule rule = kvp.Value;
                
                var property = entity.GetProperty(propertyName);
                if (property == null)
                {
                    if (rule.IsRequired)
                    {
                        result.IsValid = false;
                        result.Errors.Add($"Required property '{propertyName}' is missing");
                    }
                    continue;
                }

                var ruleResult = rule.Validate(property.Value);
                if (!ruleResult.IsValid)
                {
                    result.IsValid = false;
                    result.Errors.AddRange(ruleResult.Errors.Select(e => $"Property '{propertyName}': {e}"));
                }
            }

            return result;
        }

        /// <summary>
        /// CSVデータからEntityTypeを構築
        /// </summary>
        public static EntityType FromCsvData(string typeId, string parentTypeId, string typeName, 
            string description, string defaultPropertiesJson, string validationRulesJson, 
            string descriptionPatternsJson)
        {
            var entityType = new EntityType(typeId, typeName, parentTypeId)
            {
                Description = description
            };

            // デフォルトプロパティの解析
            if (!string.IsNullOrEmpty(defaultPropertiesJson))
            {
                try
                {
                    var defaultProps = JsonConvert.DeserializeObject<Dictionary<string, object>>(defaultPropertiesJson);
                    foreach (var kvp in defaultProps)
                    {
                        var propertyType = InferPropertyType(kvp.Value);
                        entityType.AddDefaultProperty(kvp.Key, kvp.Value, propertyType);
                    }
                }
                catch (Exception ex)
                {
                    throw new ArgumentException($"Invalid default properties JSON for type {typeId}: {ex.Message}");
                }
            }

            // 検証ルールの解析
            if (!string.IsNullOrEmpty(validationRulesJson))
            {
                try
                {
                    var rules = JsonConvert.DeserializeObject<Dictionary<string, Dictionary<string, object>>>(validationRulesJson);
                    foreach (var kvp in rules)
                    {
                        var rule = ValidationRule.FromDictionary(kvp.Value);
                        entityType.AddValidationRule(kvp.Key, rule);
                    }
                }
                catch (Exception ex)
                {
                    throw new ArgumentException($"Invalid validation rules JSON for type {typeId}: {ex.Message}");
                }
            }

            // 描写パターンの解析
            if (!string.IsNullOrEmpty(descriptionPatternsJson))
            {
                try
                {
                    var patterns = JsonConvert.DeserializeObject<List<string>>(descriptionPatternsJson);
                    foreach (var pattern in patterns)
                    {
                        entityType.AddDescriptionPattern(pattern);
                    }
                }
                catch (Exception ex)
                {
                    throw new ArgumentException($"Invalid description patterns JSON for type {typeId}: {ex.Message}");
                }
            }

            return entityType;
        }

        private static PropertyType InferPropertyType(object value)
        {
            if (value == null) return PropertyType.String;
            
            switch (value.GetType().Name)
            {
                case "Boolean":
                    return PropertyType.Bool;
                case "Int32":
                case "Int64":
                    return PropertyType.Integer;
                case "Single":
                case "Double":
                    return PropertyType.Float;
                case "DateTime":
                    return PropertyType.DateTime;
                default:
                    return PropertyType.String;
            }
        }

        public override string ToString()
        {
            return $"EntityType[{TypeId}] Name:{TypeName} Parent:{ParentTypeId} DefaultProps:{_defaultProperties.Count} Rules:{_validationRules.Count}";
        }
    }

    /// <summary>
    /// プロパティの検証ルール
    /// </summary>
    [Serializable]
    public class ValidationRule
    {
        public bool IsRequired { get; set; }
        public object MinValue { get; set; }
        public object MaxValue { get; set; }
        public List<object> AllowedValues { get; set; }
        public string Pattern { get; set; }

        public ValidationRule()
        {
            AllowedValues = new List<object>();
        }

        public ValidationResult Validate(object value)
        {
            var result = new ValidationResult { IsValid = true };

            if (value == null)
            {
                if (IsRequired)
                {
                    result.IsValid = false;
                    result.Errors.Add("Value is required but null");
                }
                return result;
            }

            // 許可値チェック
            if (AllowedValues.Count > 0 && !AllowedValues.Contains(value))
            {
                result.IsValid = false;
                result.Errors.Add($"Value '{value}' is not in allowed values: [{string.Join(", ", AllowedValues)}]");
            }

            // 数値範囲チェック
            if (value is IComparable comparableValue)
            {
                if (MinValue != null && comparableValue.CompareTo(MinValue) < 0)
                {
                    result.IsValid = false;
                    result.Errors.Add($"Value '{value}' is less than minimum '{MinValue}'");
                }
                if (MaxValue != null && comparableValue.CompareTo(MaxValue) > 0)
                {
                    result.IsValid = false;
                    result.Errors.Add($"Value '{value}' is greater than maximum '{MaxValue}'");
                }
            }

            // パターンチェック（文字列の場合）
            if (!string.IsNullOrEmpty(Pattern) && value is string stringValue)
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(stringValue, Pattern))
                {
                    result.IsValid = false;
                    result.Errors.Add($"Value '{value}' does not match pattern '{Pattern}'");
                }
            }

            return result;
        }

        public static ValidationRule FromDictionary(Dictionary<string, object> dict)
        {
            var rule = new ValidationRule();

            if (dict.TryGetValue("required", out object required))
                rule.IsRequired = Convert.ToBoolean(required);

            if (dict.TryGetValue("min", out object min))
                rule.MinValue = min;

            if (dict.TryGetValue("max", out object max))
                rule.MaxValue = max;

            if (dict.TryGetValue("allowed", out object allowed) && allowed is List<object> allowedList)
                rule.AllowedValues = allowedList;

            if (dict.TryGetValue("pattern", out object pattern))
                rule.Pattern = pattern.ToString();

            return rule;
        }
    }

    /// <summary>
    /// 検証結果
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; }

        public ValidationResult()
        {
            Errors = new List<string>();
        }
    }
}
