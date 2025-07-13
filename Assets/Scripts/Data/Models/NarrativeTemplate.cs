namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents a narrative template loaded from CSV.
    /// Used for dynamically generating descriptive text.
    /// </summary>
    public class NarrativeTemplate
    {
        public string TemplateId { get; set; }
        public string Category { get; set; }
        public string Pattern { get; set; }
    }
} 