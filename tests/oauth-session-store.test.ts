import { describe, expect, it } from "vitest";

import { OAuthSessionStore } from "@/lib/auth/session-store";

describe("OAuthSessionStore", () => {
  it("keeps OAuth access tokens server-side behind an opaque session id", () => {
    const store = new OAuthSessionStore({
      now: () => 1_000_000,
      createId: () => "opaque-session-id",
    });

    const created = store.create("oauth-secret-token", 3600);

    expect(created).toEqual({ id: "opaque-session-id", expiresAt: 4_600_000 });
    expect(created.id).not.toContain("oauth-secret-token");
    expect(store.get(created.id)).toEqual({
      accessToken: "oauth-secret-token",
      expiresAt: 4_600_000,
    });
  });

  it("expires sessions and can revoke them explicitly", () => {
    let now = 5_000;
    const store = new OAuthSessionStore({
      now: () => now,
      createId: () => "session-1",
    });

    store.create("token", 2);
    expect(store.get("session-1")?.accessToken).toBe("token");

    now = 7_001;
    expect(store.get("session-1")).toBeNull();

    now = 8_000;
    store.create("token-2", 10);
    store.delete("session-1");
    expect(store.get("session-1")).toBeNull();
  });
});
