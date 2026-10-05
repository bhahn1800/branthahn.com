import { LocalModel } from './model-client.js';
import { citationAudit } from './core.js';
export const $ = id => document.getElementById(id);
export function node(tag, text, className) {
  const element=document.createElement(tag);
  if (text !== undefined) element.textContent=String(text);
  if (className) element.className=className;
  return element;
}
export function renderSource(source, scored=false) {
  const article=node('article',undefined,'source');
  const top=node('div',undefined,'source-top');
  top.append(node('span',source.id,'source-id'));
  if (scored) top.append(node('span',`BM25 ${source.score.toFixed(2)}`,'score'));
  article.append(top,node('h3',source.title),node('p',source.body));
  if (scored) article.append(node('div',`Matched terms: ${source.matches.join(', ')}`,'matches'));
  return article;
}
export function renderEvaluation(rows) {
  const table=node('table');
  const head=node('tr');
  for (const label of ['Fixture','Expected','Observed','Result']) head.append(node('th',label));
  const thead=node('thead'); thead.append(head); table.append(thead);
  const body=node('tbody');
  for (const result of rows) {
    const row=node('tr');
    row.append(node('td',result.label),node('td',result.expected),node('td',result.observed),node('td',result.pass?'PASS':'FAIL',result.pass?'pass':'fail'));
    body.append(row);
  }
  table.append(body);
  $('eval-results').replaceChildren(table);
  $('eval-summary').textContent=`${rows.filter(row=>row.pass).length}/${rows.length} fixtures passed in this browser session. These are deterministic component checks, not LLM quality scores.`;
}
export function modelUI(inputId) {
  let currentSources=[];
  const controls=()=> [$('generate'), ...document.querySelectorAll('.samples button'), ...[$('retrieve'),$('analyze')].filter(Boolean)];
  const setBusy=busy=> {
    for (const control of controls()) control.disabled=busy;
    $(inputId).readOnly=busy;
    $('stop').hidden=!busy;
    $('status').dataset.busy=String(busy);
  };
  const model=new LocalModel(data=> {
    if (data.type==='status') $('status').textContent=data.text;
    if (data.type==='progress') $('status').textContent=`Downloading ${data.file}: ${Math.min(100,Math.round(data.progress || 0))}%`;
    if (data.type==='ready') $('status').textContent='Model ready · WebAssembly on this device.';
    if (data.type==='token') $('generated').textContent=data.text;
    if (data.type==='complete') {
      setBusy(false);
      $('generated').textContent=data.text;
      const audit=citationAudit(data.text,currentSources);
      const citationText=audit.unknown.length ? `Unknown citation IDs: ${audit.unknown.join(', ')}. Review required.` : `Context supplied to the model: ${currentSources.map(source=>source.id).join(', ')}. These are application-provided context labels, not proof that the generated question is correct.`;
      $('audit').textContent=`${citationText} Generated locally with ${data.model.split('/').pop()} in ${data.seconds.toFixed(1)}s (model loading excluded).`;
      $('status').textContent=audit.unknown.length?'The draft contains unsupported source IDs. Review the original evidence.':'Question drafted. Check its premise against the evidence.';
    }
    if (data.type==='error') {
      setBusy(false);
      $('status').textContent='AI generation unavailable. The evidence workspace remains usable.';
      $('error').textContent=data.text; $('error').hidden=false;
      $('audit').textContent='No completed LLM draft. This is not a generated answer.';
      if (data.detail) console.error(data.detail);
    }
  });
  $('stop').addEventListener('click',()=> {
    model.stop(); setBusy(false);
    $('status').textContent='AI stopped. You can run it again; cached files may be reused.';
    $('audit').textContent='Stopped. Any visible text is an incomplete draft.';
  });
  return {
    start(messages,sources) {
      currentSources=sources;
      $('error').hidden=true; $('llm-result').hidden=false;
      $('generated').textContent=''; $('audit').textContent='Loading and generating locally. No answer has been completed yet.';
      setBusy(true); $('status').textContent='Starting local LLM…';
      model.generate(messages);
    },
    clear() { $('llm-result').hidden=true; $('error').hidden=true; },
    error(error) { $('error').textContent=error.message; $('error').hidden=false; $('status').textContent='Check the input and try again.'; }
  };
}
