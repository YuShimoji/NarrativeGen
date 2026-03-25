# NarrativeGen Web Tester - OpenSpec (Editor UX 強化)

最終更新: 2025-11-07 / 更新者: Cascade

## 1. 目的
- ブラウザ上で物語モデル(JSON)を編集・検証・実行できるエディタを提供する。
- 非エンジニアでもドラッグ&ドロップ/ボタン操作/執筆のみでストーリーを構築できるUXを実現。

## 2. スコープ
- apps/web-tester 内の機能（タブ、GUIエディタ、JSONエディタ、プレビュー、CSV I/O、AI支援）。
- エンジン(@narrativegen/engine-ts)のビルド・実行に依存。

## 3. UX/機能要件（MVP+）
- ノード編集
  - ノードの追加/削除。
  - ノードIDのリネーム（参照更新: choices.target/ startNode/ nodeOrder）。
  - テキスト/タイプ/タグの編集。
  - ノード並び替え: DnDで移動（metadata.nodeOrderで保存）。
- 選択肢(choices)編集
  - 追加/削除/テキスト/ID/ターゲット/条件/効果/アウトカム。
  - 並び替え: 同一ノード内でDnD移動。
- モデル管理
  - オートセーブ: 入力変更時に localStorage へドラフト保存。
  - 保存時は GameSession を再起動し、UI更新（State/Choices/Story）。
- 実行/閲覧
  - ストーリー実行（サンプル/アップロード/ドラッグ&ドロップ）。
  - JSONエディタ（JSONの表示/適用）。
  - ストーリープレビュー（一本道を先読み）。
- 品質
  - Vite上でモジュール解決が無エラー。
  - favicon 404 を解消（データURI採用）。

## 4. 非機能要件
- レスポンシブ（PC優先）。
- 1,000ノード級でもUIが破綻しない（MVPでは性能最適化はベストエフォート）。
- 主要操作はUndoの検討対象（MVP範囲外）。

## 5. アーキテクチャ/依存
- State共有: `getModel/setModel`, `getSession/setSession` のアクセサでDI。
- GUIエディタ: `handlers/gui-editor.js`（nodeList DOM をコンテナとして使用）。
- ノードパネル: `handlers/nodes-panel.js`。
- タブ: `handlers/tabs.js`。
- ユーティリティ: `utils/csv-parser.js`（parse/serialize）等。

## 6. 詳細仕様（実装済/予定）
- ノードIDリネーム: 参照更新（choices.target, startNode, metadata.nodeOrder）。
- DnD 並べ替え:
  - ノード: `.node-item` ⇄ `.node-item`。`metadata.nodeOrder` を更新。
  - 選択肢: `.choice-item` 同一ノード内のみ入替。
- 入力反映: `data-field` に応じて model を更新（choice-id/choice-target/effects 等を反映）。
- オートセーブ: `localStorage['ng_model_draft']` に保存。

## 7. 受け入れ基準
- タブ切替/サンプル実行/GUI編集/保存/キャンセルがエラーなしで完了。
- ノードID変更後も対象ノードへ遷移可能、参照切れが発生しない。
- ノード/選択肢がDnDで並び替え可能、再描画で順序が反映。
- JSONエディタからの適用でUI更新が反映される。
- favicon 404 が発生しない。

## 8. テスト計画（手動）
1. サンプル(tutorial)を実行→ストーリー表示/選択肢表示。
2. GUI編集を開始→ノード追加/選択肢追加→保存→State/Choices/Storyへ反映。
3. ノードIDをA→Bに変更→参照更新検証（startNode/choices/ハイライト/遷移）。
4. ノードDnDで順序変更→再描画で順序反映。
5. 選択肢DnDで順序変更→再描画で反映。
6. 条件/効果をテキストで編集→再描画後も保持（parse失敗時は警告）。
7. `localStorage` にドラフト保存→ページリロード→GUI編集開始で再度反映（将来対応）。
8. JSONエディタに反映→renderState/Choices/Storyが更新。
9. faviconがロードされ 404 が出ない。

## 9. ロードマップ（Tier付き）
- Tier1（低リスク）
  - ドラフト復帰UI（ドラフトがある場合の復元ダイアログ）。
  - JSONエディタの整形/検証のUX改善。
  - キーボードショートカットの追加（Ctrl+SでGUI保存等）。
- Tier2（中リスク）
  - ノード・選択肢の一括編集（検索/置換、タグ編集）。
  - 大規模モデル最適化（仮想スクロール、差分レンダリング）。
  - 変更履歴/Undo（軽量履歴）。
- Tier3（高リスク）
  - クラウド保存/共有、マルチユーザ編集。

## 10. 既知の制約/リスク
- DnDは同一ノード内の選択肢入替のみ（別ノードへの移動は将来対応）。
- ドラフト復帰は仕様に含めたがMVPではUI導線未提供（テスト項目7は将来拡張）。
- choice.id 重複検出はMVPでは警告のみ（将来は強制ユニーク化）。

