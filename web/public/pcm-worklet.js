// AudioWorklet processor: captures mic PCM off the audio thread and posts it to
// the main thread in ~2048-sample Float32 chunks (so we stream to the STT
// backend without flooding it with tiny 128-frame messages).
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._parts = []
    this._count = 0
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (ch && ch.length) {
      this._parts.push(ch.slice(0))
      this._count += ch.length
      if (this._count >= 2048) {
        const out = new Float32Array(this._count)
        let off = 0
        for (const p of this._parts) { out.set(p, off); off += p.length }
        this._parts = []
        this._count = 0
        this.port.postMessage(out, [out.buffer])
      }
    }
    return true
  }
}
registerProcessor('pcm-processor', PCMProcessor)
