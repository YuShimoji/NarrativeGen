# NarrativeGen Minimal Sample

このサンプルは `MinimalNarrativeController` の動作を確認するための最小構成です。

## 使い方
1. Unity メニューから次を実行:
   - `NarrativeGen > Create Minimal Sample Scene`
2. `Assets/NarrativeGenSamples/MinimalSample.unity` が生成されます。
3. シーンを開き、再生すると Console に以下が出力されます:
   - brand: `MacBurger`
   - description: `これはおいしいチーズバーガーです`

補足: メニュー実行時に `Assets/NarrativeGenSamples/Entities.csv` も生成され、
`MinimalNarrativeController` の `EntitiesCsv` に自動で割り当てられます。
