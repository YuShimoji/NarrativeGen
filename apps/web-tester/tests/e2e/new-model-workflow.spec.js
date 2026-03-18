import { test, expect } from '@playwright/test';

/**
 * 新規モデル作成 → 編集 → テストプレイ → 保存 の一気通貫ワークフロー
 */

/** Helper: ページを開いて初期化完了を待つ */
async function openPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  // アプリ初期化完了を待つ (モジュール実行完了まで)
  await page.waitForFunction(
    () => window.appState != null,
    { timeout: 15000 }
  );
}

/** Helper: 新規モデルを作成 */
async function createNewModel(page) {
  await page.click('#newModelBtn');
  // appState.model が設定されるまで待つ
  await page.waitForFunction(
    () => window.appState?.model?.startNode === 'start',
    { timeout: 10000 }
  );
}

/** Helper: GUI編集モードに入る */
async function enterEditMode(page) {
  await page.click('button:has-text("編集")');
  await page.waitForFunction(
    () => {
      const el = document.getElementById('guiEditMode');
      return el && el.classList.contains('active') && el.style.display !== 'none';
    },
    { timeout: 5000 }
  );
}

test.describe.configure({ mode: 'serial' });
test.describe('New Model Authoring Workflow', () => {

  test('新規作成ボタンで空モデルが生成される', async ({ page }) => {
    await openPage(page);
    await createNewModel(page);

    // モデル構造を確認
    const model = await page.evaluate(() => ({
      startNode: window.appState.model.startNode,
      nodeCount: Object.keys(window.appState.model.nodes).length,
    }));
    expect(model.startNode).toBe('start');
    expect(model.nodeCount).toBe(1);

    // セッションが開始されている
    const stateView = page.locator('#stateView');
    await expect(stateView).toBeVisible({ timeout: 3000 });
  });

  test('空モデルにノードを追加し選択肢を設定できる', async ({ page }) => {
    await openPage(page);
    await createNewModel(page);
    await enterEditMode(page);

    // 初期状態: startノードが1つ存在
    const nodeEditors = page.locator('.node-editor');
    await expect(nodeEditors).toHaveCount(1, { timeout: 5000 });

    // ノード追加 (prompt ダイアログ)
    page.once('dialog', async dialog => {
      await dialog.accept('scene_two');
    });
    await page.click('#addNodeBtn');

    // 2ノードに増加
    await expect(nodeEditors).toHaveCount(2, { timeout: 5000 });

    // startノードのテキストを編集
    const startTextInput = page.locator('input[data-node-id="start"][data-field="text"]');
    await startTextInput.fill('あなたは暗い部屋にいる。');

    // startノードに選択肢を追加
    await page.click('.add-choice-btn[data-node-id="start"]');

    // 選択肢テキストとターゲットを設定
    const choiceTextInput = page.locator(
      'input[data-node-id="start"][data-choice-index="0"][data-field="text"]'
    );
    await expect(choiceTextInput).toBeVisible({ timeout: 3000 });
    await choiceTextInput.fill('ドアを開ける');

    const choiceTargetInput = page.locator(
      'input[data-node-id="start"][data-choice-index="0"][data-field="target"]'
    );
    await choiceTargetInput.fill('scene_two');

    // scene_twoノードのテキストを編集
    const sceneTwoTextInput = page.locator('input[data-node-id="scene_two"][data-field="text"]');
    await sceneTwoTextInput.fill('外は明るい朝だった。');

    // モデルデータが反映されていることを確認
    const modelData = await page.evaluate(() => ({
      startText: window.appState.model.nodes.start.text,
      choiceCount: window.appState.model.nodes.start.choices.length,
      choiceText: window.appState.model.nodes.start.choices[0]?.text,
      choiceTarget: window.appState.model.nodes.start.choices[0]?.target,
      sceneTwoText: window.appState.model.nodes.scene_two?.text,
    }));

    expect(modelData.startText).toBe('あなたは暗い部屋にいる。');
    expect(modelData.choiceCount).toBe(1);
    expect(modelData.choiceText).toBe('ドアを開ける');
    expect(modelData.choiceTarget).toBe('scene_two');
    expect(modelData.sceneTwoText).toBe('外は明るい朝だった。');
  });

  test('編集したモデルでテストプレイができる', async ({ page }) => {
    await openPage(page);
    await createNewModel(page);
    await enterEditMode(page);

    // ノード追加
    page.once('dialog', async dialog => {
      await dialog.accept('ending');
    });
    await page.click('#addNodeBtn');

    // startノード編集
    await page.locator('input[data-node-id="start"][data-field="text"]').fill('冒険の始まり。');

    // 選択肢追加
    await page.click('.add-choice-btn[data-node-id="start"]');
    await page.locator('input[data-node-id="start"][data-choice-index="0"][data-field="text"]').fill('進む');
    await page.locator('input[data-node-id="start"][data-choice-index="0"][data-field="target"]').fill('ending');

    // endingノード編集
    await page.locator('input[data-node-id="ending"][data-field="text"]').fill('冒険は終わった。');

    // GUI編集を保存 (セッション再開始 + ストーリータブに復帰)
    await page.click('#saveGuiBtn');
    await page.waitForTimeout(500);

    // ストーリービューにstartノードのテキストが表示される
    const storyContent = page.locator('#storyContent');
    await expect(storyContent).toContainText('冒険の始まり', { timeout: 10000 });

    // 選択肢ボタンが表示される
    const choiceBtn = page.locator('#choices button:has-text("進む")');
    await expect(choiceBtn).toBeVisible({ timeout: 5000 });

    // 選択肢をクリック
    await choiceBtn.click();

    // endingノードに遷移
    await expect(storyContent).toContainText('冒険は終わった', { timeout: 5000 });
  });

  test('モデルをダウンロード保存できる', async ({ page }) => {
    await openPage(page);
    await createNewModel(page);
    await enterEditMode(page);

    // startノードにテキスト設定
    await page.locator('input[data-node-id="start"][data-field="text"]').fill('テスト用モデル');

    // GUI編集モード内の「保存」ボタンでダウンロード
    const downloadPromise = page.waitForEvent('download');
    await page.click('#downloadBtn');
    const download = await downloadPromise;

    // ファイル名の確認
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // ダウンロード内容の確認
    const content = await download.createReadStream().then(stream => {
      return new Promise((resolve) => {
        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve(data));
      });
    });

    const parsed = JSON.parse(content);
    expect(parsed.modelType).toBe('adventure-playthrough');
    expect(parsed.startNode).toBe('start');
    expect(parsed.nodes.start.text).toBe('テスト用モデル');
  });

  test('writer_tutorial.json がサンプル一覧に表示される', async ({ page }) => {
    await page.goto('/');
    const option = page.locator('#modelSelect option[value="writer_tutorial"]');
    await expect(option).toBeAttached();
    await expect(option).toHaveText('writer_tutorial.json');
  });

  test('writer_tutorial.json をサンプルから読み込み実行できる', async ({ page }) => {
    await openPage(page);

    await page.selectOption('#modelSelect', 'writer_tutorial');
    await page.click('#startBtn');

    // モデルが読み込まれるまで待つ
    await page.waitForFunction(
      () => window.appState?.model?.nodes?.apartment != null,
      { timeout: 15000 }
    );

    // ストーリーが表示される
    const storyContent = page.locator('#storyContent');
    await expect(storyContent).toContainText('letter', { timeout: 5000 });

    // 選択肢が表示される (apartment has 2 choices)
    const choices = page.locator('#choices button');
    await expect(choices).toHaveCount(2, { timeout: 3000 });
  });
});
