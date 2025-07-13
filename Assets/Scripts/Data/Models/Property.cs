using System;

namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents a property in the narrative system.
    /// </summary>
    [Serializable]
    public class Property
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string DefaultValue { get; set; }
        
        public Property()
        {
            Id = string.Empty;
            Name = string.Empty;
            Type = string.Empty;
            DefaultValue = string.Empty;
        }
    }
} 