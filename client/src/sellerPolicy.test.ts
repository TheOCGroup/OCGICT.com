import { describe, it, expect } from "vitest";
import {
  analyzeSellerContext,
  deliveryForContext,
  guardSellerReply,
} from "../../server/voice/sellerPolicy";
import { planDelivery } from "../../server/voice/gExpression";

const H = (history: Array<[string, string]>) =>
  history.map(([role, content]) => ({ role: role as "user" | "assistant", content }));

describe("seller policy — emotional context", () => {
  it("detects hesitation and keeps delivery gentle", () => {
    const ctx = analyzeSellerContext([], "I'm thinking about selling my house but I'm not sure yet");
    expect(ctx.isSeller).toBe(true);
    expect(ctx.primary).toBe("hesitant");
    const d = deliveryForContext(ctx);
    expect(d.speedScale).toBeLessThan(1);
    expect(d.pauseScale).toBeGreaterThan(1);
    expect(d.maxSentences).toBe(2);
  });

  it("detects skepticism about investors", () => {
    const ctx = analyzeSellerContext([], "How do I know this isn't a scam? Investors always lowball you.");
    expect(ctx.primary).toBe("skeptical");
  });

  it("detects listing-vs-direct comparison", () => {
    const ctx = analyzeSellerContext([], "Should I just list it with a real estate agent instead?");
    expect(ctx.primary).toBe("comparing");
  });

  it("detects financial stress and repair stress separately", () => {
    expect(analyzeSellerContext([], "I'm behind on my mortgage payments and can't afford to keep the house").primary).toBe("stressed_finances");
    expect(analyzeSellerContext([], "The roof leaks and it needs a lot of work I can't afford to fix").primary).toBe("stressed_repairs");
  });

  it("detects attachment and urgency", () => {
    expect(analyzeSellerContext([], "It's the family home, I grew up there, so many memories").primary).toBe("attached");
    expect(analyzeSellerContext([], "I need to sell fast, I'm relocating for a job transfer").primary).toBe("urgent");
  });

  it("detects Spanish contexts in Spanish", () => {
    expect(analyzeSellerContext([], "Quiero vender mi casa pero no estoy segura", { spanish: true }).primary).toBe("hesitant");
    expect(analyzeSellerContext([], "¿Cómo sé que esto no es una estafa?", { spanish: true }).primary).toBe("skeptical");
    expect(analyzeSellerContext([], "Necesito vender pronto, me mudo por trabajo", { spanish: true }).primary).toBe("urgent");
    expect(analyzeSellerContext([], "Estoy atrasado en los pagos de la casa", { spanish: true }).primary).toBe("stressed_finances");
  });

  it("does not flag investor conversation as seller", () => {
    const ctx = analyzeSellerContext([], "I want to invest in a flip, what's the DSCR on a rental?");
    expect(ctx.isSeller).toBe(false);
  });
});

describe("seller policy — facts and corrections", () => {
  it("extracts bedrooms and lets a later correction win", () => {
    const ctx = analyzeSellerContext(
      H([["user", "It's a 4 bedroom house"], ["assistant", "Got it. How is the condition?"]]),
      "Actually, it's three bedrooms",
    );
    expect(ctx.facts.bedrooms).toBe(3);
    expect(ctx.correction?.field).toBe("bedrooms");
    expect(ctx.correction?.value).toBe("3");
  });

  it("extracts word-number bedrooms and condition", () => {
    const ctx = analyzeSellerContext([], "It's a three bedroom house that needs work");
    expect(ctx.facts.bedrooms).toBe(3);
    expect(ctx.facts.condition).toBe("needs_work");
  });

  it("extracts Spanish bedrooms", () => {
    const ctx = analyzeSellerContext([], "Es una casa de tres recámaras", { spanish: true });
    expect(ctx.facts.bedrooms).toBe(3);
  });

  it("advances stage as facts arrive", () => {
    const early = analyzeSellerContext([], "I want to sell my house");
    expect(early.stage).toBe("motivation");
    const later = analyzeSellerContext(
      H([
        ["user", "I need to sell soon, it's a 3 bedroom house that needs work"],
        ["assistant", "We look at recent comparable sales and the repairs it needs. Anything else?"],
      ]),
      "What about closing costs?",
    );
    expect(later.stage).toBe("questions");
  });
});

describe("seller policy — reply guardrails", () => {
  const seller = analyzeSellerContext([], "I want to sell my house");

  it("keeps at most one question", () => {
    const out = guardSellerReply("We can help with that. What is the address? And when do you want to sell? Also, how is the condition?", seller);
    expect((out.match(/\?/g) || []).length).toBe(1);
  });

  it("removes price promises and pressure sentences entirely", () => {
    const out = guardSellerReply("We guarantee you a great offer. Act now, this won't last. We review comparable sales first.", seller);
    expect(out).not.toMatch(/guarantee|act now/i);
    expect(out).toContain("comparable sales");
  });

  it("leaves non-seller replies untouched", () => {
    const investor = analyzeSellerContext([], "Tell me about DSCR loans");
    const text = "What is your budget? And your timeline?";
    expect(guardSellerReply(text, investor)).toBe(text);
  });
});

describe("delivery mapping in planDelivery", () => {
  const text = "I understand completely. This is a big decision. We can take it one step at a time together.";

  it("sensitive emotion slows pacing, lengthens pauses, caps sentences", () => {
    const calm = planDelivery(text, { emotion: "inherited" });
    const plain = planDelivery(text, {});
    expect(calm.segments.length).toBeLessThanOrEqual(2);
    expect(calm.intent).toBe("sensitive");
    expect(calm.segments[0].speed).toBeLessThan(plain.segments[0].speed);
    expect(calm.segments[0].pauseAfterMs).toBeGreaterThan(plain.segments[0].pauseAfterMs);
  });

  it("motivated emotion keeps pace and caps sentences", () => {
    const fast = planDelivery(text, { emotion: "motivated" });
    const plain = planDelivery(text, {});
    expect(fast.segments.length).toBeLessThanOrEqual(2);
    expect(fast.segments[0].speed).toBe(plain.segments[0].speed);
    expect(fast.segments[0].pauseAfterMs).toBeLessThanOrEqual(plain.segments[0].pauseAfterMs);
  });

  it("no emotion = unchanged certified behavior", () => {
    const a = planDelivery(text, {});
    const b = planDelivery(text, { emotion: "" });
    expect(a).toEqual(b);
  });
});
