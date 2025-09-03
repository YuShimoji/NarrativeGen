using System.Collections.Generic;

namespace NarrativeGen.Data.Models
{
    public class NarrativeResult
    {
        public enum ResultType
        {
            Text,
            Choice,
            StateChange, // For internal state updates without direct output
            Error
        }

        public ResultType Type { get; set; }
        public string Speaker { get; set; }
        public string Text { get; set; }
        public List<Choice> Choices { get; set; }
        public string NextEventId { get; set; }
        public List<string> ChainedCommands { get; set; }

        public NarrativeResult()
        {
            Choices = new List<Choice>();
            ChainedCommands = new List<string>();
            Type = ResultType.Text; // Default to text
        }

        // Constructor for simple text results
        public NarrativeResult(string speaker, string text)
        {
            Speaker = speaker;
            Text = text;
            Choices = new List<Choice>();
            ChainedCommands = new List<string>();
            Type = ResultType.Text;
        }

        // Constructor for choice results
        public NarrativeResult(string speaker, string text, List<Choice> choices)
        {
            Speaker = speaker;
            Text = text;
            Choices = choices ?? new List<Choice>();
            ChainedCommands = new List<string>();
            Type = ResultType.Choice;
        }
        
        public void Merge(NarrativeResult other)
        {
            if (!string.IsNullOrEmpty(other.Text))
            {
                if (string.IsNullOrEmpty(Text))
                {
                    Text = other.Text;
                    Speaker = other.Speaker;
                }
                else
                {
                    // Append text if necessary, might need better logic
                    Text += "\n" + other.Text;
                }
            }

            if (other.Choices.Count > 0)
            {
                Choices.AddRange(other.Choices);
                Type = ResultType.Choice;
            }

            if (!string.IsNullOrEmpty(other.NextEventId))
            {
                NextEventId = other.NextEventId;
            }
            
            if (other.ChainedCommands.Count > 0)
            {
                ChainedCommands.AddRange(other.ChainedCommands);
            }

            // If the other result indicates a state change, reflect that.
            if (other.Type == ResultType.StateChange)
            {
                Type = ResultType.StateChange;
            }
        }
    }
}