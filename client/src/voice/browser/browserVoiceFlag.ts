/**
 * The browser-voice prototype flag — deliberately dependency-free so
 * importing it never pulls the inference library into the main bundle.
 * The heavy runtime loads only through a dynamic import, and only for
 * visitors who turned the flag on.
 *
 * P0 repair (2026-10-23): the localStorage leg was read-only — nothing
 * ever wrote it — so the flag lived only in the current URL's query
 * string. Any in-app navigation (which drops query strings) silently
 * disabled the premium voice and dropped the visitor to the basic
 * fallback. Now an enabling URL parameter persists the choice on the
 * device, and an explicit ?browserVoice=0 turns it off everywhere.
 */
export function browserVoiceFlagEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("browserVoice");
      if (v === "" || v === "1") {
        try { localStorage.setItem("ocg-g-browser-voice", "1"); } catch { /* best-effort */ }
        return true;
      }
      if (v === "0") {
        try { localStorage.removeItem("ocg-g-browser-voice"); } catch { /* best-effort */ }
        return false;
      }
    }
    if (typeof localStorage !== "undefined" && localStorage.getItem("ocg-g-browser-voice") === "1") return true;
  } catch { /* flags are best-effort */ }
  return false;
}
