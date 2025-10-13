using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    public class GameSession
    {
        private readonly NarrativeModel _model;
        private Session _session;
        private readonly Dictionary<string, Entity> _entityMap;
        private readonly List<string> _inventory;
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

        public Session State => _session;

        public ChoiceOutcome? LastOutcome => _lastOutcome;

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

        public Entity? PickupEntity(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (!_entityMap.TryGetValue(id, out var entity)) return null;
            AddInventoryItem(id);
            return entity;
        }

        public Entity? RemoveEntity(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (!_entityMap.TryGetValue(id, out var entity)) return null;
            RemoveInventoryItem(id);
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
            if (!_entityMap.ContainsKey(id)) return;
            if (_inventory.Contains(id)) return;
            _inventory.Add(id);
        }

        private void RemoveInventoryItem(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return;
            _inventory.Remove(id);
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
