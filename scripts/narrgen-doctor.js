const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * NarrativeGen プロジェクト固有の診断スクリプト
 * 
 * Unity C#、TypeScript、Web Testerの環境検証を実行します。
 * shared-workflowsのsw-doctor.jsを参考にしつつ、プロジェクト固有の検証を追加しています。
 */

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const options = {
    format: 'text',
    quiet: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--format' && i + 1 < args.length) {
      options.format = args[i + 1];
      i++;
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    }
  }

  if (!['text', 'json'].includes(options.format)) {
    options.format = 'text';
  }

  return options;
}

function createCheckResult(id, severity, message, context = {}) {
  return { id, severity, message, context };
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function runCommand(cmd, args = [], options = {}) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    ...options
  });
  return result;
}

/**
 * Unity C#プロジェクト構造の検証
 * Packages/sdk-unity/ の存在と構造を確認
 */
function checkUnityProject(projectRoot, options = {}) {
  const quiet = options.quiet === true;
  if (!quiet) {
    console.log('=== Unity C# Project Check ===\n');
  }

  const issues = [];
  const warnings = [];
  const results = [];

  const unityPath = path.join(projectRoot, 'Packages', 'sdk-unity');
  
  if (!fs.existsSync(unityPath)) {
    const msg = 'Packages/sdk-unity/ directory not found';
    issues.push(msg);
    results.push(createCheckResult('unity.directory', 'ERROR', msg, { path: unityPath }));
    return { issues, warnings, results };
  }

  results.push(createCheckResult('unity.directory', 'OK', 'Packages/sdk-unity/ exists', { path: unityPath }));

  // package.jsonの確認
  const packageJsonPath = path.join(unityPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSafe(packageJsonPath) || '{}');
    if (packageJson.name && packageJson.unity) {
      if (!quiet) {
        console.log(` Unity package: ${packageJson.name} (Unity ${packageJson.unity})`);
      }
      results.push(createCheckResult('unity.package-json', 'OK', 
        `Unity package.json valid: ${packageJson.name}`, 
        { name: packageJson.name, unity: packageJson.unity }));
    } else {
      const msg = 'Unity package.json missing required fields (name, unity)';
      warnings.push(msg);
      results.push(createCheckResult('unity.package-json', 'WARN', msg));
    }
  } else {
    const msg = 'Unity package.json not found';
    warnings.push(msg);
    results.push(createCheckResult('unity.package-json', 'WARN', msg));
  }

  // Runtimeディレクトリの確認
  const runtimePath = path.join(unityPath, 'Runtime');
  if (fs.existsSync(runtimePath)) {
    const csFiles = fs.readdirSync(runtimePath, { recursive: true })
      .filter(f => f.endsWith('.cs'));
    if (csFiles.length > 0) {
      if (!quiet) {
        console.log(` Runtime C# files found: ${csFiles.length}`);
      }
      results.push(createCheckResult('unity.runtime', 'OK', 
        `Runtime directory contains ${csFiles.length} C# files`, 
        { fileCount: csFiles.length }));
    } else {
      const msg = 'Runtime directory exists but no C# files found';
      warnings.push(msg);
      results.push(createCheckResult('unity.runtime', 'WARN', msg));
    }
  } else {
    const msg = 'Runtime directory not found';
    warnings.push(msg);
    results.push(createCheckResult('unity.runtime', 'WARN', msg));
  }

  // .csprojファイルの確認
  const csprojFiles = fs.readdirSync(unityPath)
    .filter(f => f.endsWith('.csproj'));
  if (csprojFiles.length > 0) {
    if (!quiet) {
      console.log(` C# project file found: ${csprojFiles[0]}`);
    }
    results.push(createCheckResult('unity.csproj', 'OK', 
      `C# project file exists: ${csprojFiles[0]}`, 
      { file: csprojFiles[0] }));
  } else {
    const msg = 'No .csproj file found in sdk-unity';
    warnings.push(msg);
    results.push(createCheckResult('unity.csproj', 'WARN', msg));
  }

  return { issues, warnings, results };
}

/**
 * TypeScriptエンジンのビルド可能性確認
 * Packages/engine-ts/ の構造とビルド設定を確認
 */
