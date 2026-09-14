import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AccountStore } from "@/lib/auth/account-store";
import { SocialCommunity, type SocialAgent } from "@/lib/social";
import {
  SharedEncounterService,
  SharedEncounterStore,
  toSharedEncounterView,
  type SharedEncounterDialogue,
} from "@/lib/social/shared-encounter";
import type { SocialDialogueRound } from "@/lib/social/dialogue";

const cleanup: string[] = [];

afterEach(() => {
  for (const directory of cleanup.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function tempDbPath(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "xieyao-social-"));
  cleanup.push(directory);
  return path.join(directory, "social.sqlite");
}

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
    expect(event.familiarity).toBe(1);
    expect(event.chemistry).not.toBe(0);
    expect(event.relationship).toBeTruthy();
  });

  it("supports curiosity visits when two personas have no shared interest", () => {
    const community = new SocialCommunity();

    const event = community.interact(engineerCat, lifestyleCat);

    expect(event.action).toBe("visit");
    expect(event.signals.sharedInterests).toEqual([]);
    expect(event.narrative).toContain("串门");
  });

  it("accumulates two-axis relationship state and exposes a newest-first community feed", () => {
    const community = new SocialCommunity();

    const first = community.interact(engineerCat, playfulTechCat);
    const second = community.interact(engineerCat, playfulTechCat);

    expect(second.familiarity).toBe(first.familiarity + 1);
    expect(second.encounterCount).toBe(first.encounterCount + 1);
    expect(community.getFeed()).toEqual([second, first]);
    expect(community.getRelationship(engineerCat.id, playfulTechCat.id)).toEqual({
      familiarity: second.familiarity,
      chemistry: second.chemistry,
      encounterCount: second.encounterCount,
    });
  });
});

class FakeEncounterDialogue implements SharedEncounterDialogue {
  calls = 0;

  async nextRound(input: Parameters<SharedEncounterDialogue["nextRound"]>[0]): Promise<SocialDialogueRound> {
    this.calls += 1;
    const roundNumber = Math.floor(input.history.length / 2) + 1;
    return {
      mode: "rules",
      turns: [
        { speaker: "self", text: `A 第 ${roundNumber} 轮：只讨论共同问题。` },
        { speaker: "other", text: `B 第 ${roundNumber} 轮：保留自己的表达方式。` },
      ],
      shouldStop: roundNumber >= 2,
      roundNumber,
      memoryNote: `第 ${roundNumber} 轮形成一个候选经历`,
      sourceLabel: "test dialogue",
    };
  }
}

function seedUsers(dbPath: string): { userA: string; userB: string; userC: string } {
  const ids = ["user-a", "user-b", "user-c"];
  const accountStore = new AccountStore({
    dbPath,
    createId: () => ids.shift() ?? "unexpected-user",
  });
  const userA = accountStore.resolveOrCreateOAuthUser("zhihu", "subject-a");
  const userB = accountStore.resolveOrCreateOAuthUser("zhihu", "subject-b");
  const userC = accountStore.resolveOrCreateOAuthUser("zhihu", "subject-c");
  accountStore.close();
  return { userA, userB, userC };
}

const sharedTopic = {
  title: "AI Agent 应该替用户做多少决定？",
  url: "https://www.zhihu.com/question/123",
  summary: "同一份 Knowledge Layer：讨论 Agent 自主性与人的控制边界。",
};

const provenance = {
  contentSource: "live" as const,
  knowledgeSource: "zhihu-question-answers+zhida",
  fetchedAt: 12_000,
};

