using System;
using System.Collections.Generic;
using NarrativeGen.Data;
using NarrativeGen.Data.Models;
using NarrativeGen.Logic;
using NarrativeGen.UI;
using UnityEngine;

namespace NarrativeGen.Core
{
    /// <summary>
    /// The main game manager that coordinates between the UI and logic systems.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private string m_StartEventID = "START";

        // Events for UI to subscribe to
        public event Action<string, string, List<Choice>> OnShowChoices;
        public event Action<string, string> OnShowText;
        
        private DatabaseManager _databaseManager;
        private SyntaxEngine _syntaxEngine;
        private Data.WorldState _worldState;
        private UIManager _uiManager;

        private void Awake()
        {
            // Find the UIManager and subscribe to its events
            _uiManager = FindObjectOfType<UIManager>();
            if (_uiManager != null)
            {
                _uiManager.OnChoiceSelected += HandleChoiceSelection;
            }
            else
                {
                Debug.LogError("UIManager not found in scene. Player choices will not be handled.");
            }
        }

        private void Start()
        {
            InitializeSystem();
            StartNarrative();
        }

        private void OnDestroy()
        {
            // Unsubscribe to prevent memory leaks
            if (_uiManager != null)
            {
                _uiManager.OnChoiceSelected -= HandleChoiceSelection;
            }
        }

        private void InitializeSystem()
        {
            _databaseManager = new DatabaseManager();
            _databaseManager.LoadAllData();

            _worldState = new Data.WorldState();
            InitializeWorldState();

            _syntaxEngine = FindObjectOfType<SyntaxEngine>();
            if (_syntaxEngine == null)
            {
                GameObject syntaxEngineObj = new GameObject("SyntaxEngine");
                _syntaxEngine = syntaxEngineObj.AddComponent<SyntaxEngine>();
            }
            _syntaxEngine.Initialize(_databaseManager, _worldState);
        }
        
        private void InitializeWorldState()
        {
            if (_databaseManager.Properties != null)
            {
                foreach (var property in _databaseManager.Properties.Values)
                {
                    _worldState.SetProperty(property.Name, property.DefaultValue);
                }
            }
            if (_databaseManager.EntityStates != null)
            {
                foreach (var entityState in _databaseManager.EntityStates.Values)
                {
                    var entity = new Entity(entityState.Id);
                    foreach (var kvp in entityState.Properties)
                    {
                        entity.SetProperty(kvp.Key, kvp.Value);
                    }
                    _worldState.RegisterEntity(entity);
                }
            }
            Debug.Log("WorldState initialized with data from DatabaseManager.");
        }

        private void StartNarrative()
        {
            var initialResult = _syntaxEngine.StartNarrative(m_StartEventID);
            ProcessNarrativeResult(initialResult);
        }

        private void HandleChoiceSelection(string nextEventId)
        {
            var nextResult = _syntaxEngine.ExecuteEvent(nextEventId);
            ProcessNarrativeResult(nextResult);
        }

        private void ProcessNarrativeResult(NarrativeResult result)
        {
            var currentResult = result;
            while (currentResult != null)
            {
                // --- Flow Control ---
                // 1. Handle chained commands first. They produce a new result to be processed.
                if (currentResult.HasChainedCommands)
                {
                    // TODO: SyntaxEngineにExecuteCommandsメソッドを実装する
                    // currentResult = _syntaxEngine.ExecuteCommands(currentResult.ChainedCommands);
                    currentResult = null; // 一時的に無効化
                    continue; // Continue the loop with the new result.
                }

                // 2. Handle GOTO event transitions. They also produce a new result.
                if (currentResult.HasNextEvent)
                {
                    currentResult = _syntaxEngine.ExecuteEvent(currentResult.NextEventId);
                    continue; // Continue the loop with the new result.
            }

                // --- UI Display (breaks the loop) ---
                // 3. If there are choices, display them and stop processing.
                if (currentResult.HasChoices)
            {
                    OnShowChoices?.Invoke(currentResult.Speaker, currentResult.Text, currentResult.Choices);
                    break; // Exit the loop, waiting for player input.
                }
                
                // 4. If there is only text, display it and stop processing.
                if (currentResult.HasText)
                {
                    OnShowText?.Invoke(currentResult.Speaker, currentResult.Text);
                    break; // Exit the loop, waiting for player input (or auto-advance).
                }

                // 5. If there's nothing to do, exit the loop.
                break;
            }
        }
        
        void UpdateDebugInfo(string currentEvent, string command, string reason)
        {
            if (_uiManager == null || _syntaxEngine == null) return;
            
            // Get current entity states
            var entityStates = new Dictionary<string, string>();
            var worldState = _syntaxEngine.GetWorldState();
            if (worldState != null)
            {
                var allProperties = worldState.GetAllProperties();
                foreach (var prop in allProperties)
        {
                    entityStates[prop.Key] = prop.Value;
                }
            }
            
            // Add syntax engine status
            entityStates["[システム] 構文エンジン"] = "有効";
            entityStates["[システム] エンジンタイプ"] = "遡行検索ベース";
            
            _uiManager.UpdateDebugInfo(currentEvent, command, reason, entityStates);
        }

        /// <summary>
        /// 構文エンジンモードの切り替え（テスト用）
        /// </summary>
        public void ToggleSyntaxMode()
        {
            if (_syntaxEngine != null)
            {
                // TODO: SyntaxEngineにモード切り替え機能を実装する
                UnityEngine.Debug.Log($"Syntax engine mode toggle requested");
            }
        }

        void OnTextAdvance()
        {
            // This method is now only for advancing text when there's no automatic next event.
            // The logic for pendingNextEventId is removed as GOTO is handled instantly.
            if (_uiManager != null)
            {
                // Potentially hide the "click to continue" prompt if needed
                // _uiManager.enableTextAdvance = false;
            }
        }

        private void Update()
        {
            // For features like reasoning mode toggle or other debug inputs
        }
    }
} 