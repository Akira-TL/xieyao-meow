import { describe, expect, it, vi } from "vitest";

import { DEEPSEEK_FLASH_MODEL, DeepSeekFlashClient } from "@/lib/narrative/deepseek";

describe("DeepSeekFlashClient", () => {
  it("always uses Flash with thinking explicitly disabled and JSON output", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.model).toBe(DEEPSEEK_FLASH_MODEL);
      expect(body.thinking).toEqual({ type: "disabled" });
      expect(body.response_format).toEqual({ type: "json_object" });
      expect(body.stream).toBe(false);
      expect(body.max_tokens).toBe(180);
      return new Response(JSON.stringify({
        model: DEEPSEEK_FLASH_MODEL,
        choices: [{ message: { content: '{"headline":"短句"}' } }],
      }), { status: 200 });
    });
    const client = new DeepSeekFlashClient("test-key", fetchImpl as typeof fetch);

    await expect(client.generateJson({ prompt: "只输出 JSON", maxTokens: 180 })).resolves.toEqual({
      model: DEEPSEEK_FLASH_MODEL,
      content: '{"headline":"短句"}',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects empty API keys before issuing a request", () => {
    expect(() => new DeepSeekFlashClient("   ")).toThrow("DEEPSEEK_API_KEY is required");
  });
});
