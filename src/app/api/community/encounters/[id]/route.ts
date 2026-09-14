import { NextResponse } from "next/server";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { toSharedEncounterView } from "@/lib/social/shared-encounter";
import { getSharedEncounterStore } from "@/lib/social/runtime";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getRequestOAuthIdentity();
  if (!identity) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const encounter = getSharedEncounterStore().getEncounterForUser(id, identity.userId);
  if (!encounter) {
    return NextResponse.json({ error: "encounter not found" }, { status: 404 });
  }

  return NextResponse.json(
    { encounter: toSharedEncounterView(encounter, identity.userId) },
    { headers: { "cache-control": "no-store" } },
  );
}
