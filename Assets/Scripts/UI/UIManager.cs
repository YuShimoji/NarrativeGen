using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using NarrativeGen.Data.Models;
using NarrativeGen.Core;
using System;
using UnityEngine.SceneManagement;

namespace NarrativeGen.UI
{
    /// <summary>
    /// Manages the user interface for the narrative system.
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI narrativeText;
        public GameObject choicesPanel;
        public GameObject choiceButtonPrefab;
        public TextMeshProUGUI debugText;
        public Button backToMenuButton;
        
        [Header("Settings")]
        public bool enableTextAdvance = false;
        
        private List<GameObject> _choiceButtons = new List<GameObject>();
        private List<Choice> _currentChoices = new List<Choice>();
        private TextClickHandler _textClickHandler;
        
        // Event sent to GameManager
        public event Action<string> OnChoiceSelected;

        // Event for text advance (can be internal)
        private event Action OnTextAdvance;
        
        void Start()
        {
            // Subscribe to GameManager events
            var gameManager = FindObjectOfType<GameManager>();
            if (gameManager != null)
            {
                gameManager.OnShowChoices += ShowChoices;
                gameManager.OnShowText += ShowText;
            }
            else
            {
                Debug.LogError("GameManager not found in scene. UI will not receive narrative events.");
            }

            // TextClickHandler setup
            if (narrativeText != null)
            {
                _textClickHandler = narrativeText.GetComponent<TextClickHandler>();
                if (_textClickHandler == null)
                {
                    _textClickHandler = narrativeText.gameObject.AddComponent<TextClickHandler>();
                }
                SetupInitialTextVariants();
            }

            // Back button setup
            if (backToMenuButton != null)
            {
                backToMenuButton.onClick.AddListener(OnBackToMenuClicked);
            }

            if (narrativeText != null)
            {
                narrativeText.text = "Entity推論ベースナラティブシステム\n初期化中...";
            }
            
            if (debugText != null)
            {
                debugText.text = "【Entity推論ナラティブエンジン】\n" +
                               "状態: 初期化中\n" +
                               "エンジンタイプ: 推論ベース\n" +
                               "機能: Entity自動生成\n" +
                               "──────────────\n" +
                               "推論ルール読み込み中...";
            }
        }
        
        void Update()
        {
            if (enableTextAdvance && Input.GetMouseButtonDown(0))
            {
                OnTextAdvance?.Invoke();
                enableTextAdvance = false;
            }
        }
        
        /// <summary>
        /// Displays narrative text to the player.
        /// </summary>
        public void ShowText(string speaker, string text)
        {
            if (narrativeText != null)
            {
                narrativeText.text = text;
                enableTextAdvance = true;
                HideChoices();
                
                // Add text variants for demonstration
                if (_textClickHandler != null)
                {
                    GenerateTextVariants(text);
                }
            }
        }

        /// <summary>
        /// Displays choices to the player.
        /// </summary>
        public void ShowChoices(string speaker, string text, List<Choice> choices)
        {
            if (narrativeText != null)
            {
                narrativeText.text = text;
            }
            
            enableTextAdvance = false;
            HideChoices();

            if (choices == null || choices.Count == 0)
            {
                return;
            }

            _currentChoices = new List<Choice>(choices);
            
            if (choicesPanel != null)
            {
                choicesPanel.SetActive(true);
            }
            
            CreateChoiceButtons(choices);
        }
        
        /// <summary>
        /// Creates choice buttons for the given choices.
        /// </summary>
        void CreateChoiceButtons(List<Choice> choices)
        {
            for (int i = 0; i < choices.Count; i++)
            {
                if (choiceButtonPrefab == null || choicesPanel == null)
                {
                    UnityEngine.Debug.LogError("Choice button prefab or choices panel is null");
                    continue;
                }
                
                GameObject buttonObj = Instantiate(choiceButtonPrefab, choicesPanel.transform);
                _choiceButtons.Add(buttonObj);
                
                // Get the button component and text
                Button button = buttonObj.GetComponent<Button>();
                TextMeshProUGUI buttonText = buttonObj.GetComponentInChildren<TextMeshProUGUI>();
                
                if (button == null)
                {
                    UnityEngine.Debug.LogError($"Button component not found on choice button {i}");
                    continue;
                }
                
                if (buttonText != null)
                {
                    buttonText.text = choices[i].Text;
                }

                // Capture the choice and index for the lambda
                int choiceIndex = i;
                Choice choice = choices[i];
                
                button.onClick.AddListener(() => HandleChoiceClick(choiceIndex));
            }
        }
        
