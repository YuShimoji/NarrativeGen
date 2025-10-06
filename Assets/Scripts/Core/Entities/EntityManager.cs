using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;

namespace NarrativeGen.Core.Entities
{
    /// <summary>
    /// Entity-Propertyシステムの中核管理クラス
    /// Entity生命周期、階層的継承、CSV読込みを管理
    /// </summary>
    public class EntityManager
    {
        private Dictionary<string, Entity> _entities;
        private Dictionary<string, EntityType> _entityTypes;
        private List<EntityUsage> _usageHistory;

        public Dictionary<string, Entity> Entities => _entities;
        public Dictionary<string, EntityType> EntityTypes => _entityTypes;
        public List<EntityUsage> UsageHistory => _usageHistory;

        public EntityManager()
        {
            _entities = new Dictionary<string, Entity>();
            _entityTypes = new Dictionary<string, EntityType>();
            _usageHistory = new List<EntityUsage>();
        }

        /// <summary>
        /// 新しいEntityを作成
        /// </summary>
        public Entity CreateEntity(string typeId, string instanceId)
        {
            if (_entities.ContainsKey(instanceId))
            {
                throw new ArgumentException($"Entity with ID '{instanceId}' already exists");
            }

            if (!_entityTypes.TryGetValue(typeId, out EntityType entityType))
            {
                throw new ArgumentException($"EntityType '{typeId}' not found");
            }

            var entity = entityType.CreateInstance(instanceId);
            _entities[instanceId] = entity;

            // 階層的継承の処理
            ProcessInheritance(entity);

            RecordUsage(instanceId, "created");
            return entity;
        }

        /// <summary>
        /// Entityを取得
        /// </summary>
        public Entity GetEntity(string id)
        {
            if (_entities.TryGetValue(id, out Entity entity))
            {
                entity.RecordUsage();
                RecordUsage(id, "accessed");
                return entity;
            }
            return null;
        }

        /// <summary>
        /// Entityを削除
        /// </summary>
        public bool DestroyEntity(string id)
        {
            if (_entities.ContainsKey(id))
            {
                RecordUsage(id, "destroyed");
                return _entities.Remove(id);
            }
            return false;
        }

        /// <summary>
        /// 階層的プロパティ継承の処理
        /// memo.txt仕様に基づく継承チェーンの構築
        /// </summary>
        public void InheritProperties(Entity child, Entity parent)
        {
            if (child == null || parent == null) return;

            child.InheritFrom(parent);
            child.ParentId = parent.Id;
        }

        /// <summary>
        /// 使用履歴の記録
        /// </summary>
        public void RecordUsage(string entityId, string context)
        {
            var usage = new EntityUsage
            {
                EntityId = entityId,
                Context = context,
                Timestamp = DateTime.Now
            };
            _usageHistory.Add(usage);

            // 履歴サイズ制限（最新1000件まで）
            if (_usageHistory.Count > 1000)
            {
                _usageHistory.RemoveAt(0);
            }
        }

        /// <summary>
        /// プロパティによるEntity検索
        /// </summary>
        public List<Entity> FindEntitiesByProperty(string propertyName, object value)
        {
            return _entities.Values
                .Where(entity => entity.HasProperty(propertyName, value))
                .ToList();
        }

        /// <summary>
        /// 型によるEntity検索
        /// </summary>
        public List<Entity> FindEntitiesByType(string typeId)
        {
            return _entities.Values
                .Where(entity => entity.TypeId == typeId)
                .ToList();
        }

        /// <summary>
        /// 階層的継承の処理（内部メソッド）
        /// </summary>
        private void ProcessInheritance(Entity entity)
        {
            // EntityTypeの継承チェーンを辿る
            var typeInheritanceChain = GetTypeInheritanceChain(entity.TypeId);
            
            // 親型から順番にプロパティを継承
            var reversedChain = typeInheritanceChain.ToList();
            reversedChain.Reverse();
            foreach (string parentTypeId in reversedChain)
            {
                if (_entityTypes.TryGetValue(parentTypeId, out EntityType parentType))
                {
                    // デフォルトプロパティの継承
                    foreach (var kvp in parentType.DefaultProperties)
                    {
                        if (!entity.Properties.ContainsKey(kvp.Key))
                        {
                            var inheritedProperty = kvp.Value.CreateInheritedCopy();
                            entity.Properties[kvp.Key] = inheritedProperty;
                        }
                    }
                }
            }

            // 親Entityからの継承（もし指定されていれば）
            if (!string.IsNullOrEmpty(entity.ParentId) && _entities.TryGetValue(entity.ParentId, out Entity parentEntity))
            {
                InheritProperties(entity, parentEntity);
            }
        }

