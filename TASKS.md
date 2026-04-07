# 今後の開発タスク（現行）

**最終更新**: 2026-04-07  
再開時の正は `HANDOVER.md`。詳細な現況は `docs/project-status.md`、仕様進捗は `docs/spec-index.json` / `docs/spec-viewer.html`。

## 未着手タスク（高〜中）

| 優先度 | タスク | 備考 |
|--------|--------|------|
| 高 | SP-PLAY-001 手動確認（AC-9〜12） | `docs/specs/play-immersion.md` の検証表に日付/環境/合否を記入 |
| 高 | Unity SDK パリティの最終差分整理 | スライス2実装済。`hasEvent` 条件や edge parity の最終突合 |
| 中 | Vite / Rollup / esbuild 更新検証 | 破壊的変更のため専用ブランチで実施 |
| 中 | WritingPage 連携仕様策定 | 外部フォーマット安定後に着手 |
| 中 | Dynamic Text の Yarn 変換 | engine-ts / web-tester 跨ぎ |
| 中 | spec 保守運用の具体化 | `docs/TECHNICAL_DEBT.md` 参照 |
| 中 | GUI Undo/Redo 手動回帰テスト | E2E 防御的 skip の裏取り |

## 次に実行するコマンド

```powershell
npm run check:spec-index
npm run test:engine
npm run build:all
npm run dev
```

## 参照先

- 再開・次アクション: `HANDOVER.md`
- 現況サマリ: `docs/project-status.md`
- セッション補助: `docs/project-context.md`
- 仕様 SoT: `docs/spec-index.json`, `docs/spec-viewer.html`
