using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;
using NarrativeGen.Adapter.ServiceComposition;
using NarrativeGen.Application.UseCases;
using NarrativeGen.Domain.Entities;

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
        
        // Adapter-composed services (Domain/Application/Infrastructure)
        private CompositionRoot.Services _services;
        
        // Events for UI
        public event Action<string> OnShowText;
        public event Action<List<string>> OnShowChoices;
        
        private void Awake()
        {
            DontDestroyOnLoad(gameObject);
            InitializeEntitySystem();
        }
        
        private async void Start()
        {
            await ValidateAndLogAsync();
        }
        
        /// <summary>
        /// Entity-Propertyシステムの初期化
        /// </summary>
        private void InitializeEntitySystem()
        {
            var entityTypesPath = System.IO.Path.Combine(csvDataPath, "EntityTypes.csv");
            var entitiesPath = System.IO.Path.Combine(csvDataPath, "Entities.csv");
            _services = CompositionRoot.CreateFromCsv(entitiesPath, entityTypesPath);
            Debug.Log("Entity-Property System initialized (Adapter)");
        }
        
        /// <summary>
        /// 初期データの読み込み
        /// </summary>
        private async Task ValidateAndLogAsync()
        {
            try
            {
                var types = await _services.EntityTypeRepository.GetAllAsync();
                var entities = await _services.EntityRepository.GetAllAsync();
                Debug.Log($"CSV data loaded successfully: {entities.Count()} entities, {types.Count()} types");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to load initial data: {ex.Message}");
            }
        }
        
        /// <summary>
        /// エンティティの取得
        /// </summary>
        public Entity? GetEntity(string entityId)
        {
            return _services?.EntityRepository.GetByIdAsync(entityId).GetAwaiter().GetResult();
        }
        
        /// <summary>
        /// エンティティの検索
        /// </summary>
        public List<Entity> SearchEntities(string query)
        {
            var all = _services?.EntityRepository.GetAllAsync().GetAwaiter().GetResult() ?? Enumerable.Empty<Entity>();
            return all
                .Where(e => !string.IsNullOrEmpty(query) && e.Id.IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0)
                .ToList();
        }
        
        /// <summary>
        /// プロパティ値の取得
        /// </summary>
        public T GetPropertyValue<T>(string entityId, string propertyName)
        {
            var pv = _services?.EntityUseCase.GetEntityPropertyAsync(entityId, propertyName).GetAwaiter().GetResult();
            if (pv != null && pv.Value is T t) return t;
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
            if (_services == null) return;

            var allEntities = _services.EntityRepository.GetAllAsync().GetAwaiter().GetResult();
            var allEntityTypes = _services.EntityTypeRepository.GetAllAsync().GetAwaiter().GetResult();
            Debug.Log($"Total Entities: {allEntities.Count()}");

            foreach (var entity in allEntities)
            {
                Debug.Log($"Entity: {entity.Id} (Type: {entity.TypeId})");
                Debug.Log($"Properties: {entity.GetAllProperties().Count}");
            }
        }
        
        /// <summary>
        /// デバッグ情報の表示
        /// </summary>
        public void ShowDebugInfo()
        {
            if (_services != null)
            {
                var entityCount = _services.EntityRepository.GetAllAsync().GetAwaiter().GetResult().Count();
                var typeCount = _services.EntityTypeRepository.GetAllAsync().GetAwaiter().GetResult().Count();
                Debug.Log($"Entity System Status: {entityCount} entities, {typeCount} types");

                var sampleEntity = _services.EntityRepository.GetByIdAsync("mac_burger_001").GetAwaiter().GetResult();
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
