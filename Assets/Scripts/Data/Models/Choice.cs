using System;

namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents a choice option in the narrative system.
    /// </summary>
    [Serializable]
    public class Choice
    {
        public string Text { get; set; }
        public string NextEventId { get; set; }
        
        public Choice()
        {
            Text = string.Empty;
            NextEventId = string.Empty;
        }
        
        public Choice(string text, string nextEventId)
        {
            Text = text;
            NextEventId = nextEventId;
        }
    }
} 