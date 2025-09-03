using NUnit.Framework;
using NarrativeGen.Core.Entities;
using System;
using System.IO;
using System.Linq;

namespace NarrativeGen.Core.Tests
{
    [TestFixture]
    public class EntityManagerTests
    {
        private EntityManager _manager;
        private string _testDataPath;

        [SetUp]
        public void Setup()
        {
            _manager = new EntityManager();
            _testDataPath = Path.Combine(Path.GetTempPath(), "NarrativeGenTests");
            Directory.CreateDirectory(_testDataPath);
        }

        [TearDown]
        public void TearDown()
        {
            if (Directory.Exists(_testDataPath))
            {
                Directory.Delete(_testDataPath, true);
            }
        }

        [Test]
        public void CreateEntity_WithValidType_CreatesEntity()
        {
            // EntityTypeを先に作成
            var entityType = new EntityType("test_type", "Test Type");
            entityType.AddDefaultProperty("default_prop", "default_value");
            _manager.EntityTypes["test_type"] = entityType;

            var entity = _manager.CreateEntity("test_type", "test_entity");

            Assert.IsNotNull(entity);
            Assert.AreEqual("test_entity", entity.Id);
            Assert.AreEqual("test_type", entity.TypeId);
            Assert.IsTrue(_manager.Entities.ContainsKey("test_entity"));
        }

        [Test]
        public void CreateEntity_WithInvalidType_ThrowsException()
        {
            Assert.Throws<ArgumentException>(() => 
                _manager.CreateEntity("invalid_type", "test_entity"));
        }

        [Test]
        public void CreateEntity_WithDuplicateId_ThrowsException()
        {
            var entityType = new EntityType("test_type", "Test Type");
            _manager.EntityTypes["test_type"] = entityType;

            _manager.CreateEntity("test_type", "test_entity");
            
            Assert.Throws<ArgumentException>(() => 
                _manager.CreateEntity("test_type", "test_entity"));
        }

        [Test]
        public void GetEntity_ExistingEntity_ReturnsEntity()
        {
            var entityType = new EntityType("test_type", "Test Type");
            _manager.EntityTypes["test_type"] = entityType;
            
            var created = _manager.CreateEntity("test_type", "test_entity");
            var retrieved = _manager.GetEntity("test_entity");

            Assert.AreSame(created, retrieved);
        }

        [Test]
        public void GetEntity_NonExistentEntity_ReturnsNull()
        {
            var entity = _manager.GetEntity("non_existent");
            Assert.IsNull(entity);
        }

        [Test]
        public void DestroyEntity_ExistingEntity_RemovesEntity()
        {
            var entityType = new EntityType("test_type", "Test Type");
            _manager.EntityTypes["test_type"] = entityType;
            
            _manager.CreateEntity("test_type", "test_entity");
            var result = _manager.DestroyEntity("test_entity");

            Assert.IsTrue(result);
            Assert.IsFalse(_manager.Entities.ContainsKey("test_entity"));
        }

        [Test]
        public void DestroyEntity_NonExistentEntity_ReturnsFalse()
        {
            var result = _manager.DestroyEntity("non_existent");
            Assert.IsFalse(result);
        }

        [Test]
        public void FindEntitiesByProperty_ReturnsMatchingEntities()
        {
            var entityType = new EntityType("test_type", "Test Type");
            _manager.EntityTypes["test_type"] = entityType;

            var entity1 = _manager.CreateEntity("test_type", "entity1");
            var entity2 = _manager.CreateEntity("test_type", "entity2");
            var entity3 = _manager.CreateEntity("test_type", "entity3");

            entity1.SetProperty("color", "red");
            entity2.SetProperty("color", "blue");
            entity3.SetProperty("color", "red");

            var redEntities = _manager.FindEntitiesByProperty("color", "red");

            Assert.AreEqual(2, redEntities.Count);
            Assert.IsTrue(redEntities.Any(e => e.Id == "entity1"));
            Assert.IsTrue(redEntities.Any(e => e.Id == "entity3"));
        }

        [Test]
        public void FindEntitiesByType_ReturnsMatchingEntities()
        {
            var type1 = new EntityType("type1", "Type 1");
            var type2 = new EntityType("type2", "Type 2");
            _manager.EntityTypes["type1"] = type1;
            _manager.EntityTypes["type2"] = type2;

            _manager.CreateEntity("type1", "entity1");
            _manager.CreateEntity("type2", "entity2");
            _manager.CreateEntity("type1", "entity3");

            var type1Entities = _manager.FindEntitiesByType("type1");

            Assert.AreEqual(2, type1Entities.Count);
            Assert.IsTrue(type1Entities.Any(e => e.Id == "entity1"));
            Assert.IsTrue(type1Entities.Any(e => e.Id == "entity3"));
        }

