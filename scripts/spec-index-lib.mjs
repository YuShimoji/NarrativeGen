import { existsSync, readFileSync } from 'node:fs'

const REQUIRED_KEYS = ['id', 'title', 'status', 'pct', 'cat', 'file', 'summary']
const ALLOWED_STATUS = new Set(['done', 'partial', 'todo', 'legacy'])

export function validateSpecIndex(specIndexPath = 'docs/spec-index.json') {
  const messages = []

  if (!existsSync(specIndexPath)) {
    messages.push(`Missing file: ${specIndexPath}`)
    return { ok: false, issues: 1, records: 0, messages }
  }

  let records
  try {
    records = JSON.parse(readFileSync(specIndexPath, 'utf8'))
  } catch (error) {
    messages.push(`Invalid JSON: ${error.message}`)
    return { ok: false, issues: 1, records: 0, messages }
  }

  if (!Array.isArray(records)) {
    messages.push('Root must be an array')
    return { ok: false, issues: 1, records: 0, messages }
  }

  const seenIds = new Set()
  let issues = 0

  for (const [index, record] of records.entries()) {
    const at = `entry[${index}]`

    if (record == null || typeof record !== 'object' || Array.isArray(record)) {
      messages.push(`${at} must be an object`)
      issues += 1
      continue
    }

    for (const key of REQUIRED_KEYS) {
      if (!(key in record)) {
        messages.push(`${at} missing key: ${key}`)
        issues += 1
      }
    }

    if (typeof record.id !== 'string' || record.id.trim() === '') {
      messages.push(`${at}.id must be a non-empty string`)
      issues += 1
    } else if (seenIds.has(record.id)) {
      messages.push(`${at}.id is duplicated: ${record.id}`)
      issues += 1
    } else {
      seenIds.add(record.id)
    }

    if (!ALLOWED_STATUS.has(record.status)) {
      messages.push(`${at}.status must be one of: ${Array.from(ALLOWED_STATUS).join(', ')}`)
      issues += 1
    }

    if (!Number.isInteger(record.pct) || record.pct < 0 || record.pct > 100) {
      messages.push(`${at}.pct must be an integer between 0 and 100`)
      issues += 1
    }

    if (typeof record.file !== 'string' || record.file.trim() === '') {
      messages.push(`${at}.file must be a non-empty string`)
      issues += 1
    } else if (!existsSync(record.file)) {
      messages.push(`${at}.file not found: ${record.file}`)
      issues += 1
    }
  }

  return {
    ok: issues === 0,
    issues,
    records: records.length,
    messages,
  }
}