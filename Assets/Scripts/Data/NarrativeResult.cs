using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Data.Models;

namespace NarrativeGen.Data
{
    /// <summary>
    /// Represents the result of executing a narrative event or command.
    /// It contains all the information needed by the GameManager/UIManager to update the game state and display.
    /// </summary>
    public class NarrativeResult
    {
        public enum ResultType
        {
            /// <summary>Displays text and waits for user input to continue.</summary>
            Text,
            /// <summary>Displays text and a list of choices for the player.</summary>
            Choice,
            /// <summary>A command that results in an immediate transition to another event (e.g., GOTO).</summary>
            EventTransition,
            /// <summary>A command that performs a background state change without direct output (e.g., SET).</summary>
            StateChange,
            /// <summary>No operation was performed, or the operation resulted in no change.</summary>
            NoOp,
            /// <summary>An error occurred during processing.</summary>
            Error,
        }

        public ResultType Type { get; set; } = ResultType.NoOp;
        
        // Content Properties
        public string Speaker { get; set; }
        public string Text { get; set; }
        public List<Choice> Choices { get; set; } = new List<Choice>();
        
        // Flow Control Properties
        /// <summary>If set, the GameManager should immediately execute this event.</summary>
        public string NextEventId { get; set; }
        
        /// <summary>If set, these commands should be executed immediately by the GameManager.</summary>
        public List<string> ChainedCommands { get; private set; } = new List<string>();

        // Convenience getters
        public bool HasText => !string.IsNullOrEmpty(Text);
        public bool HasChoices => Choices != null && Choices.Any();
        public bool HasNextEvent => !string.IsNullOrEmpty(NextEventId);
        public bool HasChainedCommands => ChainedCommands != null && ChainedCommands.Any();

        /// <summary>
        /// Merges another result into this one. Useful for combining results from multiple commands.
        /// </summary>
        public void Merge(NarrativeResult other)
        {
            if (other == null) return;

            // Prioritize more "active" types
            if (other.Type > this.Type)
            {
                this.Type = other.Type;
            }

            if (other.HasText) this.Text = other.Text;
            if (other.HasChoices) this.Choices.AddRange(other.Choices);
            if (other.HasNextEvent) this.NextEventId = other.NextEventId;
            if (other.HasChainedCommands) this.ChainedCommands.AddRange(other.ChainedCommands);
            if (!string.IsNullOrEmpty(other.Speaker)) this.Speaker = other.Speaker;
        }
    }
} 