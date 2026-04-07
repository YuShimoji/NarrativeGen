using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using NarrativeGen;

namespace NarrativeGen.Serialization
{
    /// <summary>
    /// JSON DTO for <see cref="Runtime.Session"/> round-trip (Engine.Serialize / Deserialize).
    /// </summary>
    public sealed class SessionSnapshot
    {
        [JsonProperty("currentNodeId", Required = Required.Always)]
        public string CurrentNodeId { get; set; } = string.Empty;

        [JsonProperty("flags")]
        public Dictionary<string, bool> Flags { get; set; } = new Dictionary<string, bool>();

        [JsonProperty("resources")]
        public Dictionary<string, double> Resources { get; set; } = new Dictionary<string, double>();

        [JsonProperty("variables")]
        public Dictionary<string, object>? Variables { get; set; }

        [JsonProperty("inventory")]
        public List<string>? Inventory { get; set; }

        [JsonProperty("time")]
        public double Time { get; set; }

        [JsonProperty("events")]
        public Dictionary<string, Entity>? Events { get; set; }

        /// <summary>
        /// Creates a snapshot from a runtime session.
        /// </summary>
        public static SessionSnapshot FromSession(Runtime.Session session)
        {
            return new SessionSnapshot
            {
                CurrentNodeId = session.CurrentNodeId,
                Flags = new Dictionary<string, bool>(session.Flags),
                Resources = new Dictionary<string, double>(session.Resources),
                Variables = new Dictionary<string, object>(session.Variables),
                Inventory = new List<string>(session.Inventory),
                Time = session.Time,
                Events = session.Events.Count > 0
                    ? new Dictionary<string, Entity>(session.Events, StringComparer.OrdinalIgnoreCase)
                    : null
            };
        }

        /// <summary>
        /// Builds an immutable-style runtime session from this snapshot.
        /// </summary>
        public Runtime.Session ToSession()
        {
            return new Runtime.Session(
                CurrentNodeId,
                Flags,
                Resources,
                Variables ?? new Dictionary<string, object>(),
                Inventory ?? new List<string>(),
                Time,
                Events
            );
        }
    }
}
