import { describe, expect, it } from "vitest";

import { createZhihuGateway } from "@/lib/zhihu";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("ZhihuGateway content capabilities", () => {
  it("loads normalized hot-list items from the official endpoint", async () => {
    let requestUrl = "";
    let requestHeaders = new Headers();
    const gateway = createZhihuGateway({
      accessSecret: "test-secret",
      now: () => 1_742_822_400_000,
      fetchImpl: async (input, init) => {
        requestUrl = input.toString();
        requestHeaders = new Headers(init?.headers);
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: {
            Total: 2,
            Items: [
              {
                Title: "如何理解 AI Agent？",
                Url: "https://www.zhihu.com/question/123",
                ThumbnailUrl: "https://picx.zhimg.com/cover.jpg",
                Summary: "问题摘要",
              },
              {
                Title: "一篇文章",
                Url: "https://zhuanlan.zhihu.com/p/456",
                ThumbnailUrl: "",
                Summary: "文章摘要",
              },
            ],
          },
        });
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

    const url = new URL(requestUrl);
    expect(url.pathname).toBe("/api/v1/content/hot_list");
    expect(url.searchParams.get("Limit")).toBe("10");
    expect(requestHeaders.get("authorization")).toBe("Bearer test-secret");
    expect(requestHeaders.get("x-request-timestamp")).toBe("1742822400");
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
