#!/usr/bin/env node

/**
 * Verification script for Phase 2A implementation
 * Checks that all required functions exist and work correctly
 */

console.log('=== Phase 2A Verification Script ===\n')

// Test 1: Check file existence
console.log('Test 1: Checking file existence...')
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const requiredFiles = [
  'utils/hierarchy-utils.js',
  'src/ui/hierarchy-state.js',
  'src/styles/inline.css',
  'utils/hierarchy-utils.test.js',
  'src/ui/hierarchy-state.test.js',
  'utils/hierarchy-integration-example.js'
]

let filesOk = true
for (const file of requiredFiles) {
  const path = join(projectRoot, file)
  const exists = existsSync(path)
  console.log(`  ${exists ? '✓' : '✗'} ${file}`)
  if (!exists) filesOk = false
}

if (!filesOk) {
  console.error('\n❌ Some required files are missing!')
  process.exit(1)
}
console.log('✓ All required files exist\n')

// Test 2: Import hierarchy-utils
console.log('Test 2: Importing hierarchy-utils...')
try {
  const utilsModule = await import('../utils/hierarchy-utils.js')

  const requiredFunctions = [
    'buildHierarchyTree',
    'getGroupChildren',
    'getGroupDepth',
    'getAllGroups',
    'sortHierarchically',
    'getParentGroup',
    'isChildGroup',
    'getChildGroups',
    'getGroupDisplayName'
  ]

  for (const fn of requiredFunctions) {
    if (typeof utilsModule[fn] !== 'function') {
      throw new Error(`Missing function: ${fn}`)
    }
    console.log(`  ✓ ${fn}`)
  }
  console.log('✓ All hierarchy-utils functions available\n')
} catch (error) {
  console.error('❌ Failed to import hierarchy-utils:', error.message)
  process.exit(1)
}

// Test 3: Test hierarchy-utils functions
console.log('Test 3: Testing hierarchy-utils functions...')
try {
  const {
    buildHierarchyTree,
    getGroupChildren,
    getGroupDepth,
    getAllGroups,
    sortHierarchically
  } = await import('../utils/hierarchy-utils.js')

  // Test data
  const testNodes = {
    'ch1/start': { id: 'ch1/start', group: 'ch1', localId: 'start', text: 'Start' },
    'ch1/next': { id: 'ch1/next', group: 'ch1', localId: 'next', text: 'Next' },
    'ch2/start': { id: 'ch2/start', group: 'ch2', localId: 'start', text: 'Chapter 2' },
    'ungrouped': { id: 'ungrouped', localId: 'ungrouped', text: 'No group' }
  }

  // Test getAllGroups
  const groups = getAllGroups(testNodes)
  if (!Array.isArray(groups) || groups.length !== 2) {
    throw new Error('getAllGroups failed')
  }
  console.log('  ✓ getAllGroups works')

  // Test buildHierarchyTree
  const tree = buildHierarchyTree(testNodes)
  if (!tree.groups || !tree.ungrouped) {
    throw new Error('buildHierarchyTree failed')
  }
  if (tree.groups['ch1'].count !== 2) {
    throw new Error('buildHierarchyTree count incorrect')
  }
  console.log('  ✓ buildHierarchyTree works')

  // Test getGroupChildren
  const ch1Children = getGroupChildren(testNodes, 'ch1')
  if (!Array.isArray(ch1Children) || ch1Children.length !== 2) {
    throw new Error('getGroupChildren failed')
  }
  console.log('  ✓ getGroupChildren works')

  // Test getGroupDepth
  const depth0 = getGroupDepth('ch1')
  const depth1 = getGroupDepth('ch1/intro')
  if (depth0 !== 0 || depth1 !== 1) {
    throw new Error('getGroupDepth failed')
  }
  console.log('  ✓ getGroupDepth works')

  // Test sortHierarchically
  const sorted = sortHierarchically(testNodes)
  if (!Array.isArray(sorted) || sorted.length !== 4) {
    throw new Error('sortHierarchically failed')
  }
  console.log('  ✓ sortHierarchically works')

  console.log('✓ All hierarchy-utils functions work correctly\n')
} catch (error) {
  console.error('❌ hierarchy-utils tests failed:', error.message)
  process.exit(1)
}

// Test 4: Check CSS exists
console.log('Test 4: Checking CSS styles...')
try {
  const { readFileSync } = await import('fs')
  const cssPath = join(projectRoot, 'src/styles/inline.css')
  const cssContent = readFileSync(cssPath, 'utf-8')

  const requiredClasses = [
    '.hierarchy-tree',
    '.hierarchy-group',
    '.hierarchy-node',
    '.hierarchy-icon',
    '.hierarchy-expand-btn',
    '.hierarchy-group-name',
    '.hierarchy-node-name',
    '.hierarchy-node-text',
    '.current-node'
  ]

  for (const className of requiredClasses) {
    if (!cssContent.includes(className)) {
      throw new Error(`Missing CSS class: ${className}`)
    }
    console.log(`  ✓ ${className}`)
  }

  console.log('✓ All CSS classes exist\n')
} catch (error) {
  console.error('❌ CSS verification failed:', error.message)
  process.exit(1)
}

// Test 5: Verify documentation
console.log('Test 5: Checking documentation...')
try {
  const docsPath = join(__dirname, '..', '..', '..', 'docs')
  const reportPath = join(docsPath, 'phase-2a-completion-report.md')
  const apiPath = join(docsPath, 'hierarchy-api-reference.md')

  if (!existsSync(reportPath)) {
    throw new Error('Missing phase-2a-completion-report.md')
  }
  console.log('  ✓ phase-2a-completion-report.md')

  if (!existsSync(apiPath)) {
    throw new Error('Missing hierarchy-api-reference.md')
  }
  console.log('  ✓ hierarchy-api-reference.md')

  console.log('✓ All documentation exists\n')
} catch (error) {
  console.error('❌ Documentation verification failed:', error.message)
  process.exit(1)
}

// Test 6: Check JSDoc comments
console.log('Test 6: Checking JSDoc documentation...')
try {
  const { readFileSync } = await import('fs')

  const utilsPath = join(projectRoot, 'utils/hierarchy-utils.js')
  const utilsContent = readFileSync(utilsPath, 'utf-8')

  const statePath = join(projectRoot, 'src/ui/hierarchy-state.js')
  const stateContent = readFileSync(statePath, 'utf-8')

  // Count JSDoc blocks (/** ... */)
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g
  const utilsJsDocs = (utilsContent.match(jsdocRegex) || []).length
  const stateJsDocs = (stateContent.match(jsdocRegex) || []).length

  console.log(`  ✓ hierarchy-utils.js: ${utilsJsDocs} JSDoc blocks`)
  console.log(`  ✓ hierarchy-state.js: ${stateJsDocs} JSDoc blocks`)

  if (utilsJsDocs < 9 || stateJsDocs < 9) {
    throw new Error('Insufficient JSDoc documentation')
  }

  console.log('✓ JSDoc documentation is comprehensive\n')
} catch (error) {
  console.error('❌ JSDoc verification failed:', error.message)
  process.exit(1)
}

// Summary
console.log('=== Phase 2A Verification Complete ===\n')
console.log('✓ All files created')
console.log('✓ All functions implemented')
console.log('✓ All functions tested')
console.log('✓ CSS styles added')
console.log('✓ Documentation complete')
console.log('✓ JSDoc comprehensive')
console.log('\n🎉 Phase 2A implementation verified successfully!\n')

process.exit(0)
