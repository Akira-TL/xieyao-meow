import { NextResponse } from "next/server";

import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import type { AnswerExperience } from "@/lib/experience";
import { getAnswerExperienceService } from "@/lib/experience/runtime";
import type { SocialAgent } from "@/lib/social";
import { getSocialCommunity } from "@/lib/social/runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let residentId = "";
  try {
    const body = (await request.json()) as { residentId?: unknown };
    if (typeof body.residentId === "string") residentId = body.residentId;
  } catch {
    // Invalid input is handled below as a missing resident.
  }

  const target = COMMUNITY_RESIDENTS.find((resident) => resident.id === residentId);
  if (!target) {
    return NextResponse.json({ error: "unknown resident" }, { status: 400 });
  }

  const identity = await getRequestOAuthIdentity();
  const production = process.env.NODE_ENV === "production";
  if (!identity && production) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  let experience: AnswerExperience;
  try {
    experience = await getAnswerExperienceService().create({
      cacheKey: identity ? `user:${identity.userId}` : "self-demo",
      oauthAccessToken: identity?.oauthAccessToken,
    });
  } catch (error) {
    console.error(
      "[community] experience runtime unavailable",
      error instanceof Error ? error.message : "unknown error",
    );
    if (production) {
      return NextResponse.json({ error: "zhihu experience unavailable" }, { status: 502 });
    }
    experience = DEMO_FALLBACK;
  }

  const actor: SocialAgent = {
    id: identity ? `user:${identity.userId}` : "self-demo",
    displayName: "本喵",
    composition: experience.composition,
    persona: experience.persona,
  };
  const community = getSocialCommunity();
  const event = community.interact(actor, target);

  return NextResponse.json(
    {
      event,
      feed: community.getFeed().slice(0, 20),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
