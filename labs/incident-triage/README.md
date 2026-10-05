---
title: Event Incident Triage Lab
emoji: 🔎
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
  - observability
  - event-driven
  - browser-llm
short_description: Telemetry evidence and runbook-grounded local LLM drafts
---

# Event Incident Triage Lab

An original portfolio application by [Brant Hahn](https://branthahn.com/technical.html). Analyze synthetic events from an order platform, inspect computed signals and matching runbooks, and ask a browser-local LLM to draft a follow-up investigation question.

## What to try

1. Choose **Retry storm**, **Slow database**, or **Contract break**.
2. Inspect the error fraction, nearest-rank p95, chronological trace, and runbook matches.
3. Click **Draft with local LLM** to generate a read-only investigation question. The first run downloads approximately 290 MB of model and runtime. A desktop browser with enough available memory works best.
4. Choose **Unknown signature** to see how the app avoids a generated diagnosis when no runbook matches.
5. Open **Run telemetry evaluations** for scenario and validation checks.

## Architecture

```text
Event JSON -> size + schema validation -> sorted events
           -> deterministic metrics + repeated event IDs
           -> exact event-code runbook matching
           -> computed evidence + primary matching runbook
           -> Web Worker / local ONNX LLM -> investigation question
```

Metrics are calculated in JavaScript, not by the LLM. Error fraction counts `ERROR` events divided by all supplied events. p95 uses the nearest-rank method on available `latency_ms` values. Repeated event IDs are reported as repeated log entries, not proven duplicate business effects. Demo urgency is a simple illustrative rule: error fraction at least 0.5 is **Elevated**; otherwise any error or p95 at least 1,000 ms is **Review**; otherwise **Low**. It is not a production severity classification.

Runbooks match exact codes, and generation is skipped if there is no match. Inputs allow 1–200 events and 64 KB of JSON. Required fields are `timestamp` (UTC ISO timestamp), `service`, `level` (`INFO`, `WARN`, or `ERROR`), `code`, and `message`; `event_id` and finite nonnegative `latency_ms` are optional. The LLM sees computed metrics, the first matching runbook (without raw log messages).

**Model:** `Xenova/LaMini-Flan-T5-248M`, revision `091769c59d551fed68a9b8baf4f70f7effa69a56`, ONNX q8. **Runtime:** Transformers.js 3.8.1 in a Web Worker with WebAssembly. Generation is greedy and capped at 80 new tokens with repeated 4-grams blocked. Runtime and weights download from jsDelivr and Hugging Face. Logs and prompts are processed on the visitor's device, not sent to a hosted inference service. No API key is required. This is an application using a pretrained model, not a model I trained.

## Evaluation and limitations

The UI evaluation suite checks four synthetic scenarios and three invalid-input cases. Unit tests additionally cover metric calculations, input bounds, missing latency, and unknown signatures. These tests evaluate deterministic components, not LLM diagnosis quality or production performance. A sample of a few log entries cannot establish a root cause. The model can hallucinate or misinterpret evidence. Context-source labels are supplied by the application and do not establish factual accuracy. Unknown model-generated citation IDs are flagged. Hypotheses require human investigation.

The scenarios and runbooks are authored fictional data, with no employer logs or incident history. The app never executes commands, replays messages, or changes infrastructure. Generated text is rendered as plain text. Prompt instructions are an application convention, not a complete defense against hostile log content.

## Run and test

```sh
python3 -m http.server 8000
# Open http://localhost:8000
node --test test.mjs
```

Use an HTTP localhost or HTTPS origin for module workers. No build step or inference API token is required. Loading failures leave the deterministic report available; the **Stop AI** button terminates the worker.

Source is also maintained in [branthahn.com/labs](https://github.com/bhahn1800/branthahn.com/tree/main/labs). Code and synthetic data are MIT licensed; the pretrained model has its own license; see its model card.
