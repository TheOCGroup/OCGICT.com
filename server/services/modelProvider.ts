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
 *
 * Live Gemini is activated only when BOTH a server-side key and an explicit
 * GEMINI_MODEL are configured. This prevents an outdated hard-coded model
 * name from silently becoming production behavior as provider catalogs evolve.
 * Cloud configuration is intentionally handled outside this code path.
 */
export function getActiveModelProvider(): IModelProvider {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL;

  if (geminiKey?.trim() && geminiModel?.trim()) {
    return new EnhancedGeminiProvider(geminiKey, geminiModel);
  }

  return new EnhancedLocalProvider();
}
