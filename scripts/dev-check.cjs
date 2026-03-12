const { spawnSync } = require('child_process');
const path = require('path');

/**
 * NarrativeGen dev-check: narrgen-doctor.js のエイリアス
 */
function main() {
    const doctorScript = path.join(__dirname, 'narrgen-doctor.cjs');
    const result = spawnSync(process.execPath, [doctorScript, ...process.argv.slice(2)], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    process.exit(result.status || 0);
}

main();
