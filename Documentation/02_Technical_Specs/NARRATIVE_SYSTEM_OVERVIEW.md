# NarrativeGen システム概要設計書

## 1. 概要

このドキュメントは、`NarrativeGen`プロジェクトの現在のシステム仕様、実装済み機能、および今後の拡張計画をまとめたものです。開発の方向性を明確にし、共通認識を形成することを目的とします。

---

## 2. 現在のアーキテクチャ

`NarrativeGen`は、CSVデータに基づいて動的な物語を生成・実行する、モジュール化されたシステムです。主要なコンポーネントは以下の通りです。

```mermaid
graph TD
    subgraph Unity Scene
        GameManager_Obj[GameManager]
        UIManager_Obj[UIManager]
    end

    subgraph "Core Logic (C# Scripts)"
        A[GameManager] -- "実行を管理" --> B(LogicEngine)
        B -- "ナラティブデータを要求" --> D{DatabaseManager}
        B -- "状態を更新/参照" --> E{WorldState}
        A -- "結果をUIに反映" --> C(UIManager)
        C -- "ユーザー選択を通知" --> A
    end
    
    subgraph "Data Layer"
        F[CSV Files<br/>(Events, etc.)]
    end

    GameManager_Obj -- "参照" --> A
    UIManager_Obj -- "参照" --> C
    D -- "パース" --> F
    E -- "保持" --> H(Entities & Properties)


    style F fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
    style E fill:#cfc,stroke:#333,stroke-width:2px
```

-   **GameManager**: ゲーム全体の進行を管理する中心的なクラス。`LogicEngine`を初期化し、イベントの処理を開始させ、結果を`UIManager`に渡します。
-   **LogicEngine**: 物語の論理を司る心臓部。CSVから読み込まれたコマンドを解釈・実行します。
-   **DatabaseManager**: `StreamingAssets`内のCSVファイルを読み込み、`LogicEngine`が利用可能なデータ形式に変換します。
-   **WorldState**: 「プレイヤーが鍵を持っているか」といった、物語世界の現在の状態をすべて記録・管理します。
-   **UIManager**: `GameManager`からの指示に基づき、ナレーションや選択肢を画面に表示し、プレイヤーの入力を`GameManager`に伝えます。

---

## 3. コマンドリファレンス

`Events.csv`の`command`列に記述することで、以下の機能を使用できます。

### `GOTO`
-   **実装ステータス**: ✅ 実装済み
-   **書式**: `GOTO(target_event_id)`
-   **機能**: 指定された`target_event_id`に処理をジャンプさせます。
-   **例**: `GOTO(event_room_2)`

### `SAY`
-   **実装ステータス**: ✅ 実装済み
-   **書式**: `SAY(speaker, text)`
-   **機能**: 指定された`speaker`が`text`の内容を発言した、という結果を返します。`UIManager`がこれを画面に表示します。
-   **例**: `SAY(ナレーション, "重い扉が開いた。")`

### `SET`
-   **実装ステータス**: ✅ 実装済み
-   **書式**: `SET(entity.property, value)`
-   **機能**: `WorldState`内の指定されたエンティティ(`entity`)が持つプロパティ(`property`)の値を`value`に変更します。フラグ管理の基本です。
-   **例**: `SET(player.has_key, true)`

### `IF`
-   **実装ステータス**: ✅ 実装済み
-   **書式**: `IF(condition, event_if_true, event_if_false)`
-   **機能**: `condition`を評価し、結果が真なら`event_if_true`に、偽なら`event_if_false`に処理をジャンプさせます。
-   **条件式の書式**: `entity.property == value`
-   **例**: `IF(player.has_key == true, event_unlock_door, event_door_is_locked)`

### `CHOICE`
-   **実装ステータス**: ✅ 実装済み
-   **書式**: `CHOICE(テキスト1:event_id1, テキスト2:event_id2, ...)`
-   **機能**: プレイヤーに選択肢を提示します。各選択肢は`テキスト`と、選ばれた場合にジャンプする`event_id`のペアで構成されます。
-   **例**: `CHOICE(扉を開ける:event_door_opened, 窓を調べる:event_window_checked)`

### `ADD` / `SUBTRACT`
-   **実装ステータス**: ❌ 未実装
-   **書式**: `ADD(entity.property, value)`
-   **機能**: `WorldState`内の指定されたプロパティの数値に`value`を加算（または減算）します。所持金や好感度などの管理に使用します。
-   **例**: `ADD(player.money, 100)`

### `GIVE` / `TAKE`
-   **実装ステータス**: ❌ 未実装
-   **書式**: `GIVE(item_id, quantity)`
-   **機能**: `WorldState`のインベントリに、指定された`item_id`のアイテムを`quantity`個追加（または削除）します。
-   **例**: `GIVE(item_potion, 1)`

---

## 4. 今後の拡張計画

### 【中期目標】システムの表現力を高める機能

#### 4.1. 論理演算子 (NOT, OR) の導入
-   **目的**: より複雑な条件分岐を可能にし、物語の論理性を高める。
-   **コマンド形式案**: `reason`フィールドで `!` (NOT) や `|` (OR) を使用。例: `!I_02_01`, `F_05_02|F_05_03`

#### 4.2. WorldStateの拡張 (`requires`/`effects`)
-   **目的**: イベントの発生条件や結果をより明確にデータ側で定義できるようにする。
-   **実装案**: CSVに`requires`（前提条件）と`effects`（状態変化）カラムを追加する。

### 【長期目標】より野心的な機能

#### 4.3. キャラクター別の信念管理
-   **目的**: キャラクターごとに異なる情報を持たせ、誤解やすれ違いといった人間ドラマを描写する。
-   **実装案**: `LogicEngine`内にキャラクター別の信念セットを持たせる。

#### 4.4. 動的な確実性(Certainty)計算
-   **目的**: 情報の「確かさ」を動的に計算し、噂話と事実を区別して扱えるようにする。
-   **実装案**: 信念を単なる`HashSet`ではなく、確実性を含む`Dictionary`で管理する。

#### 4.5. 時系列とイベントシーケンス
-   **目的**: イベントの発生順序を管理し、アリバイや時間経過が重要なシナリオを扱えるようにする。
-   **実装案**: 各データにタイムスタンプを持たせる。 