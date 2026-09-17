import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createZhihuGateway } from "@/lib/zhihu";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function resetZhihuSharedRuntimeForTest(): void {
  const runtime = (globalThis as typeof globalThis & {
    __xieyaoZhihuRuntime?: Record<string, unknown>;
  }).__xieyaoZhihuRuntime;
  if (!runtime) return;
  for (const key of Object.keys(runtime)) delete runtime[key];
}

describe("ZhihuGateway content capabilities", () => {
  it("loads normalized hot-list items through the official MCP endpoint", async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "xieyao-hot-list-test-"));
    const previousDbPath = process.env.XIEYAO_DB_PATH;
    process.env.XIEYAO_DB_PATH = path.join(tempDir, "xieyao.sqlite");
    resetZhihuSharedRuntimeForTest();

    const requests: Array<{ url: string; init?: RequestInit; rpc?: Record<string, unknown> }> = [];
    const encoder = new TextEncoder();
    let sseController: ReadableStreamDefaultController<Uint8Array> | null = null;

    try {
      const gateway = createZhihuGateway({
        accessSecret: "test-secret",
        now: () => 1_742_822_400_000,
        fetchImpl: async (input, init) => {
          const url = input.toString();
          const pathname = new URL(url).pathname;

          if (pathname === "/api/mcp/hot_list/v1/sse") {
            requests.push({ url, init });
            const stream = new ReadableStream<Uint8Array>({
              start(controller) {
                sseController = controller;
                controller.enqueue(encoder.encode(
                  "event: endpoint\ndata: /api/mcp/hot_list/v1/messages?sessionId=test\n\n",
                ));
              },
            });
            return new Response(stream, {
              status: 200,
              headers: { "content-type": "text/event-stream" },
            });
          }

          if (pathname === "/api/mcp/hot_list/v1/messages") {
            const rpc = JSON.parse(String(init?.body)) as Record<string, unknown>;
            requests.push({ url, init, rpc });
            const id = rpc.id as number;
            const method = rpc.method;
            const result = method === "tools/call"
              ? {
                  content: [{
                    type: "text",
                    text: [
                      "<hot_list>",
                      "<item><title>如何理解 AI Agent？</title><url>https://www.zhihu.com/question/123</url><thumbnail_url>https://picx.zhimg.com/cover.jpg</thumbnail_url><summary>问题摘要</summary></item>",
                      "<item><title>一篇文章</title><url>https://zhuanlan.zhihu.com/p/456</url><thumbnail_url></thumbnail_url><summary>文章摘要</summary></item>",
                      "</hot_list>",
                    ].join(""),
                  }],
                }
              : method === "tools/list"
                ? { tools: [{ name: "hot_list" }] }
                : { protocolVersion: "2024-11-05" };
            sseController?.enqueue(encoder.encode(
              `event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id, result })}\n\n`,
            ));
            if (method === "tools/call") sseController?.close();
            return new Response(null, { status: 200 });
          }

          throw new Error(`unexpected request: ${url}`);
        },
      });

      await expect(gateway.getHotList(10)).resolves.toEqual([
        {
          title: "如何理解 AI Agent？",
          url: "https://www.zhihu.com/question/123",
          thumbnailUrl: "https://picx.zhimg.com/cover.jpg",
          summary: "问题摘要",
        },
        {
          title: "一篇文章",
          url: "https://zhuanlan.zhihu.com/p/456",
          thumbnailUrl: "",
          summary: "文章摘要",
        },
      ]);

      expect(requests).toHaveLength(4);
      expect(new URL(requests[0]!.url).pathname).toBe("/api/mcp/hot_list/v1/sse");
      expect(new Headers(requests[0]!.init?.headers).get("authorization")).toBe("Bearer test-secret");

      const rpcRequests = requests.slice(1).map((request) => request.rpc);
      expect(rpcRequests.map((rpc) => rpc?.method)).toEqual(["initialize", "tools/list", "tools/call"]);
      expect(rpcRequests[2]?.params).toEqual({
        name: "hot_list",
        arguments: { limit: 30 },
      });
      for (const request of requests.slice(1)) {
        expect(new Headers(request.init?.headers).get("authorization")).toBe("Bearer test-secret");
      }
    } finally {
      resetZhihuSharedRuntimeForTest();
      if (previousDbPath === undefined) delete process.env.XIEYAO_DB_PATH;
      else process.env.XIEYAO_DB_PATH = previousDbPath;
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("loads answer summaries for a real question URL", async () => {
    let requestUrl = "";
    const gateway = createZhihuGateway({
      accessSecret: "test-secret",
      fetchImpl: async (input) => {
        requestUrl = input.toString();
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: {
            Items: [
              {
                ContentType: "answer",
                ContentToken: "456",
                Url: "https://www.zhihu.com/question/123/answer/456",
                Summary: "回答摘要",
              },
            ],
            Paging: { IsEnd: true, Totals: 1 },
          },
        });
      },
    });

    await expect(
      gateway.getQuestionAnswers("https://www.zhihu.com/question/123", 5),
    ).resolves.toEqual([
      {
        contentToken: "456",
        url: "https://www.zhihu.com/question/123/answer/456",
        summary: "回答摘要",
      },
    ]);

    const url = new URL(requestUrl);
    expect(url.pathname).toBe("/api/v1/content/question_answers");
    expect(url.searchParams.get("QuestionUrl")).toBe("https://www.zhihu.com/question/123");
    expect(url.searchParams.get("Limit")).toBe("5");
    expect(url.searchParams.get("Offset")).toBe("0");
  });

  it("uses the official non-streaming Zhida contract", async () => {
    let requestInit: RequestInit | undefined;
    let requestUrl = "";
    const gateway = createZhihuGateway({
      accessSecret: "test-secret",
      now: () => 1_742_822_400_000,
      fetchImpl: async (input, init) => {
        requestUrl = input.toString();
        requestInit = init;
        return jsonResponse({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1740470400,
          model: "zhida-fast-1p5",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                reasoning_content: "简短分析",
                content: "这是直答结果。",
              },
              finish_reason: "stop",
            },
          ],
        });
      },
    });

    const result = await gateway.askZhida({
      model: "zhida-fast-1p5",
      messages: [{ role: "user", content: "如何理解 AI Agent？" }],
    });

    expect(result).toEqual({
      model: "zhida-fast-1p5",
      content: "这是直答结果。",
      reasoningContent: "简短分析",
      finishReason: "stop",
    });
    expect(requestUrl).toBe("https://developer.zhihu.com/v1/chat/completions");
    expect(requestInit?.method).toBe("POST");
    const headers = new Headers(requestInit?.headers);
    expect(headers.get("authorization")).toBe("Bearer test-secret");
    expect(headers.get("x-request-timestamp")).toBe("1742822400");
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      model: "zhida-fast-1p5",
      messages: [{ role: "user", content: "如何理解 AI Agent？" }],
      stream: false,
    });
  });
});
