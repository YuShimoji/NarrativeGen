using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using NarrativeGen.Runtime;

namespace NarrativeGen
{
    // Screen frame (SP-SCREEN-001, docs/specs/screen-frame.md): what the player sees
    // after each step, independent of the renderer. The TypeScript reference is
    // packages/engine-ts/src/screen-frame.ts; field names and rules must stay equal.

    public sealed class ScreenSpan
    {
        [JsonProperty("text")] public string Text { get; set; } = string.Empty;
        /// <summary>Set when the word is a topic that can be chosen from the prose.</summary>
        [JsonProperty("choiceId", NullValueHandling = NullValueHandling.Ignore)] public string? ChoiceId { get; set; }
    }

    public sealed class ScreenChoice
    {
        [JsonProperty("id")] public string Id { get; set; } = string.Empty;
        [JsonProperty("text")] public string Text { get; set; } = string.Empty;
        /// <summary>The choice leads to a node already on this route.</summary>
        [JsonProperty("visited")] public bool Visited { get; set; }
    }

    public sealed class ScreenChoiceGroup
    {
        /// <summary><c>choice</c>, <c>topic</c> or <c>travel</c>.</summary>
        [JsonProperty("role")] public string Role { get; set; } = ScreenFrame.RoleChoice;
        [JsonProperty("label")] public string Label { get; set; } = string.Empty;
        [JsonProperty("choices")] public List<ScreenChoice> Choices { get; set; } = new();
    }

    public sealed class ScreenNote
    {
        [JsonProperty("source")] public string Source { get; set; } = string.Empty;
        [JsonProperty("text")] public string Text { get; set; } = string.Empty;
    }

    public sealed class ScreenHeader
    {
        [JsonProperty("region")] public string Region { get; set; } = string.Empty;
        [JsonProperty("title")] public string Title { get; set; } = string.Empty;
        [JsonProperty("goal")] public string Goal { get; set; } = string.Empty;
    }

    public sealed class ScreenFrame
    {
        public const string Format = "narrativegen-screen-frame";
        public const int CurrentVersion = 1;
        public const string LayoutStandard = "standard";
        public const string LayoutInquiry = "inquiry";
        public const string RoleChoice = "choice";
        public const string RoleTopic = "topic";
        public const string RoleTravel = "travel";

        [JsonProperty("format")] public string FormatId { get; set; } = Format;
        [JsonProperty("version")] public int Version { get; set; } = CurrentVersion;
        [JsonProperty("layout")] public string Layout { get; set; } = LayoutStandard;
        /// <summary>0 for the opening scene.</summary>
        [JsonProperty("step")] public int Step { get; set; }
        [JsonProperty("nodeId")] public string NodeId { get; set; } = string.Empty;
        [JsonProperty("choiceId")] public string? ChoiceId { get; set; }
        [JsonProperty("choiceText")] public string? ChoiceText { get; set; }
        [JsonProperty("header")] public ScreenHeader? Header { get; set; }
        [JsonProperty("place")] public string Place { get; set; } = string.Empty;
        [JsonProperty("speaker")] public string Speaker { get; set; } = string.Empty;
        [JsonProperty("paragraphs")] public List<List<ScreenSpan>> Paragraphs { get; set; } = new();
        [JsonProperty("choiceGroups")] public List<ScreenChoiceGroup> ChoiceGroups { get; set; } = new();
        /// <summary>Notes written by events on the route so far, oldest first.</summary>
        [JsonProperty("notes")] public List<ScreenNote> Notes { get; set; } = new();
        [JsonProperty("newNote")] public bool NewNote { get; set; }
        [JsonProperty("ending")] public bool Ending { get; set; }

        /// <summary>Choices in display order across all groups.</summary>
        [JsonIgnore] public IEnumerable<ScreenChoice> AllChoices => ChoiceGroups.SelectMany(g => g.Choices);

        /// <summary>Paragraph text without topic links.</summary>
        [JsonIgnore] public IEnumerable<string> ParagraphTexts => Paragraphs.Select(p => string.Concat(p.Select(s => s.Text)));

        public string ToJson(Formatting formatting = Formatting.None) => JsonConvert.SerializeObject(this, formatting);
    }

    /// <summary>
    /// Plays a model and produces one <see cref="ScreenFrame"/> per step, with the
    /// same rules as the TypeScript <c>buildScreenFrame</c>.
    /// </summary>
    public sealed class ScreenFrameBuilder
    {
        private const string TravelPrefix = "go_";
        private static readonly Regex s_ProbabilitySuffix = new(@"\s*〔蓋然 [0-9.]+%〕$");
        private static readonly Regex s_ParagraphBreak = new(@"\n\s*\n");

