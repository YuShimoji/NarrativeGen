#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy models directory to public/models
const sourceDir = path.join(__dirname, '../../models');
const destDir = path.join(__dirname, 'public/models');

console.log('Copying models to public directory...');
console.log(`Source: ${sourceDir}`);
console.log(`Destination: ${destDir}`);

try {
  // Create public directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'));
  }

  // Copy models directory recursively
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(sourceDir, destDir);
  console.log('✅ Models copied successfully');
} catch (error) {
  console.error('❌ Error copying models:', error);
  process.exit(1);
}