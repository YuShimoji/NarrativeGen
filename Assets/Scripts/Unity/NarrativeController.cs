using System;
using System.Collections.Generic;
using UnityEngine;
using NarrativeGen.Core.Entities;

namespace NarrativeGen.Unity
{
    /// <summary>
    /// Unity統合レイヤー - Entity-PropertyシステムとUnityを橋渡し
    /// </summary>
    public class NarrativeController : MonoBehaviour
    {
        [Header("Entity System")]
        [SerializeField] private string csvDataPath = "Assets/Data/";
        
        [Header("UI References")]
        [SerializeField] private GameObject uiManager;
        
        // Core Entity System
        private EntityManager _entityManager;
        
        // Events for UI
        public event Action<string> OnShowText;
        public event Action<List<string>> OnShowChoices;
        
        private void Awake()
        {
            DontDestroyOnLoad(gameObject);
            InitializeEntitySystem();
        }
        
        private void Start()
        {
            LoadInitialData();
        }
        
        /// <summary>
        /// Entity-Propertyシステムの初期化
        /// </summary>
        private void InitializeEntitySystem()
        {
            _entityManager = new EntityManager();
            Debug.Log("Entity-Property System initialized");
        }
        
        /// <summary>
        /// 初期データの読み込み
        /// </summary>
        private void LoadInitialData()
        {
            try
            {
                // CSV データの読み込み
                _entityManager.LoadFromCsv(csvDataPath);
                Debug.Log("CSV data loaded successfully");
                
                // 検証実行
                var errors = _entityManager.ValidateAllData();
                if (errors.Count > 0)
                {
                    Debug.LogWarning($"Validation found {errors.Count} issues:");
                    foreach (var error in errors)
                    {
                        Debug.LogWarning($"- {error}");
                    }
                }
                else
                {
                    Debug.Log("All data validation passed");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to load initial data: {ex.Message}");
            }
        }
        
        /// <summary>
        /// エンティティの取得
        /// </summary>
        public Entity GetEntity(string entityId)
        {
            return _entityManager.GetEntity(entityId);
        }
        
        /// <summary>
        /// エンティティの検索
        /// </summary>
        public List<Entity> SearchEntities(string query)
        {
            return _entityManager.SearchEntities(query);
        }
        
        /// <summary>
        /// プロパティ値の取得
        /// </summary>
        public T GetPropertyValue<T>(string entityId, string propertyName)
        {
            var entity = _entityManager.GetEntity(entityId);
            if (entity != null && entity.HasProperty(propertyName))
            {
                var propertyValue = entity.GetProperty(propertyName);
                if (propertyValue.Value is T value)
                {
                    return value;
                }
            }
            return default(T);
        }
        
        /// <summary>
        /// テキスト表示の実行
        /// </summary>
        public void ShowText(string text)
        {
            OnShowText?.Invoke(text);
        }
        
        /// <summary>
        /// 選択肢表示の実行
        /// </summary>
        public void ShowChoices(List<string> choices)
        {
            OnShowChoices?.Invoke(choices);
        }
        
        /// <summary>
        /// デバッグ情報の表示
        /// </summary>
        [ContextMenu("Show Debug Info")]
        public void ShowDebugInfo()
        {
            if (_entityManager != null)
            {
                var entityCount = _entityManager.GetAllEntities().Count;
                var typeCount = _entityManager.GetAllEntityTypes().Count;
                Debug.Log($"Entity System Status: {entityCount} entities, {typeCount} types");
                
                // サンプルエンティティの情報表示
                var sampleEntity = _entityManager.GetEntity("mac_burger_001");
                if (sampleEntity != null)
                {
                    Debug.Log($"Sample Entity: {sampleEntity.Id}");
                    Debug.Log($"Type: {sampleEntity.TypeId}");
                    Debug.Log($"Properties: {sampleEntity.GetAllProperties().Count}");
                }
            }
        }
    }
}
