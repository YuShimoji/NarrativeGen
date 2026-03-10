# Web Tester Browser Verification

## Goal
- CSV import の手動確認をブラウザで再現できる状態を標準化する。

## Prerequisites
- Node.js と npm が利用可能であること。
- リポジトリルートで `npm ci` が完了していること。

## Commands
0. 自動検証（推奨・手動確認の前に実施）
```bash
npm run verify:web:ci
```

1. 準備
```bash
npm run verify:web:prep
```

2. 開発サーバ起動
```bash
npm run verify:web:dev
```

3. ブラウザアクセス
- `http://localhost:5173`

## CSV Import Check (Phase 2)
1. `CSVインポート` を押す。
2. `apps/web-tester/models/examples/test_hierarchy.csv` を選択する。
3. CSVプレビューがモーダル表示されることを確認する。
4. `インポート実行` 後、ノード一覧に group/localId が表示されることを確認する。

## Expected Behavior
- ボタン押下でファイル選択ダイアログが開く。
- CSV選択後にプレビューが表示される。
- インポート後にエラーがなければ status は success になる。

## Troubleshooting
- 画面が無反応なら Browser DevTools の Console を確認。
- 依存が古い場合は `npm ci` を再実行。
- engine 側変更後は `npm run build:engine` を再実行。
