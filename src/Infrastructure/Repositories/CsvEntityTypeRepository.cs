using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.Repositories;

namespace NarrativeGen.Infrastructure.Repositories
{
    /// <summary>
    /// CSV形式でEntityTypeデータを管理するRepository実装
    /// </summary>
    public class CsvEntityTypeRepository : IEntityTypeRepository
    {
        private readonly string _entityTypesFilePath;
        private readonly Dictionary<string, EntityType> _entityTypes;
        private readonly object _lockObject = new object();

        public CsvEntityTypeRepository(string entityTypesFilePath)
        {
            _entityTypesFilePath = entityTypesFilePath ?? throw new ArgumentNullException(nameof(entityTypesFilePath));
            _entityTypes = new Dictionary<string, EntityType>();
        }

        public async Task<EntityType?> GetByIdAsync(string id)
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                return _entityTypes.TryGetValue(id, out var entityType) ? entityType : null;
            }
        }

        public async Task<IEnumerable<EntityType>> GetAllAsync()
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                return _entityTypes.Values.ToList();
            }
        }

        /// <summary>
        /// 親タイプIDから子タイプ一覧を取得（IEntityTypeRepository 準拠）
        /// </summary>
        public async Task<IEnumerable<EntityType>> GetChildTypesAsync(string parentTypeId)
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                return _entityTypes.Values
                    .Where(et => et.ParentTypeId == parentTypeId)
                    .ToList();
            }
        }

        /// <summary>
        /// エンティティタイプの保存（存在すれば更新、なければ新規作成）
        /// </summary>
        public async Task SaveAsync(EntityType entityType)
        {
            if (entityType == null) throw new ArgumentNullException(nameof(entityType));
            await EnsureLoadedAsync();

            lock (_lockObject)
            {
                _entityTypes[entityType.Id] = entityType;
            }

            await WriteCsvAsync();
        }

        private bool _isLoaded = false;

        private async Task EnsureLoadedAsync()
        {
            if (_isLoaded) return;

            if (File.Exists(_entityTypesFilePath))
            {
                await LoadFromCsvAsync();
            }
            
            _isLoaded = true;
        }

        private async Task LoadFromCsvAsync()
        {
            var lines = await File.ReadAllLinesAsync(_entityTypesFilePath);
            if (lines.Length <= 1) return; // ヘッダーのみまたは空ファイル

            var headers = lines[0].Split(',');
            var idIndex = Array.IndexOf(headers, "Id");
            var nameIndex = Array.IndexOf(headers, "Name");
            var parentTypeIdIndex = Array.IndexOf(headers, "ParentTypeId");

            if (idIndex == -1 || nameIndex == -1)
            {
                throw new InvalidOperationException("CSV file must contain Id and Name columns.");
            }

            lock (_lockObject)
            {
                _entityTypes.Clear();

                for (int i = 1; i < lines.Length; i++)
                {
                    var values = lines[i].Split(',');
                    if (values.Length < headers.Length) continue;

                    var id = values[idIndex].Trim('"');
                    var name = values[nameIndex].Trim('"');
                    var parentTypeId = parentTypeIdIndex >= 0 && parentTypeIdIndex < values.Length 
                        ? values[parentTypeIdIndex].Trim('"') 
                        : null;

                    if (string.IsNullOrEmpty(parentTypeId)) parentTypeId = null;

                    var entityType = new EntityType(id, name, parentTypeId);

                    // デフォルトプロパティの読み込み
                    for (int j = 0; j < headers.Length; j++)
                    {
                        if (j == idIndex || j == nameIndex || j == parentTypeIdIndex)
                            continue;

                        var propertyName = headers[j].Trim();
                        var propertyValue = values[j].Trim('"');
                        
                        if (!string.IsNullOrEmpty(propertyValue))
                        {
                            // CSVの文字列をそのまま既定値として設定
                            entityType.SetDefaultProperty(propertyName, propertyValue);
                        }
                    }

                    _entityTypes[id] = entityType;
                }
            }
        }

        /// <summary>
        /// CSVへ現在のエンティティタイプ状態を書き戻す
        /// </summary>
        private async Task WriteCsvAsync()
        {
            var directory = Path.GetDirectoryName(_entityTypesFilePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // 全プロパティ名を収集
            var allPropertyNames = new HashSet<string>();
            lock (_lockObject)
            {
                foreach (var et in _entityTypes.Values)
                {
                    foreach (var kv in et.GetAllDefaultProperties())
                    {
                        allPropertyNames.Add(kv.Key);
                    }
                }
            }

            var propertyNames = allPropertyNames.OrderBy(p => p).ToList();
            var headers = new List<string> { "Id", "Name", "ParentTypeId" };
            headers.AddRange(propertyNames);

            var lines = new List<string> { string.Join(",", headers.Select(h => $"\"{h}\"")) };

            lock (_lockObject)
            {
                foreach (var et in _entityTypes.Values.OrderBy(x => x.Id))
                {
                    var values = new List<string>
                    {
                        $"\"{et.Id}\"",
                        $"\"{et.Name}\"",
                        $"\"{(et.ParentTypeId ?? "")}\""
                    };

                    foreach (var pn in propertyNames)
                    {
                        var v = et.GetDefaultProperty(pn)?.Value?.ToString() ?? "";
                        values.Add($"\"{v}\"");
                    }

                    lines.Add(string.Join(",", values));
                }
            }

            await File.WriteAllLinesAsync(_entityTypesFilePath, lines);
        }
    }
}
