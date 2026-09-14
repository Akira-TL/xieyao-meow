import { NextResponse } from "next/server";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getJourneyService } from "@/lib/journey/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const identity = await getRequestOAuthIdentity();
  if (!identity) {
    return NextResponse.json(
      { error: "login required" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const atlas = await getJourneyService().getAtlas(identity.userId, identity.oauthAccessToken);
  return NextResponse.json(atlas, { headers: { "cache-control": "no-store" } });
}
