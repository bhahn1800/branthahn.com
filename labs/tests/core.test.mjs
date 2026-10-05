import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, parseEvents, analyzeEvents, citationAudit, architecturePrompt, incidentPrompt } from '../shared/core.js';
import { documents, evaluationCases } from '../architecture-copilot/data.js';
import { runbooks, scenarios } from '../incident-triage/data.js';
for (const fixture of evaluationCases) {
  test(`retrieval: ${fixture.question}`,()=> {
    const result=retrieve(fixture.question,documents);
    if (fixture.expected) assert.ok(result.some(source=>source.id===fixture.expected),JSON.stringify(result.map(source=>source.id)));
    else assert.equal(result.length,0);
  });
}
test('duplicate delivery does not retrieve only retry handling',()=>assert.equal(retrieve('How do we prevent duplicate side effects when Kafka delivers an event again?',documents)[0].id,'ADR-001'));
test('citations reject invented source IDs',()=> {
  assert.deepEqual(citationAudit('Use a ledger [ADR-001] and replication [ADR-099].',[documents[0]]),{cited:['ADR-001','ADR-099'],unknown:['ADR-099'],hasCitation:true});
  assert.equal(citationAudit('No source here',[documents[0]]).hasCitation,false);
});
test('logs reject invalid structures, field types and oversized inputs',()=> {
  for (const raw of ['not-json','[]','{}','[null]',JSON.stringify(Array(201).fill(scenarios[0].events[0])),' '.repeat(64001)]) assert.throws(()=>parseEvents(raw));
  for (const patch of [{level:'DEBUG'},{timestamp:'not-a-date'},{timestamp:'2026-01-01'},{timestamp:'2026-02-30T10:00:01Z'},{service:''},{latency_ms:-1},{latency_ms:'200'},{message:'x'.repeat(1001)}]) assert.throws(()=>parseEvents(JSON.stringify([{...scenarios[0].events[0],...patch}])));
});
test('metrics and chronology are computed from the input',()=> {
  const report=analyzeEvents(parseEvents(JSON.stringify([...scenarios[0].events].reverse())),runbooks);
  assert.equal(report.eventCount,5);assert.equal(report.errorCount,2);assert.equal(report.errorRate,.4);assert.equal(report.p95,2900);assert.equal(report.urgency,'Review');
  assert.deepEqual(report.repeatedEventIds,[{id:'evt-101',count:2}]);assert.equal(report.events[0].timestamp,'2026-01-15T10:00:01Z');assert.equal(report.runbooks[0].id,'RUN-001');
});
test('healthy and unknown events do not invent matching runbooks',()=> {
  const unknown=analyzeEvents(parseEvents(JSON.stringify(scenarios[3].events)),runbooks);assert.equal(unknown.runbooks.length,0);
  const healthy={...scenarios[0].events[0],latency_ms:80};const report=analyzeEvents([healthy],runbooks);assert.equal(report.urgency,'Low');
  delete healthy.latency_ms;assert.equal(analyzeEvents([healthy],runbooks).p95,null);
});
test('p95 follows nearest-rank and excludes missing latency',()=> {
  const base=scenarios[0].events[0];const events=Array.from({length:20},(_,i)=>({...base,latency_ms:i+1}));
  assert.equal(analyzeEvents(events,runbooks).p95,19);
});
test('both prompts preserve evidence and bounded log context',()=> {
  const question='Explain idempotency';assert.ok(architecturePrompt(question,[documents[0]])[1].content.includes('[ADR-001]'));
  const report=analyzeEvents(parseEvents(JSON.stringify(scenarios[1].events)),runbooks);const prompt=incidentPrompt(report);assert.ok(prompt[1].content.includes('"errors":3'));assert.ok(prompt[1].content.includes('[RUN-002]'));
});
