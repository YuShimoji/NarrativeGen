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

        // Event for text advance
        public event Action OnTextAdvance;
        // Event for retry (e.g., when start event is missing or data load failed)
        public event Action OnRetryRequested;

        private Button _textAdvanceButton;
        private Button _retryButton;
        
        void Start()
        {
            // Subscribe to NarrativeController events (Unity統合レイヤー)
            var narrativeController = FindFirstObjectByType<NarrativeGen.Unity.NarrativeController>();
            if (narrativeController != null)
            {
                narrativeController.OnShowChoices += ShowChoices;
                narrativeController.OnShowText += ShowText;
            }
            else
            {
                UnityEngine.Debug.LogError("NarrativeController not found in scene. UI will not receive narrative events.");
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

            // Setup a full-screen button for advancing text
            SetupTextAdvanceButton();
            // Prepare retry button (hidden by default)
            SetupRetryButton();
            
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
        
        /// <summary>
        /// Displays narrative text to the player.
        /// </summary>
        public void ShowText(string text)
        {
            if (narrativeText != null)
            {
                narrativeText.text = text;
                SetTextAdvanceActive(true);
                HideChoices();
                SetRetryActive(false);
                
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
        public void ShowChoices(List<string> choiceTexts)
        {
            SetTextAdvanceActive(false);
            HideChoices();
            SetRetryActive(false);

            if (choiceTexts == null || choiceTexts.Count == 0)
            {
                return;
            }
            
            if (choicesPanel != null)
            {
                choicesPanel.SetActive(true);
            }
            
            CreateChoiceButtons(choiceTexts);
        }
        
        /// <summary>
        /// Creates choice buttons for the given choices.
        /// </summary>
        void CreateChoiceButtons(List<string> choiceTexts)
        {
            for (int i = 0; i < choiceTexts.Count; i++)
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
                    buttonText.text = choiceTexts[i];
                }

                // Capture the choice index for the lambda
                int choiceIndex = i;
                
                button.onClick.AddListener(() => HandleChoiceClick(choiceIndex));
            }
        }
        
        /// <summary>
        /// Handles when a choice button is clicked.
        /// </summary>
        void HandleChoiceClick(int choiceIndex)
        {
            OnChoiceSelected?.Invoke(choiceIndex.ToString());
            
            SetTextAdvanceActive(false);
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

        private void SetupTextAdvanceButton()
        {
            // Find or create the button
            var existingButton = transform.Find("TextAdvanceButton");
            if (existingButton != null)
            {
                _textAdvanceButton = existingButton.GetComponent<Button>();
                if (_textAdvanceButton != null)
                {
                    UnityEngine.Debug.Log("Found existing TextAdvanceButton");
                    return;
                }
            }

            UnityEngine.Debug.Log("Creating new TextAdvanceButton");
            
            // Create the button as a child of this UIManager (which should be on the Canvas)
            GameObject buttonObj = new GameObject("TextAdvanceButton");
            buttonObj.transform.SetParent(transform, false);
            
            // Set up the RectTransform to cover the entire screen
            RectTransform rectTransform = buttonObj.AddComponent<RectTransform>();
            rectTransform.anchorMin = Vector2.zero;
            rectTransform.anchorMax = Vector2.one;
            rectTransform.sizeDelta = Vector2.zero;
            rectTransform.anchoredPosition = Vector2.zero;
            
            // Add required components
            Image image = buttonObj.AddComponent<Image>();
            image.color = new Color(0, 0, 0, 0.01f); // Very slight visibility for debugging
            
            _textAdvanceButton = buttonObj.AddComponent<Button>();
            _textAdvanceButton.onClick.AddListener(() => {
                UnityEngine.Debug.Log("TextAdvanceButton clicked");
                OnTextAdvance?.Invoke();
            });
            
            UnityEngine.Debug.Log($"TextAdvanceButton created and positioned at {rectTransform.anchoredPosition}");
        }

        private void SetTextAdvanceActive(bool isActive)
        {
            if (_textAdvanceButton != null)
            {
                _textAdvanceButton.gameObject.SetActive(isActive);
                UnityEngine.Debug.Log($"TextAdvanceButton active state set to: {isActive}");
            }
            else
            {
                UnityEngine.Debug.LogWarning("TextAdvanceButton is null when trying to set active state");
            }
        }

        private void SetRetryActive(bool isActive)
        {
            if (_retryButton != null)
            {
                _retryButton.gameObject.SetActive(isActive);
                UnityEngine.Debug.Log($"RetryButton active state set to: {isActive}");
            }
        }

        private void SetupRetryButton()
        {
            var existing = transform.Find("RetryButton");
            if (existing != null)
            {
                _retryButton = existing.GetComponent<UnityEngine.UI.Button>();
                if (_retryButton != null)
                {
                    _retryButton.gameObject.SetActive(false);
                    return;
                }
            }

            var buttonObj = new GameObject("RetryButton");
            buttonObj.transform.SetParent(transform, false);

            var rectTransform = buttonObj.AddComponent<RectTransform>();
            rectTransform.anchorMin = new Vector2(0.5f, 0.1f);
            rectTransform.anchorMax = new Vector2(0.5f, 0.1f);
            rectTransform.sizeDelta = new Vector2(240, 60);
            rectTransform.anchoredPosition = Vector2.zero;

            var image = buttonObj.AddComponent<UnityEngine.UI.Image>();
            image.color = new Color(0.2f, 0.2f, 0.2f, 0.6f);

            _retryButton = buttonObj.AddComponent<UnityEngine.UI.Button>();
            _retryButton.onClick.AddListener(() =>
            {
                UnityEngine.Debug.Log("RetryButton clicked");
                OnRetryRequested?.Invoke();
            });

            var labelObj = new GameObject("RetryLabel");
            labelObj.transform.SetParent(buttonObj.transform, false);
            var label = labelObj.AddComponent<TMPro.TextMeshProUGUI>();
            label.alignment = TMPro.TextAlignmentOptions.Center;
            label.fontSize = 24;
            label.text = "リトライ";

            var labelRect = label.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.sizeDelta = Vector2.zero;
            labelRect.anchoredPosition = Vector2.zero;

            _retryButton.gameObject.SetActive(false);
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
        /// Show error message to the player and present a retry action.
        /// </summary>
        public void ShowError(string message, string hint = null)
        {
            HideChoices();
            SetTextAdvanceActive(false);
            SetRetryActive(true);

            if (narrativeText != null)
            {
                var display = string.IsNullOrEmpty(hint) ? message : $"{message}\n\nヒント: {hint}";
                narrativeText.text = display;
            }
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