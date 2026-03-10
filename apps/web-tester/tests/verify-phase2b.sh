#!/bin/bash

# Phase 2B Verification Script
echo "================================"
echo "Phase 2B Implementation Verification"
echo "================================"
echo ""

ERRORS=0

# Check modified files
echo "Checking modified files..."

if [ -f "handlers/nodes-panel.js" ]; then
    echo "✅ handlers/nodes-panel.js exists"
    
    # Check for key functions
    if grep -q "renderNodeTreeView" "handlers/nodes-panel.js"; then
        echo "  ✅ renderNodeTreeView() found"
    else
        echo "  ❌ renderNodeTreeView() NOT found"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "renderTreeGroup" "handlers/nodes-panel.js"; then
        echo "  ✅ renderTreeGroup() found"
    else
        echo "  ❌ renderTreeGroup() NOT found"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ handlers/nodes-panel.js NOT found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "index.html" ]; then
    echo "✅ index.html exists"
    
    if grep -q "hierarchy.css" "index.html"; then
        echo "  ✅ hierarchy.css link found"
    else
        echo "  ❌ hierarchy.css link NOT found"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ index.html NOT found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "Checking new files..."

# Check new files
if [ -f "src/styles/hierarchy.css" ]; then
    echo "✅ src/styles/hierarchy.css created"
else
    echo "❌ src/styles/hierarchy.css NOT found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "tests/hierarchy-tree-view-demo.html" ]; then
    echo "✅ tests/hierarchy-tree-view-demo.html created"
else
    echo "❌ tests/hierarchy-tree-view-demo.html NOT found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "docs/PHASE-2B-TREE-VIEW-IMPLEMENTATION.md" ]; then
    echo "✅ docs/PHASE-2B-TREE-VIEW-IMPLEMENTATION.md created"
else
    echo "❌ docs/PHASE-2B-TREE-VIEW-IMPLEMENTATION.md NOT found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "docs/TREE-VIEW-QUICK-START.md" ]; then
    echo "✅ docs/TREE-VIEW-QUICK-START.md created"
else
    echo "❌ docs/TREE-VIEW-QUICK-START.md NOT found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "docs/PHASE-2B-FILE-MANIFEST.md" ]; then
    echo "✅ docs/PHASE-2B-FILE-MANIFEST.md created"
else
    echo "❌ docs/PHASE-2B-FILE-MANIFEST.md NOT found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "docs/PHASE-2B-SUMMARY.md" ]; then
    echo "✅ docs/PHASE-2B-SUMMARY.md created"
else
    echo "❌ docs/PHASE-2B-SUMMARY.md NOT found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "Checking Phase 2A dependencies..."

# Check Phase 2A files
if [ -f "utils/hierarchy-utils.js" ]; then
    echo "✅ utils/hierarchy-utils.js exists (Phase 2A)"
else
    echo "❌ utils/hierarchy-utils.js NOT found (required from Phase 2A)"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "src/ui/hierarchy-state.js" ]; then
    echo "✅ src/ui/hierarchy-state.js exists (Phase 2A)"
else
    echo "❌ src/ui/hierarchy-state.js NOT found (required from Phase 2A)"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "src/utils/html-utils.js" ]; then
    echo "✅ src/utils/html-utils.js exists"
else
    echo "❌ src/utils/html-utils.js NOT found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Phase 2B is complete."
    echo ""
    echo "Next steps:"
    echo "1. Open tests/hierarchy-tree-view-demo.html in browser"
    echo "2. Test all features (expand/collapse, search, etc.)"
    echo "3. Review documentation in docs/"
    echo ""
    exit 0
else
    echo "❌ $ERRORS error(s) found. Please review implementation."
    exit 1
fi
