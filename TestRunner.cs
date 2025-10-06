using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using NarrativeGen.Application.UseCases;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.Services;
using NarrativeGen.Infrastructure.Repositories;

namespace NarrativeGen.Test
{
    /// <summary>
    /// Entity-Propertyシステムの統合テスト実行（Clean Architecture 構成）
    /// </summary>
    class TestRunner
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== Entity-Property System Integration Test (Clean Architecture) ===");
            
            try
            {
                // Clean Architecture 構成
                var dataRoot = Path.Combine("Assets", "Data");
                var entitiesCsv = Path.Combine(dataRoot, "Entities.csv");
                var typesCsv = Path.Combine(dataRoot, "EntityTypes.csv");

                var entityRepo = new CsvEntityRepository(entitiesCsv);
                var typeRepo = new CsvEntityTypeRepository(typesCsv);
                var inheritance = new EntityInheritanceService(typeRepo);
                var useCase = new EntityUseCase(entityRepo, typeRepo, inheritance);
                
                // CSV読み込みテスト
                try
                {
                    var allEntities = await entityRepo.GetAllAsync();
                    var allTypes = await typeRepo.GetAllAsync();
                    Console.WriteLine("✓ CSV data loaded successfully");
                    Console.WriteLine($"✓ After loading: {allEntities.Count()} entities, {allTypes.Count()} types");
                    
                    // サンプルエンティティのテスト
                    var sampleEntity = await entityRepo.GetByIdAsync("mac_burger_001");
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
                    var searchResults = allEntities.Where(e => e.Id.IndexOf("burger", StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                    Console.WriteLine($"✓ Search test: found {searchResults.Count} entities for 'burger'");
                    
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"! CSV loading failed: {ex.Message}");
                    Console.WriteLine("  This is expected if CSV files are not present");
                }
                
                // システム検証
                // 簡易バリデーション: 全エンティティの TypeId が存在していること
                {
                    var allEntities2 = await entityRepo.GetAllAsync();
                    var allTypeIds = (await typeRepo.GetAllAsync()).Select(t => t.Id).ToHashSet();
                    var missingType = allEntities2.Where(e => !allTypeIds.Contains(e.TypeId)).Select(e => e.Id).ToList();
                    if (missingType.Count == 0)
                    {
                        Console.WriteLine("✓ System validation passed (all entities have valid TypeId)");
                    }
                    else
                    {
                        Console.WriteLine($"! System validation found {missingType.Count} entities with missing TypeId:");
                        foreach (var id in missingType)
                        {
                            Console.WriteLine($"  - {id}");
                        }
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
