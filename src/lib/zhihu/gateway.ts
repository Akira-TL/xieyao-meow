import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";

import { resolveDatabasePath } from "@/lib/persistence/database-path";

import {
  collectionsEnvelopeSchema,
  contentsEnvelopeSchema,
  favlistContentsEnvelopeSchema,
  favlistsEnvelopeSchema,
  followeesEnvelopeSchema,
  oauthTokenSchema,
  questionAnswersEnvelopeSchema,
  zhidaCompletionSchema,
} from "./schemas";
import type {
  GetUserProfileInput,
  OAuthSession,
  UserProfile,
  ZhihuCollection,
  ZhihuContent,
  ZhihuFavlist,
  ZhihuAnswerSummary,
  ZhihuFollowee,
  ZhihuHotItem,
  ZhihuOAuthConfig,
  ZhihuOAuthUserIdentity,
  ZhihuSearchItem,
  ZhidaRequest,
  ZhidaResult,
} from "./types";

const DATA_BASE_URL = "https://developer.zhihu.com";
const OAUTH_BASE_URL = "https://openapi.zhihu.com";

export interface ZhihuGatewayOptions {
  accessSecret?: string;
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

type ZhihuRuntimeState = {
  dataApiQueue?: Promise<void>;
  lastDataApiAt?: number;
  hotListCache?: { fetchedAt: number; items: ZhihuHotItem[] };
  hotListInFlight?: Promise<ZhihuHotItem[]>;
  searchCache?: Map<string, { fetchedAt: number; items: ZhihuSearchItem[] }>;
  searchCacheLoaded?: boolean;
  searchInFlight?: Map<string, Promise<ZhihuSearchItem[]>>;
  zhihuSearchBlockedUntil?: number;
};

const zhihuRuntime = globalThis as typeof globalThis & { __xieyaoZhihuRuntime?: ZhihuRuntimeState };
zhihuRuntime.__xieyaoZhihuRuntime ??= {};
const sharedRuntime = zhihuRuntime.__xieyaoZhihuRuntime;
const DATA_API_MIN_INTERVAL_MS = 1_050;
const HOT_LIST_TTL_MS = 5 * 60_000;
const HOT_LIST_STALE_MS = 6 * 60 * 60_000;
const SEARCH_TTL_MS = 10 * 60_000;
const SEARCH_STALE_MS = 24 * 60 * 60_000;

function searchCachePath(): string {
  return path.join(path.dirname(resolveDatabasePath()), "zhihu-search-cache.json");
}

function ensureSearchCacheLoaded(): void {
  if (sharedRuntime.searchCacheLoaded) return;
  sharedRuntime.searchCacheLoaded = true;
  sharedRuntime.searchCache ??= new Map();
  try {
    const raw = JSON.parse(readFileSync(searchCachePath(), "utf8")) as Array<[
      string,
      { fetchedAt: number; items: ZhihuSearchItem[] },
    ]>;
    for (const [key, entry] of raw) {
      if (key && Number.isFinite(entry?.fetchedAt) && Array.isArray(entry?.items)) {
        sharedRuntime.searchCache.set(key, entry);
      }
    }
  } catch {
    // No durable cache yet.
  }
}

function persistSearchCache(): void {
  const target = searchCachePath();
  const temp = `${target}.tmp`;
  mkdirSync(path.dirname(target), { recursive: true });
  const entries = [...(sharedRuntime.searchCache ?? new Map()).entries()]
    .sort((left, right) => right[1].fetchedAt - left[1].fetchedAt)
    .slice(0, 20);
  writeFileSync(temp, JSON.stringify(entries), "utf8");
  renameSync(temp, target);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleDataApiRequest<T>(task: () => Promise<T>): Promise<T> {
  const previous = sharedRuntime.dataApiQueue ?? Promise.resolve();
  let resolveQueue!: () => void;
  sharedRuntime.dataApiQueue = new Promise<void>((resolve) => {
    resolveQueue = resolve;
  });
  await previous.catch(() => undefined);
  const delay = Math.max(0, (sharedRuntime.lastDataApiAt ?? 0) + DATA_API_MIN_INTERVAL_MS - Date.now());
  if (delay > 0) await wait(delay);
  try {
    return await task();
  } finally {
    sharedRuntime.lastDataApiAt = Date.now();
    resolveQueue();
  }
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseXmlAttribute(source: string, name: string): string {
  const match = source.match(new RegExp(`${name}="([\\s\\S]*?)"`));
  return decodeXml(match?.[1] ?? "").trim();
}

function parseZhihuSearchXml(xml: string): ZhihuSearchItem[] {
  const items: ZhihuSearchItem[] = [];
  const pattern = /<search_item\b([^>]*)>([\s\S]*?)<\/search_item>/g;
  for (const match of xml.matchAll(pattern)) {
    const attributes = match[1] ?? "";
    const title = parseXmlAttribute(attributes, "title").replace(/\s*-\s*知乎\s*$/u, "");
    const url = parseXmlAttribute(attributes, "url");
    if (!title || !url) continue;
    const score = Number(parseXmlAttribute(attributes, "ranking_score"));
    const body = decodeXml((match[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
    items.push({
      title,
      url,
      summary: body,
      contentType: parseXmlAttribute(attributes, "content_type"),
      rankingScore: Number.isFinite(score) ? score : 0,
    });
  }
  return items;
}

function parseXmlTag(source: string, name: string): string {
  const match = source.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
  return decodeXml(match?.[1] ?? "").replace(/\s+/g, " ").trim();
}

function parseHotListXml(xml: string): ZhihuHotItem[] {
  const items: ZhihuHotItem[] = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const body = match[1] ?? "";
    const title = parseXmlTag(body, "title");
    const url = parseXmlTag(body, "url");
    if (!title || !url) continue;
    items.push({
      title,
      url,
      thumbnailUrl: parseXmlTag(body, "thumbnail_url"),
      summary: parseXmlTag(body, "summary"),
    });
  }
  return items;
}

export class ZhihuGateway {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly options: ZhihuGatewayOptions) {
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

  async getOAuthUserIdentity(oauthAccessToken: string): Promise<ZhihuOAuthUserIdentity> {
    const token = oauthAccessToken.trim();
    if (!token) throw new Error("OAuth access token is required");

    const response = await this.fetchWithRetry(new URL("/user", OAUTH_BASE_URL), {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Zhihu OAuth user request failed with HTTP ${response.status}`);
    }

    const payload = await response.json() as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Zhihu OAuth user response is not an object");
    }
    const envelope = payload as Record<string, unknown>;
    const code = typeof envelope.code === "number" ? envelope.code : 0;
    if (code !== 0) {
      throw new Error(`Zhihu OAuth user request failed with code ${code}`);
    }

    const sourceCandidate = envelope.data ?? envelope;
    if (!sourceCandidate || typeof sourceCandidate !== "object" || Array.isArray(sourceCandidate)) {
      throw new Error("Zhihu OAuth user response has no user object");
    }
    const source = sourceCandidate as Record<string, unknown>;
    const rawSubject = source.uid;
    const providerSubject =
      typeof rawSubject === "string" || typeof rawSubject === "number"
        ? String(rawSubject).trim()
        : "";
    if (!providerSubject) {
      throw new Error("Zhihu OAuth user response has no uid");
    }

    const stringField = (name: string): string | undefined => {
      const value = source[name];
      return typeof value === "string" && value.trim() ? value.trim() : undefined;
    };

    return {
      providerSubject,
      ...(stringField("fullname") ? { name: stringField("fullname") } : {}),
      ...(stringField("avatar_path") ? { avatarUrl: stringField("avatar_path") } : {}),
      ...(stringField("headline") ? { headline: stringField("headline") } : {}),
      ...(stringField("url") ? { url: stringField("url") } : {}),
    };
  }

  async getUserProfile(input: GetUserProfileInput = {}): Promise<UserProfile> {
    const readSignal = async <T>(load: () => Promise<T[]>): Promise<T[]> => {
      try {
        return await load();
      } catch (error) {
        console.warn(
          "[zhihu-profile] signal unavailable",
          error instanceof Error ? error.message : "unknown error",
        );
        return [];
      }
    };
    const pause = () => new Promise((resolve) => setTimeout(resolve, 1_050));

    const contents = await readSignal(() => this.getUserContents(input.oauthAccessToken));
    await pause();
    const followees = await readSignal(() => this.getUserFollowees(input.oauthAccessToken));
    await pause();
    const collections = await readSignal(() => this.getUserCollections(input.oauthAccessToken));
    await pause();
    const favlists = await readSignal(() => this.getUserFavlists(input.oauthAccessToken));

    return {
      fetchedAt: Math.floor(this.now() / 1000),
      contents,
      followees,
      collections,
      favlists,
    };
  }

  async getHotList(limit = 30): Promise<ZhihuHotItem[]> {
    const now = this.now();
    const cached = sharedRuntime.hotListCache;
    if (cached && now - cached.fetchedAt < HOT_LIST_TTL_MS) {
      return cached.items.slice(0, limit);
    }
    if (sharedRuntime.hotListInFlight) {
      return (await sharedRuntime.hotListInFlight).slice(0, limit);
    }

    const pending = (async () => {
      try {
        const xml = await scheduleDataApiRequest(() => this.callSseMcpTool(
          "/api/mcp/hot_list/v1",
          "hot_list",
          { limit: 30 },
        ));
        const items = parseHotListXml(xml);
        if (!items.length) throw new Error("Zhihu hot_list MCP returned no items");
        sharedRuntime.hotListCache = { fetchedAt: now, items };
        return items;
      } catch (error) {
        if (cached && now - cached.fetchedAt < HOT_LIST_STALE_MS) return cached.items;
        throw error;
      }
    })();
    sharedRuntime.hotListInFlight = pending;
    try {
      return (await pending).slice(0, limit);
    } finally {
      sharedRuntime.hotListInFlight = undefined;
    }
  }

  async searchZhihu(query: string, count = 8): Promise<ZhihuSearchItem[]> {
    const normalized = query.trim().slice(0, 100);
    if (normalized.length < 2) return [];
    const limit = Math.max(1, Math.min(10, count));
    const key = normalized.toLocaleLowerCase("zh-CN");
    const now = this.now();
    ensureSearchCacheLoaded();
    sharedRuntime.searchCache ??= new Map();
    sharedRuntime.searchInFlight ??= new Map();
    const cached = sharedRuntime.searchCache.get(key);
    if (cached && now - cached.fetchedAt < SEARCH_TTL_MS) {
      return cached.items.slice(0, limit);
    }
    const inFlight = sharedRuntime.searchInFlight.get(key);
    if (inFlight) return (await inFlight).slice(0, limit);

    const pending = (async () => {
      try {
        let items: ZhihuSearchItem[] = [];
        const primaryBlocked = (sharedRuntime.zhihuSearchBlockedUntil ?? 0) > Date.now();
        if (!primaryBlocked) {
          try {
            const xml = await scheduleDataApiRequest(() => this.callSseMcpTool(
              "/api/mcp/zhihu_search/v1",
              "zhihu_search",
              { query: normalized, count: limit },
            ));
            items = parseZhihuSearchXml(xml);
          } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("rate limit exceeded")) {
              sharedRuntime.zhihuSearchBlockedUntil = Date.now() + 10 * 60_000;
            } else if (!message.includes("fetch failed")) {
              throw error;
            }
          }
        }

        if (!items.length) throw new Error("Zhihu search MCP returned no items");
        sharedRuntime.searchCache!.set(key, { fetchedAt: Date.now(), items });
        persistSearchCache();
        return items;
      } catch (error) {
        if (cached && now - cached.fetchedAt < SEARCH_STALE_MS) return cached.items;
        const recent = [...sharedRuntime.searchCache!.values()]
          .filter((entry) => now - entry.fetchedAt < SEARCH_STALE_MS)
          .sort((left, right) => right.fetchedAt - left.fetchedAt)[0];
        if (recent) return recent.items;
        throw error;
      } finally {
        sharedRuntime.searchInFlight!.delete(key);
      }
    })();
    sharedRuntime.searchInFlight.set(key, pending);
    return (await pending).slice(0, limit);
  }

  async getQuestionAnswers(questionUrl: string, limit = 20): Promise<ZhihuAnswerSummary[]> {
    const payload = await this.getJson(
      "/api/v1/content/question_answers",
      { QuestionUrl: questionUrl, Offset: "0", Limit: String(limit) },
      questionAnswersEnvelopeSchema,
    );
    const data = this.requireSuccessData(payload.Code, payload.Message, payload.Data);
    return data.Items.map((item) => ({
      contentToken: item.ContentToken,
      url: item.Url,
      summary: item.Summary,
    }));
  }

  async askZhida(input: ZhidaRequest): Promise<ZhidaResult> {
    const payload = await this.postJson(
      "/v1/chat/completions",
      {
        model: input.model,
        messages: input.messages,
        stream: false,
      },
      zhidaCompletionSchema,
    );
    const choice = payload.choices[0];
    if (!choice) {
      throw new Error("Zhihu Zhida returned no choices");
    }
    return {
      model: payload.model,
      content: choice.message.content,
      ...(choice.message.reasoning_content
        ? { reasoningContent: choice.message.reasoning_content }
        : {}),
      finishReason: choice.finish_reason,
    };
  }

  async getUserContents(oauthAccessToken?: string): Promise<ZhihuContent[]> {
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

  async getUserFollowees(oauthAccessToken?: string): Promise<ZhihuFollowee[]> {
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

  async getUserCollections(oauthAccessToken?: string): Promise<ZhihuCollection[]> {
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

  async getUserFavlists(oauthAccessToken?: string): Promise<ZhihuFavlist[]> {
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

  async getUserFavlistContents(
    favlistUrlToken: string,
    oauthAccessToken?: string,
  ): Promise<ZhihuCollection[]> {
    if (!favlistUrlToken.trim()) throw new Error("Favlist URL token is required");
    const payload = await this.getJson(
      "/api/v1/user/favlist_contents",
      { FavlistUrlToken: favlistUrlToken, Limit: "20", Offset: "0" },
      favlistContentsEnvelopeSchema,
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

  private async callSseMcpTool(
    basePath: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const accessSecret = this.options.accessSecret?.trim();
    if (!accessSecret) throw new Error("ZHIHU_ACCESS_SECRET is required for Zhihu MCP requests");

    const controller = new AbortController();
    const headers = {
      authorization: `Bearer ${accessSecret}`,
      accept: "text/event-stream",
    };
    const sseResponse = await this.fetchWithRetry(new URL(`${basePath}/sse`, DATA_BASE_URL), {
      headers,
      signal: controller.signal,
    });
    if (!sseResponse.ok || !sseResponse.body) {
      throw new Error(`Zhihu MCP SSE failed with HTTP ${sseResponse.status}`);
    }

    let endpointResolve!: (value: string) => void;
    let endpointReject!: (reason?: unknown) => void;
    const endpointPromise = new Promise<string>((resolve, reject) => {
      endpointResolve = resolve;
      endpointReject = reject;
    });
    const waiters = new Map<number, { resolve: (value: Record<string, unknown>) => void; reject: (reason?: unknown) => void }>();
    const reader = sseResponse.body.getReader();
    const decoder = new TextDecoder();

    const handleBlock = (block: string) => {
      const lines = block.split(/\r?\n/);
      let event = "message";
      const data: string[] = [];
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      const payload = data.join("\n");
      if (!payload) return;
      if (event === "endpoint") {
        endpointResolve(payload);
        return;
      }
      if (event !== "message") return;
      try {
        const message = JSON.parse(payload) as Record<string, unknown>;
        const id = typeof message.id === "number" ? message.id : null;
        if (id === null) return;
        const waiter = waiters.get(id);
        if (!waiter) return;
        waiters.delete(id);
        if (message.error) waiter.reject(new Error(`Zhihu MCP error: ${JSON.stringify(message.error)}`));
        else waiter.resolve(message);
      } catch {
        // Ignore keep-alives or non-JSON SSE messages.
      }
    };

    const pump = (async () => {
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          while (true) {
            const index = buffer.search(/\r?\n\r?\n/);
            if (index < 0) break;
            const block = buffer.slice(0, index);
            const separator = buffer.slice(index).match(/^\r?\n\r?\n/)?.[0]?.length ?? 2;
            buffer = buffer.slice(index + separator);
            handleBlock(block);
          }
        }
        endpointReject(new Error("Zhihu MCP SSE closed before completion"));
      } catch (error) {
        if (!controller.signal.aborted) endpointReject(error);
      }
    })();

    const withTimeout = async <T>(promise: Promise<T>, label: string): Promise<T> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`${label} timed out`)), 12_000);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    const post = async (id: number, method: string, params?: Record<string, unknown>) => {
      const responsePromise = new Promise<Record<string, unknown>>((resolve, reject) => {
        waiters.set(id, { resolve, reject });
      });
      const endpoint = await withTimeout(endpointPromise, "Zhihu MCP endpoint");
      const response = await this.fetchWithRetry(new URL(endpoint, DATA_BASE_URL), {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessSecret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }),
      });
      if (!response.ok) {
        waiters.delete(id);
        throw new Error(`Zhihu MCP message failed with HTTP ${response.status}`);
      }
      return withTimeout(responsePromise, `Zhihu MCP ${method}`);
    };

    try {
      await post(1, "initialize", {
        protocolVersion: "2024-11-05",
        clientInfo: { name: "xieyao-meow", version: "1.0.0" },
        capabilities: {},
      });
      await post(2, "tools/list");
      const message = await post(3, "tools/call", { name: toolName, arguments: args });
      const result = message.result as { content?: Array<{ type?: string; text?: string }> } | undefined;
      const text = result?.content?.find((item) => item.type === "text" && typeof item.text === "string")?.text;
      if (!text) throw new Error("Zhihu MCP tool returned no text content");
      return text;
    } finally {
      controller.abort();
      await pump.catch(() => undefined);
      for (const waiter of waiters.values()) waiter.reject(new Error("Zhihu MCP session closed"));
      waiters.clear();
    }
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

    const response = await scheduleDataApiRequest(() => this.fetchWithRetry(url, {
      method: "GET",
      headers: this.createDataHeaders(oauthAccessToken),
    }));
    if (!response.ok) {
      throw new Error(`Zhihu API request failed with HTTP ${response.status}`);
    }
    return schema.parse(await response.json());
  }

  private async postJson<TSchema extends z.ZodType>(
    path: string,
    body: unknown,
    schema: TSchema,
  ): Promise<z.infer<TSchema>> {
    const response = await this.fetchWithRetry(new URL(path, DATA_BASE_URL), {
      method: "POST",
      headers: this.createDataHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Zhihu API request failed with HTTP ${response.status}`);
    }
    return schema.parse(await response.json());
  }

  private createDataHeaders(oauthAccessToken?: string): Headers {
    const accessSecret = this.options.accessSecret?.trim();
    if (!accessSecret) {
      throw new Error("ZHIHU_ACCESS_SECRET is required for Zhihu data API requests");
    }
    const headers = new Headers({
      authorization: `Bearer ${accessSecret}`,
      "content-type": "application/json",
      "x-request-timestamp": String(Math.floor(this.now() / 1000)),
    });
    if (oauthAccessToken) {
      headers.set("x-oauth-token", oauthAccessToken);
    }
    return headers;
  }

  private async fetchWithRetry(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const retry = this.options.retry ?? { attempts: 3, delayMs: 500 };
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
