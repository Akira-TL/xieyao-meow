import { NextResponse } from "next/server";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getAnswerExperienceService } from "@/lib/experience/runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let forceRefresh = false;
  try {
    const body = (await request.json()) as { forceRefresh?: unknown };
    forceRefresh = process.env.NODE_ENV !== "production" && body.forceRefresh === true;
  } catch {
    // Empty or invalid JSON uses the cached/default path.
  }

  const identity = await getRequestOAuthIdentity();
  const production = process.env.NODE_ENV === "production";
  if (!identity && production) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  try {
    const experience = await getAnswerExperienceService().create({
      cacheKey: identity ? `user:${identity.userId}` : "self-demo",
      oauthAccessToken: identity?.oauthAccessToken,
      forceRefresh,
    });
    return NextResponse.json(experience, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error(
      "[experience] runtime initialization failed",
      error instanceof Error ? error.message : "unknown error",
    );
    if (production) {
      return NextResponse.json(
        { error: "zhihu experience unavailable" },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
    }
    return NextResponse.json(DEMO_FALLBACK, {
      headers: { "cache-control": "no-store" },
    });
  }
}
