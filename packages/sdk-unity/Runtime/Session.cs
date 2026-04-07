using System;
using System.Collections.Generic;
using System.Linq;

namespace NarrativeGen.Runtime
{
    /// <summary>
    /// Represents the state of a narrative session including flags, resources, variables, inventory, and time.
    /// </summary>
    public class Session
    {
        public string CurrentNodeId { get; }
        public Dictionary<string, bool> Flags { get; }
        public Dictionary<string, double> Resources { get; }
        public Dictionary<string, object> Variables { get; }
        public List<string> Inventory { get; }
        public double Time { get; }

        /// <summary>
        /// 動的イベントエンティティ（session.events）。静的エンティティ（モデル JSON の entities）とテンプレート展開でマージ参照される。
        /// </summary>
        public Dictionary<string, Entity> Events { get; }

        public Session(string currentNodeId,
                        Dictionary<string, bool>? flags = null,
                        Dictionary<string, double>? resources = null,
                        Dictionary<string, object>? variables = null,
                        List<string>? inventory = null,
                        double time = 0,
                        Dictionary<string, Entity>? events = null)
        {
            CurrentNodeId = currentNodeId;
            Flags = flags != null ? new Dictionary<string, bool>(flags) : new Dictionary<string, bool>();
            Resources = resources != null ? new Dictionary<string, double>(resources) : new Dictionary<string, double>();
            Variables = variables != null ? new Dictionary<string, object>(variables) : new Dictionary<string, object>();
            Inventory = inventory != null ? new List<string>(inventory) : new List<string>();
            Time = time;
            Events = CloneEvents(events);
        }

        private static Dictionary<string, Entity> CloneEvents(Dictionary<string, Entity>? events)
        {
            if (events == null || events.Count == 0)
                return new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase);
            return new Dictionary<string, Entity>(events, StringComparer.OrdinalIgnoreCase);
        }

        public Session With(
            string? currentNodeId = null,
            Dictionary<string, bool>? flags = null,
            Dictionary<string, double>? resources = null,
            Dictionary<string, object>? variables = null,
            List<string>? inventory = null,
            double? time = null,
            Dictionary<string, Entity>? events = null)
        {
            return new Session(
                currentNodeId ?? CurrentNodeId,
                flags ?? Flags,
                resources ?? Resources,
                variables ?? Variables,
                inventory ?? Inventory,
                time ?? Time,
                events ?? Events
            );
        }

        /// <summary>
        /// Checks whether the inventory contains the given item (case-insensitive).
        /// </summary>
        public bool HasItem(string key)
        {
            return Inventory.Any(id => string.Equals(id, key, StringComparison.OrdinalIgnoreCase));
        }
    }
}
