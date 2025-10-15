using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace NarrativeGen
{
    [AddComponentMenu("NarrativeGen/MinimalNarrativeController")]
    public class MinimalNarrativeController : MonoBehaviour
    {
        [Tooltip("Entities CSV TextAsset (id,brand,description,cost)")]
        public TextAsset EntitiesCsv;

        [Tooltip("Root container that will receive instantiated choice buttons")]
        public RectTransform ChoicesRoot;

        [Tooltip("Template button cloned per available choice")]
        public Button ChoiceButtonPrefab;

        [Tooltip("Text element showing current session status")]
        public TextMeshProUGUI StatusText;

        [Tooltip("Text element displaying current session state snapshot")]
        public TextMeshProUGUI StateText;

        [Tooltip("Optional root for inventory item views")]
        public RectTransform? InventoryListRoot;

        [Tooltip("Optional prefab used to display inventory entries")]
        public InventoryListItemView? InventoryItemPrefab;

        private GameSession? _session;
        private NarrativeModel? _model;
        private readonly List<Button> _spawnedButtons = new();
        private readonly List<InventoryListItemView> _spawnedInventoryItems = new();

        private void OnEnable()
        {
            try
            {
                InitializeSession();
                RefreshChoices();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[MinimalNarrativeController] Initialization failed: {ex.Message}");
            }
        }

        private void OnDisable()
        {
            ClearButtons();
            ClearInventoryViews();
            _session = null;
            _model = null;
            if (StateText != null)
            {
                StateText.text = "状態表示: セッション未初期化";
            }
        }

        private void InitializeSession()
        {
            if (EntitiesCsv == null)
                throw new InvalidOperationException("EntitiesCsv is not assigned");
            if (ChoicesRoot == null)
                throw new InvalidOperationException("ChoicesRoot is not assigned");
            if (ChoiceButtonPrefab == null)
                throw new InvalidOperationException("ChoiceButtonPrefab is not assigned");
            if (StatusText == null)
                throw new InvalidOperationException("StatusText is not assigned");
            if (StateText == null)
                throw new InvalidOperationException("StateText is not assigned");

            var entities = ParseEntitiesCsv(EntitiesCsv.text).Values.ToList();
            if (entities.Count == 0)
                throw new InvalidOperationException("No entities parsed from CSV");

            _model = CreateSampleModel();
            _session = new GameSession(_model, entities);
            UpdateStatus("状態: セッション開始");
            UpdateStateView();
        }

        private void RefreshChoices()
        {
            if (_session == null)
            {
                UpdateStatus("状態: セッション未初期化");
                return;
            }

            ClearButtons();

            var choices = _session.GetAvailableChoices();
            if (choices.Count == 0)
            {
                UpdateStatus("状態: 利用可能な選択肢なし");
                UpdateStateView(choices);
                return;
            }

            foreach (var choice in choices)
            {
                var button = CreateChoiceButton(choice);
                var text = button.GetComponentInChildren<TextMeshProUGUI>();
                if (text != null)
                {
                    text.textWrappingMode = TextWrappingModes.NoWrap;
                    if (choice.Outcome != null)
                    {
                        text.text = $"{choice.Text}\n<size=16><color=#FFD966>{choice.Outcome.Type}: {choice.Outcome.Value}</color></size>";
                    }
                    else
                    {
                        text.text = choice.Text;
                    }
                }
                button.gameObject.SetActive(true);
                button.onClick.RemoveAllListeners();
                var choiceId = choice.Id;
                button.onClick.AddListener(() => HandleChoiceSelected(choiceId));
                _spawnedButtons.Add(button);
            }

            UpdateStateView(choices);
        }

        private void HandleChoiceSelected(string choiceId)
        {
            if (_session == null)
            {
                Debug.LogWarning("[MinimalNarrativeController] Session not initialized");
                return;
            }

            try
            {
                var state = _session.ApplyChoice(choiceId);
                Debug.Log($"[MinimalNarrativeController] Applied choice '{choiceId}'. Node={state.CurrentNodeId}, Time={state.Time}");
                if (_session.LastOutcome != null)
                {
                    Debug.Log($"[MinimalNarrativeController] Outcome: {_session.LastOutcome.Type} => {_session.LastOutcome.Value}");
                }
                UpdateStatus($"状態: 選択 '{choiceId}' を適用");
                RefreshChoices();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[MinimalNarrativeController] Failed to apply choice '{choiceId}': {ex.Message}");
            }
        }

        private void UpdateStatus(string message)
        {
            if (StatusText != null)
            {
                StatusText.text = message;
            }
        }

        private void ClearButtons()
        {
            foreach (var button in _spawnedButtons)
            {
                if (button == null) continue;
                button.onClick.RemoveAllListeners();
                DestroyImmediate(button.gameObject);
            }
            _spawnedButtons.Clear();
        }

        private void LogInventory()
        {
            if (_session == null) return;
            var inventory = _session.ListInventory();
            if (inventory.Count == 0)
            {
                Debug.Log("[MinimalNarrativeController] Inventory is empty");
                return;
            }

            foreach (var entity in inventory)
            {
                Debug.Log($"[MinimalNarrativeController] Inventory contains: {entity.Id} ({entity.Brand})");
            }
        }

        private void UpdateStateView(IReadOnlyList<Choice>? choices = null)
        {
            if (StateText == null)
                return;

            if (_session == null)
            {
                StateText.text = "状態表示: セッション未初期化";
                return;
            }

            var state = _session.State;
            var inventory = _session.ListInventory();
            var available = choices ?? _session.GetAvailableChoices();
            RefreshInventoryViews(inventory);
            var sb = new StringBuilder();
            sb.AppendLine($"ノード: {state.CurrentNodeId}");
            sb.AppendLine($"時間: {state.Time}");

            sb.AppendLine("インベントリ:");
            if (inventory.Count == 0)
            {
                sb.AppendLine("  (なし)");
            }
            else
            {
                foreach (var entity in inventory)
                {
                    sb.AppendLine($"  - {entity.Brand} [{entity.Id}]");
                }
            }

            if (_session.LastOutcome != null)
            {
                var outcome = _session.LastOutcome;
                sb.AppendLine($"直近の結果: {outcome.Type} -> {outcome.Value}");
            }

            sb.AppendLine("選択肢:");
            if (available.Count == 0)
            {
                sb.AppendLine("  (なし)");
            }
            else
            {
                foreach (var choice in available)
                {
                    if (choice.Outcome != null)
                    {
                        sb.AppendLine($"  - {choice.Text} ({choice.Outcome.Type}: {choice.Outcome.Value})");
                    }
                    else
                    {
                        sb.AppendLine($"  - {choice.Text}");
                    }
                }
            }

            StateText.text = sb.ToString();
        }

        private Button CreateChoiceButton(Choice choice)
        {
            if (ChoiceButtonPrefab != null)
            {
                var instance = Instantiate(ChoiceButtonPrefab, ChoicesRoot);
                instance.gameObject.name = $"Choice_{choice.Id}";
                return instance;
            }

            var buttonGo = new GameObject($"Choice_{choice.Id}", typeof(RectTransform), typeof(Image), typeof(Button));
            var rect = buttonGo.GetComponent<RectTransform>();
            rect.SetParent(ChoicesRoot, false);
            rect.anchorMin = new Vector2(0f, 1f);
            rect.anchorMax = new Vector2(1f, 1f);
            rect.pivot = new Vector2(0.5f, 1f);
            rect.sizeDelta = new Vector2(0f, 48f);

            var image = buttonGo.GetComponent<Image>();
            image.color = new Color(0.1f, 0.33f, 0.7f, 0.95f);

            if (!buttonGo.TryGetComponent<LayoutElement>(out var layout))
            {
                layout = buttonGo.AddComponent<LayoutElement>();
            }
            layout.minHeight = 48f;

            var textGo = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            var textRect = textGo.GetComponent<RectTransform>();
            textRect.SetParent(buttonGo.transform, false);
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;

            var text = textGo.GetComponent<TextMeshProUGUI>();
            text.fontSize = 20;
            text.alignment = TextAlignmentOptions.Center;
            text.color = Color.white;
            text.textWrappingMode = TextWrappingModes.NoWrap;
            text.text = choice.Text;

            return buttonGo.GetComponent<Button>();
        }

        private void RefreshInventoryViews(IReadOnlyList<Entity> inventory)
        {
            if (InventoryListRoot == null)
            {
                return;
            }

            if (InventoryItemPrefab == null)
            {
                ClearInventoryViews();
                return;
            }

            ClearInventoryViews();

            foreach (var entity in inventory)
            {
                var instance = Instantiate(InventoryItemPrefab, InventoryListRoot);
                instance.gameObject.name = $"Inventory_{entity.Id}";
                instance.Bind(entity);
                _spawnedInventoryItems.Add(instance);
            }
        }

        private void ClearInventoryViews()
        {
            foreach (var item in _spawnedInventoryItems)
            {
                if (item == null) continue;
                DestroyImmediate(item.gameObject);
            }
            _spawnedInventoryItems.Clear();
        }

        private static NarrativeModel CreateSampleModel()
        {
            var node = new Node
            {
                Id = "hub",
                Text = "メニューを選んでください",
                Choices = new List<Choice>
                {
                    new Choice
                    {
                        Id = "choose_burger",
                        Text = "チーズバーガーを食べる",
                        Target = "hub",
                        Outcome = new ChoiceOutcome { Type = "ADD_ITEM", Value = "mac_burger_001" }
                    },
                    new Choice
                    {
                        Id = "choose_coffee",
                        Text = "コーヒーを飲む",
                        Target = "hub",
                        Outcome = new ChoiceOutcome { Type = "ADD_ITEM", Value = "coffee_001" }
                    },
                    new Choice
                    {
                        Id = "discard",
                        Text = "アイテムを捨てる",
                        Target = "hub",
                        Outcome = new ChoiceOutcome { Type = "REMOVE_ITEM", Value = "mac_burger_001" }
                    }
                }
            };

            return new NarrativeModel
            {
                ModelType = "unity-sample",
                StartNode = node.Id,
                Nodes = new Dictionary<string, Node> { [node.Id] = node }
            };
        }

        private static Dictionary<string, Entity> ParseEntitiesCsv(string csv)
        {
            var result = new Dictionary<string, Entity>();
            if (string.IsNullOrWhiteSpace(csv)) return result;

            var lines = csv.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
            var rows = new List<string[]>();
            foreach (var l in lines)
            {
                var line = l?.Trim();
                if (string.IsNullOrEmpty(line)) continue;
                rows.Add(ParseCsvRow(line));
            }
            if (rows.Count == 0) return result;

            var header = rows[0];
            var colIndex = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < header.Length; i++)
            {
                colIndex[header[i]] = i;
            }
            if (!colIndex.ContainsKey("id") || !colIndex.ContainsKey("brand") || !colIndex.ContainsKey("description") || !colIndex.ContainsKey("cost"))
                throw new ArgumentException("Entities.csv must contain columns: id, brand, description, cost");

            for (int i = 1; i < rows.Count; i++)
            {
                var row = rows[i];
                string id = SafeGet(row, colIndex["id"]).Trim();
                if (string.IsNullOrEmpty(id)) continue;
                string brand = SafeGet(row, colIndex["brand"]).Trim();
                string description = SafeGet(row, colIndex["description"]).Trim();
                string rawCost = SafeGet(row, colIndex["cost"]).Trim();
                double cost = 0;
                if (!string.IsNullOrEmpty(rawCost))
                    double.TryParse(rawCost, NumberStyles.Any, CultureInfo.InvariantCulture, out cost);

                result[id] = new Entity
                {
                    Id = id,
                    Brand = brand,
                    Description = description,
                    Cost = cost,
                };
            }
            return result;
        }

        private static string SafeGet(string[] row, int idx)
        {
            return (idx >= 0 && idx < row.Length) ? row[idx] : string.Empty;
        }

        private static string[] ParseCsvRow(string row)
        {
            var list = new List<string>();
            bool inQuotes = false;
            var cur = new System.Text.StringBuilder();
            for (int i = 0; i < row.Length; i++)
            {
                char ch = row[i];
                if (inQuotes)
                {
                    if (ch == '"')
                    {
                        if (i + 1 < row.Length && row[i + 1] == '"')
                        {
                            cur.Append('"');
                            i++; // Skip escaped quote
                        }
                        else
                        {
                            inQuotes = false;
                        }
                    }
                    else
                    {
                        cur.Append(ch);
                    }
                }
                else
                {
                    if (ch == '"')
                    {
                        inQuotes = true;
                    }
                    else if (ch == ',')
                    {
                        list.Add(cur.ToString());
                        cur.Length = 0;
                    }
                    else
                    {
                        cur.Append(ch);
                    }
                }
            }
            list.Add(cur.ToString());
            return list.ToArray();
        }
    }
}
