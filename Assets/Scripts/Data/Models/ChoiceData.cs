namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents a choice option loaded from CSV.
    /// Distinguishes from the runtime 'Choice' model used in NarrativeResult.
    /// </summary>
    public class ChoiceData
    {
        public string ChoiceId { get; set; }
        public string Category { get; set; }
        public string Text { get; set; }
        public string NextEventId { get; set; }
        public string Conditions { get; set; }
    }
} 