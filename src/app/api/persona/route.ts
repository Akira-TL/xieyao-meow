import { NextResponse } from "next/server";

import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { buildComposition, buildPersona } from "@/lib/persona";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getRequestOAuthIdentity();

  try {
    const profile = await createZhihuGatewayFromEnv().getUserProfile({
      oauthAccessToken: identity?.oauthAccessToken,
    });
    const composition = buildComposition(profile);
    const persona = buildPersona(composition);

    return NextResponse.json(
      {
        mode: "live" as const,
        generatedAt: Math.floor(Date.now() / 1000),
        composition,
        persona,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[persona] failed to build live persona; serving fallback",
      error instanceof Error ? error.message : "unknown error",
    );

    return NextResponse.json(
      {
        mode: "fallback" as const,
        generatedAt: Math.floor(Date.now() / 1000),
        composition: DEMO_FALLBACK.composition,
        persona: DEMO_FALLBACK.persona,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
