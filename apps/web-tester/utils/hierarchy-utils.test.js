/**
 * Simple manual tests for hierarchy-utils
 * Run this in browser console or Node.js environment
 */

import {
  buildHierarchyTree,
  getGroupChildren,
  getGroupDepth,
  getAllGroups,
  sortHierarchically,
  getParentGroup,
  isChildGroup,
  getChildGroups,
  getGroupDisplayName
} from './hierarchy-utils.js'

// Test data
const testNodes = {
  'ch1/start': {
    id: 'ch1/start',
    group: 'ch1',
    localId: 'start',
    text: 'Chapter 1 Start'
  },
  'ch1/next': {
    id: 'ch1/next',
    group: 'ch1',
    localId: 'next',
    text: 'Chapter 1 Next'
  },
  'ch1/intro/begin': {
    id: 'ch1/intro/begin',
    group: 'ch1/intro',
    localId: 'begin',
    text: 'Intro Begin'
  },
  'ch2/start': {
    id: 'ch2/start',
    group: 'ch2',
    localId: 'start',
    text: 'Chapter 2 Start'
  },
  'ungrouped1': {
    id: 'ungrouped1',
    group: '',
    localId: 'ungrouped1',
    text: 'No Group Node'
  },
  'ungrouped2': {
    id: 'ungrouped2',
    // No group property
    localId: 'ungrouped2',
    text: 'Another Ungrouped'
  }
}

console.log('=== Hierarchy Utils Tests ===\n')

// Test 1: getAllGroups
console.log('Test 1: getAllGroups')
const groups = getAllGroups(testNodes)
console.log('Groups:', groups)
console.assert(groups.length === 3, 'Should have 3 groups')
console.assert(groups.includes('ch1'), 'Should include ch1')
console.assert(groups.includes('ch1/intro'), 'Should include ch1/intro')
console.assert(groups.includes('ch2'), 'Should include ch2')
console.log('✓ Pass\n')

// Test 2: buildHierarchyTree
console.log('Test 2: buildHierarchyTree')
const tree = buildHierarchyTree(testNodes)
console.log('Tree:', JSON.stringify(tree, null, 2))
console.assert(tree.groups['ch1'].count === 2, 'ch1 should have 2 nodes')
console.assert(tree.groups['ch1/intro'].count === 1, 'ch1/intro should have 1 node')
console.assert(tree.groups['ch2'].count === 1, 'ch2 should have 1 node')
console.assert(tree.ungrouped.length === 2, 'Should have 2 ungrouped nodes')
console.log('✓ Pass\n')

// Test 3: getGroupChildren
console.log('Test 3: getGroupChildren')
const ch1Children = getGroupChildren(testNodes, 'ch1')
console.log('ch1 children:', ch1Children.map(n => n.id))
console.assert(ch1Children.length === 2, 'ch1 should have 2 direct children')
console.assert(ch1Children[0].id === 'ch1/next', 'First should be next (sorted)')
console.assert(ch1Children[1].id === 'ch1/start', 'Second should be start')
console.log('✓ Pass\n')

// Test 4: getGroupDepth
console.log('Test 4: getGroupDepth')
console.assert(getGroupDepth('ch1') === 0, 'ch1 depth should be 0')
console.assert(getGroupDepth('ch1/intro') === 1, 'ch1/intro depth should be 1')
console.assert(getGroupDepth('ch1/intro/tutorial') === 2, 'ch1/intro/tutorial depth should be 2')
console.assert(getGroupDepth('') === 0, 'Empty string depth should be 0')
console.log('✓ Pass\n')

// Test 5: sortHierarchically
console.log('Test 5: sortHierarchically')
const sorted = sortHierarchically(testNodes)
console.log('Sorted nodes:', sorted.map(n => n.id))
console.assert(sorted.length === 6, 'Should have all 6 nodes')
// Grouped nodes should come first, then ungrouped
const firstUngroupedIndex = sorted.findIndex(n => !n.group || n.group === '')
console.assert(firstUngroupedIndex === 4, 'Ungrouped should start at index 4')
console.log('✓ Pass\n')

// Test 6: getParentGroup
console.log('Test 6: getParentGroup')
console.assert(getParentGroup('ch1/intro') === 'ch1', 'Parent of ch1/intro should be ch1')
console.assert(getParentGroup('ch1/intro/tutorial') === 'ch1/intro', 'Parent of ch1/intro/tutorial should be ch1/intro')
console.assert(getParentGroup('ch1') === null, 'Root level group should have no parent')
console.log('✓ Pass\n')

// Test 7: isChildGroup
console.log('Test 7: isChildGroup')
console.assert(isChildGroup('ch1/intro', 'ch1') === true, 'ch1/intro is child of ch1')
console.assert(isChildGroup('ch1/intro/tutorial', 'ch1') === true, 'ch1/intro/tutorial is child of ch1')
console.assert(isChildGroup('ch1', 'ch1') === false, 'Same group is not a child')
console.assert(isChildGroup('ch2', 'ch1') === false, 'Different root groups are not children')
console.log('✓ Pass\n')

// Test 8: getChildGroups
console.log('Test 8: getChildGroups')
const allGroups = ['ch1', 'ch1/intro', 'ch1/intro/tutorial', 'ch2']
const ch1DirectChildren = getChildGroups(allGroups, 'ch1', true)
console.log('ch1 direct children:', ch1DirectChildren)
console.assert(ch1DirectChildren.length === 1, 'ch1 should have 1 direct child')
console.assert(ch1DirectChildren[0] === 'ch1/intro', 'Direct child should be ch1/intro')

const ch1AllChildren = getChildGroups(allGroups, 'ch1', false)
console.log('ch1 all descendants:', ch1AllChildren)
console.assert(ch1AllChildren.length === 2, 'ch1 should have 2 total descendants')
console.log('✓ Pass\n')

// Test 9: getGroupDisplayName
console.log('Test 9: getGroupDisplayName')
console.assert(getGroupDisplayName('ch1') === 'ch1', 'Display name of ch1 should be ch1')
console.assert(getGroupDisplayName('ch1/intro') === 'intro', 'Display name of ch1/intro should be intro')
console.assert(getGroupDisplayName('ch1/intro/tutorial') === 'tutorial', 'Display name should be last segment')
console.log('✓ Pass\n')

console.log('=== All Tests Passed ===')
