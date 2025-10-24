using System.Collections.Generic;
using NUnit.Framework;
using NarrativeGen;

namespace NarrativeGen.Tests
{
    [TestFixture]
    public class InventoryTests
    {
        private readonly List<Entity> _entities = new()
        {
            new Entity { Id = "mac_burger_001", Brand = "MacBurger", Description = "おいしいバーガー", Cost = 100 },
            new Entity { Id = "coffee_001", Brand = "CoffeeStand", Description = "香り高いコーヒー", Cost = 50 }
        };

        [Test]
        public void AddsUniqueItemsAndIgnoresDuplicates()
        {
            var inventory = new Inventory(_entities);

            var firstAdd = inventory.Add("mac_burger_001");
            Assert.That(firstAdd?.Id, Is.EqualTo("mac_burger_001"));

            var duplicateAdd = inventory.Add("mac_burger_001");
            Assert.That(duplicateAdd?.Id, Is.EqualTo("mac_burger_001"));
            Assert.That(inventory.List(), Has.Count.EqualTo(1));
        }

        [Test]
        public void RemovesItemsAndReturnsEntity()
        {
            var inventory = new Inventory(_entities, new List<string> { "mac_burger_001" });

            var removed = inventory.Remove("mac_burger_001");
            Assert.That(removed?.Id, Is.EqualTo("mac_burger_001"));
            Assert.That(inventory.List(), Has.Count.EqualTo(0));
        }

        [Test]
        public void HasReflectsStoredItems()
        {
            var inventory = new Inventory(_entities);

            inventory.Add("coffee_001");
            Assert.That(inventory.Has("coffee_001"), Is.True);
            Assert.That(inventory.Has("unknown"), Is.False);
        }

        [Test]
        public void ListReturnsEntityObjectsInInsertionOrder()
        {
            var inventory = new Inventory(_entities);

            inventory.Add("mac_burger_001");
            inventory.Add("coffee_001");
            var list = inventory.List();
            Assert.That(list, Has.Count.EqualTo(2));
            Assert.That(list[0]?.Id, Is.EqualTo("mac_burger_001"));
            Assert.That(list[1]?.Id, Is.EqualTo("coffee_001"));
        }

        [Test]
        public void ToJSONReturnsRawIdArray()
        {
            var inventory = new Inventory(_entities, new List<string> { "coffee_001" });

            var json = inventory.ToJSON();
            Assert.That(json, Is.EqualTo(new List<string> { "coffee_001" }));
        }
    }
}
