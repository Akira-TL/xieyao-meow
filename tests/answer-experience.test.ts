import { describe, expect, it } from "vitest";

import {
  AnswerExperienceService,
  InMemoryExperienceCache,
  type AnswerExperience,
  type AnswerExperienceGateway,
} from "@/lib/experience";
import type { UserProfile, ZhidaRequest } from "@/lib/zhihu";

const profile: UserProfile = {
  fetchedAt: 1_742_822_400,
  contents: [
    {
      contentType: "answer",
      url: "https://www.zhihu.com/question/1/answer/2",
      createdAt: 1_742_792_400,
      likeCount: 20,
      commentCount: 4,
      favoriteCount: 9,
      title: "AI Agent 工程化实践",
      summary: "Agent、MCP、模型调用与软件工程。",
    },
  ],
  followees: [],
  collections: [],
  favlists: [
    {
      urlToken: "1",
      url: "https://www.zhihu.com/collection/1",
      title: "AI 与开发工具",
      description: "Agent、LLM、MCP",
      isPublic: true,
    },
  ],
};

const fallback: AnswerExperience = {
  mode: "fallback",
  generatedAt: 1_742_822_400,
  composition: {
    primaryInterest: "综合",
    interests: [{ name: "综合", score: 1 }],
    writingLength: "medium",
    chronotype: "未知",
    hoardingLevel: 0,
    influenceLevel: 0,
    sourceCounts: { contents: 0, followees: 0, collections: 0, favlists: 0 },
  },
  persona: {
    species: "中华田园猫",
    appearance: ["问号吊牌"],
    personality: ["杂食"],
    catchphrase: "谢邀，这题本喵恰好路过。",
    certifiedTitle: "知乎在逃百科猫",
    interests: ["综合"],
    chronotype: "未知",
    answerStyle: { length: "medium", tone: "理性玩梗", density: "balanced" },
    easterEggs: [],
  },
  question: {
    title: "如何理解 AI Agent？",
    url: "https://www.zhihu.com/question/123",
    summary: "演示问题",
    thumbnailUrl: "",
  },
  knowledge: {
    source: "demo-fallback",
    answerSummaries: ["公开回答摘要示例"],
    synthesis: "AI Agent 通常由模型、工具、状态与执行循环组成。",
  },
  card: {
    questionTitle: "如何理解 AI Agent？",
    questionUrl: "https://www.zhihu.com/question/123",
    answer: "谢邀，本喵先从组成部分讲起。",
    personaTitle: "知乎在逃百科猫",
    sourceLabel: "演示缓存",
  },
};

class FakeGateway implements AnswerExperienceGateway {
  profileCalls = 0;
  hotListCalls = 0;
  questionAnswerCalls = 0;
  zhidaCalls: ZhidaRequest[] = [];
  failHotList = false;

  async getUserProfile(): Promise<UserProfile> {
    this.profileCalls += 1;
    return profile;
  }

  async getHotList() {
    this.hotListCalls += 1;
    if (this.failHotList) throw new Error("upstream unavailable");
    return [
      {
        title: "如何理解 AI Agent？",
        url: "https://www.zhihu.com/question/123",
        thumbnailUrl: "",
        summary: "一个关于 Agent 的真实问题摘要。",
      },
      {
        title: "一篇热榜文章",
        url: "https://zhuanlan.zhihu.com/p/456",
        thumbnailUrl: "",
        summary: "文章摘要",
      },
    ];
  }

  async getQuestionAnswers() {
    this.questionAnswerCalls += 1;
    return [
      {
        contentToken: "456",
        url: "https://www.zhihu.com/question/123/answer/456",
        summary: "回答认为 Agent 由模型、工具调用与任务执行循环构成。",
      },
    ];
  }

  async askZhida(input: ZhidaRequest) {
    this.zhidaCalls.push(input);
    if (this.zhidaCalls.length === 1) {
      return {
        model: input.model,
        content: "事实层：Agent 通常组合模型、工具与执行循环。",
        finishReason: "stop",
      };
    }
    return {
      model: input.model,
      content: "谢邀，本喵先拆三块：模型负责想，工具负责做，执行循环负责把事情推进完。",
      finishReason: "stop",
    };
  }
}

describe("AnswerExperienceService", () => {
  it("keeps Knowledge Layer separate from Persona Layer when producing a card", async () => {
    const gateway = new FakeGateway();
    const service = new AnswerExperienceService({
      gateway,
      cache: new InMemoryExperienceCache(),
      fallback,
      now: () => 1_742_822_400_000,
    });

    const experience = await service.create({ cacheKey: "demo-user" });

    expect(experience.mode).toBe("live");
    expect(experience.persona.species).toBe("英短");
    expect(experience.question.url).toBe("https://www.zhihu.com/question/123");
    expect(experience.knowledge).toEqual({
      source: "zhihu-question-answers+zhida",
      answerSummaries: ["回答认为 Agent 由模型、工具调用与任务执行循环构成。"],
      synthesis: "事实层：Agent 通常组合模型、工具与执行循环。",
    });
    expect(experience.card.answer).toContain("模型负责想");
    expect(experience.card.sourceLabel).toBe("知乎回答摘要 + 知乎直答");

    expect(gateway.zhidaCalls).toHaveLength(2);
    expect(gateway.zhidaCalls[0]?.messages[0]?.content).not.toContain("工程脑");
    expect(gateway.zhidaCalls[1]?.messages[0]?.content).toContain("工程脑");
    expect(gateway.zhidaCalls[1]?.messages[0]?.content).toContain(
      "事实层：Agent 通常组合模型、工具与执行循环。",
    );
  });

  it("returns a cached experience without spending upstream quota again", async () => {
    const gateway = new FakeGateway();
    const service = new AnswerExperienceService({
      gateway,
      cache: new InMemoryExperienceCache(),
      fallback,
    });

    const first = await service.create({ cacheKey: "same-user" });
    const second = await service.create({ cacheKey: "same-user" });

    expect(second).toEqual(first);
    expect(gateway.profileCalls).toBe(1);
    expect(gateway.hotListCalls).toBe(1);
    expect(gateway.questionAnswerCalls).toBe(1);
    expect(gateway.zhidaCalls).toHaveLength(2);
  });

  it("returns an explicitly marked fallback when the live chain fails", async () => {
    const gateway = new FakeGateway();
    gateway.failHotList = true;
    const service = new AnswerExperienceService({
      gateway,
      cache: new InMemoryExperienceCache(),
      fallback,
    });

    const experience = await service.create({ cacheKey: "offline-user" });

    expect(experience).toEqual(fallback);
    expect(experience.mode).toBe("fallback");
    expect(experience.card.sourceLabel).toBe("演示缓存");
  });
});
