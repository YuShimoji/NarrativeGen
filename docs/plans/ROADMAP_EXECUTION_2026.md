# ロードマップ実行計画（2026 Q2-Q4）

最終更新: 2026-04-08  
目的: 「現状分析と開発ロードマップ」を実行単位に分解し、短期・中期・長期での完了基準を固定する。

---

## 0. 優先順位の原則

1. **短期の品質安定を先に完了**（SP-PLAY-001 / SP-UNITY-001 / E2E 安定化）
2. **中期の運用品質を強化**（a11y / レスポンシブ / 回帰設計）
3. **長期の連携拡張を後段で着手**（WritingPage / Unity配布改善）

---

## 1. 短期目標（0〜4週間）

### ST-1: SP-PLAY-001 クローズ
- 対象: `docs/specs/play-immersion.md`
- 作業:
  - AC-9〜12 の人的確認ログを記入（実施日、ブラウザ、合否、備考）
  - `docs/TECHNICAL_DEBT.md` の BGM 由来未消化項目を整理
- 完了基準:
  - 検証表の空欄が埋まり、確認結果が追跡可能
  - `spec-index.json` 上の SP-PLAY-001 を `done` 化できる状態
- **2026-04-09 反映**: `play-media-bgm-ac.spec.js` で AC-9〜12 を機械検証し、検証表を Pass で確定。`SP-PLAY-001` は `done`。

### ST-2: SP-UNITY-001 最終パリティ
- 対象: `docs/specs/unity-sdk.md`, `packages/sdk-unity`, `packages/tests/NarrativeGen.Tests`
- 作業:
  - `hasEvent` を含むテンプレ条件の TS/C# 挙動差をテストで固定
  - 未一致エッジケースを最小差分で解消
- 完了基準:
  - TS/C# 差分がテストで再現しない
  - SP-UNITY-001 の「残課題」が具体的な将来課題のみに縮小

### ST-3: 品質運用の定着
- 対象: ルート運用 (`npm run check:safety`, `npm run test:e2e`)
- 作業:
  - `governance` 系チェックを開発手順に明文化
  - E2E フレーク再現パターン（画面/操作/環境）を継続記録
- 完了基準:
  - 再開手順に `check:safety` を組み込み済み
  - E2E 失敗時の切り分け手順が 1 つの文書で参照可能

---

## 2. 中期目標（1〜3か月）

### MT-1: a11y / レスポンシブ改善
- 対象画面:
  - Story View
  - Graph Editor
  - Play View
  - 主要モーダル
- 作業:
  - ARIA 属性・フォーカス遷移・キーボード操作導線を整備
  - モバイル/タブレット向けブレークポイント設計
- 完了基準:
  - 画面ごとのチェックリストが埋まる
  - 主要操作がキーボードで完結

### MT-2: 回帰戦略の再設計
- 対象: `apps/web-tester/tests/e2e`, 手動確認項目
- 作業:
  - 自動化するシナリオと手動確認を再分類
  - Undo/Redo とグラフ操作の手動観点を定例化
- 完了基準:
  - 「自動化対象」「人的確認対象」が重複なく定義済み
  - 新規機能追加時のテスト追加ルールが一貫

### MT-3: Dynamic Text エクスポート方針確定
- 対象: `docs/specs/dynamic-text-engine.md`, `docs/specs/yarn-spinner-export.md`
- 作業:
  - Yarn 等での変換ルールの責務境界を定義
  - 非対応構文の扱い（警告/除外/フォールバック）を固定
- 完了基準:
  - 仕様と実装の不一致箇所が一覧化され、方針が明示される

---

## 3. 長期目標（3〜6か月）

### LT-1: WritingPage 連携（外部仕様安定後）
- 対象: `docs/specs/pipeline-workflow.md`, `docs/USER_REQUEST_LEDGER.md`
- 方針:
  - 依存先フォーマット確定までは仕様整理のみ
  - 安定後に薄い接続スライスで検証実装
- 準備仕様:
  - `docs/specs/writingpage-io-contract.md`（最小 I/O 契約 + versioning + 着手ゲート）
- 完了基準:
  - 入出力契約が固定され、再実装コストが見積もり可能

### LT-2: Unity 配布改善（NuGet 含む）
- 対象: `docs/specs/unity-sdk.md`, `packages/sdk-unity/README.md`
- 方針:
  - UPM 現行導線を維持しつつ配布オプションを段階追加
  - サンプル/ドキュメント優先で導入失敗率を下げる
- 完了基準:
  - 配布チャネルごとの導入手順と制約が明示される

### LT-3: 品質ゲート高度化
- 対象: CI 運用、仕様同期運用
- 方針:
  - 仕様整合・モデル同期・互換性チェックをリリース前提に昇格
- 完了基準:
  - リリース判断に必要なチェックが自動化される

---

## 4. 機能別ロードマップ（要約）

| 機能領域 | 短期 | 中期 | 長期 |
|---|---|---|---|
| Engine (TS) | Unity差分のテスト固定、metadata方針決定 | Dynamic Text 変換方針固定、回帰境界再定義 | 外部連携向け互換契約の明文化 |
| Web Tester | Play/BGM 人的確認完了、Undo/Redo手動回帰 | a11y とモバイル最適化 | authoring 導線最適化 |
| Unity SDK | SP-UNITY-001 最終差分解消 | サンプル/ドキュメント同期 | 配布チャネル拡張（NuGet検討） |
| 品質運用 | governance 手順定着、フレーク記録 | spec 保守テンプレ運用 | 品質ゲートの release-ready 化 |

---

## 5. 直近4週間の実行順

1. SP-PLAY-001 AC-9〜12 の人的確認を実施して記録  
2. SP-UNITY-001 の TS/C# エッジ差分をテストで埋める  
3. E2E フレーク記録テンプレートを運用開始する  
4. a11y/レスポンシブを画面単位で着手する

