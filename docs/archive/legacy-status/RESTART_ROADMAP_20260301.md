# 再開発ロードマップ (2026-03-01)

**作成日**: 2026-03-01
**前提**: `main` と `origin/main` は一致、`git pull --ff-only` / `git submodule update --init --recursive` / `npm run doctor` / `npm run check` は通過。

## 現在地

- Phase 2 のグラフ編集・エクスポート基盤は完了済み。
- AI は Mock / OpenAI / Ollama を含む実装が入り、Web Tester 側の基礎機能は再開発可能な状態。
- 直近の課題は新機能追加よりも、回帰確認・文書同期・配布品質の底上げ。
- `apps/web-tester` のビルドは成功し、初期 chunk は圧縮されたが、Mermaid 側の大きい async chunk 警告が残る。

## 3段階ロードマップ

| 尺度 | フェーズ | 目的 | 主要タスク | 完了条件 |
|---|---|---|---|---|
| 短期 | Stabilization | 再開発と検証を止めない状態に固定 | Export/Undo/Redo の自動化、現状ドキュメント更新、ローカル作業ノイズ除去 | `npm run check` 維持、自動検証が主要機能をカバー |
| 中期 | Delivery Hardening | 配布品質と保守性を改善 | Mermaid 追加分割、`main.js` の追加分割、レスポンシブ/アクセシビリティ、エクスポート拡張の実運用確認 | 警告削減、主要UIの操作性改善、重い機能の分離完了 |
| 長期 | Collaboration Expansion | 制作ワークフロー全体を強化 | バージョン管理統合、共有リンク、Unity Editor 拡張、大規模モデル向け最適化 | 複数人制作と外部ツール連携を支える基盤が揃う |

## 推奨順

1. 短期フェーズを優先する。理由は、現状の機能量に対して検証と文書同期が追いついていないため。
2. 次に中期フェーズで build 警告と UI 品質を改善する。これは今の利用感に直結する。
3. 長期フェーズは短期・中期で足場を固めた後に着手する。

## 今回の推奨対応

- 最優先: 手動回帰の代替になる自動 smoke 拡充、Export 検証、Undo/Redo 網羅確認
- 並行: `PROJECT_STATUS` / `HANDOVER` / Orchestrator Report の更新
- 次点: Mermaid chunk の追加分割
