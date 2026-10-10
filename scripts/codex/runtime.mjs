import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(root);
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Node >=22.13 is required by the existing Sites adapter; found ${process.version}.`);
  process.exit(1);
}
const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => !['--record', '--current'].includes(arg))) {
  console.error('Usage: node scripts/codex/runtime.mjs [--record|--current]');
  process.exit(2);
}
const stampPath = path.join(root, 'node_modules/.codex-environment.json');
const inputs = ['package.json', 'package-lock.json', 'scripts/codex/setup.sh',
  'scripts/codex/runtime.mjs',
  'packages/engine-ts/package.json', 'packages/backend/package.json',
  'apps/web-tester/package.json', 'apps/public-studio/package.json',
  'apps/sites-public-studio-adapter/package.json'];
const digest = createHash('sha256');
for (const input of inputs) digest.update(input).update(fs.readFileSync(path.join(root, input)));
const profile = process.env.CODEX_PLAYWRIGHT_BROWSERS ?? 'chromium firefox webkit';
const browsers = profile.trim().split(/[ \t]+/);
if (/[\r\n]/.test(profile) || browsers.some(name => !['chromium', 'firefox', 'webkit'].includes(name)) || new Set(browsers).size !== browsers.length) {
  console.error('CODEX_PLAYWRIGHT_BROWSERS must list distinct browser names separated by spaces: chromium firefox webkit.');
  process.exit(2);
}
const state = {
  inputHash: digest.digest('hex'), node: process.versions.node, platform: process.platform, arch: process.arch,
  browserProfile: browsers.join(' '), browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH || 'default'
};
if (args.includes('--record')) {
  if (!fs.existsSync('node_modules/@playwright/test/cli.js')) throw new Error('Playwright was not installed.');
  fs.writeFileSync(stampPath, `${JSON.stringify(state)}\n`);
} else if (args.includes('--current')) {
  let previous;
  try { previous = JSON.parse(fs.readFileSync(stampPath, 'utf8')); } catch { /* First setup has no stamp. */ }
  let present = false;
  try {
    for (const workspace of ['apps/web-tester', 'apps/public-studio', 'apps/sites-public-studio-adapter']) {
      const require = createRequire(path.join(root, workspace, 'package.json'));
      require.resolve('vite/package.json');
      require.resolve('@playwright/test/package.json');
    }
    present = fs.existsSync('node_modules/typescript/bin/tsc');
  } catch { /* npm may keep incompatible Vite versions in workspace-local node_modules. */ }
  if (!present || JSON.stringify(previous) !== JSON.stringify(state)) {
    console.error('Dependency inputs or runtime changed, or setup is incomplete. Run bash scripts/codex/setup.sh.');
    process.exitCode = 1;
  }
} else console.log(`Node ${process.version}; locked npm workspace at ${root}`);
