export const runbooks = [
  {id:'RUN-001',title:'Retry and duplicate-delivery investigation',focus:'acknowledgement timing and the idempotency ledger',codes:['DUPLICATE_EVENT','RETRY_EXHAUSTED'],body:'Repeated event IDs and duplicate-delivery codes can indicate redelivery, retries or repeated logging. Inspect acknowledgement timing and the idempotency ledger before deciding which occurred. Check whether a unique constraint rejected a second write. Do not equate repeated log entries with confirmed duplicate business side effects. Review dead-letter queue entries and retry counts; do not automatically replay or purge events.'},
  {id:'RUN-002',title:'Database latency investigation',focus:'query duration, lock waits and connection-pool usage',codes:['DB_TIMEOUT','POOL_EXHAUSTED'],body:'Database timeouts and pool exhaustion can reflect contention, slow queries, connectivity or insufficient available connections. Inspect query duration, lock waits and connection-pool usage. Compare with recent releases and database health. A timeout alone does not prove the database is the root cause. Capture read-only evidence before considering an operational change.'},
  {id:'RUN-003',title:'Event contract investigation',focus:'the event schema version and the consumer supported versions',codes:['SCHEMA_MISMATCH','UNKNOWN_VERSION'],body:'Schema mismatch and unknown-version codes indicate a contract compatibility problem may be present. Compare the event version with the consumer supported versions and the producer release. Inspect the rejected event and contract-test fixtures. Correct compatibility through a reviewed change; do not silently drop required fields or purge the dead-letter queue.'}
];
const event = (second, service, level, code, latency_ms, message, event_id) => ({timestamp:`2026-01-15T10:00:${String(second).padStart(2,'0')}Z`,service,level,code,latency_ms,message,...(event_id?{event_id}:{})});
export const scenarios = [
  {label:'Retry storm',events:[
    event(1,'orders-consumer','INFO','RECEIVED',45,'Order event received','evt-101'),
    event(2,'orders-consumer','WARN','DUPLICATE_EVENT',30,'Repeated delivery rejected by idempotency ledger','evt-101'),
    event(3,'orders-consumer','ERROR','RETRY_EXHAUSTED',2800,'Retry limit reached after transient failures','evt-102'),
    event(4,'orders-consumer','ERROR','RETRY_EXHAUSTED',2900,'Event sent to dead-letter queue','evt-103'),
    event(5,'orders-api','INFO','ACCEPTED',90,'New order accepted','evt-104')
  ]},
  {label:'Slow database',events:[
    event(1,'orders-api','ERROR','DB_TIMEOUT',2100,'Query exceeded timeout','evt-201'),
    event(2,'orders-api','ERROR','POOL_EXHAUSTED',2200,'No connection available within timeout','evt-202'),
    event(3,'inventory-api','INFO','OK',80,'Availability lookup completed','evt-203'),
    event(4,'orders-api','ERROR','DB_TIMEOUT',2400,'Query exceeded timeout','evt-204')
  ]},
  {label:'Contract break',events:[
    event(1,'orders-consumer','ERROR','SCHEMA_MISMATCH',12,'Required order_id field missing','evt-301'),
    event(2,'orders-consumer','ERROR','UNKNOWN_VERSION',10,'Event version v3 is unsupported','evt-302'),
    event(3,'orders-producer','INFO','PUBLISHED',50,'Event version v3 published','evt-303')
  ]},
  {label:'Unknown signature',events:[event(1,'sample-api','ERROR','UNCLASSIFIED',120,'Unexpected failure; no known runbook match','evt-401')]}
];
