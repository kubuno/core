// Real-time voice capture streamed to the self-hosted STT backend (Rust + Vosk).
//
// Mic PCM is captured by an AudioWorklet, downcast to 16-bit and streamed over a
// WebSocket to /api/v1/stt/stream. The backend pushes partial transcripts back
// live, so the search field updates while the user speaks. Fully self-hosted.
import { useAuthStore } from '../store/authStore'

export type VoiceErrorCode = 'not-allowed' | 'audio-capture' | 'connect' | 'generic'

export interface VoiceCallbacks {
  onReady?:   () => void                  // mic + socket open, now listening
  onLevel?:   (level: number) => void     // 0..1 input loudness (live)
  onPartial?: (text: string) => void      // live interim transcript
  onResult?:  (text: string) => void      // a finalized utterance segment
  onError?:   (code: VoiceErrorCode) => void
}

export interface VoiceSession { stop: () => void }

function f32ToI16(f32: Float32Array): Int16Array {
  const out = new Int16Array(f32.length)
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

export async function startVoiceSession(lang: string, cb: VoiceCallbacks): Promise<VoiceSession> {
  // 1) Microphone.
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  } catch (e) {
    const name = (e as DOMException)?.name
    cb.onError?.(name === 'NotAllowedError' || name === 'SecurityError' ? 'not-allowed' : 'audio-capture')
    throw e
  }

  // 2) Audio graph: mic → AudioWorklet (PCM frames) → muted sink (keeps it alive).
  const AudioCtx = window.AudioContext
    || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* */ } }
  try {
    await ctx.audioWorklet.addModule('/pcm-worklet.js')
  } catch (e) {
    stream.getTracks().forEach(t => t.stop())
    void ctx.close().catch(() => { /* */ })
    cb.onError?.('generic')
    throw e
  }
  const source = ctx.createMediaStreamSource(stream)
  const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
  const mute = ctx.createGain()
  mute.gain.value = 0
  source.connect(worklet)
  worklet.connect(mute)
  mute.connect(ctx.destination)

  // 3) WebSocket to the backend (token via query — browsers can't set WS headers).
  const token = useAuthStore.getState().accessToken ?? ''
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${proto}://${window.location.host}/api/v1/stt/stream`
    + `?lang=${encodeURIComponent(lang)}&rate=${Math.round(ctx.sampleRate)}`
    + (token ? `&token=${encodeURIComponent(token)}` : '')
  const ws = new WebSocket(url)
  ws.binaryType = 'arraybuffer'

  let ready = false
  ws.onopen = () => { ready = true; cb.onReady?.() }
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(ev.data as string)
      if (typeof m.partial === 'string') cb.onPartial?.(m.partial)
      else if (typeof m.text === 'string' && m.text) cb.onResult?.(m.text)
    } catch { /* ignore non-JSON */ }
  }
  ws.onerror = () => { if (!ready) cb.onError?.('connect') }

  worklet.port.onmessage = (e) => {
    const f32 = e.data as Float32Array
    let peak = 0
    for (let i = 0; i < f32.length; i += 16) { const a = Math.abs(f32[i]); if (a > peak) peak = a }
    cb.onLevel?.(peak)
    if (ws.readyState === WebSocket.OPEN) ws.send(f32ToI16(f32).buffer as ArrayBuffer)
  }

  let stopped = false
  return {
    stop: () => {
      if (stopped) return
      stopped = true
      try { worklet.port.onmessage = null; worklet.disconnect() } catch { /* */ }
      try { source.disconnect(); mute.disconnect() } catch { /* */ }
      try { stream.getTracks().forEach(t => t.stop()) } catch { /* */ }
      try { if (ws.readyState === WebSocket.OPEN) ws.close() } catch { /* */ }
      void ctx.close().catch(() => { /* */ })
    },
  }
}
