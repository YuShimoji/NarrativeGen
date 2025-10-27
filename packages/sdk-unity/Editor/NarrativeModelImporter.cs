using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using NarrativeGen.Runtime;

public class NarrativeModelImporter : EditorWindow
{
    private TextAsset csvFile;
    private NarrativeModel targetModel;

    [MenuItem("NarrativeGen/Import CSV")]
    static void Init()
    {
        NarrativeModelImporter window = (NarrativeModelImporter)EditorWindow.GetWindow(typeof(NarrativeModelImporter));
        window.Show();
    }

    void OnGUI()
    {
        GUILayout.Label("CSV Import", EditorStyles.boldLabel);

        csvFile = (TextAsset)EditorGUILayout.ObjectField("CSV File", csvFile, typeof(TextAsset), false);
        targetModel = (NarrativeModel)EditorGUILayout.ObjectField("Target Model", targetModel, typeof(NarrativeModel), false);

        if (GUILayout.Button("Import CSV"))
        {
            if (csvFile == null)
            {
                EditorUtility.DisplayDialog("Error", "Please select a CSV file", "OK");
                return;
            }

            if (targetModel == null)
            {
                EditorUtility.DisplayDialog("Error", "Please select a target NarrativeModel", "OK");
                return;
            }

            ImportCsv(csvFile.text);
        }
    }

    private void ImportCsv(string csvText)
    {
        try
        {
            var lines = csvText.Split('\n');
            if (lines.Length == 0) return;

            var headers = ParseCsvLine(lines[0]);
            var idx = new Dictionary<string, int>();
            for (int i = 0; i < headers.Length; i++)
            {
                idx[headers[i].Trim().ToLower()] = i;
            }

            // Clear existing data
            targetModel.nodes.Clear();
            targetModel.initialFlags.Clear();
            targetModel.initialResources.Clear();

            var nodes = new Dictionary<string, NarrativeModel.NodeEntry>();

            // Process each line
            for (int i = 1; i < lines.Length; i++)
            {
                if (string.IsNullOrWhiteSpace(lines[i])) continue;

                var cells = ParseCsvLine(lines[i]);
                if (cells.Length <= idx.GetValueOrDefault("node_id", -1)) continue;

                var nodeId = cells[idx["node_id"]].Trim();
                if (string.IsNullOrEmpty(nodeId)) continue;

                // Create or get node
                if (!nodes.ContainsKey(nodeId))
                {
                    nodes[nodeId] = new NarrativeModel.NodeEntry { id = nodeId };
                    targetModel.nodes.Add(nodes[nodeId]);
                }

                var node = nodes[nodeId];

                // Set node text if provided
                if (idx.ContainsKey("node_text") && !string.IsNullOrEmpty(cells[idx["node_text"]]))
                {
                    node.text = cells[idx["node_text"]].Trim();
                }

                // Set start node
                if (i == 1 && string.IsNullOrEmpty(targetModel.startNodeId))
                {
                    targetModel.startNodeId = nodeId;
                }

                // Process choice
                if (idx.ContainsKey("choice_id") && !string.IsNullOrEmpty(cells[idx["choice_id"]]))
                {
                    var choice = new NarrativeModel.ChoiceEntry
                    {
                        id = cells[idx["choice_id"]].Trim(),
                        text = idx.ContainsKey("choice_text") ? cells[idx["choice_text"]].Trim() : "",
                        targetNodeId = idx.ContainsKey("choice_target") ? cells[idx["choice_target"]].Trim() : nodeId
                    };

                    node.choices.Add(choice);
                }

                // Process initial flags and resources (from first row)
                if (i == 1)
                {
                    if (idx.ContainsKey("initial_flags") && !string.IsNullOrEmpty(cells[idx["initial_flags"]]))
                    {
                        var flagsText = cells[idx["initial_flags"]].Trim();
                        ParseKeyValuePairs(flagsText, (key, value) =>
                        {
                            targetModel.initialFlags.Add(new NarrativeModel.FlagEntry { key = key, value = bool.Parse(value) });
                        });
                    }

                    if (idx.ContainsKey("initial_resources") && !string.IsNullOrEmpty(cells[idx["initial_resources"]]))
                    {
                        var resourcesText = cells[idx["initial_resources"]].Trim();
                        ParseKeyValuePairs(resourcesText, (key, value) =>
                        {
                            targetModel.initialResources.Add(new NarrativeModel.ResourceEntry { key = key, value = float.Parse(value) });
                        });
                    }
                }
            }

            EditorUtility.SetDirty(targetModel);
            AssetDatabase.SaveAssets();
            EditorUtility.DisplayDialog("Success", "CSV imported successfully!", "OK");
        }
        catch (System.Exception e)
        {
            EditorUtility.DisplayDialog("Error", $"Import failed: {e.Message}", "OK");
        }
    }

    private string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        string current = "";

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current += '"';
                    i++; // Skip next quote
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current);
                current = "";
            }
            else
            {
                current += c;
            }
        }

        result.Add(current);
        return result.ToArray();
    }

    private void ParseKeyValuePairs(string text, System.Action<string, string> callback)
    {
        var pairs = text.Split(';');
        foreach (var pair in pairs)
        {
            var parts = pair.Trim().Split('=');
            if (parts.Length == 2)
            {
                callback(parts[0].Trim(), parts[1].Trim());
            }
        }
    }
}
