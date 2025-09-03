#nullable enable
using System;
using System.Collections.Generic;

namespace NarrativeGen.Tests
{
    /// <summary>
    /// シンプルなテストランナー - memo.txtの要件検証
    /// </summary>
    public class SimpleTestRunner
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("=== NarrativeGen Domain Layer Tests ===");
            Console.WriteLine();

            RunEntityTests();
            RunEntityTypeTests();
            RunPropertyValueTests();
            RunInheritanceScenarioTest();

            Console.WriteLine("=== All Tests Completed ===");
        }

        private static void RunEntityTests()
        {
            Console.WriteLine("--- Entity Tests ---");

            // Test 1: Entity作成
            var entity = new Entity("mac_burger_001", "food_item");
            Assert(entity.Id == "mac_burger_001", "Entity ID should be set correctly");
            Assert(entity.TypeId == "food_item", "Entity TypeId should be set correctly");

            // Test 2: プロパティ設定
            entity.SetProperty("weight", 0.12);
            entity.SetProperty("size", 0.3);
            Assert(entity.HasProperty("weight"), "Entity should have weight property");
            
            var weightProperty = entity.GetProperty("weight");
            Assert(weightProperty != null, "Weight property should not be null");
            Assert(weightProperty.GetValue<double>() == 0.12, "Weight value should be 0.12");
            Assert(weightProperty.Source == PropertySource.Direct, "Weight source should be Direct");

            // Test 3: 存在しないプロパティ
            var nonExistent = entity.GetProperty("non_existent");
            Assert(nonExistent == null, "Non-existent property should return null");

            // Test 4: 全プロパティ取得
            var allProperties = entity.GetAllProperties();
            Assert(allProperties.Count == 2, "Should have 2 properties");

            Console.WriteLine("✓ Entity tests passed");
        }

        private static void RunEntityTypeTests()
        {
            Console.WriteLine("--- EntityType Tests ---");

            // Test 1: EntityType作成（親なし）
            var rootType = new EntityType("portable_food", "Portable Food");
            Assert(rootType.Id == "portable_food", "EntityType ID should be set");
            Assert(rootType.Name == "Portable Food", "EntityType Name should be set");
            Assert(!rootType.HasParent, "Root type should not have parent");

            // Test 2: EntityType作成（親あり）
            var childType = new EntityType("mac_burger", "Mac Burger", "portable_food");
            Assert(childType.HasParent, "Child type should have parent");
            Assert(childType.ParentTypeId == "portable_food", "Parent ID should be set correctly");

            // Test 3: デフォルトプロパティ設定
            rootType.SetDefaultProperty("weight", 0.1);
            rootType.SetDefaultProperty("size", 0.1);

            var defaultWeight = rootType.GetDefaultProperty("weight");
            Assert(defaultWeight != null, "Default weight should not be null");
            Assert(defaultWeight.GetValue<double>() == 0.1, "Default weight should be 0.1");
            Assert(defaultWeight.Source == PropertySource.Default, "Default property source should be Default");

            Console.WriteLine("✓ EntityType tests passed");
        }

        private static void RunPropertyValueTests()
        {
            Console.WriteLine("--- PropertyValue Tests ---");

            // Test 1: PropertyValue作成
            var property = new PropertyValue(0.12, PropertySource.Direct);
            Assert(property.Value.Equals(0.12), "Property value should be 0.12");
            Assert(property.Source == PropertySource.Direct, "Property source should be Direct");

            // Test 2: 型安全な値取得
            var doubleValue = property.GetValue<double>();
            Assert(doubleValue == 0.12, "GetValue<double>() should return 0.12");

            // Test 3: 文字列プロパティ
            var stringProperty = new PropertyValue("test", PropertySource.Inherited);
            var stringValue = stringProperty.GetValue<string>();
            Assert(stringValue == "test", "String property should work correctly");

            Console.WriteLine("✓ PropertyValue tests passed");
        }

        private static void RunInheritanceScenarioTest()
        {
            Console.WriteLine("--- Inheritance Scenario Test (memo.txt) ---");

            // memo.txtのシナリオ: 携帯食料 → マックのチーズバーガー → 誰々が食べていた～
            
            // 1. 携帯食料タイプ（ルート）
            var portableFoodType = new EntityType("portable_food", "Portable Food");
            portableFoodType.SetDefaultProperty("weight", 0.1);
            portableFoodType.SetDefaultProperty("size", 0.1);

            // 2. マックのチーズバーガータイプ（子）
            var macBurgerType = new EntityType("mac_burger", "Mac Burger", "portable_food");
            macBurgerType.SetDefaultProperty("weight", 0.12);  // 親の値を上書き
            macBurgerType.SetDefaultProperty("size", 0.3);     // 親の値を上書き

            // 3. 具体的なインスタンス
            var specificBurger = new Entity("someone_ate_burger_001", "mac_burger");
            specificBurger.SetProperty("weight", 0.13);  // さらに具体的な値

            // 検証: 階層的な値の取得
            var directWeight = specificBurger.GetProperty("weight");
            Assert(directWeight != null, "Direct weight should exist");
            Assert(directWeight.GetValue<double>() == 0.13, "Direct weight should be 0.13");

            // サイズは設定していないので、タイプのデフォルト値が必要
            // （実際の継承サービスは後で実装）
            
            Console.WriteLine("✓ Inheritance scenario test structure verified");
        }

        private static void Assert(bool condition, string message)
        {
            if (!condition)
            {
                Console.WriteLine($"❌ FAILED: {message}");
                throw new Exception($"Test failed: {message}");
            }
        }
    }
}
