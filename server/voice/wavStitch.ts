/**
 * WAV stitching for G's expression layer: concatenates per-segment WAVs
 * from the Kokoro service (24 kHz mono 16-bit PCM) with real silence
 * between segments, so pacing pauses in a DeliveryPlan are actual audio
 * silence — not model behavior and not spoken punctuation.
 *
 * Minimal RIFF parser: validates the fmt chunk is PCM/mono/16-bit and
 * locates the data chunk. Anything else throws, and the caller fails
 * closed to the non-expressive path.
 */

export interface WavPcm {
  sampleRate: number;
  pcm: Int16Array;
}

export function parseWavPcm(bytes: Uint8Array): WavPcm {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (off: number) =>
    String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
  if (bytes.length < 44 || tag(0) !== "RIFF" || tag(8) !== "WAVE") {
    throw new Error("not a WAV payload");
  }
  let fmt: { audioFormat: number; channels: number; sampleRate: number; bits: number } | null = null;
  let dataOff = -1;
  let dataLen = 0;
  let off = 12;
  while (off + 8 <= bytes.length) {
    const id = tag(off);
    const size = view.getUint32(off + 4, true);
    if (id === "fmt ") {
      fmt = {
        audioFormat: view.getUint16(off + 8, true),
        channels: view.getUint16(off + 10, true),
        sampleRate: view.getUint32(off + 12, true),
        bits: view.getUint16(off + 22, true),
      };
    } else if (id === "data") {
      dataOff = off + 8;
      dataLen = Math.min(size, bytes.length - dataOff);
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!fmt || dataOff < 0) throw new Error("WAV missing fmt or data chunk");
  if (fmt.audioFormat !== 1 || fmt.channels !== 1 || fmt.bits !== 16) {
    throw new Error(`unsupported WAV format (fmt=${fmt.audioFormat}, ch=${fmt.channels}, bits=${fmt.bits})`);
  }
  const count = Math.floor(dataLen / 2);
  const pcm = new Int16Array(count);
  for (let i = 0; i < count; i++) pcm[i] = view.getInt16(dataOff + i * 2, true);
  return { sampleRate: fmt.sampleRate, pcm };
}

function wavHeader(sampleRate: number, dataBytes: number): Uint8Array {
  const h = new Uint8Array(44);
  const v = new DataView(h.buffer);
  const put = (off: number, s: string) => { for (let i = 0; i < s.length; i++) h[off + i] = s.charCodeAt(i); };
  put(0, "RIFF");
  v.setUint32(4, 36 + dataBytes, true);
  put(8, "WAVE");
  put(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate
  v.setUint16(32, 2, true); // block align
  v.setUint16(34, 16, true); // bits
  put(36, "data");
  v.setUint32(40, dataBytes, true);
  return h;
}

/** Concatenate WAV parts, inserting `pauseAfterMs` of silence after each part except the last. */
export function stitchWavs(parts: { wav: ArrayBuffer; pauseAfterMs: number }[]): {
  wav: ArrayBuffer;
  sampleRate: number;
  audioSeconds: number;
} {
  if (parts.length === 0) throw new Error("no parts to stitch");
  const parsed = parts.map((p) => ({ ...parseWavPcm(new Uint8Array(p.wav)), pauseAfterMs: p.pauseAfterMs }));
  const sampleRate = parsed[0].sampleRate;
  for (const p of parsed) {
    if (p.sampleRate !== sampleRate) throw new Error("sample rate mismatch between segments");
  }
  let total = 0;
  parsed.forEach((p, i) => {
    total += p.pcm.length;
    if (i < parsed.length - 1) total += Math.round((p.pauseAfterMs / 1000) * sampleRate);
  });
  const out = new Int16Array(total);
  let pos = 0;
  parsed.forEach((p, i) => {
    out.set(p.pcm, pos);
    pos += p.pcm.length;
    if (i < parsed.length - 1) pos += Math.round((p.pauseAfterMs / 1000) * sampleRate); // zeros = silence
  });
  const header = wavHeader(sampleRate, total * 2);
  const buf = new Uint8Array(44 + total * 2);
  buf.set(header, 0);
  const v = new DataView(buf.buffer);
  for (let i = 0; i < total; i++) v.setInt16(44 + i * 2, out[i], true);
  return { wav: buf.buffer as ArrayBuffer, sampleRate, audioSeconds: total / sampleRate };
}
