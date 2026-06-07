using System.Collections.Generic;
using Newtonsoft.Json;
using NUnit.Framework;
using NarrativeGen;
using NarrativeGen.Runtime;
using NarrativeGen.Serialization;

namespace NarrativeGen.Tests
{
    /// <summary>
    /// hasEvent / createEvent の InferenceRegistry・Engine 経路（engine-ts パリティ）。
    /// </summary>
    [TestFixture]
    public class HasEventInferenceTests
    {
        [Test]
        public void HasEventEvaluator_MatchesSessionEvents()
        {
            Engine.LoadModel("{\"modelType\":\"adventure-playthrough\",\"startNode\":\"a\",\"nodes\":{\"a\":{\"id\":\"a\",\"text\":\"x\",\"choices\":[]}}}");
            var events = new Dictionary<string, Entity>(System.StringComparer.OrdinalIgnoreCase)
            {
                ["evt1"] = new Entity { Id = "evt1", Name = "E" },
            };
            var session = new Session("a", events: events);
            var ctx = EvaluationContext.FromSession(session);
            var yes = new HasEventCondition { Type = "hasEvent", Key = "evt1", Value = true };
            var no = new HasEventCondition { Type = "hasEvent", Key = "missing", Value = true };
            Assert.IsTrue(InferenceRegistry.Instance.EvaluateCondition(yes, ctx));
            Assert.IsFalse(InferenceRegistry.Instance.EvaluateCondition(no, ctx));
        }

        [Test]
        public void Builtins_IncludeCreateEventEffect()
        {
            Engine.LoadModel("{\"modelType\":\"adventure-playthrough\",\"startNode\":\"a\",\"nodes\":{\"a\":{\"id\":\"a\",\"text\":\"x\",\"choices\":[]}}}");

            Assert.That(InferenceRegistry.Instance.GetSupportedEffects(), Does.Contain("createEvent"));
        }

        [Test]
        public void CreateEventApplicator_MergesIntoSessionEvents()
        {
            Engine.LoadModel("{\"modelType\":\"adventure-playthrough\",\"startNode\":\"a\",\"nodes\":{\"a\":{\"id\":\"a\",\"text\":\"x\",\"choices\":[]}}}");
            var session = new Session("a");
            var eff = new CreateEventEffect
            {
                Type = "createEvent",
                Id = "dyn1",
                Name = "Dynamic",
                Properties = new Dictionary<string, CreateEventPropertyInput>(System.StringComparer.OrdinalIgnoreCase)
                {
                    ["severity"] = new CreateEventPropertyInput { DefaultValue = 42L },
                },
            };
            var next = InferenceRegistry.Instance.ApplyEffect(eff, session);
            Assert.That(next.Events.ContainsKey("dyn1"));
            Assert.AreEqual("Dynamic", next.Events["dyn1"].Name);
            Assert.That(next.Events["dyn1"].Properties!["severity"].Type, Is.EqualTo("number"));
            Assert.That(next.Events["dyn1"].Properties["severity"].DefaultValue, Is.EqualTo(42L));
        }

        [Test]
        public void Engine_ApplyChoice_CreateEvent_Then_HasEventChoiceAvailable()
        {
            const string json = """
{
  "modelType": "adventure-playthrough",
  "startNode": "hub",
  "nodes": {
    "hub": {
      "id": "hub",
      "text": "hub",
      "choices": [
        {
          "id": "spawn",
          "text": "Spawn event",
          "target": "hub",
          "effects": [{ "type": "createEvent", "id": "e1", "name": "One" }]
        },
        {
          "id": "after",
          "text": "Only if event",
          "target": "next",
          "conditions": [{ "type": "hasEvent", "key": "e1", "value": true }]
        }
      ]
    },
    "next": { "id": "next", "text": "done", "choices": [] }
  }
}
""";
            var model = Engine.LoadModel(json);
            var session = Engine.StartSession(model);

            var first = Engine.GetAvailableChoices(session, model);
            Assert.That(first, Has.Count.EqualTo(1));
            Assert.AreEqual("spawn", first[0].Id);

            session = Engine.ApplyChoice(session, model, "spawn");
            var second = Engine.GetAvailableChoices(session, model);
            Assert.That(second, Has.Count.EqualTo(2));
        }

        [Test]
        public void LoadModel_DeserializesCreateEventEffect()
        {
            const string json = """
{
  "modelType": "adventure-playthrough",
  "startNode": "a",
  "nodes": {
    "a": {
      "id": "a",
      "text": "x",
      "choices": [
        {
          "id": "c1",
          "text": "go",
          "target": "a",
          "effects": [
            {
              "type": "createEvent",
              "id": "x",
              "name": "X",
              "properties": { "n": { "defaultValue": 1 } }
            }
          ]
        }
      ]
    }
  }
}
""";
            var model = JsonConvert.DeserializeObject<NarrativeModel>(json, JsonSettings.Create());
            Assert.NotNull(model);
            Assert.NotNull(model!.Nodes);
            var eff = model.Nodes["a"].Choices![0].Effects![0] as CreateEventEffect;
            Assert.NotNull(eff);
            Assert.AreEqual("x", eff!.Id);
            Assert.That(eff.Properties!["n"].DefaultValue is long or int);
        }
    }
}