        /// <summary>
        /// 型の継承チェーンを取得
        /// </summary>
        private List<string> GetTypeInheritanceChain(string typeId)
        {
            var chain = new List<string>();
            string currentTypeId = typeId;

            while (!string.IsNullOrEmpty(currentTypeId) && _entityTypes.ContainsKey(currentTypeId))
            {
                chain.Add(currentTypeId);
                currentTypeId = _entityTypes[currentTypeId].ParentTypeId;

                // 循環参照チェック
                if (chain.Count(id => id == currentTypeId) > 1)
                {
                    throw new InvalidOperationException($"Circular inheritance detected in type hierarchy: {string.Join(" -> ", chain)}");
                }
            }

            return chain;
        }

        /// <summary>
        /// CSVファイルからEntityTypesを読み込み
        /// </summary>
        public void LoadEntityTypesFromCsv(string csvFilePath)
        {
            if (!File.Exists(csvFilePath))
            {
                throw new FileNotFoundException($"EntityTypes CSV file not found: {csvFilePath}");
            }

            var lines = File.ReadAllLines(csvFilePath);
            if (lines.Length < 2) return; // ヘッダー + 最低1行

            // ヘッダー行をスキップ
            for (int i = 1; i < lines.Length; i++)
            {
                var fields = ParseCsvLine(lines[i]);
                if (fields.Length < 7) continue;

                try
                {
                    var entityType = EntityType.FromCsvData(
                        fields[0], // type_id
                        fields[1], // parent_type_id
                        fields[2], // type_name
                        fields[3], // description
                        fields[4], // default_properties
                        fields[5], // validation_rules
                        fields[6]  // description_patterns
                    );

                    _entityTypes[entityType.TypeId] = entityType;
                }
                catch (Exception ex)
                {
                    throw new InvalidDataException($"Error parsing EntityType at line {i + 1}: {ex.Message}");
                }
            }

            // 継承関係の構築
            BuildTypeInheritanceHierarchy();
        }

