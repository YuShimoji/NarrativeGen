using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    /// <summary>
    /// SP-TGEN / SP-TEXT: engine-ts の <c>expandTemplate</c> / <c>expandTemplateWithTracking</c> に相当。
    /// </summary>
    public static class NarrativeText
    {
        private static readonly Regex s_NodeId = new(@"\{nodeId\}", RegexOptions.Compiled);
        private static readonly Regex s_Time = new(@"\{time\}", RegexOptions.Compiled);
        private static readonly Regex s_Conditional = new(@"\{\?(!?)([^:}]+):([^}]*)\}", RegexOptions.Compiled);
        private static readonly Regex s_BracketRef = new(@"\[([^\]]+)\]", RegexOptions.Compiled);
        private static readonly Regex s_CurlyRef = new(@"\{([^?}][^}]*)\}", RegexOptions.Compiled);
        private static readonly Regex s_ComparisonCond = new(@"^(\w+)(>=|<=|>|<|==|!=)(.+)$", RegexOptions.Compiled);
        private static readonly Regex s_EntityTilde = new(@"\[(\w+)~\]", RegexOptions.Compiled);

        /// <summary>
        /// 段階0: レガシー <c>{flag:…}</c> / <c>{resource:…}</c> / <c>{variable:…}</c> / <c>{nodeId}</c> / <c>{time}</c>。
        /// </summary>
        public static string ApplyLegacyPlaceholders(string text, Session session)
        {
            if (string.IsNullOrEmpty(text)) return text;
            var resolved = text;
            foreach (var kv in session.Flags)
            {
                var pattern = "{flag:" + Regex.Escape(kv.Key) + "}";
                resolved = resolved.Replace(pattern, kv.Value ? "true" : "false");
            }

            foreach (var kv in session.Resources)
            {
                var pattern = "{resource:" + Regex.Escape(kv.Key) + "}";
                resolved = resolved.Replace(pattern, kv.Value.ToString(CultureInfo.InvariantCulture));
            }

            foreach (var kv in session.Variables)
            {
                var pattern = "{variable:" + Regex.Escape(kv.Key) + "}";
                resolved = resolved.Replace(pattern, Convert.ToString(kv.Value, CultureInfo.InvariantCulture) ?? string.Empty);
            }

            resolved = s_NodeId.Replace(resolved, session.CurrentNodeId);
            resolved = s_Time.Replace(resolved, session.Time.ToString(CultureInfo.InvariantCulture));
            return resolved;
        }

        /// <summary>
        /// 段階1以降（段階0なし）。TS の <c>expandTemplateCore</c> に相当。
        /// </summary>
        public static string ExpandTemplateCore(string text, NarrativeModel model, Session session)
        {
            if (string.IsNullOrEmpty(text)) return text;
            var result = s_Conditional.Replace(text, m =>
            {
                var negate = m.Groups[1].Value == "!";
                var cond = m.Groups[2].Value;
                var body = m.Groups[3].Value;
                var condResult = EvaluateCondition(cond, session);
                if (negate) condResult = !condResult;
                return condResult ? body : string.Empty;
            });
            result = s_BracketRef.Replace(result, m => ResolveBracket(m.Groups[1].Value, model, session));
            result = s_CurlyRef.Replace(result, m => ResolveCurly(m.Groups[1].Value, session));
            return result;
        }

        /// <summary>
        /// 段階0 + コア。TS の <c>expandTemplate</c> に相当。
        /// </summary>
        public static string ExpandTemplate(string text, NarrativeModel model, Session session)
        {
            if (string.IsNullOrEmpty(text)) return text;
            return ExpandTemplateCore(ApplyLegacyPlaceholders(text, session), model, session);
        }

        /// <summary>
        /// <c>[entity~]</c> 描写追跡付き展開。TS の <c>expandTemplateWithTracking</c> に相当。
        /// </summary>
        public static ExpandWithTrackingResult ExpandTemplateWithTracking(
            string text,
            NarrativeModel model,
            Session session,
            IReadOnlyDictionary<string, HashSet<string>>? descriptionState = null,
            int seed = 0)
        {
            if (string.IsNullOrEmpty(text))
            {
                return new ExpandWithTrackingResult
                {
                    Text = text,
                    DescriptionState = CloneDescriptionState(descriptionState)
                };
            }

            var state = CloneDescriptionState(descriptionState);
            var afterLegacy = ApplyLegacyPlaceholders(text, session);
            var seedCounter = seed;

            var processed = s_EntityTilde.Replace(afterLegacy, m =>
            {
                var entityId = m.Groups[1].Value;
                var entity = ResolveEntity(entityId, model, session);
                if (entity == null) return "[" + entityId + "~]";

                Dictionary<string, PropertyDef> allProps;
                if (model.Entities != null && model.Entities.ContainsKey(entityId))
                    allProps = GetEntityPropertiesMerged(entityId, model.Entities);
                else
                {
                    allProps = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase);
                    if (entity.Properties != null)
                    {
                        foreach (var kv in entity.Properties)
                            allProps[kv.Key] = kv.Value;
                    }
                }

                var allKeys = allProps.Keys.ToList();
                if (allKeys.Count == 0) return entity.Name;

                var candidateKeys = GetUndescribedKeys(state, entityId, allKeys);
                if (candidateKeys.Count == 0) candidateKeys = allKeys;

                var selectedKey = candidateKeys[Math.Abs(seedCounter) % candidateKeys.Count];
                seedCounter++;
                MarkDescribed(state, entityId, selectedKey);
                var prop = allProps[selectedKey];
                var value = prop?.DefaultValue != null ? Convert.ToString(prop.DefaultValue, CultureInfo.InvariantCulture) ?? "unknown" : "unknown";
                return selectedKey + ": " + value;
            });

            var expanded = ExpandTemplateCore(processed, model, session);
            return new ExpandWithTrackingResult { Text = expanded, DescriptionState = state };
        }


        /// <summary>
        /// 描写追跡の出力（エンティティID → 既に描写したプロパティキー）。
        /// </summary>
        public sealed class ExpandWithTrackingResult
        {
            public string Text { get; set; } = string.Empty;
            public Dictionary<string, HashSet<string>> DescriptionState { get; set; } =
                new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
        }

        private static Dictionary<string, HashSet<string>> CloneDescriptionState(IReadOnlyDictionary<string, HashSet<string>>? src)
        {
            var d = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            if (src == null) return d;
            foreach (var kv in src)
                d[kv.Key] = new HashSet<string>(kv.Value, StringComparer.OrdinalIgnoreCase);
            return d;
        }

        private static void MarkDescribed(Dictionary<string, HashSet<string>> state, string entityId, string key)
        {
            if (!state.TryGetValue(entityId, out var set))
            {
                set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                state[entityId] = set;
            }
            set.Add(key);
        }

        private static List<string> GetUndescribedKeys(Dictionary<string, HashSet<string>> state, string entityId, List<string> allKeys)
        {
            if (!state.TryGetValue(entityId, out var described))
                return allKeys;
            return allKeys.Where(k => !described.Contains(k)).ToList();
        }

        internal static Entity? ResolveEntity(string entityId, NarrativeModel model, Session session)
        {
            if (model.Entities != null && model.Entities.TryGetValue(entityId, out var e))
                return e;
            if (session.Events.TryGetValue(entityId, out var ev))
                return ev;
            return null;
        }

        internal static Dictionary<string, PropertyDef> GetEntityPropertiesMerged(string entityId, Dictionary<string, Entity> entities)
        {
            var chain = new List<string>();
            var cur = entityId;
            var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            while (!string.IsNullOrEmpty(cur) && entities.TryGetValue(cur, out var ent) && visited.Add(cur))
            {
                chain.Add(cur);
                cur = ent.ParentEntity ?? string.Empty;
            }

            var merged = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase);
            for (var i = chain.Count - 1; i >= 0; i--)
            {
                var e = entities[chain[i]];
                if (e.Properties == null) continue;
                foreach (var kv in e.Properties)
                    merged[kv.Key] = kv.Value;
            }
            return merged;
        }

        private static bool EvaluateCondition(string cond, Session session)
        {
            var cmp = s_ComparisonCond.Match(cond);
            if (cmp.Success)
            {
                var key = cmp.Groups[1].Value;
                var op = cmp.Groups[2].Value;
                if (!double.TryParse(cmp.Groups[3].Value.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var val))
                    return false;
                double? actual = null;
                if (session.Resources.TryGetValue(key, out var r))
                    actual = r;
                else if (session.Variables.TryGetValue(key, out var vobj))
                    actual = ToFiniteDouble(vobj);
                if (actual == null || !IsFinite(actual.Value))
                    return false;
                var a = actual.Value;
                return op switch
                {
                    ">=" => a >= val,
                    "<=" => a <= val,
                    ">" => a > val,
                    "<" => a < val,
                    "==" => Math.Abs(a - val) < 1e-9,
                    "!=" => Math.Abs(a - val) >= 1e-9,
                    _ => false
                };
            }

            if (session.Flags.TryGetValue(cond, out var f))
                return f;
            if (session.Variables.ContainsKey(cond))
                return Truthy(session.Variables[cond]);
            return session.Inventory.Any(id => string.Equals(id, cond, StringComparison.OrdinalIgnoreCase));
        }

        private static bool IsFinite(double d) => !double.IsNaN(d) && !double.IsInfinity(d);

        private static double? ToFiniteDouble(object? v)
        {
            if (v == null) return null;
            if (v is double d) return IsFinite(d) ? d : null;
            if (v is float f) return IsFinite(f) ? f : null;
            if (v is int i) return i;
            if (v is long l) return l;
            if (double.TryParse(Convert.ToString(v, CultureInfo.InvariantCulture), NumberStyles.Float, CultureInfo.InvariantCulture, out var x))
                return IsFinite(x) ? x : null;
            return null;
        }

        private static bool Truthy(object? v)
        {
            if (v == null) return false;
            if (v is bool b) return b;
            if (v is string s) return s.Length > 0;
            if (v is double d) return Math.Abs(d) > 1e-9;
            if (v is int i) return i != 0;
            return true;
        }

        private static string ResolveBracket(string reference, NarrativeModel model, Session session)
        {
            var dotIndex = reference.IndexOf('.');
            if (dotIndex < 0)
            {
                var ent = ResolveEntity(reference, model, session);
                return ent != null ? ent.Name : "[" + reference + "]";
            }

            var entityId = reference.Substring(0, dotIndex);
            var propKey = reference.Substring(dotIndex + 1);
            var entity = ResolveEntity(entityId, model, session);
            if (entity == null) return "[" + reference + "]";

            switch (propKey)
            {
                case "name": return entity.Name;
                case "description": return string.IsNullOrEmpty(entity.Description) ? "[" + reference + "]" : entity.Description;
                case "cost": return entity.Cost.ToString(CultureInfo.InvariantCulture);
                case "id": return entity.Id;
            }

            if (model.Entities != null && model.Entities.TryGetValue(entityId, out _))
            {
                var merged = GetEntityPropertiesMerged(entityId, model.Entities);
                if (merged.TryGetValue(propKey, out var pdef) && pdef.DefaultValue != null)
                    return Convert.ToString(pdef.DefaultValue, CultureInfo.InvariantCulture) ?? "[" + reference + "]";
            }

            if (entity.Properties != null && entity.Properties.TryGetValue(propKey, out var ep) && ep.DefaultValue != null)
                return Convert.ToString(ep.DefaultValue, CultureInfo.InvariantCulture) ?? "[" + reference + "]";

            return "[" + reference + "]";
        }

        private static string ResolveCurly(string key, Session session)
        {
            if (session.Variables.TryGetValue(key, out var v))
                return Convert.ToString(v, CultureInfo.InvariantCulture) ?? string.Empty;
            if (session.Flags.TryGetValue(key, out var f))
                return f ? "true" : "false";
            if (session.Resources.TryGetValue(key, out var r))
                return r.ToString(CultureInfo.InvariantCulture);
            return "{" + key + "}";
        }
    }
}
