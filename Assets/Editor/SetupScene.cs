using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using NarrativeGen.Core;
using NarrativeGen.Data;
using NarrativeGen.Logic;
using NarrativeGen.UI;
using System.IO;
using System.Linq;
using UnityEditor.Events; // Required for persistent listener

public class SetupScene
{
    private const string PREFAB_PATH = "Assets/Resources/DebugButton.prefab";

    [MenuItem("NarrativeGen/RUN FIRST: Full Scene Setup")]
    public static void Setup()
    {
        UnityEngine.Debug.Log("=== SetupScene.Setup() START ===");
        
        // List all GameObjects in the current scene for debugging
        var allGameObjects = GameObject.FindObjectsByType<GameObject>(FindObjectsSortMode.None);
        UnityEngine.Debug.Log($"Current scene has {allGameObjects.Length} GameObjects:");
        foreach (var go in allGameObjects)
        {
            UnityEngine.Debug.Log($"  - {go.name} (parent: {(go.transform.parent?.name ?? "none")})");
        }
        
        // Ensure the button prefab exists before we try to load it.
        CreateButtonPrefab();
        
        // --- Load Font ---
        var font = Resources.Load<TMP_FontAsset>("Fonts/Noto-sans_WebSubset SDF");
        if (font == null)
        {
            UnityEngine.Debug.LogError("Failed to load font 'Noto-sans_WebSubset SDF'. Make sure it's in a Resources/Fonts folder.");
            return;
        }

        // --- Clean up previous setup if any ---
        var canvas = GameObject.Find("UICanvas");
        if(canvas) Object.DestroyImmediate(canvas);
        var eventSystem = GameObject.Find("EventSystem");
        if(eventSystem) Object.DestroyImmediate(eventSystem);
        var system = GameObject.Find("System");
        if(system) Object.DestroyImmediate(system);
        var camera = GameObject.Find("Main Camera");
        if(camera) Object.DestroyImmediate(camera);

        // --- Basic Systems ---
        GameObject eventSystemGo = new GameObject("EventSystem", typeof(UnityEngine.EventSystems.EventSystem), typeof(UnityEngine.EventSystems.StandaloneInputModule));
        
        // Revised System GameObject creation to avoid duplicate components
        // and ensure correct dependency injection.
        GameObject systemGo = new GameObject("System");
        var gameManager = systemGo.AddComponent<GameManager>();
        var uiManager = systemGo.AddComponent<UIManager>();
        
        // GameManager will automatically find UIManager in Awake()
        UnityEngine.Debug.Log("GameManager will auto-detect UIManager on scene start...");

        // --- Main Camera ---
        GameObject cameraGo = new GameObject("Main Camera", typeof(Camera));
        Camera mainCamera = cameraGo.GetComponent<Camera>();
        mainCamera.clearFlags = CameraClearFlags.SolidColor;
        mainCamera.backgroundColor = new Color(0.1f, 0.1f, 0.1f);

        // --- UI Canvas ---
        GameObject canvasGo = new GameObject("UICanvas");
        canvasGo.AddComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGo.AddComponent<CanvasScaler>();
        canvasGo.AddComponent<GraphicRaycaster>();
        
        // --- Narrative UI Panel ---
        GameObject panelGo = CreatePanel(canvasGo.transform, "NarrativePanel", new Vector2(0, 0), new Vector2(1, 0.35f));
        
        TextMeshProUGUI speakerText = CreateText(panelGo.transform, "SpeakerNameText", "話者名", 22, FontStyles.Bold, TextAlignmentOptions.TopLeft, new Vector2(25, -10), font, new Vector2(0,1));
        TextMeshProUGUI narrativeText = CreateText(panelGo.transform, "NarrativeText", "ここに物語のテキストが表示されます。", 18, FontStyles.Normal, TextAlignmentOptions.TopLeft, Vector2.zero, font);
        
        // --- Fix for NarrativeText Layout ---
        RectTransform narrativeRect = narrativeText.GetComponent<RectTransform>();
        narrativeRect.anchorMin = new Vector2(0, 0); // Stretch from bottom-left
        narrativeRect.anchorMax = new Vector2(1, 1); // Stretch to top-right
        narrativeRect.pivot = new Vector2(0.5f, 0.5f); // Center pivot for stretching
        narrativeRect.sizeDelta = Vector2.zero; // Reset sizeDelta when stretching - CRITICAL for proper layout
        
        // Set padding: left:25, right:25, bottom:100(for choices), top:50(for speaker)
        narrativeRect.offsetMin = new Vector2(25, 100); 
        narrativeRect.offsetMax = new Vector2(-25, -50);
        
        // Configure TextMeshPro settings for proper text wrapping and display
        narrativeText.enableWordWrapping = true;
        narrativeText.overflowMode = TextOverflowModes.Overflow; // Changed from Ellipsis to allow scrolling
        narrativeText.textWrappingMode = TextWrappingModes.Normal;
        narrativeText.lineSpacing = -10; // Reduce line spacing to fit more text
        
        UnityEngine.Debug.Log($"NarrativeText configured - Font size: {narrativeText.fontSize}, Word wrapping: {narrativeText.enableWordWrapping}");
        
        // Next button is removed as it's not part of the current UIManager logic.
        // Button nextButton = CreateButton(panelGo.transform, "NextButton", "次へ", font);
        
        // --- Choice Buttons Container ---
        GameObject choiceContainerGo = new GameObject("ChoiceButtonContainer", typeof(VerticalLayoutGroup));
        choiceContainerGo.transform.SetParent(panelGo.transform, false);
        RectTransform choiceRect = choiceContainerGo.GetComponent<RectTransform>();
        
        // Position at bottom of the screen, stretching across width
        choiceRect.anchorMin = new Vector2(0f, 0);
        choiceRect.anchorMax = new Vector2(1f, 0);
        choiceRect.pivot = new Vector2(0.5f, 0);
        choiceRect.anchoredPosition = new Vector2(0, 10);
        choiceRect.sizeDelta = new Vector2(-50, 60); // Leave 25px margin on each side 

        VerticalLayoutGroup layoutGroup = choiceContainerGo.GetComponent<VerticalLayoutGroup>();
        layoutGroup.childAlignment = TextAnchor.MiddleCenter;
        layoutGroup.spacing = 10;
        layoutGroup.padding = new RectOffset(10, 10, 10, 10);
        layoutGroup.childControlHeight = false;
        layoutGroup.childForceExpandHeight = false;
        
        // --- Debug UI Panel ---
        GameObject debugPanelGo = CreatePanel(canvasGo.transform, "DebugPanel", new Vector2(0, 1), new Vector2(0.35f, 1));
        debugPanelGo.GetComponent<Image>().color = new Color(0.1f, 0.1f, 0.1f, 0.8f);
        debugPanelGo.transform.SetAsFirstSibling();
        
        var layout = debugPanelGo.AddComponent<VerticalLayoutGroup>();
        layout.padding = new RectOffset(10, 10, 10, 10);
        layout.spacing = 5;
        layout.childControlWidth = true;
        layout.childControlHeight = false;
        layout.childForceExpandWidth = true;
        layout.childForceExpandHeight = false;

        // The DebugDisplay component is no longer used.
        // DebugDisplay debugDisplay = debugPanelGo.AddComponent<DebugDisplay>();
        
        // Create and assign the dropdown for character selection
        // var dropdown = CreateDropdown(debugPanelGo.transform, "CharacterDropdown", font);
        // debugDisplay.characterDropdown = dropdown;

        // Create a single text area for all debug logs
        var logOutputText = CreateDebugText(debugPanelGo.transform, "LogOutputText", "Awaiting data...", font);
        logOutputText.alignment = TextAlignmentOptions.TopLeft;
        
        // Assign this single text component to the script
        // debugDisplay.logOutput = logOutputText;
        
        // --- Final Wiring ---
        // This is now the single source of truth for wiring dependencies.
        
        // Wire up the UIManager reference to the GameManager using direct assignment
                UnityEngine.Debug.Log("GameManager will auto-detect UIManager during Awake()...");
        // No manual assignment needed - GameManager finds UIManager automatically
        
        // Setup UIManager UI references using reflection

        // Wire up UI references to the UIManager
        SetPublicField(uiManager, "narrativeText", narrativeText);
        SetPublicField(uiManager, "choicesPanel", choiceContainerGo);
        SetPublicField(uiManager, "debugText", logOutputText);
        
        // Load button prefab
        var buttonPrefab = Resources.Load<GameObject>("DebugButton");
        if (buttonPrefab != null)
        {
            SetPublicField(uiManager, "choiceButtonPrefab", buttonPrefab);
            UnityEngine.Debug.Log("DebugButton prefab successfully assigned to UIManager");
        }
        else
        {
            UnityEngine.Debug.LogError("Failed to load DebugButton prefab from Resources!");
        }

        // The dropdown listener is now added in DebugDisplay.Awake, so no persistent listener setup is needed here.

        // Load and wire up the choice button prefab.
        // The prefab is now set directly on the UIManager.
        // gameManager.choiceButtonPrefab = Resources.Load<GameObject>("DebugButton");
        // if (gameManager.choiceButtonPrefab == null)
        // {
        //     UnityEngine.Debug.LogError("Failed to load choice button prefab from Resources/DebugButton.prefab");
        // }

        UnityEditor.SceneManagement.EditorSceneManager.MarkSceneDirty(systemGo.scene);
        
        // --- Post-Setup Verification ---
        UnityEngine.Debug.Log("=== Post-Setup Verification ===");
        
        // Verify GameManager and UIManager
        UnityEngine.Debug.Log($"GameManager exists: {gameManager != null}");
        UnityEngine.Debug.Log($"UIManager exists: {uiManager != null}");
        
        // Check GameManager fields using reflection
        if (gameManager != null)
        {
            var gameManagerUIManagerField = gameManager.GetType().GetField("uiManager");
            var gameManagerUIManagerValue = gameManagerUIManagerField?.GetValue(gameManager) as UIManager;
            UnityEngine.Debug.Log($"GameManager.uiManager field exists: {gameManagerUIManagerField != null}");
            UnityEngine.Debug.Log($"GameManager.uiManager value: {(gameManagerUIManagerValue != null ? "ASSIGNED" : "NULL")}");
            UnityEngine.Debug.Log($"GameManager.uiManager value is same UIManager: {gameManagerUIManagerValue == uiManager}");
        }
        
        if (uiManager != null)
        {
            // Check UIManager fields using reflection
            var narrativeTextField = uiManager.GetType().GetField("narrativeText");
            var choicesPanelField = uiManager.GetType().GetField("choicesPanel");
            var choiceButtonPrefabField = uiManager.GetType().GetField("choiceButtonPrefab");
            
            UnityEngine.Debug.Log($"UIManager.narrativeText: {(narrativeTextField?.GetValue(uiManager) as TMPro.TextMeshProUGUI)?.name ?? "NULL"}");
            UnityEngine.Debug.Log($"UIManager.choicesPanel: {(choicesPanelField?.GetValue(uiManager) as GameObject)?.name ?? "NULL"}");
            UnityEngine.Debug.Log($"UIManager.choiceButtonPrefab: {(choiceButtonPrefabField?.GetValue(uiManager) as GameObject)?.name ?? "NULL"}");
        }
        
        // Verify created GameObjects
        var foundNarrativeText = GameObject.Find("NarrativeText");
        var foundChoiceContainer = GameObject.Find("ChoiceButtonContainer");
        var foundCanvas = GameObject.Find("UICanvas");
        
        UnityEngine.Debug.Log($"NarrativeText GameObject exists: {foundNarrativeText != null}");
        UnityEngine.Debug.Log($"ChoiceButtonContainer GameObject exists: {foundChoiceContainer != null}");
        UnityEngine.Debug.Log($"UICanvas GameObject exists: {foundCanvas != null}");
        
        // Verify button prefab in Resources
        var debugButtonPrefab = Resources.Load<GameObject>("DebugButton");
        UnityEngine.Debug.Log($"DebugButton prefab loadable: {debugButtonPrefab != null}");
        
        UnityEngine.Debug.Log("=== SetupScene.Setup() COMPLETE ===");
        UnityEngine.Debug.Log("Full Scene Setup is complete. Dependencies are now wired directly and persistently.");
    }

