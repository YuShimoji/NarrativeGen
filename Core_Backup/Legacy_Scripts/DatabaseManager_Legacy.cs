using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using NarrativeGen.Parsing;
using NarrativeGen.Data.Models;

namespace NarrativeGen.Data
{
    /// <summary>
    /// Manages all game data including events, properties, and entity states.
    /// </summary>
    public class DatabaseManager
    {
        // Data Files
        public string eventsFileName = "Events_Fixed.csv";
        public string propertiesFileName = "Properties.csv";
        public string entityStatesFileName = "EntityStates.csv";
        public string reasoningRulesFileName = "ReasoningRules.csv";
        public string narrativeTemplatesFileName = "NarrativeTemplates.csv";
        public string choicesFileName = "Choices.csv";
        
        // Settings
        public bool loadOnStart = false;
        
        // Data storage
        public List<NarrativeGen.Data.Models.Event> Events { get; private set; }
        private Dictionary<string, int> m_EventIdToIndexMap;
        public Dictionary<string, NarrativeGen.Data.Models.Property> Properties { get; private set; }
        public Dictionary<string, NarrativeGen.Data.Models.EntityState> EntityStates { get; private set; }
        public Dictionary<string, ReasoningRule> ReasoningRules { get; private set; }
        public Dictionary<string, NarrativeTemplate> NarrativeTemplates { get; private set; }
        public Dictionary<string, List<ChoiceData>> ChoiceGroups { get; private set; }

        public NarrativeGen.Data.Models.Event GetEventById(string id)
        {
            if (m_EventIdToIndexMap.TryGetValue(id, out int index))
            {
                return Events[index];
            }
            return null;
        }

        public NarrativeGen.Data.Models.Event GetEventByIndex(int index)
        {
            if (index >= 0 && index < Events.Count)
            {
                return Events[index];
            }
            return null;
        }

        public int GetEventIndexById(string id)
        {
            if (m_EventIdToIndexMap.TryGetValue(id, out int index))
            {
                return index;
            }
            return -1;
        }
        

        
        /// <summary>
        /// Initializes the database manager with specified data file paths.
        /// </summary>
        public void Initialize(string eventsPath, string choicesPath, string entitiesPath, string propositionsPath)
        {
            this.eventsFileName = eventsPath;
            this.choicesFileName = choicesPath;
            // TODO: Set paths for entities and propositions once they are implemented
            // this.entitiesFileName = entitiesPath;
            // this.propositionsFileName = propositionsPath;

            LoadAllData();
        }
        
        /// <summary>
        /// Loads all data from CSV files.
        /// </summary>
        public void LoadAllData()
        {
            try
            {
                LoadEvents();
                LoadProperties();
                LoadEntityStates();
                LoadReasoningRules();
                LoadNarrativeTemplates();
                LoadChoices();
                // All data loaded successfully
            }
            catch (System.Exception ex)
            {
                throw new InvalidOperationException($"Failed to load data: {ex.Message}", ex);
            }
        }
        
        /// <summary>
        /// Loads events from CSV file.
        /// </summary>
        void LoadEvents()
        {
            Events = new List<NarrativeGen.Data.Models.Event>();
            m_EventIdToIndexMap = new Dictionary<string, int>();

            var csvData = SimpleCsvReader.ReadCsvFromStreamingAssets(eventsFileName);
            
            for (int i = 0; i < csvData.Count; i++)
            {
                var row = csvData[i];
                var eventModel = new NarrativeGen.Data.Models.Event
                {
                    Id = SimpleCsvReader.GetValue<string>(row, "id", ""),
                    Commands = SimpleCsvReader.GetValue<string>(row, "command", ""),
                    Text = SimpleCsvReader.GetValue<string>(row, "text", ""),
                    Speaker = SimpleCsvReader.GetValue<string>(row, "speaker", "")
                };
                
                Events.Add(eventModel);

                if (!string.IsNullOrEmpty(eventModel.Id))
                {
                    if (m_EventIdToIndexMap.ContainsKey(eventModel.Id))
                    {
                        // Duplicate Event ID found - only the first one will be directly accessible by ID
                    }
                    else
                    {
                        m_EventIdToIndexMap[eventModel.Id] = i;
                    }
                }
            }
            
            // Loaded events successfully
        }
        
        /// <summary>
        /// Loads properties from CSV file.
        /// </summary>
        void LoadProperties()
        {
            var filePath = Path.Combine("StreamingAssets", "NarrativeData", propertiesFileName);
            
            Properties = new Dictionary<string, NarrativeGen.Data.Models.Property>();
            
            if (!File.Exists(filePath))
            {
                // Properties file not found - creating empty dictionary
                return;
            }
            
            var csvText = File.ReadAllText(filePath);
            var csvData = SimpleCsvReader.ReadCsvFile(filePath);
            
            foreach (var row in csvData)
            {
                var property = new NarrativeGen.Data.Models.Property
                {
                    Id = row["key"],
                    Name = row["key"],
                    Type = row.ContainsKey("type") ? row["type"] : "string",
                    DefaultValue = row["value"]
                };
                
                Properties[property.Id] = property;
            }
            
            // Loaded properties with type information
        }
        
