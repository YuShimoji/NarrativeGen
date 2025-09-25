using System;
using System.IO;
using NUnit.Framework;
using VastCore.NarrativeGen;

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

        private static string GetLinearModelPath()
        {
            // Try repo-root based resolution first
            try
            {
                var root = FindRepoRoot();
                var p = Path.Combine(root, "models", "examples", "linear.json");
                if (File.Exists(p)) return p;
            }
            catch { /* ignore */ }

            // Fallback candidates (relative from bin)
            string[] candidates = new[]
            {
                @"..\\..\\..\\..\\..\\..\\models\\examples\\linear.json",
                @"..\\..\\..\\..\\models\\examples\\linear.json"
            };
            foreach (var rel in candidates)
            {
                var p = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, rel));
                if (File.Exists(p)) return p;
            }
            throw new FileNotFoundException("Could not locate models/examples/linear.json");
        }

        [Test]
        public void Load_And_Play_Linear_Model_To_End()
        {
            var modelPath = GetLinearModelPath();
            var json = File.ReadAllText(modelPath);
            var model = Engine.LoadModel(json);

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
    }
}