    static TextMeshProUGUI CreateDebugText(Transform parent, string name, string label, TMP_FontAsset font)
    {
        var go = new GameObject(name, typeof(TextMeshProUGUI), typeof(LayoutElement));
        go.transform.SetParent(parent, false);
        var text = go.GetComponent<TextMeshProUGUI>();
        text.font = font;
        text.text = label;
        text.fontSize = 14;
        text.color = Color.white;
        text.alignment = TextAlignmentOptions.MidlineLeft;
        go.GetComponent<LayoutElement>().minHeight = 16;
        return text;
    }

    static void SetPrivateField(object obj, string fieldName, object value)
    {
        var field = obj.GetType().GetField(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            field.SetValue(obj, value);
        }
        else
        {
            UnityEngine.Debug.LogError($"Field '{fieldName}' not found in '{obj.GetType().Name}'.");
        }
    }

    static void SetPublicField(object obj, string fieldName, object value)
    {
        UnityEngine.Debug.Log($"SetPublicField: Attempting to set '{fieldName}' on {obj.GetType().Name} to {(value?.GetType().Name ?? "null")}");
        
        var field = obj.GetType().GetField(fieldName, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            UnityEngine.Debug.Log($"SetPublicField: Found field '{fieldName}' of type {field.FieldType.Name}");
            
            try
            {
                field.SetValue(obj, value);
                var newValue = field.GetValue(obj);
                UnityEngine.Debug.Log($"SetPublicField: Successfully set '{fieldName}' = {(newValue != null ? newValue.GetType().Name : "null")}");
            }
            catch (System.Exception ex)
            {
                UnityEngine.Debug.LogError($"SetPublicField: Exception setting '{fieldName}': {ex.Message}");
            }
        }
        else
        {
            // List all available public fields for debugging
            var allFields = obj.GetType().GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            var fieldNames = string.Join(", ", allFields.Select(f => f.Name));
            UnityEngine.Debug.LogError($"SetPublicField: Field '{fieldName}' not found in '{obj.GetType().Name}'. Available fields: {fieldNames}");
        }
    }

