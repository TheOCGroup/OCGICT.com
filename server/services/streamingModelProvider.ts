import { Readable } from "stream";
import { ModelMessage, ModelToolDefinition, ModelCompletionOptions, ModelCompletionResponse, IModelProvider } from "./modelProvider.js";
import { OcgObservability } from "./observability.js";
import { analyzeSellerContext } from "../voice/sellerPolicy.js";
import { routeGeneralIntent, generalFallback, introAlreadyGiven } from "../voice/gIntent.js";
import { numberToWordsEN, numberToWordsES } from "../voice/gExpression.js";

export interface StreamingChunk {
  type: "token" | "tool_call" | "done" | "error";
  text?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  error?: string;
}

export interface IStreamingModelProvider extends IModelProvider {
  generateStream(options: ModelCompletionOptions): Promise<AsyncIterable<StreamingChunk>>;
}

/**
 * Enhanced Gemini Provider with Streaming and Uncertainty Handling
 */
export class EnhancedGeminiProvider implements IStreamingModelProvider {
  name = "Google Gemini Gateway";
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName = "gemini-2.5-flash") {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async generateCompletion(options: ModelCompletionOptions): Promise<ModelCompletionResponse> {
    const startTime = Date.now();
    const vertex = process.env.GEMINI_AUTH_MODE === "vertex";
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
    const region = process.env.GEMINI_VERTEX_REGION || "us-central1";
    if (vertex && (!project || !/^[a-z][a-z0-9-]{4,62}$/.test(project) || !/^[a-z0-9-]+$/.test(region))) {
      throw new Error("Vertex AI project or region is not configured");
    }
    const endpoint = vertex
      ? `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/${encodeURIComponent(this.modelName)}:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.modelName)}:generateContent`;

    const contents = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const systemInstruction = options.messages.find((m) => m.role === "system");

    const payload: any = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.35,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction.content }],
      };
    }

    if (options.tools && options.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: options.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    // Vertex uses the Cloud Run workload identity; no API key is stored or transmitted.
    let authHeaders: Record<string, string> = { "x-goog-api-key": this.apiKey };
    if (vertex) {
      const tokenResponse = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(3000),
      });
      if (!tokenResponse.ok) throw new Error("Cloud Run workload identity is unavailable");
      const token = await tokenResponse.json() as { access_token?: string };
      if (!token.access_token) throw new Error("Cloud Run workload identity token missing");
      authHeaders = { Authorization: `Bearer ${token.access_token}` };
    }
    // Limit provider latency so a stalled upstream service cannot tie up G indefinitely.
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Gemini model request failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p: any) => p.text);
    const funcPart = candidate?.content?.parts?.find((p: any) => p.functionCall);

    const toolCalls = funcPart
      ? [
          {
            name: funcPart.functionCall.name,
            arguments: funcPart.functionCall.args || {},
          },
        ]
      : undefined;

    return {
      content: textPart?.text || (funcPart ? "I can prepare that action for you. Please verify the information shown." : "I couldn't generate a useful response. Please try rephrasing your question."),
      toolCalls,
      provider: "Gemini",
      model: this.modelName,
      latencyMs: Date.now() - startTime,
    };
  }

  async generateStream(options: ModelCompletionOptions): Promise<AsyncIterable<StreamingChunk>> {
    const comp = await this.generateCompletion(options);
    async function* streamGen(): AsyncIterable<StreamingChunk> {
      const words = comp.content.split(" ");
      for (const word of words) {
        yield { type: "token", text: word + " " };
        await new Promise((r) => setTimeout(r, 20));
      }
      if (comp.toolCalls && comp.toolCalls.length > 0) {
        yield { type: "tool_call", toolCall: comp.toolCalls[0] };
      }
      yield { type: "done" };
    }
    return streamGen();
  }
}

