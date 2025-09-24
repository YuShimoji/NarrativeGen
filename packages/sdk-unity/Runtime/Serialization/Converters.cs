using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace VastCore.NarrativeGen.Serialization
{
    public static class JsonSettings
    {
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

    public class ConditionConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => typeof(Condition).IsAssignableFrom(objectType);

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
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

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            JObject.FromObject(value, serializer).WriteTo(writer);
        }
    }

    public class EffectConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => typeof(Effect).IsAssignableFrom(objectType);

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
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

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            JObject.FromObject(value, serializer).WriteTo(writer);
        }
    }
}
