import { NextResponse } from "next/server";

import { OAUTH_SESSION_COOKIE } from "@/lib/auth/request-session";
import { getOAuthSessionStore } from "@/lib/auth/runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${OAUTH_SESSION_COOKIE}=([^;]+)`));
  if (match?.[1]) getOAuthSessionStore().delete(decodeURIComponent(match[1]));

  const response = NextResponse.json({ status: "logged-out" });
  response.cookies.set(OAUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
