/**
 * Simple manual tests for hierarchy-state
 * Run this in browser console (requires localStorage)
 */

import {
  getExpansionState,
  setExpansionState,
  expandAll,
  collapseAll,
  restoreExpansionState,
  clearExpansionState,
  toggleExpansionState,
  initHierarchyState,
  getAllExpansionStates
} from './hierarchy-state.js'

console.log('=== Hierarchy State Tests ===\n')

// Clear any existing state before tests
clearExpansionState()

// Test 1: Initial state (should default to true/expanded)
console.log('Test 1: Default expansion state')
const defaultState = getExpansionState('test-group')
console.assert(defaultState === true, 'Default state should be true (expanded)')
console.log('✓ Pass\n')

// Test 2: Set and get expansion state
console.log('Test 2: Set and get expansion state')
setExpansionState('group1', false)
const group1State = getExpansionState('group1')
console.assert(group1State === false, 'Group1 should be collapsed')

setExpansionState('group2', true)
const group2State = getExpansionState('group2')
console.assert(group2State === true, 'Group2 should be expanded')
console.log('✓ Pass\n')

// Test 3: Toggle expansion state
console.log('Test 3: Toggle expansion state')
setExpansionState('group3', true)
const toggled1 = toggleExpansionState('group3')
console.assert(toggled1 === false, 'Toggle should flip true to false')

const toggled2 = toggleExpansionState('group3')
console.assert(toggled2 === true, 'Toggle should flip false to true')
console.log('✓ Pass\n')

// Test 4: Expand all
console.log('Test 4: Expand all groups')
const testGroups = ['ch1', 'ch2', 'ch3']
expandAll(testGroups)

const allExpanded = testGroups.every(group => getExpansionState(group) === true)
console.assert(allExpanded === true, 'All groups should be expanded')
console.log('✓ Pass\n')

// Test 5: Collapse all
console.log('Test 5: Collapse all groups')
collapseAll(testGroups)

const allCollapsed = testGroups.every(group => getExpansionState(group) === false)
console.assert(allCollapsed === true, 'All groups should be collapsed')
console.log('✓ Pass\n')

// Test 6: Restore expansion state
console.log('Test 6: Restore expansion state')
// Set mixed states
setExpansionState('restore1', true)
setExpansionState('restore2', false)
setExpansionState('restore3', true)

const restoreGroups = ['restore1', 'restore2', 'restore3', 'restore4']
const restored = restoreExpansionState(restoreGroups)

console.assert(restored['restore1'] === true, 'restore1 should be true')
console.assert(restored['restore2'] === false, 'restore2 should be false')
console.assert(restored['restore3'] === true, 'restore3 should be true')
console.assert(restored['restore4'] === true, 'restore4 should default to true')
console.log('✓ Pass\n')

// Test 7: Get all expansion states
console.log('Test 7: Get all expansion states')
clearExpansionState()
setExpansionState('test1', true)
setExpansionState('test2', false)

const allStates = getAllExpansionStates()
console.assert(allStates['test1'] === true, 'test1 should be in all states')
console.assert(allStates['test2'] === false, 'test2 should be in all states')
console.log('✓ Pass\n')

// Test 8: Initialize hierarchy state
console.log('Test 8: Initialize hierarchy state')
const initSuccess = initHierarchyState()
console.assert(initSuccess === true, 'Init should succeed with localStorage')
console.log('✓ Pass\n')

// Test 9: Clear expansion state
console.log('Test 9: Clear expansion state')
setExpansionState('clear-test', false)
clearExpansionState()
const clearedState = getExpansionState('clear-test')
console.assert(clearedState === true, 'Cleared state should default to true')
console.log('✓ Pass\n')

// Test 10: Error handling (invalid input)
console.log('Test 10: Error handling')
const invalidResult = setExpansionState(null, true)
console.assert(invalidResult === false, 'Should return false for invalid input')

const invalidGet = getExpansionState(null)
console.assert(invalidGet === true, 'Should return default true for invalid input')
console.log('✓ Pass\n')

console.log('=== All Tests Passed ===')

// Clean up
clearExpansionState()
console.log('Test cleanup complete')
