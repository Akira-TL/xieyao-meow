import { describe, expect, it } from "vitest";

import { SocialCommunity, type SocialAgent } from "@/lib/social";

const engineerCat: SocialAgent = {
  id: "engineer-cat",
  displayName: "扳手",
  composition: {
    primaryInterest: "AI 与数码",
    interests: [
      { name: "AI 与数码", score: 10 },
      { name: "科学", score: 4 },
    ],
    writingLength: "long",
    chronotype: "夜猫子",
    hoardingLevel: 3,
    influenceLevel: 4,
    sourceCounts: { contents: 12, followees: 8, collections: 7, favlists: 3 },
  },
  persona: {
    species: "英短",
    appearance: ["护目镜"],
    personality: ["工程脑", "较真"],
    catchphrase: "先看数据。",
    certifiedTitle: "知乎盐选级工具猫",
    interests: ["AI 与数码", "科学"],
    chronotype: "夜猫子",
    answerStyle: { length: "long", tone: "冷静拆解", density: "dense" },
    easterEggs: [],
  },
};

const playfulTechCat: SocialAgent = {
  id: "playful-tech-cat",
  displayName: "齿轮",
  composition: {
    primaryInterest: "AI 与数码",
    interests: [{ name: "AI 与数码", score: 8 }],
    writingLength: "short",
    chronotype: "日间活跃",
    hoardingLevel: 1,
    influenceLevel: 2,
    sourceCounts: { contents: 0, followees: 0, collections: 0, favlists: 0 },
  },
  persona: {
    species: "橘猫",
    appearance: ["齿轮吊牌"],
    personality: ["抖机灵", "技术乐子人"],
    catchphrase: "别急，先整活。",
    certifiedTitle: "热榜机械猫",
    interests: ["AI 与数码"],
    chronotype: "日间活跃",
    answerStyle: { length: "short", tone: "轻松玩梗", density: "light" },
    easterEggs: [],
  },
};

const lifestyleCat: SocialAgent = {
  id: "lifestyle-cat",
  displayName: "糯米",
  composition: {
    primaryInterest: "文化与生活",
    interests: [{ name: "文化与生活", score: 8 }],
    writingLength: "medium",
    chronotype: "早起鸟",
    hoardingLevel: 2,
    influenceLevel: 1,
    sourceCounts: { contents: 0, followees: 0, collections: 0, favlists: 0 },
  },
  persona: {
    species: "布偶",
    appearance: ["围巾"],
    personality: ["温吞", "生活派"],
    catchphrase: "先吃点东西再说。",
    certifiedTitle: "生活区晒太阳委员",
    interests: ["文化与生活"],
    chronotype: "早起鸟",
    answerStyle: { length: "medium", tone: "温和叙事", density: "balanced" },
    easterEggs: [],
  },
};

describe("SocialCommunity", () => {
  it("turns shared interests plus strong style contrast into an explainable debate", () => {
    const community = new SocialCommunity();

    const event = community.interact(engineerCat, playfulTechCat);

    expect(event.action).toBe("debate");
    expect(event.signals.sharedInterests).toEqual(["AI 与数码"]);
    expect(event.signals.styleContrast).toBeGreaterThanOrEqual(2);
    expect(event.reasons.join(" ")).toContain("共同兴趣");
    expect(event.reasons.join(" ")).toContain("表达风格差异");
    expect(event.affinityAfter).not.toBe(event.affinityBefore);
    expect(event.relationship).toBeTruthy();
  });

  it("supports curiosity visits when two personas have no shared interest", () => {
    const community = new SocialCommunity();

    const event = community.interact(engineerCat, lifestyleCat);

    expect(event.action).toBe("visit");
    expect(event.signals.sharedInterests).toEqual([]);
    expect(event.narrative).toContain("串门");
  });

  it("accumulates relationship state and exposes a newest-first community feed", () => {
    const community = new SocialCommunity();

    const first = community.interact(engineerCat, playfulTechCat);
    const second = community.interact(engineerCat, playfulTechCat);

    expect(second.affinityBefore).toBe(first.affinityAfter);
    expect(second.affinityAfter).not.toBe(first.affinityAfter);
    expect(community.getFeed()).toEqual([second, first]);
    expect(community.getAffinity(engineerCat.id, playfulTechCat.id)).toBe(second.affinityAfter);
  });
});