const ES_STRONG = /(quiero vender|mi casa|heredé|herede|falleció|fallecio|cuánto|cuanto cuesta|necesito|gracias|hola|buenos días|buenas tardes|buenas noches|vender|propiedad|inversión|inversion|financiamiento|herencia)/i;
const ES_WORDS = /\b(el|la|los|las|una|uno|de|en|y|es|está|esta|mi|su|para|por|con|que|qué|cómo|cuándo|tengo|puedo|quiero|busco|vendo|compro|renta|reparaciones|pronto|seguro|opciones|proceso|precio|valor|ayuda|veces|hace)\b/gi;

/**
 * Conservative Spanish detector for the local engine: inverted
 * punctuation, a strong Spanish phrase, or at least three distinct
 * Spanish function words. Tuned to never misfire on ordinary English
 * (single shared words like "solo" or "como" are not signals).
 */
export function looksSpanish(text: string): boolean {
  if (/[¿¡]/.test(text)) return true;
  if (ES_STRONG.test(text)) return true;
  const hits = new Set((text.toLowerCase().match(ES_WORDS) || []).map((w) => w.trim()));
  return hits.size >= 3;
}

/**
 * Local Deterministic Provider with full Streaming & Action Emulation
 */
export class EnhancedLocalProvider implements IStreamingModelProvider {
  name = "OCG Local Intelligence Core";

