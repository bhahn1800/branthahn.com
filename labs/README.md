# Brant Hahn's LLM engineering labs

Two original applications using a pretrained compact instruction model:

- **Architecture Evidence Copilot:** inspectable lexical retrieval over synthetic architecture notes, missing-evidence behavior, local LLM review questions, and source lineage.
- **Event Incident Triage Lab:** validated telemetry, deterministic metrics, runbook matching, and local LLM investigation questions.

The applications are standalone static sites suitable for Hugging Face Static Spaces and GitHub Pages. No inference API key, paid compute, or employer information is needed. Each app carries its own README, source code, and unit tests. Existing model weights are downloaded by visitors, never committed to this repository. Model details, input limits, and known limitations are in each app's documentation.

## Development

```sh
cd labs
npm run build
npm test
npm run evaluate
cd ..
python3 -m http.server 8000
```

Open `/labs/architecture-copilot/` or `/labs/incident-triage/`. `build.mjs` copies the shared UI, inference worker, and core into both app directories, so each Space can run independently. After editing a shared file, rebuild before publishing. The public UIs fetch a pinned Transformers.js browser bundle from jsDelivr and pinned ONNX model files from Hugging Face.

`evaluation-results.json` contains results from authored synthetic retrieval and telemetry fixtures. It is a component evaluation, not an independent benchmark or model accuracy score. Unit tests cover missing evidence, unsupported citation IDs, invalid logs, input limits, chronology, and latency calculations. Local LLM smoke checks are documented separately; they cannot establish general answer quality.

## Publish to Hugging Face

Create a public **Static / Blank** Space in `bhahn1800`, then upload every file in the chosen application directory to the Space root in one commit. Its README metadata sets `sdk: static` and `app_file: index.html`; no server, secret, or build command is needed. Publish the generated app directory, not `shared/` or the parent folder. Browser prompts remain on the visitor's device; runtime and weight downloads still contact their respective hosts.
