using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace NarrativeGen.Serialization
{
    /// <summary>
    /// Provides helpers for configuring JSON serialization across NarrativeGen components.
    /// </summary>
    public static class JsonSettings
    {
        /// <summary>
        /// Creates serializer settings with NarrativeGen converters registered.
        /// </summary>
        /// <returns>Configured <see cref="JsonSerializerSettings"/>.</returns>
        public static JsonSerializerSettings Create()
        {
            var s = new JsonSerializerSettings
            {
                MissingMemberHandling = MissingMemberHandling.Error,
                NullValueHandling = NullValueHandling.Ignore
            };
            s.Converters.Add(new ConditionConverter());
            s.Converters.Add(new EffectConverter());
            return s;
        }
    }

    /// <summary>
    /// Handles polymorphic serialization for condition types.
    /// </summary>
    public class ConditionConverter : JsonConverter
    {
        /// <inheritdoc />
        public override bool CanConvert(Type objectType) => typeof(Condition).IsAssignableFrom(objectType);

        /// <inheritdoc />
        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            var jo = JObject.Load(reader);
            var type = jo["type"]?.Value<string>() ?? string.Empty;
            Condition result = type switch
            {
                "flag" => new FlagCondition(),
                "resource" => new ResourceCondition(),
                "timeWindow" => new TimeWindowCondition(),
                _ => throw new JsonSerializationException($"Unknown condition type '{type}'")
            };
            serializer.Populate(jo.CreateReader(), result);
            return result;
        }

        /// <inheritdoc />
        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            if (value is null)
            {
                writer.WriteNull();
                return;
            }
            JObject.FromObject(value, serializer).WriteTo(writer);
        }
    }

    /// <summary>
    /// Handles polymorphic serialization for effect types.
    /// </summary>
    public class EffectConverter : JsonConverter
    {
        /// <inheritdoc />
        public override bool CanConvert(Type objectType) => typeof(Effect).IsAssignableFrom(objectType);

        /// <inheritdoc />
        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            var jo = JObject.Load(reader);
            var type = jo["type"]?.Value<string>() ?? string.Empty;
            Effect result = type switch
            {
                "setFlag" => new SetFlagEffect(),
                "addResource" => new AddResourceEffect(),
                "goto" => new GotoEffect(),
                _ => throw new JsonSerializationException($"Unknown effect type '{type}'")
            };
            serializer.Populate(jo.CreateReader(), result);
            return result;
        }

        /// <inheritdoc />
        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            if (value is null)
            {
                writer.WriteNull();
                return;
            }
            JObject.FromObject(value, serializer).WriteTo(writer);
        }
    }
}
