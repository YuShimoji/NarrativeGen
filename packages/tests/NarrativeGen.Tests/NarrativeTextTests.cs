using System;
using System.Collections.Generic;
using NUnit.Framework;
using NarrativeGen;
using NgSession = NarrativeGen.Runtime.Session;

namespace NarrativeGen.Tests
{
    [TestFixture]
    public class NarrativeTextTests
    {
        private static NarrativeModel MinimalModel()
        {
            return new NarrativeModel
            {
                StartNode = "n1",
                Nodes = new Dictionary<string, Node>
                {
                    ["n1"] = new Node { Id = "n1", Text = "hi" }
                },
                Entities = new Dictionary<string, Entity>
                {
                    ["apple"] = new Entity { Id = "apple", Name = "Apple", Description = "Red", Cost = 3 }
                }
            };
        }

        /// <summary>
        /// TS 対応: <c>template.spec</c> の段階0 + entity + curly の縮約。
        /// </summary>
        [Test]
        public void ExpandTemplate_Legacy_NodeId_Time_Entity_And_Curly()
        {
            var model = MinimalModel();
            var session = new NgSession(
                "room_b",
                new Dictionary<string, bool> { ["lit"] = true },
                new Dictionary<string, double> { ["gold"] = 10 },
                new Dictionary<string, object> { ["mood"] = "calm" },
                new List<string>(),
                7);

            var raw = "{flag:lit} at {nodeId} t={time} [apple] g={gold} {mood}";
            var expanded = NarrativeText.ExpandTemplate(raw, model, session);
            Assert.AreEqual("true at room_b t=7 Apple g=10 calm", expanded);
        }

        /// <summary>
        /// TS 対応: <c>expandTemplate</c> の <c>{?condition:text}</c>（単純フラグ）。
        /// </summary>
        [Test]
        public void ExpandTemplate_Conditional_Flag_ShowsBody()
        {
            var model = MinimalModel();
            var session = new NgSession(
                "n1",
                new Dictionary<string, bool> { ["x"] = true },
                new Dictionary<string, double>(),
                new Dictionary<string, object>(),
                new List<string>(),
                0);

            Assert.AreEqual("YES", NarrativeText.ExpandTemplate("{?x:YES}", model, session));
            Assert.AreEqual(string.Empty, NarrativeText.ExpandTemplate("{?!x:YES}", model, session));
        }

        [Test]
        public void ExpandTemplate_EventEntity_Bracket_ResolvesName()
        {
            var model = MinimalModel();
            var ev = new Entity { Id = "evt1", Name = "Strange Light", Description = "glow" };
            var session = new NgSession(
                "n1",
                new Dictionary<string, bool>(),
                new Dictionary<string, double>(),
                new Dictionary<string, object>(),
                new List<string>(),
                0,
                new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase) { ["evt1"] = ev });

            Assert.AreEqual("Strange Light here", NarrativeText.ExpandTemplate("[evt1] here", model, session));
        }

