using System.Collections.Generic;

namespace NarrativeGen.Runtime
{
    public class Session
    {
        public string CurrentNodeId { get; }
        public Dictionary<string, bool> Flags { get; }
        public Dictionary<string, double> Resources { get; }
        public double Time { get; }

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
