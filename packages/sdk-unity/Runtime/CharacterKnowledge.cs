using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Runtime;
using Newtonsoft.Json;

namespace NarrativeGen
{
    internal sealed class NarrativeCharacter
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("knowledgeProfiles")]
        public List<NarrativeKnowledgeProfile>? Profiles { get; set; }
    }

    internal sealed class NarrativeKnowledgeProfile
    {
        [JsonProperty("domain")]
        public string Domain { get; set; } = string.Empty;

        [JsonProperty("accuracy")]
        public double? Accuracy { get; set; }

        [JsonProperty("tolerance")]
        public double? Tolerance { get; set; }
    }

    internal sealed class KnowledgeRuleData
    {
        [JsonProperty("character")]
        public string Character { get; set; } = string.Empty;

        [JsonProperty("entity")]
        public string Entity { get; set; } = string.Empty;

        [JsonProperty("domain")]
        public string Domain { get; set; } = string.Empty;

        [JsonProperty("expectations")]
        public Dictionary<string, double>? Expectations { get; set; }
    }

    internal sealed class KnowledgeRuleCondition : Condition
    {
        [JsonProperty("rule")]
        public string Rule { get; set; } = string.Empty;

        [JsonProperty("result")]
        public string Result { get; set; } = string.Empty;
    }

    internal sealed class PerceiveEntityEffect : Effect
    {
        [JsonProperty("character")]
        public string Character { get; set; } = string.Empty;

        [JsonProperty("entity")]
        public string Entity { get; set; } = string.Empty;

        [JsonProperty("domain")]
        public string Domain { get; set; } = string.Empty;

        [JsonProperty("expectations")]
        public Dictionary<string, double>? Expectations { get; set; }

        [JsonProperty("eventId")]
        public string? EventId { get; set; }

        [JsonProperty("eventName")]
        public string? EventName { get; set; }

        [JsonProperty("onlyIfNoticed")]
        public bool OnlyIfNoticed { get; set; }
    }

    internal sealed class KnowledgeRuleEvaluator : IConditionEvaluator
    {
        public string Type => "knowledgeRule";

        public bool Evaluate(Condition condition, EvaluationContext context)
        {
            var check = (KnowledgeRuleCondition)condition;
            return check.Result == "noticed" && CharacterKnowledge.RuleIsNoticed(context.Model, check.Rule);
        }
    }

    internal static class CharacterKnowledge
    {
        private sealed class Anomaly
        {
            public string Key { get; }
            public double Expected { get; }
            public double Actual { get; }
            public double Deviation { get; }
            public bool Noticed => Deviation > 1;

            public Anomaly(string key, double expected, double actual, double tolerance)
            {
                Key = key;
                Expected = expected;
                Actual = actual;

                double range = Math.Abs(expected * tolerance);
                double difference = Math.Abs(actual - expected);
                Deviation = range > 0 ? difference / range : (difference == 0 ? 0 : double.PositiveInfinity);
            }
        }

        public static bool RuleIsNoticed(NarrativeModel? model, string id)
        {
            if (model?.KnowledgeRules == null ||
                !model.KnowledgeRules.TryGetValue(id, out var rule) ||
                rule.Expectations == null || rule.Expectations.Count == 0 ||
                !TryGetParticipants(model, rule.Character, rule.Entity, out var character, out _))
            {
                return false;
            }

            var anomalies = Compare(model.Entities!, character, rule.Entity, rule.Domain, rule.Expectations);
            return anomalies.Count == rule.Expectations.Count && anomalies.Any(a => a.Noticed);
        }

        public static Session Perceive(PerceiveEntityEffect effect, Session session, NarrativeModel? model)
        {
            if (!TryGetParticipants(model, effect.Character, effect.Entity, out var character, out var entity))
            {
                return session;
            }

            var anomalies = Compare(model!.Entities!, character, effect.Entity, effect.Domain, effect.Expectations);
            var noticed = anomalies.FirstOrDefault(a => a.Noticed);
            if (effect.OnlyIfNoticed && noticed == null)
            {
                return session;
            }

            var primary = noticed ?? anomalies.FirstOrDefault();
            var total = FiniteOrZero(anomalies.Sum(a => a.Deviation));
            var data = new Dictionary<string, CreateEventPropertyInput>
            {
                ["knowledge_source"] = Value("perceiveEntity"),
                ["observer"] = Value(character.Id),
                ["character_id"] = Value(character.Id),
                ["character_name"] = Value(character.Name),
                ["source_entity"] = Value(effect.Entity),
                ["domain"] = Value(effect.Domain),
                ["perception_noticed"] = Value(noticed != null),
                ["anomaly_count"] = Value(anomalies.Count),
                ["total_deviation"] = Value(total),
                ["severity"] = Value(Math.Min(100, Math.Floor(total * 20 + 0.5))),
                ["primary_property"] = Value(primary?.Key ?? "none"),
                ["expected_value"] = Value(FiniteOrZero(primary?.Expected ?? 0)),
                ["actual_value"] = Value(FiniteOrZero(primary?.Actual ?? 0)),
                ["primary_deviation"] = Value(FiniteOrZero(primary?.Deviation ?? 0)),
            };
            var result = new CreateEventEffect
            {
                Type = "createEvent",
                Id = effect.EventId ?? $"event_{effect.Character}_perceives_{effect.Entity}",
                Name = effect.EventName ?? $"{character.Name} perceived {entity.Name}",
                Properties = data,
            };
            return InferenceRegistry.Instance.ApplyEffect(result, session);
        }

        private static bool TryGetParticipants(
            NarrativeModel? model, string characterId, string entityId,
            out NarrativeCharacter character, out Entity entity)
        {
            character = null!;
            entity = null!;
            return model?.Characters != null && model.Entities != null &&
                model.Characters.TryGetValue(characterId, out character!) &&
                model.Entities.TryGetValue(entityId, out entity!);
        }

        private static List<Anomaly> Compare(
            Dictionary<string, Entity> entities, NarrativeCharacter character,
            string entityId, string domain, Dictionary<string, double>? expectations)
        {
            var results = new List<Anomaly>();
            double? tolerance = (character.Profiles?.FirstOrDefault(p => p.Domain == domain)
                ?? character.Profiles?.FirstOrDefault(p => p.Domain == "general"))?.Tolerance;
            if (expectations == null || !tolerance.HasValue || !IsFinite(tolerance.Value))
            {
                return results;
            }

            foreach (var measurement in expectations)
            {
                var property = ResolveProperty(entities, entityId, measurement.Key);
                if (IsFinite(measurement.Value) &&
                    RuntimeNumber.TryRead(property?.DefaultValue, out var actual) && IsFinite(actual))
                {
                    results.Add(new Anomaly(measurement.Key, measurement.Value, actual, tolerance.Value));
                }
            }
            return results;
        }

        private static PropertyDef? ResolveProperty(Dictionary<string, Entity> entities, string entityId, string key)
        {
            var visited = new HashSet<string>(StringComparer.Ordinal);
            string? current = entityId;
            while (!string.IsNullOrEmpty(current) && visited.Add(current!) && entities.TryGetValue(current!, out var entity))
            {
                if (entity.Properties != null && entity.Properties.TryGetValue(key, out var property) && property != null)
                {
                    return property;
                }

                current = entity.ParentEntity;
            }
            return null;
        }

        private static CreateEventPropertyInput Value(object value) =>
            new CreateEventPropertyInput { DefaultValue = value };

        private static bool IsFinite(double value) => !double.IsNaN(value) && !double.IsInfinity(value);

        private static double FiniteOrZero(double value) => IsFinite(value) ? value : 0;
    }
}