        /// <summary>
        /// Loads entity states from CSV file.
        /// </summary>
        void LoadEntityStates()
        {
            var filePath = Path.Combine("StreamingAssets", "NarrativeData", entityStatesFileName);
            
            EntityStates = new Dictionary<string, NarrativeGen.Data.Models.EntityState>();
            
            if (!File.Exists(filePath))
            {
                // Entity states file not found - creating empty dictionary
                return;
            }
            
            var csvText = File.ReadAllText(filePath);
            var csvData = SimpleCsvReader.ReadCsvFile(filePath);
            
            foreach (var row in csvData)
            {
                var entityState = new NarrativeGen.Data.Models.EntityState
                {
                    Id = row["id"],
                    Name = row["name"],
                    Properties = new Dictionary<string, string>()
                };
                
                // Parse properties columns
                foreach (var kvp in row)
                {
                    if (kvp.Key != "id" && kvp.Key != "name")
                    {
                        entityState.Properties[kvp.Key] = kvp.Value;
                    }
                }
                
                EntityStates[entityState.Id] = entityState;
            }
            
            // Loaded entity states successfully
        }
        
        /// <summary>
        /// Loads reasoning rules from CSV file.
        /// </summary>
        void LoadReasoningRules()
        {
            var path = Path.Combine("StreamingAssets", "NarrativeData", reasoningRulesFileName);
            if (!File.Exists(path))
            {
                // ReasoningRules.csv not found
                ReasoningRules = new Dictionary<string, ReasoningRule>();
                return;
            }

            var csvData = SimpleCsvReader.ReadCsvFile(path);
            ReasoningRules = csvData.ToDictionary(row => row["rule_id"], row => new ReasoningRule {
                RuleId = row.ContainsKey("rule_id") ? row["rule_id"] : string.Empty,
                Condition = row.ContainsKey("conditions") ? row["conditions"] : string.Empty,
                Consequence = row.ContainsKey("consequences") ? row["consequences"] : string.Empty,
                Priority = int.TryParse(row.ContainsKey("priority") ? row["priority"] : "0", out int priority) ? priority : 0,
                PriorityFloat = float.TryParse(row.ContainsKey("priority") ? row["priority"] : "0", out float priorityFloat) ? priorityFloat : 0f,
                Description = row.ContainsKey("description") ? row["description"] : string.Empty
            });
        }

        /// <summary>
        /// Loads narrative templates from CSV file.
        /// </summary>
        void LoadNarrativeTemplates()
        {
            var filePath = Path.Combine("StreamingAssets", "NarrativeData", narrativeTemplatesFileName);
            NarrativeTemplates = new Dictionary<string, NarrativeTemplate>();

            if (!File.Exists(filePath))
            {
                // NarrativeTemplates file not found - skipping
                return;
            }

            var csvText = File.ReadAllText(filePath);
            var csvData = SimpleCsvReader.ReadCsvFile(filePath);

            foreach (var row in csvData)
            {
                var template = new NarrativeTemplate
                {
                    TemplateId = row["template_id"],
                    Category = row["category"],
                    Pattern = row["pattern"]
                };
                NarrativeTemplates[template.TemplateId] = template;
            }
            // Loaded narrative templates successfully
        }

        /// <summary>
        /// Loads choices from CSV file.
        /// </summary>
        void LoadChoices()
        {
            ChoiceGroups = new Dictionary<string, List<ChoiceData>>();
            var csvData = SimpleCsvReader.ReadCsvFromStreamingAssets(choicesFileName);

            foreach (var row in csvData)
            {
                // 列名の差異に対応（id/choice_id, nextEventId/next_event_id, choiceId/category）
                string id = GetFirstNonEmpty(row, new[] { "id", "choice_id" });
                string text = SimpleCsvReader.GetValue<string>(row, "text", "");
                string nextEventId = GetFirstNonEmpty(row, new[] { "nextEventId", "next_event_id" });
                string groupId = GetFirstNonEmpty(row, new[] { "choiceId", "category", "choice_group_id" });
                string conditions = SimpleCsvReader.GetValue<string>(row, "conditions", "");

                var choiceData = new ChoiceData
                {
                    Id = id,
                    Text = text,
                    NextEventId = nextEventId,
                    ChoiceGroupId = groupId,
                    Conditions = conditions
                };

                if (string.IsNullOrEmpty(choiceData.ChoiceGroupId))
                {
                    continue;
                }

                if (!ChoiceGroups.ContainsKey(choiceData.ChoiceGroupId))
                {
                    ChoiceGroups[choiceData.ChoiceGroupId] = new List<ChoiceData>();
                }
                ChoiceGroups[choiceData.ChoiceGroupId].Add(choiceData);
            }

            // Loaded choice groups successfully
        }

        /// <summary>
        /// 指定したキー候補の中から最初に見つかった非空文字列を返す
        /// </summary>
        private string GetFirstNonEmpty(Dictionary<string, string> row, string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.ContainsKey(key) && !string.IsNullOrEmpty(row[key]))
                {
                    return row[key];
                }
            }
            return string.Empty;
        }
        
        /// <summary>
        /// Gets an event by ID.
        /// </summary>
        public NarrativeGen.Data.Models.Event GetEvent(string id)
        {
            if (m_EventIdToIndexMap.TryGetValue(id, out int index))
            {
                return Events[index];
            }
            return null;
        }
        
        /// <summary>
        /// Gets a property by ID.
        /// </summary>
        public NarrativeGen.Data.Models.Property GetProperty(string id)
        {
            if (Properties != null && Properties.TryGetValue(id, out var property))
            {
                return property;
            }
            return null;
        }
        
        /// <summary>
        /// Gets an entity state by ID.
        /// </summary>
        public NarrativeGen.Data.Models.EntityState GetEntityState(string id)
        {
            if (EntityStates != null && EntityStates.TryGetValue(id, out var entityState))
            {
                return entityState;
            }
            return null;
        }
    }
}