        /// <summary>
        /// Handles when a choice button is clicked.
        /// </summary>
        void HandleChoiceClick(int choiceIndex)
        {
            if (choiceIndex >= 0 && choiceIndex < _currentChoices.Count)
            {
                var choice = _currentChoices[choiceIndex];
                OnChoiceSelected?.Invoke(choice.NextEventId);
            }
            
            HideChoices();
        }
        
        /// <summary>
        /// Hides all choice buttons.
        /// </summary>
        void HideChoices()
        {
            foreach (var button in _choiceButtons)
            {
                if (button != null)
                {
                    Destroy(button);
                }
            }
            _choiceButtons.Clear();
            _currentChoices.Clear();
            
            if (choicesPanel != null)
            {
                choicesPanel.SetActive(false);
            }
        }
        
        /// <summary>
        /// Gets the current choices being displayed.
        /// </summary>
        public List<Choice> GetCurrentChoices()
        {
            return _currentChoices;
        }

        private void SetupInitialTextVariants()
        {
            if (_textClickHandler != null)
            {
                var variants = new List<string>
                {
                    "Entity推論ベースナラティブシステム\n初期化中...",
                    "高度な構文解析エンジン\n起動中...",
                    "動的物語生成システム\n準備中...",
                    "インタラクティブ・ストーリー\nエンジン始動中..."
                };
                _textClickHandler.SetVariants(variants);
            }
        }

        private void OnBackToMenuClicked()
        {
            SceneManager.LoadScene("MenuScene");
        }

        private void GenerateTextVariants(string originalText)
        {
            if (_textClickHandler == null) return;
            
            var variants = new List<string> { originalText };
            
            // Simple text variation examples
            if (originalText.Contains("あなた"))
            {
                variants.Add(originalText.Replace("あなた", "プレイヤー"));
                variants.Add(originalText.Replace("あなた", "主人公"));
            }
            
            if (originalText.Contains("部屋"))
            {
                variants.Add(originalText.Replace("部屋", "空間"));
                variants.Add(originalText.Replace("部屋", "室内"));
            }
            
            if (originalText.Contains("見る"))
            {
                variants.Add(originalText.Replace("見る", "観察する"));
                variants.Add(originalText.Replace("見る", "眺める"));
            }
            
            _textClickHandler.SetVariants(variants);
        }

        /// <summary>
        /// Updates debug information display.
        /// </summary>
        public void UpdateDebugInfo(string currentEvent, string command, string reason, Dictionary<string, string> entityStates)
        {
            if (debugText == null) return;
            
            var debugInfo = $"【デバッグ情報】\n";
            debugInfo += $"現在のイベント: {currentEvent}\n";
            debugInfo += $"実行コマンド: {command}\n";
            debugInfo += $"遷移理由: {reason}\n\n";
            debugInfo += "【エンティティ状態】\n";
            
            if (entityStates != null)
            {
                foreach (var kvp in entityStates)
                {
                    debugInfo += $"{kvp.Key}: {kvp.Value}\n";
                }
            }
            
            debugText.text = debugInfo;
        }
        
        /// <summary>
        /// Shows CSV content information.
        /// </summary>
        public void ShowCSVInfo(string eventId, string csvRow)
        {
            if (debugText == null) return;
            
            var existingText = debugText.text;
            debugText.text = existingText + $"\n【CSV情報】\n行ID: {eventId}\n内容: {csvRow}\n";
        }
    }
}