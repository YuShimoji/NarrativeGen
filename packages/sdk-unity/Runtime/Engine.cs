using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using NarrativeGen.Serialization;

namespace NarrativeGen
{
    /// <summary>
    /// Provides core narrative model loading and session management utilities.
    /// </summary>
    public static class Engine
    {
        /// <summary>
        /// Deserializes and validates a <see cref="NarrativeModel"/> from JSON.
        /// </summary>
        /// <param name="json">Narrative model JSON payload.</param>
        /// <returns>Validated <see cref="NarrativeModel"/> instance.</returns>
        /// <exception cref="ArgumentException">Thrown when the JSON cannot be parsed or is invalid.</exception>
        public static NarrativeModel LoadModel(string json)
        {
            var settings = JsonSettings.Create();
            var model = JsonConvert.DeserializeObject<NarrativeModel>(json, settings)
                        ?? throw new ArgumentException("Failed to parse NarrativeModel JSON");
            model.Validate();
            return model;
        }

        /// <summary>
        /// Creates a new narrative session using the model's initial state.
        /// </summary>
        /// <param name="model">Narrative model to drive the session.</param>
        /// <returns>Initialized runtime session.</returns>
        public static Runtime.Session StartSession(NarrativeModel model)
        {
            return new Runtime.Session(
                model.StartNode,
                model.InitialFlags ?? new Dictionary<string, bool>(),
                model.InitialResources ?? new Dictionary<string, double>(),
                0
            );
        }

        /// <summary>
        /// Returns the set of choices currently available for the session's node.
        /// </summary>
        /// <param name="session">Current session state.</param>
        /// <param name="model">Narrative model providing node definitions.</param>
        /// <returns>Filtered list of available choices.</returns>
        public static IReadOnlyList<Choice> GetAvailableChoices(Runtime.Session session, NarrativeModel model)
        {
            var node = model.Nodes[session.CurrentNodeId];
            var choices = node.Choices ?? new List<Choice>();
            return choices.Where(c => EvaluateConditions(c.Conditions, session)).ToList();
        }

        /// <summary>
        /// Applies the specified choice, mutating session state and advancing time.
        /// </summary>
        /// <param name="session">Current session state.</param>
        /// <param name="model">Narrative model providing choice definitions.</param>
        /// <param name="choiceId">Identifier of the choice to apply.</param>
        /// <returns>Updated session state after applying the choice.</returns>
        /// <exception cref="ArgumentException">Thrown when the choice or target node cannot be resolved.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the choice is not currently available.</exception>
        public static Runtime.Session ApplyChoice(Runtime.Session session, NarrativeModel model, string choiceId)
        {
            var node = model.Nodes[session.CurrentNodeId];
            var choice = (node.Choices ?? new List<Choice>()).FirstOrDefault(c => c.Id == choiceId)
                         ?? throw new ArgumentException($"Choice '{choiceId}' not found at node '{node.Id}'");
            if (!EvaluateConditions(choice.Conditions, session))
                throw new InvalidOperationException($"Choice '{choiceId}' is not available in current session");

            var flags = new Dictionary<string, bool>(session.Flags);
            var resources = new Dictionary<string, double>(session.Resources);
            string? target = choice.Target;

            if (choice.Effects != null)
            {
                foreach (var eff in choice.Effects)
                {
                    switch (eff)
                    {
                        case SetFlagEffect setf:
                            flags[setf.Key] = setf.Value;
                            break;
                        case AddResourceEffect addr:
                            resources[addr.Key] = (resources.ContainsKey(addr.Key) ? resources[addr.Key] : 0) + addr.Delta;
                            break;
                        case GotoEffect go:
                            target = go.Target;
                            break;
                    }
                }
            }

            var resolvedTarget = string.IsNullOrWhiteSpace(target) ? node.Id : target;
            if (string.IsNullOrWhiteSpace(resolvedTarget))
                throw new ArgumentException("Target node id cannot be null or whitespace", nameof(choiceId));
            if (!model.Nodes.ContainsKey(resolvedTarget!))
                throw new ArgumentException($"Target node '{resolvedTarget}' not found in model", nameof(choiceId));
            var nextTime = session.Time + 1;
            return session.With(currentNodeId: resolvedTarget, flags: flags, resources: resources, time: nextTime);
        }

        private static bool EvaluateConditions(List<Condition>? conditions, Runtime.Session session)
        {
            if (conditions == null || conditions.Count == 0) return true;
            foreach (var cond in conditions)
            {
                switch (cond)
                {
                    case FlagCondition fc:
                        var flag = session.Flags.ContainsKey(fc.Key) ? session.Flags[fc.Key] : false;
                        if (flag != fc.Value) return false;
                        break;
                    case ResourceCondition rc:
                        var val = session.Resources.ContainsKey(rc.Key) ? session.Resources[rc.Key] : 0;
                        if (!Compare(val, rc.Op, rc.Value)) return false;
                        break;
                    case TimeWindowCondition tw:
                        if (!(session.Time >= tw.Start && session.Time <= tw.End)) return false;
                        break;
                    default:
                        return false;
                }
            }
            return true;
        }

        private static bool Compare(double left, string op, double right)
        {
            switch (op)
            {
                case ">=": return left >= right;
                case "<=": return left <= right;
                case ">": return left > right;
                case "<": return left < right;
                case "==": return Math.Abs(left - right) < 1e-9;
                default: return false;
            }
        }
    }
}
