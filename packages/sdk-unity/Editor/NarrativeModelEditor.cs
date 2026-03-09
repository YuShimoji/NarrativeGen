#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using NarrativeGen.Runtime;

[CustomEditor(typeof(NarrativeModel))]
public class NarrativeModelEditor : Editor
{
    private NarrativeModel model;

    void OnEnable()
    {
        model = (NarrativeModel)target;
    }

    public override void OnInspectorGUI()
    {
        serializedObject.Update();

        EditorGUILayout.LabelField("Narrative Model Editor", EditorStyles.boldLabel);
        EditorGUILayout.Space();

        // Basic settings
        EditorGUILayout.PropertyField(serializedObject.FindProperty("modelName"));
        EditorGUILayout.PropertyField(serializedObject.FindProperty("startNodeId"));

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("Initial State", EditorStyles.boldLabel);

        // Flags
        EditorGUILayout.PropertyField(serializedObject.FindProperty("initialFlags"));

        // Resources
        EditorGUILayout.PropertyField(serializedObject.FindProperty("initialResources"));

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("Story Nodes", EditorStyles.boldLabel);

        // Nodes
        EditorGUILayout.PropertyField(serializedObject.FindProperty("nodes"));

        EditorGUILayout.Space();

        // Utility buttons
        if (GUILayout.Button("Validate Model"))
        {
            ValidateModel();
        }

        if (GUILayout.Button("Test Model"))
        {
            TestModel();
        }

        if (GUILayout.Button("Export to JSON"))
        {
            ExportToJson();
        }

        serializedObject.ApplyModifiedProperties();
    }

    private void ValidateModel()
    {
        var errors = new System.Collections.Generic.List<string>();

        // Check if start node exists
        if (string.IsNullOrEmpty(model.startNodeId))
        {
            errors.Add("Start node ID is not set");
        }
        else
        {
            bool startNodeExists = false;
            foreach (var node in model.nodes)
            {
                if (node.id == model.startNodeId)
                {
                    startNodeExists = true;
                    break;
                }
            }
            if (!startNodeExists)
            {
                errors.Add($"Start node '{model.startNodeId}' does not exist");
            }
        }

        // Check node references
        foreach (var node in model.nodes)
        {
            foreach (var choice in node.choices)
            {
                if (!string.IsNullOrEmpty(choice.targetNodeId))
                {
                    bool targetExists = false;
                    foreach (var targetNode in model.nodes)
                    {
                        if (targetNode.id == choice.targetNodeId)
                        {
                            targetExists = true;
                            break;
                        }
                    }
                    if (!targetExists)
                    {
                        errors.Add($"Node '{node.id}' choice '{choice.id}' targets non-existent node '{choice.targetNodeId}'");
                    }
                }
            }
        }

        if (errors.Count == 0)
        {
            EditorUtility.DisplayDialog("Validation", "Model is valid!", "OK");
        }
        else
        {
            EditorUtility.DisplayDialog("Validation Errors", string.Join("\n", errors), "OK");
        }
    }

    private void TestModel()
    {
        if (string.IsNullOrEmpty(model.startNodeId))
        {
            EditorUtility.DisplayDialog("Error", "Start node is not set", "OK");
            return;
        }

        var startNode = model.nodes.Find(n => n.id == model.startNodeId);
        if (startNode == null)
        {
            EditorUtility.DisplayDialog("Error", "Start node does not exist", "OK");
            return;
        }

        EditorUtility.DisplayDialog("Test Result",
            $"Start Node: {startNode.id}\nText: {startNode.text}\nChoices: {startNode.choices.Count}",
            "OK");
    }

    private void ExportToJson()
    {
        var path = EditorUtility.SaveFilePanel("Export JSON", "", model.name + ".json", "json");
        if (!string.IsNullOrEmpty(path))
        {
            try
            {
                var json = model.ToJson();
                System.IO.File.WriteAllText(path, json);
                EditorUtility.DisplayDialog("Success", "JSON exported successfully!", "OK");
            }
            catch (System.Exception e)
            {
                EditorUtility.DisplayDialog("Error", $"Export failed: {e.Message}", "OK");
            }
        }
    }
}
#endif
