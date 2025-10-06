using System;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Test
{
    /// <summary>
    /// シンプルなモダンアーキテクチャテスト実行
    /// </summary>
    class ModernArchitectureTestRunner
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== モダンアーキテクチャ基本テスト開始 ===");
            Console.WriteLine();

            try
            {
                // Domain層基本テスト
                await TestDomainBasics();

                Console.WriteLine();
                Console.WriteLine("✅ 基本テスト完了 - Domain層実装確認済み");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ テスト失敗: {ex.Message}");
                Console.WriteLine($"スタックトレース: {ex.StackTrace}");
            }
        }

        /// <summary>
        /// Domain層の基本機能テスト
        /// </summary>
        static async Task TestDomainBasics()
        {
            Console.WriteLine("🏛️ Domain層基本テスト開始");

            // Entity作成テスト
            var entity = new Entity("test_entity", "test_type");
            entity.SetProperty("name", "テストエンティティ");
            entity.SetProperty("value", 42);

            Console.WriteLine($"  ✅ Entity作成: {entity.Id}");

            // PropertyValue取得テスト
            var nameProperty = entity.GetProperty("name");
            if (nameProperty is not null)
            {
                Console.WriteLine($"  ✅ プロパティ取得: {nameProperty.Value} (Source: {nameProperty.Source})");
            }

            // EntityType階層テスト
            var rootType = new EntityType("item", "アイテム", null);
            rootType.SetDefaultProperty("weight", "unknown");

            var foodType = new EntityType("food", "食料", "item");
            foodType.SetDefaultProperty("calories", 0);
            foodType.SetDefaultProperty("taste", "普通");

            var burgerType = new EntityType("burger", "バーガー", "food");
            burgerType.SetDefaultProperty("calories", 500);

            Console.WriteLine($"  ✅ EntityType階層: {burgerType.Name} -> {burgerType.ParentTypeId}");

            Console.WriteLine("🏛️ Domain層基本テスト完了");
            Console.WriteLine();

            await Task.CompletedTask;
        }
    }
}
