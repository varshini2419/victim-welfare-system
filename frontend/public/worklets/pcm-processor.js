// AudioWorklet processor for Gemini Live voice input.
// Served as a real static file (public/worklets/pcm-processor.js) because
// AudioWorklet.addModule() rejects blob: URLs in Chromium.
// Buffers mic samples and posts them to the main thread in ~2048-sample
// chunks (~128ms at 16kHz) - smaller chunks reach the model sooner.
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) return true;
    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.index++] = channel[i];
      if (this.index >= this.bufferSize) {
        this.port.postMessage({ type: 'audio', data: this.buffer });
        this.buffer = new Float32Array(this.bufferSize);
        this.index = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