describe("SharedEncounterStore", () => {
  it("lets two Users read the same immutable Encounter and generates it only once", async () => {
    const dbPath = tempDbPath();
    const { userA, userB } = seedUsers(dbPath);
    const dialogue = new FakeEncounterDialogue();
    const store = new SharedEncounterStore({ dbPath, now: () => 20_000, createId: () => "encounter-1" });
    store.savePersonaSnapshot(userA, { ...engineerCat, displayName: "扳手" }, "live");
    store.savePersonaSnapshot(userB, { ...playfulTechCat, displayName: "齿轮" }, "live");
    const service = new SharedEncounterService(store, dialogue);

    const first = await service.create({
      requestUserId: userA,
      otherUserId: userB,
      topic: sharedTopic,
      provenance,
    });
    const sameFromOtherSide = await service.create({
      requestUserId: userB,
      otherUserId: userA,
      topic: sharedTopic,
      provenance,
    });

    expect(first.id).toBe("encounter-1");
    expect(sameFromOtherSide.id).toBe(first.id);
    expect(dialogue.calls).toBe(2);
    expect(first.turns).toHaveLength(4);
    expect(first.participantAPersonaVersion).toBe(1);
    expect(first.participantBPersonaVersion).toBe(1);
    expect(first.completedAt).toBe(20_000);

    const viewA = toSharedEncounterView(first, userA);
    expect(JSON.stringify(viewA)).not.toContain("sourceCounts");
    expect(JSON.stringify(viewA)).not.toContain(userA);
    expect(JSON.stringify(viewA)).not.toContain(userB);
    expect(viewA.participants.every((participant) => participant.capsule.interests.length <= 3)).toBe(true);

    const readA = store.getEncounterForUser(first.id, userA);
    const readB = store.getEncounterForUser(first.id, userB);
    expect(readA).toEqual(readB);
    expect(readA?.turns).toEqual(first.turns);

    if (!readA) throw new Error("expected encounter");
    readA.turns[0]!.text = "client mutation must not persist";
    expect(store.getEncounterForUser(first.id, userA)?.turns[0]?.text).toBe("A 第 1 轮：只讨论共同问题。");
    store.close();
  });

  it("does not expose a Shared Encounter to a non-participant", async () => {
    const dbPath = tempDbPath();
    const { userA, userB, userC } = seedUsers(dbPath);
    const store = new SharedEncounterStore({ dbPath, now: () => 30_000, createId: () => "encounter-private" });
    store.savePersonaSnapshot(userA, engineerCat, "live");
    store.savePersonaSnapshot(userB, playfulTechCat, "live");
    const encounter = await new SharedEncounterService(store, new FakeEncounterDialogue()).create({
      requestUserId: userA,
      otherUserId: userB,
      topic: sharedTopic,
      provenance,
    });

    expect(store.getEncounterForUser(encounter.id, userC)).toBeNull();
    store.close();
  });

  it("persists familiarity and chemistry per User pair without leaking relationship or memory state", async () => {
    const dbPath = tempDbPath();
    const { userA, userB, userC } = seedUsers(dbPath);
    let now = 40_000;
    const ids = ["encounter-a", "encounter-b"];
    const store = new SharedEncounterStore({
      dbPath,
      now: () => now,
      createId: () => ids.shift() ?? "unexpected-encounter",
    });
    store.savePersonaSnapshot(userA, engineerCat, "live");
    store.savePersonaSnapshot(userB, playfulTechCat, "live");
    store.savePersonaSnapshot(userC, lifestyleCat, "live");
    const service = new SharedEncounterService(store, new FakeEncounterDialogue());

    const first = await service.create({
      requestUserId: userA,
      otherUserId: userB,
      topic: sharedTopic,
      provenance,
    });
    const relationshipAfterFirst = store.getRelationship(userA, userB);
    expect(relationshipAfterFirst).toMatchObject({
      familiarity: 1,
      encounterCount: 1,
      lastEncounterAt: 40_000,
    });
    expect(store.getRelationship(userA, userC)).toBeNull();

    now = 50_000;
    await service.create({
      requestUserId: userA,
      otherUserId: userB,
      topic: { ...sharedTopic, url: "https://www.zhihu.com/question/456", title: "第二个真实问题" },
      provenance: { ...provenance, fetchedAt: 50_000 },
    });
    const relationshipAfterSecond = store.getRelationship(userB, userA);
    expect(relationshipAfterSecond?.familiarity).toBe(2);
    expect(relationshipAfterSecond?.encounterCount).toBe(2);
    expect(relationshipAfterSecond?.lastEncounterAt).toBe(50_000);
    expect(relationshipAfterSecond?.chemistry).not.toBe(relationshipAfterFirst?.chemistry);
    expect(store.getRelationship(userA, userC)).toBeNull();

    expect(store.getMemoryCandidatesForUser(userA)).toEqual(expect.arrayContaining([
      expect.objectContaining({ ownerUserId: userA, sourceEventId: first.id, type: "shared_encounter" }),
    ]));
    expect(store.getMemoryCandidatesForUser(userB)).toEqual(expect.arrayContaining([
      expect.objectContaining({ ownerUserId: userB, sourceEventId: first.id, type: "shared_encounter" }),
    ]));
    expect(store.getMemoryCandidatesForUser(userC)).toEqual([]);
    store.close();
  });
});
