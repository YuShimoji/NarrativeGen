このディレクトリには、NarrativeGenの動作テストに使用できるサンプルデータが格納されています。

- Entities.csv:
  物語に登場する人物、場所、アイテムなどを定義します。
  `id`はシステムが内部で参照する一意のIDです。
  `name`は実際にゲーム画面に表示される名前です。

- Propositions_Level1_Simple.csv:
  最も基本的な形式の文章データです。
  `rawText`内の`[id]`が、`Entities.csv`で定義された`name`に置き換えられます。

- Propositions_Level2_Dialogue.csv:
  話者ID(`speakerId`)の列を追加した、セリフ形式のデータです。
  `speakerId`に`Entities.csv`の`id`を指定すると、そのキャラクターの発言として扱われます。
  `System`と指定すると、地の文（ナレーション）として扱われます。

- Propositions_Level3_Advanced.csv:
  layer(階層), certainty(確実性)など、より高度な論理情報を付与したデータです。
  これらの値は将来的に、AIが物語の文脈を理解し、矛盾を検出するために使用されます。 