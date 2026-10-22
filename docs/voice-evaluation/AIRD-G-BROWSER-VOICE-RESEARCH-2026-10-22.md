# OCG LAB — AIRD / G Browser Voice R&D — Phase 1 Baseline
Date: 2026-10-22
Source system: OCG LAB — Agent Intelligence R&D (AIRD)
Target product: OCGICT.com
Target agent: G ONLY
Engineering: MUSE | Independent QA: QUINCEY
Status: RESEARCH BASELINE; NOT CERTIFIED; NOT DEPLOYED

## Isolation and provenance
This isolated branch starts at PR #14's exact certified candidate 3b82d8cd34588783c3a022522f61a54f37a8ffca. PR #14 is not modified. Existing ocg-voice service commit 7d9b93d is not modified. Do not modify Aiden or other agents. No merge, deploy, new secret, paid resource, or training is authorized.

## Hypothesis
A G-only browser ONNX TTS adapter can produce EN/ES audio with no incremental *recurring inference subscription* by shifting compute to clients and serving immutable static assets through existing capacity. This does not establish zero bandwidth/storage costs, acceptable mobile latency, or commercial rights; all require verification.

## Reference architecture / licenses (verify exact pinned asset before any distribution)
- Supertonic 3: archived source at https://github.com/supertone-oss-archive/supertonic ; ONNX browser demo in web/; ~99M parameters, 31 languages including English/Spanish, M1 preset. Example code MIT; weights OpenRAIL-M with attribution/use restrictions. Archive no longer supported. Pin exact model revision and license.
- Kokoro: https://huggingface.co/hexgrad/Kokoro-82M ; 82M weights Apache-2.0, English baseline; verify Spanish-capable variant separately; do not claim baseline English Kokoro is bilingual. Check eSpeak NG GPLv3 dependency boundary.
- Fish Audio Drama 3: https://huggingface.co/fishaudio/drama-3/blob/main/LICENSE ; reference concepts only. Community License v1.0 has commercial threshold and Hosted Service restrictions; forbids using model outputs to train/distill another speech model. Do NOT incorporate Fish weights, generated audio, or derivatives in original-model training.
- ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/ ; execution providers WASM and WebGPU, compatibility varies. Verify runtime license and shipped WASM assets at pinned versions.

## Proposed G-only runtime boundaries
GConversationEngine -> GVoiceController (G-only feature flag) -> EN/ES text normalizer -> sentence segmentation + intent prosody plan -> BrowserVoiceAdapter (Supertonic M1 first; Kokoro fallback if supported; browser SpeechSynthesis fallback explicitly labeled) -> AudioQueue (interrupt/cancel) -> Web Audio playback.
Separate model manifest with sha256, pinned URLs, byte sizes, voice style identity, license, language capabilities and cache policy. No shared-agent changes.
Workers own model sessions; user gestures unlock audio; abort tokens cancel queued sentences; avoid claiming that cancellation stops an in-flight ONNX kernel unless tested.
Expression is controlled by intent and bounded prosody, not by injecting untrusted instructions into text.

## Measurement protocol (no invented results)
Test on actual OCGICT.com staging interface and representative desktop/mobile browsers. Record OS, browser version, CPU/GPU, RAM, network, power state, cache state, asset sizes, model hashes and exact code SHA.
Cold: navigation -> asset fetch -> model ready -> first audible sample. Warm: cached model ready -> first audible sample. Record p50/p95 over >=20 runs each; audio duration / generation time; peak JS heap and total browser memory where measurable; CPU/GPU availability; cancellation latency; fallback path.
Corpus: >=30 EN, >=30 ES, mixed-language turns, currencies, dates, addresses, numbers, abbreviations, proper nouns; blind intelligibility and identity consistency review; consented recordings only.
No benchmark, recording, zero-cost conclusion or quality claim until evidence exists.

## Implementation phases / gates
1. Inventory G code, dependency graph, current provider and flags; do not overwrite parallel PRs.
2. Implement isolated browser adapter and worker; deterministic normalizer/segmenter tests; no global provider replacement.
3. Run real browser measurements on staging; compare M1 with existing Kokoro and SpeechSynthesis fallback using identical EN/ES scripts and loudness normalization.
4. Prepare separate original-model research: consented/licensed speech corpus, clean-room architecture candidates, training/eval split, compute estimates and cost ceiling; approval required before any training.
5. QUINCEY independent QA of exact commit, license bill of materials, regression, accessibility, security, resource budget, bilingual audio evidence. Remain DRAFT until explicit founder release authorization.

## Cost controls
No paid API, dedicated GPU instance, new storage tier or increased subscription. Static hosting on existing service is a hypothesis pending provider quota, CDN egress and asset-size audit. Never claim $0 incremental cost without measured hosting/egress evidence.

## Open risks
OpenRAIL-M conditions; model archival/no security updates; static asset egress; first-use download and mobile memory; Spanish normalization; unsupported browser WebGPU; accessibility and offline caching; copyrighted/consent-limited training data; inadvertent cross-agent provider coupling.

## Evidence register
Research sources: links above (reviewed 2026-10-22).
Actual benchmarks: PENDING.
Browser prototype: PENDING.
EN/ES recordings: PENDING.
Independent QUINCEY verdict: PENDING.
Deployment: NOT AUTHORIZED.
