using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace NarrativeGen.Tests
{
    // The C# ScreenFrameBuilder must produce the frames that the TypeScript
    // reference wrote (scripts/generate-screen-frames.mjs, SP-SCREEN-001).
    public class ScreenFrameConformanceTests
    {
        public static IEnumerable<string> Routes() =>
            Directory.GetFiles(Path.Combine(TestContext.CurrentContext.TestDirectory, "ScreenFrames"), "*.json")
                .Select(Path.GetFileNameWithoutExtension)
                .OrderBy(name => name)!;

        [TestCaseSource(nameof(Routes))]
        public void FramesMatchTheTypeScriptReference(string name)
        {
            var dir = TestContext.CurrentContext.TestDirectory;
            var route = JObject.Parse(File.ReadAllText(Path.Combine(dir, "ScreenFrames", name + ".json")));
            var modelFile = Path.Combine(dir, "PlaybackModels", Path.GetFileName((string)route["model"]!));
            var model = Engine.LoadModel(File.ReadAllText(modelFile));
            var builder = new ScreenFrameBuilder(model, (string?)route["layout"]);
            var expected = (JArray)route["frames"]!;
            var path = route["path"]!.Select(t => (string)t!).ToList();

            AssertFrame(expected[0], builder.Current, $"{name} step 0");
            for (int i = 0; i < path.Count; i++)
            {
                AssertFrame(expected[i + 1], builder.Choose(path[i]), $"{name} step {i + 1}");
            }
        }

        [Test]
        public void ChoosingAChoiceThatIsNotOnScreenIsRejected()
        {
            var model = Engine.LoadModel(File.ReadAllText(Path.Combine(TestContext.CurrentContext.TestDirectory, "PlaybackModels", "brass-weight.json")));
            var builder = new ScreenFrameBuilder(model);
            Assert.That(builder.Layout, Is.EqualTo(ScreenFrame.LayoutInquiry));
            Assert.Throws<System.ArgumentException>(() => builder.Choose("verify_baker"));
        }

        [Test]
        public void EmptyProseStillShowsMatchingTemplatesAndChoiceLabelsDropTheProbability()
        {
            // Expected values were produced by playScreenFrames in engine-ts.
            var model = Engine.LoadModel("""
                {"modelType":"adventure-playthrough","startNode":"a","flags":{"lit":true},
                 "conversationTemplates":[{"id":"t","trigger":{"sessionConditions":[{"type":"flag","key":"lit","value":true}]},"text":"灯がともる。"}],
                 "nodes":{"a":{"id":"a","text":"","choices":[{"id":"go","text":"進む〔蓋然 50.0%〕","target":"b"}]},
                          "b":{"id":"b","text":"終わり","choices":[]}}}
                """);
            var builder = new ScreenFrameBuilder(model);
            Assert.That(builder.Current.ParagraphTexts, Is.EqualTo(new[] { "灯がともる。" }));
            Assert.That(builder.Current.AllChoices.Select(c => c.Text), Is.EqualTo(new[] { "進む" }));
            var end = builder.Choose("go");
            Assert.That(end.ParagraphTexts, Is.EqualTo(new[] { "終わり 灯がともる。" }));
            Assert.That(end.ChoiceText, Is.EqualTo("進む"));
            Assert.That(end.Ending, Is.True);
            Assert.That(end.ChoiceGroups, Is.Empty);
        }

        private static void AssertFrame(JToken expected, ScreenFrame actual, string where)
        {
            var actualJson = JToken.Parse(actual.ToJson());
            if (!JToken.DeepEquals(expected, actualJson))
            {
                Assert.Fail($"{where}\nexpected: {expected.ToString(Formatting.None)}\nactual:   {actualJson.ToString(Formatting.None)}");
            }
        }
    }
}
