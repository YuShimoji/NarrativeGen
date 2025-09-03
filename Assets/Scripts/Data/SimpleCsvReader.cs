using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace NarrativeGen.Data
{
    /// <summary>
    /// CsvHelperの代替となるシンプルなCSVリーダー
    /// </summary>
    public static class SimpleCsvReader
    {
        /// <summary>
        /// CSVファイルを読み込んでDictionaryのリストとして返す
        /// </summary>
        public static List<Dictionary<string, string>> ReadCsvFile(string filePath)
        {
            var result = new List<Dictionary<string, string>>();
            
            try
            {
                if (!File.Exists(filePath))
                {
                    // CSV file not found
                    return result;
                }

                string[] lines = File.ReadAllLines(filePath);
                if (lines.Length == 0) return result;

                // ヘッダー行を取得
                string[] headers = ParseCsvLine(lines[0]);
                
                // データ行を処理
                for (int i = 1; i < lines.Length; i++)
                {
                    string line = lines[i].Trim();
                    if (string.IsNullOrEmpty(line)) continue;

                    string[] values = ParseCsvLine(line);
                    var row = new Dictionary<string, string>();
                    
                    for (int j = 0; j < headers.Length; j++)
                    {
                        string value = j < values.Length ? values[j] : "";
                        row[headers[j]] = value;
                    }
                    
                    result.Add(row);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error reading CSV file {filePath}: {ex.Message}", ex);
            }

            return result;
        }

        /// <summary>
        /// StreamingAssetsからCSVファイルを読み込み
        /// </summary>
        public static List<Dictionary<string, string>> ReadCsvFromStreamingAssets(string fileName)
        {
            string filePath = Path.Combine("StreamingAssets", "NarrativeData", fileName);
            return ReadCsvFile(filePath);
        }

        /// <summary>
        /// CSV行を解析（クォート対応）
        /// </summary>
        private static string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            bool inQuotes = false;
            string currentField = "";

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        // エスケープされたクォート
                        currentField += '"';
                        i++; // 次の文字をスキップ
                    }
                    else
                    {
                        // クォートの開始/終了
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == ',' && !inQuotes)
                {
                    // フィールドの区切り
                    result.Add(currentField.Trim());
                    currentField = "";
                }
                else
                {
                    currentField += c;
                }
            }

            // 最後のフィールドを追加
            result.Add(currentField.Trim());

            return result.ToArray();
        }

        /// <summary>
        /// 型安全なデータ取得
        /// </summary>
        public static T GetValue<T>(Dictionary<string, string> row, string columnName, T defaultValue = default(T))
        {
            if (!row.ContainsKey(columnName) || string.IsNullOrEmpty(row[columnName]))
            {
                return defaultValue;
            }

            try
            {
                string value = row[columnName];
                Type targetType = typeof(T);

                if (targetType == typeof(string))
                {
                    return (T)(object)value;
                }
                else if (targetType == typeof(int))
                {
                    return (T)(object)int.Parse(value);
                }
                else if (targetType == typeof(float))
                {
                    return (T)(object)float.Parse(value);
                }
                else if (targetType == typeof(bool))
                {
                    return (T)(object)bool.Parse(value);
                }
                else
                {
                    return (T)Convert.ChangeType(value, targetType);
                }
            }
            catch (Exception ex)
            {
                // Failed to convert value - returning default
                return defaultValue;
            }
        }
    }
} 