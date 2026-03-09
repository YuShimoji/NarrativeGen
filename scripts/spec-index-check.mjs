#!/usr/bin/env node

import { validateSpecIndex } from './spec-index-lib.mjs'

const result = validateSpecIndex()

if (result.ok) {
  console.log(`[spec-index-check] OK: ${result.records} entries`)
} else {
  for (const message of result.messages) {
    console.error(`[spec-index-check] ${message}`)
  }
  console.error(`[spec-index-check] NG: ${result.issues} issue(s)`)
  process.exit(1)
}