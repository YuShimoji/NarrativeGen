#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.Repositories;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Domain.Services
{
    /// <summary>
    /// エンティティ継承サービス - memo.txtの階層的プロパティ継承を実現
    /// </summary>
    public class EntityInheritanceService
    {
        private readonly IEntityTypeRepository _entityTypeRepository;

        public EntityInheritanceService(IEntityTypeRepository entityTypeRepository)
        {
            _entityTypeRepository = entityTypeRepository;
        }

        /// <summary>
        /// 継承チェーンを考慮したプロパティ取得
        /// memo.txt: 「携帯食料」→「マックのチーズバーガー」→「誰々が食べていた～」
        /// </summary>
        public async Task<PropertyValue?> GetPropertyWithInheritanceAsync(Entity entity, string propertyName)
        {
            // 1. エンティティ自体のプロパティをチェック
            var directProperty = entity.GetProperty(propertyName);
            if (directProperty != null)
                return directProperty;

            // 2. 継承チェーンを辿ってデフォルト値を取得
            return await GetInheritedPropertyAsync(entity.TypeId, propertyName);
        }

        /// <summary>
        /// 継承チェーンからプロパティを取得
        /// </summary>
        private async Task<PropertyValue?> GetInheritedPropertyAsync(string typeId, string propertyName)
        {
            var entityType = await _entityTypeRepository.GetByIdAsync(typeId);
            if (entityType == null)
                return null;

            // 現在のタイプのデフォルトプロパティをチェック
            var defaultProperty = entityType.GetDefaultProperty(propertyName);
            if (defaultProperty != null)
                return new PropertyValue(defaultProperty.Value, PropertySource.Inherited);

            // 親タイプがある場合は再帰的に検索
            if (entityType.HasParent)
                return await GetInheritedPropertyAsync(entityType.ParentTypeId!, propertyName);

            return null;
        }

        /// <summary>
        /// エンティティの全プロパティを継承込みで取得
        /// </summary>
        public async Task<Dictionary<string, PropertyValue>> GetAllPropertiesWithInheritanceAsync(Entity entity)
        {
            var result = new Dictionary<string, PropertyValue>();
            
            // 継承チェーンから全プロパティを収集
            await CollectInheritedPropertiesAsync(entity.TypeId, result);
            
            // エンティティ自体のプロパティで上書き
            foreach (var (name, value) in entity.GetAllProperties())
            {
                result[name] = value;
            }

            return result;
        }

        /// <summary>
        /// 継承チェーンから全プロパティを収集
        /// </summary>
        private async Task CollectInheritedPropertiesAsync(string typeId, Dictionary<string, PropertyValue> result)
        {
            var entityType = await _entityTypeRepository.GetByIdAsync(typeId);
            if (entityType == null)
                return;

            // 親タイプから先に収集（子が親を上書きするため）
            if (entityType.HasParent)
                await CollectInheritedPropertiesAsync(entityType.ParentTypeId!, result);

            // 現在のタイプのデフォルトプロパティを追加
            foreach (var (name, value) in entityType.GetAllDefaultProperties())
            {
                result[name] = new PropertyValue(value.Value, PropertySource.Inherited);
            }
        }
    }
}