    static void CreateButtonPrefab()
    {
        if (!Directory.Exists("Assets/Resources"))
        {
            Directory.CreateDirectory("Assets/Resources");
        }

        if (File.Exists(PREFAB_PATH))
        {
            File.Delete(PREFAB_PATH); // Force recreation to ensure TextMeshProUGUI compatibility
            UnityEngine.Debug.Log("Deleted existing button prefab to force recreation with TextMeshProUGUI support.");
        }

        // Create a temporary button to make a prefab from it
        GameObject buttonGo = new GameObject("DebugButton", typeof(Image), typeof(Button), typeof(LayoutElement));
        buttonGo.GetComponent<LayoutElement>().minHeight = 30;
        buttonGo.GetComponent<LayoutElement>().preferredWidth = 120;
        buttonGo.GetComponent<Image>().color = new Color(0.2f, 0.2f, 0.2f);
        
        var font = Resources.Load<TMP_FontAsset>("Fonts/Noto-sans_WebSubset SDF");
        if (font == null) 
        {
            UnityEngine.Debug.LogError("CreateButtonPrefab failed: Font is null.");
            Object.DestroyImmediate(buttonGo);
            return;
        }
        var text = CreateText(buttonGo.transform, "Text", "Button", 14, FontStyles.Normal, TextAlignmentOptions.Center, Vector2.zero, font);
        var textRect = text.GetComponent<RectTransform>();
        textRect.anchorMin = Vector2.zero;
        textRect.anchorMax = Vector2.one;
        textRect.sizeDelta = Vector2.zero;
        textRect.anchoredPosition = Vector2.zero;
        
        // Ensure the button has proper background
        buttonGo.GetComponent<Image>().color = new Color(0.8f, 0.8f, 0.8f, 1.0f);
        
        PrefabUtility.SaveAsPrefabAsset(buttonGo, PREFAB_PATH);
        Object.DestroyImmediate(buttonGo);
        
        UnityEngine.Debug.Log($"Button prefab created successfully at: {PREFAB_PATH}");
    }
    
