// No tokens or remote inference: only model/runtime downloads leave the browser.
const MODEL = 'Xenova/LaMini-Flan-T5-248M';
const REVISION = '091769c59d551fed68a9b8baf4f70f7effa69a56';
let generator, TextStreamer;
self.onmessage = async ({data}) => {
  try {
    if (!generator) {
      self.postMessage({type:'status', text:'Loading the browser runtime…'});
      const runtime = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
      runtime.env.allowLocalModels = false;
      runtime.env.backends.onnx.wasm.numThreads = 1;
      TextStreamer = runtime.TextStreamer;
      generator = await runtime.pipeline('text2text-generation', MODEL, {
        revision: REVISION, device:'wasm', dtype:'q8',
        progress_callback: progress => {
          if (progress.status === 'progress') self.postMessage({type:'progress', file:progress.file, progress:progress.progress});
          else if (progress.status === 'initiate') self.postMessage({type:'status', text:'Downloading model files (about 290 MB on first use)…'});
        }
      });
      self.postMessage({type:'ready'});
    }
    self.postMessage({type:'status', text:'Generating on your device…'});
    const start = performance.now();
    let text = '';
    const streamer = new TextStreamer(generator.tokenizer, {skip_prompt:true, skip_special_tokens:true, callback_function: token => {text += token; self.postMessage({type:'token',text});}});
    const prompt = data.messages.map(message => message.content).join('\n\n');
    const result = await generator(prompt, {max_new_tokens:80, do_sample:false, repetition_penalty:1.05, no_repeat_ngram_size:4, streamer});
    const generated = result[0].generated_text;
    const final = typeof generated === 'string' ? generated : generated[generated.length - 1].content;
    self.postMessage({type:'complete', text:final, seconds:(performance.now()-start)/1000, model:MODEL});
  } catch (error) {
    self.postMessage({type:'error',text:'The local model could not run. Try a current desktop browser and check access to Hugging Face and jsDelivr. Evidence analysis still works.',detail:String(error.message || error)});
    generator = null;
  }
};
