using System;

namespace NarrativeGen.Data.Models
{
    /// <summary>
    /// Represents an event in the narrative system.
    /// </summary>
    [Serializable]
    public class Event
    {
        public string Id { get; set; }
        public string Commands { get; set; }
        public string Text { get; set; }
        
        public Event()
        {
            Id = string.Empty;
            Commands = string.Empty;
            Text = string.Empty;
        }
    }
}