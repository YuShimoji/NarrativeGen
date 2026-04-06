using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace NarrativeGen
{
    /// <summary>
    /// SP-TGEN / SP-TEXT 縦スライス: engine-ts <c>expandTemplate</c> 相当（段階0 + コア）。
    /// C# の <see cref="Entity"/> に TS の PropertyDef 継承が無いため、<c>[entity.prop]</c> の追加プロパティは未解決のまま残す。
    /// </summary>
    public static class NarrativeText
    {
        private static readonly Regex s_NodeId = new(@"\{nodeId\}", RegexOptions.Compiled);
        private static readonly Regex s_Time = new(@"\{time\}", RegexOptions.Compiled);
        private static readonly Regex s_Conditional = new(@"\{\?(!?)([^:}]+):([^}]*)\}", RegexOptions.Compiled);
        private static readonly Regex s_BracketRef = new(@"\[([^\]]+)\]", RegexOptions.Compiled);
        private static readonly Regex s_CurlyRef = new(@"\{([^?}][^}]*)\}", RegexOptions.Compiled);
        private static readonly Regex s_ComparisonCond = new(@"^(\w+)(>=|<=|>|<|==|!=)(.+)$", RegexOptions.Compiled);

        /// <summary>
        /// 段階0: レガシー <c>{flag:…}</c> / <c>{resource:…}</c> / <c>{variable:…}</c> / <c>{nodeId}</c> / <c>{time}</c>。
        /// </summary>
        public static string ApplyLegacyPlaceholders(string text, Runtime.Session session)
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
        public static string ExpandTemplateCore(string text, NarrativeModel model, Runtime.Session session)
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
            result = s_BracketRef.Replace(result, m => ResolveBracket(m.Groups[1].Value, model));
            result = s_CurlyRef.Replace(result, m => ResolveCurly(m.Groups[1].Value, session));
            return result;
        }

        /// <summary>
        /// 段階0 + コア。TS の <c>expandTemplate</c> に相当。
        /// </summary>
        public static string ExpandTemplate(string text, NarrativeModel model, Runtime.Session session)
        {
            if (string.IsNullOrEmpty(text)) return text;
            return ExpandTemplateCore(ApplyLegacyPlaceholders(text, session), model, session);
        }

        private static bool EvaluateCondition(string cond, Runtime.Session session)
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

        private static string ResolveBracket(string reference, NarrativeModel model)
        {
            var entities = model.Entities;
            var dot = reference.IndexOf('.');
            if (dot < 0)
            {
                if (entities != null && entities.TryGetValue(reference, out var e))
                    return e.Name;
                return "[" + reference + "]";
            }

            var entityId = reference.Substring(0, dot);
            var propKey = reference.Substring(dot + 1);
            if (entities == null || !entities.TryGetValue(entityId, out var entity))
                return "[" + reference + "]";

            switch (propKey)
            {
                case "name": return entity.Name;
                case "description": return string.IsNullOrEmpty(entity.Description) ? "[" + reference + "]" : entity.Description;
                case "cost": return entity.Cost.ToString(CultureInfo.InvariantCulture);
                case "id": return entity.Id;
                default: return "[" + reference + "]";
            }
        }

        private static string ResolveCurly(string key, Runtime.Session session)
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
