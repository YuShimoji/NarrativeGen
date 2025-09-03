namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents a choice option loaded from CSV.
    /// Distinguishes from the runtime 'Choice' model used in NarrativeResult.
    /// </summary>
    public class ChoiceData
    {
        public string Id { get; set; } // choice_1, choice_2...
        public string Text { get; set; }
        public string NextEventId { get; set; }
        public string ChoiceGroupId { get; set; } // ch_001, ch_002...
        public string Conditions { get; set; } // Optional conditions
    }
}