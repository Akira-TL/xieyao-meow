import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import { getAccountStore } from "@/lib/auth/runtime";
import {
  CAT_APPEARANCE_VARIANTS,
  CAT_NAME_MAX_LENGTH,
  isValidCatName,
  normalizeCatName,
  type CatProfilePatch,
} from "@/lib/profile";
import {
  ANONYMOUS_PROFILE_COOKIE,
  ANONYMOUS_PROFILE_MAX_AGE_SECONDS,
} from "@/lib/profile/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  catName: z.string().transform(normalizeCatName).refine(isValidCatName, {
    message: `名字请控制在 1–${CAT_NAME_MAX_LENGTH} 个字`,
  }).optional(),
  appearanceId: z.enum(CAT_APPEARANCE_VARIANTS).nullable().optional(),
}).strict().refine((value) => value.catName !== undefined || value.appearanceId !== undefined, {
  message: "没有可更新的资料",
});

type ProfileOwner =
  | { kind: "user"; userId: string; anonymousId: null }
  | { kind: "anonymous"; userId: null; anonymousId: string; setCookie: boolean };

async function resolveOwner(): Promise<ProfileOwner> {
  const identity = await getRequestOAuthIdentity();
  if (identity) {
    return { kind: "user", userId: identity.userId, anonymousId: null };
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(ANONYMOUS_PROFILE_COOKIE)?.value?.trim();
  if (existing) {
    return { kind: "anonymous", userId: null, anonymousId: existing, setCookie: false };
  }

  return {
    kind: "anonymous",
    userId: null,
    anonymousId: randomUUID(),
    setCookie: true,
  };
}

function withAnonymousCookie(response: NextResponse, owner: ProfileOwner) {
  if (owner.kind !== "anonymous" || !owner.setCookie) return response;
  response.cookies.set(ANONYMOUS_PROFILE_COOKIE, owner.anonymousId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ANONYMOUS_PROFILE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}

export async function GET() {
  const owner = await resolveOwner();
  const store = getAccountStore();
  const profile = owner.kind === "user"
    ? store.getUserProfile(owner.userId)
    : store.getAnonymousProfile(owner.anonymousId);

  return withAnonymousCookie(
    NextResponse.json({ profile }, { headers: { "cache-control": "no-store" } }),
    owner,
  );
}

export async function PATCH(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "资料格式不对" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "资料格式不对" },
      { status: 400 },
    );
  }

  const owner = await resolveOwner();
  const store = getAccountStore();
  const patch = parsed.data as CatProfilePatch;
  const profile = owner.kind === "user"
    ? store.updateUserProfile(owner.userId, patch)
    : store.updateAnonymousProfile(owner.anonymousId, patch);

  return withAnonymousCookie(
    NextResponse.json({ profile }, { headers: { "cache-control": "no-store" } }),
    owner,
  );
}
