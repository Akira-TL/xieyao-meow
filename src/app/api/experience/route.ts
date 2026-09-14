import { NextResponse } from "next/server";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import type { AnswerExperience } from "@/lib/experience";
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
  let experience: AnswerExperience = DEMO_FALLBACK;
  try {
    experience = await getAnswerExperienceService().create({
      cacheKey: identity ? `user:${identity.userId}` : "self-demo",
      oauthAccessToken: identity?.oauthAccessToken,
      forceRefresh,
    });
  } catch (error) {
    console.error(
      "[experience] runtime initialization failed; serving demo fallback",
      error instanceof Error ? error.message : "unknown error",
    );
  }

  return NextResponse.json(experience, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
