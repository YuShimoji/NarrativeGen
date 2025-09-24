using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using VastCore.NarrativeGen.Serialization;

namespace VastCore.NarrativeGen
{
    public static class Engine
    {
        public static NarrativeModel LoadModel(string json)
        {
            var settings = JsonSettings.Create();
            var model = JsonConvert.DeserializeObject<NarrativeModel>(json, settings)
                        ?? throw new ArgumentException("Failed to parse NarrativeModel JSON");
            model.Validate();
            return model;
        }

        public static Runtime.Session StartSession(NarrativeModel model)
        {
            return new Runtime.Session(
                model.StartNode,
                model.InitialFlags ?? new Dictionary<string, bool>(),
                model.InitialResources ?? new Dictionary<string, double>(),
                0
            );
        }

        public static IReadOnlyList<Choice> GetAvailableChoices(Runtime.Session session, NarrativeModel model)
        {
            var node = model.Nodes[session.CurrentNodeId];
            var choices = node.Choices ?? new List<Choice>();
            return choices.Where(c => EvaluateConditions(c.Conditions, session)).ToList();
        }

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

            if (string.IsNullOrEmpty(target))
                target = node.Id; // stay if no target specified
            if (!model.Nodes.ContainsKey(target))
                throw new ArgumentException($"Target node '{target}' not found in model");

            return session.With(currentNodeId: target, flags: flags, resources: resources);
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
