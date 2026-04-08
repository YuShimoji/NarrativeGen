# Flaky Issues Tracker

最終更新: 2026-04-08

## 運用ルール

- 再発 2 回目で「候補」へ登録
- 再発 3 回目で「issue 化必須」
- issue 化後は `docs/operations/E2E_FLAKE_RUNBOOK.md` と相互リンクする

## 候補一覧

| Key | 対象 spec | 症状 | 再現条件メモ | 状態 |
|---|---|---|---|---|
| FLK-PLAY-AC5 | `play-immersion` | 遷移後テキスト待機でタイムアウト | CPU競合時に稀発 | tracking |
| FLK-UNDO-GRAPH | `undo-redo` 系 | グラフ描画依存で防御的 skip が残る | 初期描画遅延時 | tracking |
| FLK-MODAL-FOCUS | modal 系 | フォーカス復帰判定が環境依存 | ブラウザ差分 | tracking |

## issue 化テンプレート

- Title: `test(e2e): stabilize <spec> flaky case (<key>)`
- Body:
  - 再現手順
  - 再現率
  - 直近回避策
  - 恒久対策案（待機条件/状態初期化/並列制御）
  - 関連 runbook 記録リンク
