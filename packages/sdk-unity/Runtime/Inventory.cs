using System.Collections.Generic;
using System.Linq;

namespace NarrativeGen
{
    /// <summary>
    /// Manages a collection of entities that can be added, removed, and queried.
    /// </summary>
    public class Inventory
    {
        private readonly Dictionary<string, Entity> entityMap;
        private readonly List<string> items;

        /// <summary>
        /// Initializes a new instance of the <see cref="Inventory"/> class.
        /// </summary>
        /// <param name="entities">The entities available in this inventory.</param>
        /// <param name="initialItems">The initial item IDs to add.</param>
        public Inventory(IEnumerable<Entity>? entities = null, IEnumerable<string>? initialItems = null)
        {
            entityMap = new Dictionary<string, Entity>(System.StringComparer.OrdinalIgnoreCase);
            if (entities != null)
            {
                foreach (var entity in entities)
                {
                    if (entity != null && !string.IsNullOrWhiteSpace(entity.Id))
                    {
                        entityMap[NormalizeId(entity.Id)] = entity;
                    }
                }
            }
            items = new List<string>();
            if (initialItems != null)
            {
                foreach (var id in initialItems)
                {
                    Add(id);
                }
            }
        }

        /// <summary>
        /// Adds an entity to the inventory by ID if available and not already present.
        /// </summary>
        /// <param name="id">The ID of the entity to add.</param>
        /// <returns>The added entity, or null if not available or already present.</returns>
        public Entity? Add(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            var key = NormalizeId(id);
            if (!entityMap.TryGetValue(key, out var entity)) return null;
            if (items.Any(storedId => NormalizeId(storedId) == key)) return entity;
            items.Add(entity.Id);
            return entity;
        }

        /// <summary>
        /// Removes an entity from the inventory by ID if present.
        /// </summary>
        /// <param name="id">The ID of the entity to remove.</param>
        /// <returns>The removed entity, or null if not present.</returns>
        public Entity? Remove(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            var key = NormalizeId(id);
            var index = items.FindIndex(storedId => NormalizeId(storedId) == key);
            if (index == -1) return null;
            var removedId = items[index];
            items.RemoveAt(index);
            return entityMap.TryGetValue(NormalizeId(removedId), out var entity) ? entity : null;
        }

        /// <summary>
        /// Checks if an entity is present in the inventory.
        /// </summary>
        /// <param name="id">The ID of the entity to check.</param>
        /// <returns>True if the entity is present; otherwise, false.</returns>
        public bool Has(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return false;
            var key = NormalizeId(id);
            return items.Any(storedId => NormalizeId(storedId) == key);
        }

        /// <summary>
        /// Lists all entities currently in the inventory.
        /// </summary>
        /// <returns>A list of entities.</returns>
        public List<Entity> List()
        {
            return items
                .Select(storedId => entityMap.TryGetValue(NormalizeId(storedId), out var entity) ? entity : null)
                .Where(entity => entity != null)
                .ToList()!;
        }

        /// <summary>
        /// Clears all items from the inventory.
        /// </summary>
        public void Clear()
        {
            items.Clear();
        }

        /// <summary>
        /// Returns the current inventory as a list of item IDs for serialization.
        /// </summary>
        /// <returns>A list of item IDs.</returns>
        public List<string> ToJSON()
        {
            return new List<string>(items);
        }

        private static string NormalizeId(string? id)
        {
            return id?.Trim().ToLowerInvariant() ?? string.Empty;
        }
    }
}