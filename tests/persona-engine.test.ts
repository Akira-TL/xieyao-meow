import { describe, expect, it } from "vitest";

import { buildComposition, buildPersona } from "@/lib/persona";
import type { UserProfile } from "@/lib/zhihu";

const HOUR = 60 * 60;

function atChinaHour(hour: number): number {
  const baseUtc = Date.UTC(2026, 8, 12, 0, 0, 0) / 1000;
  return baseUtc + (hour - 8) * HOUR;
}

const profile: UserProfile = {
  fetchedAt: atChinaHour(12),
  contents: [
    {
      contentType: "answer",
      url: "https://www.zhihu.com/question/1/answer/2",
      createdAt: atChinaHour(23),
      likeCount: 42,
      commentCount: 8,
      favoriteCount: 15,
      title: "AI Agent 的工程化到底难在哪里？",
      summary: "从模型调用、工具协议、上下文管理到可观测性，Agent 工程真正困难的是把不稳定的智能行为约束到可靠的软件系统里。",
    },
    {
      contentType: "article",
      url: "https://zhuanlan.zhihu.com/p/3",
      createdAt: atChinaHour(1),
      likeCount: 18,
      commentCount: 2,
      favoriteCount: 9,
      title: "MCP 与开发者工具的一些实践",
      summary: "记录本地开发工具、API、MCP 和自动化工作流的实践。",
    },
  ],
  followees: [
    {
      fullname: "示例开发者",
      urlToken: "example",
      url: "https://www.zhihu.com/people/example",
      avatarUrl: "https://picx.zhimg.com/example.jpg",
      headline: "AI Infra / Agent / 开发者工具",
      gender: 0,
      followerCount: 1000,
    },
  ],
  collections: [
    {
      contentType: "article",
      url: "https://zhuanlan.zhihu.com/p/4",
      createdAt: atChinaHour(22),
      favTime: atChinaHour(23),
      likeCount: 100,
      commentCount: 20,
      favoriteCount: 80,
      title: "如何搭建可靠的 AI Agent？",
      summary: "Agent、LLM、MCP、RAG、开发者工具与工程实践。",
      favlists: [
        {
          urlToken: "123",
          title: "AI 与开发工具",
          url: "https://www.zhihu.com/collection/123",
        },
      ],
    },
  ],
  favlists: [
    {
      urlToken: "123",
      url: "https://www.zhihu.com/collection/123",
      title: "AI 与开发工具",
      description: "大模型、Agent、MCP、编程与软件工程",
      isPublic: true,
    },
    {
      urlToken: "456",
      url: "https://www.zhihu.com/collection/456",
      title: "猫猫",
      description: "宠物、猫咪与养猫",
      isPublic: true,
    },
  ],
};

describe("PersonaEngine", () => {
  it("turns stable Zhihu signals into a structured composition", () => {
    const composition = buildComposition(profile);

    expect(composition.primaryInterest).toBe("AI 与数码");
    expect(composition.interests[0]?.name).toBe("AI 与数码");
    expect(composition.interests.some((item) => item.name === "宠物")).toBe(true);
    expect(composition.chronotype).toBe("夜猫子");
    expect(composition.sourceCounts).toEqual({
      contents: 2,
      followees: 1,
      collections: 1,
      favlists: 2,
    });
  });

  it("deterministically hatches a persona from the composition", () => {
    const composition = buildComposition(profile);
    const persona = buildPersona(composition);

    expect(persona.species).toBe("英短");
    expect(persona.appearance).toContain("圆框眼镜");
    expect(persona.personality).toContain("工程脑");
    expect(persona.catchphrase.length).toBeGreaterThan(5);
    expect(persona.interests[0]).toBe("AI 与数码");
    expect(persona.answerStyle.length).toBe("short");
    expect(persona.easterEggs.some((item) => item.includes("收藏夹"))).toBe(true);
  });
});
