# WritingPage受け渡しサンプル（SP-WP-001 0.2）

| ファイル | 種類 | 期待する結果 |
|---|---|---|
| `wp-ng-0.2-branching.json` | 正常 | 3場面のモデル。話者・選択肢・ルビ（`|書類《しょるい》`）を保つ |
| `wp-ng-0.1-text-only.json` | 正常（0.1） | minor違いは互換として取り込み、知らない`updatedAt`は無視 |
| `wp-ng-error-major.json` | 異常 | 期待と受信のversionを示して中止 |
| `wp-ng-error-duplicate.json` | 異常 | 重複したnodeIdを示して中止 |
| `wp-ng-error-missing-text.json` | 異常 | 欠けたフィールド名`text`を示して中止 |

検査は`packages/engine-ts/test/writingpage-contract.spec.ts`。WritingPage側は`js/modules/narrative/NarrativeScreenBridge.js`が同じ形を書く。
