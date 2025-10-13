using System.Collections.Generic;
using NUnit.Framework;
using NarrativeGen;
using NarrativeGen.Runtime;

namespace NarrativeGen.Tests
{
    [TestFixture]
    public class GameSessionChoicesTests
    {
        private static NarrativeModel CreateModel()
        {
            return new NarrativeModel
            {
                StartNode = "hub",
                Nodes = new Dictionary<string, Node>
                {
                    ["hub"] = new Node
                    {
                        Id = "hub",
                        Choices = new List<Choice>
                        {
                            new Choice
                            {
                                Id = "choose_burger",
                                Text = "チーズバーガーを食べる",
                                Target = "hub",
                                Outcome = new ChoiceOutcome { Type = "ADD_ITEM", Value = "mac_burger_001" }
                            },
                            new Choice
                            {
                                Id = "choose_coffee",
                                Text = "コーヒーを飲む",
                                Target = "hub",
                                Outcome = new ChoiceOutcome { Type = "ADD_ITEM", Value = "coffee_001" }
                            },
                            new Choice
                            {
                                Id = "discard",
                                Text = "アイテムを捨てる",
                                Target = "hub",
                                Outcome = new ChoiceOutcome { Type = "REMOVE_ITEM", Value = "mac_burger_001" }
                            }
                        }
                    }
                }
            };
        }

        private static List<Entity> CreateEntities() => new()
        {
            new Entity { Id = "mac_burger_001", Brand = "MacBurger", Description = "おいしいバーガー", Cost = 100 },
            new Entity { Id = "coffee_001", Brand = "CoffeeStand", Description = "香り高いコーヒー", Cost = 50 },
        };

        [Test]
        public void ApplyChoice_AddsItemToInventory()
        {
            var model = CreateModel();
            var session = new GameSession(model, entities: CreateEntities());

            var choices = session.GetAvailableChoices();
            Assert.That(choices, Has.Count.EqualTo(3));
            Assert.That(choices[0].Outcome, Is.Not.Null);

            var result = session.ApplyChoice("choose_burger");
            Assert.That(result.Time, Is.EqualTo(1));

            var inventory = session.ListInventory();
            Assert.That(inventory, Has.Count.EqualTo(1));
            Assert.That(inventory[0].Id, Is.EqualTo("mac_burger_001"));
            Assert.That(session.LastOutcome, Is.Not.Null);
            Assert.That(session.LastOutcome!.Type, Is.EqualTo("ADD_ITEM"));
        }

        [Test]
        public void ApplyChoice_RemoveItemFromInventory()
        {
            var model = CreateModel();
            var session = new GameSession(
                model,
                entities: CreateEntities(),
                initialInventory: new[] { "mac_burger_001" }
            );

            var result = session.ApplyChoice("discard");
            Assert.That(result.Time, Is.EqualTo(1));

            var inventory = session.ListInventory();
            Assert.That(inventory, Is.Empty);
            Assert.That(session.LastOutcome, Is.Not.Null);
            Assert.That(session.LastOutcome!.Type, Is.EqualTo("REMOVE_ITEM"));
        }
    }
}
