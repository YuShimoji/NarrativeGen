using System;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using NarrativeGen.Core.Data;
using NarrativeGen.Core.Engine;
using NarrativeGen.Core.Models;

namespace NarrativeGen.Core
{
    /// <summary>
    /// メインナラティブエンジン
    /// Unity非依存で動作する核心システム
    /// memo.txt + 構文メモ.txt の完全実装
    /// </summary>
    public class NarrativeEngine
    {
        #region Public Types
        public class NarrativeResult
        {
            public string Text { get; set; } = "";
            public string Speaker { get; set; } = "";
            public List<Choice> Choices { get; set; } = new List<Choice>();
            public string NextEventId { get; set; } = "";
            public bool HasError { get; set; } = false;
            public string ErrorMessage { get; set; } = "";
            public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();

            public bool HasText => !string.IsNullOrEmpty(Text);
            public bool HasChoices => Choices.Count > 0;
            public bool HasNextEvent => !string.IsNullOrEmpty(NextEventId);
        }

        public class Choice
        {
            public string Text { get; set; } = "";
            public string NextEventId { get; set; } = "";
            public Dictionary<string, object> Conditions { get; set; } = new Dictionary<string, object>();
        }
        #endregion

        #region Private Fields
        private readonly DataManager _dataManager;
        private readonly RecursiveResolver _recursiveResolver;
        private readonly CommandProcessor _commandProcessor;
        private readonly ILogger? _logger;
        private readonly Dictionary<string, object> _worldState;
        private readonly Random _random;
        #endregion

