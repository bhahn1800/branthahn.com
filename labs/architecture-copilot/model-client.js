export class LocalModel {
  constructor(onUpdate) { this.onUpdate=onUpdate; this.worker=null; this.busy=false; }
  generate(messages) {
    if (this.busy) return;
    this.busy=true;
    if (!this.worker) {
      this.worker=new Worker(new URL('./llm-worker.js',import.meta.url),{type:'module'});
      this.worker.onmessage=({data})=> {
        if (['complete','error'].includes(data.type)) this.busy=false;
        this.onUpdate(data);
      };
      this.worker.onerror=()=> {this.stop(); this.onUpdate({type:'error',text:'Browser runtime failed to load. Check your connection, then try again.'});};
    }
    this.worker.postMessage({messages});
  }
  stop() {this.worker?.terminate(); this.worker=null; this.busy=false;}
}
