import { NextResponse } from "next/server";

import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { buildComposition, buildPersona } from "@/lib/persona";
import {
  SocialMatchService,
  buildRuleMatch,
  type SocialAgent,
  type SocialMatchInsight,
} from "@/lib/social";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

const MATCH_CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedMatch {
  expiresAt: number;
  insight: SocialMatchInsight;
  personaMode: "live" | "fallback";
}

const matchCache = new Map<string, CachedMatch>();

export async function POST(request: Request) {
  let residentId = "";
  try {
    const body = (await request.json()) as { residentId?: unknown };
    if (typeof body.residentId === "string") residentId = body.residentId;
  } catch {
    // Invalid input is handled below.
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
  const actorId = identity ? `user:${identity.userId}` : "self-demo";
  const cacheKey = `${actorId}::${residentId}`;
  const cached = matchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { ...cached.insight, personaMode: cached.personaMode, residentId },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const gateway = createZhihuGatewayFromEnv();
  let personaMode: "live" | "fallback" = "fallback";
  let actor: SocialAgent = {
    id: actorId,
    displayName: "本喵",
    composition: DEMO_FALLBACK.composition,
    persona: DEMO_FALLBACK.persona,
  };

  try {
    const profile = await gateway.getUserProfile({
      oauthAccessToken: identity?.oauthAccessToken,
    });
    const composition = buildComposition(profile);
    actor = {
      id: actorId,
      displayName: "本喵",
      composition,
      persona: buildPersona(composition),
    };
    personaMode = "live";
  } catch (error) {
    console.warn(
      "[community-match] live persona unavailable",
      error instanceof Error ? error.message : "unknown error",
    );
    if (production) {
      return NextResponse.json({ error: "zhihu persona unavailable" }, { status: 502 });
    }
  }

  const insight = personaMode === "live"
    ? await new SocialMatchService(gateway).create(actor, target)
    : buildRuleMatch(actor, target);

  matchCache.set(cacheKey, {
    expiresAt: Date.now() + MATCH_CACHE_TTL_MS,
    insight,
    personaMode,
  });

  return NextResponse.json(
    { ...insight, personaMode, residentId },
    { headers: { "cache-control": "no-store" } },
  );
}
