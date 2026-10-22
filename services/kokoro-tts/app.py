#!/usr/bin/env python3
"""OCG Kokoro TTS service — one independently deployed inference service,
many isolated agent profiles (see docs/voice-evaluation/).

Design rules (from the shared audition plan):
- TTS only. Dialogue intelligence, ASR, endpointing, session state, and
  barge-in live in the agents, never here.
- Auth: every endpoint except /health requires the X-OCG-TTS-Key header
  matching OCG_KOKORO_TTS_KEY. No key configured -> the service refuses
  to start (never run an open TTS endpoint).
- Privacy: request text is never logged. Logs carry voice, language,
  character count, timings, a rolling request id, and an 8-hex-char
  SHA-256 prefix of the text — a correlation aid for matching a log
  line to a reported request, not a secrecy control.
- Streaming: /tts/stream emits one WAV chunk per sentence as it is
  synthesized, so first-audio latency is the first sentence, not the
  full reply.

Env:
  OCG_KOKORO_TTS_KEY   required shared secret
  KOKORO_MODEL         path to kokoro-v1.0.onnx (or .int8.onnx)
  KOKORO_VOICES        path to voices-v1.0.bin
  PORT                 default 8020
  OCG_TTS_MAX_CHARS    per-request cap, default 1200
"""
import hashlib
import io
import json
import os
import re
import sys
import time

import soundfile as sf
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from kokoro_onnx import Kokoro

API_KEY = os.environ.get("OCG_KOKORO_TTS_KEY", "")
if not API_KEY:
    print("FATAL: OCG_KOKORO_TTS_KEY is not set — refusing to start an unauthenticated TTS endpoint.", file=sys.stderr)
    raise SystemExit(2)

MODEL = os.environ.get("KOKORO_MODEL", "kokoro-v1.0.onnx")
VOICES = os.environ.get("KOKORO_VOICES", "voices-v1.0.bin")
MAX_CHARS = int(os.environ.get("OCG_TTS_MAX_CHARS", "1200"))

kokoro = Kokoro(MODEL, VOICES)
VOICE_SET = set(kokoro.get_voices())
app = FastAPI(title="OCG Kokoro TTS", version="1.0.0")
_req_counter = 0


def require_key(x_ocg_tts_key: str | None):
    if x_ocg_tts_key != API_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


def wav_bytes(samples, sr) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, samples, sr, format="WAV")
    return buf.getvalue()


SUPPORTED_LANGS = {"en-us", "en-gb", "es", "fr-fr", "it", "pt-br", "ja", "ko", "zh", "hi"}

SENTENCE_SPLIT = re.compile(r"(?<=[.!?…])\s+")


def sentences(text: str):
    parts = [p.strip() for p in SENTENCE_SPLIT.split(text.strip()) if p.strip()]
    return parts or [text.strip()]


@app.get("/health")
def health():
    return {"ok": True, "model": os.path.basename(MODEL), "voices": len(VOICE_SET)}


@app.get("/voices")
def voices(x_ocg_tts_key: str | None = Header(default=None)):
    require_key(x_ocg_tts_key)
    return {"voices": sorted(VOICE_SET)}


async def parse_payload(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid JSON body")
    text = str(payload.get("text", "")).strip()
    voice = str(payload.get("voice", "")).strip()
    lang = str(payload.get("lang", "en-us")).strip() or "en-us"
    try:
        speed = float(payload.get("speed", 1.0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="speed must be a number")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > MAX_CHARS:
        raise HTTPException(status_code=413, detail=f"text exceeds {MAX_CHARS} characters")
    if voice not in VOICE_SET:
        raise HTTPException(status_code=400, detail=f"unknown voice: {voice or '(empty)'}")
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail=f"unsupported lang: {lang}")
    if speed < 0.5 or speed > 2.0:
        raise HTTPException(status_code=400, detail="speed out of range (0.5–2.0)")
    return text, voice, lang, speed


@app.post("/tts")
async def tts(request: Request, x_ocg_tts_key: str | None = Header(default=None)):
    require_key(x_ocg_tts_key)
    text, voice, lang, speed = await parse_payload(request)
    global _req_counter
    _req_counter += 1
    rid = _req_counter
    t0 = time.time()
    samples, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang)
    gen = time.time() - t0
    dur = len(samples) / sr
    print(json.dumps({"rid": rid, "voice": voice, "lang": lang, "chars": len(text),
                      "gen_s": round(gen, 3), "audio_s": round(dur, 2),
                      "rtf": round(gen / dur, 3) if dur else None,
                      "text_sha": hashlib.sha256(text.encode()).hexdigest()[:8]}), flush=True)
    return StreamingResponse(io.BytesIO(wav_bytes(samples, sr)), media_type="audio/wav",
                             headers={"X-OCG-Gen-Seconds": f"{gen:.3f}",
                                      "X-OCG-Audio-Seconds": f"{dur:.2f}",
                                      "X-OCG-Sample-Rate": str(sr)})


@app.post("/tts/stream")
async def tts_stream(request: Request, x_ocg_tts_key: str | None = Header(default=None)):
    require_key(x_ocg_tts_key)
    text, voice, lang, speed = await parse_payload(request)

    def generate():
        for part in sentences(text):
            samples, sr = kokoro.create(part, voice=voice, speed=speed, lang=lang)
            data = wav_bytes(samples, sr)
            # 4-byte big-endian length prefix per chunk, then the WAV bytes.
            yield len(data).to_bytes(4, "big") + data

    return StreamingResponse(generate(), media_type="application/octet-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8020")), log_level="warning")