        [Test]
        public void InheritProperties_CopiesParentProperties()
        {
            var entityType = new EntityType("test_type", "Test Type");
            _manager.EntityTypes["test_type"] = entityType;

            var parent = _manager.CreateEntity("test_type", "parent");
            var child = _manager.CreateEntity("test_type", "child");

            parent.SetProperty("inherited_prop", "inherited_value");
            parent.SetProperty("common_prop", "parent_value");
            child.SetProperty("common_prop", "child_value");

            _manager.InheritProperties(child, parent);

            Assert.AreEqual("parent", child.ParentId);
            Assert.AreEqual("inherited_value", child.GetProperty("inherited_prop").Value);
            Assert.AreEqual("child_value", child.GetProperty("common_prop").Value); // 上書き優先
        }

        [Test]
        public void RecordUsage_AddsToHistory()
        {
            var initialCount = _manager.UsageHistory.Count;
            
            _manager.RecordUsage("test_entity", "test_context");

            Assert.AreEqual(initialCount + 1, _manager.UsageHistory.Count);
            var lastUsage = _manager.UsageHistory.Last();
            Assert.AreEqual("test_entity", lastUsage.EntityId);
            Assert.AreEqual("test_context", lastUsage.Context);
        }

        [Test]
        public void LoadEntityTypesFromCsv_ValidFile_LoadsTypes()
        {
            var csvContent = @"type_id,parent_type_id,type_name,description,default_properties,validation_rules,description_patterns
food_base,,食料基本型,基本の食料,""{\""edible\"": true}"",""{\""weight\"": {\""min\"": 0.01}}"",""[\""食べ物\""]""
food_portable,food_base,携帯食料,持ち運び可能,""{\""portable\"": true}"",""{\""weight\"": {\""max\"": 1.0}}"",""[\""携帯食料\""]""";

            var csvPath = Path.Combine(_testDataPath, "EntityTypes.csv");
            File.WriteAllText(csvPath, csvContent);

            _manager.LoadEntityTypesFromCsv(csvPath);

            Assert.AreEqual(2, _manager.EntityTypes.Count);
            Assert.IsTrue(_manager.EntityTypes.ContainsKey("food_base"));
            Assert.IsTrue(_manager.EntityTypes.ContainsKey("food_portable"));

            var foodBase = _manager.EntityTypes["food_base"];
            Assert.AreEqual("食料基本型", foodBase.TypeName);
            Assert.IsTrue(foodBase.DefaultProperties.ContainsKey("edible"));

            var foodPortable = _manager.EntityTypes["food_portable"];
            Assert.AreEqual("food_base", foodPortable.ParentTypeId);
        }

        [Test]
        public void LoadEntitiesFromCsv_ValidFile_LoadsEntities()
        {
            // 先にEntityTypeを設定
            var entityType = new EntityType("test_type", "Test Type");
            _manager.EntityTypes["test_type"] = entityType;

            var csvContent = @"entity_id,entity_type_id,parent_entity_id,name,description,created_at,is_active
test_entity,test_type,,テストエンティティ,テスト用,2024-01-15T10:00:00,true
inactive_entity,test_type,,非アクティブ,テスト用,2024-01-15T10:00:00,false";

            var csvPath = Path.Combine(_testDataPath, "Entities.csv");
            File.WriteAllText(csvPath, csvContent);

            _manager.LoadEntitiesFromCsv(csvPath);

            Assert.AreEqual(1, _manager.Entities.Count); // is_active=falseは除外
            Assert.IsTrue(_manager.Entities.ContainsKey("test_entity"));
            
            var entity = _manager.Entities["test_entity"];
            Assert.AreEqual("テストエンティティ", entity.GetProperty("name").Value);
        }

        [Test]
        public void ValidateAllData_DetectsErrors()
        {
            // 無効なEntityTypeを作成（循環参照）
            var type1 = new EntityType("type1", "Type 1") { ParentTypeId = "type2" };
            var type2 = new EntityType("type2", "Type 2") { ParentTypeId = "type1" };
            _manager.EntityTypes["type1"] = type1;
            _manager.EntityTypes["type2"] = type2;

            var errors = _manager.ValidateAllData();

            Assert.Greater(errors.Count, 0);
            Assert.IsTrue(errors.Any(e => e.Contains("Circular inheritance")));
        }
    }
}
