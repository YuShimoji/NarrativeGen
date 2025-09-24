# Architecture

## Goals
- 単純で安全に拡張可能なナラティブ再生エンジン
- Unityとの疎結合統合（UPMパッケージ）
- モデルはJSONスキーマで規定し、例を提供

## Design Principles
- SoC（関心の分離）: モデル（データ）/ セッション（状態）/ エンジン（ロジック）
- SRP: 各クラスは単一責任
- DRY/KISS/YAGNI を徹底
- 名前空間: `VastCore.NarrativeGen`

## Data Model (Schema)
- Model
  - id: string
  - title: string
  - start: node id
  - nodes: Node[]
- Node
  - id: string
  - text: string
  - choices?: Choice[]
- Choice
  - id: string
  - text: string
  - next: node id

## Engine API (C#)
- `LoadModel(string json): NarrativeModel`
- `StartSession(NarrativeModel model): Session`
- `GetAvailableChoices(Session session, NarrativeModel model): IReadOnlyList<Choice>`
- `ApplyChoice(Session session, NarrativeModel model, string choiceId): Session`

## Unity Integration
- UPM パッケージ `com.vastcore.narrativegen`
- 依存: `com.unity.nuget.newtonsoft-json`
- Runtime のみ（最小）。Editor/Tests は段階的に追加。

## Future Work
- 変数・条件分岐、タグ、メタデータ
- セーブ/ロード、診断ログ
- NUnitベースのランタイムテスト
