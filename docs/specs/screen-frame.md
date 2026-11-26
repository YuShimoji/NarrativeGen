# SP-SCREEN-001 画面フレーム

Status: StudioとUnity Editorのチャットで「藍布の耳」の固定経路を結末まで照合。WritingPageのReaderで同じ再生記録を表示。[操作・確認](../../HANDOVER.md#unitychatnovelgamewritingpageとの接続)
Date: 2026-11-26

## 目的

NarrativeGenの物語を、Studio（HTML）、UnityChatNovelGameのチャット、WritingPage（Zen Writer）のReaderで同じ画面として見せる。
各画面は物語のモデルを直接読まず、1手ごとの「画面フレーム」を描く。フレームの作り方を1か所に決め、TypeScriptとC#で同じ結果を出す。

2026-11-26のuserの依頼（原文）:「このプロジェクトで、NarrativeGenの画面をUnityChatNovelGame上で再現する試みを行っていますが、今のところ画面の互換性がないため、画面の互換性を持たせるシステムを構築してください。この画面互換性は、WritingPageの実装とも互換性を持たせるよう包括的に整備してください。」

着手時に見つかった非互換（Unityの`NarrativeGenPlayback`）: 話者「場所｜名前」と本文を1つのシステム文に連結していた。話題と行き先の区別、本文中の話題語、旅の手帳、依頼名、結末の表示が無かった。
選択肢の「〔蓋然 n%〕」を消していなかった。C#の本文解決が、物もイベントも無い場面で条件付きの文 `{?flag:…}` を処理せず、イベントの有無を条件として読まず、イベント無しの会話テンプレートを差し込まなかった。

## フレームの形（version 1）

| キー | 型 | 意味 |
|---|---|---|
| `format` / `version` | `"narrativegen-screen-frame"` / `1` | 互換の判定。versionが違えば描かない |
| `layout` | `standard` / `inquiry` | 既定は `variables.表示形式 == 聞き込み` で `inquiry`。呼び出し側が上書きできる |
| `step` | number | 開始場面が0 |
| `nodeId` | string | 今の場面 |
| `choiceId` / `choiceText` | string / null | ここへ来た選択肢と、その表示文。開始場面はnull |
| `header` | `{region, title, goal}` / null | inquiryだけ。`variables.地域`・`依頼名`・`依頼`（今のsessionの値） |
| `place` / `speaker` | string | inquiryは話者ラベル `場所｜名前` を分ける。`｜`が無ければ全体が名前。standardは`place`が空で、`speaker`はラベルのまま |
| `paragraphs` | `{text, choiceId?}[][]` | 解決済みの本文を空行で段落に分ける。inquiryでは今選べる話題の文と同じ語に`choiceId`を付ける（長い語が先、同じ文は後の話題） |
| `choiceGroups` | `{role, label, choices[{id, text, visited}]}[]` | 今選べる選択肢だけ。inquiryは`go_`で始まるidを行き先、他を話題に分け、話題→行き先の順。standardは1群「選択肢」。空の群は出さない。`text`は末尾の「〔蓋然 n%〕」を消した文。`visited`は行き先の場面をこの道筋で通った時true |
| `notes` | `{source, text}[]` | この道筋で作られた・変わったイベントの名前を古い順に。`source`はイベントの`asker`→`speaker`→`observer`の人物名、無ければその手を打った場面の話者名 |
| `newNote` | boolean | この手でnoteが増えた |
| `ending` | boolean | 場面に選択肢が1つも無い |

閉じている選択肢と閉じている理由、知覚・蓋然などの判断はStudioの作者向けの欄で、プレイヤーの画面フレームには入れない。

## 実装

| 役割 | 場所 |
|---|---|
| TS基準 | `packages/engine-ts/src/screen-frame.ts`（`buildScreenFrame(model, route)`、`playScreenFrames(model, choiceIds)`） |
| C# SDK | `packages/sdk-unity/Runtime/ScreenFrame.cs`（`ScreenFrameBuilder`。`Current`と`Choose(id)`、`ToJson()`） |
| 正解ファイル | `packages/tests/NarrativeGen.Tests/ScreenFrames/*.json`。`npm run generate:screen-frames`で書き、`npm run check:screen-frames`で古さを検査 |
| 照合 | Studio: `apps/studio/test/screen-frame.test.mjs`（会話窓`ash-ferry.js`の各手と比較）。C#: `ScreenFrameConformanceTests`（正解ファイルとJSONで比較） |

## 画面ごとの描き方

| フレーム | Studio会話窓 | Unityチャット（UnityChatNovelGame） | WritingPage Reader |
|---|---|---|---|
| `header` | 地域・依頼名の見出し、旅の手帳の依頼 | 開始時にシステム文で地域・依頼名・依頼 | 見出しと`:::zw-textbox{role:"narration"}` |
| `place` | 会話の帯 | 場所が変わった時にシステム文 | `:::zw-textbox{role:"narration"}` |
| `speaker` + `paragraphs` | 話者名と本文、話題語はボタン | 話者名つき吹き出しを段落ごとに | `:::zw-dialog{speaker, position:"left", style:"bubble"}` |
| `choiceText` | — | プレイヤー吹き出し | `:::zw-dialog{position:"right"}` |
| `choiceGroups` | 話題／行き先の群 | 群の順の選択肢ボタン（行き先は印つき） | 末尾の場面だけ選択肢の一覧 |
| `newNote` | 「旅の手帳に記した」 | システム文で手帳の記述 | `:::zw-textbox{role:"system"}` |
| `ending` | 結末と依頼完了 | 結末のシステム文と手帳の一覧 | 「結末」の行 |

見た目（色・文の言い回し・記号）はそれぞれの画面の持ち物で、フレームは何を見せるかだけを決める。