function checkTypeScriptEngine(projectRoot, options = {}) {
  const quiet = options.quiet === true;
  if (!quiet) {
    console.log('\n=== TypeScript Engine Check ===\n');
  }

  const issues = [];
  const warnings = [];
  const results = [];

  const enginePath = path.join(projectRoot, 'Packages', 'engine-ts');
  
  if (!fs.existsSync(enginePath)) {
    const msg = 'Packages/engine-ts/ directory not found';
    issues.push(msg);
    results.push(createCheckResult('engine.directory', 'ERROR', msg, { path: enginePath }));
    return { issues, warnings, results };
  }

  results.push(createCheckResult('engine.directory', 'OK', 'Packages/engine-ts/ exists', { path: enginePath }));

  // package.jsonの確認
  const packageJsonPath = path.join(enginePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const msg = 'engine-ts package.json not found';
    issues.push(msg);
    results.push(createCheckResult('engine.package-json', 'ERROR', msg));
    return { issues, warnings, results };
  }

  const packageJson = JSON.parse(readFileSafe(packageJsonPath) || '{}');
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    const msg = 'engine-ts package.json missing build script';
    issues.push(msg);
    results.push(createCheckResult('engine.build-script', 'ERROR', msg));
  } else {
    if (!quiet) {
      console.log(` Build script: ${packageJson.scripts.build}`);
    }
    results.push(createCheckResult('engine.build-script', 'OK', 
      'Build script exists', 
      { script: packageJson.scripts.build }));
  }

  // tsconfig.jsonの確認
  const tsconfigPath = path.join(enginePath, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    if (!quiet) {
      console.log(' tsconfig.json found');
    }
    results.push(createCheckResult('engine.tsconfig', 'OK', 'tsconfig.json exists'));
  } else {
    const msg = 'tsconfig.json not found';
    issues.push(msg);
    results.push(createCheckResult('engine.tsconfig', 'ERROR', msg));
  }

  // srcディレクトリの確認
  const srcPath = path.join(enginePath, 'src');
  if (fs.existsSync(srcPath)) {
    const tsFiles = fs.readdirSync(srcPath, { recursive: true })
      .filter(f => f.endsWith('.ts'));
    if (tsFiles.length > 0) {
      if (!quiet) {
        console.log(` Source TypeScript files: ${tsFiles.length}`);
      }
      results.push(createCheckResult('engine.source', 'OK', 
        `Source directory contains ${tsFiles.length} TypeScript files`, 
        { fileCount: tsFiles.length }));
    } else {
      const msg = 'Source directory exists but no TypeScript files found';
      warnings.push(msg);
      results.push(createCheckResult('engine.source', 'WARN', msg));
    }
  } else {
    const msg = 'src directory not found';
    issues.push(msg);
    results.push(createCheckResult('engine.source', 'ERROR', msg));
  }

  // distディレクトリの確認（ビルド済みか）
  const distPath = path.join(enginePath, 'dist');
  if (fs.existsSync(distPath)) {
    const jsFiles = fs.readdirSync(distPath, { recursive: true })
      .filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
      if (!quiet) {
        console.log(` Built files in dist: ${jsFiles.length}`);
      }
      results.push(createCheckResult('engine.dist', 'OK', 
        `dist directory contains ${jsFiles.length} JavaScript files`, 
        { fileCount: jsFiles.length }));
    } else {
      if (!quiet) {
        console.log(' dist directory exists but empty (needs build)');
      }
      results.push(createCheckResult('engine.dist', 'WARN', 
        'dist directory exists but empty', {}));
    }
  } else {
    if (!quiet) {
      console.log(' dist directory not found (needs build)');
    }
    results.push(createCheckResult('engine.dist', 'WARN', 
      'dist directory not found (run npm run build:engine)', {}));
  }

  return { issues, warnings, results };
}

/**
 * Web Testerのビルド可能性確認
 * apps/web-tester/ の構造とビルド設定を確認
 */
