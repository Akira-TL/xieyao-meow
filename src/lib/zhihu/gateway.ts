import type { z } from "zod";

import {
  collectionsEnvelopeSchema,
  contentsEnvelopeSchema,
  favlistsEnvelopeSchema,
  followeesEnvelopeSchema,
  oauthTokenSchema,
} from "./schemas";
import type {
  GetUserProfileInput,
  OAuthSession,
  UserProfile,
  ZhihuCollection,
  ZhihuContent,
  ZhihuFavlist,
  ZhihuFollowee,
  ZhihuOAuthConfig,
} from "./types";

const DATA_BASE_URL = "https://developer.zhihu.com";
const OAUTH_BASE_URL = "https://openapi.zhihu.com";

export interface ZhihuGatewayOptions {
  accessSecret: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  oauth?: ZhihuOAuthConfig;
  retry?: {
    attempts: number;
    delayMs: number;
  };
}

export class ZhihuApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "ZhihuApiError";
  }
}

export class ZhihuGateway {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly options: ZhihuGatewayOptions) {
    if (!options.accessSecret.trim()) {
      throw new Error("Zhihu Access Secret is required");
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  getAuthorizationUrl(): string {
    const oauth = this.requireOAuthConfig();
    const url = new URL("/authorize", OAUTH_BASE_URL);
    url.searchParams.set("redirect_uri", oauth.redirectUri);
    url.searchParams.set("app_id", oauth.appId);
    url.searchParams.set("response_type", "code");
    return url.toString();
  }

  async exchangeAuthorizationCode(code: string): Promise<OAuthSession> {
    const oauth = this.requireOAuthConfig();
    if (!code.trim()) {
      throw new Error("Authorization code is required");
    }

    const body = new URLSearchParams({
      app_id: oauth.appId,
      app_key: oauth.appKey,
      grant_type: "authorization_code",
      redirect_uri: oauth.redirectUri,
      code,
    });

    const response = await this.fetchImpl(`${OAUTH_BASE_URL}/access_token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Zhihu OAuth token exchange failed with HTTP ${response.status}`);
    }

    const payload = oauthTokenSchema.parse(await response.json());
    return {
      accessToken: payload.access_token,
      tokenType: payload.token_type,
      expiresIn: payload.expires_in,
    };
  }

  async getUserProfile(input: GetUserProfileInput = {}): Promise<UserProfile> {
    const [contents, followees, collections, favlists] = await Promise.all([
      this.getUserContents(input.oauthAccessToken),
      this.getUserFollowees(input.oauthAccessToken),
      this.getUserCollections(input.oauthAccessToken),
      this.getUserFavlists(input.oauthAccessToken),
    ]);

    return {
      fetchedAt: Math.floor(this.now() / 1000),
      contents,
      followees,
      collections,
      favlists,
    };
  }

  private async getUserContents(oauthAccessToken?: string): Promise<ZhihuContent[]> {
    const payload = await this.getJson(
      "/api/v1/user/contents",
      { ContentType: "all", Limit: "50", Offset: "0" },
      contentsEnvelopeSchema,
      oauthAccessToken,
    );
    const data = this.requireSuccessData(payload.Code, payload.Message, payload.Data);
    return data.Items.map((item) => ({
      contentType: item.ContentType,
      url: item.Url,
      createdAt: item.CreatedAt,
      likeCount: item.LikeCount,
      commentCount: item.CommentCount,
      favoriteCount: item.FavoriteCount,
      title: item.Title,
      summary: item.Summary,
    }));
  }

  private async getUserFollowees(oauthAccessToken?: string): Promise<ZhihuFollowee[]> {
    const payload = await this.getJson(
      "/api/v1/user/followees",
      { Limit: "50", Offset: "0" },
      followeesEnvelopeSchema,
      oauthAccessToken,
    );
    const data = this.requireSuccessData(payload.Code, payload.Message, payload.Data);
    return data.Items.map((item) => ({
      fullname: item.Fullname,
      urlToken: item.UrlToken,
      url: item.Url,
      avatarUrl: item.AvatarUrl,
      headline: item.Headline,
      gender: item.Gender,
      followerCount: item.FollowerCount,
    }));
  }

  private async getUserCollections(oauthAccessToken?: string): Promise<ZhihuCollection[]> {
    const payload = await this.getJson(
      "/api/v1/user/collections",
      { Limit: "20" },
      collectionsEnvelopeSchema,
      oauthAccessToken,
    );
    const data = this.requireSuccessData(payload.Code, payload.Message, payload.Data);
    return data.Items.map((item) => ({
      contentType: item.ContentType,
      url: item.Url,
      createdAt: item.CreatedAt,
      favTime: item.FavTime,
      likeCount: item.LikeCount,
      commentCount: item.CommentCount,
      favoriteCount: item.FavoriteCount,
      title: item.Title,
      summary: item.Summary,
      favlists: item.Favlists.map((favlist) => ({
        urlToken: favlist.UrlToken,
        title: favlist.Title,
        url: favlist.Url,
      })),
      ...(item.Author
        ? {
            author: {
              name: item.Author.Name,
              urlToken: item.Author.UrlToken,
              url: item.Author.Url,
              gender: item.Author.Gender,
              headline: item.Author.Headline,
            },
          }
        : {}),
    }));
  }

  private async getUserFavlists(oauthAccessToken?: string): Promise<ZhihuFavlist[]> {
    const payload = await this.getJson(
      "/api/v1/user/favlists",
      { Limit: "20" },
      favlistsEnvelopeSchema,
      oauthAccessToken,
    );
    const data = this.requireSuccessData(payload.Code, payload.Message, payload.Data);
    return data.Items.map((item) => ({
      urlToken: item.UrlToken,
      url: item.Url,
      title: item.Title,
      description: item.Description,
      isPublic: item.IsPublic,
    }));
  }

  private async getJson<TSchema extends z.ZodType>(
    path: string,
    query: Record<string, string>,
    schema: TSchema,
    oauthAccessToken?: string,
  ): Promise<z.infer<TSchema>> {
    const url = new URL(path, DATA_BASE_URL);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const headers = new Headers({
      authorization: `Bearer ${this.options.accessSecret}`,
      "content-type": "application/json",
      "x-request-timestamp": String(Math.floor(this.now() / 1000)),
    });
    if (oauthAccessToken) {
      headers.set("x-oauth-token", oauthAccessToken);
    }

    const response = await this.fetchWithRetry(url, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error(`Zhihu API request failed with HTTP ${response.status}`);
    }
    return schema.parse(await response.json());
  }

  private async fetchWithRetry(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const retry = this.options.retry ?? { attempts: 2, delayMs: 150 };
    const attempts = Math.max(1, retry.attempts);

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.fetchImpl(input, init);
      } catch (error) {
        if (attempt === attempts) {
          throw error;
        }
        if (retry.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, retry.delayMs));
        }
      }
    }

    throw new Error("unreachable");
  }

  private requireSuccessData<T>(code: number, message: string, data: T | null): T {
    if (code !== 0) {
      throw new ZhihuApiError(code, message);
    }
    if (data === null) {
      throw new ZhihuApiError(code, "Zhihu API returned no data");
    }
    return data;
  }

  private requireOAuthConfig(): ZhihuOAuthConfig {
    if (!this.options.oauth) {
      throw new Error("Zhihu OAuth is not configured");
    }
    return this.options.oauth;
  }
}

export function createZhihuGateway(options: ZhihuGatewayOptions): ZhihuGateway {
  return new ZhihuGateway(options);
}
