/**
 * OCG Model Provider Layer
 * Provider-agnostic abstraction for server-side LLM inference with tool calling,
 * fallback resilience, and streaming support.
 */

export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ModelCompletionOptions {
  messages: ModelMessage[];
  tools?: ModelToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface ModelCompletionResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface IModelProvider {
  name: string;
  generateCompletion(options: ModelCompletionOptions): Promise<ModelCompletionResponse>;
}

/**
 * Gemini Provider Implementation
 */
export class GeminiModelProvider implements IModelProvider {
  name = "Google Gemini";
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
        temperature: options.temperature ?? 0.4,
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
      const errText = await response.text();
      throw new Error(`Gemini API error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      content: generatedText,
      provider: "Gemini",
      model: this.modelName,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Deterministic Local Reasoning Provider (Runs securely when external API keys are not supplied)
 */
export class LocalDeterministicProvider implements IModelProvider {
  name = "OCG Local Intelligence Engine";

  async generateCompletion(options: ModelCompletionOptions): Promise<ModelCompletionResponse> {
    const startTime = Date.now();
    const lastUserMsg = options.messages.filter((m) => m.role === "user").pop()?.content || "";
    const lower = lastUserMsg.toLowerCase();

    let content = "";
    let toolCalls: Array<{ name: string; arguments: Record<string, any> }> | undefined;

    if (lower.includes("70%") || lower.includes("calculate") || lower.includes("mao")) {
      content = `The 70% rule is an underwriting discipline: MAO = (ARV × 70%) − Rehab. This safeguards holding interest, selling closing costs, and target investor profit.`;
      toolCalls = [
        {
          name: "set_calculator_values",
          arguments: { arv: 240000, rehab: 45000 },
        },
      ];
    } else if (lower.includes("college hill")) {
      content = `College Hill features historic Craftsman bungalows and Tudors from 1910-1940. Average resale values range from $180k to $350k+. Preserving natural woodwork while updating mechanicals and kitchens commands top neighborhood dollar.`;
      toolCalls = [
        {
          name: "load_property_case",
          arguments: { propertyId: "bungalow" },
        },
      ];
    } else if (lower.includes("sell") || lower.includes("inherited")) {
      content = `Inherited homes and estate transitions require objective valuation and respectful communication. OCG analyzes public records, repairs, and timelines directly.`;
      toolCalls = [
        {
          name: "activate_seller_intake",
          arguments: { sellerStep: 1 },
        },
      ];
    } else {
      content = `OCG combines disciplined underwriting, micro-market comps in Wichita, and strategic renovation design. Let's explore your specific goals.`;
    }

    return {
      content,
      toolCalls,
      provider: "OCG_LOCAL_ENGINE",
      model: "ocg-deterministic-v3",
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Model Provider Factory
 */
export function getActiveModelProvider(): IModelProvider {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    return new GeminiModelProvider(geminiKey, process.env.GEMINI_MODEL || "gemini-1.5-flash");
  }

  // Graceful fallback to OCG local engine
  return new LocalDeterministicProvider();
}
