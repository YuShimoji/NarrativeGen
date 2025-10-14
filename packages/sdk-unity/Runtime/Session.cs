using System.Collections.Generic;

namespace NarrativeGen.Runtime
{
    /// <summary>
    /// Represents the mutable state of a narrative playthrough, including flags and resources.
    /// </summary>
    public class Session
    {
        /// <summary>
        /// Gets the identifier of the node currently active in the session.
        /// </summary>
        public string CurrentNodeId { get; }

        /// <summary>
        /// Gets the dictionary of boolean flags associated with the session.
        /// </summary>
        public Dictionary<string, bool> Flags { get; }

        /// <summary>
        /// Gets the dictionary of numeric resources tracked by the session.
        /// </summary>
        public Dictionary<string, double> Resources { get; }

        /// <summary>
        /// Gets the narrative time marker for the session.
        /// </summary>
        public double Time { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="Session"/> class.
        /// </summary>
        /// <param name="currentNodeId">The identifier of the active node.</param>
        /// <param name="flags">Optional initial flag dictionary.</param>
        /// <param name="resources">Optional initial resource dictionary.</param>
        /// <param name="time">The starting narrative time.</param>
        public Session(string currentNodeId,
                        Dictionary<string, bool>? flags = null,
                        Dictionary<string, double>? resources = null,
                        double time = 0)
        {
            CurrentNodeId = currentNodeId;
            Flags = flags != null ? new Dictionary<string, bool>(flags) : new Dictionary<string, bool>();
            Resources = resources != null ? new Dictionary<string, double>(resources) : new Dictionary<string, double>();
            Time = time;
        }

        /// <summary>
        /// Creates a copy of the session with selectively overridden values.
        /// </summary>
        /// <param name="currentNodeId">Overrides the current node identifier.</param>
        /// <param name="flags">Overrides the flag dictionary.</param>
        /// <param name="resources">Overrides the resource dictionary.</param>
        /// <param name="time">Overrides the time value.</param>
        /// <returns>A new session reflecting the provided overrides.</returns>
        public Session With(
            string? currentNodeId = null,
            Dictionary<string, bool>? flags = null,
            Dictionary<string, double>? resources = null,
            double? time = null)
        {
            return new Session(
                currentNodeId ?? CurrentNodeId,
                flags ?? Flags,
                resources ?? Resources,
                time ?? Time
            );
        }
    }
}
