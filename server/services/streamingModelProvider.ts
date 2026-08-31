import { ModelCompletionOptions, ModelCompletionResponse, IModelProvider } from "./modelProvider.js";

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

function parseMoneyAfterLabel(message: string, labels: string[]): number | undefined {
  for (const label of labels) {
    const expression = new RegExp(`\\b${label}\\b\\s*(?:budget|scope|cost|of|is|:|=)?\\s*\\$?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(k|m)?\\b`, "i");
    const match = message.match(expression);
    if (!match) continue;

    let value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (match[2]?.toLowerCase() === "k") value *= 1_000;
    if (match[2]?.toLowerCase() === "m") value *= 1_000_000;
    return value;
  }
  return undefined;
}

function parseExplicitLiquidity(message: string): number | undefined {
  const patterns = [
    /(?:have|capital|cash|liquidity|available|budget)\s*(?:of|is|:)?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\b/i,
    /\$\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:in\s+)?(?:cash|capital|liquidity|available)?/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;
    let value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (match[2]?.toLowerCase() === "k") value *= 1_000;
    if (match[2]?.toLowerCase() === "m") value *= 1_000_000;
    return value;
  }
  return undefined;
}

/**
 * Gemini provider used when an approved API key is present.
 */
export class EnhancedGeminiProvider implements IStreamingModelProvider {
  name = "Google Gemini Gateway";

  constructor(
    private apiKey: string,
    private modelName = "gemini-2.5-flash",
  ) {}

  async generateCompletion(options: ModelCompletionOptions): Promise<ModelCompletionResponse> {
    const startTime = Date.now();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

    const contents = options.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const systemInstruction = options.messages.find((message) => message.role === "system");
    const payload: any = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.35,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    }

    if (options.tools?.length) {
      payload.tools = [{
        functionDeclarations: options.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        })),
      }];
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Do not echo provider response bodies: they can contain implementation
      // details or other material that should not be surfaced to site visitors.
      throw new Error(`Gemini provider unavailable [${response.status}]`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((part: any) => part.text);
    const functionPart = candidate?.content?.parts?.find((part: any) => part.functionCall);
    const toolCalls = functionPart
      ? [{ name: functionPart.functionCall.name, arguments: functionPart.functionCall.args || {} }]
      : undefined;

    return {
      content: textPart?.text || (functionPart ? "I can open the matching OCG website tool for you." : ""),
      toolCalls,
      provider: "Gemini",
      model: this.modelName,
      latencyMs: Date.now() - startTime,
    };
  }

  async generateStream(options: ModelCompletionOptions): Promise<AsyncIterable<StreamingChunk>> {
    const completion = await this.generateCompletion(options);
    async function* stream(): AsyncIterable<StreamingChunk> {
      for (const word of completion.content.split(" ")) {
        yield { type: "token", text: `${word} ` };
      }
      if (completion.toolCalls?.length) {
        yield { type: "tool_call", toolCall: completion.toolCalls[0] };
      }
      yield { type: "done" };
    }
    return stream();
  }
}

/**
 * Evidence-safe deterministic fallback. It provides useful routing and formulas
 * without manufacturing property, market, financing, reserve, or valuation data.
 */
export class EnhancedLocalProvider implements IStreamingModelProvider {
  name = "OCG Local Intelligence Core";

