using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using NarrativeGen.Core;

namespace NarrativeGen.UI
{
    /// <summary>
    /// ポーズメニューの管理（ストーリー要約、ログ表示機能）
    /// </summary>
    public class PauseMenuManager : MonoBehaviour
    {
        #region Serialized Fields
        [Header("UI References")]
        [SerializeField] private GameObject m_PauseMenuPanel;
        [SerializeField] private Button m_ResumeButton;
        [SerializeField] private Button m_StorySummaryButton;
        [SerializeField] private Button m_LogHistoryButton;
        [SerializeField] private Button m_BackToMenuButton;
        
        [Header("Summary Panel")]
        [SerializeField] private GameObject m_StorySummaryPanel;
        [SerializeField] private TextMeshProUGUI m_SummaryText;
        [SerializeField] private Button m_CloseSummaryButton;
        
        [Header("Log Panel")]
        [SerializeField] private GameObject m_LogHistoryPanel;
        [SerializeField] private ScrollRect m_LogScrollRect;
        [SerializeField] private Transform m_LogContent;
        [SerializeField] private GameObject m_LogEntryPrefab;
        [SerializeField] private Button m_CloseLogButton;
        
        [Header("Settings")]
        [SerializeField] private KeyCode m_PauseKey = KeyCode.Escape;
        #endregion

        #region Private Fields
        private bool m_IsPaused = false;
        private StoryLogManager m_LogManager;
        private GameManager m_GameManager;
        private List<GameObject> m_LogEntries = new List<GameObject>();
        #endregion

        #region Unity Lifecycle
        private void Awake()
        {
            m_LogManager = new StoryLogManager();
            InitializeUI();
        }

        private void Start()
        {
            m_GameManager = FindObjectOfType<GameManager>();
            if (m_GameManager != null)
            {
                // ストーリーログの記録開始
                SubscribeToGameEvents();
            }
        }

        private void Update()
        {
            if (Input.GetKeyDown(m_PauseKey))
            {
                TogglePause();
            }
        }

        private void OnDestroy()
        {
            UnsubscribeFromGameEvents();
        }
        #endregion

        #region Public Methods
        /// <summary>
        /// ポーズ状態の切り替え
        /// </summary>
        public void TogglePause()
        {
            if (m_IsPaused)
            {
                ResumeGame();
            }
            else
            {
                PauseGame();
            }
        }

        /// <summary>
        /// ゲームを一時停止
        /// </summary>
        public void PauseGame()
        {
            m_IsPaused = true;
            Time.timeScale = 0f;
            m_PauseMenuPanel.SetActive(true);
            CloseAllSubPanels();
        }

        /// <summary>
        /// ゲームを再開
        /// </summary>
        public void ResumeGame()
        {
            m_IsPaused = false;
            Time.timeScale = 1f;
            m_PauseMenuPanel.SetActive(false);
            CloseAllSubPanels();
        }

        /// <summary>
        /// ストーリー要約を表示
        /// </summary>
        public void ShowStorySummary()
        {
            CloseAllSubPanels();
            m_StorySummaryPanel.SetActive(true);
            
            // ストーリー要約を生成
            string summary = m_LogManager.GenerateStorySummary();
            m_SummaryText.text = summary;
        }

        /// <summary>
        /// ログ履歴を表示
        /// </summary>
        public void ShowLogHistory()
        {
            CloseAllSubPanels();
            m_LogHistoryPanel.SetActive(true);
            PopulateLogHistory();
        }

        /// <summary>
        /// メニューに戻る
        /// </summary>
        public void BackToMainMenu()
        {
            ResumeGame(); // タイムスケールをリセット
            if (SceneManager.Instance != null)
            {
                SceneManager.Instance.LoadMenuScene();
            }
        }
        #endregion

