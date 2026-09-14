import { describe, expect, it } from "vitest";

import {
  SocialMatchService,
  buildRuleMatch,
  type SocialAgent,
  type SocialMatchGateway,
} from "@/lib/social";
import type { ZhidaRequest } from "@/lib/zhihu";

const self: SocialAgent = {
  id: "self",
  displayName: "本喵",
  composition: {
    primaryInterest: "AI 与数码",
    interests: [
      { name: "AI 与数码", score: 8 },
      { name: "科学", score: 5 },
    ],
    writingLength: "long",
    chronotype: "夜猫子",
    hoardingLevel: 4,
    influenceLevel: 3,
    sourceCounts: { contents: 10, followees: 4, collections: 3, favlists: 2 },
  },
  persona: {
    species: "黑猫",
    appearance: ["圆框眼镜"],
    personality: ["工程脑"],
    catchphrase: "先拆结构。",
    certifiedTitle: "工具猫",
    interests: ["AI 与数码", "科学"],
    chronotype: "夜猫子",
    answerStyle: { length: "long", tone: "冷静拆解", density: "dense" },
    easterEggs: [],
  },
};

const gear: SocialAgent = {
  id: "resident-gear",
  displayName: "齿轮",
  composition: {
    primaryInterest: "AI 与数码",
    interests: [{ name: "AI 与数码", score: 9 }],
    writingLength: "short",
    chronotype: "日间活跃",
    hoardingLevel: 1,
    influenceLevel: 1,
    sourceCounts: { contents: 0, followees: 0, collections: 0, favlists: 0 },
  },
  persona: {
    species: "哲学狐",
    appearance: ["深红围巾"],
    personality: ["反方辩手"],
    catchphrase: "为什么？",
    certifiedTitle: "短句反方席",
    interests: ["AI 与数码"],
    chronotype: "日间活跃",
    answerStyle: { length: "short", tone: "短句直球", density: "light" },
    easterEggs: [],
  },
};

class FakeMatchGateway implements SocialMatchGateway {
  calls: ZhidaRequest[] = [];
  fail = false;

  async askZhida(input: ZhidaRequest) {
    this.calls.push(input);
    if (this.fail) throw new Error("zhida unavailable");
    return {
      model: input.model,
      content: JSON.stringify({
        score_delta: 4,
        bridge: "AI Agent 的自主边界",
        prediction: "会在边界条件上互相追问",
        reason: "都关心 AI，但一个偏结构拆解，一个偏短句追问，适合围绕边界条件继续聊。",
      }),
      finishReason: "stop",
    };
  }
}

describe("SocialMatchService", () => {
  it("keeps a deterministic rule score and lets Zhida make only a bounded semantic adjustment", async () => {
    const gateway = new FakeMatchGateway();
    const result = await new SocialMatchService(gateway).create(self, gear);

    expect(result.mode).toBe("zhida");
    expect(result.baselineScore).toBe(78);
    expect(result.score).toBe(82);
    expect(result.sharedInterests).toEqual(["AI 与数码"]);
    expect(result.styleContrast).toBe(3);
    expect(result.bridge).toBe("AI Agent 的自主边界");
    expect(result.reason).toContain("一个偏结构拆解");
    expect(result.sourceLabel).toBe("知乎直答 + 谢邀喵匹配规则");
    expect(gateway.calls).toHaveLength(1);
    expect(gateway.calls[0]?.model).toBe("zhida-fast-1p5");
    expect(gateway.calls[0]?.messages[0]?.content).toContain("不是知乎官方评分");
    expect(gateway.calls[0]?.messages[0]?.content).toContain("中文表达约束（Humanizer-zh）");
    expect(gateway.calls[0]?.messages[0]?.content).toContain("JSON 结构必须原样遵守");
  });

  it("falls back to explainable local rules when Zhida is unavailable", async () => {
    const gateway = new FakeMatchGateway();
    gateway.fail = true;

    const result = await new SocialMatchService(gateway).create(self, gear);
    const baseline = buildRuleMatch(self, gear);

    expect(result).toEqual(baseline);
    expect(result.mode).toBe("rules");
    expect(result.score).toBe(78);
    expect(result.sourceLabel).toBe("谢邀喵匹配规则");
  });
});
