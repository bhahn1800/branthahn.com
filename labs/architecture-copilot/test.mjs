import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, citationAudit } from './core.js';
import { documents, evaluationCases } from './data.js';
for (const fixture of evaluationCases) test(fixture.question,()=> {
  const sources=retrieve(fixture.question,documents);
  if (fixture.expected) assert.ok(sources.some(source=>source.id===fixture.expected));
  else assert.equal(sources.length,0);
});
test('citation audit reports unsupported IDs',()=>assert.deepEqual(citationAudit('Claim [ADR-099]',documents).unknown,['ADR-099']));
test('input size is bounded',()=>assert.throws(()=>retrieve('x'.repeat(1601),documents)));
