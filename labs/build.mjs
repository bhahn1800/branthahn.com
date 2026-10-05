import { copyFile } from 'node:fs/promises';
for (const app of ['architecture-copilot', 'incident-triage']) {
  for (const file of ['core.js', 'style.css', 'llm-worker.js', 'model-client.js', 'ui.js']) {
    await copyFile(new URL(`shared/${file}`, import.meta.url), new URL(`${app}/${file}`, import.meta.url));
  }
}
console.log('Built two standalone static Spaces.');