        /// <summary>
        /// CSVファイルからEntitiesを読み込み
        /// </summary>
        public void LoadEntitiesFromCsv(string csvFilePath)
        {
            if (!File.Exists(csvFilePath))
            {
                throw new FileNotFoundException($"Entities CSV file not found: {csvFilePath}");
            }

            var lines = File.ReadAllLines(csvFilePath);
            if (lines.Length < 2) return;

            for (int i = 1; i < lines.Length; i++)
            {
                var fields = ParseCsvLine(lines[i]);
                if (fields.Length < 7) continue;

                try
                {
                    string entityId = fields[0];
                    string entityTypeId = fields[1];
                    string parentEntityId = string.IsNullOrEmpty(fields[2]) ? null : fields[2];
                    string name = fields[3];
                    string description = fields[4];
                    DateTime createdAt = DateTime.Parse(fields[5]);
                    bool isActive = bool.Parse(fields[6]);

                    if (!isActive) continue;

                    var entity = CreateEntity(entityTypeId, entityId);
                    entity.SetProperty("name", name);
                    entity.SetProperty("description", description);
                    entity.CreatedAt = createdAt;

                    if (!string.IsNullOrEmpty(parentEntityId))
                    {
                        entity.ParentId = parentEntityId;
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidDataException($"Error parsing Entity at line {i + 1}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// CSVファイルからPropertiesを読み込み
        /// </summary>
        public void LoadPropertiesFromCsv(string csvFilePath)
        {
            if (!File.Exists(csvFilePath))
            {
                throw new FileNotFoundException($"Properties CSV file not found: {csvFilePath}");
            }

            var lines = File.ReadAllLines(csvFilePath);
            if (lines.Length < 2) return;

            for (int i = 1; i < lines.Length; i++)
            {
                var fields = ParseCsvLine(lines[i]);
                if (fields.Length < 8) continue;

                try
                {
                    string entityId = fields[0];
                    string propertyName = fields[1];
                    string propertyValue = fields[2];
                    PropertyType propertyType = Enum.Parse<PropertyType>(fields[3]);
                    PropertySource source = Enum.Parse<PropertySource>(fields[4]);
                    float confidence = float.Parse(fields[5]);
                    DateTime lastModified = DateTime.Parse(fields[6]);
                    string notes = fields[7];

                    if (_entities.TryGetValue(entityId, out Entity entity))
                    {
                        var convertedValue = ConvertPropertyValue(propertyValue, propertyType);
                        var property = new PropertyValue(propertyName, convertedValue, propertyType, source)
                        {
                            Confidence = confidence,
                            LastModified = lastModified
                        };
                        entity.Properties[propertyName] = property;
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidDataException($"Error parsing Property at line {i + 1}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// 型継承階層の構築
        /// </summary>
        private void BuildTypeInheritanceHierarchy()
        {
            foreach (var entityType in _entityTypes.Values)
            {
                if (!string.IsNullOrEmpty(entityType.ParentTypeId) && 
                    _entityTypes.TryGetValue(entityType.ParentTypeId, out EntityType parentType))
                {
                    entityType.InheritFrom(parentType);
                }
            }
        }

        /// <summary>
        /// CSV行の解析（簡易版）
        /// </summary>
        private string[] ParseCsvLine(string line)
        {
            // 簡易CSV解析（カンマ区切り、引用符対応なし）
            return line.Split(',');
        }

        /// <summary>
        /// プロパティ値の型変換
        /// </summary>
        private object ConvertPropertyValue(string value, PropertyType type)
        {
            if (string.IsNullOrEmpty(value)) return null;

            switch (type)
            {
                case PropertyType.String:
                    return value;
                case PropertyType.Integer:
                    return int.Parse(value);
                case PropertyType.Float:
                    return float.Parse(value);
                case PropertyType.Bool:
                    return bool.Parse(value);
                case PropertyType.DateTime:
                    return DateTime.Parse(value);
                case PropertyType.Json:
                    return value;
            }
            return value;
        }

        /// <summary>
        /// 全データの検証
        /// </summary>
        public List<string> ValidateAllData()
        {
            var errors = new List<string>();

            // EntityTypeの検証
            foreach (var entityType in _entityTypes.Values)
            {
                // 循環参照チェック
                try
                {
                    GetTypeInheritanceChain(entityType.TypeId);
                }
                catch (InvalidOperationException ex)
                {
                    errors.Add($"EntityType '{entityType.TypeId}': {ex.Message}");
                }
            }

            // Entityの検証
            foreach (var entity in _entities.Values)
            {
                if (_entityTypes.TryGetValue(entity.TypeId, out EntityType entityType))
                {
                    var validationResult = entityType.ValidateEntity(entity);
                    if (!validationResult.IsValid)
                    {
                        errors.AddRange(validationResult.Errors.Select(e => $"Entity '{entity.Id}': {e}"));
                    }
                }
                else
                {
                    errors.Add($"Entity '{entity.Id}' references unknown type '{entity.TypeId}'");
                }
            }

            return errors;
        }

        /// <summary>
        /// CSV読み込み統合メソッド - 既存コードとの互換性
        /// </summary>
        public void LoadFromCsv(string entityTypesPath, string entitiesPath)
        {
            LoadEntityTypesFromCsv(entityTypesPath);
            LoadEntitiesFromCsv(entitiesPath);
        }

        /// <summary>
        /// Entity検索 - 既存コードとの互換性
        /// </summary>
        public List<Entity> SearchEntities(string query)
        {
            var results = new List<Entity>();
            
            foreach (var entity in _entities.Values)
            {
                // IDで検索
                if (entity.Id.Contains(query, StringComparison.OrdinalIgnoreCase))
                {
                    results.Add(entity);
                    continue;
                }
                
                // プロパティ値で検索
                foreach (var property in entity.Properties.Values)
                {
                    if (property.Value?.ToString()?.Contains(query, StringComparison.OrdinalIgnoreCase) == true)
                    {
                        results.Add(entity);
                        break;
                    }
                }
            }
            
            return results;
        }

        /// <summary>
        /// 全Entity取得 - 既存コードとの互換性
        /// </summary>
        public List<Entity> GetAllEntities()
        {
            return _entities.Values.ToList();
        }

        /// <summary>
        /// 全EntityType取得 - 既存コードとの互換性
        /// </summary>
        public List<EntityType> GetAllEntityTypes()
        {
            return _entityTypes.Values.ToList();
        }
    }

    /// <summary>
    /// Entity使用履歴
    /// </summary>
    [Serializable]
    public class EntityUsage
    {
        public string EntityId { get; set; }
        public string Context { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
