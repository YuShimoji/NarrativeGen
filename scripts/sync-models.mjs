#!/usr/bin/env node
/**
 * sync-models.mjs — Sync model files from root models/examples/ to web-tester.
 *
 * Root models/examples/ is the Source of Truth (schema validation target).
 * This script copies all files from root to apps/web-tester/models/examples/,
 * preserving any web-tester-only files (e.g. test fixtures).
 *
 * Usage:
 *   node scripts/sync-models.mjs          # sync
 *   node scripts/sync-models.mjs --check  # check for divergence (exit 1 if out of sync)
 */

import { readdirSync, readFileSync, copyFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "models", "examples");
const DEST = join(ROOT, "apps", "web-tester", "models", "examples");

const checkOnly = process.argv.includes("--check");

if (!existsSync(SRC)) {
  console.error(`Source directory not found: ${SRC}`);
  process.exit(1);
}
if (!existsSync(DEST)) {
  console.error(`Destination directory not found: ${DEST}`);
  process.exit(1);
}

const srcFiles = readdirSync(SRC);
let outOfSync = 0;
let synced = 0;

for (const file of srcFiles) {
  const srcPath = join(SRC, file);
  const destPath = join(DEST, file);

  if (!existsSync(destPath)) {
    if (checkOnly) {
      console.log(`MISSING in web-tester: ${file}`);
      outOfSync++;
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`COPIED: ${file}`);
      synced++;
    }
    continue;
  }

  const srcContent = readFileSync(srcPath);
  const destContent = readFileSync(destPath);

  if (!srcContent.equals(destContent)) {
    if (checkOnly) {
      console.log(`DIVERGED: ${file}`);
      outOfSync++;
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`UPDATED: ${file}`);
      synced++;
    }
  }
}

if (checkOnly) {
  if (outOfSync > 0) {
    console.log(`\n${outOfSync} file(s) out of sync. Run 'npm run sync:models' to fix.`);
    process.exit(1);
  } else {
    console.log(`All ${srcFiles.length} model files in sync.`);
  }
} else {
  if (synced > 0) {
    console.log(`\nSynced ${synced} file(s).`);
  } else {
    console.log(`All ${srcFiles.length} model files already in sync.`);
  }
}