        [Test]
        public void ExpandTemplate_InheritedProperty_CheeseburgerWeight()
        {
            var model = new NarrativeModel
            {
                StartNode = "n1",
                Nodes = new Dictionary<string, Node> { ["n1"] = new Node { Id = "n1", Text = "x" } },
                Entities = new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase)
                {
                    ["physical_object"] = new Entity
                    {
                        Id = "physical_object",
                        Name = "Physical Object",
                        Properties = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["weight"] = new PropertyDef { DefaultValue = 0L }
                        }
                    },
                    ["food"] = new Entity
                    {
                        Id = "food",
                        Name = "Food",
                        ParentEntity = "physical_object",
                        Properties = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["calories"] = new PropertyDef { DefaultValue = 0L }
                        }
                    },
                    ["cheeseburger"] = new Entity
                    {
                        Id = "cheeseburger",
                        Name = "Cheeseburger",
                        ParentEntity = "food",
                        Properties = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["weight"] = new PropertyDef { DefaultValue = 500L },
                            ["calories"] = new PropertyDef { DefaultValue = 350L }
                        }
                    }
                }
            };
            var session = new NgSession("n1", null, null, null, null, 0);
            var t = NarrativeText.ExpandTemplate("[cheeseburger.weight]g", model, session);
            Assert.AreEqual("500g", t);
        }

        [Test]
        public void ExpandTemplateWithTracking_Tilde_MarksDescriptionState()
        {
            var model = new NarrativeModel
            {
                StartNode = "n1",
                Nodes = new Dictionary<string, Node> { ["n1"] = new Node { Id = "n1", Text = "x" } },
                Entities = new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase)
                {
                    ["obj"] = new Entity
                    {
                        Id = "obj",
                        Name = "Object",
                        Properties = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["a"] = new PropertyDef { DefaultValue = "1" },
                            ["b"] = new PropertyDef { DefaultValue = "2" }
                        }
                    }
                }
            };
            var session = new NgSession("n1", null, null, null, null, 0);
            var r = NarrativeText.ExpandTemplateWithTracking("X [obj~]", model, session, null, 0);
            StringAssert.StartsWith("X ", r.Text);
            Assert.That(r.Text, Does.Contain(": "));
            Assert.That(r.DescriptionState.ContainsKey("obj"));
        }

        [Test]
        public void ResolveNarrativeDisplayTextTracked_AppendsConversationTemplate_WhenEventMatches()
        {
            var model = new NarrativeModel
            {
                StartNode = "n1",
                Nodes = new Dictionary<string, Node> { ["n1"] = new Node { Id = "n1", Text = "x" } },
                ConversationTemplates = new List<ConversationTemplate>
                {
                    new ConversationTemplate
                    {
                        Id = "t1",
                        Priority = 10,
                        Text = "Side text.",
                        Trigger = new TemplateTrigger
                        {
                            EventMatch = new EventMatchCondition
                            {
                                PropertyChecks = new List<PropertyCheck>
                                {
                                    new PropertyCheck { Key = "severity", Op = ">=", Value = Newtonsoft.Json.Linq.JToken.FromObject(50) }
                                }
                            }
                        }
                    }
                }
            };
            var evt = new Entity
            {
                Id = "anomaly1",
                Name = "Anomaly",
                Properties = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase)
                {
                    ["severity"] = new PropertyDef { DefaultValue = 80L }
                }
            };
            var session = new NgSession(
                "n1",
                new Dictionary<string, bool>(),
                new Dictionary<string, double>(),
                new Dictionary<string, object>(),
                new List<string>(),
                0,
                new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase) { [evt.Id] = evt });

            var result = NarrativeDisplayText.ResolveNarrativeDisplayTextTracked("Hello.", model, session);
            Assert.That(result.Text, Does.Contain("Hello."));
            Assert.That(result.Text, Does.Contain("Side text."));
        }

        [Test]
        public void ResolveNarrativeDisplayTextTracked_RespectsMaxUses_WithUsageState()
        {
            var model = new NarrativeModel
            {
                StartNode = "n1",
                Nodes = new Dictionary<string, Node> { ["n1"] = new Node { Id = "n1", Text = "x" } },
                ConversationTemplates = new List<ConversationTemplate>
                {
                    new ConversationTemplate
                    {
                        Id = "t_max1",
                        MaxUses = 1,
                        Text = "Only once.",
                        Trigger = new TemplateTrigger
                        {
                            EventMatch = new EventMatchCondition
                            {
                                PropertyChecks = new List<PropertyCheck>
                                {
                                    new PropertyCheck
                                    {
                                        Key = "severity",
                                        Op = ">=",
                                        Value = Newtonsoft.Json.Linq.JToken.FromObject(1)
                                    }
                                }
                            },
                            SessionConditions = new List<Condition>
                            {
                                new FlagCondition { Type = "flag", Key = "ok", Value = true }
                            }
                        }
                    }
                }
            };

            var session = new NgSession(
                "n1",
                new Dictionary<string, bool> { ["ok"] = true },
                new Dictionary<string, double>(),
                new Dictionary<string, object>(),
                new List<string>(),
                0,
                new Dictionary<string, Entity>(StringComparer.OrdinalIgnoreCase)
                {
                    ["evt1"] = new Entity
                    {
                        Id = "evt1",
                        Name = "Event 1",
                        Properties = new Dictionary<string, PropertyDef>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["severity"] = new PropertyDef { DefaultValue = 10L }
                        }
                    }
                });

            var first = NarrativeDisplayText.ResolveNarrativeDisplayTextTracked("Hello", model, session);
            Assert.That(first.Text, Does.Contain("Only once."));
            Assert.That(first.TemplateUsageState.TryGetValue("t_max1", out var used1) && used1 == 1, Is.True);

            var second = NarrativeDisplayText.ResolveNarrativeDisplayTextTracked(
                "Hello",
                model,
                session,
                new ResolveNarrativeDisplayTextTrackedOptions
                {
                    TemplateUsageState = first.TemplateUsageState
                });

            Assert.That(second.Text, Does.Not.Contain("Only once."));
            Assert.That(second.TemplateUsageState.TryGetValue("t_max1", out var used2) && used2 == 1, Is.True);
        }
    }
}
