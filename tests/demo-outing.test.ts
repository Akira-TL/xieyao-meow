import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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
  it("freezes a 3–5 minute first Journey and materializes its return only once", async () => {
    const dbPath = createDbPath();
    const userId = createUser(dbPath, "subject-a", "user-a");
    let now = 1_000_000;
    let sequence = 0;
    const discover = vi.fn(async () => ({
      question: {
        title: "真实问题",
        url: "https://www.zhihu.com/question/123",
        summary: "真实摘要",
      },
      contentSource: "live" as const,
      knowledgeSource: "template" as const,
      sourceFetchedAt: now,
      postcardBody: "它把这个真实问题叼回来了。",
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
    expect(preparing.journey!.returnAt - now).toBeGreaterThanOrEqual(180_000);
    expect(preparing.journey!.returnAt - now).toBeLessThanOrEqual(300_000);
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

    const repeated = await service.getProjection(userId, "oauth-a");
    expect(repeated).toEqual(returned);
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

  it("uses warm-up bands, rests, consumes one route bias, and caps offline catch-up at three", async () => {
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
      createId: () => `id-${++sequence}`,
      discover,
    });

    const first = await service.start(userId, "oauth-a", "多看看 AI");
    now = first.journey!.returnAt;
    const firstReturned = await service.getProjection(userId, "oauth-a");
    expect(firstReturned.nextJourneyAt! - first.journey!.returnAt).toBeGreaterThanOrEqual(30 * 60_000);
    expect(firstReturned.nextJourneyAt! - first.journey!.returnAt).toBeLessThanOrEqual(90 * 60_000);

    const resting = await service.archive(userId, "oauth-a");
    expect(resting).toMatchObject({ state: "AT_HOME", resting: true });
    const queued = await service.start(userId, "oauth-a", "去陌生地方");
    expect(queued).toMatchObject({
      state: "AT_HOME",
      resting: true,
      queuedRouteBias: "去陌生地方",
    });

    now = queued.nextJourneyAt!;
    const second = await service.getProjection(userId, "oauth-a");
    expect(second.state).toBe("PREPARING");
    expect(second.journey?.routeBias).toBe("去陌生地方");
    expect(second.journey!.returnAt - second.journey!.createdAt).toBeGreaterThanOrEqual(10 * 60_000);
    expect(second.journey!.returnAt - second.journey!.createdAt).toBeLessThanOrEqual(20 * 60_000);

    now = second.journey!.returnAt;
    const secondReturned = await service.getProjection(userId, "oauth-a");
    await service.archive(userId, "oauth-a");
    now = secondReturned.nextJourneyAt!;
    const third = await service.getProjection(userId, "oauth-a");
    expect(third.journey?.routeBias).toBeNull();
    expect(third.journey!.returnAt - third.journey!.createdAt).toBeGreaterThanOrEqual(20 * 60_000);
    expect(third.journey!.returnAt - third.journey!.createdAt).toBeLessThanOrEqual(40 * 60_000);

    now = third.journey!.createdAt + 24 * 60 * 60_000;
    const caughtUp = await service.getProjection(userId, "oauth-a");
    expect(caughtUp).toMatchObject({ state: "AT_HOME", resting: true });
    expect(discover).toHaveBeenCalledTimes(5);
    await service.getProjection(userId, "oauth-a");
    expect(discover).toHaveBeenCalledTimes(5);

    const atlas = await service.getAtlas(userId, "oauth-a");
    expect(atlas.journeys).toHaveLength(5);
    expect(atlas.journeys.filter((entry) => entry.artifact)).toHaveLength(1);
    expect(atlas.memories).toHaveLength(5);
    expect(atlas.memories[0]?.sourceEventId).toBeTruthy();
    expect(await service.getAtlas(otherUserId, "oauth-b")).toEqual({ journeys: [], memories: [] });
    service.close();
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
    expect(returned.journey?.postcard?.body).toContain("按时回家");
    service.close();
  });
});
