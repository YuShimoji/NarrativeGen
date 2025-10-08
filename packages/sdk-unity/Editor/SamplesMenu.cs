#if UNITY_EDITOR
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace VastCore.NarrativeGen.Editor
{
    public static class SamplesMenu
    {
        private const string SamplesRoot = "Assets/NarrativeGenSamples";
        private const string CsvPath = SamplesRoot + "/Entities.csv";
        private const string ScenePath = SamplesRoot + "/MinimalSample.unity";

        [MenuItem("NarrativeGen/Create Minimal Sample Scene")]
        public static void CreateMinimalSampleScene()
        {
            EnsureFolders();
            CreateCsvIfMissing();

            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            scene.name = "MinimalSample";

            var go = new GameObject("NarrativeGenController");
            var ctrl = go.AddComponent<VastCore.NarrativeGen.MinimalNarrativeController>();

            var csvAsset = AssetDatabase.LoadAssetAtPath<TextAsset>(CsvPath);
            if (csvAsset == null)
            {
                Debug.LogWarning($"[Samples] CSV asset not found at {CsvPath}. Creating a new one.");
                CreateCsvIfMissing();
                csvAsset = AssetDatabase.LoadAssetAtPath<TextAsset>(CsvPath);
            }
            ctrl.EntitiesCsv = csvAsset;
            ctrl.TargetId = "mac_burger_001";

            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.Refresh();
            EditorGUIUtility.PingObject(AssetDatabase.LoadAssetAtPath<SceneAsset>(ScenePath));
            Debug.Log("[Samples] Minimal sample scene created at: " + ScenePath);
        }

        private static void EnsureFolders()
        {
            if (!AssetDatabase.IsValidFolder("Assets/NarrativeGenSamples"))
            {
                AssetDatabase.CreateFolder("Assets", "NarrativeGenSamples");
            }
        }

        private static void CreateCsvIfMissing()
        {
            if (!File.Exists(CsvPath))
            {
                var csv = "id,brand,description\nmac_burger_001,MacBurger,これはおいしいチーズバーガーです\n";
                File.WriteAllText(CsvPath, csv, Encoding.UTF8);
                AssetDatabase.ImportAsset(CsvPath);
            }
        }
    }
}
#endif
