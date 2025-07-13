using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UnityEngine;

namespace NarrativeGen.Parsing
{
    /// <summary>
    /// A simple CSV parser to handle narrative data.
    /// Assumes the first line is the header.
    /// </summary>
    public static class CsvParser
    {
        public static List<Dictionary<string, string>> Parse(string csvText)
        {
            var records = new List<Dictionary<string, string>>();
            var lines = Regex.Split(csvText, @"\r\n|\n|\r").Where(s => !string.IsNullOrWhiteSpace(s)).ToList();

            if (lines.Count < 2) return records;

            var headers = ParseLine(lines[0]);

            for (int i = 1; i < lines.Count; i++)
            {
                var values = ParseLine(lines[i]);
                if (values.Count > headers.Count)
                {
                    // Trim trailing empty fields that can result from a trailing comma
                    values = values.Take(headers.Count).ToList();
                }

                if (values.Count != headers.Count)
                {
                    UnityEngine.Debug.LogWarning($"CsvParser - Skipping malformed CSV line {i + 1}: Expected {headers.Count} columns, but found {values.Count}. Line: {lines[i]}");
                    continue;
                }

                var record = new Dictionary<string, string>();
                for (int j = 0; j < headers.Count; j++)
                {
                    record[headers[j]] = values[j];
                }
                records.Add(record);
            }
            return records;
        }

        private static List<string> ParseLine(string line)
        {
            var fields = new List<string>();
            var currentField = new StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (inQuotes)
                {
                    if (c == '"')
                    {
                        if (i + 1 < line.Length && line[i + 1] == '"')
                        {
                            currentField.Append('"');
                            i++;
                        }
                        else
                        {
                            inQuotes = false;
                        }
                    }
                    else
                    {
                        currentField.Append(c);
                    }
                }
                else
                {
                    if (c == '"')
                    {
                        inQuotes = true;
                    }
                    else if (c == ',')
                    {
                        fields.Add(currentField.ToString().Trim());
                        currentField.Clear();
                    }
                    else
                    {
                        currentField.Append(c);
                    }
                }
            }
            fields.Add(currentField.ToString().Trim());
            return fields;
        }
    }
} 