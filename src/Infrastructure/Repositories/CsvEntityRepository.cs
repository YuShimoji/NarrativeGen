using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NarrativeGen.Domain.Entities;
using NarrativeGen.Domain.Repositories;

namespace NarrativeGen.Infrastructure.Repositories
{
    /// <summary>
    /// CSV形式でEntityデータを管理するRepository実装
    /// </summary>
    public class CsvEntityRepository : IEntityRepository
    {
        private readonly string _entitiesFilePath;
        private readonly Dictionary<string, Entity> _entities;
        private readonly object _lockObject = new object();

        public CsvEntityRepository(string entitiesFilePath)
        {
            _entitiesFilePath = entitiesFilePath ?? throw new ArgumentNullException(nameof(entitiesFilePath));
            _entities = new Dictionary<string, Entity>();
        }

        public async Task<Entity?> GetByIdAsync(string id)
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                return _entities.TryGetValue(id, out var entity) ? entity : null;
            }
        }

        public async Task<IEnumerable<Entity>> GetAllAsync()
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                return _entities.Values.ToList();
            }
        }

        public async Task<IEnumerable<Entity>> GetByTypeAsync(string typeId)
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                return _entities.Values
                    .Where(e => e.TypeId == typeId)
                    .ToList();
            }
        }

        /// <summary>
        /// エンティティの保存（存在すれば更新、なければ新規作成）
        /// </summary>
        public async Task SaveAsync(Entity entity)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));

            await EnsureLoadedAsync();

            lock (_lockObject)
            {
                _entities[entity.Id] = entity;
            }

            await WriteCsvAsync();
        }

        public async Task DeleteAsync(string id)
        {
            await EnsureLoadedAsync();
            
            lock (_lockObject)
            {
                if (!_entities.Remove(id))
                {
                    throw new InvalidOperationException($"Entity with ID '{id}' not found.");
                }
            }
            
            await WriteCsvAsync();
        }

        private bool _isLoaded = false;

        private async Task EnsureLoadedAsync()
        {
            if (_isLoaded) return;

            if (File.Exists(_entitiesFilePath))
            {
                await LoadFromCsvAsync();
            }
            
            _isLoaded = true;
        }

        private async Task LoadFromCsvAsync()
        {
            var lines = await File.ReadAllLinesAsync(_entitiesFilePath);
            if (lines.Length <= 1) return; // ヘッダーのみまたは空ファイル

            string[] ParseCsvLine(string line)
            {
                var result = new List<string>();
                var sb = new StringBuilder();
                bool inQuotes = false;
                for (int i = 0; i < line.Length; i++)
                {
                    char c = line[i];
                    if (c == '\"')
                    {
                        if (inQuotes && i + 1 < line.Length && line[i + 1] == '\"')
                        {
                            sb.Append('\"');
                            i++;
                        }
                        else
                        {
                            inQuotes = !inQuotes;
                        }
                    }
                    else if (c == ',' && !inQuotes)
                    {
                        result.Add(sb.ToString());
                        sb.Clear();
                    }
                    else
                    {
                        sb.Append(c);
                    }
                }
                result.Add(sb.ToString());
                return result.ToArray();
            }

            var headers = ParseCsvLine(lines[0]);
            int IndexOfAny(string[] arr, params string[] keys)
            {
                foreach (var k in keys)
                {
                    var idx = Array.FindIndex(arr, h => string.Equals(h.Trim('\"').Trim(), k, StringComparison.OrdinalIgnoreCase));
                    if (idx >= 0) return idx;
                }
                return -1;
            }
            var idIndex = IndexOfAny(headers, "Id", "entity_id");
            var typeIdIndex = IndexOfAny(headers, "TypeId", "entity_type_id");

            if (idIndex == -1 || typeIdIndex == -1)
            {
                throw new InvalidOperationException("CSV file must contain Id/entity_id and TypeId/entity_type_id columns.");
            }

            lock (_lockObject)
            {
                _entities.Clear();

                for (int i = 1; i < lines.Length; i++)
                {
                    var values = ParseCsvLine(lines[i]);
                    if (values.Length < headers.Length) continue;

                    var id = values[idIndex].Trim('\"');
                    var typeId = values[typeIdIndex].Trim('\"');

                    var entity = new Entity(id, typeId);

                    // 追加プロパティの読み込み（Id/TypeId以外をすべてプロパティとして扱う）
                    for (int j = 0; j < headers.Length; j++)
                    {
                        if (j == idIndex || j == typeIdIndex)
                            continue;

                        var propertyName = headers[j].Trim('\"').Trim();
                        var propertyValue = values[j].Trim('\"');
                        
                        if (!string.IsNullOrEmpty(propertyValue))
                        {
                            entity.SetProperty(propertyName, propertyValue);
                        }
                    }

                    _entities[id] = entity;
                }
            }
        }

        private async Task WriteCsvAsync()
        {
            var directory = Path.GetDirectoryName(_entitiesFilePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // 全プロパティ名を収集
            var allPropertyNames = new HashSet<string>();
            lock (_lockObject)
            {
                foreach (var entity in _entities.Values)
                {
                    foreach (var property in entity.GetAllProperties())
                    {
                        allPropertyNames.Add(property.Key);
                    }
                }
            }

            var propertyNames = allPropertyNames.OrderBy(p => p).ToList();
            var headers = new List<string> { "Id", "TypeId" };
            headers.AddRange(propertyNames);

            var lines = new List<string> { string.Join(",", headers.Select(h => $"\"{h}\"")) };

            lock (_lockObject)
            {
                foreach (var entity in _entities.Values.OrderBy(e => e.Id))
                {
                    var values = new List<string>
                    {
                        $"\"{entity.Id}\"",
                        $"\"{entity.TypeId}\""
                    };

                    foreach (var propertyName in propertyNames)
                    {
                        var value = entity.HasProperty(propertyName) 
                            ? entity.GetProperty(propertyName)?.Value?.ToString() ?? ""
                            : "";
                        values.Add($"\"{value}\"");
                    }

                    lines.Add(string.Join(",", values));
                }
            }

            await File.WriteAllLinesAsync(_entitiesFilePath, lines);
        }
    }
}
