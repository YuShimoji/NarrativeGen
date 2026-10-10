# NarrativeGenをCloud Codexで開発する

Cloudでは既存のnpm workspaceをlockfileから再現し、TypeScript engine、Web Tester、Public Studioのbuildと試験を実行する。現在のCloud用browser profileはChromiumで、Public Studioの既存実操作試験に使う。通常のローカルsetupはChromium / Firefox / WebKitを準備する。Sitesの公開、外部AI API呼出し、Unity SDKのEditor検証は、それぞれの既存権限・実行環境へ従う。

## 環境の設定

| 設定 | 値 |
|---|---|
| Repository | `YuShimoji/NarrativeGen` |
| 開発branch | `codex/cloud-codex-environment-20261011`。基点は`main`の`cea2545` |
| 作業root | Repository root。npm workspaceを子フォルダ単独でinstallしない |
| Node.js | 22.13以上。既存Sites adapterの`engines`に従う。22 LTSまたは24 LTS |
| Install script / legacy Setup script | `bash scripts/codex/setup.sh` |
| legacy Maintenance script | `bash scripts/codex/maintenance.sh` |
| 通常の検証 | `bash scripts/codex/check.sh` |
| Secrets | ローカルfixture、build、ブラウザー試験には不要 |
| Cloudのcache | `npm_config_cache=/workspace/.npm-cache`、`PLAYWRIGHT_BROWSERS_PATH=/workspace/.playwright-browsers`。Install scriptとStart skillで同じ値を使う |
| Cloudのbrowser profile | `CODEX_PLAYWRIGHT_BROWSERS=chromium`、`XDG_CACHE_HOME=/workspace/.cache`。3browserを使える通常環境ではprofile変数を設定しない |
| Privacy | Only me |

Node 20を使う旧CI例を環境作成の既定値にしない。依存の追加やpackage-lockの更新はこの環境整備に含めない。setupは既存lockfileの`npm ci`、既存Playwrightのbrowser install、指定したbrowserの起動とページ表示、`build:all`を実行する。既定は3browser。Linuxでrootまたはpasswordless sudoを使える時は`--with-deps`でOSライブラリも準備する。それ以外は既存OSライブラリで対象browserを実際に起動し、ライブラリ不足ならsetupを失敗させる。root認証を求めて停止したり、不足を無視して成功stampを作ったりしない。

Cloudで3browserも診断した。Firefoxは書き込み可能なFontconfig cacheを指定してもread-only `/proc/self/uid_map`で起動が完了せず、WebKitは不足ライブラリと配布wrapperの検索path制限が残った。Cloudの標準検証には実起動済みChromiumを使う。Web Testerの既存3browser試験を変更・省略して合格へ読み替えない。3browserが必要な変更は対応するローカル環境で同じ`npm run test:e2e`を実行する。

現行CloudではInstall scriptとStart skillを保存してPublishする。既存環境の編集はSave後にRepublishし、新しいtaskで確認する。legacy環境にはSetup / Maintenance scriptの同じコマンドを設定できる。[公式の環境設定手順](https://learn.chatgpt.com/docs/environments/cloud-environments)を参照。

Start skillには次の手順を指定する:

1. Repository rootの`AGENTS.md`、`docs/REPO_LOCAL_RULES.md`、`HANDOVER.md`を読む。
2. 上表のCloud用profileとcache変数をexportして`bash scripts/codex/maintenance.sh`を実行する。依存の入力、runtime、browser profileまたはbrowser保存先が変わった時だけsetupを再実行し、生成物をbuildする。
3. UIを編集する時は`npm run dev:public`（port 5174）または`npm run dev:tester`（port 5173）を起動してreadyを確認する。テストのwebServerは自動起動なので別サーバーは不要。
4. 変更に応じた対象試験を実行する。結果は同じtaskと担当ファイルへ保存し、別chatへの通知・ACK・自動転送を行わない。

## 検証の選び方

```bash
bash scripts/codex/setup.sh
bash scripts/codex/check.sh
```

通常検証は既存の`check:safety`、`build:all`、engine / tester / publicのunit・contract試験とPublic StudioのChromium実操作を実行する。`check:safety`にはspec index、文書の正本、encoding / Git indexの改行、models syncの検査が含まれる。

| 変更対象 | 追加の検証 |
|---|---|
| Web Testerの実操作 | `npm run test:e2e`。対応するローカル環境でsetup済み3browserを使用。現在のCloud profileはChromiumに限定 |
| Sites adapter | `npm run test:sites-adapter`。既存payload、hosting manifest、buildと実操作を確認 |
| Unity C# SDK | 正しい版のUnity Editorまたは既存C#試験。npm試験では代替しない |

`npm run clean`と`fresh-install`は通常Cloud経路に使わない。maintenanceはlockfile、workspace manifest、setup script、Node版、OS、architecture、browser profileとbrowser保存先の一致をignoredの`node_modules`内で判定する。入力が変われば有限のsetupを一度実行する。既存taskの作業ファイルやブラウザーの保存データを削除しない。

新環境のネットワークにはnpm registryとPlaywrightのbrowser配布先が必要。既存のPackage managers設定で足りない場合は、setupログで不足hostを確認する。Cloudでは`cdn.playwright.dev`の許可が必要だった。外部APIやSitesの公開権限は追加しない。

2026-10-11の隔離checkout（Windows / Node 24.13.0）で、lockfileを変えずにsetupとmaintenanceを実行した。`check.sh`は完了し、engine 335件、Public Studio contract 4件、Chromium実操作3件が通過した。保存した文章の再読込、choice編集、JSON export/importと狭いviewportを実操作で確認した。workspace別のVite配置を判別し、古いsetup stampを拒否する検査も確認した。LinuxのOSライブラリinstallとCloudの実行結果は環境のsetup reportで確認する。
