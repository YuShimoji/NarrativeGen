using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using NarrativeGen.Serialization;

namespace NarrativeGen
{
    public class NarrativeModel
    {
        [JsonProperty("modelType")] public string ModelType { get; set; } = "adventure-playthrough";
        [JsonProperty("startNode")] public string StartNode { get; set; } = string.Empty;
        [JsonProperty("flags")] public Dictionary<string, bool>? InitialFlags { get; set; }
            = new Dictionary<string, bool>();
        [JsonProperty("resources")] public Dictionary<string, double>? InitialResources { get; set; }
            = new Dictionary<string, double>();
        [JsonProperty("nodes")] public Dictionary<string, Node> Nodes { get; set; } = new();

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

    public class Node
    {
        [JsonProperty("id")] public string Id { get; set; } = string.Empty;
        [JsonProperty("text")] public string? Text { get; set; }
        [JsonProperty("choices")] public List<Choice>? Choices { get; set; }

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

    public class Choice
    {
        [JsonProperty("id")] public string Id { get; set; } = string.Empty;
        [JsonProperty("text")] public string Text { get; set; } = string.Empty;
        [JsonProperty("target")] public string? Target { get; set; }
        [JsonProperty("conditions")] public List<Condition>? Conditions { get; set; }
        [JsonProperty("effects")] public List<Effect>? Effects { get; set; }
        [JsonProperty("outcome")] public ChoiceOutcome? Outcome { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Id))
                throw new ArgumentException("Choice.id is required");
            if (string.IsNullOrWhiteSpace(Text))
                throw new ArgumentException("Choice.text is required");
        }
    }

    public class ChoiceOutcome
    {
        [JsonProperty("type")] public string Type { get; set; } = string.Empty;
        [JsonProperty("value")] public string Value { get; set; } = string.Empty;
    }

    // Conditions
    [JsonConverter(typeof(ConditionConverter))]
    public abstract class Condition
    {
        [JsonProperty("type")] public string Type { get; set; } = string.Empty;
    }

    public class FlagCondition : Condition
    {
        [JsonProperty("key")] public string Key { get; set; } = string.Empty;
        [JsonProperty("value")] public bool Value { get; set; }
    }

    public class ResourceCondition : Condition
    {
        [JsonProperty("key")] public string Key { get; set; } = string.Empty;
        [JsonProperty("op")] public string Op { get; set; } = "==";
        [JsonProperty("value")] public double Value { get; set; }
    }

    public class TimeWindowCondition : Condition
    {
        [JsonProperty("start")] public double Start { get; set; }
        [JsonProperty("end")] public double End { get; set; }
    }

    // Effects
    [JsonConverter(typeof(EffectConverter))]
    public abstract class Effect
    {
        [JsonProperty("type")] public string Type { get; set; } = string.Empty;
    }

    public class SetFlagEffect : Effect
    {
        [JsonProperty("key")] public string Key { get; set; } = string.Empty;
        [JsonProperty("value")] public bool Value { get; set; }
    }

    public class AddResourceEffect : Effect
    {
        [JsonProperty("key")] public string Key { get; set; } = string.Empty;
        [JsonProperty("delta")] public double Delta { get; set; }
    }

    public class GotoEffect : Effect
    {
        [JsonProperty("target")] public string Target { get; set; } = string.Empty;
    }
}
