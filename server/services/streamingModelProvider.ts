import { Readable } from "stream";
import { ModelMessage, ModelToolDefinition, ModelCompletionOptions, ModelCompletionResponse, IModelProvider } from "./modelProvider";
import { OcgObservability } from "./observability";

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

  constructor(apiKey: string, modelName = "gemini-1.5-flash") {
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

    // Add function declarations if tools are provided
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
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:streamGenerateContent?key=${this.apiKey}`;

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

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Streaming Error [${response.status}]: ${err}`);
    }

    async function* streamGenerator(): AsyncIterable<StreamingChunk> {
      // Stream JSON parsing from SSE / REST stream chunks
      const reader = (response.body as any)?.getReader();
      if (!reader) {
        yield { type: "done" };
        return;
      }

      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          yield { type: "token", text: chunkStr };
        }
      } finally {
        yield { type: "done" };
      }
    }

    return streamGenerator();
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

    if (lower.includes("70%") || lower.includes("calculate") || lower.includes("mao")) {
      content = `The 70% Rule establishes your acquisition boundary: MAO = (ARV × 70%) − Rehab. This safeguards holding costs and shields your operating margin.`;
      toolCalls = [
        {
          name: "set_calculator_values",
          arguments: { arv: 240000, rehab: 45000 },
        },
      ];
    } else if (lower.includes("college hill") || lower.includes("craftsman")) {
      content = `College Hill features historic Craftsman bungalows and Tudors from 1910-1940. Preserving cedar architectural woodwork while updating mechanicals and kitchens commands top neighborhood pricing.`;
      toolCalls = [
        {
          name: "load_property_case",
          arguments: { propertyId: "bungalow" },
        },
      ];
    } else if (lower.includes("crown heights") || lower.includes("ranch")) {
      content = `Crown Heights features 1950s-1960s brick ranches with solid construction. Limewashed brick, modern horizontal slats, and primary suite expansions perform exceptionally well.`;
      toolCalls = [
        {
          name: "load_property_case",
          arguments: { propertyId: "ranch" },
        },
      ];
    } else if (lower.includes("sell") || lower.includes("inherited") || lower.includes("probate")) {
      content = `Inherited homes and estate transitions require objective property review and respectful communication. OCG analyzes public records, repairs, and timelines directly.`;
      toolCalls = [
        {
          name: "activate_seller_intake",
          arguments: { sellerStep: 1 },
        },
      ];
    } else if (lower.includes("invest") || lower.includes("flip") || lower.includes("brrrr")) {
      content = `OCG guides investors across Fix & Flip (cash creation + lender-funded rehab) and BRRRR (equity recycling into DSCR debt). Let's evaluate your personal liquidity tier.`;
      toolCalls = [
        {
          name: "navigate",
          arguments: { path: "/invest" },
        },
      ];
    } else {
      content = `OCG combines disciplined underwriting, micro-market comps in Wichita, and strategic renovation design. Tell me your specific goals or property questions.`;
    }

    return {
      content,
      toolCalls,
      provider: "OCG_LOCAL_ENGINE",
      model: "ocg-deterministic-v4",
      latencyMs: Date.now() - startTime,
    };
  }

  async generateStream(options: ModelCompletionOptions): Promise<AsyncIterable<StreamingChunk>> {
    const comp = await this.generateCompletion(options);
    async function* streamGen(): AsyncIterable<StreamingChunk> {
      const words = comp.content.split(" ");
      for (const word of words) {
        yield { type: "token", text: word + " " };
        await new Promise((r) => setTimeout(r, 25));
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
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    return new EnhancedGeminiProvider(geminiKey, process.env.GEMINI_MODEL || "gemini-1.5-flash");
  }

  // Graceful fallback to local engine
  return new EnhancedLocalProvider();
}
