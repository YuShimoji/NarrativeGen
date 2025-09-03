#nullable enable
using System;
using Xunit;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Domain.Tests
{
    /// <summary>
    /// EntityTypeクラスの単体テスト - memo.txtの階層的継承検証
    /// </summary>
    public class EntityTypeTests
    {
        [Fact]
        public void EntityType_Constructor_ShouldCreateValidEntityType()
        {
            // Arrange & Act
            var entityType = new EntityType("food_item", "Food Item", "portable_food");

            // Assert
            Assert.Equal("food_item", entityType.Id);
            Assert.Equal("Food Item", entityType.Name);
            Assert.Equal("portable_food", entityType.ParentTypeId);
            Assert.True(entityType.HasParent);
        }

        [Fact]
        public void EntityType_WithoutParent_ShouldNotHaveParent()
        {
            // Arrange & Act
            var entityType = new EntityType("root_type", "Root Type");

            // Assert
            Assert.Null(entityType.ParentTypeId);
            Assert.False(entityType.HasParent);
        }

        [Fact]
        public void EntityType_SetDefaultProperty_ShouldStoreDefaultProperty()
        {
            // Arrange
            var entityType = new EntityType("portable_food", "Portable Food");

            // Act
            entityType.SetDefaultProperty("weight", 0.1);
            entityType.SetDefaultProperty("size", 0.1);

            // Assert
            var weightProperty = entityType.GetDefaultProperty("weight");
            Assert.NotNull(weightProperty);
            Assert.Equal(0.1, weightProperty.GetValue<double>());
            Assert.Equal(PropertySource.Default, weightProperty.Source);

            var allProperties = entityType.GetAllDefaultProperties();
            Assert.Equal(2, allProperties.Count);
        }

        [Fact]
        public void EntityType_GetDefaultProperty_ShouldReturnNullForNonExistent()
        {
            // Arrange
            var entityType = new EntityType("test_type", "Test Type");

            // Act
            var property = entityType.GetDefaultProperty("non_existent");

            // Assert
            Assert.Null(property);
        }

        [Theory]
        [InlineData(null, "Test Type")]
        [InlineData("test_id", null)]
        public void EntityType_Constructor_ShouldThrowForNullParameters(string? id, string? name)
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => new EntityType(id!, name!));
        }
    }
}
