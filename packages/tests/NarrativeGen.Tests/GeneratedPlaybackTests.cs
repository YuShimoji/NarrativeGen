using System;
using System.IO;
using System.Linq;
using NUnit.Framework;

namespace NarrativeGen.Tests
{
    public class GeneratedPlaybackTests
    {
        [Test]
        public void KnowledgeRulesCanGateChoicesWithAnIntegerInitialVariable()
        {
            var model = Engine.LoadModel("""
                {
                  "startNode":"start",
                  "variables":{"confidence":2},
                  "entities":{
                    "base":{"properties":{"weight":{"defaultValue":12}}},
                    "item":{"parentEntity":"base"}
                  },
                  "characters":{
                    "detective":{"knowledgeProfiles":[{"domain":"general","tolerance":0.1}]}
                  },
                  "knowledgeRules":{
                    "observe":{"character":"detective","entity":"item","domain":"food","expectations":{"weight":10}}
                  },
                  "nodes":{
                    "start":{"id":"start","choices":[
                      {"id":"notice","text":"Notice","target":"end","conditions":[
                        {"type":"and","conditions":[
                          {"type":"variable","key":"confidence","op":">","value":1},
                          {"type":"knowledgeRule","rule":"observe","result":"noticed"}
                        ]}
                      ]},
                      {"id":"missing","text":"Missing","target":"end","conditions":[
                        {"type":"knowledgeRule","rule":"unknown","result":"noticed"}
                      ]}
                    ]},
                    "end":{"id":"end","choices":[]}
                  }
                }
                """);
            var session = Engine.StartSession(model);
            Assert.That(Engine.GetAvailableChoices(session, model).Select(choice => choice.Id),
                Is.EqualTo(new[] { "notice" }));
            Assert.That(Engine.ApplyChoice(session, model, "notice").CurrentNodeId, Is.EqualTo("end"));
        }

        [TestCase("cheeseburger-weight.json")]
        [TestCase("cheeseburger-weight-hearsay.json")]
        public void GeneratedStoryPreservesPerceptionChoicesAndDynamicText(string fileName)
        {
            var model = LoadPlaybackModel(fileName);
            var start = Engine.StartSession(model);

            var unnoticed = Engine.ApplyChoice(start, model, "look_drunk_person");
            Assert.That(unnoticed.Events, Is.Empty);
            Assert.That(Engine.GetAvailableChoices(unnoticed, model).Select(choice => choice.Id),
                Is.EqualTo(new[] { "look_witness_b", "look_detective_a" }));

            var noticed = Engine.ApplyChoice(start, model, "look_detective_a");
            var report = noticed.Events["notice_detective_a"];
            Assert.That(report.Properties!["perception_noticed"].DefaultValue, Is.EqualTo(true));
            Assert.That(report.Properties["severity"].DefaultValue, Is.EqualTo(80));
            Assert.That(Engine.GetAvailableChoices(noticed, model).Select(choice => choice.Id),
                Is.EqualTo(new[] { "verify_detective_a" }));

            string output = NarrativeDisplayText.ResolveNarrativeDisplayTextTracked(
                model.Nodes[noticed.CurrentNodeId].Text, model, noticed).Text;
            Assert.That(output, Is.EqualTo(
                "探偵Aは誰かが食べていたチーズバーガーを見る。重さは0.1のはずだと思っていた。実際は0.12。探偵Aは違和感を覚える。"));
        }

        [TestCase("brass-weight.json", "配給所の秤台｜欠け耳の分銅", "s10_verify_baker",
            "look_baker,tell_baker_clerk,look_clerk,verify_baker")]
        [TestCase("blue-selvedge.json", "布改め小屋｜荷改めのユノ", "market",
            "go_loom,ask_thread,go_cloth,match_thread,go_desk,give_maker")]
        [TestCase("ebb-stair.json", "舟便詰所｜水先案内のエナ", "crossed",
            "go_steps,wait,read,signal")]
        public void StudioSampleKeepsSpeakerAndReachesEnding(
            string fileName, string speaker, string ending, string route)
        {
            var model = LoadPlaybackModel(fileName);
            var session = Engine.StartSession(model);
            Assert.That(model.Nodes[session.CurrentNodeId].Speaker, Is.EqualTo(speaker));

            foreach (var choiceId in route.Split(','))
            {
                Assert.That(Engine.GetAvailableChoices(session, model).Select(choice => choice.Id),
                    Does.Contain(choiceId), $"Choice was unavailable at {session.CurrentNodeId}.");
                session = Engine.ApplyChoice(session, model, choiceId);
            }

            Assert.That(session.CurrentNodeId, Is.EqualTo(ending));
            Assert.That(model.Nodes[ending].Choices, Is.Null.Or.Empty);
        }

        private static NarrativeModel LoadPlaybackModel(string fileName)
        {
            var file = Path.Combine(AppContext.BaseDirectory, "PlaybackModels", fileName);
            return Engine.LoadModel(File.ReadAllText(file));
        }
    }
}
