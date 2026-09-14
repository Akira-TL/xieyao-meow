import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getJourneyService } from "@/lib/journey/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    routeBias: z.string().trim().min(1).max(40).nullable().optional(),
  }),
  z.object({ action: z.literal("archive") }),
]);

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET() {
  const identity = await getRequestOAuthIdentity();
  if (!identity) return json({ error: "login required" }, { status: 401 });

  const projection = await getJourneyService().getProjection(
    identity.userId,
    identity.oauthAccessToken,
  );
  return json(projection);
}

export async function POST(request: Request) {
  const identity = await getRequestOAuthIdentity();
  if (!identity) return json({ error: "login required" }, { status: 401 });

  let parsed: z.infer<typeof actionSchema>;
  try {
    parsed = actionSchema.parse(await request.json());
  } catch {
    return json({ error: "invalid journey action" }, { status: 400 });
  }

  const service = getJourneyService();
  const projection = parsed.action === "start"
    ? await service.start(
        identity.userId,
        identity.oauthAccessToken,
        parsed.routeBias?.trim() || null,
      )
    : await service.archive(identity.userId, identity.oauthAccessToken);

  return json(projection);
}
