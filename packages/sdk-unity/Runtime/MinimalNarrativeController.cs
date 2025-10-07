using System;
using System.Collections.Generic;
using UnityEngine;

namespace VastCore.NarrativeGen
{
    [AddComponentMenu("NarrativeGen/MinimalNarrativeController")]
    public class MinimalNarrativeController : MonoBehaviour
    {
        [Tooltip("Entities CSV TextAsset (id,brand,description)")]
        public TextAsset EntitiesCsv;

        [Tooltip("Target entity id to log")] public string TargetId = "mac_burger_001";

        private void OnEnable()
        {
            try
            {
                if (EntitiesCsv == null)
                {
                    Debug.LogWarning("[MinimalNarrativeController] EntitiesCsv is not assigned");
                    return;
                }

                var map = ParseEntitiesCsv(EntitiesCsv.text);
                if (map.TryGetValue(TargetId, out var ent))
                {
                    Debug.Log($"[MinimalNarrativeController] Entity '{TargetId}' brand: {ent.brand}");
                    Debug.Log($"[MinimalNarrativeController] Entity '{TargetId}' description: {ent.description}");
                }
                else
                {
                    Debug.LogWarning($"[MinimalNarrativeController] Entity id not found: {TargetId}");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[MinimalNarrativeController] Failed to parse Entities CSV: {ex.Message}");
            }
        }

        private static Dictionary<string, (string brand, string description)> ParseEntitiesCsv(string csv)
        {
            var result = new Dictionary<string, (string brand, string description)>();
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
            if (!colIndex.ContainsKey("id") || !colIndex.ContainsKey("brand") || !colIndex.ContainsKey("description"))
                throw new ArgumentException("Entities.csv must contain columns: id, brand, description");

            for (int i = 1; i < rows.Count; i++)
            {
                var row = rows[i];
                string id = SafeGet(row, colIndex["id"]).Trim();
                if (string.IsNullOrEmpty(id)) continue;
                string brand = SafeGet(row, colIndex["brand"]).Trim();
                string description = SafeGet(row, colIndex["description"]).Trim();
                result[id] = (brand, description);
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