function checkWebTester(projectRoot, options = {}) {
  const quiet = options.quiet === true;
  if (!quiet) {
    console.log('\n=== Web Tester Check ===\n');
  }

  const issues = [];
  const warnings = [];
  const results = [];

  const testerPath = path.join(projectRoot, 'apps', 'web-tester');
  
  if (!fs.existsSync(testerPath)) {
    const msg = 'apps/web-tester/ directory not found';
    issues.push(msg);
    results.push(createCheckResult('tester.directory', 'ERROR', msg, { path: testerPath }));
    return { issues, warnings, results };
  }

  results.push(createCheckResult('tester.directory', 'OK', 'apps/web-tester/ exists', { path: testerPath }));

  // package.jsonの確認
  const packageJsonPath = path.join(testerPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const msg = 'web-tester package.json not found';
    issues.push(msg);
    results.push(createCheckResult('tester.package-json', 'ERROR', msg));
    return { issues, warnings, results };
  }

  const packageJson = JSON.parse(readFileSafe(packageJsonPath) || '{}');
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    const msg = 'web-tester package.json missing build script';
    issues.push(msg);
    results.push(createCheckResult('tester.build-script', 'ERROR', msg));
  } else {
    if (!quiet) {
      console.log(` Build script: ${packageJson.scripts.build}`);
    }
    results.push(createCheckResult('tester.build-script', 'OK', 
      'Build script exists', 
      { script: packageJson.scripts.build }));
  }

  // vite.config.jsの確認
  const viteConfigPath = path.join(testerPath, 'vite.config.js');
  if (fs.existsSync(viteConfigPath)) {
    if (!quiet) {
      console.log(' vite.config.js found');
    }
    results.push(createCheckResult('tester.vite-config', 'OK', 'vite.config.js exists'));
  } else {
    const msg = 'vite.config.js not found';
    warnings.push(msg);
    results.push(createCheckResult('tester.vite-config', 'WARN', msg));
  }

  // srcディレクトリの確認
  const srcPath = path.join(testerPath, 'src');
  if (fs.existsSync(srcPath)) {
    const jsFiles = fs.readdirSync(srcPath, { recursive: true })
      .filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
      if (!quiet) {
        console.log(` Source JavaScript files: ${jsFiles.length}`);
      }
      results.push(createCheckResult('tester.source', 'OK', 
        `Source directory contains ${jsFiles.length} JavaScript files`, 
        { fileCount: jsFiles.length }));
    } else {
      const msg = 'Source directory exists but no JavaScript files found';
      warnings.push(msg);
      results.push(createCheckResult('tester.source', 'WARN', msg));
    }
  } else {
    const msg = 'src directory not found';
    issues.push(msg);
    results.push(createCheckResult('tester.source', 'ERROR', msg));
  }

  // distディレクトリの確認（ビルド済みか）
  const distPath = path.join(testerPath, 'dist');
  if (fs.existsSync(distPath)) {
    const htmlFiles = fs.readdirSync(distPath)
      .filter(f => f.endsWith('.html'));
    if (htmlFiles.length > 0) {
      if (!quiet) {
        console.log(` Built files in dist: index.html found`);
      }
      results.push(createCheckResult('tester.dist', 'OK', 
        'dist directory contains built files', 
        { hasIndex: htmlFiles.includes('index.html') }));
    } else {
      if (!quiet) {
        console.log(' dist directory exists but empty (needs build)');
      }
      results.push(createCheckResult('tester.dist', 'WARN', 
        'dist directory exists but empty', {}));
    }
  } else {
    if (!quiet) {
      console.log(' dist directory not found (needs build)');
    }
    results.push(createCheckResult('tester.dist', 'WARN', 
      'dist directory not found (run npm run build:tester)', {}));
  }

  // index.htmlの確認
  const indexHtmlPath = path.join(testerPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    if (!quiet) {
      console.log(' index.html found');
    }
    results.push(createCheckResult('tester.index-html', 'OK', 'index.html exists'));
  } else {
    const msg = 'index.html not found';
    warnings.push(msg);
    results.push(createCheckResult('tester.index-html', 'WARN', msg));
  }

  return { issues, warnings, results };
}

/**
 * 依存関係の整合性確認
 * package.json、workspace設定の整合性を確認
 */
