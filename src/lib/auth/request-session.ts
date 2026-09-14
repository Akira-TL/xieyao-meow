import "server-only";

import { cookies } from "next/headers";

import { getAccountStore } from "./runtime";

export const OAUTH_SESSION_COOKIE = "xieyao_oauth_session";

export interface RequestOAuthIdentity {
  sessionId: string;
  userId: string;
  oauthAccessToken: string;
}

export async function getRequestOAuthIdentity(): Promise<RequestOAuthIdentity | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(OAUTH_SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = getAccountStore().getSession(sessionId);
  if (!session) return null;

  return {
    sessionId,
    userId: session.userId,
    oauthAccessToken: session.accessToken,
  };
}