    // --- Helper Methods for UI Creation --- (The rest of the file is identical to the last correct version)
    static GameObject CreatePanel(Transform parent, string name, Vector2 anchorMin, Vector2 anchorMax)
    {
        GameObject panelGo = new GameObject(name, typeof(Image));
        panelGo.transform.SetParent(parent, false);
        panelGo.GetComponent<Image>().color = new Color(0, 0, 0, 0.75f);
        RectTransform rect = panelGo.GetComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.pivot = anchorMax;
        rect.offsetMin = new Vector2(15, 15);
        rect.offsetMax = new Vector2(-15, -15);
        return panelGo;
    }

    static TextMeshProUGUI CreateText(Transform parent, string name, string content, int fontSize, FontStyles style, TextAlignmentOptions alignment, Vector2 anchoredPosition, TMP_FontAsset font, Vector2? pivot = null)
    {
        GameObject textGo = new GameObject(name, typeof(TextMeshProUGUI));
        textGo.transform.SetParent(parent, false);
        TextMeshProUGUI textComp = textGo.GetComponent<TextMeshProUGUI>();
        textComp.font = font;
        textComp.text = content;
        textComp.fontSize = fontSize;
        textComp.fontStyle = style;
        textComp.color = Color.white;
        textComp.alignment = alignment;
        
        // Configure text wrapping and overflow for narrative text
        textComp.enableWordWrapping = true;
        textComp.overflowMode = TextOverflowModes.Overflow;
        textComp.textWrappingMode = TextWrappingModes.Normal;
        
        RectTransform rect = textGo.GetComponent<RectTransform>();
        if(pivot.HasValue) rect.pivot = pivot.Value;
        rect.anchorMin = (pivot ?? new Vector2(0.5f, 0.5f)); // Default to center
        rect.anchorMax = (pivot ?? new Vector2(0.5f, 0.5f)); // Default to center
        
        // Use larger size for narrative text, smaller for others
        if (name == "NarrativeText")
        {
            rect.sizeDelta = new Vector2(800, 200); // Larger size for narrative text
        }
        else
        {
            rect.sizeDelta = new Vector2(350, 40); // Default size for other text
        }
        
        rect.anchoredPosition = anchoredPosition;

        return textComp;
    }

