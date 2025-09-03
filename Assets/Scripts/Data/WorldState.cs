using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Data.Models;
using UnityEngine;

namespace NarrativeGen.Data
{
    /// <summary>
    /// Manages the global state of the narrative world, including entities and properties.
    /// </summary>
    public class WorldState
    {
        private readonly Dictionary<string, object> _properties = new Dictionary<string, object>();
        private readonly Dictionary<string, Entity> _entities = new Dictionary<string, Entity>();

        /// <summary>
        /// Register an entity in the world state.
        /// </summary>
        public void RegisterEntity(Entity entity)
        {
            if (entity != null)
            {
                _entities[entity.Id] = entity;
            }
        }

        /// <summary>
        /// Get an entity by ID.
        /// </summary>
        public Entity GetEntity(string entityId)
        {
            _entities.TryGetValue(entityId, out var entity);
            return entity;
        }

        /// <summary>
        /// Set a global property value.
        /// </summary>
        public void SetProperty(string key, object value)
        {
            _properties[key] = value;
        }

        /// <summary>
        /// Get a global property value.
        /// </summary>
        public object GetProperty(string key)
        {
            _properties.TryGetValue(key, out var value);
            return value;
        }

        /// <summary>
        /// Get a property as a float value.
        /// </summary>
        public float GetPropertyAsFloat(string key)
        {
            var value = GetPropertyValue(key);
            if (value != null && float.TryParse(value.ToString(), out float result))
            {
                return result;
            }
            return 0f;
        }

        /// <summary>
        /// Get a property as a boolean value.
        /// </summary>
        public bool GetPropertyAsBool(string key)
        {
            var value = GetPropertyValue(key);
            if (value != null && bool.TryParse(value.ToString(), out bool result))
            {
                return result;
            }
            return false;
        }

        /// <summary>
        /// Get all properties as a dictionary.
        /// </summary>
        public Dictionary<string, string> GetAllProperties()
        {
            var allProps = new Dictionary<string, string>();
            foreach(var p in _properties)
            {
                allProps[p.Key] = p.Value?.ToString() ?? "";
            }
            foreach(var e in _entities)
            {
                foreach(var p in e.Value.GetAllProperties())
                {
                    allProps[$"{e.Key}.{p.Key}"] = p.Value?.ToString() ?? "";
                }
            }
            return allProps;
        }

        /// <summary>
        /// Evaluates a condition string like "player.health>50" or "key=value".
        /// </summary>
        public bool EvaluateCondition(string condition)
        {
            if (string.IsNullOrWhiteSpace(condition)) return true;
            if (condition.Contains("||")) return condition.Split(new[] { "||" }, StringSplitOptions.None).Any(EvaluateCondition);
            if (condition.Contains("&&")) return condition.Split(new[] { "&&" }, StringSplitOptions.None).All(EvaluateCondition);

            var operators = new[] { ">=", "<=", "!=", "=", ">", "<" };
            string op = operators.FirstOrDefault(condition.Contains);

            if (op == null) return GetPropertyAsBool(condition.Trim());

            var parts = condition.Split(new[] { op }, 2, StringSplitOptions.None);
            var key = parts[0].Trim();
            var valueStr = parts[1].Trim();
            var propValue = GetPropertyValue(key);

            if (propValue == null) return false;

            if (float.TryParse(propValue.ToString(), out var propFloat) && float.TryParse(valueStr, out var valFloat))
            {
                switch (op)
                {
                    case ">": return propFloat > valFloat;
                    case "<": return propFloat < valFloat;
                    case ">=": return propFloat >= valFloat;
                    case "<=": return propFloat <= valFloat;
                    case "=": return Mathf.Approximately(propFloat, valFloat);
                    case "!=": return !Mathf.Approximately(propFloat, valFloat);
                }
            }

            switch (op)
            {
                case "=": return propValue.ToString().Equals(valueStr, StringComparison.OrdinalIgnoreCase);
                case "!=": return !propValue.ToString().Equals(valueStr, StringComparison.OrdinalIgnoreCase);
            }

            return false;
        }

        public object GetPropertyValue(string key)
        {
            if (key.Contains('.'))
            {
                var parts = key.Split('.', 2);
                var entity = GetEntity(parts[0]);
                return entity?.GetProperty<object>(parts[1]);
            }
            return GetProperty(key);
        }

        /// <summary>
        /// Increment a numeric property by the specified amount.
        /// </summary>
        public void IncrementProperty(string key, float value = 1.0f)
        {
            SetProperty(key, GetPropertyAsFloat(key) + value);
        }
    }
} 