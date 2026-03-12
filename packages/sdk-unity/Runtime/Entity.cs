using System;

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
        public string Id = string.Empty;

        /// <summary>
        /// Display name or brand shown to players.
        /// </summary>
        public string Brand = string.Empty;

        /// <summary>
        /// Narrative description presented when the entity is encountered.
        /// </summary>
        public string Description = string.Empty;

        /// <summary>
        /// Optional resource cost associated with the entity.
        /// </summary>
        public double Cost;
    }
}
