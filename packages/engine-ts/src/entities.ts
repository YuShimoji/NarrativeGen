import fs from 'fs'
import type { EntityDef, PropertyDef } from './types'

/** Flat entity for CSV import (legacy compatibility) */
export interface Entity {
  id: string
  name: string
  description: string
  cost: number
}

/**
 * Resolve a single property by walking the inheritance chain.
 * Child properties override parent. Circular inheritance returns undefined.
 */
export function resolveProperty(
  entityId: string,
  propertyKey: string,
  entities: Record<string, EntityDef>,
  visited?: Set<string>
): PropertyDef | undefined {
  const seen = visited ?? new Set<string>()
  if (seen.has(entityId)) return undefined
  seen.add(entityId)

  const entity = entities[entityId]
  if (!entity) return undefined

  const prop = entity.properties?.[propertyKey]
  if (prop) return prop

  if (entity.parentEntity) {
    return resolveProperty(entity.parentEntity, propertyKey, entities, seen)
  }
  return undefined
}

/**
 * Get all resolved properties for an entity, merging inherited ones.
 * Child properties override parent properties with the same key.
 */
export function getEntityProperties(
  entityId: string,
  entities: Record<string, EntityDef>,
  visited?: Set<string>
): Record<string, PropertyDef> {
  const seen = visited ?? new Set<string>()
  if (seen.has(entityId)) return {}
  seen.add(entityId)

  const entity = entities[entityId]
  if (!entity) return {}

  let result: Record<string, PropertyDef> = {}
  if (entity.parentEntity) {
    result = getEntityProperties(entity.parentEntity, entities, seen)
  }
  if (entity.properties) {
    for (const [key, prop] of Object.entries(entity.properties)) {
      result[key] = prop
    }
  }
  return result
}

/**
 * Get the full inheritance chain for an entity (self → parent → grandparent → ...).
 * Stops at circular references.
 */
export function getInheritanceChain(
  entityId: string,
  entities: Record<string, EntityDef>
): string[] {
  const chain: string[] = []
  const seen = new Set<string>()
  let current: string | undefined = entityId
  while (current && !seen.has(current)) {
    seen.add(current)
    const entity: EntityDef | undefined = entities[current]
    if (!entity) break
    chain.push(current)
    current = entity.parentEntity
  }
  return chain
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
  const required = ['id', 'name', 'description', 'cost']
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
      name: (row[colIndex['name']] ?? '').trim(),
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
