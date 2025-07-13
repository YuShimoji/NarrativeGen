using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Globalization;
using CsvHelper;
using Microsoft.Extensions.Logging;
using NarrativeGen.Core.Models;

namespace NarrativeGen.Core.Data
{
    /// <summary>
    /// Unity非依存のデータ管理システム
    /// CSVファイルの読み込み・管理を行う
    /// </summary>
    public class DataManager
    {
        #region Data Models
        public class RecursiveDictionaryEntry
        {
            public string Key { get; set; } = "";
            public string Value { get; set; } = "";
            public string Category { get; set; } = "";
            public int Priority { get; set; } = 1;
            public string Description { get; set; } = "";
        }

        public class SyntaxCommand
        {
            public string CommandType { get; set; } = "";
            public string Pattern { get; set; } = "";
            public string Implementation { get; set; } = "";
            public bool IsActive { get; set; } = true;
        }

        public class VariableDefinition
        {
            public string Name { get; set; } = "";
            public string Type { get; set; } = "";
            public string DefaultValue { get; set; } = "";
            public string Range { get; set; } = "";
            public string Description { get; set; } = "";
        }

        public class EventData
        {
            public string Id { get; set; } = "";
            public string Text { get; set; } = "";
            public string Commands { get; set; } = "";
            public string Conditions { get; set; } = "";
        }

        public class PropertyDefinition
        {
            public string Name { get; set; } = "";
            public string Type { get; set; } = "";
            public string DefaultValue { get; set; } = "";
            public string Category { get; set; } = "";
            public string Description { get; set; } = "";
        }
        #endregion

        #region Private Fields
        private readonly string _dataPath;
        private readonly ILogger? _logger;
        
        private Dictionary<string, string> _recursiveDictionary;
        private List<SyntaxCommand> _syntaxCommands;
        private Dictionary<string, VariableDefinition> _variables;
        private Dictionary<string, EventData> _events;
        private Dictionary<string, PropertyDefinition> _properties;
        private Dictionary<string, Entity> _entities;
        #endregion

        #region Properties
        public Dictionary<string, string> RecursiveDictionary => _recursiveDictionary;
        public List<SyntaxCommand> SyntaxCommands => _syntaxCommands;
        public Dictionary<string, VariableDefinition> Variables => _variables;
        public Dictionary<string, EventData> Events => _events;
        public Dictionary<string, PropertyDefinition> Properties => _properties;
        public Dictionary<string, Entity> Entities => _entities;
        #endregion

        #region Constructor
        public DataManager(string dataPath, ILogger? logger = null)
        {
            _dataPath = dataPath ?? throw new ArgumentNullException(nameof(dataPath));
            _logger = logger;
            
            _recursiveDictionary = new Dictionary<string, string>();
            _syntaxCommands = new List<SyntaxCommand>();
            _variables = new Dictionary<string, VariableDefinition>();
            _events = new Dictionary<string, EventData>();
            _properties = new Dictionary<string, PropertyDefinition>();
            _entities = new Dictionary<string, Entity>();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// 全てのCSVデータを読み込み
        /// </summary>
        public void LoadAllData()
        {
            try
            {
                LoadRecursiveDictionary();
                LoadSyntaxCommands();
                LoadVariables();
                LoadEvents();
                LoadProperties();
                LoadEntities();
                
                _logger?.LogInformation("All data loaded successfully from: {DataPath}", _dataPath);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to load data from: {DataPath}", _dataPath);
                throw;
            }
        }

        /// <summary>
        /// イベントデータの取得
        /// </summary>
        public EventData? GetEvent(string eventId)
        {
            return _events.TryGetValue(eventId, out var eventData) ? eventData : null;
        }

        /// <summary>
        /// エンティティの取得
        /// </summary>
        public Entity? GetEntity(string entityId)
        {
            return _entities.TryGetValue(entityId, out var entity) ? entity : null;
        }

        /// <summary>
        /// プロパティ定義の取得
        /// </summary>
        public PropertyDefinition? GetPropertyDefinition(string propertyName)
        {
            return _properties.TryGetValue(propertyName, out var property) ? property : null;
        }
        #endregion

        #region Private Loading Methods
        /// <summary>
        /// 遡行検索辞書の読み込み
        /// </summary>
        private void LoadRecursiveDictionary()
        {
            var filePath = Path.Combine(_dataPath, "RecursiveDictionary.csv");
            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("RecursiveDictionary.csv not found at: {FilePath}", filePath);
                return;
            }

            var entries = LoadCsv<RecursiveDictionaryEntry>(filePath);
            foreach (var entry in entries)
            {
                _recursiveDictionary[entry.Key] = entry.Value;
            }

            _logger?.LogDebug("Loaded {Count} recursive dictionary entries", _recursiveDictionary.Count);
        }

        /// <summary>
        /// 構文コマンドの読み込み
        /// </summary>
        private void LoadSyntaxCommands()
        {
            var filePath = Path.Combine(_dataPath, "SyntaxCommands.csv");
            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("SyntaxCommands.csv not found at: {FilePath}", filePath);
                return;
            }

