using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    /// <summary>
    /// Manages runtime state for interactive narrative play, including inventory and outcomes.
    /// </summary>
    public class GameSession
    {
        private readonly NarrativeModel _model;
        private Session _session;
        private readonly Dictionary<string, Entity> _entityMap;
        private readonly List<string> _inventory;
        private readonly Dictionary<string, ChoiceOutcome> _choiceOutcomes;
        private ChoiceOutcome? _lastOutcome;

        /// <summary>
        /// Initializes a new instance of the <see cref="GameSession"/> class.
        /// </summary>
        /// <param name="model">Narrative model driving the session.</param>
        /// <param name="entities">Optional entity catalog available to the session.</param>
        /// <param name="initialInventory">Optional list of entity identifiers granted at start.</param>
        /// <param name="choiceOutcomes">Optional overrides for choice outcomes keyed by identifier.</param>
        /// <param name="initialState">Optional previously saved session state.</param>
        public GameSession(
            NarrativeModel model,
            IEnumerable<Entity>? entities = null,
            IEnumerable<string>? initialInventory = null,
            IDictionary<string, ChoiceOutcome>? choiceOutcomes = null,
            Session? initialState = null)
        {
            _model = model ?? throw new ArgumentNullException(nameof(model));
            _session = initialState ?? Engine.StartSession(model);

            _entityMap = new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase);
            if (entities != null)
            {
                foreach (var entity in entities)
                {
                    if (entity == null || string.IsNullOrWhiteSpace(entity.Id)) continue;
                    _entityMap[entity.Id] = entity;
                }
            }

            _inventory = new List<string>();
            if (initialInventory != null)
            {
                foreach (var id in initialInventory)
                {
                    AddInventoryItem(id);
                }
            }

            _choiceOutcomes = choiceOutcomes != null
                ? new Dictionary<string, ChoiceOutcome>(choiceOutcomes, StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, ChoiceOutcome>(StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Gets the current runtime session state.
        /// </summary>
        public Session State => _session;

        /// <summary>
        /// Gets the most recent outcome produced by <see cref="ApplyChoice(string)"/>.
        /// </summary>
        public ChoiceOutcome? LastOutcome => _lastOutcome;

        /// <summary>
        /// Lists the concrete entity instances currently held in the inventory.
        /// </summary>
        /// <returns>Entities present in the session inventory.</returns>
        public IReadOnlyList<Entity> ListInventory()
        {
            var items = new List<Entity>();
            foreach (var id in _inventory)
            {
                if (_entityMap.TryGetValue(id, out var entity))
                {
                    items.Add(entity);
                }
            }
            return items;
        }

        /// <summary>
        /// Adds an entity to the inventory if available.
        /// </summary>
        /// <param name="id">Identifier of the entity to add.</param>
        /// <returns>The added entity, or <c>null</c> if not available.</returns>
        public Entity? PickupEntity(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (!_entityMap.TryGetValue(id, out var entity)) return null;
            AddInventoryItem(id);
            return entity;
        }

        /// <summary>
        /// Removes an entity from the inventory if present.
        /// </summary>
        /// <param name="id">Identifier of the entity to remove.</param>
        /// <returns>The removed entity, or <c>null</c> if not held.</returns>
        public Entity? RemoveEntity(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (!_entityMap.TryGetValue(id, out var entity)) return null;
            RemoveInventoryItem(id);
            return entity;
        }

        /// <summary>
        /// Retrieves the available choices enriched with resolved outcomes.
        /// </summary>
        /// <returns>Collection of available choices.</returns>
        public IReadOnlyList<Choice> GetAvailableChoices()
        {
            var choices = Engine.GetAvailableChoices(_session, _model);
            return choices
                .Select(choice => CloneChoiceWithOutcome(choice, ResolveOutcome(choice.Id)))
                .ToList();
        }

        /// <summary>
        /// Applies a choice and updates session state and inventory accordingly.
        /// </summary>
        /// <param name="choiceId">Identifier of the choice to execute.</param>
        /// <returns>The updated session state.</returns>
        public Session ApplyChoice(string choiceId)
        {
            if (string.IsNullOrWhiteSpace(choiceId))
                throw new ArgumentException("choiceId is required", nameof(choiceId));

            _session = Engine.ApplyChoice(_session, _model, choiceId);
            var outcome = ResolveOutcome(choiceId);
            ApplyOutcome(outcome);
            _lastOutcome = outcome;
            return _session;
        }

        private ChoiceOutcome? ResolveOutcome(string choiceId)
        {
            if (_choiceOutcomes.TryGetValue(choiceId, out var outcome))
            {
                return outcome;
            }

            var choice = FindChoiceInModel(choiceId);
            return choice?.Outcome;
        }

        private Choice? FindChoiceInModel(string choiceId)
        {
            foreach (var node in _model.Nodes.Values)
            {
                if (node.Choices == null) continue;
                var match = node.Choices.FirstOrDefault(c => string.Equals(c.Id, choiceId, StringComparison.OrdinalIgnoreCase));
                if (match != null) return match;
            }

            return null;
        }

        private void ApplyOutcome(ChoiceOutcome? outcome)
        {
            if (outcome == null || string.IsNullOrWhiteSpace(outcome.Type)) return;

            switch (outcome.Type.ToUpperInvariant())
            {
                case "ADD_ITEM":
                    AddInventoryItem(outcome.Value);
                    break;
                case "REMOVE_ITEM":
                    RemoveInventoryItem(outcome.Value);
                    break;
                case "NONE":
                case "":
                    break;
                default:
                    break;
            }
        }

        private void AddInventoryItem(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return;
            var key = id!;
            if (!_entityMap.ContainsKey(key)) return;
            if (_inventory.Contains(key)) return;
            _inventory.Add(key);
        }

        private void RemoveInventoryItem(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return;
            var key = id!;
            _inventory.Remove(key);
        }

        private static Choice CloneChoiceWithOutcome(Choice source, ChoiceOutcome? outcome)
        {
            return new Choice
            {
                Id = source.Id,
                Text = source.Text,
                Target = source.Target,
                Conditions = source.Conditions,
                Effects = source.Effects,
                Outcome = outcome
            };
        }
    }
}
