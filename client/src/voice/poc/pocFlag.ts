/**
 * POC flag for the architecture-reset proof of concept (Option C:
 * streaming Gemini brain + server-side TTS). Mirrors the browserVoice
 * flag's persistence contract: ?poc=1 enables and persists on the
 * device, ?poc=0 disables everywhere, otherwise the stored choice wins.
 * When the flag is off, G behaves exactly as the certified build.
 */
export function pocFlagEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("poc");
      if (v === "" || v === "1") {
        try { localStorage.setItem("ocg-g-poc", "1"); } catch { /* best-effort */ }
        return true;
      }
      if (v === "0") {
        try { localStorage.removeItem("ocg-g-poc"); } catch { /* best-effort */ }
        return false;
      }
    }
    if (typeof localStorage !== "undefined" && localStorage.getItem("ocg-g-poc") === "1") return true;
  } catch { /* flags are best-effort */ }
  return false;
}
