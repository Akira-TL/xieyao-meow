import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AccountStore } from "@/lib/auth/account-store";

const cleanup: string[] = [];

afterEach(() => {
  for (const directory of cleanup.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function tempDbPath(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "xieyao-account-"));
  cleanup.push(directory);
  return path.join(directory, "account.sqlite");
}

describe("AccountStore", () => {
  it("maps the same OAuth subject to one User and keeps different subjects isolated", () => {
    const dbPath = tempDbPath();
    const ids = ["user-a", "user-b"];
    const store = new AccountStore({ dbPath, createId: () => ids.shift() ?? "unexpected" });

    const first = store.resolveOrCreateOAuthUser("zhihu", "subject-a");
    const same = store.resolveOrCreateOAuthUser("zhihu", "subject-a");
    const other = store.resolveOrCreateOAuthUser("zhihu", "subject-b");

    expect(first).toBe("user-a");
    expect(same).toBe("user-a");
    expect(other).toBe("user-b");
    expect(other).not.toBe(first);
    store.close();
  });

  it("persists unexpired Sessions across store restarts and expires them by server time", () => {
    const dbPath = tempDbPath();
    let now = 1_000;
    const firstStore = new AccountStore({
      dbPath,
      now: () => now,
      createId: () => "user-a",
      createSessionId: () => "session-a",
    });
    const userId = firstStore.resolveOrCreateOAuthUser("zhihu", "subject-a");
    firstStore.createSession(userId, "oauth-secret", 10);
    firstStore.close();

    const restartedStore = new AccountStore({ dbPath, now: () => now });
    expect(restartedStore.getSession("session-a")).toEqual({
      userId: "user-a",
      accessToken: "oauth-secret",
      expiresAt: 11_000,
    });

    now = 11_001;
    expect(restartedStore.getSession("session-a")).toBeNull();
    restartedStore.close();
  });

  it("claims only anonymous cat name and appearance once without crossing Users", () => {
    const dbPath = tempDbPath();
    const ids = ["user-a", "user-b"];
    const store = new AccountStore({
      dbPath,
      now: () => 5_000,
      createId: () => ids.shift() ?? "unexpected",
    });
    const userA = store.resolveOrCreateOAuthUser("zhihu", "subject-a");
    const userB = store.resolveOrCreateOAuthUser("zhihu", "subject-b");

    store.updateAnonymousProfile("anonymous-browser", {
      catName: "阿问",
      appearanceId: "engineer-blue",
    });

    expect(store.claimAnonymousProfile("anonymous-browser", userA)).toBe("claimed");
    expect(store.getUserProfile(userA)).toMatchObject({
      catName: "阿问",
      appearanceId: "engineer-blue",
    });
    expect(store.claimAnonymousProfile("anonymous-browser", userB)).toBe("conflict");
    expect(store.getUserProfile(userB)).toMatchObject({
      catName: "小谢",
      appearanceId: null,
    });
    store.close();
  });

  it("never lets anonymous values overwrite an existing formal profile", () => {
    const store = new AccountStore({
      dbPath: tempDbPath(),
      createId: () => "user-a",
    });
    const userId = store.resolveOrCreateOAuthUser("zhihu", "subject-a");
    store.updateUserProfile(userId, {
      catName: "正式猫",
      appearanceId: "analyst-black",
    });
    store.updateAnonymousProfile("anonymous-browser", {
      catName: "匿名猫",
      appearanceId: "traveler-blue",
    });

    expect(store.claimAnonymousProfile("anonymous-browser", userId)).toBe("formal-profile-kept");
    expect(store.getUserProfile(userId)).toMatchObject({
      catName: "正式猫",
      appearanceId: "analyst-black",
    });
    store.close();
  });
});