        private readonly NarrativeModel m_Model;
        private readonly string m_Layout;
        private readonly HashSet<string> m_Visited = new();
        private readonly List<ScreenNote> m_Notes = new();
        private IReadOnlyDictionary<string, HashSet<string>>? m_Descriptions;
        private IReadOnlyDictionary<string, int>? m_TemplateUsage;
        private int m_Step;

        public Session Session { get; private set; }
        public ScreenFrame Current { get; private set; }
        public string Layout => m_Layout;

        /// <param name="layout">Force <c>standard</c> or <c>inquiry</c>. Default: inquiry when variables.表示形式 is 聞き込み.</param>
        public ScreenFrameBuilder(NarrativeModel model, string? layout = null)
        {
            m_Model = model ?? throw new ArgumentNullException(nameof(model));
            m_Layout = layout ?? DefaultLayout(model);
            Session = Engine.StartSession(model);
            Current = BuildFrame(null, null, new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase));
        }

        public static string DefaultLayout(NarrativeModel model) =>
            model.InitialVariables != null && model.InitialVariables.TryGetValue("表示形式", out var v) && Text(v) == "聞き込み"
                ? ScreenFrame.LayoutInquiry
                : ScreenFrame.LayoutStandard;

        /// <summary>Remove the generator's probability label from a choice text.</summary>
        public static string ChoiceText(string? text) => s_ProbabilitySuffix.Replace(text ?? string.Empty, string.Empty);

        /// <summary><c>場所｜名前</c> → place and name. A label without <c>｜</c> is a name only.</summary>
        public static (string Place, string Name) SplitSpeaker(string? label)
        {
            var parts = (label ?? string.Empty).Split('｜');
            return parts.Length > 1 && parts[1].Length > 0 ? (parts[0], parts[1]) : (string.Empty, parts[0]);
        }

        /// <summary>Apply a choice shown in the current frame and return the next frame.</summary>
        public ScreenFrame Choose(string choiceId)
        {
            if (Current.Ending) throw new InvalidOperationException("The story has ended.");
            if (!Current.AllChoices.Any(c => c.Id == choiceId))
                throw new ArgumentException($"Choice '{choiceId}' is not on the current screen.", nameof(choiceId));
            var fromNodeId = Session.CurrentNodeId;
            var before = Session.Events;
            Session = Engine.ApplyChoice(Session, m_Model, choiceId);
            Current = BuildFrame(choiceId, fromNodeId, before);
            return Current;
        }

        private ScreenFrame BuildFrame(string? choiceId, string? fromNodeId, IReadOnlyDictionary<string, Entity> eventsBefore)
        {
            var node = m_Model.Nodes[Session.CurrentNodeId];
            m_Visited.Add(node.Id);
            var display = NarrativeDisplayText.ResolveNarrativeDisplayTextTracked(
                node.Text ?? string.Empty, m_Model, Session, new ResolveNarrativeDisplayTextTrackedOptions
                {
                    AppendConversationTemplates = true,
                    DescriptionSeed = (int)Session.Time,
                    DescriptionState = m_Descriptions,
                    TemplateUsageState = m_TemplateUsage,
                });
            m_Descriptions = display.DescriptionState;
            m_TemplateUsage = display.TemplateUsageState;

            var newNotes = DiffNotes(eventsBefore, fromNodeId);
            m_Notes.AddRange(newNotes);

            var available = Engine.GetAvailableChoices(Session, m_Model)
                .Select(c => new ScreenChoice { Id = c.Id, Text = ChoiceText(c.Text), Visited = c.Target != null && m_Visited.Contains(c.Target) })
                .ToList();
            string? chosenText = null;
            if (choiceId != null && fromNodeId != null)
            {
                var chosen = m_Model.Nodes[fromNodeId].Choices?.FirstOrDefault(c => c.Id == choiceId);
                if (chosen != null) chosenText = ChoiceText(chosen.Text);
            }

            var frame = new ScreenFrame
            {
                Layout = m_Layout,
                Step = m_Step++,
                NodeId = node.Id,
                ChoiceId = choiceId,
                ChoiceText = chosenText,
                Notes = new List<ScreenNote>(m_Notes),
                NewNote = newNotes.Count > 0,
                Ending = node.Choices == null || node.Choices.Count == 0,
            };

            if (m_Layout == ScreenFrame.LayoutInquiry)
            {
                var (place, name) = SplitSpeaker(node.Speaker);
                var topics = available.Where(c => !c.Id.StartsWith(TravelPrefix, StringComparison.Ordinal)).ToList();
                var travel = available.Where(c => c.Id.StartsWith(TravelPrefix, StringComparison.Ordinal)).ToList();
                if (topics.Count > 0) frame.ChoiceGroups.Add(new ScreenChoiceGroup { Role = ScreenFrame.RoleTopic, Label = "話題", Choices = topics });
                if (travel.Count > 0) frame.ChoiceGroups.Add(new ScreenChoiceGroup { Role = ScreenFrame.RoleTravel, Label = "行き先", Choices = travel });
                frame.Header = new ScreenHeader { Region = Variable("地域"), Title = Variable("依頼名"), Goal = Variable("依頼") };
                frame.Place = place;
                frame.Speaker = name;
                frame.Paragraphs = Paragraphs(display.Text, topics);
            }
            else
            {
                frame.Speaker = node.Speaker ?? string.Empty;
                frame.Paragraphs = Paragraphs(display.Text, Array.Empty<ScreenChoice>());
                if (available.Count > 0) frame.ChoiceGroups.Add(new ScreenChoiceGroup { Role = ScreenFrame.RoleChoice, Label = "選択肢", Choices = available });
            }
            return frame;
        }

