import { NextResponse } from "next/server";

import { OAUTH_SESSION_COOKIE } from "@/lib/auth/request-session";
import { getAccountStore } from "@/lib/auth/runtime";
import { ANONYMOUS_PROFILE_COOKIE } from "@/lib/profile/cookies";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

function externalUrl(request: Request, pathname: string): URL {
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const proto = forwardedProto || new URL(request.url).protocol.replace(":", "") || "https";

  if (host) return new URL(pathname, `${proto}://${host}`);
  return new URL(pathname, request.url);
}

function cookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function callbackReadyResponse() {
  return new NextResponse(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>谢邀喵 · 知乎 OAuth 回调</title><meta name="robots" content="noindex,nofollow"><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#fff;color:#151515;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}.card{max-width:560px;padding:32px;text-align:center}.mark{width:48px;height:48px;margin:0 auto 18px;border-radius:14px;display:grid;place-items:center;background:#1772f6;color:#fff;font-weight:800;font-size:24px}h1{margin:0;font-size:24px}p{margin:12px 0 0;color:#666;line-height:1.7}.status{margin-top:18px;font-size:13px;color:#1677ff}</style></head><body><main class="card"><div class="mark">喵</div><h1>谢邀喵 OAuth 回调地址已就绪</h1><p>该地址用于接收知乎 OAuth 授权结果。正常授权时，知乎会携带 authorization_code 返回此地址。</p><div class="status">HTTPS · PUBLIC CALLBACK · READY</div></main></body></html>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authorizationCode =
    url.searchParams.get("authorization_code")?.trim() ??
    url.searchParams.get("code")?.trim();
  const oauthError = url.searchParams.get("error")?.trim();

  if (!authorizationCode) {
    if (oauthError) {
      return NextResponse.redirect(externalUrl(request, "/hatch/consent?oauth=denied"));
    }
    return callbackReadyResponse();
  }

  try {
    const gateway = createZhihuGatewayFromEnv();
    const oauth = await gateway.exchangeAuthorizationCode(authorizationCode);
    const providerIdentity = await gateway.getOAuthUserIdentity(oauth.accessToken);
    const store = getAccountStore();
    const userId = store.resolveOrCreateOAuthUser("zhihu", providerIdentity.providerSubject);

    const anonymousId = cookieValue(request, ANONYMOUS_PROFILE_COOKIE);
    if (anonymousId) {
      const claim = store.claimAnonymousProfile(anonymousId, userId);
      if (claim === "conflict") {
        console.warn("[oauth] anonymous profile was already consumed by another user");
      }
    }

    const previousSessionId = cookieValue(request, OAUTH_SESSION_COOKIE);
    const session = store.createSession(userId, oauth.accessToken, oauth.expiresIn);
    if (previousSessionId && previousSessionId !== session.id) {
      store.deleteSession(previousSessionId);
    }

    const response = NextResponse.redirect(externalUrl(request, "/hatch/scanning?oauth=connected"));
    response.cookies.set(OAUTH_SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: oauth.expiresIn,
    });
    response.cookies.set(ANONYMOUS_PROFILE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error(
      "[oauth] authorization flow failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.redirect(externalUrl(request, "/hatch/consent?oauth=error"));
  }
}
