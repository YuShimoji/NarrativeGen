#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.Repositories;
using NarrativeGen.Domain.Services;
using NarrativeGen.Domain.ValueObjects;
using Xunit;

namespace NarrativeGen.Domain.Tests
{
    internal sealed class InMemoryEntityTypeRepository : IEntityTypeRepository
    {
        private readonly Dictionary<string, EntityType> _store = new Dictionary<string, EntityType>();

        public Task<EntityType?> GetByIdAsync(string id)
        {
            _store.TryGetValue(id, out var et);
            return Task.FromResult(et);
        }

        public Task<IEnumerable<EntityType>> GetAllAsync()
        {
            return Task.FromResult<IEnumerable<EntityType>>(_store.Values);
        }

        public Task<IEnumerable<EntityType>> GetChildTypesAsync(string parentTypeId)
        {
            var list = new List<EntityType>();
            foreach (var kv in _store)
            {
                if (kv.Value.ParentTypeId == parentTypeId)
                {
                    list.Add(kv.Value);
                }
            }
            return Task.FromResult<IEnumerable<EntityType>>(list);
        }

        public Task SaveAsync(EntityType entityType)
        {
            _store[entityType.Id] = entityType;
            return Task.CompletedTask;
        }

        public void Seed(params EntityType[] types)
        {
            foreach (var t in types) _store[t.Id] = t;
        }
    }

    public class EntityInheritanceServiceTests
    {
        [Fact]
        public async Task Direct_property_overrides_inherited()
        {
            var repo = new InMemoryEntityTypeRepository();
            var baseType = new EntityType("food", "食料");
            baseType.SetDefaultProperty("size", "M");

            var burger = new EntityType("burger", "バーガー", parentTypeId: "food");
            burger.SetDefaultProperty("brand", "McD");

            repo.Seed(baseType, burger);

            var svc = new EntityInheritanceService(repo);
            var e = new Entity("e1", "burger");
            e.SetProperty("size", "L");

            var size = await svc.GetPropertyWithInheritanceAsync(e, "size");
            Assert.NotNull(size);
            Assert.Equal("L", size!.Value);
            Assert.Equal(PropertySource.Direct, size.Source);

            var brand = await svc.GetPropertyWithInheritanceAsync(e, "brand");
            Assert.NotNull(brand);
            Assert.Equal("McD", brand!.Value);
            Assert.Equal(PropertySource.Inherited, brand.Source);
        }

        [Fact]
        public async Task Get_all_properties_with_inheritance_merges_values()
        {
            var repo = new InMemoryEntityTypeRepository();
            var baseType = new EntityType("food", "食料");
            baseType.SetDefaultProperty("edible", true);
            baseType.SetDefaultProperty("size", "S");

            var burger = new EntityType("burger", "バーガー", parentTypeId: "food");
            burger.SetDefaultProperty("brand", "McD");

            repo.Seed(baseType, burger);

            var svc = new EntityInheritanceService(repo);
            var e = new Entity("e2", "burger");
            e.SetProperty("size", "XL"); // override inherited

            var all = await svc.GetAllPropertiesWithInheritanceAsync(e);
            Assert.True(all.ContainsKey("edible"));
            Assert.True(all.ContainsKey("brand"));
            Assert.True(all.ContainsKey("size"));
            Assert.Equal("XL", all["size"].Value);
            Assert.Equal(true, all["edible"].Value);
            Assert.Equal("McD", all["brand"].Value);
        }
    }
}
