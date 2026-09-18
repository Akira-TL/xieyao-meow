import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getJourneyService } from "@/lib/journey/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    routeBias: z.string().trim().max(20).nullable().optional(),
  }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("collect_leaves") }),
  z.object({
    action: z.literal("buy_supply"),
    supplyId: z.enum(["dried_fish", "pocket_calendar", "luck_charm"]),
  }),
  z.object({
    action: z.literal("set_loadout"),
    primaryToolId: z.enum(["notebook", "magnifier", "old_camera", "clipboard"]).nullable(),
    smallItemId: z.enum(["dried_fish", "pocket_calendar", "luck_charm"]).nullable(),
  }),
  z.object({
    action: z.literal("insight_feedback"),
    journeyId: z.string().trim().min(1).max(100),
    response: z.enum(["CONFIRM_INTEREST", "CORRECT_INTEREST", "REDUCE_INTEREST"]),
  }),
  z.object({
    action: z.literal("event_seen"),
    eventId: z.string().trim().min(1).max(100),
  }),
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
  if (parsed.action === "start") {
    return json(await service.start(
      identity.userId,
      identity.oauthAccessToken,
      parsed.routeBias?.trim() || null,
    ));
  }
  if (parsed.action === "archive") {
    return json(await service.archive(identity.userId, identity.oauthAccessToken));
  }
  try {
    if (parsed.action === "collect_leaves") {
      return json(await service.collectHomeLeaves(identity.userId, identity.oauthAccessToken));
    }
    if (parsed.action === "buy_supply") {
      return json(await service.buySupply(
        identity.userId,
        identity.oauthAccessToken,
        parsed.supplyId,
      ));
    }
    if (parsed.action === "set_loadout") {
      return json(await service.setLoadout(
        identity.userId,
        identity.oauthAccessToken,
        {
          primaryToolId: parsed.primaryToolId,
          smallItemId: parsed.smallItemId,
        },
      ));
    }
    if (parsed.action === "event_seen") {
      const event = await service.markEventSeen(
        identity.userId,
        identity.oauthAccessToken,
        parsed.eventId,
      );
      return event ? json({ event }) : json({ error: "journey event not found" }, { status: 404 });
    }
    return json(await service.respondToInsight(
      identity.userId,
      identity.oauthAccessToken,
      parsed.journeyId,
      parsed.response,
    ));
  } catch (error) {
    const message = error instanceof Error ? error.message : "journey action failed";
    const status = parsed.action === "insight_feedback" || parsed.action === "event_seen" ? 404 : 409;
    return json({ error: message }, { status });
  }
}