function checkDependencies(projectRoot, options = {}) {
  const quiet = options.quiet === true;
  if (!quiet) {
    console.log('\n=== Dependencies Check ===\n');
  }

  const issues = [];
  const warnings = [];
  const results = [];

  // ルートのpackage.json確認
  const rootPackageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(rootPackageJsonPath)) {
    const msg = 'Root package.json not found';
    issues.push(msg);
    results.push(createCheckResult('deps.root-package', 'ERROR', msg));
    return { issues, warnings, results };
  }

  const rootPackageJson = JSON.parse(readFileSafe(rootPackageJsonPath) || '{}');
  
  // workspaces設定の確認
  if (!rootPackageJson.workspaces || !Array.isArray(rootPackageJson.workspaces)) {
    const msg = 'Root package.json missing workspaces configuration';
    issues.push(msg);
    results.push(createCheckResult('deps.workspaces', 'ERROR', msg));
  } else {
    if (!quiet) {
      console.log(` Workspaces: ${rootPackageJson.workspaces.join(', ')}`);
    }
    results.push(createCheckResult('deps.workspaces', 'OK', 
      `Workspaces configured: ${rootPackageJson.workspaces.length}`, 
      { workspaces: rootPackageJson.workspaces }));

    // 各workspaceの存在確認
    for (const workspace of rootPackageJson.workspaces) {
      // globパターンを展開（例: "apps/*"）
      let workspacePaths = [];
      if (workspace.includes('*')) {
        const pattern = workspace.replace('*', '');
        const basePath = path.join(projectRoot, pattern);
        if (fs.existsSync(basePath)) {
          const dirs = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(pattern, d.name));
          workspacePaths = dirs;
        }
      } else {
        workspacePaths = [workspace];
      }

      for (const workspacePath of workspacePaths) {
        const fullPath = path.join(projectRoot, workspacePath);
        const packageJsonPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          if (!quiet) {
            console.log(`  ✓ ${workspacePath} (package.json found)`);
          }
          results.push(createCheckResult('deps.workspace-package', 'OK', 
            `Workspace ${workspacePath} has package.json`, 
            { workspace: workspacePath }));
        } else {
          const msg = `Workspace ${workspacePath} missing package.json`;
          warnings.push(msg);
          results.push(createCheckResult('deps.workspace-package', 'WARN', msg, 
            { workspace: workspacePath }));
        }
      }
    }
  }

  // checkスクリプトの確認
  if (rootPackageJson.scripts && rootPackageJson.scripts.check) {
    if (!quiet) {
      console.log(` Check script: ${rootPackageJson.scripts.check}`);
    }
    results.push(createCheckResult('deps.check-script', 'OK', 
      'Check script exists in root package.json', 
      { script: rootPackageJson.scripts.check }));
  } else {
    const msg = 'Root package.json missing check script';
    warnings.push(msg);
    results.push(createCheckResult('deps.check-script', 'WARN', msg));
  }

  // node_modulesの確認（簡易）
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    if (!quiet) {
      console.log(' node_modules exists');
    }
    results.push(createCheckResult('deps.node-modules', 'OK', 'node_modules directory exists'));
  } else {
    const msg = 'node_modules not found (run npm install)';
    warnings.push(msg);
    results.push(createCheckResult('deps.node-modules', 'WARN', msg));
  }

  return { issues, warnings, results };
}

/**
 * テスト環境の準備可能性確認
 * TEST_PROCEDURES.mdの前提条件を確認
 */
