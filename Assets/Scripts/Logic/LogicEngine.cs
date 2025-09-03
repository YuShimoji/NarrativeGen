using System;
using System.Collections.Generic;
using System.Linq;
using NarrativeGen.Data;
using NarrativeGen.Data.Models;
using Event = NarrativeGen.Data.Models.Event;
using NarrativeResult = NarrativeGen.Data.Models.NarrativeResult;
using Choice = NarrativeGen.Data.Models.Choice;

namespace NarrativeGen.Logic
{
    /// <summary>
    /// 構文エンジンの基盤クラス
    /// 構文メモ.txt + memo.txt に基づく遡行検索エンジン
    /// </summary>
    public class LogicEngine
    {
        #region Constants
        private const int c_MaxRecursionDepth = 10;
        #endregion

        #region Private Fields
        private readonly DatabaseManager m_DatabaseManager;
        private readonly WorldState m_WorldState;
        private readonly Dictionary<string, string> m_RecursiveDictionary;
        private Dictionary<string, int> m_RecursionDepthTracker;
        private int m_CurrentEventIndex = -1;
        #endregion

        #region Constructor
        public LogicEngine(DatabaseManager databaseManager, WorldState worldState)
        {
            m_DatabaseManager = databaseManager ?? throw new ArgumentNullException(nameof(databaseManager));
            m_WorldState = worldState ?? throw new ArgumentNullException(nameof(worldState));

            m_RecursiveDictionary = new Dictionary<string, string>();
            m_RecursionDepthTracker = new Dictionary<string, int>();

            LoadRecursiveDictionary();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// テキストを処理（遡行検索実行）
        /// </summary>
        public string ProcessText(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            m_RecursionDepthTracker = new Dictionary<string, int>();
            return ProcessRecursive(input);
        }

        /// <summary>
        /// 開始エントリポイント
        /// </summary>
        public NarrativeResult StartNarrative(string startEventId)
        {
            if (m_DatabaseManager == null)
            {
                var err = new NarrativeResult("System", "[システムエラー] データベースが初期化されていません");
                err.Type = NarrativeResult.ResultType.Error;
                return err;
            }
            m_CurrentEventIndex = m_DatabaseManager.GetEventIndexById(startEventId);
            if (m_CurrentEventIndex == -1)
            {
                var err = new NarrativeResult("System", $"[システムエラー] 開始イベント '{startEventId}' が見つかりません");
                err.Type = NarrativeResult.ResultType.Error;
                return err;
            }
            return ExecuteEventByIndex(m_CurrentEventIndex);
        }

        /// <summary>
        /// イベント実行
        /// </summary>
        public NarrativeResult ExecuteEventById(string eventId)
        {
            int index = m_DatabaseManager.GetEventIndexById(eventId);
            if (index == -1)
            {
                var err = new NarrativeResult("System", $"[システムエラー] イベント '{eventId}' が見つかりません");
                err.Type = NarrativeResult.ResultType.Error;
                return err;
            }
            m_CurrentEventIndex = index;
            return ExecuteEventByIndex(m_CurrentEventIndex);
        }

        public NarrativeResult AdvanceToNextEvent()
        {
            m_CurrentEventIndex++;
            return ExecuteEventByIndex(m_CurrentEventIndex);
        }

        private NarrativeResult ExecuteEventByIndex(int index)
        {
            if (m_DatabaseManager == null)
            {
                var err = new NarrativeResult("System", "[システムエラー] データベースが初期化されていません");
                err.Type = NarrativeResult.ResultType.Error;
                return err;
            }

            var eventData = m_DatabaseManager.GetEventByIndex(index);
            if (eventData == null)
            {
                return new NarrativeResult("System", ""); // 物語の終わり
            }

            // コマンド処理
            return ProcessCommands(eventData, index);
        }

        private NarrativeResult ProcessCommands(Event eventData, int currentIndex)
        {
            var commands = eventData.Commands;
            var text = eventData.Text;

            if (string.IsNullOrEmpty(commands))
            {
                return new NarrativeResult(eventData.Speaker, ProcessText(text ?? ""));
            }

            // 簡単なコマンドパーサー
            var commandParts = commands.Split('(');
            var command = commandParts[0].Trim().ToUpper();
            var args = commandParts.Length > 1 ? commandParts[1].TrimEnd(')').Split(',') : new string[0];

            switch (command)
            {
                case "CHOICE":
                    string choiceGroupId = args[0].Trim();
                    if (m_DatabaseManager.ChoiceGroups.TryGetValue(choiceGroupId, out var choiceDataList))
                    {
                        var choices = choiceDataList.Select(c => new Choice(c.Text, c.NextEventId)).ToList();
                        return new NarrativeResult(eventData.Speaker, ProcessText(text ?? ""), choices);
                    }
                    else
                    {
                        var err = new NarrativeResult("System", $"[システムエラー] 選択肢グループ '{choiceGroupId}' が見つかりません");
                        err.Type = NarrativeResult.ResultType.Error;
                        return err;
                    }

                case "SAY":
                    // SAYコマンドの処理（現在はテキスト表示のみ）
                    return new NarrativeResult(eventData.Speaker, ProcessText(text ?? ""));

                case "GOTO":
                    // GOTOはGameManager側で処理する想定だったが、ここで処理する方がシンプル
                    string nextEventId = args[0].Trim();
                    return ExecuteEventById(nextEventId);

                default:
                    return new NarrativeResult(eventData.Speaker, ProcessText(text ?? ""));
            }
        }

        private string GetNextEventId(int currentIndex)
        {
            int nextIndex = currentIndex + 1;
            if (nextIndex < m_DatabaseManager.Events.Count)
            {
                // 次のイベントのIDを返す。なければインデックスを文字列として返す
                return m_DatabaseManager.Events[nextIndex].Id ?? nextIndex.ToString();
            }
            return null; // 終端
        }

        /// <summary>
        /// WorldStateの取得
        /// </summary>
        public WorldState GetWorldState()
        {
            return m_WorldState;
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// 遡行検索辞書の読み込み
        /// TODO: NarrativeGen.Core.DataManagerとの統合
        /// </summary>
        private void LoadRecursiveDictionary()
        {
            // Unity StreamingAssetsから読み込み予定
            // 現在は一時的にサンプルデータを設定
            m_RecursiveDictionary["そこに置いてある"] = "そこの";
            m_RecursiveDictionary["傘"] = "古い傘";
            m_RecursiveDictionary["壊れ"] = "壊れかけ";
            m_RecursiveDictionary["今日は"] = "今日は";
            m_RecursiveDictionary["天気"] = "天気";
            m_RecursiveDictionary["お客様"] = "お客さん";
        }

        /// <summary>
        /// 遡行検索の実行
        /// 構文メモ.txt の核心: 「[～]が残っていれば更に遡って検索」
        /// </summary>
        private string ProcessRecursive(string input)
        {
            while (ContainsBrackets(input))
            {
                string term = ExtractFirstBracket(input);
                string resolved = DictionaryLookup(term);
                input = input.Replace($"[{term}]", resolved);

                // 循環参照・深度チェック
                if (DetectCircularReference(term) || ExceedsMaxDepth(term))
                {
                    return FallbackResolve(input);
                }
            }
            return input;
        }

        /// <summary>
        /// 括弧が含まれているかチェック
        /// </summary>
        private bool ContainsBrackets(string text)
        {
            return text.Contains('[') && text.Contains(']');
        }

        /// <summary>
        /// 最初の括弧内のテキストを抽出
        /// </summary>
        private string ExtractFirstBracket(string text)
        {
            int start = text.IndexOf('[');
            int end = text.IndexOf(']', start);
            if (start >= 0 && end > start)
            {
                return text.Substring(start + 1, end - start - 1);
            }
            return "";
        }

        /// <summary>
        /// 辞書検索
        /// </summary>
        private string DictionaryLookup(string term)
        {
            if (m_RecursiveDictionary.ContainsKey(term))
            {
                return m_RecursiveDictionary[term];
            }
            return term; // 見つからない場合は元のテキストを返す
        }

        /// <summary>
        /// 循環参照の検出
        /// </summary>
        private bool DetectCircularReference(string term)
        {
            if (!m_RecursionDepthTracker.ContainsKey(term))
            {
                m_RecursionDepthTracker[term] = 0;
            }
            m_RecursionDepthTracker[term]++;
            return m_RecursionDepthTracker[term] > 3;
        }

        /// <summary>
        /// 最大深度の確認
        /// </summary>
        private bool ExceedsMaxDepth(string term)
        {
            return m_RecursionDepthTracker.ContainsKey(term) && 
                   m_RecursionDepthTracker[term] > c_MaxRecursionDepth;
        }

        /// <summary>
        /// フォールバック処理
        /// </summary>
        private string FallbackResolve(string input)
        {
            return input.Replace("[", "").Replace("]", "");
        }
        #endregion
    }
}