import { NextResponse } from "next/server";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getAccountStore } from "@/lib/auth/runtime";
import { buildComposition, buildPersona, type PlayerPersona, type ZhihuComposition } from "@/lib/persona";
import type { SocialAgent } from "@/lib/social";
import { getSharedEncounterStore } from "@/lib/social/runtime";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

function persistPersonaSnapshot(
  userId: string,
  composition: ZhihuComposition,
  persona: PlayerPersona,
  source: "live" | "fallback",
) {
  const profile = getAccountStore().getUserProfile(userId);
  const agent: SocialAgent = {
    id: `user:${userId}`,
    displayName: profile.catName,
    composition,
    persona,
  };
  return getSharedEncounterStore().savePersonaSnapshot(userId, agent, source);
}

export async function GET() {
  const identity = await getRequestOAuthIdentity();

  try {
    const profile = await createZhihuGatewayFromEnv().getUserProfile({
      oauthAccessToken: identity?.oauthAccessToken,
    });
    const composition = buildComposition(profile);
    const persona = buildPersona(composition);
    const snapshot = identity
      ? persistPersonaSnapshot(identity.userId, composition, persona, "live")
      : null;

    return NextResponse.json(
      {
        mode: "live" as const,
        generatedAt: Math.floor(Date.now() / 1000),
        composition,
        persona,
        personaVersion: snapshot?.version ?? null,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[persona] failed to build live persona; serving fallback",
      error instanceof Error ? error.message : "unknown error",
    );

    const snapshot = identity
      ? persistPersonaSnapshot(
          identity.userId,
          DEMO_FALLBACK.composition,
          DEMO_FALLBACK.persona,
          "fallback",
        )
      : null;

    return NextResponse.json(
      {
        mode: "fallback" as const,
        generatedAt: Math.floor(Date.now() / 1000),
        composition: DEMO_FALLBACK.composition,
        persona: DEMO_FALLBACK.persona,
        personaVersion: snapshot?.version ?? null,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
