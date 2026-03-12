using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using NarrativeGen.Serialization;

namespace NarrativeGen
{
    /// <summary>
    /// Provides core functionality for loading models and executing narrative sessions.
    /// </summary>
    public static class Engine
    {
        private static bool _initialized;

        private static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;
            InferenceRegistry.RegisterBuiltins();
        }

        /// <summary>
        /// Deserializes and validates a <see cref="NarrativeModel"/> from JSON.
        /// </summary>
        public static NarrativeModel LoadModel(string json)
        {
            EnsureInitialized();
            var settings = JsonSettings.Create();
            var model = JsonConvert.DeserializeObject<NarrativeModel>(json, settings)
                        ?? throw new ArgumentException("Failed to parse NarrativeModel JSON");
            model.Validate();
            return model;
        }

        /// <summary>
        /// Creates a new runtime session using the model's initial state.
        /// </summary>
        public static Runtime.Session StartSession(NarrativeModel model)
        {
            EnsureInitialized();
            return new Runtime.Session(
                model.StartNode,
                model.InitialFlags ?? new Dictionary<string, bool>(),
                model.InitialResources ?? new Dictionary<string, double>(),
                variables: new Dictionary<string, object>(),
                inventory: new List<string>(),
                0
            );
        }

        /// <summary>
        /// Resolves the set of choices currently available for the session's active node.
        /// </summary>
        public static IReadOnlyList<Choice> GetAvailableChoices(Runtime.Session session, NarrativeModel model)
        {
            EnsureInitialized();
            var node = model.Nodes[session.CurrentNodeId];
            var choices = node.Choices ?? new List<Choice>();
            var context = EvaluationContext.FromSession(session);
            return choices.Where(c => EvaluateConditions(c.Conditions, context)).ToList();
        }

        /// <summary>
        /// Applies the specified choice, returning a new session state.
        /// </summary>
        public static Runtime.Session ApplyChoice(Runtime.Session session, NarrativeModel model, string choiceId)
        {
            EnsureInitialized();
            var node = model.Nodes[session.CurrentNodeId];
            var choice = (node.Choices ?? new List<Choice>()).FirstOrDefault(c => c.Id == choiceId)
                         ?? throw new ArgumentException($"Choice '{choiceId}' not found at node '{node.Id}'");

            var context = EvaluationContext.FromSession(session);
            if (!EvaluateConditions(choice.Conditions, context))
                throw new InvalidOperationException($"Choice '{choiceId}' is not available in current session");

            var registry = InferenceRegistry.Instance;
            var current = session;

            if (choice.Effects != null)
            {
                foreach (var eff in choice.Effects)
                {
                    current = registry.ApplyEffect(eff, current);
                }
            }

            // Apply target navigation (unless a goto effect already changed the node)
            var hasGoto = choice.Effects?.Any(e => e is GotoEffect) ?? false;
            if (!hasGoto)
            {
                var resolvedTarget = string.IsNullOrWhiteSpace(choice.Target) ? node.Id : choice.Target;
                if (string.IsNullOrWhiteSpace(resolvedTarget))
                    throw new ArgumentException("Target node id cannot be null or whitespace", nameof(choiceId));
                if (!model.Nodes.ContainsKey(resolvedTarget!))
                    throw new ArgumentException($"Target node '{resolvedTarget}' not found in model", nameof(choiceId));
                current = current.With(currentNodeId: resolvedTarget);
            }

            current = current.With(time: current.Time + 1);
            return current;
        }

        private static bool EvaluateConditions(List<Condition>? conditions, EvaluationContext context)
        {
            if (conditions == null || conditions.Count == 0) return true;
            var registry = InferenceRegistry.Instance;
            return conditions.All(c => registry.EvaluateCondition(c, context));
        }
    }
}
