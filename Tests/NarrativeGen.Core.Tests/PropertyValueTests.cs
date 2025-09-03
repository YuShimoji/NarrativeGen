using NUnit.Framework;
using NarrativeGen.Core.Entities;
using System;

namespace NarrativeGen.Core.Tests
{
    [TestFixture]
    public class PropertyValueTests
    {
        [Test]
        public void PropertyValue_Constructor_SetsDefaultValues()
        {
            var property = new PropertyValue("test_prop", "test_value");
            
            Assert.AreEqual("test_prop", property.Name);
            Assert.AreEqual("test_value", property.Value);
            Assert.AreEqual(PropertyType.String, property.Type);
            Assert.AreEqual(PropertySource.Default, property.Source);
            Assert.AreEqual(1.0f, property.Confidence);
            Assert.IsFalse(property.IsInherited);
        }

        [Test]
        public void PropertyValue_ConstructorWithParameters_SetsAllValues()
        {
            var property = new PropertyValue("test_prop", 42, PropertyType.Integer, PropertySource.Override);
            
            Assert.AreEqual("test_prop", property.Name);
            Assert.AreEqual(42, property.Value);
            Assert.AreEqual(PropertyType.Integer, property.Type);
            Assert.AreEqual(PropertySource.Override, property.Source);
        }

        [Test]
        public void ToString_ReturnsValueAsString()
        {
            var stringProp = new PropertyValue("str", "hello");
            var intProp = new PropertyValue("int", 42);
            var nullProp = new PropertyValue("null", null);
            
            Assert.AreEqual("hello", stringProp.ToString());
            Assert.AreEqual("42", intProp.ToString());
            Assert.AreEqual("", nullProp.ToString());
        }

        [Test]
        public void CompareTo_StringComparison_ReturnsCorrectSimilarity()
        {
            var prop1 = new PropertyValue("test", "hello", PropertyType.String);
            var prop2 = new PropertyValue("test", "hello", PropertyType.String);
            var prop3 = new PropertyValue("test", "world", PropertyType.String);
            var prop4 = new PropertyValue("test", "hallo", PropertyType.String); // 類似
            
            Assert.AreEqual(1.0f, prop1.CompareTo(prop2)); // 完全一致
            Assert.AreEqual(0.0f, prop1.CompareTo(prop3)); // 完全不一致
            Assert.Greater(prop1.CompareTo(prop4), 0.0f);   // 部分一致
            Assert.Less(prop1.CompareTo(prop4), 1.0f);
        }

        [Test]
        public void CompareTo_FloatComparison_ReturnsCorrectSimilarity()
        {
            var prop1 = new PropertyValue("test", 1.0f, PropertyType.Float);
            var prop2 = new PropertyValue("test", 1.0f, PropertyType.Float);
            var prop3 = new PropertyValue("test", 1.1f, PropertyType.Float);
            var prop4 = new PropertyValue("test", 2.0f, PropertyType.Float);
            
            Assert.AreEqual(1.0f, prop1.CompareTo(prop2)); // 完全一致
            Assert.Greater(prop1.CompareTo(prop3), 0.8f);   // 近似値
            Assert.Less(prop1.CompareTo(prop4), 0.6f);      // 離れた値
        }

        [Test]
        public void CompareTo_BoolComparison_ReturnsExactMatch()
        {
            var prop1 = new PropertyValue("test", true, PropertyType.Bool);
            var prop2 = new PropertyValue("test", true, PropertyType.Bool);
            var prop3 = new PropertyValue("test", false, PropertyType.Bool);
            
            Assert.AreEqual(1.0f, prop1.CompareTo(prop2)); // 一致
            Assert.AreEqual(0.0f, prop1.CompareTo(prop3)); // 不一致
        }

        [Test]
        public void CompareTo_DifferentTypes_ReturnsZero()
        {
            var stringProp = new PropertyValue("test", "42", PropertyType.String);
            var intProp = new PropertyValue("test", 42, PropertyType.Integer);
            
            Assert.AreEqual(0.0f, stringProp.CompareTo(intProp));
        }

        [Test]
        public void CompareTo_NullValues_ReturnsZero()
        {
            var prop1 = new PropertyValue("test", "value");
            var prop2 = new PropertyValue("test", null);
            var prop3 = new PropertyValue("test", null);
            
            Assert.AreEqual(0.0f, prop1.CompareTo(prop2));
            Assert.AreEqual(0.0f, prop2.CompareTo(prop1));
            Assert.AreEqual(0.0f, prop1.CompareTo(null));
        }

        [Test]
        public void CreateInheritedCopy_CreatesCorrectCopy()
        {
            var original = new PropertyValue("test", "value", PropertyType.String, PropertySource.Default)
            {
                Confidence = 1.0f
            };
            
            var inherited = original.CreateInheritedCopy();
            
            Assert.AreEqual(original.Name, inherited.Name);
            Assert.AreEqual(original.Value, inherited.Value);
            Assert.AreEqual(original.Type, inherited.Type);
            Assert.AreEqual(PropertySource.Inherited, inherited.Source);
            Assert.AreEqual(0.9f, inherited.Confidence); // 継承時は信頼度が下がる
            Assert.IsTrue(inherited.IsInherited);
            Assert.IsFalse(original.IsInherited); // 元は変更されない
        }
    }
}
