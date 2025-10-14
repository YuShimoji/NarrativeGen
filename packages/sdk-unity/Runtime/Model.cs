using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using NarrativeGen.Serialization;

namespace NarrativeGen
{
    /// <summary>
    /// Defines the data required to run a narrative, including nodes and initial state.
    /// </summary>
    public class NarrativeModel
    {
        /// <summary>
        /// Gets or sets the narrative model type identifier.
        /// </summary>
        [JsonProperty("modelType")]
        public string ModelType { get; set; } = "adventure-playthrough";

        /// <summary>
        /// Gets or sets the identifier of the starting node.
        /// </summary>
        [JsonProperty("startNode")]
        public string StartNode { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the initial flag state when the model starts.
        /// </summary>
        [JsonProperty("flags")]
        public Dictionary<string, bool>? InitialFlags { get; set; }
            = new Dictionary<string, bool>();

        /// <summary>
        /// Gets or sets the initial resource state when the model starts.
        /// </summary>
        [JsonProperty("resources")]
        public Dictionary<string, double>? InitialResources { get; set; }
            = new Dictionary<string, double>();

        /// <summary>
        /// Gets or sets the narrative nodes keyed by identifier.
        /// </summary>
        [JsonProperty("nodes")]
        public Dictionary<string, Node> Nodes { get; set; } = new();

        /// <summary>
        /// Validates that the model references and identifiers are consistent.
        /// </summary>
        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(StartNode))
                throw new ArgumentException("Model.startNode is required");
            if (!Nodes.ContainsKey(StartNode))
                throw new ArgumentException($"Model.startNode '{StartNode}' not found in nodes");
            foreach (var kv in Nodes)
            {
                var id = kv.Key;
                var node = kv.Value;
                if (node.Id != id)
                    throw new ArgumentException($"Node key '{id}' must match node.id '{node.Id}'");
                node.Validate();
            }
        }
    }

    /// <summary>
    /// Represents a narrative node that provides text and possible choices.
    /// </summary>
    public class Node
    {
        /// <summary>
        /// Gets or sets the node identifier.
        /// </summary>
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the text presented when the node is active.
        /// </summary>
        [JsonProperty("text")]
        public string? Text { get; set; }

        /// <summary>
        /// Gets or sets the collection of choices available from this node.
        /// </summary>
        [JsonProperty("choices")]
        public List<Choice>? Choices { get; set; }

        /// <summary>
        /// Validates that the node definition is consistent.
        /// </summary>
        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Id))
                throw new ArgumentException("Node.id is required");
            if (Choices != null)
            {
                var seen = new HashSet<string>();
                foreach (var c in Choices)
                {
                    c.Validate();
                    if (!seen.Add(c.Id))
                        throw new ArgumentException($"Duplicate choice id '{c.Id}' in node '{Id}'");
                }
            }
        }
    }

    /// <summary>
    /// Represents a selectable choice from a node.
    /// </summary>
    public class Choice
    {
        /// <summary>
        /// Gets or sets the unique identifier for the choice.
        /// </summary>
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the text describing the choice.
        /// </summary>
        [JsonProperty("text")]
        public string Text { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the identifier of the target node when the choice is applied.
        /// </summary>
        [JsonProperty("target")]
        public string? Target { get; set; }

        /// <summary>
        /// Gets or sets the list of conditions that gate the choice.
        /// </summary>
        [JsonProperty("conditions")]
        public List<Condition>? Conditions { get; set; }

        /// <summary>
        /// Gets or sets the effects applied when the choice is taken.
        /// </summary>
        [JsonProperty("effects")]
        public List<Effect>? Effects { get; set; }

        /// <summary>
        /// Gets or sets the optional non-navigational outcome for the choice.
        /// </summary>
        [JsonProperty("outcome")]
        public ChoiceOutcome? Outcome { get; set; }

        /// <summary>
        /// Validates that the choice definition contains required data.
        /// </summary>
        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Id))
                throw new ArgumentException("Choice.id is required");
            if (string.IsNullOrWhiteSpace(Text))
                throw new ArgumentException("Choice.text is required");
        }
    }

    /// <summary>
    /// Represents metadata emitted when a choice resolves.
    /// </summary>
    public class ChoiceOutcome
    {
        /// <summary>
        /// Gets or sets the outcome type identifier.
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the outcome payload.
        /// </summary>
        [JsonProperty("value")]
        public string Value { get; set; } = string.Empty;
    }

    // Conditions
    /// <summary>
    /// Base type for conditional requirements on choices.
    /// </summary>
    [JsonConverter(typeof(ConditionConverter))]
    public abstract class Condition
    {
        /// <summary>
        /// Gets or sets the condition type discriminator.
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;
    }

    /// <summary>
    /// Condition that checks a boolean flag value.
    /// </summary>
    public class FlagCondition : Condition
    {
        /// <summary>
        /// Gets or sets the name of the flag to evaluate.
        /// </summary>
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the expected flag value.
        /// </summary>
        [JsonProperty("value")]
        public bool Value { get; set; }
    }

    /// <summary>
    /// Condition that compares a numeric resource to a threshold.
    /// </summary>
    public class ResourceCondition : Condition
    {
        /// <summary>
        /// Gets or sets the resource key to inspect.
        /// </summary>
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the comparison operator (e.g. ==, >=).
        /// </summary>
        [JsonProperty("op")]
        public string Op { get; set; } = "==";

        /// <summary>
        /// Gets or sets the value to compare against the resource.
        /// </summary>
        [JsonProperty("value")]
        public double Value { get; set; }
    }

    /// <summary>
    /// Condition that constrains availability to a time interval.
    /// </summary>
    public class TimeWindowCondition : Condition
    {
        /// <summary>
        /// Gets or sets the inclusive start time.
        /// </summary>
        [JsonProperty("start")]
        public double Start { get; set; }

        /// <summary>
        /// Gets or sets the inclusive end time.
        /// </summary>
        [JsonProperty("end")]
        public double End { get; set; }
    }

    // Effects
    /// <summary>
    /// Base type for side effects applied when a choice is selected.
    /// </summary>
    [JsonConverter(typeof(EffectConverter))]
    public abstract class Effect
    {
        /// <summary>
        /// Gets or sets the effect type discriminator.
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;
    }

    /// <summary>
    /// Effect that sets a boolean flag to a specified value.
    /// </summary>
    public class SetFlagEffect : Effect
    {
        /// <summary>
        /// Gets or sets the flag key to modify.
        /// </summary>
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the value to assign to the flag.
        /// </summary>
        [JsonProperty("value")]
        public bool Value { get; set; }
    }

    /// <summary>
    /// Effect that adjusts a numeric resource by a delta.
    /// </summary>
    public class AddResourceEffect : Effect
    {
        /// <summary>
        /// Gets or sets the resource key to modify.
        /// </summary>
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the amount added to (or removed from) the resource.
        /// </summary>
        [JsonProperty("delta")]
        public double Delta { get; set; }
    }

    /// <summary>
    /// Effect that transfers the current node to another specified node.
    /// </summary>
    public class GotoEffect : Effect
    {
        /// <summary>
        /// Gets or sets the target node identifier.
        /// </summary>
        [JsonProperty("target")]
        public string Target { get; set; } = string.Empty;
    }
}
