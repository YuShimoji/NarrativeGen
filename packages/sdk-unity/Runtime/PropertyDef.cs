using Newtonsoft.Json;

namespace NarrativeGen
{
    /// <summary>
    /// engine-ts の PropertyDef に対応。テンプレート展開では <see cref="DefaultValue"/> のみ使用。
    /// </summary>
    public sealed class PropertyDef
    {
        [JsonProperty("key")]
        public string? Key { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("defaultValue")]
        public object? DefaultValue { get; set; }
    }
}
