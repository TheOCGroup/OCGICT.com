import { Readable } from "stream";
import { ModelMessage, ModelToolDefinition, ModelCompletionOptions, ModelCompletionResponse, IModelProvider } from "./modelProvider.js";
import { OcgObservability } from "./observability.js";

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
    const sellerContext = /\b(sell|selling|homeowner|inherited|probate|my house|my property|estate)\b/i.test(priorConversation);
    const investorContext = /\b(invest|flip|rental|financing|lender|capital|buy and hold)\b/i.test(priorConversation);

    let content = "";
    let toolCalls: Array<{ name: string; arguments: Record<string, any> }> | undefined;

    // Use prior visitor intent for short follow-ups instead of restarting the pitch.
    const briefFollowup = lower.trim().replace(/[.!?]+$/g, "");
    if (sellerContext && /^(soon|as soon as possible|asap|right away|immediately|quickly|within a month|this month)$/.test(briefFollowup)) {
      content = "Got it, timing matters. We can start with a preliminary as-is review. What is the property address? If you prefer, you can begin on our Sell page.";
    } else if (sellerContext && /^(just looking|just exploring|exploring|not sure|no rush|later|not yet)$/.test(briefFollowup)) {
      content = "Of course. There's no pressure to decide today. Would it help more to compare selling as-is with repairing the property first?";
    } else if (sellerContext && /^(needs work|needs repairs|poor condition|as is|as-is|vacant|tenant occupied|owner occupied)$/.test(briefFollowup)) {
      content = "Thanks, that helps. Properties needing work can still be evaluated as-is. Is your main concern getting a fair price or avoiding the repairs and hassle?";
    } else if (investorContext && /^(flip|a flip|flipping|rental|a rental|buy and hold|hold)$/.test(briefFollowup)) {
      content = "Understood. Do you already have a specific property in mind, or would you like help understanding how OCG evaluates opportunities?";
    } else if (lower.includes("70%") || lower.includes("calculate") || lower.includes("mao") || (lower.includes("arv") && lower.includes("property"))) {
      // Never populate interactive underwriting with fabricated sample inputs.
      const hasArv = /(?:arv|after.repair.value)[^\n]{0,30}(?:\$?\d[\d,]*k?)/i.test(lastUserMsg);
      const hasRehab = /(?:rehab|repairs?|renovation)[^\n]{0,30}(?:\$?\d[\d,]*k?)/i.test(lastUserMsg);
      if (!hasArv || !hasRehab) {
        return { content: "I can calculate a preliminary maximum allowable offer using the 70% rule. What are your estimated after-repair value (ARV) and renovation budget? We should also account for closing, holding, selling, financing and contingency costs before treating the result as an offer.", provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      const parseAmount = (value: string): number => {
        const match = value.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i);
        return match ? Number(match[1].replace(/,/g, "")) * (match[2]?.toLowerCase() === "k" ? 1000 : match[2]?.toLowerCase() === "m" ? 1000000 : 1) : NaN;
      };
      const arvText = lastUserMsg.match(/(?:arv|after.repair.value)\s*(?:of|is|:|=)?\s*(\$?\s*[\d,.]+\s*[km]?)/i)?.[1];
      const rehabText = lastUserMsg.match(/(?:rehab|repairs?|renovation)\s*(?:budget|cost|estimate|of|is|:|=)?\s*(\$?\s*[\d,.]+\s*[km]?)/i)?.[1];
      const arv = parseAmount(arvText || "");
      const rehab = parseAmount(rehabText || "");
      if (!Number.isFinite(arv) || !Number.isFinite(rehab) || arv <= 0 || rehab < 0) {
        return { content: "Please provide the numbers like this: ARV $300,000, rehab $40,000. I won't assume values for your property.", provider: "OCG_LOCAL_ENGINE", model: "ocg-deterministic-v5", latencyMs: Date.now() - startTime };
      }
      const mao = Math.round(arv * 0.70) - rehab;
      content = `The 70% Rule establishes your acquisition boundary: MAO = (ARV × 70%) − Rehab Scope. On a $${arv.toLocaleString()} ARV with $${rehab.toLocaleString()} in repairs: ($${arv.toLocaleString()} × 0.70) − $${rehab.toLocaleString()} = $${mao.toLocaleString()} MAO. This is a screening calculation, not a final offer; separately estimate closing, holding, selling, financing and contingency costs.`;
      toolCalls = [
        {
          name: "set_calculator_values",
          arguments: { arv, rehab },
        },
      ];
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
    } else if (sellerContext && /(address|located|street|wichita|\d{2,6}\s+\w+|needs work|repairs|quickly|as.is|timeline)/i.test(lower)) {
      content = "Thanks for the property details. I can help outline the as-is sale process, renovation tradeoffs, and information needed for a preliminary evaluation. I cannot verify its condition, ownership or market value from this message alone. The next useful details are its general condition and when you hope to sell; you can also begin a property review on our Sell page.";
    } else if (investorContext && /(address|located|street|\d{2,6}\s+\w+|budget|numbers|scope|offer|analyze|next)/i.test(lower)) {
      content = "We can screen this opportunity using verified comparable sales, an itemized repair budget, and financing, closing, carrying and resale costs. I won't invent ARV or lender terms. What property address or financial figures do you already have?";
    } else if (/(sell|selling|cash offer|as.is|my house|my property|homeowner|tenants|vacant)/i.test(lower)) {
      content = "Absolutely. We can look at selling as-is or making repairs first, and figure out what fits your timeline. You don\u0027t need all the details right now. Are you hoping to sell soon, or just exploring your options?";
    } else if (/(investor|investing|first flip|flip|lender|finance|financing|buy and hold|capital)/i.test(lower)) {
      content = "We can help you evaluate a deal, check renovation costs and risks, and plan the next move. Are you looking at a particular property or still deciding what to invest in?";
    } else if (/(what do you do|what does.*(?:ocg|group).*do|what is ocg|who are you|services|how does.*work|curious|learn more|about.*group)/i.test(lower)) {
      content = "The OC Group is a Wichita-based real estate acquisition and renovation advisory business. We help property owners explore sale options and help investors evaluate deals, plan renovations, coordinate financing, and decide whether to renovate, resell, or hold. I am G, its AI guide. Are you here as a property owner, investor, or just exploring?";
    } else {
      content = "I am G, The OC Group's AI guide. I can help with selling a house, evaluating an investment, understanding repairs or financing, and learning about our services. What would you like to explore?";
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