        #region Constructor
        public NarrativeEngine(string dataPath, ILogger? logger = null)
        {
            _logger = logger;
            _dataManager = new DataManager(dataPath, logger);
            _worldState = new Dictionary<string, object>();
            _random = new Random();

            // エンジンコンポーネントの初期化
            _recursiveResolver = new RecursiveResolver(_dataManager.RecursiveDictionary, logger);
            _commandProcessor = new CommandProcessor(logger);

            _logger?.LogInformation("NarrativeEngine initialized with data path: {DataPath}", dataPath);
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// エンジンの初期化
        /// </summary>
        public void Initialize()
        {
            try
            {
                _dataManager.LoadAllData();
                InitializeWorldState();
                ValidateConfiguration();
                
                _logger?.LogInformation("NarrativeEngine initialization completed successfully");
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to initialize NarrativeEngine");
                throw;
            }
        }

        /// <summary>
        /// ナラティブの開始
        /// </summary>
        public NarrativeResult StartNarrative(string startEventId = "START")
        {
            try
            {
                _logger?.LogDebug("Starting narrative with event: {EventId}", startEventId);
                return ProcessEvent(startEventId);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error starting narrative");
                return CreateErrorResult($"ナラティブの開始でエラーが発生しました: {ex.Message}");
            }
        }

        /// <summary>
        /// イベントの処理
        /// </summary>
        public NarrativeResult ProcessEvent(string eventId)
        {
            try
            {
                var eventData = _dataManager.GetEvent(eventId);
                if (eventData == null)
                {
                    return CreateErrorResult($"イベント '{eventId}' が見つかりません");
                }

                // 条件チェック
                if (!string.IsNullOrEmpty(eventData.Conditions) && !EvaluateConditions(eventData.Conditions))
                {
                    return CreateErrorResult($"イベント '{eventId}' の条件が満たされていません");
                }

                // テキスト処理パイプライン
                var processedText = ProcessTextPipeline(eventData.Text);

                var result = new NarrativeResult
                {
                    Text = processedText
                };

                // コマンド処理
                if (!string.IsNullOrEmpty(eventData.Commands))
                {
                    ProcessCommands(eventData.Commands, result);
                }

                _logger?.LogDebug("Event processed successfully: {EventId}", eventId);
                return result;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error processing event: {EventId}", eventId);
                return CreateErrorResult($"イベント処理中にエラーが発生しました: {ex.Message}");
            }
        }

        /// <summary>
        /// 選択肢の処理
        /// </summary>
        public NarrativeResult ProcessChoice(string choiceId)
        {
            // TODO: 選択肢処理の実装
            return ProcessEvent(choiceId);
        }

        /// <summary>
        /// 世界状態の設定
        /// </summary>
        public void SetWorldState(string key, object value)
        {
            _worldState[key] = value;
            _commandProcessor.SetVariable(key, value);
        }

        /// <summary>
        /// 世界状態の取得
        /// </summary>
        public T? GetWorldState<T>(string key, T? defaultValue = default)
        {
            if (_worldState.TryGetValue(key, out var value))
            {
                try
                {
                    return (T)Convert.ChangeType(value, typeof(T));
                }
                catch
                {
                    return defaultValue;
                }
            }
            return defaultValue;
        }

        /// <summary>
        /// Entityの作成（memo.txt準拠）
        /// </summary>
        public Entity CreateEntity(string id, string name, Dictionary<string, object>? properties = null)
        {
            return _dataManager.CreateEntity(id, name, properties);
        }

        /// <summary>
        /// 統計情報の取得
        /// </summary>
        public string GetStatistics()
        {
            return _dataManager.GetDataStatistics();
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// テキスト処理パイプライン
        /// 構文メモ.txt の処理順序を実装
        /// </summary>
        private string ProcessTextPipeline(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            var result = input;

            // 1. テキスト内コマンド処理
            result = _commandProcessor.ProcessCommands(result);

            // 2. 遡行検索処理（最後に実行）
            result = _recursiveResolver.ProcessText(result);

            return result;
        }

        /// <summary>
        /// コマンドの処理
        /// </summary>
        private void ProcessCommands(string commands, NarrativeResult result)
        {
            var commandLines = commands.Split(new[] { '\n', ';' }, StringSplitOptions.RemoveEmptyEntries);
            
            foreach (var command in commandLines)
            {
                var trimmedCommand = command.Trim();
                if (string.IsNullOrEmpty(trimmedCommand)) continue;

                ProcessSingleCommand(trimmedCommand, result);
            }
        }

        /// <summary>
        /// 単一コマンドの処理
        /// </summary>
        private void ProcessSingleCommand(string command, NarrativeResult result)
        {
            try
            {
                if (command.StartsWith("SET "))
                {
                    ProcessSetCommand(command);
                }
                else if (command.StartsWith("GOTO "))
                {
                    var targetEvent = command.Substring(5).Trim();
                    result.NextEventId = targetEvent;
                }
                else if (command.StartsWith("CHOICE "))
                {
                    ProcessChoiceCommand(command, result);
                }
                else
                {
                    _logger?.LogWarning("Unknown command: {Command}", command);
                }
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error processing command: {Command}", command);
            }
        }

        /// <summary>
        /// SETコマンドの処理
        /// </summary>
        private void ProcessSetCommand(string command)
        {
            // 例: SET player_name "太郎"
            var parts = command.Split(' ', 3);
            if (parts.Length >= 3)
            {
                var key = parts[1];
                var value = parts[2].Trim('"');
                SetWorldState(key, value);
                _logger?.LogDebug("Set world state: {Key} = {Value}", key, value);
            }
        }

        /// <summary>
        /// CHOICEコマンドの処理
        /// </summary>
        private void ProcessChoiceCommand(string command, NarrativeResult result)
        {
            // 例: CHOICE "選択肢1" event1
            var parts = command.Split('"');
            if (parts.Length >= 3)
            {
                var choiceText = parts[1];
                var targetEvent = parts[2].Trim();
                
                result.Choices.Add(new Choice
                {
                    Text = choiceText,
                    NextEventId = targetEvent
                });
            }
        }

        /// <summary>
        /// 条件の評価
        /// </summary>
        private bool EvaluateConditions(string conditions)
        {
            // TODO: より高度な条件評価システムの実装
            return true;
        }

        /// <summary>
        /// 世界状態の初期化
        /// </summary>
        private void InitializeWorldState()
        {
            foreach (var variable in _dataManager.Variables)
            {
                var defaultValue = ParseDefaultValue(variable.Value.DefaultValue, variable.Value.Type);
                SetWorldState(variable.Key, defaultValue);
            }

            _logger?.LogDebug("World state initialized with {Count} variables", _dataManager.Variables.Count);
        }

        /// <summary>
        /// デフォルト値のパース
        /// </summary>
        private object ParseDefaultValue(string value, string type)
        {
            try
            {
                return type.ToLower() switch
                {
                    "int" => int.Parse(value),
                    "float" => float.Parse(value),
                    "bool" => bool.Parse(value),
                    "string" => value,
                    _ => value
                };
            }
            catch
            {
                return value;
            }
        }

        /// <summary>
        /// 設定の検証
        /// </summary>
        private void ValidateConfiguration()
        {
            var issues = _dataManager.ValidateData();
            if (issues.Count > 0)
            {
                foreach (var issue in issues)
                {
                    _logger?.LogWarning("Configuration issue: {Issue}", issue);
                }
            }
        }

        /// <summary>
        /// エラー結果の作成
        /// </summary>
        private NarrativeResult CreateErrorResult(string message)
        {
            return new NarrativeResult
            {
                Text = message,
                HasError = true,
                ErrorMessage = message
            };
        }
        #endregion

        #region Entity-Property System (memo.txt Implementation)
        /// <summary>
        /// Entity間のプロパティ比較による違和感検出
        /// memo.txt のチーズバーガー例の実装
        /// </summary>
        public string DetectInconsistency(string observerId, string targetEntityId, string propertyKey)
        {
            try
            {
                var observer = _dataManager.GetEntity(observerId);
                var target = _dataManager.GetEntity(targetEntityId);

                if (observer == null || target == null)
                    return "";

                // 期待値の取得（観察者の知識から）
                var expectedValue = observer.GetProperty<float>($"expected_{propertyKey}");
                var actualValue = target.GetProperty<float>(propertyKey);
                var tolerance = observer.GetProperty<float>($"tolerance_{propertyKey}", 10.0f); // デフォルト10%

                if (expectedValue.HasValue && actualValue.HasValue)
                {
                    if (target.DetectInconsistency(
                        new Entity("expected", "期待値") { }, 
                        propertyKey, 
                        tolerance))
                    {
                        // 違和感を感じた時のテキスト生成
                        var inconsistencyTemplate = "[微妙に][大きい。] [本当に[{target_type}]だったのか？]";
                        inconsistencyTemplate = inconsistencyTemplate.Replace("{target_type}", target.Name);
                        return ProcessTextPipeline(inconsistencyTemplate);
                    }
                }

                return "";
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error detecting inconsistency");
                return "";
            }
        }

        /// <summary>
        /// 動的な事象Entityの生成
        /// memo.txt: 「責められたこと」のような体験もEntityとして記録
        /// </summary>
        public Entity CreateEventEntity(string description, Dictionary<string, object> properties)
        {
            var eventId = $"event_{DateTime.UtcNow.Ticks}";
            var eventEntity = CreateEntity(eventId, description, properties);
            
            // タイムスタンプ追加
            eventEntity.SetProperty("timestamp", DateTime.UtcNow);
            eventEntity.SetProperty("type", "event");
            
            _logger?.LogDebug("Created event entity: {Description}", description);
            return eventEntity;
        }
        #endregion
    }
} 