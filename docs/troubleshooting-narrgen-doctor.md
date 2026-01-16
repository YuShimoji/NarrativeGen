# NarrativeGen Doctor - エラー時の復旧手順

このドキュメントは、`scripts/narrgen-doctor.js`で検出されたエラーや警告に対する復旧手順を説明します。

## 概要

`narrgen-doctor.js`は、NarrativeGenプロジェクトの環境と構造を検証するスクリプトです。以下の項目をチェックします：

- Unity C#プロジェクト構造（Packages/sdk-unity/）
- TypeScriptエンジンのビルド可能性（Packages/engine-ts/）
- Web Testerのビルド可能性（apps/web-tester/）
- 依存関係の整合性（package.json、workspace設定）
- テスト環境の準備可能性（TEST_PROCEDURES.mdの前提条件）

## 実行方法

```bash
# テキスト形式で実行（推奨）
npm run doctor

# JSON形式で実行（CI/CD用）
npm run doctor:json

# 直接実行
node scripts/narrgen-doctor.js
```

## エラー別の復旧手順

### Unity C#プロジェクト関連

#### エラー: `Packages/sdk-unity/ directory not found`

**原因**: Unity SDKパッケージのディレクトリが存在しない

**復旧手順**:
1. プロジェクトルートで以下を確認:
   ```bash
   ls Packages/sdk-unity/
   ```
2. ディレクトリが存在しない場合、Gitリポジトリから取得:
   ```bash
   git checkout Packages/sdk-unity/
   ```
3. サブモジュールを使用している場合:
   ```bash
   git submodule update --init --recursive
   ```

#### 警告: `Unity package.json missing required fields`

**原因**: package.jsonに`name`または`unity`フィールドが不足

**復旧手順**:
1. `Packages/sdk-unity/package.json`を開く
2. 以下のフィールドが存在することを確認:
   ```json
   {
     "name": "com.yushimoji.narrativegen",
     "unity": "2021.3"
   }
   ```
3. 不足している場合は追加

#### 警告: `Runtime directory not found` または `No .csproj file found`

**原因**: Unityパッケージの構造が不完全

**復旧手順**:
1. Unityエディタでパッケージを再インポート
2. または、Gitリポジトリから完全な構造を取得:
   ```bash
   git checkout Packages/sdk-unity/
   ```

### TypeScriptエンジン関連

#### エラー: `Packages/engine-ts/ directory not found`

**原因**: TypeScriptエンジンのディレクトリが存在しない

**復旧手順**:
1. プロジェクトルートで確認:
   ```bash
   ls Packages/engine-ts/
   ```
2. 存在しない場合、Gitから取得:
   ```bash
   git checkout Packages/engine-ts/
   ```

#### エラー: `engine-ts package.json missing build script`

**原因**: package.jsonにビルドスクリプトが定義されていない

**復旧手順**:
1. `Packages/engine-ts/package.json`を開く
2. `scripts`セクションに以下が存在することを確認:
   ```json
   {
     "scripts": {
       "build": "tsc -p ."
     }
   }
   ```
3. 不足している場合は追加

#### エラー: `tsconfig.json not found`

**原因**: TypeScript設定ファイルが存在しない

**復旧手順**:
1. `Packages/engine-ts/tsconfig.json`が存在することを確認
2. 存在しない場合、Gitから取得:
   ```bash
   git checkout Packages/engine-ts/tsconfig.json
   ```

#### 警告: `dist directory not found (run npm run build:engine)`

**原因**: エンジンがビルドされていない

**復旧手順**:
```bash
npm run build:engine
```

### Web Tester関連

#### エラー: `apps/web-tester/ directory not found`

**原因**: Web Testerアプリのディレクトリが存在しない

**復旧手順**:
1. プロジェクトルートで確認:
   ```bash
   ls apps/web-tester/
   ```
2. 存在しない場合、Gitから取得:
   ```bash
   git checkout apps/web-tester/
   ```

#### エラー: `web-tester package.json missing build script`

**原因**: package.jsonにビルドスクリプトが定義されていない

**復旧手順**:
1. `apps/web-tester/package.json`を開く
2. `scripts`セクションに以下が存在することを確認:
   ```json
   {
     "scripts": {
       "build": "vite build && npm run copy:models"
     }
   }
   ```
3. 不足している場合は追加

#### 警告: `vite.config.js not found`

**原因**: Vite設定ファイルが存在しない

