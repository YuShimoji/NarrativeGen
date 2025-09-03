#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;

namespace NarrativeGen.Domain.Repositories
{
    /// <summary>
    /// エンティティリポジトリインターフェース - Clean Architectureの依存関係逆転原則
    /// </summary>
    public interface IEntityRepository
    {
        /// <summary>
        /// エンティティの取得
        /// </summary>
        Task<Entity?> GetByIdAsync(string id);

        /// <summary>
        /// タイプ別エンティティ取得
        /// </summary>
        Task<IEnumerable<Entity>> GetByTypeAsync(string typeId);

        /// <summary>
        /// 全エンティティ取得
        /// </summary>
        Task<IEnumerable<Entity>> GetAllAsync();

        /// <summary>
        /// エンティティの保存
        /// </summary>
        Task SaveAsync(Entity entity);

        /// <summary>
        /// エンティティの削除
        /// </summary>
        Task DeleteAsync(string id);
    }
}
