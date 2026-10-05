import { writeFile } from 'node:fs/promises';
import { retrieve, parseEvents, analyzeEvents } from './shared/core.js';
import { documents, evaluationCases } from './architecture-copilot/data.js';
import { runbooks, scenarios } from './incident-triage/data.js';
const retrieval=evaluationCases.map(fixture=> {
  const ranked=retrieve(fixture.question,documents);
  return {question:fixture.question,expected:fixture.expected,retrieved:ranked.map(source=>source.id),pass:fixture.expected?ranked.some(source=>source.id===fixture.expected):ranked.length===0};
});
const telemetry=scenarios.map(scenario=> {
  const r=analyzeEvents(parseEvents(JSON.stringify(scenario.events)),runbooks);
  return {scenario:scenario.label,eventCount:r.eventCount,errorCount:r.errorCount,p95_ms:r.p95,runbooks:r.runbooks.map(book=>book.id)};
});
const report={evaluatedAt:new Date().toISOString(),scope:'Authored synthetic component fixtures; not an LLM quality benchmark.',retrieval,telemetry};
await writeFile(new URL('./evaluation-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`Retrieval source coverage: ${retrieval.filter(row=>row.pass).length}/${retrieval.length} fixtures.`);
console.log('Telemetry fixture metrics saved to evaluation-results.json.');
if(retrieval.some(row=>!row.pass))process.exitCode=1;
