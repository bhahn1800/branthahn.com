import { retrieve, architecturePrompt } from './core.js';
import { documents, samples, evaluationCases } from './data.js';
import { $, node, renderSource, renderEvaluation, modelUI } from './ui.js';
const ai=modelUI('question');
function findEvidence() {
  ai.clear();
  const question=$('question').value.trim();
  if (!question) throw new Error('Enter an architecture question or choose a sample.');
  const sources=retrieve(question,documents);
  $('source-count').textContent=`${sources.length} source${sources.length===1?'':'s'}`;
  $('sources').replaceChildren(...sources.map(source=>renderSource(source,true)));
  if (!sources.length) {
    $('sources').append(node('div','No matching evidence in this library. Try a question about the sample order platform.','empty'));
    $('retrieval-note').textContent='Insufficient evidence. Generation is skipped instead of inventing a design decision.';
    $('status').textContent='No source match. The local LLM was not called.';
  } else {
    $('retrieval-note').textContent='Ranked by BM25 lexical score, not a probability or confidence estimate. Read the original notes before generating a draft.';
    $('status').textContent='Evidence ready. You can now generate a draft with the local LLM.';
  }
  return {question,sources};
}
for (const sample of samples) {
  const button=node('button',sample.label);
  button.addEventListener('click',()=> { $('question').value=sample.question; try {findEvidence();} catch(error){ai.error(error);} });
  $('samples').append(button);
}
$('question').value=samples[0].question;
$('retrieve').addEventListener('click',()=>{try{findEvidence();}catch(error){ai.error(error);}});
$('generate').addEventListener('click',()=> {
  try {
    const {question,sources}=findEvidence();
    if (sources.length) ai.start(architecturePrompt(question,sources),sources.slice(0,1));
  } catch(error) {ai.error(error);}
});
$('question').addEventListener('input',()=> {
  ai.clear(); $('source-count').textContent='Question changed';
  $('sources').replaceChildren(node('div','Run Find evidence for the updated question.','empty'));
  $('retrieval-note').textContent='The previous sources were cleared so the evidence stays tied to your current question.';
});
$('library').replaceChildren(...documents.map(source=>renderSource(source)));
$('evaluate').addEventListener('click',()=>renderEvaluation(evaluationCases.map(test=> {
  const sources=retrieve(test.question,documents);
  return {label:test.question,expected:test.expected || 'No sources',observed:sources.map(source=>source.id).join(', ') || 'No sources',pass:test.expected ? sources.some(source=>source.id===test.expected) : sources.length===0};
})));
findEvidence();
