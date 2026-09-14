import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getAccountStore } from "@/lib/auth/runtime";
import { getAnswerExperienceService } from "@/lib/experience/runtime";
import { SocialDialogueService, type SocialAgent } from "@/lib/social";
import {
  SharedEncounterService,
  toSharedEncounterView,
  type SharedEncounterProvenance,
} from "@/lib/social/shared-encounter";
import { getSharedEncounterStore } from "@/lib/social/runtime";
import { createZhihuGatewayFromEnv } from "@/lib/zhihu/env";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  otherUserId: z.string().trim().min(1).max(128).optional(),
});

function isCanonicalZhihuQuestion(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "zhihu.com" || parsed.hostname.endsWith(".zhihu.com")) &&
      parsed.pathname.includes("/question/")
    );
  } catch {
    return false;
  }
}

export async function GET() {
  const identity = await getRequestOAuthIdentity();
  if (!identity) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const encounter = getSharedEncounterStore().getLatestEncounterForUser(identity.userId);
  return NextResponse.json(
    { encounter: encounter ? toSharedEncounterView(encounter, identity.userId) : null },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const identity = await getRequestOAuthIdentity();
  if (!identity) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    const raw = await request.text();
    parsed = requestSchema.parse(raw.trim() ? JSON.parse(raw) : {});
  } catch {
    return NextResponse.json({ error: "invalid encounter request" }, { status: 400 });
  }

  const store = getSharedEncounterStore();
  const experience = await getAnswerExperienceService().create({
    cacheKey: `user:${identity.userId}`,
    oauthAccessToken: identity.oauthAccessToken,
  });
  if (!isCanonicalZhihuQuestion(experience.question.url)) {
    return NextResponse.json({ error: "no real Zhihu question is available" }, { status: 503 });
  }

  const profile = getAccountStore().getUserProfile(identity.userId);
  const actor: SocialAgent = {
    id: `user:${identity.userId}`,
    displayName: profile.catName,
    composition: experience.composition,
    persona: experience.persona,
  };
  store.savePersonaSnapshot(identity.userId, actor, experience.mode);

  const targetSnapshot = parsed.otherUserId
    ? store.getPersonaSnapshot(parsed.otherUserId)
    : store.findPersonaCandidate(identity.userId);
  if (!targetSnapshot || targetSnapshot.userId === identity.userId) {
    return NextResponse.json(
      { error: "another activated User Persona is required" },
      { status: 409 },
    );
  }

  const provenance: SharedEncounterProvenance = {
    contentSource: experience.mode === "live" ? "live" : "demo",
    knowledgeSource: experience.knowledge.source,
    fetchedAt: experience.generatedAt * 1000,
  };
  const topic = {
    title: experience.question.title,
    url: experience.question.url,
    summary: (experience.knowledge.synthesis || experience.question.summary).trim().slice(0, 1800),
  };

  try {
    const dialogue = new SocialDialogueService(createZhihuGatewayFromEnv());
    const encounter = await new SharedEncounterService(store, dialogue).create({
      requestUserId: identity.userId,
      otherUserId: targetSnapshot.userId,
      topic,
      provenance,
    });

    if (encounter.status !== "completed") {
      return NextResponse.json(
        { encounter: toSharedEncounterView(encounter, identity.userId) },
        { status: encounter.status === "pending" ? 202 : 503, headers: { "cache-control": "no-store" } },
      );
    }

    return NextResponse.json(
      { encounter: toSharedEncounterView(encounter, identity.userId) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[shared-encounter] failed to create encounter",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json({ error: "shared encounter unavailable" }, { status: 503 });
  }
}
