# OCG Kokoro TTS service

One independently deployed inference service for all OCG agent voices.
TTS only — dialogue intelligence, speech recognition, endpointing,
session state, and barge-in live in the agents, never here.

## Run

```bash
pip install -r requirements.txt
# model files: kokoro-v1.0.onnx (or .int8.onnx) + voices-v1.0.bin
# from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
OCG_KOKORO_TTS_KEY=<shared secret> KOKORO_MODEL=kokoro-v1.0.onnx KOKORO_VOICES=voices-v1.0.bin python app.py
```

Or build the Dockerfile (downloads the model at build time).

The service **refuses to start without `OCG_KOKORO_TTS_KEY`** and must
run behind TLS. Request text is never logged (voice, language, character
count, timings, and a text hash only).

## API

- `GET /health` → `{ ok, model, voices }` (unauthenticated liveness only)
- `GET /voices` → voice id list (key required)
- `POST /tts` → `{ text, voice, lang, speed? }` → `audio/wav`
  (24 kHz mono; `X-OCG-Gen-Seconds` / `X-OCG-Audio-Seconds` headers)
- `POST /tts/stream` → length-prefixed WAV chunks, one per sentence, so
  first-audio latency is the first sentence rather than the full reply

Auth: `X-OCG-TTS-Key` header on everything except `/health`.
Limits: 1200 chars/request by default (`OCG_TTS_MAX_CHARS`), speed 0.5–2.0.

## Model & licensing

Kokoro-82M (hexgrad/Kokoro-82M), Apache-2.0 weights; the ONNX runtime
build is kokoro-onnx (MIT). Voice style files ship in `voices-v1.0.bin`.
Commercial use is permitted by the model license; keep the upstream
license notices with any redistribution.
