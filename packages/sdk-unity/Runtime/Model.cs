using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using NarrativeGen.Serialization;

namespace NarrativeGen
{
    /// <summary>
    /// Defines the data required for a narrative playthrough, including initial state.
    /// </summary>
    public class NarrativeModel
    {
        /// <summary>
        /// Gets or sets the model type identifier.
        /// </summary>
        [JsonProperty("modelType")]
        public string ModelType { get; set; } = "adventure-playthrough";

        /// <summary>
        /// Gets or sets the starting node identifier.
        /// </summary>
        [JsonProperty("startNode")]
        public string StartNode { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the initial flag values.
        /// </summary>
        [JsonProperty("flags")]
        public Dictionary<string, bool>? InitialFlags { get; set; }
            = new Dictionary<string, bool>();

        /// <summary>
        /// Gets or sets the initial resource values.
        /// </summary>
        [JsonProperty("resources")]
        public Dictionary<string, double>? InitialResources { get; set; }
            = new Dictionary<string, double>();

        /// <summary>
        /// Gets or sets the collection of narrative nodes keyed by identifier.
        /// </summary>
        [JsonProperty("nodes")]
        public Dictionary<string, Node> Nodes { get; set; } = new();

        /// <summary>
        /// Validates that the model contains consistent node references.
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
    /// Represents a single narrative node with text and choices.
    /// </summary>
    public class Node
    {
        /// <summary>
        /// Gets or sets the node identifier.
        /// </summary>
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the node text displayed to the player.
        /// </summary>
        [JsonProperty("text")]
        public string? Text { get; set; }

        /// <summary>
        /// Gets or sets the choices available from this node.
        /// </summary>
        [JsonProperty("choices")]
        public List<Choice>? Choices { get; set; }

        /// <summary>
        /// Validates the node for required fields and duplicate choices.
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
    /// Describes a selectable option presented at a node.
    /// </summary>
    public class Choice
    {
        /// <summary>
        /// Gets or sets the unique choice identifier.
        /// </summary>
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the text displayed for the choice.
        /// </summary>
        [JsonProperty("text")]
        public string Text { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the identifier of the target node reached by this choice.
        /// </summary>
        [JsonProperty("target")]
        public string? Target { get; set; }

        /// <summary>
        /// Gets or sets the conditions required for the choice to be available.
        /// </summary>
        [JsonProperty("conditions")]
        public List<Condition>? Conditions { get; set; }

        /// <summary>
        /// Gets or sets the effects triggered when the choice is taken.
        /// </summary>
        [JsonProperty("effects")]
        public List<Effect>? Effects { get; set; }

        /// <summary>
        /// Gets or sets the optional outcome payload of the choice.
        /// </summary>
        [JsonProperty("outcome")]
        public ChoiceOutcome? Outcome { get; set; }

        /// <summary>
        /// Validates that required fields are populated.
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
    /// Represents additional data produced when a choice resolves.
    /// </summary>
    public class ChoiceOutcome
    {
        /// <summary>
        /// Gets or sets the outcome type identifier.
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the outcome payload value.
        /// </summary>
        [JsonProperty("value")]
        public string Value { get; set; } = string.Empty;
    }

    // Conditions
    /// <summary>
    /// Base class for choice availability conditions.
    /// </summary>
    [JsonConverter(typeof(ConditionConverter))]
    public abstract class Condition
    {
        /// <summary>
        /// Gets or sets the discriminator identifying the condition type.
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
        /// Gets or sets the flag key to compare.
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
        /// Gets or sets the comparison operator.
        /// </summary>
        [JsonProperty("op")]
        public string Op { get; set; } = "==";

        /// <summary>
        /// Gets or sets the target value used for comparison.
        /// </summary>
        [JsonProperty("value")]
        public double Value { get; set; }
    }

    /// <summary>
    /// Condition that restricts availability to a time interval.
    /// </summary>
    public class TimeWindowCondition : Condition
    {
        /// <summary>
        /// Gets or sets the start time of the window.
        /// </summary>
        [JsonProperty("start")]
        public double Start { get; set; }

        /// <summary>
        /// Gets or sets the end time of the window.
        /// </summary>
        [JsonProperty("end")]
        public double End { get; set; }
    }

    // Effects
    /// <summary>
    /// Base class for choice side effects.
    /// </summary>
    [JsonConverter(typeof(EffectConverter))]
    public abstract class Effect
    {
        /// <summary>
        /// Gets or sets the discriminator identifying the effect type.
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;
    }

    /// <summary>
    /// Effect that sets a flag to a specific value.
    /// </summary>
    public class SetFlagEffect : Effect
    {
        /// <summary>
        /// Gets or sets the flag key to modify.
        /// </summary>
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the flag value to assign.
        /// </summary>
        [JsonProperty("value")]
        public bool Value { get; set; }
    }

    /// <summary>
    /// Effect that adds or subtracts a resource amount.
    /// </summary>
    public class AddResourceEffect : Effect
    {
        /// <summary>
        /// Gets or sets the resource key to modify.
        /// </summary>
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the delta applied to the resource.
        /// </summary>
        [JsonProperty("delta")]
        public double Delta { get; set; }
    }

    /// <summary>
    /// Effect that redirects the narrative to another node.
    /// </summary>
    public class GotoEffect : Effect
    {
        /// <summary>
        /// Gets or sets the identifier of the destination node.
        /// </summary>
        [JsonProperty("target")]
        public string Target { get; set; } = string.Empty;
    }
}
