using System;
using System.Collections.Generic;
using UnityEngine;
using NarrativeGen.Data;
using NarrativeGen.Data.Models;

namespace NarrativeGen.Logic
{
    /// <summary>
    /// 構文エンジンの基盤クラス
    /// 構文メモ.txt + memo.txt に基づく遡行検索エンジン
    /// </summary>
    public class SyntaxEngine : MonoBehaviour
    {
        #region Constants
        private const int c_MaxRecursionDepth = 10;
        #endregion

        #region Private Fields
        [SerializeField] private bool m_EnableDebugLog = false;
        private DatabaseManager m_DatabaseManager;
        private WorldState m_WorldState;
        private Dictionary<string, string> m_RecursiveDictionary;
        private Dictionary<string, int> m_RecursionDepthTracker;
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            InitializeEngine();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// 初期化
        /// </summary>
        public void Initialize(DatabaseManager databaseManager, WorldState worldState)
        {
            m_DatabaseManager = databaseManager;
            m_WorldState = worldState;
            LoadRecursiveDictionary();
        }

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
        public NarrativeResult StartNarrative(string startEventId = "START")
        {
            return new NarrativeResult
            {
                Text = ProcessText("システム初期化中..."),
                Type = NarrativeResult.ResultType.Text
            };
        }

        /// <summary>
        /// イベント実行
        /// </summary>
        public NarrativeResult ExecuteEvent(string eventId)
        {
            if (m_DatabaseManager == null)
            {
                return new NarrativeResult
                {
                    Text = "[システムエラー] データベースが初期化されていません",
                    Type = NarrativeResult.ResultType.Error
                };
            }

            var eventData = m_DatabaseManager.GetEvent(eventId);
            if (eventData == null)
            {
                return new NarrativeResult
                {
                    Text = $"[システムエラー] イベント '{eventId}' が見つかりません",
                    Type = NarrativeResult.ResultType.Error
                };
            }

            return new NarrativeResult
            {
                Text = ProcessText(eventData.Text ?? ""),
                Type = NarrativeResult.ResultType.Text
            };
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
        /// エンジンの初期化
        /// </summary>
        private void InitializeEngine()
        {
            m_RecursiveDictionary = new Dictionary<string, string>();
            m_RecursionDepthTracker = new Dictionary<string, int>();

            if (m_EnableDebugLog)
            {
                Debug.Log("SyntaxEngine initialized");
            }
        }

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
            if (m_EnableDebugLog)
            {
                Debug.LogWarning($"SyntaxEngine: Fallback processing for: {input}");
            }
            return input.Replace("[", "").Replace("]", "");
        }
        #endregion
    }
} 