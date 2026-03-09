# NarrativeGen

繝翫Λ繝・ぅ繝也函謌舌す繧ｹ繝・Β縲５ypeScript / Node.js API 繝舌ャ繧ｯ繧ｨ繝ｳ繝峨・

## Key Paths

- Source: `src/`

## Rules

- Respond in Japanese
- No emoji
- Do NOT read `docs/reports/`, `docs/inbox/` unless explicitly asked
- Use Serena's symbolic tools (find_symbol, get_symbols_overview) instead of reading entire source files
- When exploring code, start with get_symbols_overview, then read only the specific symbols needed
- Keep responses concise 窶・avoid repeating file contents back to the user

## Spec View

莉墓ｧ倥ラ繧ｭ繝･繝｡繝ｳ繝医・荳隕ｧ繝ｻ繧ｹ繝・・繧ｿ繧ｹ繝ｻ螳溯｣・紫繧偵ヶ繝ｩ繧ｦ繧ｶ縺ｧ遒ｺ隱阪〒縺阪ｋ縲・

- 繝・・繧ｿ: `docs/spec-index.json` (Source of Truth)
- 髢ｲ隕ｧ: `docs/spec-viewer.html` (`npx serve docs` 竊・`http://localhost:3000/spec-viewer.html`)
- 莉墓ｧ倥ｒ霑ｽ蜉繝ｻ譖ｴ譁ｰ縺励◆繧・spec-index.json 繧ゆｽｵ縺帙※譖ｴ譁ｰ縺吶ｋ縺薙→

## Decision Log

