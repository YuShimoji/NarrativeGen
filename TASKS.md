# 今後の開発タスク（現行）

**最終更新**: 2026-04-08  
再開時の正は `HANDOVER.md`。詳細な現況は `docs/project-status.md`、仕様進捗は `docs/spec-index.json` / `docs/spec-viewer.html`。

## 未着手タスク（高〜中）

| 優先度 | タスク | 備考 |
|--------|--------|------|
| 高 | Vite 8 系の PR 判定（lint 基線整理を含む） | [docs/plans/vite-upgrade-branch-checklist.md](docs/plans/vite-upgrade-branch-checklist.md) |
| 高 | SP-DTYARN-001 第2段階（`[entity.property]` / 複合条件） | [docs/specs/dynamic-text-yarn-export.md](docs/specs/dynamic-text-yarn-export.md) |
| 中 | Unity TS エッジ完全一致（API 形状差の調整） | `docs/specs/unity-sdk.md` 未実装節 |
| 中 | WritingPage 連携仕様策定 | 外部フォーマット安定後に着手 |
| 中 | UI a11y / レスポンシブ（Graph/Modal へ展開） | [docs/plans/ui-a11y-responsive-issues.md](docs/plans/ui-a11y-responsive-issues.md) |
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
