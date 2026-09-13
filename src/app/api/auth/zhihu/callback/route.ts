import { NextResponse } from "next/server";

import { OAUTH_SESSION_COOKIE } from "@/lib/auth/request-session";
import { getOAuthSessionStore } from "@/lib/auth/runtime";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authorizationCode =
    url.searchParams.get("authorization_code")?.trim() ??
    url.searchParams.get("code")?.trim();
  if (!authorizationCode) {
    return NextResponse.json(
      { status: "invalid-callback", message: "缺少知乎 OAuth authorization_code。" },
      { status: 400 },
    );
  }

  try {
    const oauth = await createZhihuGatewayFromEnv().exchangeAuthorizationCode(authorizationCode);
    const session = getOAuthSessionStore().create(oauth.accessToken, oauth.expiresIn);
    const response = NextResponse.redirect(new URL("/hatch/scanning?oauth=connected", request.url));
    response.cookies.set(OAUTH_SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: oauth.expiresIn,
    });
    return response;
  } catch (error) {
    console.error(
      "[oauth] authorization code exchange failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.redirect(new URL("/hatch/consent?oauth=error", request.url));
  }
}
