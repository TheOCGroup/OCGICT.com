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
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

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

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error [${response.status}]: ${errText}`);
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
      content: textPart?.text || (funcPart ? "Executing requested action on the OCG platform..." : ""),
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

    let content = "";
    let toolCalls: Array<{ name: string; arguments: Record<string, any> }> | undefined;

    if (lower.includes("70%") || lower.includes("calculate") || lower.includes("mao") || lower.includes("repairs") || (lower.includes("arv") && lower.includes("property"))) {
      let arv = 240000;
      let rehab = 45000;

      if (lower.includes("300k") || lower.includes("300,000") || lower.includes("300000")) arv = 300000;
      else if (lower.includes("250k") || lower.includes("250,000")) arv = 250000;
      else if (lower.includes("200k") || lower.includes("200,000")) arv = 200000;

      if (lower.includes("55k") || lower.includes("55,000") || lower.includes("55000")) rehab = 55000;
      else if (lower.includes("50k") || lower.includes("50,000")) rehab = 50000;
      else if (lower.includes("40k") || lower.includes("40,000")) rehab = 40000;

      const mao = Math.round(arv * 0.70) - rehab;
      content = `The 70% Rule establishes your acquisition boundary: MAO = (ARV × 70%) − Rehab Scope. On a $${arv.toLocaleString()} ARV with $${rehab.toLocaleString()} in repairs: ($${arv.toLocaleString()} × 0.70) − $${rehab.toLocaleString()} = $${mao.toLocaleString()} MAO. This preserves an equity buffer for holding interest and transaction fees.`;
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
    } else if (lower.includes("60,000") || lower.includes("60k") || lower.includes("not sure")) {
      content = `Having $60,000 gives you strong Wichita leverage, but you should never deploy 100% of it into your first deal. We recommend reserving $20k+ as emergency defense while exploring BRRRR or leveraged flips.`;
    } else if (lower.includes("passed away") || lower.includes("mother") || lower.includes("inherited") || lower.includes("probate")) {
      content = `Navigating an inherited home requires transparent, compassionate support. OCG evaluates properties directly as-is with zero wholesaler commissions and flexible closing dates.`;
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
    } else {
      content = `OCG combines disciplined underwriting, micro-market comps in Wichita, and strategic renovation design. Tell me your specific goals or property questions.`;
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
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    return new EnhancedGeminiProvider(geminiKey, process.env.GEMINI_MODEL || "gemini-1.5-flash");
  }

  return new EnhancedLocalProvider();
}
