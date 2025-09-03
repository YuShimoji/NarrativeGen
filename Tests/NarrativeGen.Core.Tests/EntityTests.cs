using NUnit.Framework;
using NarrativeGen.Core.Entities;
using System;
using System.Linq;

namespace NarrativeGen.Core.Tests
{
    [TestFixture]
    public class EntityTests
    {
        private Entity _entity;

        [SetUp]
        public void Setup()
        {
            _entity = new Entity("test_entity", "test_type");
        }

        [Test]
        public void Entity_Constructor_SetsBasicProperties()
        {
            Assert.AreEqual("test_entity", _entity.Id);
            Assert.AreEqual("test_type", _entity.TypeId);
            Assert.IsNull(_entity.ParentId);
            Assert.IsNotNull(_entity.Properties);
            Assert.AreEqual(0, _entity.Properties.Count);
        }

        [Test]
        public void SetProperty_AddsNewProperty()
        {
            _entity.SetProperty("test_prop", "test_value");
            
            var property = _entity.GetProperty("test_prop");
            Assert.IsNotNull(property);
            Assert.AreEqual("test_prop", property.Name);
            Assert.AreEqual("test_value", property.Value);
            Assert.AreEqual(PropertyType.String, property.Type);
            Assert.AreEqual(PropertySource.Override, property.Source);
        }

        [Test]
        public void SetProperty_OverwritesExistingProperty()
        {
            _entity.SetProperty("test_prop", "value1");
            _entity.SetProperty("test_prop", "value2");
            
            var property = _entity.GetProperty("test_prop");
            Assert.AreEqual("value2", property.Value);
            Assert.AreEqual(1, _entity.Properties.Count);
        }

        [Test]
        public void GetProperty_ReturnsNullForNonExistentProperty()
        {
            var property = _entity.GetProperty("non_existent");
            Assert.IsNull(property);
        }

        [Test]
        public void HasProperty_ReturnsTrueForExistingProperty()
        {
            _entity.SetProperty("test_prop", "test_value");
            
            Assert.IsTrue(_entity.HasProperty("test_prop", "test_value"));
            Assert.IsFalse(_entity.HasProperty("test_prop", "wrong_value"));
            Assert.IsFalse(_entity.HasProperty("non_existent", "any_value"));
        }

        [Test]
        public void InheritFrom_CopiesParentProperties()
        {
            var parent = new Entity("parent", "parent_type");
            parent.SetProperty("inherited_prop", "inherited_value");
            parent.SetProperty("common_prop", "parent_value");
            
            _entity.SetProperty("common_prop", "child_value");
            _entity.InheritFrom(parent);
            
            // 継承されたプロパティが存在する
            var inheritedProp = _entity.GetProperty("inherited_prop");
            Assert.IsNotNull(inheritedProp);
            Assert.AreEqual("inherited_value", inheritedProp.Value);
            Assert.IsTrue(inheritedProp.IsInherited);
            
            // 既存プロパティは上書きされない
            var commonProp = _entity.GetProperty("common_prop");
            Assert.AreEqual("child_value", commonProp.Value);
            Assert.IsFalse(commonProp.IsInherited);
        }

        [Test]
        public void Clone_CreatesExactCopy()
        {
            _entity.SetProperty("prop1", "value1");
            _entity.SetProperty("prop2", 42, PropertyType.Integer);
            
            var clone = _entity.Clone();
            
            Assert.AreNotSame(_entity, clone);
            Assert.AreEqual(_entity.Id + "_clone", clone.Id);
            Assert.AreEqual(_entity.TypeId, clone.TypeId);
            Assert.AreEqual(2, clone.Properties.Count);
            
            var clonedProp1 = clone.GetProperty("prop1");
            Assert.AreEqual("value1", clonedProp1.Value);
            
            var clonedProp2 = clone.GetProperty("prop2");
            Assert.AreEqual(42, clonedProp2.Value);
        }

        [Test]
        public void CalculatePropertySimilarity_ReturnsCorrectSimilarity()
        {
            var entity1 = new Entity("e1", "type1");
            entity1.SetProperty("prop1", "same_value");
            entity1.SetProperty("prop2", "different1");
            
            var entity2 = new Entity("e2", "type2");
            entity2.SetProperty("prop1", "same_value");
            entity2.SetProperty("prop2", "different2");
            
            var similarity = entity1.CalculatePropertySimilarity(entity2);
            
            // 2つのプロパティ: 1つ完全一致(1.0) + 1つ不一致(0.0) = 平均0.5
            Assert.AreEqual(0.5f, similarity, 0.1f);
        }

        [Test]
        public void ValidateProperties_DetectsTypeErrors()
        {
            _entity.SetProperty("invalid_float", "not_a_number", PropertyType.Float);
            _entity.SetProperty("invalid_confidence", "test", PropertyType.String);
            
            // 信頼度を無効な値に設定
            _entity.Properties["invalid_confidence"].Confidence = 1.5f;
            
            var errors = _entity.ValidateProperties();
            
            Assert.IsTrue(errors.Any(e => e.Contains("should be float")));
            Assert.IsTrue(errors.Any(e => e.Contains("invalid confidence")));
        }

        [Test]
        public void RecordUsage_UpdatesLastUsed()
        {
            var beforeUsage = _entity.LastUsed;
            System.Threading.Thread.Sleep(10); // 時間差を作る
            
            _entity.RecordUsage();
            
            Assert.Greater(_entity.LastUsed, beforeUsage);
        }
    }
}
