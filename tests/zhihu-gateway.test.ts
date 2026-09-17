import { describe, expect, it } from "vitest";

import { createZhihuGateway } from "@/lib/zhihu";

type RecordedRequest = {
  url: string;
  init?: RequestInit;
};

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("ZhihuGateway", () => {
  it("builds a normalized user profile through the official user-data endpoints", async () => {
    const requests: RecordedRequest[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requests.push({ url, init });
      const pathname = new URL(url).pathname;

      if (pathname === "/api/v1/user/contents") {
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: {
            Items: [
              {
                ContentType: "answer",
                Url: "https://www.zhihu.com/question/1/answer/2",
                CreatedAt: 1745486539,
                LikeCount: 12,
                CommentCount: 3,
                FavoriteCount: 5,
                Title: "如何理解 Agent？",
                Summary: "回答摘要",
              },
            ],
            Paging: { IsEnd: true, Totals: 1 },
          },
        });
      }

      if (pathname === "/api/v1/user/followees") {
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: {
            Items: [
              {
                Fullname: "示例用户",
                UrlToken: "example-user",
                Url: "https://www.zhihu.com/people/example-user",
                AvatarUrl: "https://picx.zhimg.com/example.jpg",
                Headline: "关注 AI 与开发者工具",
                Gender: 0,
                FollowerCount: 42,
              },
            ],
            Paging: { IsEnd: true, Totals: 1 },
          },
        });
      }

      if (pathname === "/api/v1/user/collections") {
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: {
            Items: [
              {
                ContentType: "article",
                Url: "https://zhuanlan.zhihu.com/p/1",
                CreatedAt: 1745486539,
                FavTime: 1746000000,
                LikeCount: 9,
                CommentCount: 2,
                FavoriteCount: 4,
                Title: "Agent 工程实践",
                Summary: "收藏摘要",
                Favlists: [
                  {
                    UrlToken: 123,
                    Title: "AI",
                    Url: "https://www.zhihu.com/collection/123",
                  },
                ],
              },
            ],
          },
        });
      }

      if (pathname === "/api/v1/user/favlists") {
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: {
            Items: [
              {
                UrlToken: 123,
                Url: "https://www.zhihu.com/collection/123",
                Title: "AI",
                Description: "Agent 与大模型",
                IsPublic: true,
              },
            ],
          },
        });
      }

      throw new Error(`unexpected request: ${url}`);
    };

    const gateway = createZhihuGateway({
      accessSecret: "test-access-secret",
      fetchImpl,
      now: () => 1_742_822_400_000,
    });

    const profile = await gateway.getUserProfile({ oauthAccessToken: "oauth-user-token" });

    expect(profile.contents).toEqual([
      {
        contentType: "answer",
        url: "https://www.zhihu.com/question/1/answer/2",
        createdAt: 1745486539,
        likeCount: 12,
        commentCount: 3,
        favoriteCount: 5,
        title: "如何理解 Agent？",
        summary: "回答摘要",
      },
    ]);
    expect(profile.followees[0]?.headline).toBe("关注 AI 与开发者工具");
    expect(profile.collections[0]?.favlists[0]?.title).toBe("AI");
    expect(profile.favlists[0]?.isPublic).toBe(true);

    expect(requests).toHaveLength(4);
    for (const request of requests) {
      const headers = new Headers(request.init?.headers);
      expect(headers.get("authorization")).toBe("Bearer test-access-secret");
      expect(headers.get("x-request-timestamp")).toBe("1742822400");
      expect(headers.get("x-oauth-token")).toBe("oauth-user-token");
    }
  });

  it("reads one public favorite-list page through the official favlist_contents endpoint", async () => {
    const requests: RecordedRequest[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requests.push({ url, init });
      return jsonResponse({
        Code: 0,
        Message: "success",
        Data: {
          Items: [
            {
              ContentType: "answer",
              Url: "https://www.zhihu.com/question/2/answer/3",
              CreatedAt: 1745486539,
              FavTime: 1746000000,
              LikeCount: 7,
              CommentCount: 1,
              FavoriteCount: 2,
              Title: "一个收藏里的问题",
              Summary: "收藏内容摘要",
              Favlists: [{ UrlToken: 123, Title: "AI", Url: "https://www.zhihu.com/collection/123" }],
            },
          ],
          Paging: { IsEnd: true, Totals: 1 },
        },
      });
    };

    const gateway = createZhihuGateway({
      accessSecret: "test-access-secret",
      fetchImpl,
      now: () => 1_742_822_400_000,
    });

    const items = await gateway.getUserFavlistContents("123", "oauth-user-token");
    expect(items[0]?.title).toBe("一个收藏里的问题");
    expect(new URL(requests[0]!.url).searchParams.get("FavlistUrlToken")).toBe("123");
    const headers = new Headers(requests[0]?.init?.headers);
    expect(headers.get("x-oauth-token")).toBe("oauth-user-token");
  });

  it("retries a transient network failure before returning a user profile", async () => {
    let contentAttempts = 0;
    const fetchImpl: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const pathname = new URL(url).pathname;

      if (pathname === "/api/v1/user/contents") {
        contentAttempts += 1;
        if (contentAttempts === 1) {
          throw new TypeError("transient network failure");
        }
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: { Items: [], Paging: { IsEnd: true, Totals: 0 } },
        });
      }

      if (pathname === "/api/v1/user/followees") {
        return jsonResponse({
          Code: 0,
          Message: "success",
          Data: { Items: [], Paging: { IsEnd: true, Totals: 0 } },
        });
      }

      if (pathname === "/api/v1/user/collections" || pathname === "/api/v1/user/favlists") {
        return jsonResponse({ Code: 0, Message: "success", Data: { Items: [] } });
      }

      throw new Error(`unexpected request: ${url}`);
    };

    const gateway = createZhihuGateway({
      accessSecret: "test-access-secret",
      fetchImpl,
      retry: { attempts: 2, delayMs: 0 },
    });

    await expect(gateway.getUserProfile()).resolves.toMatchObject({
      contents: [],
      followees: [],
      collections: [],
      favlists: [],
    });
    expect(contentAttempts).toBe(2);
  });

  it("builds the official authorization URL and exchanges an authorization code on the server", async () => {
    const requests: RecordedRequest[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requests.push({ url, init });
      return jsonResponse({
        access_token: "oauth-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      });
    };

    const gateway = createZhihuGateway({
      fetchImpl,
      oauth: {
        appId: "12345",
        appKey: "server-only-app-key",
        redirectUri: "https://example.com/api/auth/zhihu/callback",
      },
    });

    const authorizeUrl = new URL(gateway.getAuthorizationUrl());
    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe("https://openapi.zhihu.com/authorize");
    expect(authorizeUrl.searchParams.get("app_id")).toBe("12345");
    expect(authorizeUrl.searchParams.get("redirect_uri")).toBe("https://example.com/api/auth/zhihu/callback");
    expect(authorizeUrl.searchParams.get("response_type")).toBe("code");
    expect(authorizeUrl.toString()).not.toContain("server-only-app-key");

    const session = await gateway.exchangeAuthorizationCode("authorization-code");
    expect(session).toEqual({
      accessToken: "oauth-access-token",
      tokenType: "Bearer",
      expiresIn: 3600,
    });

    const tokenRequest = requests.at(-1);
    expect(tokenRequest?.url).toBe("https://openapi.zhihu.com/access_token");
    expect(tokenRequest?.init?.method).toBe("POST");
    expect(tokenRequest?.init?.body).toBeInstanceOf(URLSearchParams);
    const body = tokenRequest?.init?.body as URLSearchParams;
    expect(body.get("app_id")).toBe("12345");
    expect(body.get("app_key")).toBe("server-only-app-key");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("redirect_uri")).toBe("https://example.com/api/auth/zhihu/callback");
    expect(body.get("code")).toBe("authorization-code");
  });

  it("resolves the OAuth user through the stable id returned by the /user endpoint", async () => {
    const requests: RecordedRequest[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requests.push({ url, init });
      return jsonResponse({
        data: {
          uid: "zhihu-user-opaque-id",
          fullname: "示例用户",
          avatar_path: "https://picx.zhimg.com/avatar.jpg",
          headline: "关注 Agent",
          url: "https://www.zhihu.com/people/example",
        },
      });
    };
    const gateway = createZhihuGateway({
      accessSecret: "test-access-secret",
      fetchImpl,
    });

    await expect(gateway.getOAuthUserIdentity("oauth-user-token")).resolves.toEqual({
      providerSubject: "zhihu-user-opaque-id",
      name: "示例用户",
      avatarUrl: "https://picx.zhimg.com/avatar.jpg",
      headline: "关注 Agent",
      url: "https://www.zhihu.com/people/example",
    });
    expect(requests[0]?.url).toBe("https://openapi.zhihu.com/user");
    const headers = new Headers(requests[0]?.init?.headers);
    expect(headers.get("authorization")).toBe("Bearer oauth-user-token");
    expect(headers.get("x-oauth-token")).toBeNull();
  });

  it("fails closed when the OAuth /user response has no uid", async () => {
    const gateway = createZhihuGateway({
      accessSecret: "test-access-secret",
      fetchImpl: async () => jsonResponse({
        data: {
          id: "legacy-id-must-not-be-used",
          fullname: "只有昵称",
          url_token: "mutable-slug",
        },
      }),
    });

    await expect(gateway.getOAuthUserIdentity("oauth-user-token")).rejects.toThrow(
      "Zhihu OAuth user response has no uid",
    );
  });
});
