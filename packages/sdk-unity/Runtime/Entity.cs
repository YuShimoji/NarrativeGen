using System;
using Newtonsoft.Json;

namespace NarrativeGen
{
    /// <summary>
    /// Represents an item or actor available within a narrative session.
    /// </summary>
    [Serializable]
    public class Entity
    {
        /// <summary>
        /// Identifier used when referring to the entity in models and sessions.
        /// </summary>
        [JsonProperty("id")]
        public string Id = string.Empty;

        /// <summary>
        /// Display name shown to players.
        /// </summary>
        [JsonProperty("name")]
        public string Name = string.Empty;

        /// <summary>
        /// Narrative description presented when the entity is encountered.
        /// </summary>
        [JsonProperty("description")]
        public string Description = string.Empty;

        /// <summary>
        /// Optional resource cost associated with the entity.
        /// </summary>
        [JsonProperty("cost")]
        public double Cost;
    }
}