    static Button CreateButton(Transform parent, string name, string buttonText, TMP_FontAsset font)
    {
        GameObject buttonGo = new GameObject(name, typeof(Image), typeof(Button));
        buttonGo.transform.SetParent(parent, false);
        RectTransform buttonRect = buttonGo.GetComponent<RectTransform>();
        // Anchor to the bottom-right corner of the parent panel
        buttonRect.anchorMin = new Vector2(1, 0);
        buttonRect.anchorMax = new Vector2(1, 0);
        buttonRect.pivot = new Vector2(1, 0);
        buttonRect.sizeDelta = new Vector2(150, 60);
        // Position it with a small margin from the corner
        buttonRect.anchoredPosition = new Vector2(-20, 20);

        TextMeshProUGUI buttonTextComponent = CreateText(buttonGo.transform, "ButtonText", buttonText, 24, FontStyles.Normal, TextAlignmentOptions.Center, Vector2.zero, font, new Vector2(0.5f, 0.5f));
        RectTransform buttonTextRect = buttonTextComponent.GetComponent<RectTransform>();
        buttonTextRect.anchorMin = Vector2.zero;
        buttonTextRect.anchorMax = Vector2.one;
        buttonTextRect.offsetMin = Vector2.zero;
        buttonTextRect.offsetMax = Vector2.zero;
        
        return buttonGo.GetComponent<Button>();
    }

