using System.Collections.Generic;
using System.Linq;

namespace NarrativeGen.Data.Models
{
    public class Entity
    {
        public string Id { get; private set; }
        public Dictionary<string, object> Properties { get; private set; } = new Dictionary<string, object>();

        public Entity(string id)
        {
            Id = id;
        }

        public T GetProperty<T>(string key, T defaultValue = default)
        {
            if (Properties.TryGetValue(key, out var value) && value is T typedValue)
            {
                return typedValue;
            }
            return defaultValue;
        }

        public void SetProperty(string key, object value)
        {
            Properties[key] = value;
        }

        public Dictionary<string, string> GetAllProperties()
        {
            return Properties.ToDictionary(kvp => kvp.Key, kvp => kvp.Value?.ToString() ?? "");
        }
    }
} 