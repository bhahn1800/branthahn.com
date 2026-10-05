import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEvents, analyzeEvents } from './core.js';
import { runbooks, scenarios } from './data.js';
const expected=[{errors:2,p95:2900,book:'RUN-001'},{errors:3,p95:2400,book:'RUN-002'},{errors:2,p95:50,book:'RUN-003'},{errors:1,p95:120,book:null}];
scenarios.forEach((scenario,index)=>test(scenario.label,()=> {
  const report=analyzeEvents(parseEvents(JSON.stringify(scenario.events)),runbooks);
  assert.equal(report.errorCount,expected[index].errors);assert.equal(report.p95,expected[index].p95);
  assert.deepEqual(report.runbooks.map(book=>book.id),expected[index].book?[expected[index].book]:[]);
}));
test('invalid input is rejected',()=> {
  for (const raw of ['not-json','[]','[{}]',JSON.stringify(Array(201).fill(scenarios[0].events[0]))]) assert.throws(()=>parseEvents(raw));
});
test('latency cannot be negative or a string',()=> {
  for (const latency_ms of [-1,'100']) assert.throws(()=>parseEvents(JSON.stringify([{...scenarios[0].events[0],latency_ms}])));
});
test('no provided latency yields no p95',()=> {
  const event={...scenarios[0].events[0]};delete event.latency_ms;assert.equal(analyzeEvents([event],runbooks).p95,null);
});
