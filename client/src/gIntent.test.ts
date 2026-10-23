import { describe, expect, it } from "vitest";
import { GIntelligenceGateway } from "../../server/services/gIntelligenceGateway";

// P0 regression battery (founder browser failure, 2026-10-23): natural
// spoken-style questions must be ANSWERED by the local engine — never
// met with the generic introduction — and the introduction may appear
// at most once per conversation.
let seq = 0;
async function ask(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
  seq += 1;
  return GIntelligenceGateway.processMessage({
    sessionId: `intent-test-${seq}-${Date.now()}`,
    message,
    localOnly: true,
    history,
  });
}

const INTRO_EN = "I am G, The OC Group's AI guide. I can help with selling a house";
const INTRO_ES = "Soy G, la guía de IA de The OC Group. Puedo ayudarle a vender una casa";

describe("general questions are answered, not introduced over", () => {
  it("answers the founder-session questions (EN)", async () => {
    const company = await ask("What exactly do you guys do?");
    expect(company.replyText).toContain("Wichita-based real estate acquisition");
    expect(company.replyText).not.toContain(INTRO_EN);

    const fees = await ask("How much does it cost to use your services?");
    expect(fees.replyText).toContain("no charge and no obligation");
    expect(fees.replyText).not.toContain(INTRO_EN);

    const timeline = await ask("How long does the whole process take?");
    expect(timeline.replyText).toContain("preliminary review usually takes days");
    expect(timeline.replyText).not.toContain(INTRO_EN);
  });

  it("answers the wider natural-question space (EN)", async () => {
    expect((await ask("Do you charge any fees?")).replyText).toContain("no charge and no obligation");
    expect((await ask("What areas do you buy houses in?")).replyText).toContain("Wichita");
    expect((await ask("Can I talk to a real person?")).replyText).toContain("(720) 620-9929");
    expect((await ask("Tell me about your process")).replyText).toContain("step by step");
    expect((await ask("What kinds of houses do you buy?")).replyText).toContain("any condition");
    expect((await ask("How much would you pay for my house?")).replyText).toContain("can't put a number");
    expect((await ask("How does selling to you work?")).replyText).toContain("no repairs, no showings");
  });

  it("never repeats the introduction inside one conversation", async () => {
    const h: Array<{ role: "user" | "assistant"; content: string }> = [];
    const r1 = await ask("blorp zibber", h);
    expect(r1.replyText).toContain(INTRO_EN); // first fallback may introduce
    h.push({ role: "user", content: "blorp zibber" }, { role: "assistant", content: r1.replyText });
    const r2 = await ask("flibberty gibbet", h);
    expect(r2.replyText).not.toContain(INTRO_EN);
    expect(r2.replyText).toContain("point you the right way");
    h.push({ role: "user", content: "flibberty gibbet" }, { role: "assistant", content: r2.replyText });
    const r3 = await ask("snizzle frazzle", h);
    expect(r3.replyText).not.toContain(INTRO_EN);
  });

  it("answers general questions in Spanish, in Spanish", async () => {
    const fees = await ask("¿Cobran algo por revisar mi casa?");
    expect(fees.replyText).toContain("No hay ningún cargo");
    expect(fees.replyText).not.toContain(INTRO_ES);
    const human = await ask("¿Puedo hablar con una persona real?");
    expect(human.replyText).toContain("(720) 620-9929");
    const areas = await ask("¿En qué zonas compran casas?");
    expect(areas.replyText).toContain("Wichita");
    const process = await ask("¿Cómo funciona el proceso?");
    expect(process.replyText).toContain("paso a paso");
  });

  it("keeps the certified seller flows intact", async () => {
    const seller = await ask("I want to sell my house");
    expect(seller.replyText).toContain("selling as-is or making repairs first");
    const skeptical = await ask("How do I know this isn't a scam?");
    expect(skeptical.replyText).toContain("shouldn't have to take my word");
    const mao = await ask("Calculate the 70% rule with ARV $300,000 and rehab $40,000");
    expect(mao.replyText).toContain("$170,000");
  });
});

describe("the founder's exact phrases (2026-10-23 verification)", () => {
  it("are answered as voice-meta questions, honestly", async () => {
    const { routeGeneralIntent } = await import("../server/voice/gIntent");
    expect(routeGeneralIntent("Hey, G, can you hear me?", { spanish: false })?.intent).toBe("voiceHearing");
    expect(routeGeneralIntent("Hey, Gee, why don't I hear you respond back?", { spanish: false })?.intent).toBe("voiceNoAudio");
    expect(routeGeneralIntent("Why does it take you so damn long to respond?", { spanish: false })?.intent).toBe("voiceSlow");
    expect(routeGeneralIntent("¿Me escuchas?", { spanish: true })?.intent).toBe("voiceHearing");
    expect(routeGeneralIntent("No te escucho nada", { spanish: true })?.intent).toBe("voiceNoAudio");
    expect(routeGeneralIntent("¿Por qué tardas tanto en responder?", { spanish: true })?.intent).toBe("voiceSlow");
    // A real timeline question must NOT be stolen by the meta rule.
    expect(routeGeneralIntent("How long does the whole process take?", { spanish: false })?.intent).toBe("timeline");
    expect(routeGeneralIntent("¿Cuánto tarda el proceso de venta?", { spanish: true })?.intent).toBe("timeline");
  });

  it("the clarifier never repeats: stage-2 offers the phone and the three routes", async () => {
    const { generalFallback, clarifierAlreadyGiven } = await import("../server/voice/gIntent");
    const hist = [
      { role: "user", content: "blah" },
      { role: "assistant", content: "Let me point you the right way: are you asking as a homeowner thinking about selling, as an investor, or about the company itself?" },
    ];
    expect(clarifierAlreadyGiven(hist)).toBe(true);
    const second = generalFallback({ spanish: false, sellerContext: false, investorContext: false, introGiven: true, clarifierGiven: true });
    expect(second).not.toContain("point you the right way");
    expect(second).toContain("(720) 620-9929");
    const secondEs = generalFallback({ spanish: true, sellerContext: false, investorContext: false, introGiven: true, clarifierGiven: true });
    expect(secondEs).toContain("(720) 620-9929");
  });
});