            _syntaxCommands = LoadCsv<SyntaxCommand>(filePath).ToList();
            _logger?.LogDebug("Loaded {Count} syntax commands", _syntaxCommands.Count);
        }

        /// <summary>
        /// 変数定義の読み込み
        /// </summary>
        private void LoadVariables()
        {
            var filePath = Path.Combine(_dataPath, "Variables.csv");
            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("Variables.csv not found at: {FilePath}", filePath);
                return;
            }

            var variables = LoadCsv<VariableDefinition>(filePath);
            foreach (var variable in variables)
            {
                _variables[variable.Name] = variable;
            }

            _logger?.LogDebug("Loaded {Count} variable definitions", _variables.Count);
        }

        /// <summary>
        /// イベントデータの読み込み
        /// </summary>
        private void LoadEvents()
        {
            var filePath = Path.Combine(_dataPath, "Events.csv");
            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("Events.csv not found at: {FilePath}", filePath);
                return;
            }

            var events = LoadCsv<EventData>(filePath);
            foreach (var eventData in events)
            {
                _events[eventData.Id] = eventData;
            }

            _logger?.LogDebug("Loaded {Count} events", _events.Count);
        }

        /// <summary>
        /// プロパティ定義の読み込み
        /// </summary>
        private void LoadProperties()
        {
            var filePath = Path.Combine(_dataPath, "Properties.csv");
            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("Properties.csv not found at: {FilePath}", filePath);
                return;
            }

            var properties = LoadCsv<PropertyDefinition>(filePath);
            foreach (var property in properties)
            {
                _properties[property.Name] = property;
            }

            _logger?.LogDebug("Loaded {Count} property definitions", _properties.Count);
        }

        /// <summary>
        /// エンティティの読み込み
        /// </summary>
        private void LoadEntities()
        {
            var filePath = Path.Combine(_dataPath, "EntityStates.csv");
            if (!File.Exists(filePath))
            {
                _logger?.LogWarning("EntityStates.csv not found at: {FilePath}", filePath);
                return;
            }

            // TODO: EntityStatesの構造に応じて実装
            _logger?.LogDebug("Entity loading placeholder");
        }

        /// <summary>
        /// CSVファイルの汎用読み込み
        /// </summary>
        private IEnumerable<T> LoadCsv<T>(string filePath) where T : class
        {
            try
            {
                using var reader = new StringReader(File.ReadAllText(filePath));
                using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
                
                var records = csv.GetRecords<T>().ToList();
                _logger?.LogDebug("Loaded {Count} records from {FilePath}", records.Count, filePath);
                return records;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to load CSV file: {FilePath}", filePath);
                return Enumerable.Empty<T>();
            }
        }
        #endregion

        #region Entity Management
        /// <summary>
        /// エンティティの登録
        /// </summary>
        public void RegisterEntity(Entity entity)
        {
            _entities[entity.Id] = entity;
        }

        /// <summary>
        /// エンティティの削除
        /// </summary>
        public bool RemoveEntity(string entityId)
        {
            return _entities.Remove(entityId);
        }

        /// <summary>
        /// 新しいEntityの作成（memo.txt準拠）
        /// </summary>
        public Entity CreateEntity(string id, string name, Dictionary<string, object>? initialProperties = null)
        {
            var entity = new Entity(id, name);
            
            if (initialProperties != null)
            {
                foreach (var prop in initialProperties)
                {
                    entity.SetProperty(prop.Key, prop.Value);
                }
            }

            RegisterEntity(entity);
            return entity;
        }
        #endregion

        #region Utility Methods
        /// <summary>
        /// データの統計情報取得
        /// </summary>
        public string GetDataStatistics()
        {
            return $"Data Statistics:\n" +
                   $"  Recursive Dictionary: {_recursiveDictionary.Count} entries\n" +
                   $"  Syntax Commands: {_syntaxCommands.Count} commands\n" +
                   $"  Variables: {_variables.Count} definitions\n" +
                   $"  Events: {_events.Count} events\n" +
                   $"  Properties: {_properties.Count} definitions\n" +
                   $"  Entities: {_entities.Count} entities";
        }

        /// <summary>
        /// データの完全性チェック
        /// </summary>
        public List<string> ValidateData()
        {
            var issues = new List<string>();

            // 循環参照チェック
            foreach (var kvp in _recursiveDictionary)
            {
                if (kvp.Value.Contains($"[{kvp.Key}]"))
                {
                    issues.Add($"Circular reference detected: {kvp.Key} -> {kvp.Value}");
                }
            }

            // 必要なファイルの存在チェック
            var requiredFiles = new[] { "RecursiveDictionary.csv", "Events.csv", "Properties.csv" };
            foreach (var file in requiredFiles)
            {
                var filePath = Path.Combine(_dataPath, file);
                if (!File.Exists(filePath))
                {
                    issues.Add($"Required file missing: {file}");
                }
            }

            return issues;
        }
        #endregion
    }
} 