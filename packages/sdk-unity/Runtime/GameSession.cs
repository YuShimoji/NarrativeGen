using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    /// <summary>
    /// Manages runtime state for interactive narrative play, including entity resolution and outcomes.
    /// Inventory state is delegated to <see cref="Session"/>.
    /// </summary>
    public class GameSession
    {
        private readonly NarrativeModel _model;
        private Session _session;
        private readonly Dictionary<string, Entity> _entityMap;
        private readonly Dictionary<string, ChoiceOutcome> _choiceOutcomes;
        private ChoiceOutcome? _lastOutcome;

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

            // Also load entities from model if available
            if (model.Entities != null)
            {
                foreach (var kv in model.Entities)
                {
                    if (!_entityMap.ContainsKey(kv.Key))
                        _entityMap[kv.Key] = kv.Value;
                }
            }

            if (initialInventory != null)
            {
                var inventory = new List<string>(_session.Inventory);
                foreach (var id in initialInventory)
                {
                    if (!string.IsNullOrWhiteSpace(id) && _entityMap.ContainsKey(id) &&
                        !inventory.Any(x => string.Equals(x, id, StringComparison.OrdinalIgnoreCase)))
                    {
                        inventory.Add(id);
                    }
                }
                _session = _session.With(inventory: inventory);
            }

            _choiceOutcomes = choiceOutcomes != null
                ? new Dictionary<string, ChoiceOutcome>(choiceOutcomes, StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, ChoiceOutcome>(StringComparer.OrdinalIgnoreCase);
        }

        public Session State => _session;
        public ChoiceOutcome? LastOutcome => _lastOutcome;

        /// <summary>
        /// Lists the concrete entity instances currently held in the inventory.
        /// </summary>
        public IReadOnlyList<Entity> ListInventory()
        {
            var items = new List<Entity>();
            foreach (var id in _session.Inventory)
            {
                if (_entityMap.TryGetValue(id, out var entity))
                    items.Add(entity);
            }
            return items;
        }

        /// <summary>
        /// Adds an entity to the inventory if available.
        /// </summary>
        public Entity? PickupEntity(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (!_entityMap.TryGetValue(id, out var entity)) return null;
            if (_session.HasItem(id)) return entity;
            var inventory = new List<string>(_session.Inventory) { id };
            _session = _session.With(inventory: inventory);
            return entity;
        }

        /// <summary>
        /// Removes an entity from the inventory if present.
        /// </summary>
        public Entity? RemoveEntity(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (!_entityMap.TryGetValue(id, out var entity)) return null;
            var idx = _session.Inventory.FindIndex(x => string.Equals(x, id, StringComparison.OrdinalIgnoreCase));
            if (idx == -1) return null;
            var inventory = new List<string>(_session.Inventory);
            inventory.RemoveAt(idx);
            _session = _session.With(inventory: inventory);
            return entity;
        }

        public IReadOnlyList<Choice> GetAvailableChoices()
        {
            var choices = Engine.GetAvailableChoices(_session, _model);
            return choices
                .Select(choice => CloneChoiceWithOutcome(choice, ResolveOutcome(choice.Id)))
                .ToList();
        }

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
                return outcome;
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
                    PickupEntity(outcome.Value);
                    break;
                case "REMOVE_ITEM":
                    RemoveEntity(outcome.Value);
                    break;
            }
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
