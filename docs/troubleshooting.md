# トラブルシューティングガイド

## モジュール解決エラー（Module Resolution Errors）

### 問題: "Failed to resolve module specifier" エラー

```
Uncaught TypeError: Failed to resolve module specifier "@narrativegen/engine-ts/dist/browser.js". 
Relative references must start with either "/", "./", or "../".
```

#### 根本原因
1. **package.json の exports フィールド未定義**: パッケージがサブパスエクスポートを提供していない
2. **ビルド不足**: TypeScript パッケージがビルドされていない
3. **依存関係の不整合**: node_modules が古い状態

#### 解決手順

1. **engine-ts パッケージに exports フィールドを追加**:
   ```json
   {
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js"
       },
       "./browser": {
         "types": "./dist/browser.d.ts",
         "import": "./dist/browser.js"
       },
       "./dist/browser.js": {
         "types": "./dist/browser.d.ts",
         "import": "./dist/browser.js"
       }
     }
   }
   ```

2. **engine-ts をビルド**:
   ```bash
   cd Packages/engine-ts
   npm run build
   ```

3. **web-tester の依存関係を再インストール**:
   ```bash
   cd apps/web-tester
   npm install
   ```

4. **web-tester をビルド**:
   ```bash
   npm run build
   ```

#### 予防策

- **ビルド前チェック**: 常に `engine-ts` を先にビルドしてから `web-tester` をビルドする
- **CI/CD パイプライン**: ルートの `package.json` にビルドスクリプトを追加:
  ```json
  {
    "scripts": {
      "build:all": "npm run build -w @narrativegen/engine-ts && npm run build -w @narrativegen/web-tester",
      "dev:engine": "npm run build -w @narrativegen/engine-ts -- --watch",
      "dev:tester": "npm run dev -w @narrativegen/web-tester"
    }
  }
  ```

---

## TypeScript エラー: unknown 型のエラーハンドリング

### 問題
```
error TS18046: 'error' is of type 'unknown'.
```

#### 解決策
catch ブロック内で型ガードを使用:

```typescript
try {
  // ...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  throw new Error(`Operation failed: ${errorMessage}`)
}
```

---

## ブラウザ互換性の問題

### Node.js 専用モジュールの使用

#### 問題
`fs`, `path` などの Node.js 専用モジュールをブラウザで使用しようとするとエラーになる。

#### 解決策
1. **ブラウザ専用エントリポイントを作成**: `browser.ts` を作成し、Node.js 依存を除外
2. **条件付きエクスポート**: package.json の exports で環境別に分離
3. **ポリフィルまたは代替実装**: ブラウザ向けに `fetch` API などを使用

例:
```typescript
// Node.js version (index.ts)
export function loadModel(path: string): Model {
  const json = fs.readFileSync(path, 'utf-8')
  return JSON.parse(json)
}

// Browser version (browser.ts)
export async function loadModel(url: string): Promise<Model> {
  const response = await fetch(url)
  return response.json()
}
```

---

## 開発ワークフロー

### 推奨手順

1. **初回セットアップ**:
   ```bash
   npm install
   npm run build:all
   ```

2. **開発時**:
   ```bash
   # Terminal 1: engine-ts をウォッチモードでビルド
   npm run dev:engine
   
   # Terminal 2: web-tester を開発サーバーで起動
   npm run dev:tester
   ```

3. **本番ビルド**:
   ```bash
   npm run build:all
   ```

4. **テスト**:
   ```bash
   npm test -w @narrativegen/engine-ts
   ```

---

## よくある質問

### Q: "初期化中..." から進まない

**A**: ブラウザの開発者ツールのコンソールを確認してください。以下を確認：
1. モジュール解決エラー → 上記の「モジュール解決エラー」を参照
2. ネットワークエラー → モデルファイルのパスを確認
3. JavaScript エラー → スタックトレースを確認し、該当箇所を修正

### Q: ビルドは成功するが実行時にエラー

**A**: 以下を確認：
1. `dist/` ディレクトリが最新か
2. ブラウザキャッシュをクリア（Ctrl+Shift+R）
3. `npm run build` を再実行

### Q: TypeScript エラーが多発

**A**: 
1. `npm install` で依存関係を更新
2. `tsconfig.json` の設定を確認
3. 型定義ファイル（.d.ts）が生成されているか確認

## Git Push タイムアウトエラー

### 問題: "fatal: unable to access ... Connection timed out"

#### 根本原因
- ネットワーク接続の問題
- GitHub への接続タイムアウト
- ファイアウォールやプロキシの設定

#### 解決手順

1. **ネットワーク接続を確認**:
   ```bash
   ping github.com
   # または
   curl -I https://github.com
   ```

2. **Git 設定を確認**:
   ```bash
   git config --global user.name
   git config --global user.email
   git remote -v
   ```

3. **SSH から HTTPS に変更**（必要に応じて）:
   ```bash
   git remote set-url origin https://github.com/YuShimoji/NarrativeGen.git
   ```

4. **プロキシ設定を確認**（企業環境の場合）:
   ```bash
   git config --global http.proxy
   git config --global https.proxy
   ```

5. **後でリトライ**:
   ```bash
   git push origin master
   ```

#### 回避策
- ローカルコミットは正常に行われているので、後でネットワーク復旧時にプッシュ
- 変更は失われていない

---

## デバッグテクニック

### ブラウザ開発者ツール

1. **コンソールログの活用**:
   ```javascript
   Logger.info('Operation started', { data })
   ```

2. **sessionStorage の確認**:
   ```javascript
   JSON.parse(sessionStorage.getItem('narrativeGenLogs'))
   ```

3. **ネットワークタブ**: リソース読み込みの失敗を確認

### TypeScript コンパイルエラー

1. **--noEmit フラグでチェック**:
   ```bash
   tsc --noEmit
   ```

2. **型推論の確認**:
   ```typescript
   const x: typeof variableName = ...
   ```

---

## 参考資料

- [Node.js Package Entry Points](https://nodejs.org/api/packages.html#package-entry-points)
- [Vite のモジュール解決](https://vitejs.dev/guide/dep-pre-bundling.html)
- [TypeScript エラーハンドリング](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
