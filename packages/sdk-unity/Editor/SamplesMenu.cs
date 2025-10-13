#if UNITY_EDITOR
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;
using NarrativeGen;
using NarrativeGen.Runtime;

namespace NarrativeGen.Editor
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

            var controllerGo = new GameObject("NarrativeGenController");
            var controller = controllerGo.AddComponent<MinimalNarrativeController>();

            var csvAsset = AssetDatabase.LoadAssetAtPath<TextAsset>(CsvPath);
            if (csvAsset == null)
            {
                Debug.LogWarning($"[Samples] CSV asset not found at {CsvPath}. Creating a new one.");
                CreateCsvIfMissing();
                csvAsset = AssetDatabase.LoadAssetAtPath<TextAsset>(CsvPath);
            }
            controller.EntitiesCsv = csvAsset;

            var canvas = CreateCanvas();
            var panel = CreateChoicesPanel(canvas.transform);
            var status = CreateStatusText(panel.transform);
            var state = CreateStateText(panel.transform);
            var buttonTemplate = CreateChoiceButtonTemplate(panel.transform);
            buttonTemplate.gameObject.SetActive(false);

            controller.ChoicesRoot = panel.GetComponent<RectTransform>();
            controller.ChoiceButtonPrefab = buttonTemplate;
            controller.StatusText = status;
            controller.StateText = state;

            CreateEventSystemIfMissing();

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
                var csv =
                    "id,brand,description,cost\n" +
                    "mac_burger_001,MacBurger,これはおいしいチーズバーガーです,100\n" +
                    "coffee_001,CoffeeStand,香り高いコーヒーです,50\n";
                File.WriteAllText(CsvPath, csv, Encoding.UTF8);
                AssetDatabase.ImportAsset(CsvPath);
            }
        }

        private static GameObject CreateCanvas()
        {
            var canvasGo = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGo.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            var scaler = canvasGo.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);

            return canvasGo;
        }

        private static RectTransform CreateChoicesPanel(Transform parent)
        {
            var panelGo = new GameObject("ChoicesPanel", typeof(RectTransform), typeof(Image), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
            var rect = panelGo.GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.anchorMin = new Vector2(0.5f, 0f);
            rect.anchorMax = new Vector2(0.5f, 0f);
            rect.pivot = new Vector2(0.5f, 0f);
            rect.anchoredPosition = new Vector2(0f, 32f);
            rect.sizeDelta = new Vector2(360f, 0f);

            var image = panelGo.GetComponent<Image>();
            image.color = new Color(0f, 0f, 0f, 0.4f);

            var layout = panelGo.GetComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(16, 16, 16, 16);
            layout.spacing = 12f;
            layout.childForceExpandHeight = false;
            layout.childForceExpandWidth = true;

            var fitter = panelGo.GetComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;

            return rect;
        }

        private static TextMeshProUGUI CreateStatusText(Transform parent)
        {
            var textGo = new GameObject("StatusText", typeof(RectTransform), typeof(TextMeshProUGUI));
            var rect = textGo.GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.sizeDelta = new Vector2(0f, 60f);

            var text = textGo.GetComponent<TextMeshProUGUI>();
            text.fontSize = 24;
            text.alignment = TextAlignmentOptions.Midline;
            text.color = Color.white;
            text.textWrappingMode = TextWrappingModes.NoWrap;
            text.text = "状態: 初期化待ち";

            return text;
        }

        private static TextMeshProUGUI CreateStateText(Transform parent)
        {
            var textGo = new GameObject("StateText", typeof(RectTransform), typeof(TextMeshProUGUI));
            var rect = textGo.GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.sizeDelta = new Vector2(0f, 140f);

            var text = textGo.GetComponent<TextMeshProUGUI>();
            text.fontSize = 18;
            text.alignment = TextAlignmentOptions.TopLeft;
            text.color = Color.white;
            text.textWrappingMode = TextWrappingModes.NoWrap;
            text.text = "状態表示: 未更新";

            return text;
        }

        private static Button CreateChoiceButtonTemplate(Transform parent)
        {
            var buttonGo = new GameObject("ChoiceButtonTemplate", typeof(RectTransform), typeof(Image), typeof(Button), typeof(LayoutElement));
            var rect = buttonGo.GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.sizeDelta = new Vector2(0f, 48f);

            var image = buttonGo.GetComponent<Image>();
            image.color = new Color(0.1f, 0.33f, 0.7f, 0.95f);

            var layout = buttonGo.GetComponent<LayoutElement>();
            layout.minHeight = 48f;

            var textGo = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            var textRect = textGo.GetComponent<RectTransform>();
            textRect.SetParent(buttonGo.transform, false);
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;

            var text = textGo.GetComponent<TextMeshProUGUI>();
            text.fontSize = 20;
            text.alignment = TextAlignmentOptions.Center;
            text.color = Color.white;
            text.text = "選択肢";

            return buttonGo.GetComponent<Button>();
        }

        private static void CreateEventSystemIfMissing()
        {
            if (Object.FindFirstObjectByType<EventSystem>() != null) return;
            var eventSystemGo = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Object.DontDestroyOnLoad(eventSystemGo);
        }
    }
}
#endif
