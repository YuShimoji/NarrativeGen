using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Globalization;
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
            public string Replacement { get; set; } = "";
            public int Priority { get; set; } = 1;
            public string Description { get; set; } = "";
        }

        public class VariableDefinition
        {
            public string Name { get; set; } = "";
            public string Type { get; set; } = "";
            public string DefaultValue { get; set; } = "";
            public string Description { get; set; } = "";
        }

        public class EventData
        {
            public string Id { get; set; } = "";
            public string Commands { get; set; } = "";
            public string Text { get; set; } = "";
        }

        public class PropertyDefinition
        {
            public string Name { get; set; } = "";
            public string Type { get; set; } = "";
            public string DefaultValue { get; set; } = "";
            public string Description { get; set; } = "";
        }

        public class Entity
        {
            public string Id { get; set; } = "";
            public Dictionary<string, string> Properties { get; set; } = new Dictionary<string, string>();
        }
        #endregion

        #region Private Fields
        private readonly string _dataPath;
        
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
        public DataManager(string dataPath)
        {
            _dataPath = dataPath ?? throw new ArgumentNullException(nameof(dataPath));
            
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
        /// 全データファイルの読み込み
        /// </summary>
        public void LoadAllData()
        {
            try
            {
                LoadAllDataFiles();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to load data from: {_dataPath}", ex);
            }
        }

        /// <summary>
        /// イベントデータの取得
        /// </summary>
        public EventData? GetEvent(string eventId)
        {
            _events.TryGetValue(eventId, out var eventData);
            return eventData;
        }

        /// <summary>
        /// プロパティ定義の取得
        /// </summary>
        public PropertyDefinition? GetProperty(string propertyName)
        {
            _properties.TryGetValue(propertyName, out var property);
            return property;
        }

        /// <summary>
        /// エンティティの取得
        /// </summary>
        public Entity? GetEntity(string entityId)
        {
            _entities.TryGetValue(entityId, out var entity);
            return entity;
        }
        #endregion

        #region Private Methods
        private void LoadAllDataFiles()
        {
            LoadRecursiveDictionary();
            LoadSyntaxCommands();
            LoadVariables();
            LoadEvents();
            LoadProperties();
            LoadEntities();
        }

        private void LoadRecursiveDictionary()
        {
            var filePath = Path.Combine(_dataPath, "RecursiveDictionary.csv");
            if (!File.Exists(filePath))
            {
                return;
            }

            var records = LoadCsvFile(filePath);
            foreach (var record in records)
            {
                if (record.TryGetValue("Key", out var key) && record.TryGetValue("Value", out var value))
                {
                    _recursiveDictionary[key] = value;
                }
            }
        }

        private void LoadSyntaxCommands()
        {
            var filePath = Path.Combine(_dataPath, "SyntaxCommands.csv");
            if (!File.Exists(filePath))
            {
                return;
            }

            var records = LoadCsvFile(filePath);
            foreach (var record in records)
            {
                _syntaxCommands.Add(new SyntaxCommand
                {
                    CommandType = record.GetValueOrDefault("CommandType", ""),
                    Pattern = record.GetValueOrDefault("Pattern", ""),
                    Replacement = record.GetValueOrDefault("Replacement", ""),
                    Priority = int.TryParse(record.GetValueOrDefault("Priority", "1"), out var priority) ? priority : 1,
                    Description = record.GetValueOrDefault("Description", "")
                });
            }
        }

        private void LoadVariables()
        {
            var filePath = Path.Combine(_dataPath, "Variables.csv");
            if (!File.Exists(filePath))
            {
                return;
            }

            var records = LoadCsvFile(filePath);
            foreach (var record in records)
            {
                var variable = new VariableDefinition
                {
                    Name = record.GetValueOrDefault("Name", ""),
                    Type = record.GetValueOrDefault("Type", ""),
                    DefaultValue = record.GetValueOrDefault("DefaultValue", ""),
                    Description = record.GetValueOrDefault("Description", "")
                };
                _variables[variable.Name] = variable;
            }
        }

        private void LoadEvents()
        {
            var filePath = Path.Combine(_dataPath, "Events.csv");
            if (!File.Exists(filePath))
            {
                return;
            }

            var records = LoadCsvFile(filePath);
            foreach (var record in records)
            {
                var eventData = new EventData
                {
                    Id = record.GetValueOrDefault("Id", ""),
                    Commands = record.GetValueOrDefault("Commands", ""),
                    Text = record.GetValueOrDefault("Text", "")
                };
                _events[eventData.Id] = eventData;
            }
        }

        private void LoadProperties()
        {
            var filePath = Path.Combine(_dataPath, "Properties.csv");
            if (!File.Exists(filePath))
            {
                return;
            }

            var records = LoadCsvFile(filePath);
            foreach (var record in records)
            {
                var property = new PropertyDefinition
                {
                    Name = record.GetValueOrDefault("Name", ""),
                    Type = record.GetValueOrDefault("Type", ""),
                    DefaultValue = record.GetValueOrDefault("DefaultValue", ""),
                    Description = record.GetValueOrDefault("Description", "")
                };
                _properties[property.Name] = property;
            }
        }

        private void LoadEntities()
        {
            var filePath = Path.Combine(_dataPath, "EntityStates.csv");
            if (!File.Exists(filePath))
            {
                return;
            }

            // EntityStatesの実装は後で追加
        }

        /// <summary>
        /// シンプルなCSV読み込み（Core層用、Unity非依存）
        /// </summary>
        private List<Dictionary<string, string>> LoadCsvFile(string filePath)
        {
            var records = new List<Dictionary<string, string>>();
            
            try
            {
                using var reader = new StreamReader(filePath);
                using var csv = new SimpleCsvReader(reader, CultureInfo.InvariantCulture);
                
                var headers = csv.GetNextRecord();
                if (headers == null) return records;

                while (csv.GetNextRecord() is string[] values)
                {
                    var record = new Dictionary<string, string>();
                    for (int i = 0; i < Math.Min(headers.Length, values.Length); i++)
                    {
                        record[headers[i]] = values[i];
                    }
                    records.Add(record);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to load CSV file: {filePath}", ex);
            }

            return records;
        }
        #endregion
    }

    /// <summary>
    /// Core層用の最小限CSVリーダー（Unity非依存）
    /// </summary>
    public class SimpleCsvReader : IDisposable
    {
        private readonly StreamReader _reader;
        private readonly CultureInfo _culture;

        public SimpleCsvReader(StreamReader reader, CultureInfo culture)
        {
            _reader = reader;
            _culture = culture;
        }

        public string[]? GetNextRecord()
        {
            var line = _reader.ReadLine();
            if (line == null) return null;

            return ParseCsvLine(line);
        }

        private string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            var current = new System.Text.StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            result.Add(current.ToString());
            return result.ToArray();
        }

        public void Dispose()
        {
            _reader?.Dispose();
        }
    }
} 