function checkTestEnvironment(projectRoot, options = {}) {
  const quiet = options.quiet === true;
  if (!quiet) {
    console.log('\n=== Test Environment Check ===\n');
  }

  const issues = [];
  const warnings = [];
  const results = [];

  // TEST_PROCEDURES.mdの確認
  const testProceduresPath = path.join(projectRoot, 'TEST_PROCEDURES.md');
  if (!fs.existsSync(testProceduresPath)) {
    const msg = 'TEST_PROCEDURES.md not found';
    warnings.push(msg);
    results.push(createCheckResult('test.procedures-file', 'WARN', msg));
    return { issues, warnings, results };
  }

  results.push(createCheckResult('test.procedures-file', 'OK', 'TEST_PROCEDURES.md exists'));

  const testProcedures = readFileSafe(testProceduresPath) || '';
  
  // Node.jsバージョンの確認（TEST_PROCEDURES.mdから要件を抽出）
  const nodeVersionMatch = testProcedures.match(/Node\.js\s+(\d+)\+/i);
  if (nodeVersionMatch) {
    const requiredVersion = parseInt(nodeVersionMatch[1]);
    const nodeVersionResult = runCommand('node', ['--version']);
    if (nodeVersionResult.status === 0) {
      const currentVersion = nodeVersionResult.stdout.trim();
      const currentMajor = parseInt(currentVersion.replace('v', '').split('.')[0]);
      if (currentMajor >= requiredVersion) {
        if (!quiet) {
          console.log(` Node.js version: ${currentVersion} (required: ${requiredVersion}+)`);
        }
        results.push(createCheckResult('test.node-version', 'OK', 
          `Node.js version ${currentVersion} meets requirement`, 
          { current: currentVersion, required: `${requiredVersion}+` }));
      } else {
        const msg = `Node.js version ${currentVersion} does not meet requirement (${requiredVersion}+)`;
        issues.push(msg);
        results.push(createCheckResult('test.node-version', 'ERROR', msg, 
          { current: currentVersion, required: `${requiredVersion}+` }));
      }
    } else {
      const msg = 'Failed to check Node.js version';
      warnings.push(msg);
      results.push(createCheckResult('test.node-version', 'WARN', msg));
    }
  }

  // npmバージョンの確認
  const npmVersionResult = runCommand('npm', ['--version']);
  if (npmVersionResult.status === 0) {
    const npmVersion = npmVersionResult.stdout.trim();
    if (!quiet) {
      console.log(` npm version: ${npmVersion}`);
    }
    results.push(createCheckResult('test.npm-version', 'OK', 
      `npm version ${npmVersion}`, 
      { version: npmVersion }));
  } else {
    const msg = 'Failed to check npm version';
    warnings.push(msg);
    results.push(createCheckResult('test.npm-version', 'WARN', msg));
  }

  // モデルファイルの確認（TEST_PROCEDURES.mdで参照される）
  const modelsPath = path.join(projectRoot, 'models');
  if (fs.existsSync(modelsPath)) {
    const exampleModels = path.join(modelsPath, 'examples');
    if (fs.existsSync(exampleModels)) {
      const jsonFiles = fs.readdirSync(exampleModels)
        .filter(f => f.endsWith('.json'));
      if (jsonFiles.length > 0) {
        if (!quiet) {
          console.log(` Example models found: ${jsonFiles.length}`);
        }
        results.push(createCheckResult('test.example-models', 'OK', 
          `Example models available: ${jsonFiles.length}`, 
          { count: jsonFiles.length }));
      } else {
        const msg = 'models/examples directory exists but no JSON files found';
        warnings.push(msg);
        results.push(createCheckResult('test.example-models', 'WARN', msg));
      }
    } else {
      const msg = 'models/examples directory not found';
      warnings.push(msg);
      results.push(createCheckResult('test.example-models', 'WARN', msg));
    }
  } else {
    const msg = 'models directory not found';
    warnings.push(msg);
    results.push(createCheckResult('test.models', 'WARN', msg));
  }

  // エンジンのビルド済み確認（テスト実行に必要）
  const engineDistPath = path.join(projectRoot, 'Packages', 'engine-ts', 'dist');
  if (fs.existsSync(engineDistPath)) {
    const jsFiles = fs.readdirSync(engineDistPath, { recursive: true })
      .filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
      if (!quiet) {
        console.log(' Engine built (dist exists)');
      }
      results.push(createCheckResult('test.engine-built', 'OK', 
        'Engine is built and ready for testing', 
        { fileCount: jsFiles.length }));
    } else {
      const msg = 'Engine dist directory exists but empty (run npm run build:engine)';
      warnings.push(msg);
      results.push(createCheckResult('test.engine-built', 'WARN', msg));
    }
  } else {
    const msg = 'Engine not built (run npm run build:engine before testing)';
    warnings.push(msg);
    results.push(createCheckResult('test.engine-built', 'WARN', msg));
  }

  return { issues, warnings, results };
}

/**
 * すべてのチェックを実行
 */
