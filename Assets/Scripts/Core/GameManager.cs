#nullable enable
using System;
using System.Collections.Generic;
using NarrativeGen.Core.Entities;
using NarrativeGen.Core.Syntax;

namespace NarrativeGen.Core
{
    /// <summary>
    /// 純粋なC#ロジック - Entity-PropertyシステムとSyntaxエンジンの統合管理
    /// Unity依存を除去し、テスト可能な設計
    /// </summary>
    public class GameManager
    {
        // Core Systems
        private readonly EntityManager _entityManager;
        private readonly SyntaxManager _syntaxManager;
        private TextGenerator _textGenerator;
        
        // Events for external integration
        public event Action<List<string>>? OnShowChoices;
        public event Action<string>? OnShowText;
        
        // State
        private string? _lastNarrativeResult;
        
        /// <summary>
        /// コンストラクタ
        /// </summary>
        public GameManager()
        {
            _entityManager = new EntityManager();
            _syntaxManager = new SyntaxManager();
            _textGenerator = new TextGenerator();
        }
        
        /// <summary>
        /// システムの初期化
        /// </summary>
        public void Initialize(string csvDataPath)
        {
            try
            {
                // Entity-Property システムの読み込み
                string entityTypesPath = csvDataPath + "EntityTypes.csv";
                string entitiesPath = csvDataPath + "Entities.csv";
                _entityManager.LoadFromCsv(entityTypesPath, entitiesPath);
                
                // Syntax システムの読み込み
                _syntaxManager.LoadFromCsv(csvDataPath);
                _textGenerator = _syntaxManager.GetTextGenerator();
                
                // 検証実行
                var entityErrors = _entityManager.ValidateAllData();
                var syntaxErrors = _syntaxManager.ValidateAllData();
                
                var allErrors = new List<string>();
                allErrors.AddRange(entityErrors);
                allErrors.AddRange(syntaxErrors);
                
                if (allErrors.Count > 0)
                {
                    throw new InvalidOperationException($"Data validation failed with {allErrors.Count} errors: {string.Join(", ", allErrors)}");
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to initialize GameManager: {ex.Message}", ex);
            }
        }
        
        /// <summary>
        /// エンティティの取得
        /// </summary>
        public Entity? GetEntity(string entityId)
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
        public T? GetPropertyValue<T>(string entityId, string propertyName)
        {
            var entity = _entityManager.GetEntity(entityId);
            if (entity != null && entity.HasProperty(propertyName))
            {
                var propertyValue = entity.GetProperty(propertyName);
                if (propertyValue?.Value is T value)
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
            _lastNarrativeResult = text;
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
        /// システム状態の取得
        /// </summary>
        public (int entityCount, int typeCount) GetSystemStatus()
        {
            var entityCount = _entityManager.GetAllEntities().Count;
            var typeCount = _entityManager.GetAllEntityTypes().Count;
            return (entityCount, typeCount);
        }
        
        /// <summary>
        /// 全データの検証
        /// </summary>
        public List<string> ValidateSystem()
        {
            return _entityManager.ValidateAllData();
        }
        
        /// <summary>
        /// リソースのクリーンアップ
        /// </summary>
        public void Dispose()
        {
            OnShowChoices = null;
            OnShowText = null;
            _lastNarrativeResult = null;
        }
    }
}
