#nullable enable
using System;
using Xunit;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Domain.Tests
{
    /// <summary>
    /// Entityクラスの単体テスト - memo.txtの要件検証
    /// </summary>
    public class EntityTests
    {
        [Fact]
        public void Entity_Constructor_ShouldCreateValidEntity()
        {
            // Arrange & Act
            var entity = new Entity("mac_burger_001", "food_item");

            // Assert
            Assert.Equal("mac_burger_001", entity.Id);
            Assert.Equal("food_item", entity.TypeId);
        }

        [Fact]
        public void Entity_SetProperty_ShouldStoreProperty()
        {
            // Arrange
            var entity = new Entity("test_entity", "test_type");

            // Act
            entity.SetProperty("weight", 0.12);

            // Assert
            Assert.True(entity.HasProperty("weight"));
            var property = entity.GetProperty("weight");
            Assert.NotNull(property);
            Assert.Equal(0.12, property.GetValue<double>());
            Assert.Equal(PropertySource.Direct, property.Source);
        }

        [Fact]
        public void Entity_GetProperty_ShouldReturnNullForNonExistentProperty()
        {
            // Arrange
            var entity = new Entity("test_entity", "test_type");

            // Act
            var property = entity.GetProperty("non_existent");

            // Assert
            Assert.Null(property);
        }

        [Fact]
        public void Entity_GetAllProperties_ShouldReturnAllSetProperties()
        {
            // Arrange
            var entity = new Entity("test_entity", "test_type");
            entity.SetProperty("weight", 0.12);
            entity.SetProperty("size", 0.3);

            // Act
            var properties = entity.GetAllProperties();

            // Assert
            Assert.Equal(2, properties.Count);
            Assert.True(properties.ContainsKey("weight"));
            Assert.True(properties.ContainsKey("size"));
        }

        [Theory]
        [InlineData(null, "test_type")]
        [InlineData("test_id", null)]
        public void Entity_Constructor_ShouldThrowForNullParameters(string? id, string? typeId)
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => new Entity(id!, typeId!));
        }
    }
}
