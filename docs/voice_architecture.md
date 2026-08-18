# OCG Voice Architecture Specification (Phase II)

## Overview
G's Voice capability is designed as a low-latency, conversational voice intelligence layer for real estate investors and sellers. Rather than using turn-based recording widgets, the production architecture utilizes full-duplex audio streaming with sub-300ms interruption (barge-in) capability.

---

## 1. Full-Duplex Architecture

```
                                  [ User Microphone ]
                                           │
                                           ▼ (Opus Audio Chunks via WebSockets / WebRTC)
                                 [ API Gateway / Edge Worker ]
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
    [ Streaming STT Engine ]                               [ Client Audio Energy Detector ]
    (Deepgram Nova-2 / AssemblyAI)                         (Immediate local barge-in signal)
                │                                                     │
                ▼ (Transcribed Tokens)                                │
  [ G Core Reasoning Engine ]                                         │
  (Gemini 1.5 Flash / Realtime API)                                   │
  + OCG Knowledge Base                                                │
  + Tool Calling (Calculators, Wichita DB)                            │
                │                                                     │
                ▼ (Streaming Text Tokens)                             │
     [ Streaming TTS Engine ]                                         │
     (Cartesia Sonic / ElevenLabs Turbo v2.5)                         │
                │                                                     │
                ▼ (Audio Stream / PCM)                                ▼
                                 [ Browser Audio Context ] ◄── (Cancel buffer on barge-in)
                                           │
                                           ▼
                                    [ User Speaker ]
```

---

## 2. Component Breakdown & Latency Budgets

| Stage | Target Technology | Target Latency | Notes |
| :--- | :--- | :--- | :--- |
| **Transport** | WebSockets (Binary Opus/PCM) or WebRTC Data/Media Channel | 20–40ms | Bi-directional streaming |
| **Speech-to-Text (STT)** | Deepgram Nova-2 Streaming | 100–140ms | High-accuracy real estate terminology dictionary |
| **LLM Reasoning & Tools** | Gemini 1.5 Flash / OpenAI Realtime API | 120–200ms | Structured tool calling enabled |
| **Text-to-Speech (TTS)** | Cartesia Sonic / ElevenLabs Turbo v2.5 | 80–120ms | Low-latency streaming voice output |
| **Total Round-Trip Latency** | **Target: < 450ms** | Natural conversational cadence |

---

## 3. Interruption & Barge-In Protocol
1. **Client-Side VAD (Voice Activity Detection)**: The browser runs a lightweight WebAudio VAD.
2. **Instant Cancellation**: When user speech onset is detected while G is speaking:
   - The browser immediately zeroes and disconnects the active AudioBufferSourceNode.
   - A `{"type": "client_barge_in"}` packet is transmitted over the WebSocket.
3. **Server-Side Queue Flush**: The server drops pending TTS generation and flushes the pipeline, transitioning the LLM state to ingest the new user query.

---

## 4. Staging Status vs Production Requirement
- **Current Public Website Status**: **`STAGING PREVIEW`** (Text reasoning core & tool calling live; voice button badged as staging preview).
- **Required for Production Cutover**:
  1. WebSocket audio relay server deployed to edge (Cloudflare Worker or Node server).
  2. Streaming STT/TTS API keys provisioned in production environment variables (`DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`).
