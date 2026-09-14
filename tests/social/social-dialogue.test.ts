import { describe, expect, it } from "vitest";

import {
  SocialDialogueService,
  type PersonaExperienceMemory,
  type SocialAgent,
  type SocialDialogueGateway,
} from "@/lib/social";
import type { ZhidaRequest } from "@/lib/zhihu";

const self: SocialAgent = {
  id: "self",
  displayName: "本喵",
  composition: {
    primaryInterest: "AI 与数码",
    interests: [
      { name: "AI 与数码", score: 0.7 },
      { name: "科学", score: 0.3 },
    ],
    writingLength: "long",
    chronotype: "夜猫子",
    hoardingLevel: 60,
    influenceLevel: 30,
    sourceCounts: { contents: 20, followees: 10, collections: 8, favlists: 3 },
  },
  persona: {
    species: "黑猫",
    appearance: ["圆框眼镜"],
    personality: ["工程脑", "好奇", "爱抬杠"],
    catchphrase: "先拆两层。",
    certifiedTitle: "工具猫",
    interests: ["AI 与数码", "科学"],
    chronotype: "夜猫子",
    answerStyle: { length: "long", tone: "理性玩梗", density: "dense" },
    easterEggs: [],
  },
};

const other: SocialAgent = {
  id: "resident-gear",
  displayName: "齿轮",
  composition: {
    primaryInterest: "AI 与数码",
    interests: [{ name: "AI 与数码", score: 1 }],
    writingLength: "short",
    chronotype: "日间活跃",
    hoardingLevel: 2,
    influenceLevel: 3,
    sourceCounts: { contents: 0, followees: 0, collections: 0, favlists: 0 },
  },
  persona: {
    species: "哲学狐",
    appearance: ["深红围巾"],
    personality: ["反方辩手", "技术乐子人"],
    catchphrase: "先问一句为什么。",
    certifiedTitle: "短句反方席",
    interests: ["AI 与数码", "科学"],
    chronotype: "日间活跃",
    answerStyle: { length: "short", tone: "短句直球", density: "balanced" },
    easterEggs: [],
  },
};

const memory: PersonaExperienceMemory = {
  encounterCount: 2,
  recentTopics: ["AI Agent"],
  recentResidents: ["刻度"],
  notes: ["最近更愿意先听完反方再拆结构"],
};

class FakeGateway implements SocialDialogueGateway {
  requests: ZhidaRequest[] = [];
  private index = 0;

  constructor(private readonly payloads: string[]) {}

  async askZhida(input: ZhidaRequest) {
    this.requests.push(input);
    const content = this.payloads[Math.min(this.index, this.payloads.length - 1)] ?? "not-json";
    this.index += 1;
    return { model: input.model, content, finishReason: "stop" };
  }
}

const topic = {
  title: "AI Agent 应该替用户做多少决定？",
  url: "https://www.zhihu.com/question/123",
  summary: "讨论 Agent 自主性与人的控制边界。",
};

describe("SocialDialogueService", () => {
  it("produces one two-sided round and refuses to stop before two rounds", async () => {
    const gateway = new FakeGateway([
      JSON.stringify({ text: "先把决定权分层，不然所有自主性都混在一起了。" }),
      JSON.stringify({
        text: "分层可以，但用户真的会去看你那四层开关吗？",
        should_stop: true,
        memory_note: "开始把控制边界和普通人的使用成本放在一起看",
      }),
    ]);
    const service = new SocialDialogueService(gateway);

    const result = await service.nextRound({ actor: self, target: other, topic, history: [], memory });

    expect(result.mode).toBe("zhida");
    expect(result.turns).toEqual([
      { speaker: "self", text: "先把决定权分层，不然所有自主性都混在一起了。" },
      { speaker: "other", text: "分层可以，但用户真的会去看你那四层开关吗？" },
    ]);
    expect(result.shouldStop).toBe(false);
    expect(result.roundNumber).toBe(1);
    expect(gateway.requests).toHaveLength(2);
    expect(gateway.requests[0]?.messages[0]?.content).toContain("最近更愿意先听完反方再拆结构");
    expect(gateway.requests[1]?.messages[0]?.content).toContain("先把决定权分层");
  });

  it("allows a natural stop from round two and forces a stop at round four", async () => {
    const gateway = new FakeGateway([
      JSON.stringify({ text: "那就别做四层开关，默认替人做事，但把反悔成本压到最低。" }),
      JSON.stringify({
        text: "这句我买账。能反悔，比假装所有人都想配置参数靠谱。",
        should_stop: true,
        memory_note: "更重视反悔成本",
      }),
    ]);
    const service = new SocialDialogueService(gateway);
    const history = [
      { speaker: "self" as const, text: "第一句" },
      { speaker: "other" as const, text: "第二句" },
    ];

    const second = await service.nextRound({ actor: self, target: other, topic, history, memory });
    expect(second.shouldStop).toBe(true);

    const fourth = await new SocialDialogueService(new FakeGateway([
      JSON.stringify({ text: "还有一点。" }),
      JSON.stringify({ text: "继续。", should_stop: false, memory_note: "仍有分歧" }),
    ])).nextRound({
      actor: self,
      target: other,
      topic,
      history: [...history, ...second.turns, ...second.turns],
      memory,
    });
    expect(fourth.roundNumber).toBe(4);
    expect(fourth.shouldStop).toBe(true);
  });

  it("falls back to persona-aware dialogue when Zhida is unavailable", async () => {
    const service = new SocialDialogueService(new FakeGateway(["not-json"]));

    const result = await service.nextRound({ actor: self, target: other, topic, history: [], memory });

    expect(result.mode).toBe("rules");
    expect(result.turns).toHaveLength(2);
    expect(result.turns[0]?.speaker).toBe("self");
    expect(result.turns[1]?.speaker).toBe("other");
    expect(result.turns.map((turn) => turn.text).join(" ")).toContain("齿轮");
  });
});
