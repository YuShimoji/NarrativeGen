using System;
using System.IO;
using System.Linq;
using NUnit.Framework;
using NarrativeGen;

namespace NarrativeGen.Tests
{
    [TestFixture]
    public class EngineSmokeTests
    {
        private static string FindRepoRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && dir.Exists)
            {
                var gitDir = Path.Combine(dir.FullName, ".git");
                if (Directory.Exists(gitDir)) return dir.FullName;
                dir = dir.Parent!;
            }
            throw new DirectoryNotFoundException("Repo root not found from AppContext.BaseDirectory");
        }

        private static string GetSampleModelPath(string sampleName)
        {
            var fileName = sampleName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
                ? sampleName
                : sampleName + ".json";

            // Try repo-root based resolution first
            try
            {
                var root = FindRepoRoot();
                var p = Path.Combine(root, "models", "examples", fileName);
                if (File.Exists(p)) return p;
            }
            catch { /* ignore */ }

            // Fallback candidates (relative from bin)
            string[] candidates = new[]
            {
                Path.Combine("..", "..", "..", "..", "..", "..", "models", "examples", fileName),
                Path.Combine("..", "..", "..", "..", "models", "examples", fileName)
            };
            foreach (var rel in candidates)
            {
                var p = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, rel));
                if (File.Exists(p)) return p;
            }
            throw new FileNotFoundException($"Could not locate models/examples/{fileName}");
        }

        private static NarrativeModel LoadSampleModel(string sampleName)
        {
            var path = GetSampleModelPath(sampleName);
            var json = File.ReadAllText(path);
            return Engine.LoadModel(json);
        }

        [Test]
        public void Load_And_Play_Linear_Model_To_End()
        {
            var model = LoadSampleModel("linear");

            // Start session
            var session = Engine.StartSession(model);
            Assert.AreEqual("start", session.CurrentNodeId, "Should start at 'start'");

            // First step
            var choices1 = Engine.GetAvailableChoices(session, model);
            Assert.That(choices1, Has.Count.EqualTo(1));
            Assert.AreEqual("c1", choices1[0].Id);
            session = Engine.ApplyChoice(session, model, "c1");
            Assert.AreEqual("scene1", session.CurrentNodeId);

            // Second step
            var choices2 = Engine.GetAvailableChoices(session, model);
            Assert.That(choices2, Has.Count.EqualTo(1));
            Assert.AreEqual("c2", choices2[0].Id);
            session = Engine.ApplyChoice(session, model, "c2");
            Assert.AreEqual("end", session.CurrentNodeId);

            // End node should have 0 choices
            var finalChoices = Engine.GetAvailableChoices(session, model);
            Assert.That(finalChoices, Has.Count.EqualTo(0));
        }

        [Test]
        public void BranchingFlags_SetFlagAndReturnToStart()
        {
            var model = LoadSampleModel("branching_flags");
            var session = Engine.StartSession(model);

            Assert.That(session.Flags.TryGetValue("hasKey", out var hasKey) && hasKey == false,
                "Initial flag should be false");

            var choices = Engine.GetAvailableChoices(session, model);
            Assert.That(choices.Select(c => c.Id), Has.Member("findKey"));

            session = Engine.ApplyChoice(session, model, "findKey");
            Assert.That(session.Flags.TryGetValue("hasKey", out hasKey) && hasKey,
                "Flag should be set after finding the key");

            choices = Engine.GetAvailableChoices(session, model);
            Assert.That(choices.Select(c => c.Id), Has.Member("backToDoor"));

            session = Engine.ApplyChoice(session, model, "backToDoor");
            Assert.AreEqual("start", session.CurrentNodeId);
        }

        [Test]
        public void ResourceManagement_EarnAndSpendCoins()
        {
            var model = LoadSampleModel("resource_management");
            var session = Engine.StartSession(model);

            var initialChoices = Engine.GetAvailableChoices(session, model);
            Assert.That(initialChoices.Select(c => c.Id), Has.Member("earn"));
            Assert.That(initialChoices.Select(c => c.Id), Does.Not.Contain("buy"));

            session = Engine.ApplyChoice(session, model, "earn");
            Assert.AreEqual("start", session.CurrentNodeId);

            var afterEarnChoices = Engine.GetAvailableChoices(session, model);
            Assert.That(afterEarnChoices.Select(c => c.Id), Has.Member("buy"));

            session = Engine.ApplyChoice(session, model, "buy");
            Assert.AreEqual("bought", session.CurrentNodeId);
            Assert.That(session.Resources.TryGetValue("coin", out var coins) ? coins : 0, Is.EqualTo(0));
        }

        [Test]
        public void TimeGatedChoice_BecomesAvailableWithinWindow()
        {
            var model = LoadSampleModel("time_gated");
            var session = Engine.StartSession(model);

            Assert.AreEqual(0, session.Time);

            var initialChoices = Engine.GetAvailableChoices(session, model);
            Assert.That(initialChoices.Select(c => c.Id), Does.Not.Contain("visitMarket"));

            while (session.Time < 5)
            {
                session = Engine.ApplyChoice(session, model, "train");
                Assert.AreEqual("yard", session.CurrentNodeId);
                session = Engine.ApplyChoice(session, model, "finish");
                Assert.AreEqual("start", session.CurrentNodeId);
            }

            Assert.That(session.Time, Is.InRange(5, 8), "Time should be within market window");

            var available = Engine.GetAvailableChoices(session, model);
            Assert.That(available.Select(c => c.Id), Has.Member("visitMarket"));

            session = Engine.ApplyChoice(session, model, "visitMarket");
            Assert.AreEqual("market", session.CurrentNodeId);
        }

        [Test]
        public void LoadModel_Throws_On_Invalid_Json()
        {
            Assert.Throws<System.Text.Json.JsonException>(() => Engine.LoadModel("invalid json"));
        }

        [Test]
        public void LoadModel_Throws_On_Missing_StartNode()
        {
            var invalidModel = @"{
                ""modelType"": ""adventure-playthrough"",
                ""nodes"": { ""node1"": { ""id"": ""node1"", ""text"": ""test"" } }
            }";
            Assert.Throws<ArgumentException>(() => Engine.LoadModel(invalidModel));
        }

        [Test]
        public void LoadModel_Throws_On_Node_Id_Mismatch()
        {
            var invalidModel = @"{
                ""modelType"": ""adventure-playthrough"",
                ""startNode"": ""node1"",
                ""nodes"": { ""wrongId"": { ""id"": ""node1"", ""text"": ""test"" } }
            }";
            Assert.Throws<ArgumentException>(() => Engine.LoadModel(invalidModel));
        }
    }
}