        /// <summary>Split prose into paragraphs and link topic words.</summary>
        public static List<List<ScreenSpan>> Paragraphs(string prose, IReadOnlyList<ScreenChoice> topics)
        {
            var byWord = new Dictionary<string, ScreenChoice>(StringComparer.Ordinal);
            var order = new List<string>();
            foreach (var topic in topics)
            {
                if (string.IsNullOrEmpty(topic.Text)) continue;
                if (!byWord.ContainsKey(topic.Text)) order.Add(topic.Text);
                byWord[topic.Text] = topic;
            }
            var words = order.OrderByDescending(w => w.Length).ToList();
            Regex? pattern = words.Count > 0 ? new Regex("(" + string.Join("|", words.Select(Regex.Escape)) + ")") : null;
            var result = new List<List<ScreenSpan>>();
            foreach (var paragraph in s_ParagraphBreak.Split(prose ?? string.Empty))
            {
                var spans = new List<ScreenSpan>();
                foreach (var part in pattern != null ? pattern.Split(paragraph) : new[] { paragraph })
                {
                    if (part.Length == 0) continue;
                    spans.Add(byWord.TryGetValue(part, out var topic)
                        ? new ScreenSpan { Text = part, ChoiceId = topic.Id }
                        : new ScreenSpan { Text = part });
                }
                result.Add(spans);
            }
            return result;
        }

        private List<ScreenNote> DiffNotes(IReadOnlyDictionary<string, Entity> before, string? fromNodeId)
        {
            var notes = new List<ScreenNote>();
            foreach (var pair in Session.Events)
            {
                if (before.TryGetValue(pair.Key, out var previous) && SameEvent(previous, pair.Value)) continue;
                notes.Add(new ScreenNote { Source = NoteSource(pair.Value, fromNodeId), Text = pair.Value.Name });
            }
            return notes;
        }

        private static bool SameEvent(Entity a, Entity b)
        {
            if (a.Name != b.Name) return false;
            var keys = new HashSet<string>(a.Properties?.Keys ?? Enumerable.Empty<string>());
            keys.UnionWith(b.Properties?.Keys ?? Enumerable.Empty<string>());
            return keys.All(k => Text(PropertyValue(a, k)) == Text(PropertyValue(b, k)) && (PropertyValue(a, k) == null) == (PropertyValue(b, k) == null));
        }

        private static object? PropertyValue(Entity entity, string key) =>
            entity.Properties != null && entity.Properties.TryGetValue(key, out var p) ? p?.DefaultValue : null;

        private string NoteSource(Entity ev, string? fromNodeId)
        {
            var actor = PropertyValue(ev, "asker") ?? PropertyValue(ev, "speaker") ?? PropertyValue(ev, "observer");
            if (actor != null && m_Model.Characters != null && m_Model.Characters.TryGetValue(Text(actor), out var character)
                && !string.IsNullOrEmpty(character.Name))
            {
                return character.Name;
            }
            var nodeId = string.IsNullOrEmpty(fromNodeId) ? Session.CurrentNodeId : fromNodeId!;
            return SplitSpeaker(m_Model.Nodes.TryGetValue(nodeId, out var node) ? node.Speaker : null).Name;
        }

        private string Variable(string key) => Session.Variables.TryGetValue(key, out var v) ? Text(v) : string.Empty;

        private static string Text(object? value) => value switch
        {
            null => string.Empty,
            bool b => b ? "true" : "false",
            double d => d.ToString("R", CultureInfo.InvariantCulture),
            float f => f.ToString("R", CultureInfo.InvariantCulture),
            IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString() ?? string.Empty,
        };
    }
}
