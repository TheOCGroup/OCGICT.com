/**
 * The browser-voice prototype flag — deliberately dependency-free so
 * importing it never pulls the inference library into the main bundle.
 * The heavy runtime loads only through a dynamic import, and only for
 * visitors who turned the flag on.
 */
export function browserVoiceFlagEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("browserVoice");
      if (v === "" || v === "1") return true;
    }
    if (typeof localStorage !== "undefined" && localStorage.getItem("ocg-g-browser-voice") === "1") return true;
  } catch { /* flags are best-effort */ }
  return false;
}
