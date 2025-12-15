using System;
using System.Collections.Generic;

namespace NarrativeGen.Runtime
{
#if UNITY_5_3_OR_NEWER
    [UnityEngine.CreateAssetMenu(fileName = "New Narrative Model", menuName = "NarrativeGen/Model")]
    public class NarrativeModel : UnityEngine.ScriptableObject
#else
    public class NarrativeModel
#endif
    {
#if UNITY_5_3_OR_NEWER
        [UnityEngine.Header("Model Settings")]
#endif
        public string modelName;
        public string startNodeId;

#if UNITY_5_3_OR_NEWER
        [UnityEngine.Header("Flags")]
#endif
        public List<FlagEntry> initialFlags = new List<FlagEntry>();

#if UNITY_5_3_OR_NEWER
        [UnityEngine.Header("Resources")]
#endif
        public List<ResourceEntry> initialResources = new List<ResourceEntry>();

#if UNITY_5_3_OR_NEWER
        [UnityEngine.Header("Nodes")]
#endif
        public List<NodeEntry> nodes = new List<NodeEntry>();

        [System.Serializable]
        public class FlagEntry
        {
            public string key;
            public bool value;
        }

        [System.Serializable]
        public class ResourceEntry
        {
            public string key;
            public float value;
        }

        [System.Serializable]
        public class NodeEntry
        {
            public string id;
#if UNITY_5_3_OR_NEWER
            [UnityEngine.TextArea(3, 10)]
#endif
            public string text;
            public List<ChoiceEntry> choices = new List<ChoiceEntry>();
        }

        [System.Serializable]
        public class ChoiceEntry
        {
            public string id;
#if UNITY_5_3_OR_NEWER
            [UnityEngine.TextArea(2, 3)]
#endif
            public string text;
            public string targetNodeId;
            public List<ConditionEntry> conditions = new List<ConditionEntry>();
            public List<EffectEntry> effects = new List<EffectEntry>();
        }

        [System.Serializable]
        public class ConditionEntry
        {
            public ConditionType type;
            public string key;
            public string op; // for resource conditions
            public string value; // string representation of value
        }

        [System.Serializable]
        public class EffectEntry
        {
            public EffectType type;
            public string key;
            public string value; // string representation of value
        }

        public enum ConditionType
        {
            Flag,
            Resource,
            TimeWindow
        }

        public enum EffectType
        {
            SetFlag,
            AddResource,
            Goto
        }

        // Convert to JSON format for runtime use
        public string ToJson()
        {
            var model = new
            {
                modelType = "adventure-playthrough",
                startNode = startNodeId,
                flags = GetFlagsDictionary(),
                resources = GetResourcesDictionary(),
                nodes = GetNodesDictionary()
            };

#if UNITY_5_3_OR_NEWER
            return UnityEngine.JsonUtility.ToJson(model);
#else
            throw new NotSupportedException("NarrativeModel.ToJson requires UnityEngine.JsonUtility (UNITY_5_3_OR_NEWER).\n");
#endif
        }

        private Dictionary<string, bool> GetFlagsDictionary()
        {
            var dict = new Dictionary<string, bool>();
            foreach (var flag in initialFlags)
            {
                dict[flag.key] = flag.value;
            }
            return dict;
        }

        private Dictionary<string, float> GetResourcesDictionary()
        {
            var dict = new Dictionary<string, float>();
            foreach (var resource in initialResources)
            {
                dict[resource.key] = resource.value;
            }
            return dict;
        }

        private Dictionary<string, object> GetNodesDictionary()
        {
            var dict = new Dictionary<string, object>();
            foreach (var node in nodes)
            {
                var nodeDict = new Dictionary<string, object>
                {
                    ["id"] = node.id,
                    ["text"] = node.text,
                    ["choices"] = GetChoicesList(node.choices)
                };
                dict[node.id] = nodeDict;
            }
            return dict;
        }

        private List<object> GetChoicesList(List<ChoiceEntry> choices)
        {
            var list = new List<object>();
            foreach (var choice in choices)
            {
                var choiceDict = new Dictionary<string, object>
                {
                    ["id"] = choice.id,
                    ["text"] = choice.text,
                    ["target"] = choice.targetNodeId,
                    ["conditions"] = GetConditionsList(choice.conditions),
                    ["effects"] = GetEffectsList(choice.effects)
                };
                list.Add(choiceDict);
            }
            return list;
        }

        private List<object> GetConditionsList(List<ConditionEntry> conditions)
        {
            var list = new List<object>();
            foreach (var condition in conditions)
            {
                var conditionDict = new Dictionary<string, object>();
                switch (condition.type)
                {
                    case ConditionType.Flag:
                        conditionDict["type"] = "flag";
                        conditionDict["key"] = condition.key;
                        conditionDict["value"] = bool.Parse(condition.value);
                        break;
                    case ConditionType.Resource:
                        conditionDict["type"] = "resource";
                        conditionDict["key"] = condition.key;
                        conditionDict["op"] = condition.op;
                        conditionDict["value"] = float.Parse(condition.value);
                        break;
                    case ConditionType.TimeWindow:
                        conditionDict["type"] = "timeWindow";
                        var parts = condition.value.Split('-');
                        conditionDict["start"] = int.Parse(parts[0]);
                        conditionDict["end"] = int.Parse(parts[1]);
                        break;
                }
                list.Add(conditionDict);
            }
            return list;
        }

        private List<object> GetEffectsList(List<EffectEntry> effects)
        {
            var list = new List<object>();
            foreach (var effect in effects)
            {
                var effectDict = new Dictionary<string, object>();
                switch (effect.type)
                {
                    case EffectType.SetFlag:
                        effectDict["type"] = "setFlag";
                        effectDict["key"] = effect.key;
                        effectDict["value"] = bool.Parse(effect.value);
                        break;
                    case EffectType.AddResource:
                        effectDict["type"] = "addResource";
                        effectDict["key"] = effect.key;
                        effectDict["delta"] = float.Parse(effect.value);
                        break;
                    case EffectType.Goto:
                        effectDict["type"] = "goto";
                        effectDict["target"] = effect.value;
                        break;
                }
                list.Add(effectDict);
            }
            return list;
        }
    }
}
