using System;
using System.Collections.Generic;

namespace VastCore.NarrativeGen
{
    [Serializable]
    public class Inventory
    {
        private readonly HashSet<string> _items = new HashSet<string>(StringComparer.Ordinal);

        public Inventory()
        {
        }

        public Inventory(IEnumerable<string> entries)
        {
            if (entries == null) return;
            foreach (var id in entries)
            {
                if (!string.IsNullOrEmpty(id))
                {
                    _items.Add(id);
                }
            }
        }

        public void AddItem(string entityId)
        {
            if (string.IsNullOrEmpty(entityId)) return;
            _items.Add(entityId);
        }

        public bool RemoveItem(string entityId)
        {
            if (string.IsNullOrEmpty(entityId)) return false;
            return _items.Remove(entityId);
        }

        public bool HasItem(string entityId)
        {
            if (string.IsNullOrEmpty(entityId)) return false;
            return _items.Contains(entityId);
        }

        public void Clear()
        {
            _items.Clear();
        }

        public string[] ToArray()
        {
            var arr = new string[_items.Count];
            _items.CopyTo(arr);
            return arr;
        }

        public int Count => _items.Count;
    }
}
