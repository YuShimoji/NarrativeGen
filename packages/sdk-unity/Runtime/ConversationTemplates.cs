using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    /// <summary>
    /// engine-ts の ConversationTemplate に対応。
    /// </summary>
    public sealed class ConversationTemplate
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("trigger")]
        public TemplateTrigger Trigger { get; set; } = new();

        [JsonProperty("text")]
        public string Text { get; set; } = string.Empty;

        [JsonProperty("insertContext")]
        public string? InsertContext { get; set; }

        [JsonProperty("priority")]
        public int? Priority { get; set; }

        [JsonProperty("maxUses")]
        public int? MaxUses { get; set; }
    }

    public sealed class TemplateTrigger
    {
        [JsonProperty("eventMatch")]
        public EventMatchCondition? EventMatch { get; set; }

        [JsonProperty("sessionConditions")]
        public List<Condition>? SessionConditions { get; set; }
    }

    public sealed class EventMatchCondition
    {
        [JsonProperty("propertyChecks")]
        public List<PropertyCheck> PropertyChecks { get; set; } = new();
    }

    public sealed class PropertyCheck
    {
        [JsonProperty("key")]
        public string Key { get; set; } = string.Empty;

        [JsonProperty("op")]
        public string Op { get; set; } = "==";

        [JsonProperty("value")]
        public JToken? Value { get; set; }
    }

    public sealed class ExpandedTemplate
    {
        public string TemplateId { get; set; } = string.Empty;
        public string ExpandedText { get; set; } = string.Empty;
        public string? InsertContext { get; set; }
    }

    /// <summary>
    /// TS <c>findMatchingTemplates</c> の C# 版。
    /// </summary>
    public static class ConversationTemplateMatcher
    {
        public static List<ExpandedTemplate> FindMatchingTemplates(
            IList<ConversationTemplate> templates,
            Session session,
            NarrativeModel model,
            Dictionary<string, int>? usageState = null)
        {
            var usage = usageState ?? new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var results = new List<ExpandedTemplate>();
            var sorted = templates.OrderByDescending(t => t.Priority ?? 0).ToList();
            var ctx = EvaluationContext.FromSession(session);

            foreach (var template in sorted)
            {
                if (template.MaxUses is int max && max > 0)
                {
                    var used = usage.TryGetValue(template.Id, out var u) ? u : 0;
                    if (used >= max) continue;
                }

                if (template.Trigger.EventMatch != null && session.Events.Count == 0)
                    continue;

                if (!MatchesEventTrigger(template.Trigger, session))
                    continue;

                if (!MatchesSessionConditions(template.Trigger, ctx))
                    continue;

                var expandedText = NarrativeText.ExpandTemplate(template.Text, model, session);
                results.Add(new ExpandedTemplate
                {
                    TemplateId = template.Id,
                    ExpandedText = expandedText,
                    InsertContext = template.InsertContext
                });
            }

            return results;
        }

        public static Dictionary<string, int> RecordTemplateUsage(Dictionary<string, int> state, string templateId)
        {
            var copy = new Dictionary<string, int>(state, StringComparer.OrdinalIgnoreCase);
            copy[templateId] = (copy.TryGetValue(templateId, out var c) ? c : 0) + 1;
            return copy;
        }

        private static bool MatchesEventTrigger(TemplateTrigger trigger, Session session)
        {
            if (trigger.EventMatch == null) return true;
            var checks = trigger.EventMatch.PropertyChecks;
            if (checks == null || checks.Count == 0) return false;

            foreach (var entity in session.Events.Values)
            {
                if (checks.All(c => CheckProperty(entity, c)))
                    return true;
            }
            return false;
        }

        private static bool CheckProperty(Entity entity, PropertyCheck check)
        {
            if (entity.Properties == null || !entity.Properties.TryGetValue(check.Key, out var prop))
                return false;
            var actual = prop.DefaultValue;
            if (actual == null || check.Value == null) return false;

            var expected = check.Value;
            var an = ToNumeric(actual);
            if (an.HasValue && (expected.Type == JTokenType.Float || expected.Type == JTokenType.Integer))
            {
                var ev = expected.Value<double>();
                var ad = an.Value;
                return check.Op switch
                {
                    ">=" => ad >= ev,
                    "<=" => ad <= ev,
                    ">" => ad > ev,
                    "<" => ad < ev,
                    "==" => Math.Abs(ad - ev) < 1e-9,
                    "!=" => Math.Abs(ad - ev) >= 1e-9,
                    _ => false
                };
            }

            var sa = Convert.ToString(actual, CultureInfo.InvariantCulture) ?? string.Empty;
            var se = expected.Type == JTokenType.String ? expected.Value<string>() ?? string.Empty : expected.ToString();
            return check.Op switch
            {
                "==" => sa == se,
                "!=" => sa != se,
                _ => false
            };
        }

        private static double? ToNumeric(object? actual)
        {
            if (actual == null) return null;
            if (actual is double d && !double.IsNaN(d) && !double.IsInfinity(d)) return d;
            if (actual is float f) return f;
            if (actual is int i) return i;
            if (actual is long l) return l;
            if (double.TryParse(Convert.ToString(actual, CultureInfo.InvariantCulture), NumberStyles.Float, CultureInfo.InvariantCulture, out var x))
                return x;
            return null;
        }

        private static bool MatchesSessionConditions(TemplateTrigger trigger, EvaluationContext ctx)
        {
            if (trigger.SessionConditions == null || trigger.SessionConditions.Count == 0)
                return true;
            var reg = InferenceRegistry.Instance;
            return trigger.SessionConditions.All(c => reg.EvaluateCondition(c, ctx));
        }
    }
}
