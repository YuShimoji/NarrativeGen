# BL-TGEN-META — GitHub Issue 起票用（文案）

**状態**: 2026-04-08 に決定ログへ記録済み。実装は要件発生まで保留。

## タイトル案

`[SP-TGEN] model.metadata のランタイムプレースホルダ展開を要否・対象フィールドから定義する`

## 本文案

### 背景

- `docs/specs/narrative-text-generation-pipeline.md` §7 に、`model.metadata` への `{…}` 置換が `resolveNarrativeDisplayText` 系に未搭載である旨のギャップが記載されている。
- 現状、プレイ本線・執筆フローでは未使用のため、コアへの組み込みはスコープ外とする決定（2026-04-08 decision-log）。

### この Issue で決めたいこと

1. 展開の対象とする `metadata` キー（例: `title`, `author`, カスタムキー）の列挙
2. プレースホルダ構文（`{variable}` のみか、`[entity.prop]` まで含めるか）
3. 実装場所: engine-ts のみ / Web Tester 表示層 / Unity SDK とのパリティ範囲

### 受け入れ条件（案）

- 仕様書（上記 pipeline + spec-index）のギャップ記述が「実装済み」または「明示的に非対応」のどちらかに更新されている
- 回帰テスト（Vitest）で最低1件、メタデータ展開の挙動が固定されている

### 参照

- `docs/governance/decision-log.md`（2026-04-08 BL-TGEN-META）
- `docs/specs/narrative-text-generation-pipeline.md` §6–7
