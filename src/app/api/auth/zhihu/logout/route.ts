import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { OAUTH_SESSION_COOKIE } from "@/lib/auth/request-session";
import { getAccountStore } from "@/lib/auth/runtime";
import { ANONYMOUS_PROFILE_COOKIE } from "@/lib/profile/cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(OAUTH_SESSION_COOKIE)?.value;
  if (sessionId) getAccountStore().deleteSession(sessionId);

  const response = NextResponse.json(
    { status: "logged-out", clearClientState: true },
    {
      headers: {
        "cache-control": "no-store",
        "clear-site-data": "\"cache\", \"storage\"",
      },
    },
  );

  response.cookies.delete(OAUTH_SESSION_COOKIE);
  response.cookies.delete(ANONYMOUS_PROFILE_COOKIE);
  return response;
}
