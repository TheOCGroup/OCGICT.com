import { describe, it, expect, vi, afterEach } from "vitest";
import { pocFlagEnabled } from "./pocFlag";

function stubEnv(hostname: string, search: string, stored: Record<string, string>) {
  vi.stubGlobal("location", { hostname, search, href: `https://${hostname}/${search}` });
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (k in stored ? stored[k] : null),
    setItem: (k: string, v: string) => { stored[k] = v; },
    removeItem: (k: string) => { delete stored[k]; },
  });
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("pocFlagEnabled", () => {
  it("?poc=1 enables on any host and persists", () => {
    const stored: Record<string, string> = {};
    stubEnv("ocg-g-stream-poc.netlify.app", "?poc=1", stored);
    expect(pocFlagEnabled()).toBe(true);
    expect(stored["ocg-g-poc"]).toBe("1");
  });
  it("bare ?poc enables", () => {
    stubEnv("localhost", "?poc", {});
    expect(pocFlagEnabled()).toBe(true);
  });
  it("defaults OFF on preview/local hosts with no stored choice", () => {
    stubEnv("ocg-g-stream-poc.netlify.app", "", {});
    expect(pocFlagEnabled()).toBe(false);
    stubEnv("localhost", "", {});
    expect(pocFlagEnabled()).toBe(false);
  });
  it("defaults ON on production hosts with no stored choice", () => {
    for (const h of ["theocgroup.netlify.app", "ocgict.com", "www.ocgict.com"]) {
      stubEnv(h, "", {});
      expect(pocFlagEnabled()).toBe(true);
    }
  });
  it("?poc=0 on a production host disables and persists the opt-out", () => {
    const stored: Record<string, string> = {};
    stubEnv("ocgict.com", "?poc=0", stored);
    expect(pocFlagEnabled()).toBe(false);
    expect(stored["ocg-g-poc"]).toBe("0");
  });
  it("a stored opt-out beats the production default", () => {
    stubEnv("ocgict.com", "", { "ocg-g-poc": "0" });
    expect(pocFlagEnabled()).toBe(false);
  });
  it("a stored opt-in enables on preview hosts", () => {
    stubEnv("ocg-g-stream-poc.netlify.app", "", { "ocg-g-poc": "1" });
    expect(pocFlagEnabled()).toBe(true);
  });
});
