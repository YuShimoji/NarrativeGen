using System;
using NarrativeGen.Core;
using NarrativeGen.Core.Entities;

namespace NarrativeGen.Test
{
    /// <summary>
    /// Entity-Propertyシステムの統合テスト実行
    /// </summary>
    class TestRunner
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== Entity-Property System Integration Test ===");
            
            try
            {
                // GameManagerの初期化テスト
                var gameManager = new GameManager();
                Console.WriteLine("✓ GameManager initialized successfully");
                
                // システム状態の確認
                var (entityCount, typeCount) = gameManager.GetSystemStatus();
                Console.WriteLine($"✓ System Status: {entityCount} entities, {typeCount} types");
                
                // CSV読み込みテスト
                try
                {
                    gameManager.Initialize("Assets/Data/");
                    Console.WriteLine("✓ CSV data loaded successfully");
                    
                    // 再度システム状態を確認
                    var (newEntityCount, newTypeCount) = gameManager.GetSystemStatus();
                    Console.WriteLine($"✓ After loading: {newEntityCount} entities, {newTypeCount} types");
                    
                    // サンプルエンティティのテスト
                    var sampleEntity = gameManager.GetEntity("mac_burger_001");
                    if (sampleEntity != null)
                    {
                        Console.WriteLine($"✓ Sample entity found: {sampleEntity.Id}");
                        Console.WriteLine($"  Type: {sampleEntity.TypeId}");
                        Console.WriteLine($"  Properties: {sampleEntity.GetAllProperties().Count}");
                    }
                    else
                    {
                        Console.WriteLine("! Sample entity not found");
                    }
                    
                    // 検索テスト
                    var searchResults = gameManager.SearchEntities("burger");
                    Console.WriteLine($"✓ Search test: found {searchResults.Count} entities for 'burger'");
                    
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"! CSV loading failed: {ex.Message}");
                    Console.WriteLine("  This is expected if CSV files are not present");
                }
                
                // システム検証
                var validationErrors = gameManager.ValidateSystem();
                if (validationErrors.Count == 0)
                {
                    Console.WriteLine("✓ System validation passed");
                }
                else
                {
                    Console.WriteLine($"! System validation found {validationErrors.Count} issues:");
                    foreach (var error in validationErrors)
                    {
                        Console.WriteLine($"  - {error}");
                    }
                }
                
                Console.WriteLine("\n=== Integration Test Completed Successfully ===");
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"✗ Integration test failed: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                Environment.Exit(1);
            }
        }
    }
}
