export const AI_UX_CONFIG = {
  historyLimit: 5,
  storageKeys: {
    aiConfig: 'narrativeGenAiConfig',
    aiHistory: 'narrativeGenAiHistory',
  },
  ui: {
    marks: {
      success: '✅',
      error: '❌',
    },
    units: {
      seconds: '秒',
    },
  },
  defaults: {
    provider: 'mock',
    openaiModel: 'gpt-3.5-turbo',
  },
  labels: {
    adopt: '採用',
    historyTitle: '履歴',
    currentTitle: '結果',
    emptyHistory: '履歴はありません',
    applied: 'ノードテキストを更新しました',
    missingApiKey: 'OpenAI APIキーを設定してください',
    missingProviderValue: 'AIプロバイダーを選択してください',
    missingModel: 'モデルを読み込んでから実行してください',
    missingText: '現在のノードにテキストがありません',
    generating: '⏳ 生成中...',
    paraphrasing: '⏳ 言い換え中...',
    settingsSaved: 'AI設定を保存しました',
    missingApiKeyInput: 'OpenAI APIキーを入力してください',
    providerInitializedSuffix: 'プロバイダーが初期化されました',
    providerInitFailedPrefix: 'AIプロバイダーの初期化に失敗しました: ',
    generateTitle: '生成されたテキスト',
    paraphraseTitle: '言い換え結果',
    apiErrorPrefix: 'APIエラー: ',
    apiKeyCheckHint: 'APIキーを確認してください。',
    generateFailedPrefix: '生成に失敗しました: ',
    paraphraseFailedPrefix: '言い換えに失敗しました: ',
  },
  generate: {
    choiceText: '続き',
  },
  paraphrase: {
    variantCount: 3,
    style: 'desu-masu',
    tone: 'neutral',
  },
  history: {
    metaPrefix: '',
  },
}
