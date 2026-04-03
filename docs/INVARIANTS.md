# Invariants

破ってはいけない条件・責務境界・UX不変量を保持する正本。

## UX / Algorithmic Invariants

- JSON が主要エクスポートパス。NarrativeGen 独自機能 (Dynamic Text / Entity-Property / ConversationTemplate / Event / Character Knowledge) は JSON + 独自ランタイム (engine-ts / sdk-unity) でのみ完全保存される (Decision #3)
- Play モードの表示: 段落フェードイン + 選択肢はストーリー内インライン配置 (SP-PLAY-001 設計確定)
- スキーマバリデーションは Ajv + assertModelIntegrity の二層構造
- UI はマウス操作主体。キーボードショートカットはフォールバック
- Stage 1 (構想・設計) に AI 支援機能を導入しない (Decision #4: スコープ外)

## Responsibility Boundaries

- 1人運用前提。P1 (ライター) / P2 (テクニカルデザイナー) / P3 (インテグレーター) は帽子の切替であり、別担当者ではない
- ライター自身が条件/効果を設定する。条件設計を別担当者に分離するモデルではない (2026-03-08 決定)
- WritingPage 連携は双方向だが、WritingPage 側のフォーマット安定が前提条件。不安定な状態での連携実装は行わない
- TypeScript 版 (engine-ts) が SDK の正本。Unity SDK (sdk-unity) は TS 版のパリティを目標とし、独自に進化しない
- AI は執筆しない。制作システム整備が役割

## Prohibited Interpretations / Shortcuts

- WritingPage 連携延期を「不要」と解釈しない。タイミング調整のみ
- Yarn / Ink / Twine エクスポートでの Dynamic Text 非互換を「バグ」と解釈しない。JSON 主軸戦略に基づく設計上の制約
- ユーザー未指定の固有名詞・方式を勝手に採用しない
- rejected を「工程不要」と解釈しない
- 振り子判断 (「前回 UI が多かったから次はコンテンツ」) で作業を選ばない

## 運用ルール

- ユーザーが一度説明した非交渉条件は、同一ブロック内でここへ固定する
- `project-context.md` の DECISION LOG には理由を短く残し、ここには条件そのものを残す
