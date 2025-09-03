#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.Repositories;
using NarrativeGen.Domain.Services;
using NarrativeGen.Domain.ValueObjects;

namespace NarrativeGen.Application.UseCases
{
    /// <summary>
    /// エンティティ操作ユースケース - Application層
    /// </summary>
    public class EntityUseCase
    {
        private readonly IEntityRepository _entityRepository;
        private readonly IEntityTypeRepository _entityTypeRepository;
        private readonly EntityInheritanceService _inheritanceService;

        public EntityUseCase(
            IEntityRepository entityRepository,
            IEntityTypeRepository entityTypeRepository,
            EntityInheritanceService inheritanceService)
        {
            _entityRepository = entityRepository;
            _entityTypeRepository = entityTypeRepository;
            _inheritanceService = inheritanceService;
        }

        /// <summary>
        /// エンティティ取得（継承込み）
        /// </summary>
        public async Task<Entity?> GetEntityAsync(string id)
        {
            return await _entityRepository.GetByIdAsync(id);
        }

        /// <summary>
        /// エンティティのプロパティ取得（継承考慮）
        /// memo.txt: 「誰々が食べていた～」→「マックのチーズバーガー」→「携帯食料」の順で検索
        /// </summary>
        public async Task<PropertyValue?> GetEntityPropertyAsync(string entityId, string propertyName)
        {
            var entity = await _entityRepository.GetByIdAsync(entityId);
            if (entity == null)
                return null;

            return await _inheritanceService.GetPropertyWithInheritanceAsync(entity, propertyName);
        }

        /// <summary>
        /// エンティティの全プロパティ取得（継承込み）
        /// </summary>
        public async Task<Dictionary<string, PropertyValue>> GetEntityAllPropertiesAsync(string entityId)
        {
            var entity = await _entityRepository.GetByIdAsync(entityId);
            if (entity == null)
                return new Dictionary<string, PropertyValue>();

            return await _inheritanceService.GetAllPropertiesWithInheritanceAsync(entity);
        }

        /// <summary>
        /// タイプ別エンティティ検索
        /// </summary>
        public async Task<IEnumerable<Entity>> GetEntitiesByTypeAsync(string typeId)
        {
            return await _entityRepository.GetByTypeAsync(typeId);
        }

        /// <summary>
        /// エンティティ作成
        /// </summary>
        public async Task<Entity> CreateEntityAsync(string id, string typeId)
        {
            var entity = new Entity(id, typeId);
            await _entityRepository.SaveAsync(entity);
            return entity;
        }

        /// <summary>
        /// エンティティプロパティ設定
        /// </summary>
        public async Task SetEntityPropertyAsync(string entityId, string propertyName, object value)
        {
            var entity = await _entityRepository.GetByIdAsync(entityId);
            if (entity == null)
                throw new EntityNotFoundException($"Entity not found: {entityId}");

            entity.SetProperty(propertyName, value);
            await _entityRepository.SaveAsync(entity);
        }
    }

    public class EntityNotFoundException : System.Exception
    {
        public EntityNotFoundException(string message) : base(message) { }
    }
}
