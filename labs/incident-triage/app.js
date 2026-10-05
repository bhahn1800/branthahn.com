import { parseEvents, analyzeEvents, incidentPrompt } from './core.js';
import { runbooks, scenarios } from './data.js';
import { $, node, renderSource, renderEvaluation, modelUI } from './ui.js';
const ai=modelUI('events');
function analyze() {
  ai.clear();
  const report=analyzeEvents(parseEvents($('events').value),runbooks);
  $('urgency').textContent=`Demo urgency: ${report.urgency}`;
  const stats=node('div',undefined,'stats');
  for (const [value,label] of [[report.eventCount,'Events'],[`${Math.round(report.errorRate*100)}%`,'Error events'],[report.p95===null?'N/A':`${report.p95} ms`,'Sample p95']]) {
    const stat=node('div',undefined,'stat'); stat.append(node('strong',value),node('span',label)); stats.append(stat);
  }
  const description=node('p',`${report.errorCount} ERROR events out of ${report.eventCount}; p95 uses ${report.latencyCount} supplied latency samples (nearest rank).`,'report-line');
  const services=node('p',`Services: ${report.services.join(', ')}`,'report-line');
  const repeated=node('p',report.repeatedEventIds.length?`Repeated IDs: ${report.repeatedEventIds.map(item=>`${item.id} (${item.count} log entries)`).join(', ')}. Repeated logging alone does not prove duplicate side effects.`:'No repeated event IDs in this sample.','report-line');
  const timeline=node('div',undefined,'timeline'),table=node('table'),head=node('tr');
  for (const title of ['UTC time','Service','Level / code']) head.append(node('th',title));
  const thead=node('thead');thead.append(head);table.append(thead);
  const body=node('tbody');
  for (const event of report.events) {
    const row=node('tr'); row.append(node('td',event.timestamp.slice(11)),node('td',event.service),node('td',`${event.level} / ${event.code}`,'code')); body.append(row);
  }
  table.append(body);timeline.append(table);
  const books=node('div'); books.append(node('h3','Matched runbooks'));
  books.append(...report.runbooks.map(book=>renderSource(book)));
  if (!report.runbooks.length) books.append(node('div','No known runbook signature. Keep investigating; this demo will not generate a diagnosis from missing guidance.','empty'));
  $('report').replaceChildren(stats,description,services,repeated,timeline,books,node('p','Metrics are computed from your input. No root cause is established by this report.','evidence-note'));
  $('status').textContent=report.runbooks.length?'Evidence ready. Generate a local investigation draft if you want.':'No matching runbook. AI drafting is skipped.';
  return report;
}
for (const scenario of scenarios) {
  const button=node('button',scenario.label);
  button.addEventListener('click',()=> {$('events').value=JSON.stringify(scenario.events,null,2);try{analyze();}catch(error){ai.error(error);}});
  $('samples').append(button);
}
$('events').value=JSON.stringify(scenarios[0].events,null,2);
$('analyze').addEventListener('click',()=> {try{analyze();}catch(error){$('report').replaceChildren(node('div','The log was not accepted. Correct the input to produce a report.','empty'));$('urgency').textContent='Invalid input';ai.error(error);}});
$('generate').addEventListener('click',()=> {try{const report=analyze();if(report.runbooks.length)ai.start(incidentPrompt(report),report.runbooks);}catch(error){$('report').replaceChildren(node('div','The log was not accepted. No model was called.','empty'));$('urgency').textContent='Invalid input';ai.error(error);}});
$('events').addEventListener('input',()=> {ai.clear();$('urgency').textContent='Log changed';$('report').replaceChildren(node('div','Analyze the updated log to refresh its evidence.','empty'));});
$('library').replaceChildren(...runbooks.map(book=>renderSource(book)));
$('evaluate').addEventListener('click',()=> {
  const expectations=[{errors:2,p95:2900,book:'RUN-001'},{errors:3,p95:2400,book:'RUN-002'},{errors:2,p95:50,book:'RUN-003'},{errors:1,p95:120,book:null}];
  const rows=scenarios.map((scenario,index)=> {
    const report=analyzeEvents(parseEvents(JSON.stringify(scenario.events)),runbooks),expected=expectations[index];
    const ids=report.runbooks.map(book=>book.id);
    return {label:scenario.label,expected:`${expected.errors} errors; p95 ${expected.p95}; ${expected.book || 'no runbook'}`,observed:`${report.errorCount} errors; p95 ${report.p95}; ${ids.join(', ') || 'no runbook'}`,pass:report.errorCount===expected.errors && report.p95===expected.p95 && (expected.book ? ids.includes(expected.book) : !ids.length)};
  });
  for (const [label,raw] of [['Invalid JSON','not-json'],['Empty event list','[]'],['Invalid schema','[{"message":"missing fields"}]']]) {
    let rejected=false;try{parseEvents(raw);}catch{rejected=true;}
    rows.push({label,expected:'Rejected',observed:rejected?'Rejected':'Accepted',pass:rejected});
  }
  renderEvaluation(rows);
});
analyze();
