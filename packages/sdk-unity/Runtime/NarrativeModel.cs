using System;
using System.Collections.Generic;

namespace NarrativeGen.Runtime
{
#if UNITY_5_3_OR_NEWER
    /// <summary>Main class for NarrativeGen models in Unity.</summary>
    [UnityEngine.CreateAssetMenu(fileName = "New Narrative Model", menuName = "NarrativeGen/Model")]
    public class NarrativeModel : UnityEngine.ScriptableObject
#else
    /// <summary>Main class for NarrativeGen models in Unity.</summary>
    public class NarrativeModel
#endif
    {
        /// <summary>Name of the narrative model.</summary>
        public string? modelName;
        /// <summary>ID of the starting node.</summary>
        public string? startNodeId;

        /// <summary>Initial flags for the narrative.</summary>
        public List<FlagEntry> initialFlags = new List<FlagEntry>();

        /// <summary>Initial resources for the narrative.</summary>
        public List<ResourceEntry> initialResources = new List<ResourceEntry>();

        /// <summary>List of nodes in the narrative.</summary>
        public List<NodeEntry> nodes = new List<NodeEntry>();

        /// <summary>Entry for a flag.</summary>
        [System.Serializable]
        public class FlagEntry
        {
            /// <summary>Key of the flag.</summary>
            public string? key;
            /// <summary>Value of the flag.</summary>
            public bool value;
        }

        /// <summary>Entry for a resource.</summary>
        [System.Serializable]
        public class ResourceEntry
        {
            /// <summary>Key of the resource.</summary>
            public string? key;
            /// <summary>Value of the resource.</summary>
            public float value;
        }

        /// <summary>Entry for a node.</summary>
        [System.Serializable]
        public class NodeEntry
        {
            /// <summary>ID of the node.</summary>
            public string? id;
            /// <summary>Text of the node.</summary>
            public string? text;
            /// <summary>List of choices for the node.</summary>
            public List<ChoiceEntry> choices = new List<ChoiceEntry>();
        }

        /// <summary>Entry for a choice.</summary>
        [System.Serializable]
        public class ChoiceEntry
        {
            /// <summary>ID of the choice.</summary>
            public string? id;
            /// <summary>Text of the choice.</summary>
            public string? text;
            /// <summary>Target node ID.</summary>
            public string? targetNodeId;
            /// <summary>List of conditions for the choice.</summary>
            public List<ConditionEntry> conditions = new List<ConditionEntry>();
            /// <summary>List of effects for the choice.</summary>
            public List<EffectEntry> effects = new List<EffectEntry>();
        }

        /// <summary>Entry for a condition.</summary>
        [System.Serializable]
        public class ConditionEntry
        {
            /// <summary>Type of the condition.</summary>
            public ConditionType type;
            /// <summary>Key for the condition.</summary>
            public string? key;
            /// <summary>Operator for resource conditions.</summary>
            public string? op;
            /// <summary>Value for the condition as string.</summary>
            public string? value;
        }

        /// <summary>Entry for an effect.</summary>
        [System.Serializable]
        public class EffectEntry
        {
            /// <summary>Type of the effect.</summary>
            public EffectType type;
            /// <summary>Key for the effect.</summary>
            public string? key;
            /// <summary>Value for the effect as string.</summary>
            public string? value;
        }

        /// <summary>Types of conditions.</summary>
        public enum ConditionType
        {
            /// <summary>Flag condition.</summary>
            Flag,
            /// <summary>Resource condition.</summary>
            Resource,
            /// <summary>Time window condition.</summary>
            TimeWindow
        }

        /// <summary>Types of effects.</summary>
        public enum EffectType
        {
            /// <summary>Set flag effect.</summary>
            SetFlag,
            /// <summary>Add resource effect.</summary>
            AddResource,
            /// <summary>Goto effect.</summary>
            Goto
        }

        /// <summary>Convert the model to JSON format for runtime use.</summary>
        /// <returns>JSON string representation of the model.</returns>
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