| 譌･莉・| 豎ｺ螳壻ｺ矩・| 驕ｸ謚櫁い | 豎ｺ螳夂炊逕ｱ |
|------|----------|--------|----------|
| 2026-03-07 | Ollama (繝ｭ繝ｼ繧ｫ繝ｫLLM) 繝励Ο繝舌う繝繧貞ｮ悟・蜑企勁 | A) OpenRouter邨ｱ蜷・/ B) Ollama謾ｹ蝟・/ C) 蜃咲ｵ・/ D) 螳悟・蜑企勁 | 邊ｾ蠎ｦ繝ｻ繝ｪ繧ｽ繝ｼ繧ｹ雋闕ｷ縺ｫ髮｣縺ゅｊ縲る撼AI繝代Λ繝輔Ξ繝ｼ繧ｺ縺後が繝輔Λ繧､繝ｳ蟇ｾ蠢懈ｸ医∩縲・IProvider繧､繝ｳ繧ｿ繝ｼ繝輔ぉ繝ｼ繧ｹ縺ｯ諡｡蠑ｵ蜿ｯ閭ｽ縺ｪ縺溘ａ蟆・擂蜀榊ｮ溯｣・庄閭ｽ |
| 2026-03-07 | 繝ｬ繧ｬ繧ｷ繝ｼDoc 7莉ｶ繧壇ocs/archive/縺ｫ遘ｻ蜍・| 遘ｻ蜍・/ 菫晉蕗 | Windsurf AI Collab Rules x3 + 繝偵Φ繝育ｳｻ.md x3 + REPORT_CONFIG.yml縲・LAUDE.md菴灘宛縺ｧ荳堺ｽｿ逕ｨ縲・｣蜍輔せ繧ｯ繝ｪ繝励ヨ荳榊惠 |
| 2026-03-07 | 譌ｧ險育判Doc 4莉ｶ蜑企勁縲．EVELOPMENT_PLAN.md縺ｧ鄂ｮ謠・| archive遘ｻ蜍・/ 驛ｨ蛻・紛逅・/ 螳悟・蜑企勁 | MID_TERM_TASKS, NEXT_PHASE_PROPOSAL, features-status, RESTART_ROADMAP縺ｯShared Workflows蜑企勁縺ｫ莨ｴ縺・Ξ繧ｬ繧ｷ繝ｼ蛹悶ゅさ繝ｼ繝画爾邏｢繝吶・繧ｹ縺ｮ譁ｰ繝励Λ繝ｳ縺ｧ鄂ｮ謠・|
| 2026-03-07 | AI繝舌ャ繝∝・逅・蜈ｨ繝弱・繝我ｸ諡ｬAI險縺・鋤縺・繧貞炎髯､ | 蜷ｫ繧√ｋ / 蜑企勁 / 菫晉蕗 | 繧ｳ繧ｹ繝亥ｯｾ蜉ｹ譫應ｸ肴・縲・atchEditor縺ｮ讀懃ｴ｢鄂ｮ謠帙ヰ繝・メ縺ｯ蟄倡ｶ・|
| 2026-03-07 | 繧ｳ繝ｩ繝懈ｩ溯・(繝舌・繧ｸ繝ｧ繝ｳ邂｡逅・繝槭Ν繝√Θ繝ｼ繧ｶ繝ｼ/蜈ｱ譛峨Μ繝ｳ繧ｯ)繧貞炎髯､ | 驛ｨ蛻・治逕ｨ / 蜈ｨ菫晉蕗 / 蜈ｨ蜑企勁 | 繧ｹ繧ｳ繝ｼ繝鈴℃螟ｧ縲ゅす繝ｳ繧ｰ繝ｫ繝ｦ繝ｼ繧ｶ繝ｼ繝・・繝ｫ縺ｨ縺励※驕狗畑 |
| 2026-03-07 | 髢狗匱蜆ｪ蜈磯・ 螟画焚諡｡蠑ｵ竊知ain.js蛻・牡竊炭arn Spinner竊偵Ξ繧ｹ繝昴Φ繧ｷ繝・a11y竊偵メ繝｣繝ｳ繧ｯ譛驕ｩ蛹・| 隍・焚譯・| 讖溯・縺ｮ譬ｸ(螟画焚)繧貞・陦後∽ｿ晏ｮ域ｧ(main.js)縺ｯ谺｡轤ｹ |
| 2026-03-08 | WritingPage騾｣謳ｺ縺ｯ蜿梧婿蜷・| GUI荳ｭ蠢・/ WritingPage蝓玖ｾｼ / 迢ｬ閾ｪDSL / 繝上う繝悶Μ繝・ラ | NarrativeGen竊淡ritingPage縲仝ritingPage竊誰arrativeGen縺ｮ荳｡譁ｹ繧呈Φ螳・|
| 2026-03-08 | 譚｡莉ｶ/蜉ｹ譫懆ｨｭ螳壹・繝ｩ繧､繧ｿ繝ｼ閾ｪ霄ｫ縺梧球蠖・| 繝ｩ繧､繧ｿ繝ｼ閾ｪ霄ｫ / 蛻･諡・ｽ・繝・じ繧､繝翫・) | 蛻・･ｭ繝｢繝・Ν縺ｧ縺ｯ縺ｪ縺・よ擅莉ｶ/蜉ｹ譫懊お繝・ぅ繧ｿ縺ｮUX縺碁㍾隕・|
| 2026-03-08 | Twine/Ink繧ｨ繧ｯ繧ｹ繝昴・繧ｿ繝ｼ縺ｯ邯ｭ謖・| 邯ｭ謖・/ Yarn蜆ｪ蜈・/ 蜑企勁 | 豎守畑莠呈鋤蜃ｺ蜉帙→縺励※蟄倡ｶ壹・arn霑ｽ蜉縺ｯ蛻･騾・|
| 2026-03-09 | SPEC VIEW蟆主・ (霆ｽ驥秋TML繝薙Η繝ｼ繧｢) | 霆ｽ驥秋TML / Quartz4 / 荳崎ｦ・/ 蛻･縺ｮ譁ｹ豕・| 萓晏ｭ倥↑縺励・繝薙Ν繝我ｸ崎ｦ√Ｔpec-index.json+spec-viewer.html縺ｧ荳隕ｧ繝ｻ騾ｲ謐礼｢ｺ隱・|
| 2026-03-08 | main.js繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ螳御ｺ・| 邯咏ｶ壼・蜑ｲ / 迴ｾ迥ｶ邯ｭ謖・| Phase 1-4螳御ｺ・Ｎain.js 2365陦娯・69陦後Ｂpp-controller.js ~1630陦後∥pp-editor-events.js ~430陦後↓蛻・牡 |
| 2026-03-09 | Yarn Spinner 繧ｨ繧ｯ繧ｹ繝昴・繝亥ｮ溯｣・ｮ御ｺ・| 蜆ｪ蜈亥ｺｦ3繧ｿ繧ｹ繧ｯ | YarnFormatter.js霑ｽ蜉縲」erify-export-formatters.mjs縺ｧ繝・せ繝域ｸ医∩縲・蠖｢蠑冗岼縺ｮ繧ｨ繧ｯ繧ｹ繝昴・繧ｿ繝ｼ縺ｨ縺励※逋ｻ骭ｲ |
| 2026-03-09 | 螟画焚繧ｷ繧ｹ繝・Β莉墓ｧ倡ｭ門ｮ・| 莉墓ｧ伜・陦・/ 螳溯｣・・陦・| docs/specs/variable-system.md菴懈・縲よ焚蛟､蝙句､画焚繝ｻ貍皮ｮ励・繝・く繧ｹ繝亥・螻暮幕繧貞ｮ夂ｾｩ縲ょｮ溯｣・・谺｡繝輔ぉ繝ｼ繧ｺ |
| 2026-03-09 | spec-viewer.html蟆主・ | 繝峨く繝･繝｡繝ｳ繝亥ｽ｢蠑・| Markdown邂｡逅・+ Web繝薙Η繝ｼ繧｢縺ｧ莉墓ｧ倅ｸ隕ｧ繝ｻ騾ｲ謐礼｢ｺ隱阪Ｔpec-index.json縺郡ource of Truth |
| 2026-03-09 | 螟画焚繧ｷ繧ｹ繝・Β諡｡蠑ｵ螳溯｣・(Priority 1) | 謨ｰ蛟､蝙玖ｿｽ蜉 + 蝓ｺ譛ｬ蝗帛援貍皮ｮ・| VariableState蝙区僑蠑ｵ縲［odifyVariable蜉ｹ譫懊∵焚蛟､豈碑ｼ・擅莉ｶ(>=, <=, >, <)縲ゞI蟇ｾ蠢懷ｮ御ｺ・Ｄondition-effect-editor.js縺ｧ閾ｪ蜍募梛蛻､螳・|
| 2026-03-09 | evalCondition/applyEffect驥崎､・ｧ｣豸・| 蜈ｱ騾壹Δ繧ｸ繝･繝ｼ繝ｫ蛹・/ 迴ｾ迥ｶ邯ｭ謖・/ 驛ｨ蛻・ｵｱ蜷・| 3繝輔ぃ繧､繝ｫ(session-ops.ts/index.ts/browser.ts)縺ｧ90陦瑚ｶ・・驥崎､・ｒ`condition-effect-ops.ts`縺ｫ髮・ｴ・Ｔession-ops.ts縺ｮ繧ｭ繝｣繝・す繝･讖滓ｧ九・邯ｭ謖・|