    static void ShowNextProposition()
    {
        // This is a placeholder for the editor button.
        // It won't work in the same way as the runtime method.
        UnityEngine.Debug.Log("Editor button clicked. In Play Mode, this would advance the narrative.");
    }

    static TMP_Dropdown CreateDropdown(Transform parent, string name, TMP_FontAsset font)
    {
        // Create GOs for Dropdown and its template
        var ddGo = new GameObject(name, typeof(Image), typeof(TMP_Dropdown));
        ddGo.transform.SetParent(parent, false);

        var ddImage = ddGo.GetComponent<Image>();
        ddImage.color = new Color32(60, 60, 60, 255); // Slightly lighter background
        
        var dropdown = ddGo.GetComponent<TMP_Dropdown>();
        
        // --- Layout Element for controlling size in VerticalLayoutGroup ---
        var layoutElement = ddGo.AddComponent<LayoutElement>();
        layoutElement.minHeight = 35; // Slightly taller for better readability
        layoutElement.preferredHeight = 35;
        
        // --- Label ---
        var label = CreateText(ddGo.transform, "Label", "Select...", 20, FontStyles.Normal, TextAlignmentOptions.Left, new Vector2(10, 0), font); // Larger font
        label.color = Color.white; // White text for better contrast
        var labelRect = label.GetComponent<RectTransform>();
        labelRect.anchorMin = Vector2.zero;
        labelRect.anchorMax = Vector2.one;
        labelRect.offsetMin = new Vector2(10, 1);
        labelRect.offsetMax = new Vector2(-25, -2);
        dropdown.captionText = label;

        // --- Arrow ---
        var arrowGo = new GameObject("Arrow", typeof(Image));
        arrowGo.transform.SetParent(ddGo.transform, false);
        var arrowImage = arrowGo.GetComponent<Image>();
        arrowImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/DropdownArrow.psd");
        arrowImage.color = Color.white; // White arrow for better visibility
        var arrowRect = arrowGo.GetComponent<RectTransform>();
        arrowRect.anchorMin = new Vector2(1, 0.5f);
        arrowRect.anchorMax = new Vector2(1, 0.5f);
        arrowRect.sizeDelta = new Vector2(20, 20);
        arrowRect.anchoredPosition = new Vector2(-15, 0);

        // --- Template ---
        var templateGo = new GameObject("Template", typeof(Image), typeof(ScrollRect));
        templateGo.transform.SetParent(ddGo.transform, false);
        var templateRect = templateGo.GetComponent<RectTransform>();
        templateRect.anchorMin = new Vector2(0, 0);
        templateRect.anchorMax = new Vector2(1, 0);
        templateRect.pivot = new Vector2(0.5f, 1);
        templateRect.anchoredPosition = new Vector2(0, 2);
        templateRect.sizeDelta = new Vector2(0, 150);
        
        var templateImage = templateGo.GetComponent<Image>();
        templateImage.color = new Color32(50, 50, 50, 255); // Dark background for dropdown list
        
        var scrollRect = templateGo.GetComponent<ScrollRect>();
        scrollRect.horizontal = false;
        scrollRect.vertical = true;
        scrollRect.movementType = ScrollRect.MovementType.Clamped;
        
        // --- Viewport and Content ---
        var viewportGo = new GameObject("Viewport", typeof(Image), typeof(Mask));
        viewportGo.transform.SetParent(templateGo.transform, false);
        viewportGo.GetComponent<Mask>().showMaskGraphic = false;
        var viewportImage = viewportGo.GetComponent<Image>();
        viewportImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UIMask.psd");
        viewportImage.type = Image.Type.Sliced;
        var viewportRect = viewportGo.GetComponent<RectTransform>();
        viewportRect.anchorMin = Vector2.zero;
        viewportRect.anchorMax = Vector2.one;
        viewportRect.sizeDelta = Vector2.zero;
        viewportRect.pivot = new Vector2(0, 1);
        
        var contentGo = new GameObject("Content", typeof(RectTransform));
        contentGo.transform.SetParent(viewportGo.transform, false);
        var contentRect = contentGo.GetComponent<RectTransform>();
        contentRect.anchorMin = new Vector2(0, 1);
        contentRect.anchorMax = new Vector2(1, 1);
        contentRect.pivot = new Vector2(0.5f, 1);
        contentRect.sizeDelta = new Vector2(0, 28);
        
        scrollRect.viewport = viewportRect;
        scrollRect.content = contentRect;
        
        // --- Item ---
        var itemGo = new GameObject("Item", typeof(Toggle));
        itemGo.transform.SetParent(contentGo.transform, false);
        var itemToggle = itemGo.GetComponent<Toggle>();
        var itemRect = itemGo.GetComponent<RectTransform>();
        itemRect.anchorMin = new Vector2(0, 0.5f);
        itemRect.anchorMax = new Vector2(1, 0.5f);
        itemRect.sizeDelta = new Vector2(0, 25); // Slightly taller items
        
        var itemLabel = CreateText(itemGo.transform, "Item Label", "Option", 18, FontStyles.Normal, TextAlignmentOptions.Left, Vector2.zero, font); // Larger font for items
        itemLabel.color = Color.white; // White text for dropdown items
        var itemLabelRect = itemLabel.GetComponent<RectTransform>();
        itemLabelRect.anchorMin = Vector2.zero;
        itemLabelRect.anchorMax = Vector2.one;
        itemLabelRect.offsetMin = new Vector2(10, 1);
        itemLabelRect.offsetMax = new Vector2(-10, -2);
        
        var itemBg = itemGo.AddComponent<Image>();
        itemBg.color = new Color32(70, 70, 70, 255); // Slightly lighter background for items
        itemToggle.targetGraphic = itemBg;
        itemToggle.graphic = null; // Do not use a checkmark graphic, let the color swap indicate selection.
        
        // Set hover colors
        var colors = itemToggle.colors;
        colors.highlightedColor = new Color32(100, 100, 100, 255); // Lighter on hover
        colors.selectedColor = new Color32(120, 120, 120, 255); // Even lighter when selected
        itemToggle.colors = colors;
        
        dropdown.itemText = itemLabel;
        dropdown.template = templateRect;
        
        templateGo.SetActive(false);
        return dropdown;
    }

