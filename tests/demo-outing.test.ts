import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountStore } from "@/lib/auth/account-store";
import { JourneyService } from "@/lib/journey/service";

const cleanup: string[] = [];

afterEach(() => {
  for (const directory of cleanup.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createDbPath() {
  const directory = mkdtempSync(path.join(tmpdir(), "xieyao-journey-"));
  cleanup.push(directory);
  return path.join(directory, "journey.sqlite");
}

function createUser(dbPath: string, providerSubject: string, userId: string) {
  const accounts = new AccountStore({ dbPath, createId: () => userId });
  const resolved = accounts.resolveOrCreateOAuthUser("zhihu", providerSubject);
  accounts.close();
  return resolved;
}

describe("server Journey", () => {
  it("freezes the first 2–3 minute warm-up Journey and materializes its return only once", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-a", "user-a");
    let now = 1_000_000;
    let sequence = 0;
    const discover = vi.fn(async (_input?: unknown) => ({
      question: {
        title: "真实问题",
        url: "https://www.zhihu.com/question/123",
        summary: "真实摘要",
      },
      contentSource: "live" as const,
      knowledgeSource: "template" as const,
      sourceFetchedAt: now,
      postcardBody: "它把这个真实问题叼回来了。",
      insight: {
        headline: "它发现你会多问一步",
        insight: "你会在熟悉主题里继续追问边界，而不只停在标签本身。",
        whyItMatters: "这会影响它以后选择值得停下来的问题。",
        evidenceSummary: "长期兴趣：AI 与数码 · 本趟纸条：「多看看 AI」 · 本趟停留：「真实问题」",
        interactionQuestion: "这条推断成立吗？",
        options: [
          { action: "CONFIRM_INTEREST" as const, label: "挺像我的" },
          { action: "CORRECT_INTEREST" as const, label: "方向不太对" },
          { action: "REDUCE_INTEREST" as const, label: "以后少看这个" },
        ],
        textCharCount: 88,
        model: "deepseek-flash",
        promptVersion: "journey-insight-v1",
        factsJson: '{"insightTopic":"AI 与数码","zhihuComposition":{"primaryInterest":"科学"},"journey":{"routeBias":"多看看 AI"}}',
      },
      conversation: {
        kind: "NPC" as const,
        participantId: "resident-thesis",
        participantName: "刻度",
        turns: [
          { speaker: "self" as const, text: "先看证据从哪里来。" },
          { speaker: "other" as const, text: "那我先问样本够不够。" },
        ],
        sourceLabel: "DeepSeek Flash · 单角色逐句对话",
        textCharCount: 20,
      },
    }));
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => `id-${++sequence}`,
      discover,
    });

    const preparing = await service.start(userId, "oauth-a", "多看看 AI");
    expect(preparing.state).toBe("PREPARING");
    expect(preparing.journey?.routeBias).toBe("多看看 AI");
    expect(preparing.journey!.kind).toBe("WARMUP");
    expect(preparing.journey!.departAt - preparing.journey!.createdAt).toBeGreaterThanOrEqual(10_000);
    expect(preparing.journey!.departAt - preparing.journey!.createdAt).toBeLessThanOrEqual(30_000);
    expect(preparing.journey!.returnAt - preparing.journey!.departAt).toBeGreaterThanOrEqual(2 * 60_000);
    expect(preparing.journey!.returnAt - preparing.journey!.departAt).toBeLessThanOrEqual(3 * 60_000);
    const frozenReturnAt = preparing.journey!.returnAt;

    now = preparing.journey!.departAt;
    const away = await service.getProjection(userId, "oauth-a");
    expect(away.state).toBe("AWAY");
    expect(away.journey?.returnAt).toBe(frozenReturnAt);

    now = frozenReturnAt;
    const returned = await service.getProjection(userId, "oauth-a");
    expect(returned.state).toBe("RETURNED");
    expect(returned.journey?.question?.url).toBe("https://www.zhihu.com/question/123");
    expect(returned.journey?.postcard?.body).toBe("它把这个真实问题叼回来了。");
    expect(returned.journey?.artifact?.type).toBe("QUESTION_TICKET");
    expect(returned.journey?.insight).toMatchObject({
      headline: "它发现你会多问一步",
      model: "deepseek-flash",
      textCharCount: 88,
      feedbackAction: null,
    });
    expect(returned.journey?.conversation).toMatchObject({
      kind: "NPC",
      participantName: "刻度",
      sourceLabel: "DeepSeek Flash · 单角色逐句对话",
    });
    expect((await service.getAtlas(userId, "oauth-a")).journeys[0]?.conversation?.participantName).toBe("刻度");

    const repeated = await service.getProjection(userId, "oauth-a");
    expect(repeated).toEqual(returned);
    expect(discover).toHaveBeenCalledTimes(1);

    const responded = await service.respondToInsight(
      userId,
      "oauth-a",
      returned.journey!.id,
      "CONFIRM_INTEREST",
    );
    expect(responded.journey?.insight?.feedbackAction).toBe("CONFIRM_INTEREST");
    expect((await service.getAtlas(userId, "oauth-a")).journeys[0]?.insight?.feedbackAction).toBe("CONFIRM_INTEREST");
    expect(discover).toHaveBeenCalledTimes(1);

    const resting = await service.archive(userId, "oauth-a");
    const queuedNext = await service.start(userId, "oauth-a", null);
    expect(queuedNext.queuedJourney).toBe(true);
    now = resting.nextJourneyAt!;
    const second = await service.getProjection(userId, "oauth-a");
    now = second.journey!.returnAt;
    await service.getProjection(userId, "oauth-a");
    expect(discover).toHaveBeenCalledTimes(2);
    const secondDiscoveryInput = discover.mock.calls[1]?.[0] as {
      recentInsightFeedback: Array<{ action: string; topic: string }>;
    };
    expect(secondDiscoveryInput.recentInsightFeedback).toEqual([
      { action: "CONFIRM_INTEREST", topic: "AI 与数码" },
    ]);
    service.close();
  });

  it("freezes Journey Event plans, materializes them on schedule, and reuses one discovery snapshot", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-events", "user-events");
    let now = 3_000_000;
    let idIndex = 0;
    const ids = ["event-30", "event-row-a", "event-row-b"];
    const discover = vi.fn(async () => ({
      question: {
        title: "途中看见的真实问题",
        url: "https://www.zhihu.com/question/777",
        summary: "这张问题一瞥和回家后的问题票来自同一份冻结结果。",
        thumbnailUrl: "https://pic.example.com/777.jpg",
      },
      contentSource: "live" as const,
      knowledgeSource: "template" as const,
      sourceFetchedAt: now,
      postcardHeadline: "回家以后才把整页摊开。",
      postcardBody: "途中纸片没有提前拆掉回家结果。",
      conversation: {
        kind: "NPC" as const,
        participantId: "resident-gear",
        participantName: "齿轮",
        turns: [
          { speaker: "self" as const, text: "先看看这个问题。" },
          { speaker: "other" as const, text: "我更想知道为什么。" },
        ],
        sourceLabel: "测试对话",
        textCharCount: 18,
      },
    }));
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => ids[idIndex++] ?? ("event-generated-" + idIndex),
      discover,
    });

    const started = await service.start(userId, "oauth-events", "看看科学");
    expect(started.journey?.events).toHaveLength(2);
    expect(started.journey?.events.map((event) => event.plannedType)).toEqual([
      "QUESTION_GLIMPSE",
      "ENCOUNTER_GLIMPSE",
    ]);
    expect(started.journey?.events.every((event) => event.occurredAt === null)).toBe(true);
    const [firstPlan, secondPlan] = started.journey!.events;
    expect(firstPlan!.scheduledAt).toBeGreaterThan(started.journey!.departAt);
    expect(secondPlan!.scheduledAt).toBeGreaterThan(firstPlan!.scheduledAt);
    expect(secondPlan!.scheduledAt).toBeLessThan(started.journey!.returnAt);

    now = firstPlan!.scheduledAt - 1;
    const beforeFirst = await service.getProjection(userId, "oauth-events");
    expect(beforeFirst.journey?.events[0]?.occurredAt).toBeNull();
    expect(discover).toHaveBeenCalledTimes(0);

    now = firstPlan!.scheduledAt;
    const firstOccurred = await service.getProjection(userId, "oauth-events");
    expect(firstOccurred.state).toBe("AWAY");
    expect(firstOccurred.journey?.events[0]).toMatchObject({
      plannedType: "QUESTION_GLIMPSE",
      type: "QUESTION_GLIMPSE",
      occurredAt: firstPlan!.scheduledAt,
      seenAt: null,
      question: { url: "https://www.zhihu.com/question/777" },
    });
    expect(discover).toHaveBeenCalledTimes(1);

    const seen = await service.markEventSeen(userId, "oauth-events", firstPlan!.id);
    expect(seen?.seenAt).toBe(now);
    expect((await service.getProjection(userId, "oauth-events")).journey?.events[0]?.seenAt).toBe(now);

    now = secondPlan!.scheduledAt;
    const secondOccurred = await service.getProjection(userId, "oauth-events");
    expect(secondOccurred.journey?.events[1]).toMatchObject({
      plannedType: "ENCOUNTER_GLIMPSE",
      type: "ENCOUNTER_GLIMPSE",
      occurredAt: secondPlan!.scheduledAt,
      participant: {
        kind: "NPC",
        id: "resident-gear",
        name: "齿轮",
      },
    });
    expect(discover).toHaveBeenCalledTimes(1);

    const frozenEvents = secondOccurred.journey!.events;
    expect((await service.getProjection(userId, "oauth-events")).journey?.events).toEqual(frozenEvents);

    now = started.journey!.returnAt;
    const returned = await service.getProjection(userId, "oauth-events");
    expect(returned.state).toBe("RETURNED");
    expect(returned.journey?.question?.url).toBe("https://www.zhihu.com/question/777");
    expect(returned.journey?.conversation?.participantName).toBe("齿轮");
    expect(returned.journey?.events).toEqual(frozenEvents);
    expect(discover).toHaveBeenCalledTimes(1);

    const atlas = await service.getAtlas(userId, "oauth-events");
    expect(atlas.journeys[0]?.events).toEqual(frozenEvents);
    service.close();
  });

  it("falls a factual Journey Event back to a scene without inventing a question", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-event-fallback", "user-event-fallback");
    let now = 4_000_000;
    const discover = vi.fn(async () => {
      throw new Error("source unavailable");
    });
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: (() => {
        let first = true;
        return () => {
          if (first) {
            first = false;
            return "event-27";
          }
          return "fallback-generated";
        };
      })(),
      discover,
    });

    const started = await service.start(userId, "oauth-event-fallback", null);
    expect(started.journey?.events).toHaveLength(1);
    const plan = started.journey!.events[0]!;
    expect(plan.plannedType).toBe("QUESTION_GLIMPSE");

    now = started.journey!.returnAt;
    const returned = await service.getProjection(userId, "oauth-event-fallback");
    expect(returned.state).toBe("RETURNED");
    expect(returned.journey?.events[0]).toMatchObject({
      plannedType: "QUESTION_GLIMPSE",
      type: "SCENE_POSTCARD",
      occurredAt: plan.scheduledAt,
      question: null,
      participant: null,
    });
    expect(returned.journey?.question).toBeNull();
    expect(discover).toHaveBeenCalledTimes(1);
    service.close();
  });

  it("coalesces concurrent return polls into one discovery/materialization", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-a", "user-a");
    let now = 2_000_000;
    let releaseDiscovery!: () => void;
    const discoveryGate = new Promise<void>((resolve) => {
      releaseDiscovery = resolve;
    });
    const discover = vi.fn(async () => {
      await discoveryGate;
      return {
        question: {
          title: "并发轮询也只发现一次",
          url: "https://www.zhihu.com/question/456",
          summary: "同一趟 Journey 只能 materialize 一次。",
        },
        contentSource: "live" as const,
        knowledgeSource: "template" as const,
        sourceFetchedAt: now,
        postcardBody: "这一趟只生成一次。",
      };
    });
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: (() => {
        let sequence = 0;
        return () => `concurrent-${++sequence}`;
      })(),
      discover,
    });

    const preparing = await service.start(userId, "oauth-a", "多看看 AI");
    now = preparing.journey!.returnAt;

    const firstPoll = service.getProjection(userId, "oauth-a");
    await Promise.resolve();
    const secondPoll = service.getProjection(userId, "oauth-a");
    await Promise.resolve();
    expect(discover).toHaveBeenCalledTimes(1);

    releaseDiscovery();
    const [firstReturned, secondReturned] = await Promise.all([firstPoll, secondPoll]);
    expect(firstReturned.state).toBe("RETURNED");
    expect(secondReturned.state).toBe("RETURNED");
    expect(firstReturned.journey?.question?.url).toBe("https://www.zhihu.com/question/456");
    expect(secondReturned.journey?.question?.url).toBe("https://www.zhihu.com/question/456");
    expect(discover).toHaveBeenCalledTimes(1);
    service.close();
  });

  it("keeps Journey ownership isolated by stable user_id", async () => {
    const dbPath = createDbPath();
    const userA = createUser(dbPath, "subject-a", "user-a");
    const userB = createUser(dbPath, "subject-b", "user-b");
    let sequence = 0;
    const service = new JourneyService({
      dbPath,
      createId: () => `journey-${++sequence}`,
      discover: async () => ({
        question: null,
        contentSource: "none",
        knowledgeSource: "none",
        sourceFetchedAt: Date.now(),
        postcardBody: "空手回来。",
      }),
    });

    const a = await service.start(userA, "oauth-a", "随便逛");
    expect(a.journey?.id).toBe("journey-1");
    expect(await service.getProjection(userB, "oauth-b")).toMatchObject({
      state: "AT_HOME",
      journey: null,
      resting: false,
    });
    const b = await service.start(userB, "oauth-b", "去陌生地方");
    expect(b.journey?.id).toBe("journey-2");
    expect(a.journey?.id).not.toBe(b.journey?.id);
    service.close();
  });

  it("uses warm-up bands, rests, queues only prepared next trips, and stays home otherwise", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-a", "user-a");
    const otherUserId = createUser(dbPath, "subject-b", "user-b");
    let now = 10_000;
    let sequence = 0;
    const discover = vi.fn(async () => ({
      question: {
        title: "重复遇见的真实问题",
        url: "https://www.zhihu.com/question/999",
        summary: "同一问题可以重复路过，但票根不重复掉落。",
      },
      contentSource: "live" as const,
      knowledgeSource: "template" as const,
      sourceFetchedAt: now,
      postcardBody: "又路过了这个问题。",
    }));
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => "id-" + (++sequence),
      discover,
    });

    const first = await service.start(userId, "oauth-a", "多看看 AI");
    expect(first.journey?.kind).toBe("WARMUP");
    expect(first.journey!.returnAt - first.journey!.departAt).toBeGreaterThanOrEqual(2 * 60_000);
    expect(first.journey!.returnAt - first.journey!.departAt).toBeLessThanOrEqual(3 * 60_000);

    now = first.journey!.returnAt;
    const firstReturned = await service.getProjection(userId, "oauth-a");
    expect(firstReturned.nextJourneyAt! - first.journey!.returnAt).toBeGreaterThanOrEqual(20 * 60_000);
    expect(firstReturned.nextJourneyAt! - first.journey!.returnAt).toBeLessThanOrEqual(60 * 60_000);
    expect(firstReturned.journey?.inspirationLeaves).toBeGreaterThanOrEqual(2);
    expect(firstReturned.journey?.inspirationLeaves).toBeLessThanOrEqual(4);

    const resting = await service.archive(userId, "oauth-a");
    expect(resting).toMatchObject({ state: "AT_HOME", resting: true, queuedJourney: false });
    expect(resting.game.homeActivity?.type).toBe("RESTING");

    const queued = await service.start(userId, "oauth-a", null);
    expect(queued).toMatchObject({
      state: "AT_HOME",
      resting: true,
      queuedJourney: true,
      queuedRouteBias: null,
    });

    now = queued.nextJourneyAt!;
    const second = await service.getProjection(userId, "oauth-a");
    expect(second.state).toBe("PREPARING");
    expect(second.journey?.routeBias).toBeNull();
    expect(second.journey?.kind).toBe("WARMUP");
    expect(second.journey!.returnAt - second.journey!.departAt).toBeGreaterThanOrEqual(3 * 60_000);
    expect(second.journey!.returnAt - second.journey!.departAt).toBeLessThanOrEqual(5 * 60_000);

    now = second.journey!.returnAt;
    const secondReturned = await service.getProjection(userId, "oauth-a");
    const afterSecondArchive = await service.archive(userId, "oauth-a");
    expect(afterSecondArchive.queuedJourney).toBe(false);

    now = secondReturned.nextJourneyAt! + 1;
    const staysHome = await service.getProjection(userId, "oauth-a");
    expect(staysHome).toMatchObject({
      state: "AT_HOME",
      resting: false,
      queuedJourney: false,
      journey: null,
    });
    expect(discover).toHaveBeenCalledTimes(2);

    const atlas = await service.getAtlas(userId, "oauth-a");
    expect(atlas.journeys).toHaveLength(2);
    expect(atlas.journeys[0]?.inspirationLeaves).toBeGreaterThanOrEqual(2);
    expect(atlas.memories).toHaveLength(2);
    expect(await service.getAtlas(otherUserId, "oauth-b")).toEqual({ journeys: [], memories: [] });
    service.close();
  });

  it("uses production cadence after warm-up, never chains FAR trips, and unlocks milestone tools", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-cadence", "user-cadence");
    let now = 2_000_000;
    let idSequence = 0;
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => "cadence-" + (++idSequence),
      discover: async () => ({
        question: null,
        contentSource: "none" as const,
        knowledgeSource: "template" as const,
        sourceFetchedAt: now,
        postcardBody: "沿知识世界走了一趟。",
      }),
    });

    let current = await service.start(userId, "oauth-cadence", null);
    let previousKind: string | null = null;
    for (let trip = 1; trip <= 4; trip += 1) {
      expect(current.state).toBe("PREPARING");
      const journey = current.journey!;
      const awayDuration = journey.returnAt - journey.departAt;

      if (trip === 1) {
        expect(journey.kind).toBe("WARMUP");
        expect(awayDuration).toBeGreaterThanOrEqual(2 * 60_000);
        expect(awayDuration).toBeLessThanOrEqual(3 * 60_000);
      } else if (trip === 2) {
        expect(journey.kind).toBe("WARMUP");
        expect(awayDuration).toBeGreaterThanOrEqual(3 * 60_000);
        expect(awayDuration).toBeLessThanOrEqual(5 * 60_000);
      } else if (journey.kind === "FAR") {
        expect(awayDuration).toBeGreaterThanOrEqual(2 * 60 * 60_000);
        expect(awayDuration).toBeLessThanOrEqual(6 * 60 * 60_000);
      } else {
        expect(journey.kind).toBe("NORMAL");
        const inNormalBand = awayDuration >= 30 * 60_000 && awayDuration <= 90 * 60_000;
        const inLongBand = awayDuration >= 90 * 60_000 && awayDuration <= 180 * 60_000;
        expect(inNormalBand || inLongBand).toBe(true);
      }
      if (previousKind === "FAR") expect(journey.kind).not.toBe("FAR");
      previousKind = journey.kind;

      now = journey.returnAt;
      const returned = await service.getProjection(userId, "oauth-cadence");
      expect(returned.state).toBe("RETURNED");
      if (trip === 3) {
        expect(returned.game.primaryTools.find((tool) => tool.id === "magnifier")?.unlocked).toBe(true);
        expect(returned.game.primaryTools.find((tool) => tool.id === "old_camera")?.unlocked).toBe(false);
      }

      if (trip < 4) {
        const home = await service.archive(userId, "oauth-cadence");
        await service.start(userId, "oauth-cadence", null);
        now = home.nextJourneyAt!;
        current = await service.getProjection(userId, "oauth-cadence");
      }
    }
    service.close();
  });

  it("persists Home Activity, accrues and spends leaves, and consumes a small item only on departure", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-game", "user-game");
    let now = 1_000_000;
    let sequence = 0;
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => "game-" + (++sequence),
      discover: async () => ({
        question: null,
        contentSource: "none" as const,
        knowledgeSource: "template" as const,
        sourceFetchedAt: now,
        postcardBody: "这一趟只留下知识漫游札记。",
      }),
    });

    const initial = await service.getProjection(userId, "oauth-game");
    expect(initial).toMatchObject({
      state: "AT_HOME",
      queuedJourney: false,
      game: {
        leaves: { balance: 6, pendingHome: 0, passiveCap: 6 },
        loadout: { primaryToolId: "notebook", smallItemId: null },
      },
    });
    expect(initial.game.homeActivity?.type).toMatch(/READING|SORTING|WINDOW_WATCHING|IDLING/);
    expect(initial.game.primaryTools.find((tool) => tool.id === "notebook")?.unlocked).toBe(true);
    expect(initial.game.primaryTools.find((tool) => tool.id === "magnifier")?.unlocked).toBe(false);

    now += 60 * 60_000;
    const oneLeaf = await service.getProjection(userId, "oauth-game");
    expect(oneLeaf.game.leaves.pendingHome).toBe(1);

    now += 10 * 60 * 60_000;
    const capped = await service.getProjection(userId, "oauth-game");
    expect(capped.game.leaves.pendingHome).toBe(6);

    const collected = await service.collectHomeLeaves(userId, "oauth-game");
    expect(collected.game.leaves).toMatchObject({ balance: 12, pendingHome: 0 });

    const fish = await service.buySupply(userId, "oauth-game", "dried_fish");
    expect(fish.game.leaves.balance).toBe(10);
    const calendar = await service.buySupply(userId, "oauth-game", "pocket_calendar");
    expect(calendar.game.leaves.balance).toBe(7);
    const charm = await service.buySupply(userId, "oauth-game", "luck_charm");
    expect(charm.game.leaves.balance).toBe(3);
    expect(charm.game.supplies.map((item) => [item.id, item.quantity])).toEqual([
      ["dried_fish", 1],
      ["pocket_calendar", 1],
      ["luck_charm", 1],
    ]);

    await expect(service.setLoadout(userId, "oauth-game", {
      primaryToolId: "magnifier",
      smallItemId: null,
    })).rejects.toThrow("primary tool is locked");

    const loaded = await service.setLoadout(userId, "oauth-game", {
      primaryToolId: "notebook",
      smallItemId: "dried_fish",
    });
    expect(loaded.game.loadout).toEqual({
      primaryToolId: "notebook",
      smallItemId: "dried_fish",
    });

    const preparing = await service.start(userId, "oauth-game", null);
    expect(preparing.state).toBe("PREPARING");
    expect(preparing.journey).toMatchObject({
      primaryToolId: "notebook",
      smallItemId: "dried_fish",
      routeBias: null,
    });
    expect(preparing.game.supplies.find((item) => item.id === "dried_fish")?.quantity).toBe(1);

    now = preparing.journey!.departAt - 1;
    const stillPacking = await service.getProjection(userId, "oauth-game");
    expect(stillPacking.state).toBe("PREPARING");
    expect(stillPacking.game.supplies.find((item) => item.id === "dried_fish")?.quantity).toBe(1);

    now = preparing.journey!.departAt;
    const away = await service.getProjection(userId, "oauth-game");
    expect(away.state).toBe("AWAY");
    expect(away.journey?.smallItemId).toBe("dried_fish");
    expect(away.game.supplies.find((item) => item.id === "dried_fish")?.quantity).toBe(0);
    expect(away.game.loadout.smallItemId).toBeNull();

    now = preparing.journey!.returnAt;
    const returned = await service.getProjection(userId, "oauth-game");
    expect(returned.state).toBe("RETURNED");
    expect(returned.journey?.inspirationLeaves).toBeGreaterThanOrEqual(2);
    expect(returned.journey?.inspirationLeaves).toBeLessThanOrEqual(4);
    expect(returned.game.leaves.balance).toBe(
      3 + returned.journey!.inspirationLeaves!,
    );
    service.close();
  });

  it("supports a server-only rehearsal time scale without changing Journey semantics", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-a", "user-a");
    let now = 1_000;
    const service = new JourneyService({
      dbPath,
      now: () => now,
      timeScale: 0.02,
      createId: () => "journey-demo",
      discover: async () => ({
        question: null,
        contentSource: "none",
        knowledgeSource: "none",
        sourceFetchedAt: now,
        postcardBody: "排练模式也按同一状态机回来。",
      }),
    });

    const started = await service.start(userId, "oauth-a", null);
    expect(started.journey!.departAt - started.journey!.createdAt).toBe(1_000);
    expect(started.journey!.returnAt - started.journey!.departAt).toBeGreaterThanOrEqual(2_400);
    expect(started.journey!.returnAt - started.journey!.departAt).toBeLessThanOrEqual(3_600);
    now = started.journey!.returnAt;
    expect((await service.getProjection(userId, "oauth-a")).state).toBe("RETURNED");
    service.close();
  });

  it("migrates the legacy Journey schema and preserves an already queued paper note", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-legacy", "user-legacy");
    const legacy = new DatabaseSync(dbPath);
    legacy.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE journeys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        state TEXT NOT NULL CHECK (state IN ('PREPARING', 'AWAY', 'RETURNED')),
        route_bias TEXT,
        created_at INTEGER NOT NULL,
        depart_at INTEGER NOT NULL,
        return_at INTEGER NOT NULL,
        plan_seed TEXT NOT NULL,
        engine_version TEXT NOT NULL,
        materialized_at INTEGER,
        returned_at INTEGER,
        archived_at INTEGER
      );
      CREATE TABLE journey_user_state (
        user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
        next_eligible_at INTEGER,
        queued_route_bias TEXT,
        updated_at INTEGER NOT NULL
      );
    `);
    legacy.prepare(`
      INSERT INTO journey_user_state (user_id, next_eligible_at, queued_route_bias, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, 20_000, "看看反对意见", 1_000);
    legacy.close();

    let now = 10_000;
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => "legacy-journey",
      discover: async () => ({
        question: null,
        contentSource: "none" as const,
        knowledgeSource: "template" as const,
        sourceFetchedAt: now,
        postcardBody: "迁移后的旧纸条仍然有效。",
      }),
    });

    const home = await service.getProjection(userId, "oauth-legacy");
    expect(home).toMatchObject({
      state: "AT_HOME",
      resting: true,
      queuedJourney: true,
      queuedRouteBias: "看看反对意见",
      game: { leaves: { balance: 6 } },
    });
    service.close();

    const migrated = new DatabaseSync(dbPath);
    const journeyColumns = migrated.prepare("PRAGMA table_info(journeys)").all() as unknown as Array<{ name: string }>;
    const stateColumns = migrated.prepare("PRAGMA table_info(journey_user_state)").all() as unknown as Array<{ name: string }>;
    expect(journeyColumns.map((column) => column.name)).toEqual(expect.arrayContaining([
      "journey_kind",
      "primary_tool_id",
      "small_item_id",
      "small_item_consumed_at",
    ]));
    expect(stateColumns.map((column) => column.name)).toContain("queued_ready");
    migrated.close();
  });

  it("returns on schedule without fabricating content when discovery fails", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-a", "user-a");
    let now = 5_000;
    const service = new JourneyService({
      dbPath,
      now: () => now,
      createId: () => "journey-a",
      discover: async () => {
        throw new Error("upstream unavailable");
      },
    });

    const started = await service.start(userId, "oauth-a", null);
    now = started.journey!.returnAt;
    const returned = await service.getProjection(userId, "oauth-a");
    expect(returned.state).toBe("RETURNED");
    expect(returned.journey?.question).toBeNull();
    expect(returned.journey?.artifact).toBeNull();
    expect(returned.journey?.contentSource).toBe("none");
    expect(returned.journey?.postcard?.body).not.toContain("按时回家");
    expect(returned.journey?.postcard?.body.length).toBeGreaterThan(10);
    service.close();
  });
});
