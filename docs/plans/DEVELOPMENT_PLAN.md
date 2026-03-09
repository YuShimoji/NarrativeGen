# 髢狗匱繝励Λ繝ｳ

**菴懈・譌･**: 2026-03-07
**菴懈・譁ｹ豕・*: 螳溘さ繝ｼ繝画爾邏｢ + 蟇ｾ隧ｱ逧・｣壼査縺・

---

## 迴ｾ蝨ｨ縺ｮ螳溯｣・ｸ医∩讖溯・ (繧ｳ繝ｼ繝峨・繝ｼ繧ｹ縺九ｉ遒ｺ隱・

### 繧ｨ繝ｳ繧ｸ繝ｳ螻､ (packages/engine-ts)

| 讖溯・ | 隱ｬ譏・| 繝輔ぃ繧､繝ｫ |
|------|------|---------|
| 繝｢繝・Ν隱ｭ霎ｼ繝ｻAJV讀懆ｨｼ | JSON Schema縺ｫ繧医ｋ讒矩讀懆ｨｼ + 謨ｴ蜷域ｧ繝√ぉ繝・け | index.ts |
| 繧ｻ繝・す繝ｧ繝ｳ邂｡逅・| start/applyChoice/serialize/deserialize | session-ops.ts |
| 譚｡莉ｶ繧ｷ繧ｹ繝・Β | flag/resource/variable/timeWindow + AND/OR/NOT隍・粋譚｡莉ｶ | session-ops.ts, types.ts |
| 蜉ｹ譫懊す繧ｹ繝・Β | setFlag/addResource/setVariable/goto | session-ops.ts, types.ts |
| GameSession | 鬮倥Ξ繝吶ΝAPI (outcome/inventory邨ｱ蜷・ | game-session.ts |
| 繧､繝ｳ繝吶Φ繝医Μ | add/remove/has/list | inventory.ts |
| 繧ｨ繝ｳ繝・ぅ繝・ぅ | CSV隱ｭ霎ｼ繝ｻ繝代・繧ｹ | entities.ts |
| 險縺・鋤縺・(髱暸I) | 蜷檎ｾｩ隱樒ｽｮ謠帙・譁・ｽ灘､画鋤繝ｻ豎ｺ螳夂噪繝舌Μ繧｢繝ｳ繝育函謌・| paraphrase.ts |
| AI繝励Ο繝舌う繝繝ｼ | Mock + OpenAI (generateNextNode/paraphrase) | ai-provider.ts |

### Web Tester (apps/web-tester)

| 讖溯・ | 隱ｬ譏・| 繝輔ぃ繧､繝ｫ |
|------|------|---------|
| GUI繧ｨ繝・ぅ繧ｿ | 繝弱・繝臥ｷｨ髮・霑ｽ蜉/蜑企勁/繧ｳ繝斐・/繧ｹ繝九・繝・ヨ/繝・Φ繝励Ξ繝ｼ繝・DnD | gui-editor.js |
| 繧ｰ繝ｩ繝輔お繝・ぅ繧ｿ | SVG繝薙ず繝･繧｢繝ｫ/繝峨Λ繝・げ/繧ｺ繝ｼ繝/繝溘ル繝槭ャ繝・繧ｰ繝ｪ繝・ラ/繧､繝ｳ繝ｩ繧､繝ｳ邱ｨ髮・Undo-Redo/繧ｳ繝ｳ繝・く繧ｹ繝医Γ繝九Η繝ｼ/隍・焚驕ｸ謚・繧ｨ繝・ず謫堺ｽ・繝弱・繝芽､・｣ｽ | graph-editor/GraphEditorManager.js |
| 繝舌ャ繝√お繝・ぅ繧ｿ | 讀懃ｴ｢鄂ｮ謠・豁｣隕剰｡ｨ迴ｾ/繝輔ぅ繝ｫ繧ｿ/diff陦ｨ遉ｺ/螻･豁ｴ/Undo-Redo | batch-editor.js |
| Mermaid繝励Ξ繝薙Η繝ｼ | 繝輔Ο繝ｼ繝√Ε繝ｼ繝郁｡ｨ遉ｺ/繝ｪ繧｢繝ｫ繧ｿ繧､繝譖ｴ譁ｰ/迚ｹ谿頑枚蟄励お繧ｹ繧ｱ繝ｼ繝・| mermaid-preview.js |
| 繧ｨ繝ｳ繝・ぅ繝ｳ繧ｰ隗｣譫・| 蜈ｨ繝代せ謚ｽ蜃ｺ/隍・尅蠎ｦ/譚｡莉ｶ繧ｫ繝舌Ξ繝・ず/蛻ｰ驕泌庄閭ｽ諤ｧ | ending-analyzer.js |
| 邨ｱ險医ヱ繝阪Ν | 蛻・ｲ千ｵｱ險・繝弱・繝峨ち繧､繝怜・蟶・蛻ｰ驕皮紫 | stats-panel.js |
| 讀懆ｨｼ繝代ロ繝ｫ | 蛻ｰ驕比ｸ崎・/閾ｪ蟾ｱ蜿ら・/繝・ャ繝峨お繝ｳ繝・譛ｪ螳夂ｾｩ繝輔Λ繧ｰ讀懷・ | validation-panel.js |
| 繝代せ繝医Λ繝・き繝ｼ | 邨瑚ｷｯ繝上う繝ｩ繧､繝・繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ | path-tracker.js |
| 讀懃ｴ｢ | 繝弱・繝迂D/繝・く繧ｹ繝域､懃ｴ｢ | SearchManager.js |
| 繝・・繝・| 6繝代Ξ繝・ヨ蛻・崛 | theme.js |
| 繧ｭ繝ｼ繝舌う繝ｳ繝・| 邂｡逅・+ 繧ｫ繧ｹ繧ｿ繝槭う繧ｺUI | keybinding-manager.js, key-binding-ui-manager.js |
| 繝ｬ繧ｭ繧ｷ繧ｳ繝ｳUI | 邱ｨ髮・陦ｨ遉ｺ/繝｢繝・Ν蝓九ａ霎ｼ縺ｿ蟇ｾ蠢・| lexicon-ui-manager.js, lexicon.js |
| AI邂｡逅・| Mock/OpenAI蛻・崛/逕滓・/險縺・鋤縺・| ai.js |
| 譚｡莉ｶ/蜉ｹ譫懊お繝・ぅ繧ｿ | 讒矩蛹悶＆繧後◆譚｡莉ｶ繝ｻ蜉ｹ譫懆ｨｭ螳啅I | condition-effect-editor.js |
| 繧ｨ繧ｯ繧ｹ繝昴・繝・| CSV + Ink + Twine + JSON + Yarn Spinner (5蠖｢蠑・ | ExportManager.js, formatters/ |
| 繝｢繝・Ν讀懆ｨｼ | CLI + UI蜿梧婿 | model-validator.js |
| 菫晏ｭ・隱ｭ霎ｼ | SaveManager/閾ｪ蜍穂ｿ晏ｭ・| save-manager.js |
| 繝・ヰ繝・げ繝代ロ繝ｫ | 髢狗匱譎よュ蝣ｱ陦ｨ遉ｺ | debug.js |
| Toast騾夂衍 | 繝輔ぅ繝ｼ繝峨ヰ繝・け陦ｨ遉ｺ | toast.js |

### 繝舌ャ繧ｯ繧ｨ繝ｳ繝・(packages/backend)

| 讖溯・ | 隱ｬ譏・| 繝輔ぃ繧､繝ｫ |
|------|------|---------|
| Express API | providers/generate/paraphrase 繧ｨ繝ｳ繝峨・繧､繝ｳ繝・| index.ts |

### Unity SDK (packages/sdk-unity)

| 讖溯・ | 隱ｬ譏・|
|------|------|
| MinimalNarrativeController | JSON TextAsset隱ｭ霎ｼ縺ｫ繧医ｋ繝ｩ繝ｳ繧ｿ繧､繝 |

### 繝・せ繝・

| 遞ｮ鬘・| 莉ｶ謨ｰ |
|------|------|
| 繝ｦ繝九ャ繝医ユ繧ｹ繝・(Vitest) | 15繝・せ繝・|
| E2E繝・せ繝・(Playwright) | 2繝輔ぃ繧､繝ｫ (theme-toggle, undo-redo) |
| 繝｢繝・Ν讀懆ｨｼ (CLI) | 6繝｢繝・Ν |

---

## 髢狗匱繧ｿ繧ｹ繧ｯ

### 蜆ｪ蜈亥ｺｦ1: 螟画焚/譚｡莉ｶ繧ｷ繧ｹ繝・Β諡｡蠑ｵ [螳御ｺ・

**螳御ｺ・律**: 2026-03-09

**螳溯｣・・螳ｹ**:
- 謨ｰ蛟､蝙句､画焚繧ｵ繝昴・繝・(`VariableState = Record<string, string | number>`)
- 謨ｰ蛟､豈碑ｼ・擅莉ｶ貍皮ｮ怜ｭ占ｿｽ蜉 (`>=`, `<=`, `>`, `<`)
- 蝗帛援貍皮ｮ怜柑譫・(`modifyVariable: { op: '+' | '-' | '*' | '/', value: number }`)
- UI蟇ｾ蠢・(condition-effect-editor.js: 謨ｰ蛟､閾ｪ蜍募愛螳壹∵ｼ皮ｮ怜ｭ舌ラ繝ｭ繝・・繝繧ｦ繝ｳ)
- 繧ｨ繧ｯ繧ｹ繝昴・繝亥ｯｾ蠢・(YarnFormatter.js: modifyVariable 竊・`<<set>>`)
- 莉墓ｧ倥ラ繧ｭ繝･繝｡繝ｳ繝井ｽ懈・ (docs/specs/variable-system.md, SP-VAR-001)

**繝・く繧ｹ繝亥・螟画焚螻暮幕**: 譌｢蟄伜ｮ溯｣・ｸ医∩ (story.js: `{variable_name}` 竊・蛟､鄂ｮ謠・

**繝・せ繝・*: tsc + vitest 15莉ｶ + verify-export-formatters + vite build蜈ｨ騾夐℃

---

### 蜆ｪ蜈亥ｺｦ2: main.js 繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ [螳御ｺ・

**螳御ｺ・律**: 2026-03-08

**邨先棡**:
- main.js: 2365陦・竊・69陦・(阮・＞繧ｨ繝ｳ繝医Μ繝昴う繝ｳ繝・ 繝槭ロ繝ｼ繧ｸ繝｣繝ｼ逕滓・ + initializeApp()蜻ｼ縺ｳ蜃ｺ縺・
- app-controller.js: ~1630陦・(繧､繝吶Φ繝磯・邱壹√・繝ｫ繝代・髢｢謨ｰ縲√・繝阪・繧ｸ繝｣繝ｼ蛻晄悄蛹・
- app-editor-events.js: ~430陦・(繧ｹ繝九・繝・ヨ/繝・Φ繝励Ξ繝ｼ繝・繝舌ャ繝・讀懃ｴ｢/繝峨Λ繝輔ヨ邂｡逅・
- ui-bindings.js: ~100 DOM隕∫ｴ縺ｮ荳蜈・ｮ｡逅・
- 繝・ャ繝峨さ繝ｼ繝蛾勁蜴ｻ: batchEditManager(譛ｪ螳夂ｾｩ_model)縲｛penBatchChoiceModal(蜷・縲∵悴菴ｿ逕ｨ螟画焚/import
- 譌ｧ繝悶Λ繝ｳ繝・feature/main-js-split-phase2)縺ｯ菴ｿ逕ｨ縺帙★縲［ain縺九ｉ谿ｵ髫守噪縺ｫ蜀榊・蜑ｲ

---

### 蜆ｪ蜈亥ｺｦ3: Yarn Spinner 繧ｨ繧ｯ繧ｹ繝昴・繝・[螳御ｺ・

**螳御ｺ・律**: 2026-03-09

**螳溯｣・・螳ｹ**:
- YarnFormatter.js菴懈・ (Yarn Spinner 2.x蠖｢蠑・ title/tags/---/===讒矩)
- 譚｡莉ｶ/蜉ｹ譫懊・繝・ヴ繝ｳ繧ｰ (flag/resource/variable竊炭arn蠑上《etFlag/addResource/setVariable/modifyVariable/goto竊・<set>>/<<jump>>)
- Start node迚ｹ谿雁・逅・(model.startNode縺ｸ縺ｮ閾ｪ蜍輔ず繝｣繝ｳ繝・
- ID sanitization (繝斐Μ繧ｪ繝俄・繧｢繝ｳ繝繝ｼ繧ｹ繧ｳ繧｢)
- 螟画焚螳｣險逕滓・ (<<declare>>)
- main.js縺ｸ縺ｮ逋ｻ骭ｲ (5蠖｢蠑冗岼縺ｮ繧ｨ繧ｯ繧ｹ繝昴・繧ｿ繝ｼ)
- verify-export-formatters.mjs縺ｧ縺ｮ繝・せ繝郁ｿｽ蜉
- 莉墓ｧ倥ラ繧ｭ繝･繝｡繝ｳ繝井ｽ懈・ (docs/specs/yarn-spinner-export.md, SP-EXP-YARN-001)

**髱槫ｯｾ蠢懈ｩ溯・**: ParaphraseLexicon/ParaphraseStyle/ChoiceOutcome/timeWindow/contains貍皮ｮ怜ｭ・(Yarn Spinner縺ｫ隧ｲ蠖捺ｦょｿｵ縺ｪ縺・

---

### 蜆ｪ蜈亥ｺｦ3.5: 繧ｳ繝ｼ繝牙刀雉ｪ謾ｹ蝟・(繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ) [螳御ｺ・

**螳御ｺ・律**: 2026-03-09

**繧ｿ繧ｹ繧ｯ**: evalCondition/applyEffect驥崎､・ｧ｣豸・

**螳溯｣・・螳ｹ**:
- `condition-effect-ops.ts` 蜈ｱ騾壹Δ繧ｸ繝･繝ｼ繝ｫ菴懈・ (cmp/evalCondition/applyEffect)
- session-ops.ts: 蜈ｱ騾壹Δ繧ｸ繝･繝ｼ繝ｫ縺九ｉ繧､繝ｳ繝昴・繝医√く繝｣繝・す繝･繝ｩ繝・ヱ繝ｼ邯ｭ謖・
- index.ts: 繝ｭ繝ｼ繧ｫ繝ｫ驥崎､・ｮ夂ｾｩ蜑企勁 (~90陦悟炎貂・
- browser.ts: 繝ｭ繝ｼ繧ｫ繝ｫ驥崎､・ｮ夂ｾｩ蜑企勁 (~100陦悟炎貂・
- 莉墓ｧ倥ラ繧ｭ繝･繝｡繝ｳ繝井ｽ懈・ (docs/specs/code-refactoring-condition-effect.md, SP-REFACTOR-001)

**蜉ｹ譫・*: 菫晏ｮ域ｧ蜷台ｸ翫√さ繝ｼ繝牙炎貂帷ｴ・90陦後∝梛螳牙・諤ｧ蜷台ｸ・

---

### 蜆ｪ蜈亥ｺｦ4: 繝ｬ繧ｹ繝昴Φ繧ｷ繝悶ョ繧ｶ繧､繝ｳ + 繧｢繧ｯ繧ｻ繧ｷ繝薙Μ繝・ぅ

**迴ｾ迥ｶ**: 繝・せ繧ｯ繝医ャ繝怜髄縺代・縺ｿ縲ゅΔ繝舌う繝ｫ髱槫ｯｾ蠢懊ゅい繧ｯ繧ｻ繧ｷ繝薙Μ繝・ぅ譛ｪ蟇ｾ蠢懊・

**繧ｿ繧ｹ繧ｯ蜀・ｮｹ**:
- 繝ｬ繧ｹ繝昴Φ繧ｷ繝・ 繝｡繝・ぅ繧｢繧ｯ繧ｨ繝ｪ/繝ｬ繧､繧｢繧ｦ繝郁ｪｿ謨ｴ
- 繧｢繧ｯ繧ｻ繧ｷ繝薙Μ繝・ぅ: ARIA螻樊ｧ/繧ｭ繝ｼ繝懊・繝峨リ繝薙ご繝ｼ繧ｷ繝ｧ繝ｳ/繧ｳ繝ｳ繝医Λ繧ｹ繝育｢ｺ菫・

---

### 蜆ｪ蜈亥ｺｦ5: 繝√Ε繝ｳ繧ｯ繧ｵ繧､繧ｺ譛驕ｩ蛹・

**迴ｾ迥ｶ**: Vite繝薙Ν繝峨〒縲郡ome chunks are larger than 500 kB縲崎ｭｦ蜻翫ゆｸｻ縺ｫMermaid髢｢騾｣縲・

**繧ｿ繧ｹ繧ｯ蜀・ｮｹ**:
- manualChunks險ｭ螳壹・譛驕ｩ蛹・
- 蜍慕噪import縺ｮ豢ｻ逕ｨ
- main.js繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ螳御ｺ・ｾ後↓螳滓命縺悟柑譫懃噪

---

## 菫晉蕗鬆・岼

莉･荳九・蟆・擂逧・↓讀懆ｨ弱☆繧九′縲∫樟繝励Λ繝ｳ縺ｮ繧ｹ繧ｳ繝ｼ繝怜､・

| 鬆・岼 | 逅・罰 |
|------|------|
| AI逕滓・螻･豁ｴ | 迴ｾ迥ｶ縺ｮAI讖溯・縺ｧ蜊∝・ |
| 繝励Ο繝ｳ繝励ヨ繝・Φ繝励Ξ繝ｼ繝・| 蜷御ｸ・|
| 逕滓・蜩∬ｳｪ隧穂ｾ｡/豈碑ｼ・| 蜷御ｸ・|
| Unity NUnit 繝・せ繝・| Web Tester蜆ｪ蜈・|
| Unity Editor諡｡蠑ｵ | 蜷御ｸ・|

## 蜑企勁鬆・岼

莉･荳九・荳崎ｦ√→蛻､螳壹＠縲√・繝ｩ繝ｳ縺九ｉ髯､螟・

| 鬆・岼 | 逅・罰 |
|------|------|
| AI繝舌ャ繝∝・逅・(蜈ｨ繝弱・繝我ｸ諡ｬAI險縺・鋤縺・ | 繧ｳ繧ｹ繝亥ｯｾ蜉ｹ譫應ｸ肴・ |
| 繝舌・繧ｸ繝ｧ繝ｳ邂｡逅・ｵｱ蜷・| 繧ｹ繧ｳ繝ｼ繝鈴℃螟ｧ |
| 繝槭Ν繝√Θ繝ｼ繧ｶ繝ｼ邱ｨ髮・| 繧ｹ繧ｳ繝ｼ繝鈴℃螟ｧ |
| 蜈ｱ譛峨Μ繝ｳ繧ｯ | 繧ｹ繧ｳ繝ｼ繝鈴℃螟ｧ |
| 螟ｧ隕乗ｨ｡繝｢繝・Ν蟇ｾ蠢・| 迴ｾ譎らせ縺ｧ荳崎ｦ・|
| 繝・・繝ｫ繝√ャ繝・繝倥Ν繝・| 荳崎ｦ・|
| 險ｺ譁ｭ繝ｭ繧ｰ諡｡蠑ｵ | core/logger.js縺ｧ蜊∝・ |
| XLSX/PDF繧ｨ繧ｯ繧ｹ繝昴・繝・| 5蠖｢蠑上〒蜊∝・ |

---

*縺薙・繝励Λ繝ｳ縺ｯ螳溘さ繝ｼ繝峨・繧ｷ繝ｳ繝懊Ν謗｢邏｢邨先棡縺ｫ蝓ｺ縺･縺堺ｽ懈・縲ゅラ繧ｭ繝･繝｡繝ｳ繝磯俣縺ｮ蜿ら・縺ｧ縺ｯ縺ｪ縺上√さ繝ｼ繝峨ｒSource of Truth縺ｨ縺励※縺・ｋ縲・

---

## Encoding Safety Workflow (2026-03-10)

- Run `npm run check:safety:changed` during iteration when touching docs, config, or build scripts.
- Run `npm run check:safety` before merge when `docs/`, `scripts/`, `package.json`, `.gitattributes`, or Vite config changed.
- Keep text files in UTF-8 and avoid ad-hoc PowerShell replacement that can leave literal backtick escapes in JSON or YAML.
- Treat `docs/spec-index.json` as a paired update with spec docs. Validate it in the same change when spec files move or status changes.
- If `encoding-safety` reports warnings, clear them before commit instead of carrying them forward as known noise.
- See `docs/governance/encoding-safety-incident-2026-03-10.md` for the incident record and recovery rules.