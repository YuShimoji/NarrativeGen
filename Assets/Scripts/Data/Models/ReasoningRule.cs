using System.Collections.Generic;

namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents a single reasoning rule loaded from the CSV.
    /// </summary>
    public class ReasoningRule
    {
        public string RuleId { get; set; }
        public string Condition { get; set; }
        public string Consequence { get; set; }
        public int Priority { get; set; }
        public float PriorityFloat { get; set; }
        public string Description { get; set; }
    }
} 