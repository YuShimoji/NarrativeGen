using NUnit.Framework;
using NarrativeGen.Core.Entities;
using System;
using System.IO;
using System.Linq;

namespace NarrativeGen.Core.Tests
{
    [TestFixture]
    public class CsvIntegrationTests
    {
        private EntityManager _manager;
        private string _testDataPath;

        [SetUp]
        public void Setup()
        {
            _manager = new EntityManager();
            _testDataPath = Path.Combine(Path.GetTempPath(), "NarrativeGenCsvTests");
            Directory.CreateDirectory(_testDataPath);
            CreateTestCsvFiles();
        }

        [TearDown]
        public void TearDown()
        {
            if (Directory.Exists(_testDataPath))
            {
                Directory.Delete(_testDataPath, true);
            }
        }

        private void CreateTestCsvFiles()
        {
            // EntityTypes.csv
            var entityTypesContent = @"type_id,parent_type_id,type_name,description,default_properties,validation_rules,description_patterns
food_base,,食料基本型,すべての食料の基本型,""{\""edible\"": true, \""nutritional_value\"": \""medium\""}"",""{\""weight\"": {\""min\"": 0.01}}"",""[\""食べ物\"", \""[TYPE]\""]""
food_portable,food_base,携帯食料,持ち運び可能な食料,""{\""weight\"": 0.1, \""portable\"": true}"",""{\""weight\"": {\""max\"": 1.0}}"",""[\""携帯できる[TYPE]\"", \""[WEIGHT]kgの[TYPE]\""]""
mac_burger,food_portable,マックのチーズバーガー,マクドナルドのチーズバーガー,""{\""size\"": 0.3, \""brand\"": \""McDonald's\"", \""type\"": \""burger\""}"",""{\""size\"": {\""min\"": 0.2, \""max\"": 0.4}}"",""[\""[BRAND]の[TYPE]\"", \""[SIZE]サイズのハンバーガー\""]""";

            File.WriteAllText(Path.Combine(_testDataPath, "EntityTypes.csv"), entityTypesContent);

            // Entities.csv
            var entitiesContent = @"entity_id,entity_type_id,parent_entity_id,name,description,created_at,is_active
mac_burger_001,mac_burger,,誰々が食べていたマックのチーズバーガー,半分ほど食べられた状態,2024-01-15T10:30:00,true
mac_burger_002,mac_burger,,新品のマックのチーズバーガー,未開封の状態,2024-01-15T11:00:00,true
inactive_burger,mac_burger,,非アクティブなバーガー,テスト用,2024-01-15T12:00:00,false";

            File.WriteAllText(Path.Combine(_testDataPath, "Entities.csv"), entitiesContent);

            // Properties.csv
            var propertiesContent = @"entity_id,property_name,property_value,property_type,source,confidence,last_modified,notes
mac_burger_001,weight,0.12,Float,override,0.95,2024-01-15T10:30:00,食べかけのため軽量化
mac_burger_001,owner,誰々,String,override,0.9,2024-01-15T10:30:00,所有者情報
mac_burger_001,condition,食べかけ,String,override,1.0,2024-01-15T10:30:00,現在の状態
mac_burger_002,condition,新品,String,override,1.0,2024-01-15T11:00:00,未開封状態";

            File.WriteAllText(Path.Combine(_testDataPath, "Properties.csv"), propertiesContent);
        }

        [Test]
        public void LoadEntityTypesFromCsv_CompleteHierarchy_BuildsCorrectInheritance()
        {
            var csvPath = Path.Combine(_testDataPath, "EntityTypes.csv");
            _manager.LoadEntityTypesFromCsv(csvPath);

            // 3つのEntityTypeが読み込まれる
            Assert.AreEqual(3, _manager.EntityTypes.Count);

            // 継承関係の確認
            var foodBase = _manager.EntityTypes["food_base"];
            var foodPortable = _manager.EntityTypes["food_portable"];
            var macBurger = _manager.EntityTypes["mac_burger"];

            Assert.IsNull(foodBase.ParentTypeId);
            Assert.AreEqual("food_base", foodPortable.ParentTypeId);
            Assert.AreEqual("food_portable", macBurger.ParentTypeId);

            // 継承されたプロパティの確認
            Assert.IsTrue(foodPortable.DefaultProperties.ContainsKey("edible")); // 親から継承
            Assert.IsTrue(foodPortable.DefaultProperties.ContainsKey("portable")); // 自身のプロパティ

            Assert.IsTrue(macBurger.DefaultProperties.ContainsKey("edible")); // 祖父から継承
            Assert.IsTrue(macBurger.DefaultProperties.ContainsKey("portable")); // 親から継承
            Assert.IsTrue(macBurger.DefaultProperties.ContainsKey("brand")); // 自身のプロパティ
        }

        [Test]
        public void LoadEntitiesFromCsv_WithEntityTypes_CreatesEntitiesCorrectly()
        {
            // 先にEntityTypesを読み込み
            _manager.LoadEntityTypesFromCsv(Path.Combine(_testDataPath, "EntityTypes.csv"));
            
            // Entitiesを読み込み
            _manager.LoadEntitiesFromCsv(Path.Combine(_testDataPath, "Entities.csv"));

            // アクティブなEntityのみ読み込まれる（2個）
            Assert.AreEqual(2, _manager.Entities.Count);
            Assert.IsTrue(_manager.Entities.ContainsKey("mac_burger_001"));
            Assert.IsTrue(_manager.Entities.ContainsKey("mac_burger_002"));
            Assert.IsFalse(_manager.Entities.ContainsKey("inactive_burger"));

            // Entityのプロパティ確認
            var entity = _manager.Entities["mac_burger_001"];
            Assert.AreEqual("mac_burger", entity.TypeId);
            Assert.AreEqual("誰々が食べていたマックのチーズバーガー", entity.GetProperty("name").Value);
        }

        [Test]
        public void LoadPropertiesFromCsv_OverridesAndInheritance_WorksCorrectly()
        {
            // 全データを読み込み
            _manager.LoadEntityTypesFromCsv(Path.Combine(_testDataPath, "EntityTypes.csv"));
            _manager.LoadEntitiesFromCsv(Path.Combine(_testDataPath, "Entities.csv"));
            _manager.LoadPropertiesFromCsv(Path.Combine(_testDataPath, "Properties.csv"));

            var entity001 = _manager.Entities["mac_burger_001"];
            var entity002 = _manager.Entities["mac_burger_002"];

            // 上書きされたプロパティ
            Assert.AreEqual(0.12f, entity001.GetProperty("weight").Value);
            Assert.AreEqual("誰々", entity001.GetProperty("owner").Value);
            Assert.AreEqual("食べかけ", entity001.GetProperty("condition").Value);

            // 継承されたプロパティ（EntityTypeのデフォルト）
            Assert.AreEqual(0.3f, entity001.GetProperty("size").Value); // mac_burgerから
            Assert.AreEqual("McDonald's", entity001.GetProperty("brand").Value); // mac_burgerから
            Assert.AreEqual(true, entity001.GetProperty("edible").Value); // food_baseから

            // 別のEntityの状態確認
            Assert.AreEqual("新品", entity002.GetProperty("condition").Value);
            Assert.IsNull(entity002.GetProperty("owner")); // 設定されていない
        }

        [Test]
        public void FullIntegration_MacBurgerExample_ReproducesMemoTxtScenario()
        {
            // memo.txtの例を完全再現
            _manager.LoadEntityTypesFromCsv(Path.Combine(_testDataPath, "EntityTypes.csv"));
            _manager.LoadEntitiesFromCsv(Path.Combine(_testDataPath, "Entities.csv"));
            _manager.LoadPropertiesFromCsv(Path.Combine(_testDataPath, "Properties.csv"));

            var macBurger001 = _manager.Entities["mac_burger_001"];

            // memo.txtで説明された階層的継承の確認
            var expectedProperties = new[]
            {
                ("weight", 0.12f),      // 上書き（食べかけのため軽量化）
                ("size", 0.3f),         // 継承（mac_burgerから）
                ("brand", "McDonald's"), // 継承（mac_burgerから）
                ("portable", true),     // 継承（food_portableから）
                ("edible", true),       // 継承（food_baseから）
                ("owner", "誰々"),       // 追加プロパティ
                ("condition", "食べかけ") // 追加プロパティ
            };

            foreach (var (propName, expectedValue) in expectedProperties)
            {
                var property = macBurger001.GetProperty(propName);
                Assert.IsNotNull(property, $"Property '{propName}' should exist");
                Assert.AreEqual(expectedValue, property.Value, $"Property '{propName}' should have value '{expectedValue}'");
            }

            // 使用履歴の確認
            Assert.Greater(_manager.UsageHistory.Count, 0);
            Assert.IsTrue(_manager.UsageHistory.Any(u => u.EntityId == "mac_burger_001"));
        }

        [Test]
        public void ValidateAllData_CompleteDataset_PassesValidation()
        {
            _manager.LoadEntityTypesFromCsv(Path.Combine(_testDataPath, "EntityTypes.csv"));
            _manager.LoadEntitiesFromCsv(Path.Combine(_testDataPath, "Entities.csv"));
            _manager.LoadPropertiesFromCsv(Path.Combine(_testDataPath, "Properties.csv"));

            var errors = _manager.ValidateAllData();

            // 検証エラーがないことを確認
            Assert.AreEqual(0, errors.Count, $"Validation errors found: {string.Join(", ", errors)}");
        }

        [Test]
        public void EntitySearch_ByPropertyAndType_ReturnsCorrectResults()
        {
            _manager.LoadEntityTypesFromCsv(Path.Combine(_testDataPath, "EntityTypes.csv"));
            _manager.LoadEntitiesFromCsv(Path.Combine(_testDataPath, "Entities.csv"));
            _manager.LoadPropertiesFromCsv(Path.Combine(_testDataPath, "Properties.csv"));

            // 型による検索
            var macBurgers = _manager.FindEntitiesByType("mac_burger");
            Assert.AreEqual(2, macBurgers.Count);

            // プロパティによる検索
            var ownedBurgers = _manager.FindEntitiesByProperty("owner", "誰々");
            Assert.AreEqual(1, ownedBurgers.Count);
            Assert.AreEqual("mac_burger_001", ownedBurgers[0].Id);

            var newBurgers = _manager.FindEntitiesByProperty("condition", "新品");
            Assert.AreEqual(1, newBurgers.Count);
            Assert.AreEqual("mac_burger_002", newBurgers[0].Id);
        }
    }
}
