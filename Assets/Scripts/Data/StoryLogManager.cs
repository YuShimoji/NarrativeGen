using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace NarrativeGen.Data
{
    /// <summary>
    /// ストーリーログと要約を管理するシステム
    /// </summary>
    public class StoryLogManager
    {
        #region Inner Classes
        /// <summary>
        /// ログエントリを表すクラス
        /// </summary>
        [System.Serializable]
        public class LogEntry
        {
            public DateTime Timestamp { get; set; }
            public string Speaker { get; set; }
            public string Text { get; set; }
            public LogEntryType Type { get; set; }
            public Dictionary<string, object> Metadata { get; set; }

            public LogEntry()
            {
                Timestamp = DateTime.Now;
                Metadata = new Dictionary<string, object>();
            }
        }

        /// <summary>
        /// ログエントリの種類
        /// </summary>
        public enum LogEntryType
        {
            Narrative,      // ナラティブテキスト
            Choice,         // 選択肢
            StateChange,    // 状態変更
            System         // システムメッセージ
        }
        #endregion

        #region Private Fields
        private readonly List<LogEntry> m_LogEntries;
        private readonly List<string> m_ImportantEvents;
        private readonly int m_MaxLogEntries = 1000;
        #endregion

        #region Constructor
        public StoryLogManager()
        {
            m_LogEntries = new List<LogEntry>();
            m_ImportantEvents = new List<string>();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// ナラティブテキストをログに記録
        /// </summary>
        public void LogNarrativeText(string speaker, string text)
        {
            var entry = new LogEntry
            {
                Speaker = speaker,
                Text = text,
                Type = LogEntryType.Narrative
            };
            
            AddLogEntry(entry);
            
            // 重要イベントの判定
            if (IsImportantEvent(text))
            {
                m_ImportantEvents.Add(text);
            }
        }

        /// <summary>
        /// 選択肢をログに記録
        /// </summary>
        public void LogChoice(string choiceText, string nextEventId)
        {
            var entry = new LogEntry
            {
                Speaker = "プレイヤー",
                Text = $"選択: {choiceText}",
                Type = LogEntryType.Choice
            };
            
            entry.Metadata["NextEventId"] = nextEventId;
            AddLogEntry(entry);
        }

        /// <summary>
        /// 状態変更をログに記録
        /// </summary>
        public void LogStateChange(string propertyName, object oldValue, object newValue)
        {
            var entry = new LogEntry
            {
                Speaker = "システム",
                Text = $"{propertyName}: {oldValue} → {newValue}",
                Type = LogEntryType.StateChange
            };
            
            entry.Metadata["PropertyName"] = propertyName;
            entry.Metadata["OldValue"] = oldValue;
            entry.Metadata["NewValue"] = newValue;
            
            AddLogEntry(entry);
        }

        /// <summary>
        /// システムメッセージをログに記録
        /// </summary>
        public void LogSystemMessage(string message)
        {
            var entry = new LogEntry
            {
                Speaker = "システム",
                Text = message,
                Type = LogEntryType.System
            };
            
            AddLogEntry(entry);
        }

        /// <summary>
        /// 全ログエントリを取得
        /// </summary>
        public List<LogEntry> GetLogEntries()
        {
            return new List<LogEntry>(m_LogEntries);
        }

        /// <summary>
        /// 特定タイプのログエントリを取得
        /// </summary>
        public List<LogEntry> GetLogEntries(LogEntryType type)
        {
            return m_LogEntries.Where(entry => entry.Type == type).ToList();
        }

        /// <summary>
        /// ストーリー要約を生成
        /// </summary>
        public string GenerateStorySummary()
        {
            var narrativeEntries = GetLogEntries(LogEntryType.Narrative);
            var choiceEntries = GetLogEntries(LogEntryType.Choice);
            
            if (narrativeEntries.Count == 0)
            {
                return "まだストーリーが開始されていません。";
            }

            var summary = "【ストーリー要約】\n\n";
            
            // 重要なイベントから要約を生成
            if (m_ImportantEvents.Count > 0)
            {
                summary += "主な出来事:\n";
                for (int i = 0; i < Math.Min(m_ImportantEvents.Count, 5); i++)
                {
                    summary += $"• {m_ImportantEvents[i]}\n";
                }
                summary += "\n";
            }
            
            // 最近の展開
            summary += "最近の展開:\n";
            var recentEntries = narrativeEntries.TakeLast(3).ToList();
            foreach (var entry in recentEntries)
            {
                string speaker = string.IsNullOrEmpty(entry.Speaker) ? "ナレーター" : entry.Speaker;
                summary += $"• {speaker}: {TruncateText(entry.Text, 50)}\n";
            }
            
            // 統計情報
            summary += $"\n進行状況:\n";
            summary += $"• 総テキスト数: {narrativeEntries.Count}\n";
            summary += $"• 選択回数: {choiceEntries.Count}\n";
            summary += $"• プレイ時間: {CalculatePlayTime()}\n";

            return summary;
        }

        /// <summary>
        /// ログをクリア
        /// </summary>
        public void ClearLog()
        {
            m_LogEntries.Clear();
            m_ImportantEvents.Clear();
        }

        /// <summary>
        /// ログをJSON形式でエクスポート
        /// </summary>
        public string ExportToJson()
        {
            try
            {
                return JsonUtility.ToJson(new SerializableLogData
                {
                    LogEntries = m_LogEntries.ToArray(),
                    ImportantEvents = m_ImportantEvents.ToArray()
                }, true);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to export log to JSON: {ex.Message}");
                return "{}";
            }
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// ログエントリを追加
        /// </summary>
        private void AddLogEntry(LogEntry entry)
        {
            m_LogEntries.Add(entry);
            
            // 最大エントリ数を超えた場合、古いものから削除
            if (m_LogEntries.Count > m_MaxLogEntries)
            {
                m_LogEntries.RemoveAt(0);
            }
        }

        /// <summary>
        /// 重要イベントかどうかを判定
        /// </summary>
        private bool IsImportantEvent(string text)
        {
            if (string.IsNullOrEmpty(text)) return false;
            
            // 重要キーワードをチェック
            string[] importantKeywords = 
            {
                "発見", "手に入れ", "開く", "閉じる", "話しかけ", "戦い",
                "勝利", "敗北", "死", "生", "決断", "選択", "終了", "完了"
            };
            
            return importantKeywords.Any(keyword => text.Contains(keyword));
        }

        /// <summary>
        /// テキストを指定文字数で切り詰め
        /// </summary>
        private string TruncateText(string text, int maxLength)
        {
            if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
                return text;
                
            return text.Substring(0, maxLength - 3) + "...";
        }

        /// <summary>
        /// プレイ時間を計算
        /// </summary>
        private string CalculatePlayTime()
        {
            if (m_LogEntries.Count == 0) return "0分";
            
            var firstEntry = m_LogEntries.First();
            var lastEntry = m_LogEntries.Last();
            var playTime = lastEntry.Timestamp - firstEntry.Timestamp;
            
            if (playTime.TotalHours >= 1)
            {
                return $"{(int)playTime.TotalHours}時間{playTime.Minutes}分";
            }
            else
            {
                return $"{(int)playTime.TotalMinutes}分";
            }
        }
        #endregion

        #region Serialization Helper
        /// <summary>
        /// シリアライゼーション用のデータクラス
        /// </summary>
        [System.Serializable]
        private class SerializableLogData
        {
            public LogEntry[] LogEntries;
            public string[] ImportantEvents;
        }
        #endregion
    }
} 