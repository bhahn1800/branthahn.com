---
title: Architecture Evidence Copilot
emoji: 🧭
colorFrom: green
colorTo: yellow
sdk: static
app_file: index.html
pinned: false
license: mit
models:
  - Xenova/LaMini-Flan-T5-248M
tags:
  - transformers.js
  - rag
  - architecture
  - browser-llm
short_description: Evidence-first architecture Q&A with a browser-local LLM
---

# Architecture Evidence Copilot

An original portfolio application by [Brant Hahn](https://branthahn.com/technical.html). Ask about a fictional order-processing platform, inspect retrieved architecture decision records, and generate a design-review question using a pretrained LLM on your own device.

## What to try

1. Choose **Duplicate delivery**, **Inventory tradeoff**, or **Outbox design**.
2. Inspect the original source text, matched terms, and BM25 scores.
3. Click **Generate with local LLM** to download and run the model. The first run downloads approximately 290 MB including model and runtime. Browser caching may reuse those files later. A desktop browser with enough available memory works best.
4. Compare the generated question with the source notes. **Missing evidence** demonstrates refusal before generation.
5. Open **Run retrieval evaluations** and run the authored fixture suite.

## Architecture

```text
Question -> tokenization + small synonym map -> BM25 lexical ranking
         -> top 3 matching ADRs displayed -> primary ADR in source prompt
         -> Web Worker -> ONNX Runtime WASM -> streamed review question
         -> citation-ID audit -> human review
```

The retrieval index contains eight original synthetic decision notes. There are no employer documents or proprietary systems in the data. BM25 scores express lexical relevance, not confidence or a probability. Retrieval is intentionally inspectable and does not require an embedding model.

**Model:** `Xenova/LaMini-Flan-T5-248M`, revision `091769c59d551fed68a9b8baf4f70f7effa69a56`, ONNX q8. **Runtime:** Transformers.js 3.8.1, WebAssembly, one worker thread. Generation is greedy, capped at 80 new tokens with repeated 4-grams blocked. Prompts and source text remain in the browser. The runtime is downloaded from jsDelivr and model files from Hugging Face; no hosted inference service or API token is used. This application does not train or fine-tune a model.

## Evaluation and limitations

The ten authored retrieval fixtures check expected-source coverage within the top three results and two missing-evidence cases. The suite is not an independent benchmark. Source labels identify the context supplied by the app; they are not generated citations or proof of grounding. Any model-generated citation IDs are checked for unsupported IDs. A 248M-parameter model can hallucinate, omit citations, or produce an irrelevant or mistaken question. Scores do not measure LLM quality. A small synonym map does not replace semantic retrieval. The context is synthetic and deliberately limited.

Questions are capped at 1,600 characters. Source text is treated as data in the prompt, and output is rendered as text, never HTML or executable code. Prompt boundaries reduce accidental instruction following but are not a proof of resistance to adversarial prompts.

## Run and test

No build step or API key is required:

```sh
python3 -m http.server 8000
# Open http://localhost:8000
node --test test.mjs
```

Use HTTP localhost or HTTPS rather than opening the page as a file, because module workers require an origin. The app supports stopping generation by terminating the worker. Loading and inference errors keep the evidence workspace available.

Source is also maintained in [branthahn.com/labs](https://github.com/bhahn1800/branthahn.com/tree/main/labs). Shared assets are copied into this standalone Space with `npm run build` from that directory. Code and synthetic notes are MIT licensed; the pretrained model has its own license; see its model card.
