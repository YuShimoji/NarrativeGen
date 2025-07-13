using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace NarrativeGen.Data
{
    /// <summary>
    /// Manages entity descriptions and dynamic narrative generation.
    /// Handles the "dictionary" system for rich entity descriptions.
    /// </summary>
    public class EntityDescriptionSystem
    {
        /// <summary>
        /// Represents a complete description of an entity with various attributes.
        /// </summary>
        public class EntityDescription
        {
            public string Name { get; set; }
            public List<string> Attributes { get; set; }
            public List<string> States { get; set; }
            public List<string> Materials { get; set; }
            public List<string> Conditions { get; set; }
            public Dictionary<string, string> Properties { get; set; }
            public List<string> DescriptionHistory { get; set; }

            public EntityDescription()
            {
                Attributes = new List<string>();
                States = new List<string>();
                Materials = new List<string>();
                Conditions = new List<string>();
                Properties = new Dictionary<string, string>();
                DescriptionHistory = new List<string>();
            }
        }

        /// <summary>
        /// Represents different styles of narrative description.
        /// </summary>
        public enum NarrativeStyle
        {
            FirstPerson,    // 一人称
            SecondPerson,   // 二人称
            ThirdPerson,    // 三人称
            FreeIndirectSpeech // 自由間接話法
        }

        /// <summary>
        /// Represents different contexts for description generation.
        /// </summary>
        public enum DescriptionContext
        {
            SceneDescription,   // 情景描写
            ThoughtDescription, // 思考描写
            ActionDescription,  // 行動描写
            DialogueDescription // 対話描写
        }

        private readonly Dictionary<string, EntityDescription> _entityDescriptions;
        private readonly Dictionary<string, List<string>> _rhetoricDictionary;
        private readonly System.Random _random;

        public EntityDescriptionSystem()
        {
            _entityDescriptions = new Dictionary<string, EntityDescription>();
            _rhetoricDictionary = new Dictionary<string, List<string>>();
            _random = new System.Random();
            InitializeDefaultEntities();
        }

        /// <summary>
        /// Initializes default entities with rich descriptions.
        /// </summary>
        private void InitializeDefaultEntities()
        {
            // 窓の例
            RegisterEntity("窓", new EntityDescription
            {
                Name = "窓",
                Attributes = new List<string> { "古い", "木製の", "透明な", "薄汚れた" },
                States = new List<string> { "開いている", "割れた", "暫くの間誰も手を付けていない" },
                Materials = new List<string> { "木枠の", "ガラスの" },
                Conditions = new List<string> { "漆喰塗の白い壁にある" },
                Properties = new Dictionary<string, string>
                {
                    { "位置", "壁の上部" },
                    { "状態", "半開き" },
                    { "光", "薄暗い光が差し込む" }
                }
            });

            // 部屋の例
            RegisterEntity("部屋", new EntityDescription
            {
                Name = "部屋",
                Attributes = new List<string> { "薄暗い", "古い", "静かな", "涼しい" },
                States = new List<string> { "人気がない", "埃っぽい" },
                Materials = new List<string> { "石の", "木の床の" },
                Conditions = new List<string> { "奥まった場所にある" },
                Properties = new Dictionary<string, string>
                {
                    { "大きさ", "小さめ" },
                    { "照明", "自然光のみ" },
                    { "温度", "ひんやりとしている" }
                }
            });

            // ドアの例
            RegisterEntity("ドア", new EntityDescription
            {
                Name = "ドア",
                Attributes = new List<string> { "古い", "重い", "きしむ" },
                States = new List<string> { "半開き", "音を立てる" },
                Materials = new List<string> { "木製の", "鉄の取っ手の" },
                Conditions = new List<string> { "目の前にある" },
                Properties = new Dictionary<string, string>
                {
                    { "音", "きしんだ音" },
                    { "状態", "開いている" },
                    { "材質", "古い木材" }
                }
            });

            // レトリック辞書の初期化
            InitializeRhetoricDictionary();
        }

        /// <summary>
        /// Initializes the rhetoric dictionary for rich descriptions.
        /// </summary>
        private void InitializeRhetoricDictionary()
        {
            _rhetoricDictionary["気づく"] = new List<string>
            {
                "気づいた",
                "ふと気づいた",
                "ふと見ると気づいた",
                "何気なく見ると気づいた",
                "目を向けると気づいた"
            };

            _rhetoricDictionary["見る"] = new List<string>
            {
                "見えた",
                "目に入った",
                "視界に入った",
                "ふと見ると",
                "目を向けると"
            };

            _rhetoricDictionary["聞く"] = new List<string>
            {
                "聞こえた",
                "耳に入った",
                "音が響いた",
                "かすかに聞こえた",
                "遠くから聞こえた"
            };

            _rhetoricDictionary["思う"] = new List<string>
            {
                "思った",
                "考えた",
                "頭に浮かんだ",
                "ふと思った",
                "心の中で思った"
            };
        }

        /// <summary>
        /// Registers an entity description.
        /// </summary>
        public void RegisterEntity(string name, EntityDescription description)
        {
            _entityDescriptions[name] = description;
            UnityEngine.Debug.Log($"EntityDescriptionSystem - Registered entity: {name}");
        }

        /// <summary>
        /// Generates a dynamic description for an entity.
        /// </summary>
        public string GenerateEntityDescription(string entityName, DescriptionContext context = DescriptionContext.SceneDescription, NarrativeStyle style = NarrativeStyle.SecondPerson)
        {
            if (!_entityDescriptions.TryGetValue(entityName, out var description))
            {
                UnityEngine.Debug.LogWarning($"EntityDescriptionSystem - Entity '{entityName}' not found in descriptions.");
                return entityName;
            }

            var selectedAttributes = SelectRandomAttributes(description, 2, 3);
            var selectedStates = SelectRandomAttributes(description.States, 1, 2);
            var conditions = description.Conditions.FirstOrDefault() ?? "";

            var result = BuildDescription(entityName, selectedAttributes, selectedStates, conditions, context, style);

            // Record this description in history
            description.DescriptionHistory.Add(result);

            return result;
        }

        /// <summary>
        /// Selects random attributes from a list, avoiding recent usage.
        /// </summary>
        private List<string> SelectRandomAttributes(EntityDescription description, int minCount, int maxCount)
        {
            var availableAttributes = description.Attributes.Concat(description.Materials).ToList();
            return SelectRandomAttributes(availableAttributes, minCount, maxCount);
        }

        /// <summary>
        /// Selects random attributes from a list.
        /// </summary>
        private List<string> SelectRandomAttributes(List<string> attributes, int minCount, int maxCount)
        {
            if (attributes.Count == 0) return new List<string>();

            var count = Math.Min(attributes.Count, _random.Next(minCount, maxCount + 1));
            return attributes.OrderBy(x => _random.Next()).Take(count).ToList();
        }

        /// <summary>
        /// Builds a description string from components.
        /// </summary>
        private string BuildDescription(string entityName, List<string> attributes, List<string> states, string conditions, DescriptionContext context, NarrativeStyle style)
        {
            var result = "";

            // Add conditions/position
            if (!string.IsNullOrEmpty(conditions))
            {
                result += conditions;
            }

            // Add attributes
            if (attributes.Count > 0)
            {
                var attributeString = string.Join("", attributes);
                result += attributeString + entityName;
            }
            else
            {
                result += entityName;
            }

            // Add states
            if (states.Count > 0)
            {
                var stateString = string.Join("、", states);
                result += "は" + stateString + "状態だ";
            }

            // Apply style and context modifications
            result = ApplyNarrativeStyle(result, style, context);

            return result;
        }

        /// <summary>
        /// Applies narrative style to the description.
        /// </summary>
        private string ApplyNarrativeStyle(string description, NarrativeStyle style, DescriptionContext context)
        {
            switch (style)
            {
                case NarrativeStyle.FirstPerson:
                    return ApplyFirstPersonStyle(description, context);
                case NarrativeStyle.SecondPerson:
                    return ApplySecondPersonStyle(description, context);
                case NarrativeStyle.ThirdPerson:
                    return ApplyThirdPersonStyle(description, context);
                case NarrativeStyle.FreeIndirectSpeech:
                    return ApplyFreeIndirectSpeech(description, context);
                default:
                    return description;
            }
        }

        /// <summary>
        /// Applies first-person narrative style.
        /// </summary>
        private string ApplyFirstPersonStyle(string description, DescriptionContext context)
        {
            switch (context)
            {
                case DescriptionContext.ThoughtDescription:
                    return $"（{description}）";
                case DescriptionContext.SceneDescription:
                    return $"私は{description}のを見た。";
                default:
                    return description;
            }
        }

        /// <summary>
        /// Applies second-person narrative style.
        /// </summary>
        private string ApplySecondPersonStyle(string description, DescriptionContext context)
        {
            switch (context)
            {
                case DescriptionContext.ThoughtDescription:
                    return $"あなたは{description}と思った。";
                case DescriptionContext.SceneDescription:
                    return $"あなたは{description}を見ている。";
                default:
                    return description;
            }
        }

        /// <summary>
        /// Applies third-person narrative style.
        /// </summary>
        private string ApplyThirdPersonStyle(string description, DescriptionContext context)
        {
            switch (context)
            {
                case DescriptionContext.ThoughtDescription:
                    return $"彼は{description}と考えた。";
                case DescriptionContext.SceneDescription:
                    return $"そこには{description}があった。";
                default:
                    return description;
            }
        }

        /// <summary>
        /// Applies free indirect speech style.
        /// </summary>
        private string ApplyFreeIndirectSpeech(string description, DescriptionContext context)
        {
            switch (context)
            {
                case DescriptionContext.ThoughtDescription:
                    return $"{description}なのだろうか。";
                case DescriptionContext.SceneDescription:
                    return $"ふと見ると、{description}ことに気づいた。";
                default:
                    return description;
            }
        }

        /// <summary>
        /// Gets a random rhetoric variation for a word.
        /// </summary>
        public string GetRhetoricVariation(string word)
        {
            if (_rhetoricDictionary.TryGetValue(word, out var variations))
            {
                return variations[_random.Next(variations.Count)];
            }
            return word;
        }

        /// <summary>
        /// Gets all registered entities.
        /// </summary>
        public Dictionary<string, EntityDescription> GetAllEntities()
        {
            return new Dictionary<string, EntityDescription>(_entityDescriptions);
        }
    }
} 