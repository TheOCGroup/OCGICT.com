import { describe, expect, it } from "vitest";
import { GIntelligenceGateway } from "../../server/services/gIntelligenceGateway";
import { looksSpanish } from "../../server/services/streamingModelProvider";

let seq = 0;
async function ask(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
  seq += 1;
  return GIntelligenceGateway.processMessage({
    sessionId: `es-test-${seq}-${Date.now()}`,
    message,
    localOnly: true,
    history,
  });
}

const SPANISH_MARKERS = /[áéíóúñ¿¡]|\b(gracias|quiero|puedo|propiedad|opciones|usted)\b/i;

describe("Spanish detection", () => {
  it("detects Spanish and never fires on ordinary English", () => {
    expect(looksSpanish("Quiero vender mi casa en Wichita")).toBe(true);
    expect(looksSpanish("¿Cuánto vale mi casa?")).toBe(true);
    expect(looksSpanish("Hola, necesito ayuda con una propiedad")).toBe(true);
    expect(looksSpanish("I want to sell my house in Wichita")).toBe(false);
    expect(looksSpanish("What do you do?")).toBe(false);
    expect(looksSpanish("I am just exploring my options")).toBe(false);
    expect(looksSpanish("Tell me about the 70% rule and how a solo investor should use it")).toBe(false);
  });
});

describe("G answers Spanish in Spanish (local engine)", () => {
  it("greets in Spanish", async () => {
    const r = await ask("Hola");
    expect(r.provider).toBe("OCG_LOCAL_GREETING");
    expect(r.replyText).toContain("¡Hola!");
    expect(r.replyText).toContain("¿Qué le trae");
  });

  it("answers a Spanish seller in Spanish, one question at a time", async () => {
    const r = await ask("Quiero vender mi casa en Wichita, ¿cómo es el proceso?");
    expect(r.provider).toBe("OCG_LOCAL_ENGINE");
    expect(r.replyText).toMatch(SPANISH_MARKERS);
    expect(r.replyText).not.toContain("Absolutely. We can look at selling");
    expect((r.replyText.match(/\?/g) || []).length).toBe(1);
  });

  it("answers a Spanish inheritance question sensitively, in Spanish, and starts intake", async () => {
    const r = await ask("Heredé la casa de mi madre cuando falleció y no sé qué hacer");
    expect(r.replyText).toMatch(SPANISH_MARKERS);
    expect(r.replyText).toContain("sin apresurarle");
    expect(r.action?.actionId).toBe("INITIATE_SELLER_MODE");
  });

  it("answers a Spanish investor in Spanish", async () => {
    const r = await ask("Quiero invertir en propiedades, ¿me pueden ayudar con el financiamiento?");
    expect(r.replyText).toMatch(SPANISH_MARKERS);
    expect(r.replyText).toContain("evaluar una oportunidad");
  });

  it("explains what OCG does in Spanish", async () => {
    const r = await ask("¿Qué hacen ustedes? ¿Cuáles son sus servicios?");
    expect(r.replyText).toContain("The OC Group es una empresa de Wichita");
  });

  it("runs the 70% rule in Spanish with the visitor's own numbers", async () => {
    const r = await ask("Quiero calcular la regla del 70: ARV $300,000, reparaciones $40,000");
    expect(r.replyText).toContain("La regla del 70%");
    expect(r.replyText).toContain("$170,000 MAO");
    expect(r.action?.actionId).toBe("SET_CALCULATOR_VALUES");
  });

  it("asks for the numbers in Spanish instead of inventing them", async () => {
    const r = await ask("¿Cómo puedo calcular la regla del 70 para mi propiedad?");
    expect(r.replyText).toContain("Puedo calcular una oferta máxima preliminar");
    expect(r.action).toBeUndefined();
  });

  it("keeps a short Spanish follow-up inside the Spanish seller flow", async () => {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: "Quiero vender mi casa en Wichita" },
      { role: "assistant", content: "Claro que sí. Podemos revisar la opción de vender tal como está o hacer reparaciones primero, según lo que convenga a su tiempo. No necesita tener todos los detalles ahora. ¿Espera vender pronto o solo está explorando sus opciones?" },
    ];
    const r = await ask("Pronto", history);
    expect(r.replyText).toContain("el tiempo importa");
    expect(r.replyText).toContain("dirección de la propiedad");
  });

  it("does not drag an English conversation into Spanish", async () => {
    const r = await ask("I want to sell my house");
    expect(r.replyText).toContain("Absolutely");
    const follow = await ask("Soon", [
      { role: "user", content: "I want to sell my house" },
      { role: "assistant", content: r.replyText },
    ]);
    expect(follow.replyText).toContain("timing matters");
  });
});
