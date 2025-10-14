using System;

namespace NarrativeGen
{
    /// <summary>
    /// Represents an item or actor available to a narrative session.
    /// </summary>
    [Serializable]
    public class Entity
    {
        /// <summary>
        /// Identifier used to reference the entity within a model.
        /// </summary>
        public string Id = string.Empty;

        /// <summary>
        /// Label or brand name displayed to players.
        /// </summary>
        public string Brand = string.Empty;

        /// <summary>
        /// Narrative description shown when the entity is encountered.
        /// </summary>
        public string Description = string.Empty;

        /// <summary>
        /// Optional resource cost associated with the entity.
        /// </summary>
        public double Cost;
    }
}