  async generateCompletion(options: ModelCompletionOptions): Promise<ModelCompletionResponse> {
    const startTime = Date.now();
    const lastUserMessage = options.messages.filter((message) => message.role === "user").pop()?.content || "";
    const lower = lastUserMessage.toLowerCase();

    let content: string;
    let toolCalls: Array<{ name: string; arguments: Record<string, any> }> | undefined;

    const arv = parseMoneyAfterLabel(lastUserMessage, ["arv"]);
    const rehab = parseMoneyAfterLabel(lastUserMessage, ["rehab", "repairs", "renovation"]);
    const isMaoQuestion = lower.includes("70%") || lower.includes("calculate") || lower.includes("mao") || lower.includes("arv");

    if (isMaoQuestion) {
      if (arv !== undefined && rehab !== undefined) {
        const mao = Math.max(0, Math.round(arv * 0.70 - rehab));
        content = `Using only the assumptions you supplied: heuristic MAO = (ARV × 70%) − rehab = ($${arv.toLocaleString()} × 0.70) − $${rehab.toLocaleString()} = $${mao.toLocaleString()}. This is a screening heuristic, not a verified property value or guaranteed purchase price; financing, carry, transaction, contingency, and exit costs still need a full deal model.`;
        toolCalls = [{ name: "set_calculator_values", arguments: { arv, rehab } }];
      } else {
        const missing = [arv === undefined ? "ARV" : null, rehab === undefined ? "rehab budget" : null].filter(Boolean).join(" and ");
        content = `I can calculate the 70% screening heuristic, but I will not invent the ${missing}. Give me the ${missing} you want to assume and I’ll show the math.`;
      }
    } else if (lower.includes("all my cash") || lower.includes("all cash into") || lower.includes("use all") && lower.includes("cash")) {
      content = "Putting all available cash into an acquisition can leave too little liquidity for contingencies, carrying costs, lender reserves, or schedule overruns. OCG compares cash and financing structures using the actual deal and lender terms before deciding how much liquidity to commit.";
    } else if (lower.includes("dscr")) {
      content = "DSCR is a debt-service coverage test. I need the qualifying rent or net operating income basis and the actual debt-service inputs before I can calculate it, and the acceptable threshold depends on the specific lender program. I will not assume either.";
    } else if (lower.includes("rental") || lower.includes("buy and hold") || lower.includes("buy & hold") || lower.includes("brrrr")) {
      content = "For a hold or BRRRR decision, start with property-specific rent, operating expenses, renovation scope, reserves, acquisition terms, and refinance/debt-service assumptions. Give me the inputs you already have and I’ll identify what is still missing before we model the deal.";
    } else if (lower.includes("capital") || lower.includes("cash") || lower.includes("liquidity")) {
      const liquidity = parseExplicitLiquidity(lastUserMessage);
      content = liquidity
        ? `You stated approximately $${Math.round(liquidity).toLocaleString()} of available liquidity. I can use that as a user-provided input, but I will not assume how much should be invested or reserved until we know the property, strategy, financing, carry, and contingency requirements.`
        : "Tell me the amount of liquidity you want to model and the strategy you are considering. I’ll treat your number as a user-provided input and keep reserves, leverage, and deal economics separate rather than inventing a recommendation.";
    } else if (lower.includes("passed away") || lower.includes("inherited") || lower.includes("probate") || lower.includes("estate")) {
      content = "For an inherited or estate property, OCG can begin with the address and your known situation. Any property value or offer remains preliminary until property data, condition, title, and authority to sell are verified.";
      toolCalls = [{ name: "activate_seller_intake", arguments: { sellerStep: 1 } }];
    } else if (lower.includes("sell") || lower.includes("seller") || lower.includes("my house") || lower.includes("my property")) {
      content = "If you are considering selling a Wichita property, start with the address. OCG will use verified information where available and route the property to human review when the evidence is not strong enough for a responsible preliminary offer.";
      toolCalls = [{ name: "activate_seller_intake", arguments: { sellerStep: 1 } }];
    } else if (lower.includes("college hill") || lower.includes("craftsman")) {
      content = "College Hill includes a substantial stock of older character homes, including Craftsman-era properties. For a specific property, I would still need verified property facts, condition, and current comparable-sale evidence before making any valuation or renovation-return claim.";
      toolCalls = [{ name: "load_property_case", arguments: { propertyId: "bungalow" } }];
    } else if (lower.includes("crown heights") || lower.includes("ranch")) {
      content = "Crown Heights includes many mid-century residential properties. For a specific investment decision, I would separate architectural context from verified property condition, current comps, renovation scope, and full deal economics.";
      toolCalls = [{ name: "load_property_case", arguments: { propertyId: "ranch" } }];
    } else if (lower.includes("delano")) {
      content = "Delano has a mix of older residential housing and strong local identity. I can discuss strategy at a general level, but I will not claim current rent, resale demand, comps, or returns without verified property and market inputs.";
    } else {
      content = "I’m G, OCG’s real estate intelligence guide. Give me a Wichita property, a seller situation, or an investment strategy you are considering. I’ll separate what is known from what still needs verification and help you choose the next step.";
    }

    return {
      content,
      toolCalls,
      provider: "OCG_LOCAL_ENGINE",
      model: "ocg-deterministic-v6-evidence-safe",
      latencyMs: Date.now() - startTime,
    };
  }

  async generateStream(options: ModelCompletionOptions): Promise<AsyncIterable<StreamingChunk>> {
    const completion = await this.generateCompletion(options);
    async function* stream(): AsyncIterable<StreamingChunk> {
      for (const word of completion.content.split(" ")) {
        yield { type: "token", text: `${word} ` };
      }
      if (completion.toolCalls?.length) {
        yield { type: "tool_call", toolCall: completion.toolCalls[0] };
      }
      yield { type: "done" };
    }
    return stream();
  }
}

export function getActiveStreamingModelProvider(): IStreamingModelProvider {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey?.trim()) {
    return new EnhancedGeminiProvider(geminiKey, process.env.GEMINI_MODEL || "gemini-2.5-flash");
  }

  return new EnhancedLocalProvider();
}
