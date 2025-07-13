using System;
using System.Collections.Generic;

namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents an entity state in the narrative system.
    /// </summary>
    [Serializable]
    public class EntityState
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public Dictionary<string, string> Properties { get; set; }
        
        public EntityState()
        {
            Id = string.Empty;
            Name = string.Empty;
            Properties = new Dictionary<string, string>();
        }
    }
} 