# WORKFLOW STATE SSOT

## Mission

NarrativeGen Phase 2 完了後の Stabilization。ユーザーが GUI 上で直感的にストーリーデータを編集し、エンジン互換の JSON として正しく出力・プレビューできるループの品質を固定し、再開発可能な安定状態を維持する。

## Done 条件

- [ ] Export (Twine/Ink/CSV) の実運用における出力結果の正当性確認
- [ ] GUI エディタの Undo/Redo の網羅的な手動回帰テストの実施
- [ ] `npm run check` (Lint/Test/Validate/Build) が常にグリーンであること
- [ ] `main.js` の巨大化や build chunk 警告の整理・最適化方針の決定

## 選別規則

- A. バグ修正、Export 互換性向上、手動回帰テストに直結する変更
- B. 開発・検証の生産性を向上させるオートメーションやドキュメント整備
- C. 操作ミスからの復旧容易性 (Undo/Redo, 自動保存等) の強化
- D. 当面の品質固定に寄与しない新規機能 (Unity 連携、共有リンク等) や、本質的でないリファクタリング → **凍結**

## 禁止事項

- `Packages/` (エンジンコア) と `apps/web-tester/` (ツール) の責務を混同させる変更
- エンジン互換性（条件・効果の `raw` データ保持）を破壊するモデル変更
- テスト未実施のコードの `main` への直接 push (PRベースを推奨)
