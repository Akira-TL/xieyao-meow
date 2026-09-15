export const DEEPSEEK_FLASH_MODEL = "deepseek-flash" as const;

export interface NarrativeGenerationRequest {
  prompt: string;
  maxTokens?: number;
}

export interface NarrativeGenerationResult {
  model: typeof DEEPSEEK_FLASH_MODEL;
  content: string;
}

export interface PersonaNarrativeGateway {
  generateJson(input: NarrativeGenerationRequest): Promise<NarrativeGenerationResult>;
}

type FetchLike = typeof fetch;

interface DeepSeekChatResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export class DeepSeekFlashClient implements PersonaNarrativeGateway {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    if (!apiKey.trim()) throw new Error("DEEPSEEK_API_KEY is required");
  }

  async generateJson(input: NarrativeGenerationRequest): Promise<NarrativeGenerationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await this.fetchImpl("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: DEEPSEEK_FLASH_MODEL,
          messages: [{ role: "user", content: input.prompt }],
          response_format: { type: "json_object" },
          max_tokens: Math.max(64, Math.min(512, input.maxTokens ?? 220)),
          thinking: { type: "disabled" },
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`DeepSeek HTTP ${response.status}`);
      }
      const payload = (await response.json()) as DeepSeekChatResponse;
      const content = payload.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("DeepSeek returned empty content");
      return { model: DEEPSEEK_FLASH_MODEL, content };
    } finally {
      clearTimeout(timeout);
    }
  }
}

let client: DeepSeekFlashClient | undefined;

export function createDeepSeekFlashClientFromEnv(): DeepSeekFlashClient {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");
  client ??= new DeepSeekFlashClient(apiKey);
  return client;
}

export function tryCreateDeepSeekFlashClientFromEnv(): DeepSeekFlashClient | null {
  try {
    return createDeepSeekFlashClientFromEnv();
  } catch {
    return null;
  }
}
