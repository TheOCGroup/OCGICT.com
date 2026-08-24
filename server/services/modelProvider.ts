import { EnhancedGeminiProvider, EnhancedLocalProvider } from "./streamingModelProvider";

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
 * Model Provider Factory
 */
export function getActiveModelProvider(): IModelProvider {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && geminiKey.trim() !== "") {
    return new EnhancedGeminiProvider(geminiKey, process.env.GEMINI_MODEL || "gemini-2.5-flash");
  }

  // Graceful fallback to OCG local engine
  return new EnhancedLocalProvider();
}