    [MenuItem("NarrativeGen/Debug: Check Scene Status")]
    public static void CheckSceneStatus()
    {
        UnityEngine.Debug.Log("=== SCENE STATUS CHECK ===");
        
        // Check all GameObjects
        var allGameObjects = GameObject.FindObjectsByType<GameObject>(FindObjectsSortMode.None);
        UnityEngine.Debug.Log($"Total GameObjects in scene: {allGameObjects.Length}");
        
        // Check specific objects we need
        var canvas = GameObject.Find("UICanvas");
        var system = GameObject.Find("System");
        var eventSystem = GameObject.Find("EventSystem");
        var camera = GameObject.Find("Main Camera");
        var narrativeText = GameObject.Find("NarrativeText");
        var choiceContainer = GameObject.Find("ChoiceButtonContainer");
        
        UnityEngine.Debug.Log($"UICanvas: {(canvas != null ? "EXISTS" : "MISSING")}");
        UnityEngine.Debug.Log($"System: {(system != null ? "EXISTS" : "MISSING")}");
        UnityEngine.Debug.Log($"EventSystem: {(eventSystem != null ? "EXISTS" : "MISSING")}");
        UnityEngine.Debug.Log($"Main Camera: {(camera != null ? "EXISTS" : "MISSING")}");
        UnityEngine.Debug.Log($"NarrativeText: {(narrativeText != null ? "EXISTS" : "MISSING")}");
        UnityEngine.Debug.Log($"ChoiceButtonContainer: {(choiceContainer != null ? "EXISTS" : "MISSING")}");
        
        // Check UIManager component
        if (system != null)
        {
            var uiManager = system.GetComponent<UIManager>();
            var gameManager = system.GetComponent<GameManager>();
            
            UnityEngine.Debug.Log($"UIManager component: {(uiManager != null ? "EXISTS" : "MISSING")}");
            UnityEngine.Debug.Log($"GameManager component: {(gameManager != null ? "EXISTS" : "MISSING")}");
            
            if (uiManager != null)
            {
                UnityEngine.Debug.Log($"UIManager.narrativeText: {(uiManager.narrativeText != null ? uiManager.narrativeText.name : "NULL")}");
                UnityEngine.Debug.Log($"UIManager.choicesPanel: {(uiManager.choicesPanel != null ? uiManager.choicesPanel.name : "NULL")}");
                UnityEngine.Debug.Log($"UIManager.choiceButtonPrefab: {(uiManager.choiceButtonPrefab != null ? uiManager.choiceButtonPrefab.name : "NULL")}");
            }
        }
        
        // Check Resources
        var buttonPrefab = Resources.Load<GameObject>("DebugButton");
        var font = Resources.Load<TMPro.TMP_FontAsset>("Fonts/Noto-sans_WebSubset SDF");
        
        UnityEngine.Debug.Log($"DebugButton prefab in Resources: {(buttonPrefab != null ? "EXISTS" : "MISSING")}");
        UnityEngine.Debug.Log($"Font in Resources: {(font != null ? "EXISTS" : "MISSING")}");
        
        UnityEngine.Debug.Log("=== END SCENE STATUS CHECK ===");
    }
    
