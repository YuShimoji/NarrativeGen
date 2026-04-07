using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    /// <summary>
    /// engine-ts の <c>resolveNarrativeDisplayTextTracked</c> に相当（段階0〜3 + 会話テンプレ連結）。
    /// </summary>
    public sealed class ResolveNarrativeDisplayTextTrackedOptions
    {
        public IReadOnlyDictionary<string, HashSet<string>>? DescriptionState { get; set; }
        public int DescriptionSeed { get; set; }
        public bool AppendConversationTemplates { get; set; } = true;
    }

    public sealed class ResolveNarrativeDisplayTextTrackedResult
    {
        public string Text { get; set; } = string.Empty;
        public Dictionary<string, HashSet<string>> DescriptionState { get; set; } =
            new(StringComparer.OrdinalIgnoreCase);
    }

    public static class NarrativeDisplayText
    {
        public static ResolveNarrativeDisplayTextTrackedResult ResolveNarrativeDisplayTextTracked(
            string? rawText,
            NarrativeModel model,
            Session session,
            ResolveNarrativeDisplayTextTrackedOptions? options = null)
        {
            var emptyState = CloneDescriptionState(options?.DescriptionState);
            if (string.IsNullOrEmpty(rawText))
            {
                return new ResolveNarrativeDisplayTextTrackedResult
                {
                    Text = rawText ?? string.Empty,
                    DescriptionState = emptyState
                };
            }

            var appendTemplates = options?.AppendConversationTemplates ?? true;
            var descIn = options?.DescriptionState;
            var seed = options?.DescriptionSeed ?? 0;

            string resolved;
            Dictionary<string, HashSet<string>> descriptionState;

            var body = rawText ?? string.Empty;
            var hasEntities = model.Entities != null && model.Entities.Count > 0;
            if (hasEntities || session.Events.Count > 0)
            {
                var tracked = NarrativeText.ExpandTemplateWithTracking(body, model, session, descIn, seed);
                resolved = tracked.Text;
                descriptionState = tracked.DescriptionState;
            }
            else
            {
                resolved = NarrativeText.ApplyLegacyPlaceholders(body, session);
                descriptionState = CloneDescriptionState(descIn);
            }

            if (appendTemplates &&
                model.ConversationTemplates is { Count: > 0 } templates &&
                session.Events.Count > 0)
            {
                var matches = ConversationTemplateMatcher.FindMatchingTemplates(templates, session, model);
                if (matches.Count > 0)
                {
                    var insertions = string.Join(" ", matches.Select(m => m.ExpandedText));
                    resolved = string.IsNullOrEmpty(resolved) ? insertions : resolved + " " + insertions;
                }
            }

            return new ResolveNarrativeDisplayTextTrackedResult
            {
                Text = resolved,
                DescriptionState = descriptionState
            };
        }

        private static Dictionary<string, HashSet<string>> CloneDescriptionState(
            IReadOnlyDictionary<string, HashSet<string>>? src)
        {
            var d = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            if (src == null) return d;
            foreach (var kv in src)
                d[kv.Key] = new HashSet<string>(kv.Value, StringComparer.OrdinalIgnoreCase);
            return d;
        }
    }
}
