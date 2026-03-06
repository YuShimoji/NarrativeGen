const { spawnSync } = require('child_process');
const path = require('path');

/**
 * NarrativeGen Project-specific dev-check wrapper.
 * This script is called by sw-doctor.js to perform project-level diagnostics.
 * It delegates core shared checks to .shared-workflows/scripts/dev-check.js.
 */

function main() {
    const sharedDevCheck = path.join(__dirname, '..', '.shared-workflows', 'scripts', 'dev-check.js');

    console.log('--- NarrativeGen Dev Check ---');
    console.log('Running shared diagnostics...');

    // Execute shared dev-check.js
    const result = spawnSync(process.execPath, [sharedDevCheck], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

main();
