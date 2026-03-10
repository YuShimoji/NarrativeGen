# Task 31 Report: Auto Smoke Verification

**Date**: 2026-03-01
**Type**: Automated smoke verification

## Summary

- Web Tester をローカルサーバーで起動し、Playwright で主要フローを自動確認した。
- Graph Editor 初期化時の `this._setupResizeObserver is not a function` を修正し、初期表示時の console error を解消した。
- `linear.json` の実行、Export モーダル表示、Twine / Ink / CSV の format 選択肢表示、Graph タブ描画を確認した。
- 次段の自動化用に、開発時限定の `window.__NARRATIVEGEN_DEVTOOLS__` を追加した。

## Verified Flow

1. `npm run dev -w @narrativegen/web-tester -- --host 127.0.0.1 --port 4173`
2. `http://127.0.0.1:4173/` にブラウザアクセス
3. `linear.json` を選択した状態で `実行`
4. `エクスポート...` を開いて format options を確認
5. `ノードグラフ` タブに切り替えて SVG 描画を確認

## Results

- Session start: OK
- Export modal visible: OK
- Export formats:
  - `twine`: `Twine (Twee) (.twee)`
  - `ink`: `Ink (.ink)`
  - `csv`: `CSV (.csv)`
- Graph render: OK (`#graphSvg` childCount > 0)
- Console errors after fix: none observed in smoke path

## Follow-up

- Export 実ファイルの外部ツール互換確認は未自動化
- Undo/Redo のブラウザ自動 smoke は devtools hook を使って次に拡張しやすい状態になった