  async generateCompletion(options: ModelCompletionOptions): Promise<ModelCompletionResponse> {
    const startTime = Date.now();
    const lastUserMsg = options.messages.filter((m) => m.role === "user").pop()?.content || "";
    const lower = lastUserMsg.toLowerCase();
    const priorConversation = options.messages.slice(0, -1).filter(m => m.role === "user").map(m => m.content.toLowerCase()).join(" ");
    const sellerContext = /\b(sell|selling|homeowner|inherited|probate|my house|my property|estate|vender|venta|herencia|heredé|herede|mi casa|propietario)\b/i.test(priorConversation);
    const investorContext = /\b(invest|flip|rental|financing|lender|capital|buy and hold|invertir|inversión|inversion|financiamiento|renta)\b/i.test(priorConversation);

    // Seller Trust Engine: emotional context, stated facts (corrections
    // win), and conversation stage for this turn, in either language.
    const histForCtx = options.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(0, -1)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const sctx = analyzeSellerContext(histForCtx, lastUserMsg, { spanish: looksSpanish(lastUserMsg) || looksSpanish(priorConversation) });

    // P0 repair: informational intents (fees, areas, process, human,
    // contact...) outrank the generic seller/investor branches — a
    // question about fees that mentions "mi casa" is a fees question.
    const giInfoEs = (() => { const g = routeGeneralIntent(lastUserMsg, { spanish: true }); return g && g.intent !== "sellerGeneric" && g.intent !== "investorGeneric" ? g : null; })();
    const giInfoEn = (() => { const g = routeGeneralIntent(lastUserMsg, { spanish: false }); return g && g.intent !== "sellerGeneric" && g.intent !== "investorGeneric" ? g : null; })();

    let content = "";
    let toolCalls: Array<{ name: string; arguments: Record<string, any> }> | undefined;

    // Use prior visitor intent for short follow-ups instead of restarting the pitch.
    const briefFollowup = lower.trim().replace(/[.!?]+$/g, "");

    // --- Spanish conversation path -------------------------------------
    // The local engine answers in the visitor's language. A Spanish turn
    // (or a short follow-up inside a Spanish conversation) is answered in
    // Spanish with the same core flows — never by falling through to the
    // English rules. Calculator requests fall through to the bilingual
    // MAO branch below so the math lives in exactly one place.
    const spanishTurn = looksSpanish(lastUserMsg)
      || (looksSpanish(priorConversation) && briefFollowup.split(/\s+/).filter(Boolean).length <= 5);
    const esCalcRequest = /(regla del 70|calcular|mao|70\s?%)/.test(lower);
    if (spanishTurn && !esCalcRequest) {
      // Seller Trust Engine — Spanish policy turns (corrections,
      // skepticism, comparison, evaluation, distress) are answered
      // before the general Spanish rules so they are never flattened
      // into a generic seller reply.
      if (sctx.isSeller && sctx.primary === "frustrated") {
        content = /\b(dejen de|no me llamen|no me escriban|no me interesa)\b/i.test(lower)
          ? "Entendido, y lamento la molestia. No insistiré más aquí. Si algún día necesita información, nuestra página de contacto es la vía directa."
          : "Lamento la frustración. Mantendré esto breve y responderé solo lo que me pregunte. ¿Qué le sería más útil ahora?";
        return { content, provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      if (sctx.isSeller && sctx.correction) {
        const val = sctx.correction.field === "bedrooms" ? `${numberToWordsES(Number(sctx.correction.value))} recámaras` : "ese dato";
        content = sctx.stage === "timeline"
          ? `Entendido — ${val}, ya lo actualicé. ¿Cuándo espera vender la propiedad?`
          : `Entendido — ${val}, ya lo actualicé. ¿Cómo describiría el estado de la propiedad?`;
        return { content, provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      if (sctx.isSeller && sctx.primary === "skeptical") {
        content = "Es una pregunta justa, y no tiene que confiar solo en mi palabra. Así trabajamos: revisamos ventas comparables recientes y las reparaciones que la propiedad necesita, le explicamos cada cifra, y cualquier oferta sería por escrito y sin obligación. También puede compararla con vender de la manera tradicional antes de decidir. ¿Le ayudaría que le explique cómo evaluamos una propiedad?";
        return { content, provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      if (sctx.isSeller && sctx.primary === "comparing") {
        content = "Vale la pena compararlo con honestidad. Vender con un agente puede lograr un precio más alto, sobre todo si la casa está en buen estado, pero suele implicar reparaciones, visitas, comisiones y esperar al comprador adecuado. Una venta directa evita las reparaciones y las visitas y puede cerrar más rápido, aunque el precio refleja esa comodidad. ¿Qué pesa más para usted: el precio más alto posible o una venta más sencilla y rápida?";
        return { content, provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      if (sctx.isSeller && sctx.primary === "curious") {
        content = "Así evaluamos una propiedad. Revisamos las ventas comparables recientes cerca de la casa, las reparaciones que necesita y los costos reales de comprar, mantener y revender. Con eso obtenemos un rango preliminar; una oferta formal solo llega después de una revisión real de nuestro equipo, por escrito y sin obligación. ¿Prefiere empezar por el estado de la propiedad o por su ubicación?";
        return { content, provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      if (sctx.isSeller && sctx.primary === "stressed_finances") {
        content = "Lamento que esté pasando por esto. No puedo prometerle un resultado, pero una venta directa tal como está a veces ayuda a detener los costos, y podemos explicarle los tiempos con honestidad. ¿Le ayudaría hablar de cómo podría verse una venta en su situación?";
        return { content, provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      // Word boundaries matter: "revender" (resell / fix-and-flip) must
      // NOT match the seller verb "vender" — flip phrasing is investor
      // intent. Flip markers are tested as investor signals below.
      const sellerNow = /(\bvender\b|\bvendemos\b|\bvendo\b|venta de mi|mi casa|propietario|heredé|herede|herencia|falleció|fallecio)/i.test(lower);
      const investorNow = /(invertir|inversión|inversion|financiamiento|préstamo|prestamo|renta|capital|revender|renovar|ganar dinero)/i.test(lower);
      if ((sellerContext || sellerNow) && /^(pronto|lo antes posible|cuanto antes|rápido|rapido|este mes|en un mes)$/.test(briefFollowup)) {
        content = "Perfecto, el tiempo importa. Podemos empezar con una revisión preliminar de la propiedad tal como está. ¿Cuál es la dirección de la propiedad? Si lo prefiere, puede comenzar en nuestra página de venta.";
      } else if ((sellerContext || sellerNow) && /^(solo estoy explorando|estoy explorando|no estoy seguro|no estoy segura|no tengo prisa|más adelante|mas adelante|todavía no|todavia no)$/.test(briefFollowup)) {
        content = "Claro, no hay ninguna prisa por decidir hoy. ¿Le ayudaría más comparar vender la propiedad tal como está o repararla primero?";
      } else if ((sellerContext || sellerNow) && /^(necesita reparaciones|necesita arreglos|mal estado|así como está|asi como esta|vacía|vacia|con inquilinos)$/.test(briefFollowup)) {
        content = "Gracias, eso ayuda. Una propiedad que necesita reparaciones también puede evaluarse tal como está. ¿Su mayor preocupación es obtener un precio justo o evitar las reparaciones y el trámite?";
      } else if (/(heredé|herede|herencia|falleció|fallecio|mi madre|mi padre)/i.test(lower)) {
        content = "Lo entiendo. Una propiedad heredada trae muchas decisiones a la vez. Podemos ayudarle a explorar una venta tal como está y los pasos siguientes, sin apresurarle. ¿Su prioridad es vender pronto o primero entender sus opciones?";
        toolCalls = [{ name: "activate_seller_intake", arguments: { sellerStep: 1 } }];
      } else if (giInfoEs) {
        content = giInfoEs.reply;
      } else if (investorNow && !sellerNow) {
        content = "Podemos ayudarle a evaluar una oportunidad, revisar costos de renovación y riesgos, y planear el siguiente paso. ¿Ya tiene una propiedad en mente o todavía está decidiendo en qué invertir?";
      } else if (sellerNow) {
        content = "Claro que sí. Podemos revisar la opción de vender tal como está o hacer reparaciones primero, según lo que convenga a su tiempo. No necesita tener todos los detalles ahora. ¿Espera vender pronto o solo está explorando sus opciones?";
      } else if (investorNow) {
        content = "Podemos ayudarle a evaluar una oportunidad, revisar costos de renovación y riesgos, y planear el siguiente paso. ¿Ya tiene una propiedad en mente o todavía está decidiendo en qué invertir?";
      } else if (/(qué hacen|que hacen|quiénes son|quienes son|servicios|qué es ocg|que es ocg|quién eres|quien eres)/i.test(lower)) {
        content = "The OC Group es una empresa de Wichita dedicada a la adquisición y renovación de propiedades y a la asesoría de inversión. Ayudamos a propietarios a explorar opciones de venta y a inversionistas a evaluar oportunidades, planear renovaciones, coordinar financiamiento y decidir entre renovar, revender o mantener. Soy G, su guía de IA. ¿Viene como propietario, inversionista o solo a explorar?";
      } else {
        // P0 repair: scored general-intent routing, then a fallback
        // that never repeats the introduction once it has been given.
        const gi = routeGeneralIntent(lastUserMsg, { spanish: true });
        content = gi
          ? gi.reply
          : generalFallback({ spanish: true, sellerContext, investorContext, introGiven: introAlreadyGiven(histForCtx) });
      }
      return {
        content,
        toolCalls,
        provider: "OCG_LOCAL_ENGINE",
        model: "ocg-deterministic-v5",
        latencyMs: Date.now() - startTime,
      };
    }
    if (sellerContext && /^(soon|as soon as possible|asap|right away|immediately|quickly|within a month|this month)$/.test(briefFollowup)) {
      content = "Got it, timing matters. We can start with a preliminary as-is review. What is the property address? If you prefer, you can begin on our Sell page.";
    } else if (sellerContext && /^(just looking|just exploring|exploring|not sure|no rush|later|not yet)$/.test(briefFollowup)) {
      content = "Of course. There's no pressure to decide today. Would it help more to compare selling as-is with repairing the property first?";
    } else if (sellerContext && /^(needs work|needs repairs|poor condition|as is|as-is|vacant|tenant occupied|owner occupied)$/.test(briefFollowup)) {
      content = "Thanks, that helps. Properties needing work can still be evaluated as-is. Is your main concern getting a fair price or avoiding the repairs and hassle?";
    } else if (investorContext && /^(flip|a flip|flipping|rental|a rental|buy and hold|hold)$/.test(briefFollowup)) {
      content = "Understood. Do you already have a specific property in mind, or would you like help understanding how OCG evaluates opportunities?";
    } else if (lower.includes("70%") || lower.includes("calculate") || lower.includes("calcular") || lower.includes("regla del 70") || lower.includes("mao") || (lower.includes("arv") && lower.includes("property"))) {
      // Never populate interactive underwriting with fabricated sample inputs.
      const hasArv = /(?:arv|after.repair.value|valor después de la reparación|valor tras la reparación|valor despues de la reparacion)[^\n]{0,30}(?:\$?\d[\d,]*k?)/i.test(lastUserMsg);
      const hasRehab = /(?:rehab|repairs?|renovation|reparaciones|rehabilitación|remodelación|reparacion)[^\n]{0,30}(?:\$?\d[\d,]*k?)/i.test(lastUserMsg);
      if (!hasArv || !hasRehab) {
        return { content: spanishTurn
          ? "Puedo calcular una oferta máxima preliminar con la regla del 70%. ¿Cuáles son el valor estimado después de la reparación (ARV) y el presupuesto de reparaciones? También debemos considerar los costos de cierre, mantenimiento, venta, financiamiento y contingencia antes de tratar el resultado como una oferta."
          : "I can calculate a preliminary maximum allowable offer using the 70% rule. What are your estimated after-repair value (ARV) and renovation budget? We should also account for closing, holding, selling, financing and contingency costs before treating the result as an offer.", provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      const parseAmount = (value: string): number => {
        const match = value.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i);
        return match ? Number(match[1].replace(/,/g, "")) * (match[2]?.toLowerCase() === "k" ? 1000 : match[2]?.toLowerCase() === "m" ? 1000000 : 1) : NaN;
      };
      const arvText = lastUserMsg.match(/(?:arv|after.repair.value|valor después de la reparación|valor tras la reparación|valor despues de la reparacion)\s*(?:of|is|de|:|=)?\s*(\$?\s*[\d,.]+\s*[km]?)/i)?.[1];
      const rehabText = lastUserMsg.match(/(?:rehab|repairs?|renovation|reparaciones|rehabilitación|remodelación|reparacion)\s*(?:budget|cost|estimate|presupuesto|of|is|de|:|=)?\s*(\$?\s*[\d,.]+\s*[km]?)/i)?.[1];
      const arv = parseAmount(arvText || "");
      const rehab = parseAmount(rehabText || "");
      if (!Number.isFinite(arv) || !Number.isFinite(rehab) || arv <= 0 || rehab < 0) {
        return { content: spanishTurn
          ? "Por favor comparta las cifras así: ARV $300,000, reparaciones $40,000. No asumiré valores para su propiedad."
          : "Please provide the numbers like this: ARV $300,000, rehab $40,000. I won't assume values for your property.", provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      const mao = Math.round(arv * 0.70) - rehab;
      content = spanishTurn
        ? `La regla del 70% establece su límite de adquisición: MAO = (ARV × 70%) − reparaciones. Con un ARV de $${arv.toLocaleString()} y $${rehab.toLocaleString()} en reparaciones: ($${arv.toLocaleString()} × 0.70) − $${rehab.toLocaleString()} = $${mao.toLocaleString()} MAO. Es un cálculo de evaluación preliminar, no una oferta final; estime por separado los costos de cierre, mantenimiento, venta, financiamiento y contingencia.`
        : `The 70% Rule establishes your acquisition boundary: MAO = (ARV × 70%) − Rehab Scope. On a $${arv.toLocaleString()} ARV with $${rehab.toLocaleString()} in repairs: ($${arv.toLocaleString()} × 0.70) − $${rehab.toLocaleString()} = $${mao.toLocaleString()} MAO. This is a screening calculation, not a final offer; separately estimate closing, holding, selling, financing and contingency costs.`;
      toolCalls = [
        {
          name: "set_calculator_values",
          arguments: { arv, rehab },
        },
      ];
    } else if (sctx.isSeller && sctx.primary === "frustrated") {
      // De-escalate, never defend. A stop request closes the conversation
      // without a question; general frustration gets brevity + one ask.
      content = /\b(stop|leave me alone|don'?t (call|contact|message)|not interested)\b/i.test(lower)
        ? "Understood, and I'm sorry for the frustration. I won't push anything here. If you ever want information later, our Contact page is the direct route."
        : "I'm sorry — I don't want to waste your time. I'll keep this brief and only answer what you ask. What would help most right now?";
    } else if (sctx.isSeller && sctx.correction) {
      // Natural correction: acknowledge the updated fact explicitly,
      // then continue with the stage's single question.
      const val = sctx.correction.field === "bedrooms"
        ? `${numberToWordsEN(Number(sctx.correction.value))} bedrooms`
        : sctx.correction.field === "timeline" ? "your updated timeline" : "that detail";
      content = sctx.stage === "timeline"
        ? `Got it — ${val}, updated. When are you hoping to sell?`
        : sctx.stage === "evaluation"
          ? `Got it — ${val}, updated. Would you like a quick walk-through of how we evaluate a property?`
          : `Got it — ${val}, updated. How would you describe the home's condition?`;
    } else if (sctx.isSeller && sctx.primary === "skeptical") {
      content = "That's a fair question, and you shouldn't have to take my word for anything. Here's how it works: we review recent comparable sales and the repairs the property needs, we explain every number we use, and any offer would be in writing with no obligation. You're free to compare it with listing the traditional way before deciding anything. Would it help if I walked through how we evaluate a property?";
    } else if (sctx.isSeller && sctx.primary === "comparing") {
      content = "It's worth comparing honestly. Listing with an agent can bring a higher price, especially for a home in good condition, but it usually means repairs, showings, commissions, and waiting for the right buyer. A direct sale skips the repairs and showings and can close faster, though the price reflects that convenience. Which matters more for you — the highest possible price, or a simpler, faster sale?";
    } else if (sctx.isSeller && sctx.primary === "curious") {
      content = "Here's how we evaluate a property. We look at recent comparable sales near the home, the repairs it needs, and the real costs of buying, holding, and reselling. That gives us a preliminary range — a formal offer only comes after a real review by our team, in writing, with no obligation. Would you like to start with the property's condition, or its location?";
    } else if (sctx.isSeller && sctx.primary === "stressed_finances") {
      content = "I'm sorry you're dealing with that. I can't promise an outcome, but a direct as-is sale is sometimes one way to stop the costs from growing, and we can explain the timeline honestly. Would it help to talk through what a sale could look like in your situation?";
    } else if (sctx.isSeller && sctx.primary === "attached") {
      content = "It sounds like this home carries a lot of history. There's no rush here — we can talk through what selling directly would look like, and you can take all the time you need with the decision. What part of the process would you like to understand first?";
    } else if (sctx.isSeller && sctx.primary === "hesitant") {
      content = "That's completely fine — most people start by just exploring. There's no obligation here, and no timeline you have to meet. Would it help to compare selling as-is with making repairs first?";
    } else if (sctx.isSeller && sctx.facts.bedrooms !== undefined && sctx.stage === "property" && !sctx.correction) {
      content = `Got it — a ${sctx.facts.bedrooms}-bedroom home. How would you describe its condition: move-in ready, or does it need some work?`;
    } else if (lower.includes("all my cash") || lower.includes("why wouldn't i") || lower.includes("all cash into")) {
      content = `OCG advises preserving liquid cash as strategic contingency armor. Deploying senior lender debt for purchase and construction draws protects you against unexpected material/permit delays and satisfies lender interest reserves.`;
    } else if (lower.includes("dscr") || lower.includes("rental")) {
      content = `DSCR loans evaluate property cash flow rather than personal W-2 income, typically requiring 1.20x-1.25x rent-to-debt coverage and a 20-25% equity down payment.`;
    } else if (lower.includes("not sure") || /\b(60,000|60k)\b/.test(lower)) {
      content = "Your appropriate cash reserve depends on the property, debt terms, holding period, and personal risk tolerance. I can compare investment strategies without assuming a fixed reserve or promising financing. Are you considering a flip or a rental?";
    } else if (lower.includes("passed away") || lower.includes("mother") || lower.includes("inherited") || lower.includes("probate")) {
      content = "I understand. An inherited property can bring a lot of decisions at once. We can help you explore an as-is sale and what happens next, without rushing you. Is your main priority selling soon, or understanding your options first?";
      toolCalls = [
        {
          name: "activate_seller_intake",
          arguments: { sellerStep: 1 },
        },
      ];
    } else if (lower.includes("college hill") || lower.includes("craftsman")) {
      content = `College Hill features historic Craftsman bungalows and Tudors from 1910-1940. Preserving cedar woodwork while updating mechanicals commands top neighborhood pricing.`;
      toolCalls = [
        {
          name: "load_property_case",
          arguments: { propertyId: "bungalow" },
        },
      ];
    } else if (lower.includes("crown heights") || lower.includes("ranch")) {
      content = `Crown Heights features 1950s-1960s brick ranches with solid construction. Limewashed brick and open-concept living expansions perform exceptionally well.`;
      toolCalls = [
        {
          name: "load_property_case",
          arguments: { propertyId: "ranch" },
        },
      ];
    } else if (lower.includes("delano") || lower.includes("cottage")) {
      content = `Historic Delano features 1920s worker cottages along West Douglas, delivering strong rental yield and entry-level buyer demand.`;
      toolCalls = [
        {
          name: "load_property_case",
          arguments: { propertyId: "delano" },
        },
      ];
    } else if (giInfoEn) {
      content = giInfoEn.reply;
    } else if (sellerContext && /(address|located|street|wichita|\d{2,6}\s+\w+|needs work|repairs|quickly|as.is|timeline)/i.test(lower)) {
      content = "Thanks for the property details. I can help outline the as-is sale process, renovation tradeoffs, and information needed for a preliminary evaluation. I cannot verify its condition, ownership or market value from this message alone. The next useful details are its general condition and when you hope to sell; you can also begin a property review on our Sell page.";
    } else if (investorContext && /(address|located|street|\d{2,6}\s+\w+|budget|numbers|scope|offer|analyze|next)/i.test(lower)) {
      content = "We can screen this opportunity using verified comparable sales, an itemized repair budget, and financing, closing, carrying and resale costs. I won't invent ARV or lender terms. What property address or financial figures do you already have?";
    } else {
      // P0 repair: the old tail was three brittle regexes over a
      // generic-introduction default — natural questions ("What
      // exactly do you guys do?", "Do you charge any fees?") all fell
      // through to the identical intro, repeatedly. Scored intent
      // routing answers the actual question; the fallback never
      // repeats the introduction once given.
      const gi = routeGeneralIntent(lastUserMsg, { spanish: false });
      content = gi
        ? gi.reply
        : generalFallback({ spanish: false, sellerContext, investorContext, introGiven: introAlreadyGiven(histForCtx) });
    }

    return {
      content,
      toolCalls,
      provider: "OCG_LOCAL_ENGINE",
      model: "ocg-deterministic-v5",
      latencyMs: Date.now() - startTime,
    };
  }

  async generateStream(options: ModelCompletionOptions): Promise<AsyncIterable<StreamingChunk>> {
    const comp = await this.generateCompletion(options);
    async function* streamGen(): AsyncIterable<StreamingChunk> {
      const words = comp.content.split(" ");
      for (const word of words) {
        yield { type: "token", text: word + " " };
        await new Promise((r) => setTimeout(r, 20));
      }
      if (comp.toolCalls && comp.toolCalls.length > 0) {
        yield { type: "tool_call", toolCall: comp.toolCalls[0] };
      }
      yield { type: "done" };
    }
    return streamGen();
  }
}

/**
 * Model Provider Factory supporting Environment Config
 */
export function getActiveStreamingModelProvider(): IStreamingModelProvider {
  if (process.env.GEMINI_AUTH_MODE === "vertex") {
    return new EnhancedGeminiProvider("", process.env.GEMINI_MODEL || "gemini-2.5-flash");
  }
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    return new EnhancedGeminiProvider(geminiKey, process.env.GEMINI_MODEL || "gemini-1.5-flash");
  }

  return new EnhancedLocalProvider();
}
