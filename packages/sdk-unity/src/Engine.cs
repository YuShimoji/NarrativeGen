using System;
using System.Collections.Generic;
using System.Text.Json;

namespace NarrativeGen
{
    public class SessionState
    {
        public string NodeId { get; set; } = string.Empty;
        public Dictionary<string, bool> Flags { get; set; } = new Dictionary<string, bool>();
        public Dictionary<string, int> Resources { get; set; } = new Dictionary<string, int>();
        public int Time { get; set; } = 0;
    }

    public class Choice
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
    }

    public class Model
    {
        public string ModelType { get; set; } = "adventure-playthrough";
        public string StartNode { get; set; } = string.Empty;
        public Dictionary<string, object> Nodes { get; set; } = new Dictionary<string, object>();
    }

    public static class Engine
    {
        public static Model LoadModel(JsonElement json)
        {
            // TODO: Add JSON Schema validation here.
            var model = JsonSerializer.Deserialize<Model>(json.GetRawText());
            if (model == null) throw new Exception("Invalid model");
            return model;
        }

        public static SessionState StartSession(Model model, SessionState? initial = null)
        {
            return new SessionState
            {
                NodeId = initial?.NodeId ?? model.StartNode,
                Flags = initial?.Flags ?? new Dictionary<string, bool>(),
                Resources = initial?.Resources ?? new Dictionary<string, int>(),
                Time = initial?.Time ?? 0
            };
        }

        public static List<Choice> GetAvailableChoices(SessionState session, Model model)
        {
            // TODO: Implement filtering by conditions.
            return new List<Choice>();
        }

        public static SessionState ApplyChoice(SessionState session, Model model, string choiceId)
        {
            // TODO: Apply effects and transition.
            session.Time += 1;
            return session;
        }

        public static string Serialize(SessionState session) => JsonSerializer.Serialize(session);
        public static SessionState Deserialize(string payload) => JsonSerializer.Deserialize<SessionState>(payload) ?? new SessionState();
    }
}
