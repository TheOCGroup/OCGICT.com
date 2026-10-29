/**
 * POC flag for the architecture-reset proof of concept (Option C:
 * streaming Gemini brain + server-side TTS). Persistence contract:
 * ?poc=1 enables and persists on the device, ?poc=0 disables and
 * persists the opt-out, otherwise the stored choice wins. With no
 * stored choice, the flag defaults ON on the production hostnames
 * only (default-ON launch posture, founder-directed 2026-10-25) and
 * OFF everywhere else, so previews and local development keep the
 * certified opt-in behavior. When the flag is off, G behaves exactly
 * as the certified local build; when the server voice path fails,
 * GExperience falls back to that same certified behavior.
 */
const PRODUCTION_HOSTS = new Set(["theocgroup.netlify.app", "ocgict.com", "www.ocgict.com"]);

export function pocFlagEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("poc");
      if (v === "" || v === "1") {
        try { localStorage.setItem("ocg-g-poc", "1"); } catch { /* best-effort */ }
        return true;
      }
      if (v === "0") {
        try { localStorage.setItem("ocg-g-poc", "0"); } catch { /* best-effort */ }
        return false;
      }
    }
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("ocg-g-poc");
      if (stored === "1") return true;
      if (stored === "0") return false;
    }
    if (typeof location !== "undefined" && PRODUCTION_HOSTS.has(location.hostname)) return true;
  } catch { /* flags are best-effort */ }
  return false;
}