function runAllChecks(projectRoot, options = {}) {
  const quiet = options.quiet === true;
  
  if (!quiet) {
    console.log('NarrativeGen Project Doctor\n');
    console.log(`Project Root: ${projectRoot}\n`);
  }

  const unityCheck = checkUnityProject(projectRoot, options);
  const engineCheck = checkTypeScriptEngine(projectRoot, options);
  const testerCheck = checkWebTester(projectRoot, options);
  const depsCheck = checkDependencies(projectRoot, options);
  const testCheck = checkTestEnvironment(projectRoot, options);

  const allResults = [
    ...unityCheck.results,
    ...engineCheck.results,
    ...testerCheck.results,
    ...depsCheck.results,
    ...testCheck.results,
  ];

  const allIssues = [
    ...unityCheck.issues,
    ...engineCheck.issues,
    ...testerCheck.issues,
    ...depsCheck.issues,
    ...testCheck.issues,
  ];

  const allWarnings = [
    ...unityCheck.warnings,
    ...engineCheck.warnings,
    ...testerCheck.warnings,
    ...depsCheck.warnings,
    ...testCheck.warnings,
  ];

  return {
    summary: {
      issues: allIssues,
      warnings: allWarnings,
      totalChecks: allResults.length,
      passed: allResults.filter(r => r.severity === 'OK').length,
      failed: allResults.filter(r => r.severity === 'ERROR').length,
      warned: allResults.filter(r => r.severity === 'WARN').length,
    },
    results: allResults,
  };
}

function suggestRepairs(issues, warnings) {
  if (issues.length === 0 && warnings.length === 0) {
    return;
  }

  console.log('\n=== Suggestions ===\n');

  if (issues.length > 0) {
    console.log('Critical Issues:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
    console.log('');
  }

  // 一般的な復旧手順を提案
  const suggestions = [];
  
  if (issues.some(i => i.includes('directory not found'))) {
    suggestions.push('Run: git submodule update --init --recursive (if using submodules)');
  }
  
  if (issues.some(i => i.includes('package.json'))) {
    suggestions.push('Verify workspace configuration in root package.json');
  }
  
  if (warnings.some(w => w.includes('node_modules'))) {
    suggestions.push('Run: npm install');
  }
  
  if (warnings.some(w => w.includes('dist') || w.includes('needs build'))) {
    suggestions.push('Run: npm run build:all');
  }
  
  if (warnings.some(w => w.includes('Node.js version'))) {
    suggestions.push('Update Node.js to the required version (see TEST_PROCEDURES.md)');
  }

  if (suggestions.length > 0) {
    console.log('Recommended Actions:');
    suggestions.forEach((suggestion, i) => {
      console.log(`  ${i + 1}. ${suggestion}`);
    });
  }
}

function main() {
  const projectRoot = process.cwd();
  const cliOptions = parseCliArgs(process.argv);
  const quiet = cliOptions.format === 'json';

  let checkResult;
  try {
    checkResult = runAllChecks(projectRoot, { quiet });
  } catch (e) {
    if (cliOptions.format === 'json') {
      process.stdout.write(JSON.stringify({ error: e.message }, null, 2));
      process.stdout.write('\n');
      process.exit(1);
    }
    console.error(`Error: ${e.message}`);
    if (e.stack) {
      console.error(e.stack);
    }
    process.exit(1);
  }

  if (cliOptions.format === 'json') {
    const payload = {
      projectRoot,
      summary: checkResult.summary,
      results: checkResult.results
    };

    const hasIssues = checkResult.summary.issues.length > 0;
    process.stdout.write(JSON.stringify(payload, null, 2));
    process.stdout.write('\n');
    process.exit(hasIssues ? 1 : 0);
  }

  // テキスト形式の出力
  console.log('\n=== Summary ===\n');
  console.log(`Total Checks: ${checkResult.summary.totalChecks}`);
  console.log(`Passed: ${checkResult.summary.passed}`);
  console.log(`Failed: ${checkResult.summary.failed}`);
  console.log(`Warnings: ${checkResult.summary.warned}`);

  suggestRepairs(checkResult.summary.issues, checkResult.summary.warnings);

  if (checkResult.summary.issues.length > 0) {
    console.log('\n❌ Critical issues detected. Please address them before proceeding.');
    process.exit(1);
  }

  if (checkResult.summary.warnings.length > 0) {
    console.log('\n⚠️  Warnings detected. Review suggestions above.');
    process.exit(0);
  }

  console.log('\n✅ All checks passed.');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  runAllChecks,
  checkUnityProject,
  checkTypeScriptEngine,
  checkWebTester,
  checkDependencies,
  checkTestEnvironment,
};