    [MenuItem("NarrativeGen/Force Clean Scene")]
    public static void ForceCleanScene()
    {
        UnityEngine.Debug.Log("=== FORCE CLEANING SCENE ===");
        
        // Destroy all objects that might be interfering
        var objectsToDestroy = new[]
        {
            "UICanvas", "System", "EventSystem", "Main Camera"
        };
        
        foreach (var objName in objectsToDestroy)
        {
            var obj = GameObject.Find(objName);
            if (obj != null)
            {
                UnityEngine.Debug.Log($"Destroying: {objName}");
                Object.DestroyImmediate(obj);
            }
        }
        
        // Clean up any remaining UI objects
        var allGameObjects = GameObject.FindObjectsByType<GameObject>(FindObjectsSortMode.None);
        foreach (var go in allGameObjects)
        {
            if (go.name.Contains("UI") || go.name.Contains("Canvas") || go.name.Contains("Choice") || go.name.Contains("Narrative"))
            {
                UnityEngine.Debug.Log($"Cleaning up: {go.name}");
                Object.DestroyImmediate(go);
            }
        }
        
        UnityEngine.Debug.Log("Scene cleaned. Now run 'RUN FIRST: Full Scene Setup' again.");
    }

    [MenuItem("NarrativeGen/Save Scene as TestScene")]
    public static void SaveSceneAsTestScene()
    {
        var scenePath = "Assets/Scenes/TestScene.unity";
        
        // Create Scenes directory if it doesn't exist
        if (!Directory.Exists("Assets/Scenes"))
        {
            Directory.CreateDirectory("Assets/Scenes");
            AssetDatabase.Refresh();
        }
        
        // Save the current scene
        UnityEditor.SceneManagement.EditorSceneManager.SaveScene(
            UnityEditor.SceneManagement.EditorSceneManager.GetActiveScene(),
            scenePath
        );
        
        UnityEngine.Debug.Log($"Scene saved to: {scenePath}");
    }
} 