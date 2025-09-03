#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;

namespace NarrativeGen.Domain.Repositories
{
    /// <summary>
    /// エンティティタイプリポジトリインターフェース
    /// </summary>
    public interface IEntityTypeRepository
    {
        /// <summary>
        /// エンティティタイプの取得
        /// </summary>
        Task<EntityType?> GetByIdAsync(string id);

        /// <summary>
        /// 全エンティティタイプ取得
        /// </summary>
        Task<IEnumerable<EntityType>> GetAllAsync();

        /// <summary>
        /// 親タイプから子タイプを取得
        /// </summary>
        Task<IEnumerable<EntityType>> GetChildTypesAsync(string parentTypeId);

        /// <summary>
        /// エンティティタイプの保存
        /// </summary>
        Task SaveAsync(EntityType entityType);
    }
}
