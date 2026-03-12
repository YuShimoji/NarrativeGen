import fs from 'fs'

export interface Entity {
  id: string
  brand: string
  description: string
  cost: number
}

function parseCsvRow(row: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (inQuotes) {
      if (ch === '"') {
        const next = row[i + 1]
        if (next === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
  }
  out.push(cur)
  return out
}

export function parseEntitiesCsv(csv: string): Entity[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const header = parseCsvRow(lines[0])
  const colIndex: Record<string, number> = {}
  header.forEach((h, idx) => (colIndex[h] = idx))
  const required = ['id', 'brand', 'description', 'cost']
  for (const key of required) {
    if (!(key in colIndex)) throw new Error(`Missing column '${key}' in Entities.csv`)
  }
  const out: Entity[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i])
    const id = row[colIndex['id']]?.trim()
    if (!id) continue
    const rawCost = (row[colIndex['cost']] ?? '').trim()
    const cost = rawCost.length > 0 ? Number(rawCost) : 0
    out.push({
      id,
      brand: (row[colIndex['brand']] ?? '').trim(),
      description: (row[colIndex['description']] ?? '').trim(),
      cost: Number.isFinite(cost) ? cost : 0,
    })
  }
  return out
}

export function loadEntitiesFromFile(filePath: string): Entity[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  return parseEntitiesCsv(content)
}