        #region Private Methods
        /// <summary>
        /// UI初期化
        /// </summary>
        private void InitializeUI()
        {
            // ボタンイベント設定
            if (m_ResumeButton != null)
                m_ResumeButton.onClick.AddListener(ResumeGame);
                
            if (m_StorySummaryButton != null)
                m_StorySummaryButton.onClick.AddListener(ShowStorySummary);
                
            if (m_LogHistoryButton != null)
                m_LogHistoryButton.onClick.AddListener(ShowLogHistory);
                
            if (m_BackToMenuButton != null)
                m_BackToMenuButton.onClick.AddListener(BackToMainMenu);
                
            if (m_CloseSummaryButton != null)
                m_CloseSummaryButton.onClick.AddListener(() => m_StorySummaryPanel.SetActive(false));
                
            if (m_CloseLogButton != null)
                m_CloseLogButton.onClick.AddListener(() => m_LogHistoryPanel.SetActive(false));

            // 初期状態では非表示
            CloseAllSubPanels();
            m_PauseMenuPanel.SetActive(false);
        }

        /// <summary>
        /// ゲームイベントへの購読
        /// </summary>
        private void SubscribeToGameEvents()
        {
            if (m_GameManager != null)
            {
                m_GameManager.OnShowText += m_LogManager.LogNarrativeText;
                m_GameManager.OnShowChoices += (speaker, text, choices) => m_LogManager.LogNarrativeText(speaker, text);
            }
        }

        /// <summary>
        /// ゲームイベントからの購読解除
        /// </summary>
        private void UnsubscribeFromGameEvents()
        {
            if (m_GameManager != null)
            {
                m_GameManager.OnShowText -= m_LogManager.LogNarrativeText;
                m_GameManager.OnShowChoices -= (speaker, text, choices) => m_LogManager.LogNarrativeText(speaker, text);
            }
        }

        /// <summary>
        /// 全サブパネルを閉じる
        /// </summary>
        private void CloseAllSubPanels()
        {
            m_StorySummaryPanel.SetActive(false);
            m_LogHistoryPanel.SetActive(false);
        }

        /// <summary>
        /// ログ履歴の表示を更新
        /// </summary>
        private void PopulateLogHistory()
        {
            // 既存のログエントリを削除
            foreach (var entry in m_LogEntries)
            {
                if (entry != null)
                    Destroy(entry);
            }
            m_LogEntries.Clear();

            // ログエントリを生成
            var logEntries = m_LogManager.GetLogEntries();
            foreach (var log in logEntries)
            {
                CreateLogEntry(log);
            }

            // スクロールを最下部に設定
            if (m_LogScrollRect != null)
            {
                Canvas.ForceUpdateCanvases();
                m_LogScrollRect.verticalNormalizedPosition = 0f;
            }
        }

        /// <summary>
        /// ログエントリUIを作成
        /// </summary>
        private void CreateLogEntry(StoryLogManager.LogEntry log)
        {
            if (m_LogEntryPrefab == null || m_LogContent == null) return;

            GameObject entryObj = Instantiate(m_LogEntryPrefab, m_LogContent);
            m_LogEntries.Add(entryObj);

            // ログエントリのテキストを設定
            var textComponent = entryObj.GetComponentInChildren<TextMeshProUGUI>();
            if (textComponent != null)
            {
                string entryText = $"[{log.Timestamp:HH:mm:ss}]";
                if (!string.IsNullOrEmpty(log.Speaker))
                    entryText += $" {log.Speaker}: ";
                entryText += log.Text;
                
                textComponent.text = entryText;
            }

            // TextClickHandlerを追加（言い換え機能）
            var clickHandler = entryObj.GetComponent<TextClickHandler>();
            if (clickHandler == null)
            {
                clickHandler = entryObj.AddComponent<TextClickHandler>();
            }
            
            // バリエーションを設定
            var variations = GenerateLogVariations(log.Text);
            clickHandler.SetVariants(variations);
        }

        /// <summary>
        /// ログのバリエーションを生成
        /// </summary>
        private List<string> GenerateLogVariations(string originalText)
        {
            var variations = new List<string> { originalText };
            
            // シンプルな置換パターン
            if (originalText.Contains("あなた"))
            {
                variations.Add(originalText.Replace("あなた", "プレイヤー"));
                variations.Add(originalText.Replace("あなた", "主人公"));
            }
            
            if (originalText.Contains("部屋"))
            {
                variations.Add(originalText.Replace("部屋", "空間"));
                variations.Add(originalText.Replace("部屋", "場所"));
            }

            return variations;
        }
        #endregion
    }
} 