| 2026-03-10 | 文字コード安全運用を導入 | アドホック運用 / 安全チェック導入 | `spec-index`破損と文字化け再発を受け、`check:safety` / `check:safety:changed`、運用手順、インシデント記録を追加 |
| 2026-03-10 | Mermaidチャンク分割を更新 | 現状維持 / 遅延読込のみ / 依存分離 | `vendor-mermaid` 1.79MB 警告を分離し、依存と共有レイアウト処理を別チャンク化して状況を可視化 |
## Project Context

プロジェクト名: NarrativeGen
環境: Node.js 20+ / TypeScript 5.x / Vite 5 / Vitest / Playwright
ブランチ戦略: main (デフォルトブランチ: open-ws/engine-skeleton-2025-09-02)
現フェーズ: β版相当（コア機能実装完了、Unity連携・最適化準備中）
直近の状態: ビルド復旧、`spec-index.json`復旧、文字コード安全チェック導入、Mermaid依存のチャンク分割を実施。`npm run check:safety` と `npm run build` は成功。Mermaidは遅延読込化済みだが `vendor-mermaid-core` は約1.27MBで継続課題。
記録先: 文字コード運用は `docs/plans/DEVELOPMENT_PLAN.md`、インシデント記録は `docs/governance/encoding-safety-incident-2026-03-10.md`、残課題は `docs/TECHNICAL_DEBT.md` で管理。