#nullable enable
using System;
using NarrativeGen.Application.UseCases;
using NarrativeGen.Domain.Repositories;
using NarrativeGen.Domain.Services;
using NarrativeGen.Infrastructure.Repositories;

namespace NarrativeGen.Adapter.ServiceComposition
{
    /// <summary>
    /// Unity など外部アプリケーションから Core (Domain/Application/Infrastructure) を組み立てるための最小コンポジションルート。
    /// </summary>
    public static class CompositionRoot
    {
        public sealed class Services
        {
            public IEntityRepository EntityRepository { get; }
            public IEntityTypeRepository EntityTypeRepository { get; }
            public EntityInheritanceService InheritanceService { get; }
            public EntityUseCase EntityUseCase { get; }

            internal Services(
                IEntityRepository entityRepository,
                IEntityTypeRepository entityTypeRepository,
                EntityInheritanceService inheritanceService,
                EntityUseCase entityUseCase)
            {
                EntityRepository = entityRepository;
                EntityTypeRepository = entityTypeRepository;
                InheritanceService = inheritanceService;
                EntityUseCase = entityUseCase;
            }
        }

        /// <summary>
        /// CSV ファイルのパスから、Infrastructure 実装を用いてユースケースを構成する。
        /// </summary>
        /// <param name="entitiesCsvPath">Entities.csv のフルパス</param>
        /// <param name="entityTypesCsvPath">EntityTypes.csv のフルパス</param>
        public static Services CreateFromCsv(string entitiesCsvPath, string entityTypesCsvPath)
        {
            if (string.IsNullOrWhiteSpace(entitiesCsvPath)) throw new ArgumentNullException(nameof(entitiesCsvPath));
            if (string.IsNullOrWhiteSpace(entityTypesCsvPath)) throw new ArgumentNullException(nameof(entityTypesCsvPath));

            // Infrastructure
            var entityRepo = new CsvEntityRepository(entitiesCsvPath);
            var entityTypeRepo = new CsvEntityTypeRepository(entityTypesCsvPath);

            // Domain Service
            var inheritance = new EntityInheritanceService(entityTypeRepo);

            // Application UseCase
            var useCase = new EntityUseCase(entityRepo, entityTypeRepo, inheritance);

            return new Services(entityRepo, entityTypeRepo, inheritance, useCase);
        }
    }
}
