using System;
using System.Collections.Generic;
using UnityEngine;
using NarrativeGen.Core.Entities;
using NarrativeGen.Debug;

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
            Log.Message("Entity-Property System initialized");
        }
        
        /// <summary>
        /// 初期データの読み込み
        /// </summary>
        private void LoadInitialData()
        {
            try
            {
                // CSV データの読み込み
                string entityTypesPath = csvDataPath + "EntityTypes.csv";
                string entitiesPath = csvDataPath + "Entities.csv";
                _entityManager.LoadFromCsv(entityTypesPath, entitiesPath);
                Log.Message("CSV data loaded successfully");
                
                // 検証実行
                var errors = _entityManager.ValidateAllData();
                if (errors.Count > 0)
                {
                    Log.LogWarning($"Validation found {errors.Count} issues:");
                    foreach (var error in errors)
                    {
                        Log.LogWarning($"- {error}");
                    }
                }
                else
                {
                    Log.Message("All data validation passed");
                }
            }
            catch (Exception ex)
            {
                Log.LogError($"Failed to load initial data: {ex.Message}");
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
        public void DebugEntitySystem()
        {
            if (_entityManager == null) return;
            
            var allEntities = _entityManager.GetAllEntities();
            var allEntityTypes = _entityManager.GetAllEntityTypes();
            Log.Message($"Total Entities: {allEntities.Count}");
            
            foreach (var entity in allEntities)
            {
                Log.Message($"Entity: {entity.Id} (Type: {entity.TypeId})");
                Log.Message($"Properties: {entity.GetAllProperties().Count}");
                Log.Message($"Details: {entity}");
            }
        }
        
        /// <summary>
        /// デバッグ情報の表示
        /// </summary>
        public void ShowDebugInfo()
        {
            if (_entityManager != null)
            {
                var entityCount = _entityManager.GetAllEntities().Count;
                var typeCount = _entityManager.GetAllEntityTypes().Count;
                Log.Message($"Entity System Status: {entityCount} entities, {typeCount} types");
                
                // サンプルエンティティの情報表示
                var sampleEntity = _entityManager.GetEntity("mac_burger_001");
                if (sampleEntity != null)
                {
                    Log.Message($"Sample Entity: {sampleEntity.Id}");
                    Log.Message($"Type: {sampleEntity.TypeId}");
                    Log.Message($"Properties: {sampleEntity.GetAllProperties().Count}");
                }
            }
        }
    }
}