**復旧手順**:
1. `apps/web-tester/vite.config.js`が存在することを確認
2. 存在しない場合、Gitから取得:
   ```bash
   git checkout apps/web-tester/vite.config.js
   ```

#### 警告: `dist directory not found (run npm run build:tester)`

**原因**: Web Testerがビルドされていない

**復旧手順**:
```bash
npm run build:tester
```

### 依存関係関連

#### エラー: `Root package.json missing workspaces configuration`

**原因**: ルートのpackage.jsonにworkspaces設定が不足

**復旧手順**:
1. ルートの`package.json`を開く
2. `workspaces`フィールドが存在することを確認:
   ```json
   {
     "workspaces": [
       "packages/engine-ts",
       "packages/backend",
       "apps/*"
     ]
   }
   ```
3. 不足している場合は追加

#### 警告: `Workspace X missing package.json`

**原因**: workspaceディレクトリにpackage.jsonが存在しない

**復旧手順**:
1. 該当するworkspaceディレクトリに移動
2. package.jsonが存在することを確認
3. 存在しない場合、Gitから取得:
   ```bash
   git checkout <workspace-path>/package.json
   ```

#### 警告: `node_modules not found (run npm install)`

**原因**: 依存関係がインストールされていない

**復旧手順**:
```bash
npm install
```

### テスト環境関連

#### エラー: `Node.js version X does not meet requirement (Y+)`

**原因**: Node.jsのバージョンが要件を満たしていない

**復旧手順**:
1. `TEST_PROCEDURES.md`で必要なNode.jsバージョンを確認
2. Node.jsを更新:
   - [Node.js公式サイト](https://nodejs.org/)から最新のLTS版をダウンロード
   - または、nvmを使用:
     ```bash
     nvm install 20
     nvm use 20
     ```

#### 警告: `TEST_PROCEDURES.md not found`

**原因**: テスト手順ドキュメントが存在しない

**復旧手順**:
1. プロジェクトルートに`TEST_PROCEDURES.md`が存在することを確認
2. 存在しない場合、Gitから取得:
   ```bash
   git checkout TEST_PROCEDURES.md
   ```

#### 警告: `Example models not found`

**原因**: テスト用のモデルファイルが存在しない

**復旧手順**:
1. `models/examples/`ディレクトリが存在することを確認
2. 存在しない場合、Gitから取得:
   ```bash
   git checkout models/examples/
   ```

#### 警告: `Engine not built (run npm run build:engine before testing)`

**原因**: エンジンがビルドされていないため、テストを実行できない

**復旧手順**:
```bash
npm run build:engine
```

## 一般的な復旧手順

### 完全な環境再構築

すべてのエラーを一度に解決する場合:

```bash
# 1. 依存関係のクリーンアップと再インストール
npm run clean
npm install

# 2. すべてのビルド
npm run build:all

# 3. Doctorの再実行
npm run doctor
```

### Gitサブモジュールの更新

サブモジュールを使用している場合:

```bash
git submodule update --init --recursive
```

### ワークスペースの整合性確認

workspaceの設定を確認:

```bash
npm ls --workspaces
```

## トラブルシューティング

### Doctorスクリプト自体が実行できない

**原因**: Node.jsがインストールされていない、またはパスが通っていない

**復旧手順**:
1. Node.jsがインストールされているか確認:
   ```bash
   node --version
   npm --version
   ```
2. インストールされていない場合、[Node.js公式サイト](https://nodejs.org/)からインストール

### JSON形式で実行した際のパースエラー

**原因**: 出力が不正なJSON形式

**復旧手順**:
1. テキスト形式で実行してエラー内容を確認:
   ```bash
   npm run doctor
   ```
2. エラーメッセージに基づいて上記の復旧手順を実行

### CI/CDでの実行エラー

**原因**: CI環境での環境変数やパスの問題

**復旧手順**:
1. CI環境のNode.jsバージョンを確認
2. `TEST_PROCEDURES.md`の要件を満たしているか確認
3. 必要に応じて`.github/workflows/`の設定を更新

## 関連ドキュメント

- `TEST_PROCEDURES.md` - テスト環境の要件
- `package.json` - プロジェクトの依存関係とスクリプト
- `.shared-workflows/docs/DOCTOR_OVERVIEW.md` - shared-workflowsのdoctorツールの概要

## サポート

問題が解決しない場合:
1. エラーメッセージの全文を確認
2. 関連するログファイルを確認
3. Gitの状態を確認（`git status`）
4. 必要に応じて、プロジェクトのIssueトラッカーに報告
