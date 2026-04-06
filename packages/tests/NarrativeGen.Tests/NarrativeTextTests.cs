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
    }
}
