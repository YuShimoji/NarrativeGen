# Unity Adapter 設計

## 目的
- Core(.NET) の Domain/Application を Unity から完全分離し、Unity 依存はアダプタ層に閉じ込める。
- UI イベントと UseCase の橋渡しのみを担当。

## コンポーネント
- `UnityAdapter` (Assembly): Unity 専用の薄いアセンブリ
  - `NarrativeControllerAdapter`: MonoBehaviour。Unity UI からの入力を Application 層に橋渡し
  - `ServiceComposition`: DI 代替の手動組立（`CsvEntityRepository`, `CsvEntityTypeRepository`, `EntityUseCase`）

## 依存方向
```
UnityAdapter --> Application --> Domain
UnityAdapter --> Infrastructure (CSV)
```

## API 方針
- Unity からは `NarrativeControllerAdapter.StartWithEntity(id)` など最小APIを提供
- Application 側は `EntityUseCase` を直接使用

## データ配置
- CSV は `StreamingAssets/NarrativeData/` に配置
- Adapter 側で実行時パスを解決して `CsvEntityRepository`, `CsvEntityTypeRepository` に渡す

## 今後のタスク
- アダプタ用 csproj 作成（`adapters/NarrativeGen.UnityAdapter.csproj`）
- `NarrativeControllerAdapter.cs` 雛形実装
- シーン上の UI からのイベントを接続（`UIManager` 既存資産を極小修正）
- PlayMode テスト雛形作成
