import { NextResponse } from "next/server";
import { z } from "zod";

import { COMMUNITY_RESIDENTS } from "@/data/community-residents";
import { DEMO_FALLBACK } from "@/data/demo-fallback";
import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { createDeepSeekFlashClientFromEnv } from "@/lib/narrative/deepseek";
import { buildComposition, buildPersona } from "@/lib/persona";
import {
  SocialDialogueService,
  type PersonaExperienceMemory,
  type SocialAgent,
} from "@/lib/social";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

const ACTOR_CACHE_TTL_MS = 5 * 60 * 1000;

const requestSchema = z.object({
  residentId: z.string().trim().min(1).max(64),
  topic: z.object({
    title: z.string().trim().min(1).max(240),
    url: z.string().trim().max(500).default(""),
    summary: z.string().trim().max(1200).default(""),
  }),
  history: z.array(z.object({
    speaker: z.enum(["self", "other"]),
    text: z.string().trim().min(1).max(220),
  })).max(8).default([]),
  memory: z.object({
    encounterCount: z.number().int().min(0).max(999).default(0),
    recentTopics: z.array(z.string().trim().min(1).max(100)).max(6).default([]),
    recentResidents: z.array(z.string().trim().min(1).max(64)).max(6).default([]),
    notes: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  }).default({ encounterCount: 0, recentTopics: [], recentResidents: [], notes: [] }),
});

interface CachedActor {
  expiresAt: number;
  actor: SocialAgent;
  personaMode: "live" | "fallback";
}

const actorCache = new Map<string, CachedActor>();

async function resolveActor(actorId: string, oauthAccessToken?: string): Promise<CachedActor> {
  const cached = actorCache.get(actorId);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const gateway = createZhihuGatewayFromEnv();
  let actor: SocialAgent = {
    id: actorId,
    displayName: "本喵",
    composition: DEMO_FALLBACK.composition,
    persona: DEMO_FALLBACK.persona,
  };
  let personaMode: "live" | "fallback" = "fallback";

  try {
    const profile = await gateway.getUserProfile({ oauthAccessToken });
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
      "[community-dialogue] live persona unavailable; using fallback persona",
      error instanceof Error ? error.message : "unknown error",
    );
  }

  const resolved = { expiresAt: Date.now() + ACTOR_CACHE_TTL_MS, actor, personaMode };
  actorCache.set(actorId, resolved);
  return resolved;
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid dialogue request" }, { status: 400 });
  }

  const target = COMMUNITY_RESIDENTS.find((resident) => resident.id === parsed.residentId);
  if (!target) {
    return NextResponse.json({ error: "unknown resident" }, { status: 400 });
  }

  const identity = await getRequestOAuthIdentity();
  const production = process.env.NODE_ENV === "production";
  if (!identity && production) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  const actorId = identity ? `user:${identity.userId}` : "self-demo";
  const { actor, personaMode } = await resolveActor(actorId, identity?.oauthAccessToken);
  if (production && personaMode !== "live") {
    return NextResponse.json({ error: "zhihu persona unavailable" }, { status: 502 });
  }
  let dialogueGateway = null;
  try {
    dialogueGateway = createDeepSeekFlashClientFromEnv();
  } catch {
    // A deterministic persona-aware fallback still returns one reply per speaker.
  }
  const memory: PersonaExperienceMemory = parsed.memory;
  const round = await new SocialDialogueService(dialogueGateway).nextRound({
    actor,
    target,
    topic: parsed.topic,
    history: parsed.history,
    memory,
  });

  return NextResponse.json(
    {
      round,
      personaMode,
      residentId: parsed.residentId,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
