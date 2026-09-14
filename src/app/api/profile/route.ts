import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequestOAuthIdentity } from "@/lib/auth/request-session";
import {
  CAT_APPEARANCE_VARIANTS,
  CAT_NAME_MAX_LENGTH,
  isValidCatName,
  normalizeCatName,
  type CatProfilePatch,
} from "@/lib/profile";
import { getCatProfileStore } from "@/lib/profile/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PROFILE_COOKIE = "xieyao_profile_id";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const patchSchema = z.object({
  catName: z.string().transform(normalizeCatName).refine(isValidCatName, {
    message: `名字请控制在 1–${CAT_NAME_MAX_LENGTH} 个字`,
  }).optional(),
  appearanceId: z.enum(CAT_APPEARANCE_VARIANTS).nullable().optional(),
}).strict().refine((value) => value.catName !== undefined || value.appearanceId !== undefined, {
  message: "没有可更新的资料",
});

async function resolveSubject() {
  const identity = await getRequestOAuthIdentity();
  if (identity) return { subjectId: `oauth:${identity.sessionId}`, anonymousId: null };

  const cookieStore = await cookies();
  const existing = cookieStore.get(PROFILE_COOKIE)?.value?.trim();
  if (existing) return { subjectId: `anon:${existing}`, anonymousId: null };

  const anonymousId = randomUUID();
  return { subjectId: `anon:${anonymousId}`, anonymousId };
}

function withProfileCookie(response: NextResponse, anonymousId: string | null) {
  if (!anonymousId) return response;
  response.cookies.set(PROFILE_COOKIE, anonymousId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return response;
}

export async function GET() {
  const { subjectId, anonymousId } = await resolveSubject();
  const profile = getCatProfileStore().get(subjectId);
  return withProfileCookie(
    NextResponse.json({ profile }, { headers: { "cache-control": "no-store" } }),
    anonymousId,
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

  const { subjectId, anonymousId } = await resolveSubject();
  const profile = getCatProfileStore().update(subjectId, parsed.data as CatProfilePatch);
  return withProfileCookie(
    NextResponse.json({ profile }, { headers: { "cache-control": "no-store" } }),
    anonymousId,
  );
}
