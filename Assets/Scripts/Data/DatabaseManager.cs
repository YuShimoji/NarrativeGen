using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;
using NarrativeGen.Parsing;
using NarrativeGen.Data.Models;

namespace NarrativeGen.Data
{
    /// <summary>
    /// Manages all game data including events, properties, and entity states.
    /// </summary>
    public class DatabaseManager : MonoBehaviour
    {
        [Header("Data Files")]
        public string eventsFileName = "Events_Fixed.csv";
        public string propertiesFileName = "Properties.csv";
        public string entityStatesFileName = "EntityStates.csv";
        public string reasoningRulesFileName = "ReasoningRules.csv";
        public string narrativeTemplatesFileName = "NarrativeTemplates.csv";
        public string choicesFileName = "Choices.csv";
        
        [Header("Settings")]
        public bool loadOnStart = true;
        
        // Data storage
        public Dictionary<string, NarrativeGen.Data.Models.Event> Events { get; private set; }
        public Dictionary<string, NarrativeGen.Data.Models.Property> Properties { get; private set; }
        public Dictionary<string, NarrativeGen.Data.Models.EntityState> EntityStates { get; private set; }
        public Dictionary<string, ReasoningRule> ReasoningRules { get; private set; }
        public Dictionary<string, NarrativeTemplate> NarrativeTemplates { get; private set; }
        public Dictionary<string, ChoiceData> Choices { get; private set; }
        
        void Start()
        {
            if (loadOnStart)
            {
                Initialize();
            }
        }
        
        /// <summary>
        /// Initializes the database manager.
        /// </summary>
        public void Initialize()
        {
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
                UnityEngine.Debug.Log("All data loaded successfully.");
            }
            catch (System.Exception ex)
            {
                UnityEngine.Debug.LogError($"Failed to load data: {ex.Message}");
            }
        }
        
        /// <summary>
        /// Loads events from CSV file.
        /// </summary>
        void LoadEvents()
        {
            Events = new Dictionary<string, NarrativeGen.Data.Models.Event>();
            
            var csvData = SimpleCsvReader.ReadCsvFromStreamingAssets(eventsFileName);
            
            foreach (var row in csvData)
            {
                var eventModel = new NarrativeGen.Data.Models.Event
                {
                    Id = SimpleCsvReader.GetValue<string>(row, "id", ""),
                    Commands = SimpleCsvReader.GetValue<string>(row, "command", ""),
                    Text = SimpleCsvReader.GetValue<string>(row, "text", "")
                };
                
                if (!string.IsNullOrEmpty(eventModel.Id))
                {
                    Events[eventModel.Id] = eventModel;
                }
            }
            
            UnityEngine.Debug.Log($"Loaded {Events.Count} events.");
        }
        
        /// <summary>
        /// Loads properties from CSV file.
        /// </summary>
        void LoadProperties()
        {
            var filePath = Path.Combine(Application.streamingAssetsPath, "NarrativeData", propertiesFileName);
            
            Properties = new Dictionary<string, NarrativeGen.Data.Models.Property>();
            
            if (!File.Exists(filePath))
            {
                UnityEngine.Debug.LogWarning($"Properties file not found at: {filePath}. Creating empty dictionary.");
                return;
            }
            
            var csvText = File.ReadAllText(filePath);
            var csvData = CsvParser.Parse(csvText);
            
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
            
            UnityEngine.Debug.Log($"Loaded {Properties.Count} properties with type information.");
        }
        
        /// <summary>
        /// Loads entity states from CSV file.
        /// </summary>
        void LoadEntityStates()
        {
            var filePath = Path.Combine(Application.streamingAssetsPath, "NarrativeData", entityStatesFileName);
            
            EntityStates = new Dictionary<string, NarrativeGen.Data.Models.EntityState>();
            
            if (!File.Exists(filePath))
            {
                UnityEngine.Debug.LogWarning($"Entity states file not found at: {filePath}. Creating empty dictionary.");
                return;
            }
            
            var csvText = File.ReadAllText(filePath);
            var csvData = CsvParser.Parse(csvText);
            
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
            
            UnityEngine.Debug.Log($"Loaded {EntityStates.Count} entity states.");
        }
        
        /// <summary>
        /// Loads reasoning rules from CSV file.
        /// </summary>
        void LoadReasoningRules()
        {
            var path = Path.Combine(Application.streamingAssetsPath, "NarrativeData", reasoningRulesFileName);
            if (!File.Exists(path))
            {
                Debug.LogWarning("ReasoningRules.csv not found.");
                ReasoningRules = new Dictionary<string, ReasoningRule>();
                return;
            }

            using (var reader = new StreamReader(path))
            using (var csv = new CsvParser.CsvReader(reader))
            {
                ReasoningRules = csv.GetRecords<ReasoningRule>().ToDictionary(r => r.RuleId);
            }
        }

        /// <summary>
        /// Loads narrative templates from CSV file.
        /// </summary>
        void LoadNarrativeTemplates()
        {
            var filePath = Path.Combine(Application.streamingAssetsPath, "NarrativeData", narrativeTemplatesFileName);
            NarrativeTemplates = new Dictionary<string, NarrativeTemplate>();

            if (!File.Exists(filePath))
            {
                UnityEngine.Debug.Log($"NarrativeTemplates file not found at: {filePath}. Skipping.");
                return;
            }

            var csvText = File.ReadAllText(filePath);
            var csvData = CsvParser.Parse(csvText);

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
            UnityEngine.Debug.Log($"Loaded {NarrativeTemplates.Count} narrative templates.");
        }

        /// <summary>
        /// Loads choices from CSV file.
        /// </summary>
        void LoadChoices()
        {
            var filePath = Path.Combine(Application.streamingAssetsPath, "NarrativeData", choicesFileName);
            Choices = new Dictionary<string, ChoiceData>();

            if (!File.Exists(filePath))
            {
                UnityEngine.Debug.Log($"Choices file not found at: {filePath}. Skipping.");
                return;
            }

            var csvText = File.ReadAllText(filePath);
            var csvData = CsvParser.Parse(csvText);

            foreach (var row in csvData)
            {
                var choice = new ChoiceData
                {
                    ChoiceId = row["choice_id"],
                    Category = row.ContainsKey("category") ? row["category"] : "default",
                    Text = row["text"],
                    NextEventId = row["next_event_id"],
                    Conditions = row.ContainsKey("conditions") ? row["conditions"] : ""
                };
                Choices[choice.ChoiceId] = choice;
            }
            UnityEngine.Debug.Log($"Loaded {Choices.Count} choices.");
        }
        
        /// <summary>
        /// Gets an event by ID.
        /// </summary>
        public NarrativeGen.Data.Models.Event GetEvent(string id)
        {
            if (Events != null && Events.TryGetValue(id, out var eventModel))
            {
                return eventModel;
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